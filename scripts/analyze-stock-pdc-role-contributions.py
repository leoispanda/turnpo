#!/usr/bin/env python3
"""Exploratory role-attribution analysis for Stock PDC historical replays.

The input must be a ``daily_replay_trades.csv`` produced with ``--top 30`` so
that counterfactual Top 20 membership can be recomputed after role ablation.
This script deliberately separates:

* predictive association (daily IC and tie-aware high-minus-low cohorts),
* independent association (date-fixed-effect multivariate regression), and
* portfolio selection contribution (weight-only and full-path ablation).

It is research-only and never connects to a broker or places orders.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd


ROLE_SPECS = [
    ("market_regime", "Market Regime Judge", "market_regime_score", 0.09),
    ("trend", "Trend Follower", "trend_score", 0.18),
    ("livermore", "Livermore Breakout Trader", "livermore_breakout_score", 0.17),
    ("volume_price", "Volume-Price Analyst", "volume_price_score", 0.14),
    ("candlestick", "Candlestick Pattern Analyst", "candlestick_score", 0.08),
    ("overheat", "Overheat Auditor", "overheat_score", 0.11),
    ("risk", "Risk Manager", "risk_score", 0.18),
    ("zhuge_orion", "Zhuge Orion", "zhuge_orion_score", 0.00),
    ("chair", "Final Portfolio Chair", "final_chair_score", 0.05),
]

ROLE_BY_KEY = {
    key: {"key": key, "label": label, "column": column, "weight": weight}
    for key, label, column, weight in ROLE_SPECS
}
PRIMITIVE_KEYS = [
    "market_regime",
    "trend",
    "livermore",
    "volume_price",
    "candlestick",
    "overheat",
    "risk",
    "zhuge_orion",
]
CAP_RULES = {
    "risk": ("risk_score", 3.5, 5.0),
    "overheat": ("overheat_score", 3.0, 6.2),
    "market_regime": ("market_regime_score", 3.5, 6.8),
    "candlestick": ("candlestick_score", 3.2, 6.4),
    "zhuge_orion": ("zhuge_orion_score", 3.5, 6.5),
}
REGRESSION_KEYS = ["trend", "livermore", "volume_price", "candlestick", "overheat", "risk"]
HORIZONS = (1, 5)
CRASH_THRESHOLDS = {1: -5.0, 5: -10.0}
PLAUSIBLE_RETURN_BOUNDS = {1: (-30.0, 30.0), 5: (-80.0, 100.0)}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Attribute Stock PDC role contributions from a full-pool replay.")
    parser.add_argument("--source", required=True, help="Path to top-30 daily_replay_trades.csv.")
    parser.add_argument("--output-dir", required=True, help="Directory for CSV, JSON, and Markdown outputs.")
    parser.add_argument("--benchmark-csv", default="", help="Optional CSI300ETF OHLCV CSV for market timing checks.")
    parser.add_argument("--bootstrap", type=int, default=1000, help="Date-block bootstrap repetitions.")
    parser.add_argument("--seed", type=int, default=20260710, help="Deterministic random seed.")
    return parser.parse_args()


def mean_ci(values: list[float] | np.ndarray, rng: np.random.Generator, repetitions: int) -> tuple[float, float, float]:
    array = np.asarray(values, dtype=float)
    array = array[np.isfinite(array)]
    if not len(array):
        return np.nan, np.nan, np.nan
    mean_value = float(array.mean())
    if len(array) < 2 or repetitions <= 0:
        return mean_value, np.nan, np.nan
    indexes = rng.integers(0, len(array), size=(repetitions, len(array)))
    boot = array[indexes].mean(axis=1)
    low, high = np.quantile(boot, [0.025, 0.975])
    return mean_value, float(low), float(high)


def spearman(x: pd.Series, y: pd.Series) -> float:
    valid = x.notna() & y.notna()
    if valid.sum() < 5 or x[valid].nunique() < 2 or y[valid].nunique() < 2:
        return np.nan
    return float(x[valid].rank(method="average").corr(y[valid].rank(method="average")))


def load_replay(source: Path) -> tuple[pd.DataFrame, dict[str, object]]:
    frame = pd.read_csv(source)
    required = {
        "signal_date",
        "ticker",
        "pdc_rank",
        "final_score",
        *[spec[2] for spec in ROLE_SPECS],
        *[f"return_{horizon}d_pct" for horizon in HORIZONS],
    }
    missing = sorted(required - set(frame.columns))
    if missing:
        raise ValueError(f"Replay is missing required columns: {', '.join(missing)}")

    frame["signal_date"] = pd.to_datetime(frame["signal_date"], errors="coerce")
    numeric_columns = [
        "pdc_rank",
        "final_score",
        *[spec[2] for spec in ROLE_SPECS],
        *[f"return_{horizon}d_pct" for horizon in HORIZONS],
    ]
    for column in numeric_columns:
        frame[column] = pd.to_numeric(frame[column], errors="coerce")

    input_rows = len(frame)
    invalid_dates = int(frame["signal_date"].isna().sum())
    duplicates = int(frame.duplicated(["signal_date", "ticker"]).sum())
    frame = frame.dropna(subset=["signal_date", "ticker", "pdc_rank"]).copy()
    frame = frame.sort_values(["signal_date", "pdc_rank", "ticker"]).drop_duplicates(
        ["signal_date", "ticker"], keep="last"
    )

    invalid_score_rows = pd.Series(False, index=frame.index)
    for _key, _label, column, _weight in ROLE_SPECS:
        invalid_score_rows |= frame[column].isna() | ~frame[column].between(1.0, 10.0)
    invalid_score_count = int(invalid_score_rows.sum())
    frame = frame.loc[~invalid_score_rows].copy()

    invalid_return_counts: dict[str, int] = {}
    for horizon in HORIZONS:
        column = f"return_{horizon}d_pct"
        lower, upper = PLAUSIBLE_RETURN_BOUNDS[horizon]
        invalid = frame[column].notna() & ~frame[column].between(lower, upper)
        invalid_return_counts[column] = int(invalid.sum())
        frame.loc[invalid, column] = np.nan

    frame["year"] = frame["signal_date"].dt.year
    frame["selected_top20"] = frame["pdc_rank"] <= 20
    date_sizes = frame.groupby("signal_date").size()
    if date_sizes.max() <= 20:
        raise ValueError(
            "Source contains only Top 20 rows. Re-run historical replay with --top 30 before role ablation."
        )

    quality = {
        "source": str(source),
        "input_rows": input_rows,
        "valid_rows": int(len(frame)),
        "signal_days": int(frame["signal_date"].nunique()),
        "first_signal_date": frame["signal_date"].min().date().isoformat(),
        "last_signal_date": frame["signal_date"].max().date().isoformat(),
        "min_rows_per_day": int(date_sizes.min()),
        "max_rows_per_day": int(date_sizes.max()),
        "days_with_more_than_20_rows": int((date_sizes > 20).sum()),
        "duplicate_date_ticker_rows": duplicates,
        "invalid_date_rows": invalid_dates,
        "invalid_score_rows": invalid_score_count,
        "invalid_return_counts": invalid_return_counts,
        "years_with_signals": sorted(int(value) for value in frame["year"].unique()),
    }
    return frame, quality


def load_benchmark(path: Path, signal_dates: pd.Series) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Benchmark CSV does not exist: {path}")
    bars = pd.read_csv(path)
    rename = {column.lower(): column for column in bars.columns}
    date_col = rename.get("date")
    open_col = rename.get("open")
    close_col = rename.get("close")
    if not date_col or not open_col or not close_col:
        raise ValueError(f"Benchmark CSV lacks Date/Open/Close columns: {path}")
    bars = bars[[date_col, open_col, close_col]].rename(
        columns={date_col: "date", open_col: "open", close_col: "close"}
    )
    bars["date"] = pd.to_datetime(bars["date"], errors="coerce")
    bars["open"] = pd.to_numeric(bars["open"], errors="coerce")
    bars["close"] = pd.to_numeric(bars["close"], errors="coerce")
    bars = bars.dropna().sort_values("date").reset_index(drop=True)
    index_by_date = {value: index for index, value in enumerate(bars["date"])}
    rows: list[dict[str, object]] = []
    for signal_date in sorted(pd.to_datetime(signal_dates.dropna().unique())):
        index = index_by_date.get(signal_date)
        row: dict[str, object] = {"signal_date": signal_date}
        for horizon in HORIZONS:
            entry_index = index + 1 if index is not None else -1
            exit_index = entry_index + horizon - 1
            value = np.nan
            if 0 <= entry_index < len(bars) and 0 <= exit_index < len(bars):
                entry_open = float(bars.iloc[entry_index]["open"])
                exit_close = float(bars.iloc[exit_index]["close"])
                if entry_open > 0 and exit_close > 0:
                    value = (exit_close / entry_open - 1.0) * 100.0
            row[f"benchmark_return_{horizon}d_pct"] = value
        rows.append(row)
    return pd.DataFrame(rows)


def role_discrimination(frame: pd.DataFrame) -> pd.DataFrame:
    rows: list[dict[str, object]] = []
    grouped = frame.groupby("signal_date", sort=True)
    weighted_dispersion: dict[str, float] = {}
    for key, label, column, weight in ROLE_SPECS:
        unique_by_day = grouped[column].nunique()
        std_by_day = grouped[column].std(ddof=0)
        weighted_dispersion[key] = float((std_by_day * weight).mean())
        rows.append(
            {
                "role_key": key,
                "role": label,
                "direct_weight_pct": weight * 100.0,
                "mean_unique_scores_per_day": float(unique_by_day.mean()),
                "constant_day_pct": float((unique_by_day <= 1).mean() * 100.0),
                "mean_within_day_std": float(std_by_day.mean()),
                "score_at_or_above_9_9_pct": float((frame[column] >= 9.9).mean() * 100.0),
                "direct_weighted_dispersion": weighted_dispersion[key],
            }
        )
    denominator = sum(weighted_dispersion.values())
    for row in rows:
        value = weighted_dispersion[str(row["role_key"])]
        row["direct_ranking_influence_share_pct"] = value / denominator * 100.0 if denominator else 0.0
    return pd.DataFrame(rows)


def baseline_metrics(frame: pd.DataFrame) -> pd.DataFrame:
    selected = frame.loc[frame["selected_top20"]]
    rows: list[dict[str, object]] = []
    for horizon in HORIZONS:
        return_column = f"return_{horizon}d_pct"
        values = selected[return_column].dropna()
        rows.append(
            {
                "horizon_days": horizon,
                "observations": int(len(values)),
                "signal_days": int(selected.groupby("signal_date")[return_column].mean().notna().sum()),
                "mean_return_pct": float(values.mean()),
                "win_rate_pct": float((values > 0).mean() * 100.0),
                "crash_threshold_pct": CRASH_THRESHOLDS[horizon],
                "crash_rate_pct": float((values <= CRASH_THRESHOLDS[horizon]).mean() * 100.0),
            }
        )
    return pd.DataFrame(rows)


def cohort_metrics(
    frame: pd.DataFrame,
    key: str,
    horizon: int,
    rng: np.random.Generator,
    repetitions: int,
) -> dict[str, object]:
    spec = ROLE_BY_KEY[key]
    score_column = str(spec["column"])
    return_column = f"return_{horizon}d_pct"
    daily_ic: list[float] = []
    daily_spread: list[tuple[pd.Timestamp, float]] = []
    high_rows: list[pd.DataFrame] = []
    low_rows: list[pd.DataFrame] = []

    for signal_date, group in frame.groupby("signal_date", sort=True):
        valid = group.dropna(subset=[score_column, return_column])
        ic = spearman(valid[score_column], valid[return_column])
        if np.isfinite(ic):
            daily_ic.append(ic)
        if len(valid) < 10 or valid[score_column].nunique() < 3:
            continue
        low_cut = valid[score_column].quantile(0.20)
        high_cut = valid[score_column].quantile(0.80)
        if not np.isfinite(low_cut) or not np.isfinite(high_cut) or high_cut <= low_cut:
            continue
        high = valid.loc[valid[score_column] >= high_cut]
        low = valid.loc[valid[score_column] <= low_cut]
        if high.empty or low.empty:
            continue
        spread = float(high[return_column].mean() - low[return_column].mean())
        daily_spread.append((signal_date, spread))
        high_rows.append(high)
        low_rows.append(low)

    high_frame = pd.concat(high_rows, ignore_index=True) if high_rows else pd.DataFrame(columns=frame.columns)
    low_frame = pd.concat(low_rows, ignore_index=True) if low_rows else pd.DataFrame(columns=frame.columns)
    spread_values = [value for _date, value in daily_spread]
    spread_mean, spread_low, spread_high = mean_ci(spread_values, rng, repetitions)
    ic_mean, ic_low, ic_high = mean_ci(daily_ic, rng, repetitions)
    yearly = pd.DataFrame(daily_spread, columns=["signal_date", "spread"])
    if not yearly.empty:
        yearly["year"] = yearly["signal_date"].dt.year
        yearly_means = yearly.groupby("year")["spread"].mean()
        positive_years = int((yearly_means > 0).sum())
        tested_years = int(len(yearly_means))
        recent = yearly.loc[yearly["year"] >= 2023, "spread"]
        recent_spread = float(recent.mean()) if len(recent) else np.nan
    else:
        positive_years = 0
        tested_years = 0
        recent_spread = np.nan

    crash_threshold = CRASH_THRESHOLDS[horizon]
    return {
        "role_key": key,
        "role": spec["label"],
        "horizon_days": horizon,
        "analysis_mode": "cross_sectional_pool",
        "ic_days": len(daily_ic),
        "mean_daily_spearman_ic": ic_mean,
        "ic_ci_low": ic_low,
        "ic_ci_high": ic_high,
        "ic_positive_day_pct": float(np.mean(np.asarray(daily_ic) > 0) * 100.0) if daily_ic else np.nan,
        "cohort_days": len(daily_spread),
        "high_minus_low_return_pct": spread_mean,
        "spread_ci_low_pct": spread_low,
        "spread_ci_high_pct": spread_high,
        "recent_2023_plus_spread_pct": recent_spread,
        "positive_years": positive_years,
        "tested_years": tested_years,
        "high_score_observations": int(len(high_frame)),
        "high_score_avg_return_pct": float(high_frame[return_column].mean()) if len(high_frame) else np.nan,
        "high_score_win_rate_pct": float((high_frame[return_column] > 0).mean() * 100.0) if len(high_frame) else np.nan,
        "high_score_crash_threshold_pct": crash_threshold,
        "high_score_crash_rate_pct": float((high_frame[return_column] <= crash_threshold).mean() * 100.0)
        if len(high_frame)
        else np.nan,
        "low_score_observations": int(len(low_frame)),
        "low_score_avg_return_pct": float(low_frame[return_column].mean()) if len(low_frame) else np.nan,
        "low_score_win_rate_pct": float((low_frame[return_column] > 0).mean() * 100.0) if len(low_frame) else np.nan,
        "low_score_crash_rate_pct": float((low_frame[return_column] <= crash_threshold).mean() * 100.0)
        if len(low_frame)
        else np.nan,
        "high_score_crash_reduction_vs_low_pct_points": float(
            (low_frame[return_column] <= crash_threshold).mean() * 100.0
            - (high_frame[return_column] <= crash_threshold).mean() * 100.0
        )
        if len(high_frame) and len(low_frame)
        else np.nan,
    }


def market_timing_metrics(
    frame: pd.DataFrame,
    benchmark: pd.DataFrame,
    horizon: int,
    rng: np.random.Generator,
    repetitions: int,
) -> dict[str, object]:
    return_column = f"return_{horizon}d_pct"
    selected = frame.loc[frame["selected_top20"]].copy()
    daily = selected.groupby("signal_date").agg(
        market_regime_score=("market_regime_score", "mean"),
        portfolio_return_pct=(return_column, "mean"),
    ).reset_index()
    if not benchmark.empty:
        daily = daily.merge(benchmark, on="signal_date", how="left")
    benchmark_column = f"benchmark_return_{horizon}d_pct"
    if benchmark_column in daily:
        daily["portfolio_excess_return_pct"] = daily["portfolio_return_pct"] - daily[benchmark_column]
    else:
        daily["portfolio_excess_return_pct"] = np.nan

    score = daily["market_regime_score"]
    raw_ic = spearman(score, daily["portfolio_return_pct"])
    excess_ic = spearman(score, daily["portfolio_excess_return_pct"])
    if score.nunique() >= 2:
        high = daily.loc[score == score.max(), "portfolio_return_pct"]
        low = daily.loc[score == score.min(), "portfolio_return_pct"]
        spread = float(high.mean() - low.mean()) if len(high) and len(low) else np.nan
    else:
        spread = np.nan
    return {
        "horizon_days": horizon,
        "signal_days": int(len(daily)),
        "unique_market_scores": int(score.nunique()),
        "market_score_vs_portfolio_spearman": raw_ic,
        "market_score_vs_excess_spearman": excess_ic,
        "high_minus_low_market_score_portfolio_return_pct": spread,
    }


def fixed_effect_regression(
    frame: pd.DataFrame,
    horizon: int,
    rng: np.random.Generator,
    repetitions: int,
) -> pd.DataFrame:
    return_column = f"return_{horizon}d_pct"
    blocks: dict[pd.Timestamp, tuple[np.ndarray, np.ndarray]] = {}
    for signal_date, group in frame.groupby("signal_date", sort=True):
        valid = group.dropna(subset=[return_column, *[ROLE_BY_KEY[key]["column"] for key in REGRESSION_KEYS]]).copy()
        if len(valid) < 10:
            continue
        matrices: list[np.ndarray] = []
        for key in REGRESSION_KEYS:
            values = valid[str(ROLE_BY_KEY[key]["column"])].to_numpy(dtype=float)
            std = values.std(ddof=0)
            matrices.append((values - values.mean()) / std if std > 1e-12 else np.zeros_like(values))
        x = np.column_stack(matrices)
        y_values = valid[return_column].to_numpy(dtype=float)
        y = y_values - y_values.mean()
        if np.any(np.isfinite(x)) and np.any(np.isfinite(y)):
            blocks[signal_date] = (x, y)

    if not blocks:
        return pd.DataFrame()
    dates = list(blocks)
    x = np.vstack([blocks[date][0] for date in dates])
    y = np.concatenate([blocks[date][1] for date in dates])
    beta, *_ = np.linalg.lstsq(x, y, rcond=None)
    fitted = x @ beta
    full_sse = float(np.sum((y - fitted) ** 2))
    sst = float(np.sum(y**2))

    partial_r2: dict[str, float] = {}
    for index, key in enumerate(REGRESSION_KEYS):
        reduced = np.delete(x, index, axis=1)
        reduced_beta, *_ = np.linalg.lstsq(reduced, y, rcond=None)
        reduced_sse = float(np.sum((y - reduced @ reduced_beta) ** 2))
        partial_r2[key] = max(0.0, (reduced_sse - full_sse) / sst * 100.0) if sst else np.nan

    bootstrap_betas: list[np.ndarray] = []
    for _iteration in range(repetitions):
        sampled_dates = rng.choice(dates, size=len(dates), replace=True)
        x_boot = np.vstack([blocks[date][0] for date in sampled_dates])
        y_boot = np.concatenate([blocks[date][1] for date in sampled_dates])
        beta_boot, *_ = np.linalg.lstsq(x_boot, y_boot, rcond=None)
        bootstrap_betas.append(beta_boot)
    boot = np.vstack(bootstrap_betas) if bootstrap_betas else np.empty((0, len(REGRESSION_KEYS)))

    rows: list[dict[str, object]] = []
    for index, key in enumerate(REGRESSION_KEYS):
        low, high = (np.nan, np.nan)
        if len(boot):
            low, high = np.quantile(boot[:, index], [0.025, 0.975])
        rows.append(
            {
                "role_key": key,
                "role": ROLE_BY_KEY[key]["label"],
                "horizon_days": horizon,
                "coefficient_pct_per_within_day_sd": float(beta[index]),
                "coefficient_bp_per_within_day_sd": float(beta[index] * 100.0),
                "coefficient_ci_low_bp": float(low * 100.0),
                "coefficient_ci_high_bp": float(high * 100.0),
                "partial_r2_drop_pct_points": partial_r2[key],
                "observations": int(len(y)),
                "signal_days": int(len(dates)),
            }
        )
    return pd.DataFrame(rows)


def recompute_chair(frame: pd.DataFrame, removed_key: str | None) -> np.ndarray:
    present_columns = [
        str(ROLE_BY_KEY[key]["column"])
        for key in PRIMITIVE_KEYS
        if key != removed_key
    ]
    raw = frame[present_columns].mean(axis=1).to_numpy(dtype=float)

    def values(key: str, default: float) -> np.ndarray:
        if key == removed_key:
            return np.full(len(frame), default, dtype=float)
        return frame[str(ROLE_BY_KEY[key]["column"])].to_numpy(dtype=float)

    trend = values("trend", 5.0)
    breakout = values("livermore", 5.0)
    volume = values("volume_price", 5.0)
    candle = values("candlestick", 5.0)
    overheat = values("overheat", 5.0)
    risk = values("risk", 5.0)
    market = values("market_regime", 5.0)
    zhuge = values("zhuge_orion", 5.5)

    raw += np.where((trend >= 7) & (breakout >= 7) & (risk >= 6) & (overheat >= 5), 0.8, 0.0)
    raw += np.where((volume >= 7) & (trend >= 7), 0.4, 0.0)
    raw += np.where((candle >= 7) & (trend >= 7), 0.3, 0.0)
    raw -= np.where((candle <= 3.5) & (trend >= 7), 0.7, 0.0)
    raw += np.where(market >= 7, 0.3, 0.0)
    raw -= np.where(market <= 4, 0.6, 0.0)
    raw -= np.where((overheat <= 4) & (trend >= 7), 0.8, 0.0)
    raw -= np.where(risk <= 4, 1.5, 0.0)
    raw -= np.where(zhuge <= 4.5, 0.5, 0.0)
    raw += np.where((zhuge >= 7.5) & (market >= 6) & (risk >= 6), 0.2, 0.0)
    raw -= np.where((trend <= 4) & (breakout <= 4), 0.8, 0.0)
    return np.round(np.clip(raw, 1.0, 10.0), 1)


def score_with_ablation(frame: pd.DataFrame, removed_key: str, full_path: bool) -> np.ndarray:
    active = {key: float(ROLE_BY_KEY[key]["weight"]) for key in ROLE_BY_KEY if key != removed_key}
    total_weight = sum(active.values())
    if total_weight <= 0:
        raise ValueError(f"No active weights after removing {removed_key}")
    active = {key: weight / total_weight for key, weight in active.items()}

    score = np.zeros(len(frame), dtype=float)
    for key, weight in active.items():
        if key == "chair" and full_path and removed_key in PRIMITIVE_KEYS:
            values = recompute_chair(frame, removed_key)
        else:
            values = frame[str(ROLE_BY_KEY[key]["column"])].to_numpy(dtype=float)
        score += values * weight

    for cap_key, (column, threshold, cap) in CAP_RULES.items():
        if full_path and cap_key == removed_key:
            continue
        values = frame[column].to_numpy(dtype=float)
        score = np.where(values <= threshold, np.minimum(score, cap), score)
    return np.round(score, 2)


def base_reconstructed_score(frame: pd.DataFrame) -> np.ndarray:
    score = np.zeros(len(frame), dtype=float)
    for key, _label, column, weight in ROLE_SPECS:
        score += frame[column].to_numpy(dtype=float) * weight
    for _key, (column, threshold, cap) in CAP_RULES.items():
        values = frame[column].to_numpy(dtype=float)
        score = np.where(values <= threshold, np.minimum(score, cap), score)
    return np.round(score, 2)


def ablation_metrics(
    frame: pd.DataFrame,
    horizon: int,
    full_path: bool,
    rng: np.random.Generator,
    repetitions: int,
) -> pd.DataFrame:
    return_column = f"return_{horizon}d_pct"
    crash_threshold = CRASH_THRESHOLDS[horizon]
    rows: list[dict[str, object]] = []

    for key, label, _column, weight in ROLE_SPECS:
        counterfactual_scores = score_with_ablation(frame, key, full_path)
        working = frame[["signal_date", "ticker", "pdc_rank", return_column]].copy()
        working["counterfactual_score"] = counterfactual_scores
        daily_differences: list[float] = []
        daily_crash_reduction: list[float] = []
        changed_names: list[int] = []
        usable_days = 0

        for _signal_date, group in working.groupby("signal_date", sort=True):
            if len(group) < 20:
                continue
            baseline = group.loc[group["pdc_rank"] <= 20]
            counterfactual = group.sort_values(
                ["counterfactual_score", "ticker"], ascending=[False, True], kind="stable"
            ).head(20)
            baseline_valid = baseline.dropna(subset=[return_column])
            counterfactual_valid = counterfactual.dropna(subset=[return_column])
            if len(baseline_valid) < 18 or len(counterfactual_valid) < 18:
                continue
            usable_days += 1
            base_return = float(baseline_valid[return_column].mean())
            no_role_return = float(counterfactual_valid[return_column].mean())
            daily_differences.append(base_return - no_role_return)
            base_crash = float((baseline_valid[return_column] <= crash_threshold).mean() * 100.0)
            no_role_crash = float((counterfactual_valid[return_column] <= crash_threshold).mean() * 100.0)
            daily_crash_reduction.append(no_role_crash - base_crash)
            baseline_tickers = set(baseline["ticker"])
            counterfactual_tickers = set(counterfactual["ticker"])
            changed_names.append(len(baseline_tickers - counterfactual_tickers))

        contribution, low, high = mean_ci(daily_differences, rng, repetitions)
        crash_reduction, crash_low, crash_high = mean_ci(daily_crash_reduction, rng, repetitions)
        rows.append(
            {
                "role_key": key,
                "role": label,
                "direct_weight_pct": weight * 100.0,
                "ablation_mode": "full_path" if full_path else "weight_only",
                "horizon_days": horizon,
                "usable_days": usable_days,
                "mean_return_contribution_pct": contribution,
                "mean_return_contribution_bp": contribution * 100.0 if np.isfinite(contribution) else np.nan,
                "contribution_ci_low_bp": low * 100.0 if np.isfinite(low) else np.nan,
                "contribution_ci_high_bp": high * 100.0 if np.isfinite(high) else np.nan,
                "mean_crash_rate_reduction_pct_points": crash_reduction,
                "crash_reduction_ci_low_pct_points": crash_low,
                "crash_reduction_ci_high_pct_points": crash_high,
                "mean_names_replaced_in_top20": float(np.mean(changed_names)) if changed_names else np.nan,
                "days_with_any_top20_change_pct": float(np.mean(np.asarray(changed_names) > 0) * 100.0)
                if changed_names
                else np.nan,
            }
        )
    return pd.DataFrame(rows)


def validate_reconstruction(frame: pd.DataFrame) -> dict[str, object]:
    reconstructed = base_reconstructed_score(frame)
    working = frame[["signal_date", "ticker", "pdc_rank", "final_score"]].copy()
    working["reconstructed_score"] = reconstructed
    exact_score_pct = float(np.mean(np.isclose(working["final_score"], reconstructed)) * 100.0)
    exact_membership_days = 0
    overlap_values: list[float] = []
    for _date, group in working.groupby("signal_date"):
        actual = set(group.loc[group["pdc_rank"] <= 20, "ticker"])
        rebuilt = set(
            group.sort_values(["reconstructed_score", "ticker"], ascending=[False, True], kind="stable")
            .head(20)["ticker"]
        )
        overlap_values.append(len(actual & rebuilt) / 20.0 * 100.0)
        if actual == rebuilt:
            exact_membership_days += 1
    return {
        "exact_stored_final_score_match_pct": exact_score_pct,
        "mean_top20_membership_overlap_pct": float(np.mean(overlap_values)),
        "exact_top20_membership_days": exact_membership_days,
        "signal_days": int(len(overlap_values)),
    }


def format_number(value: object, digits: int = 2) -> str:
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return "—"
    return "—" if not np.isfinite(numeric) else f"{numeric:.{digits}f}"


def build_report(
    quality: dict[str, object],
    validation: dict[str, object],
    baseline: pd.DataFrame,
    discrimination: pd.DataFrame,
    cohort: pd.DataFrame,
    regression: pd.DataFrame,
    ablation: pd.DataFrame,
    market_timing: pd.DataFrame,
) -> str:
    cohort_1d = cohort.loc[cohort["horizon_days"] == 1].set_index("role_key")
    cohort_5d = cohort.loc[cohort["horizon_days"] == 5].set_index("role_key")
    full_1d = ablation.loc[(ablation["ablation_mode"] == "full_path") & (ablation["horizon_days"] == 1)].set_index(
        "role_key"
    )
    full_5d = ablation.loc[(ablation["ablation_mode"] == "full_path") & (ablation["horizon_days"] == 5)].set_index(
        "role_key"
    )
    baseline_index = baseline.set_index("horizon_days")
    discrimination_index = discrimination.set_index("role_key")
    risk_tail = cohort_5d.loc["risk"]
    trend_signal = cohort_5d.loc["trend"]
    risk_ablation = full_5d.loc["risk"]
    trend_ablation = full_5d.loc["trend"]
    risk_overheat_share = (
        discrimination_index.loc["risk", "direct_ranking_influence_share_pct"]
        + discrimination_index.loc["overheat", "direct_ranking_influence_share_pct"]
    )
    market_5d = market_timing.loc[market_timing["horizon_days"] == 5].iloc[0]
    lines = [
        "# Stock PDC 角色贡献回溯（探索性）",
        "",
        f"- 样本：{quality['first_signal_date']} 至 {quality['last_signal_date']}，{quality['signal_days']} 个有效信号日，{quality['valid_rows']} 条完整 PDC 池记录。",
        f"- 每日池规模：{quality['min_rows_per_day']}–{quality['max_rows_per_day']}；其中 {quality['days_with_more_than_20_rows']} 天可用于 Top 20 重排消融。",
        "- 收益口径：信号日后下一根个股 K 线开盘买入，持有至第 1/5 根 K 线收盘。",
        "- 这是一版当前算法的历史模拟，不是因果证明，也不是交易指令。",
        "",
        "## 一眼结论",
        "",
        f"- 当前 Top 20 基线：1日平均 {format_number(baseline_index.loc[1, 'mean_return_pct'])}%、胜率 {format_number(baseline_index.loc[1, 'win_rate_pct'])}%；5日平均 {format_number(baseline_index.loc[5, 'mean_return_pct'])}%、胜率 {format_number(baseline_index.loc[5, 'win_rate_pct'])}%。",
        f"- 风险与过热两名防守角色合计贡献了约 {format_number(risk_overheat_share)}% 的实际日内排名波动，远高于配置表面权重所给人的直觉；系统目前明显偏防守。",
        f"- Trend 的5日方向信号为正（IC {format_number(trend_signal['mean_daily_spearman_ic'], 3)}；可分层日高低组差 {format_number(trend_signal['high_minus_low_return_pct'] * 100.0)}bp），但完整移除后 Top 20 反而提高 {format_number(-trend_ablation['mean_return_contribution_bp'])}bp，说明18%权重与鹰眼趋势过滤存在饱和或重复。",
        f"- Risk 高分组的5日暴跌率从低分组 {format_number(risk_tail['low_score_crash_rate_pct'])}% 降至 {format_number(risk_tail['high_score_crash_rate_pct'])}%，有明显尾部识别力；但当前完整路径平均牺牲 {format_number(-risk_ablation['mean_return_contribution_bp'])}bp 的5日收益。",
        f"- Market 分数在同一天对所有股票完全相同，不能帮助个股排序；它更像仓位/开关信号。高低市场分日的5日组合收益差约 {format_number(market_5d['high_minus_low_market_score_portfolio_return_pct'])} 个百分点。",
        "- Livermore、Volume-Price 的收益贡献区间跨过零；Candlestick 与 Final Chair 的独立增益很弱。现阶段不宜让这些结果自动改正式权重。",
        "",
        "## 角色总表",
        "",
        "| 角色 | 权重 | 日内影响占比 | 1日IC | 5日IC | 1日高低组差(bp) | 5日高低组差(bp) | 完整消融1日贡献(bp) | 完整消融5日贡献(bp) | 5日防暴跌贡献(pp) |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for key, label, _column, weight in ROLE_SPECS:
        drow = discrimination_index.loc[key]
        c1 = cohort_1d.loc[key]
        c5 = cohort_5d.loc[key]
        a1 = full_1d.loc[key]
        a5 = full_5d.loc[key]
        lines.append(
            "| "
            + " | ".join(
                [
                    label,
                    f"{weight * 100:.0f}%",
                    f"{format_number(drow['direct_ranking_influence_share_pct'])}%",
                    format_number(c1["mean_daily_spearman_ic"], 3),
                    format_number(c5["mean_daily_spearman_ic"], 3),
                    format_number(c1["high_minus_low_return_pct"] * 100.0),
                    format_number(c5["high_minus_low_return_pct"] * 100.0),
                    format_number(a1["mean_return_contribution_bp"]),
                    format_number(a5["mean_return_contribution_bp"]),
                    format_number(a5["mean_crash_rate_reduction_pct_points"]),
                ]
            )
            + " |"
        )

    lines.extend(
        [
            "",
            "说明：高低组差与 IC 是预测关联；消融贡献是完整委员会收益减去移除该角色后的 Top 20 收益。正数表示该角色历史上增加收益；防暴跌贡献正数表示移除该角色后暴跌率更高。",
            "",
            "## 控制其他基础角色后的独立关联",
            "",
            "Final Chair 是其他分数的派生集成层，Market/Zhuge 是日期级常数，三者未与基础角色一起做横截面回归。",
            "",
            "| 角色 | 周期 | 每提高1个日内标准差的收益变化(bp) | 95%日期区块区间(bp) | 独立解释度下降(pp) |",
            "|---|---:|---:|---:|---:|",
        ]
    )
    for row in regression.to_dict("records"):
        lines.append(
            f"| {row['role']} | {row['horizon_days']}日 | {format_number(row['coefficient_bp_per_within_day_sd'])} | "
            f"[{format_number(row['coefficient_ci_low_bp'])}, {format_number(row['coefficient_ci_high_bp'])}] | "
            f"{format_number(row['partial_r2_drop_pct_points'], 4)} |"
        )

    lines.extend(
        [
            "",
            "## 5日高分组的盈利与尾部",
            "",
            "| 角色 | 可分层天数 | 高分组平均收益 | 高分组胜率 | 高分组≤-10% | 低分组≤-10% | 高分防暴跌差(pp) |",
            "|---|---:|---:|---:|---:|---:|---:|",
        ]
    )
    for key, label, _column, _weight in ROLE_SPECS:
        row = cohort_5d.loc[key]
        if not int(row["cohort_days"]):
            continue
        lines.append(
            f"| {label} | {int(row['cohort_days'])} | {format_number(row['high_score_avg_return_pct'])}% | "
            f"{format_number(row['high_score_win_rate_pct'])}% | {format_number(row['high_score_crash_rate_pct'])}% | "
            f"{format_number(row['low_score_crash_rate_pct'])}% | "
            f"{format_number(row['high_score_crash_reduction_vs_low_pct_points'])} |"
        )

    lines.extend(
        [
            "",
            "## Market Regime 择时检查",
            "",
            "| 周期 | 市场分种类 | 与Top20收益相关 | 与沪深300ETF超额收益相关 | 高低市场分收益差(pp) |",
            "|---|---:|---:|---:|---:|",
        ]
    )
    for row in market_timing.to_dict("records"):
        lines.append(
            f"| {row['horizon_days']}日 | {row['unique_market_scores']} | "
            f"{format_number(row['market_score_vs_portfolio_spearman'], 3)} | "
            f"{format_number(row['market_score_vs_excess_spearman'], 3)} | "
            f"{format_number(row['high_minus_low_market_score_portfolio_return_pct'])} |"
        )

    lines.extend(
        [
            "",
            "## 结构与数据限制",
            "",
            "- 历史股票池只有当前存续的大市值股票，并用 2026 年市值回放过去，存在幸存者偏差和市值前视；结果只能用于诊断，不能直接据此自动改权重。",
            "- 只有鹰眼雷达与选择闸门开启的强趋势日期进入样本；2022 年没有有效信号，Trend 在很多日期接近满分，区分度会被压缩。",
            "- Market Regime 同日所有股票同分，只能评价择时；Zhuge 历史恒为 5.5，无法估计真实姿态变化的贡献。",
            "- Final Chair 由其他角色均值和交互规则生成，不能把它与基础角色的普通回归系数相加。",
            "- 完整路径消融会移除直接权重、该角色对 Chair 的输入及对应 final-score 封顶；角色之间有交互，贡献值不会相加。",
            "- 回放使用个股自己的下一根 K 线，停牌时并非统一市场次日；也没有完整建模涨停无法买入和交易成本。",
            "",
            "## 复现校验",
            "",
            f"- 存储总分精确复原率：{format_number(validation['exact_stored_final_score_match_pct'])}%（剩余差异为未导出的内部小数）。",
            f"- Top 20 成员平均重合率：{format_number(validation['mean_top20_membership_overlap_pct'])}%；完全一致 {validation['exact_top20_membership_days']}/{validation['signal_days']} 天。",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    args = parse_args()
    source = Path(args.source).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(args.seed)

    frame, quality = load_replay(source)
    benchmark_path = Path(args.benchmark_csv).expanduser().resolve() if args.benchmark_csv else None
    benchmark = load_benchmark(benchmark_path, frame["signal_date"]) if benchmark_path else pd.DataFrame()
    validation = validate_reconstruction(frame)
    baseline = baseline_metrics(frame)
    discrimination = role_discrimination(frame)

    cohort_rows: list[dict[str, object]] = []
    for key in ROLE_BY_KEY:
        for horizon in HORIZONS:
            cohort_rows.append(cohort_metrics(frame, key, horizon, rng, args.bootstrap))
    cohort = pd.DataFrame(cohort_rows)

    regression = pd.concat(
        [fixed_effect_regression(frame, horizon, rng, args.bootstrap) for horizon in HORIZONS],
        ignore_index=True,
    )
    ablation = pd.concat(
        [
            ablation_metrics(frame, horizon, full_path, rng, args.bootstrap)
            for full_path in (False, True)
            for horizon in HORIZONS
        ],
        ignore_index=True,
    )
    market_timing = pd.DataFrame(
        [market_timing_metrics(frame, benchmark, horizon, rng, args.bootstrap) for horizon in HORIZONS]
    )

    baseline.to_csv(output_dir / "baseline-top20.csv", index=False)
    discrimination.to_csv(output_dir / "role-discrimination.csv", index=False)
    cohort.to_csv(output_dir / "role-predictive-metrics.csv", index=False)
    regression.to_csv(output_dir / "role-independent-association.csv", index=False)
    ablation.to_csv(output_dir / "role-ablation.csv", index=False)
    market_timing.to_csv(output_dir / "market-timing.csv", index=False)
    metadata = {
        "quality": quality,
        "validation": validation,
        "weights": {key: ROLE_BY_KEY[key]["weight"] for key in ROLE_BY_KEY},
        "bootstrap_repetitions": args.bootstrap,
        "seed": args.seed,
        "benchmark_csv": str(benchmark_path) if benchmark_path else "",
        "interpretation": "Exploratory historical association and structural ablation; not causal and not a trading instruction.",
    }
    (output_dir / "analysis-metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n")
    report = build_report(quality, validation, baseline, discrimination, cohort, regression, ablation, market_timing)
    (output_dir / "role-contribution-report.md").write_text(report + "\n")

    print(f"Source rows: {quality['valid_rows']}")
    print(f"Signal days: {quality['signal_days']}")
    print(f"Top20 reconstruction overlap: {validation['mean_top20_membership_overlap_pct']:.2f}%")
    print(f"Wrote: {output_dir / 'role-contribution-report.md'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
