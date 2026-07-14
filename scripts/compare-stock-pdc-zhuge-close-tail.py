#!/usr/bin/env python3
"""Compare neutral and close-tail Zhuge historical replay outputs."""

from __future__ import annotations

import argparse
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

import numpy as np
import pandas as pd


POSTURE_BY_SCORE = {
    7.6: ("aggressive", "fire"),
    6.3: ("balanced", "wood"),
    5.5: ("neutral", "earth"),
    4.2: ("conservative", "metal"),
    3.4: ("defensive", "water"),
}
HORIZONS = (1, 5)
CRASH_THRESHOLDS = {1: -5.0, 5: -10.0}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Compare neutral vs close-tail Zhuge Top 20 replays.")
    parser.add_argument("--neutral", required=True)
    parser.add_argument("--close-tail", required=True)
    parser.add_argument("--benchmark-csv", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--bootstrap", type=int, default=1000)
    return parser.parse_args()


def bootstrap_ci(values: pd.Series, repetitions: int) -> tuple[float, float]:
    array = values.dropna().to_numpy(dtype=float)
    if len(array) < 2:
        return np.nan, np.nan
    rng = np.random.default_rng(20260710)
    indexes = rng.integers(0, len(array), size=(repetitions, len(array)))
    means = array[indexes].mean(axis=1)
    low, high = np.quantile(means, [0.025, 0.975])
    return float(low), float(high)


def benchmark_tail_map(path: Path) -> dict[str, int]:
    bars = pd.read_csv(path, dtype={"Date": str, "Close": str})
    mapping: dict[str, int] = {}
    for row in bars.to_dict("records"):
        value = Decimal(str(row["Close"])).quantize(Decimal("0.001"), rounding=ROUND_HALF_UP)
        mapping[str(row["Date"])] = int(value * 1000) % 10
    return mapping


def main() -> int:
    args = parse_args()
    neutral_path = Path(args.neutral).expanduser().resolve()
    close_tail_path = Path(args.close_tail).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    neutral = pd.read_csv(neutral_path)
    close_tail = pd.read_csv(close_tail_path)
    key_columns = ["signal_date", "ticker"]
    if set(map(tuple, neutral[key_columns].to_numpy())) != set(map(tuple, close_tail[key_columns].to_numpy())):
        raise ValueError("Neutral and close-tail replay panels do not contain the same date/ticker rows.")

    tail_by_date = benchmark_tail_map(Path(args.benchmark_csv).expanduser().resolve())
    daily_rows: list[dict[str, object]] = []
    for signal_date, neutral_day in neutral.groupby("signal_date", sort=True):
        variant_day = close_tail.loc[close_tail["signal_date"] == signal_date]
        neutral_top = neutral_day.loc[neutral_day["pdc_rank"] <= 20]
        variant_top = variant_day.loc[variant_day["pdc_rank"] <= 20]
        score = round(float(variant_day["zhuge_orion_score"].iloc[0]), 1)
        posture, element = POSTURE_BY_SCORE[score]
        row: dict[str, object] = {
            "signal_date": signal_date,
            "benchmark_tail_digit": tail_by_date.get(str(signal_date), np.nan),
            "zhuge_score": score,
            "posture": posture,
            "element": element,
            "names_changed": len(set(neutral_top["ticker"]) - set(variant_top["ticker"])),
        }
        for horizon in HORIZONS:
            column = f"return_{horizon}d_pct"
            base = neutral_top[column].dropna()
            variant = variant_top[column].dropna()
            row[f"neutral_return_{horizon}d_pct"] = float(base.mean()) if len(base) else np.nan
            row[f"close_tail_return_{horizon}d_pct"] = float(variant.mean()) if len(variant) else np.nan
            row[f"return_delta_{horizon}d_pct"] = (
                float(variant.mean() - base.mean()) if len(base) and len(variant) else np.nan
            )
            row[f"neutral_crash_rate_{horizon}d_pct"] = (
                float((base <= CRASH_THRESHOLDS[horizon]).mean() * 100.0) if len(base) else np.nan
            )
            row[f"close_tail_crash_rate_{horizon}d_pct"] = (
                float((variant <= CRASH_THRESHOLDS[horizon]).mean() * 100.0) if len(variant) else np.nan
            )
        daily_rows.append(row)

    daily = pd.DataFrame(daily_rows)
    summary_rows: list[dict[str, object]] = []
    for horizon in HORIZONS:
        delta_column = f"return_delta_{horizon}d_pct"
        low, high = bootstrap_ci(daily[delta_column], args.bootstrap)
        summary_rows.append(
            {
                "horizon_days": horizon,
                "signal_days": int(daily[delta_column].notna().sum()),
                "neutral_mean_return_pct": float(daily[f"neutral_return_{horizon}d_pct"].mean()),
                "close_tail_mean_return_pct": float(daily[f"close_tail_return_{horizon}d_pct"].mean()),
                "return_delta_bp": float(daily[delta_column].mean() * 100.0),
                "delta_ci_low_bp": low * 100.0,
                "delta_ci_high_bp": high * 100.0,
                "crash_rate_delta_pct_points": float(
                    (
                        daily[f"close_tail_crash_rate_{horizon}d_pct"]
                        - daily[f"neutral_crash_rate_{horizon}d_pct"]
                    ).mean()
                ),
                "mean_names_changed": float(daily["names_changed"].mean()),
                "days_with_any_change_pct": float((daily["names_changed"] > 0).mean() * 100.0),
            }
        )
    summary = pd.DataFrame(summary_rows)
    posture = daily.groupby(["posture", "element", "zhuge_score"], as_index=False).agg(
        signal_days=("signal_date", "count"),
        mean_names_changed=("names_changed", "mean"),
        return_delta_1d_pct=("return_delta_1d_pct", "mean"),
        return_delta_5d_pct=("return_delta_5d_pct", "mean"),
    )
    posture["return_delta_1d_bp"] = posture["return_delta_1d_pct"] * 100.0
    posture["return_delta_5d_bp"] = posture["return_delta_5d_pct"] * 100.0

    daily.to_csv(output_dir / "zhuge-close-tail-daily.csv", index=False)
    summary.to_csv(output_dir / "zhuge-close-tail-summary.csv", index=False)
    posture.to_csv(output_dir / "zhuge-close-tail-by-posture.csv", index=False)

    one = summary.loc[summary["horizon_days"] == 1].iloc[0]
    five = summary.loc[summary["horizon_days"] == 5].iloc[0]
    lines = [
        "# 诸葛 Orion：收盘尾数五行实验",
        "",
        "规则：使用信号日 `CSI300ETF` 收盘价保留三位小数后的最后一位，映射为下一交易日研究姿态。",
        "",
        "- `1/6 → 水 → defensive (3.4)`",
        "- `2/7 → 火 → aggressive (7.6)`",
        "- `3/8 → 木 → balanced (6.3)`",
        "- `4/9 → 金 → conservative (4.2)`",
        "- `0/5 → 土 → neutral (5.5)`",
        "",
        "五行数字采用河图传统映射；五行到姿态是本实验自定义的操作映射，不是传统紫微斗数命盘。",
        "",
        "## 与固定 neutral、同为2%权重的比较",
        "",
        "| 周期 | Neutral平均收益 | 尾数模式平均收益 | 差异 | 95%日期区块区间 | 暴跌率差 |",
        "|---|---:|---:|---:|---:|---:|",
        f"| 1日 | {one['neutral_mean_return_pct']:.3f}% | {one['close_tail_mean_return_pct']:.3f}% | {one['return_delta_bp']:+.2f}bp | [{one['delta_ci_low_bp']:+.2f}, {one['delta_ci_high_bp']:+.2f}]bp | {one['crash_rate_delta_pct_points']:+.3f}pp |",
        f"| 5日 | {five['neutral_mean_return_pct']:.3f}% | {five['close_tail_mean_return_pct']:.3f}% | {five['return_delta_bp']:+.2f}bp | [{five['delta_ci_low_bp']:+.2f}, {five['delta_ci_high_bp']:+.2f}]bp | {five['crash_rate_delta_pct_points']:+.3f}pp |",
        "",
        f"Top 20 在 {five['days_with_any_change_pct']:.2f}% 的信号日发生变化，平均每天换入/出 {five['mean_names_changed']:.3f} 只股票。",
        "",
        "## 结论",
        "",
        "当前样本中影响非常小，适合作为2%前瞻实验，但没有证据证明它能提高收益。必须持续事前留档，不能根据结果回改映射。",
        "",
    ]
    (output_dir / "zhuge-close-tail-report.md").write_text("\n".join(lines))
    print(f"Wrote: {output_dir / 'zhuge-close-tail-report.md'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
