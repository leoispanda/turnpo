#!/usr/bin/env python3
"""Run a low-weight Zhuge Orion posture/weight scenario experiment.

The experiment funds Zhuge's 0-5% direct weight by reducing the derived Final
Chair's 5% weight. All other role weights remain unchanged. Each posture is
held constant across history; this tests mechanics, not the validity of Zhouyi.
"""

from __future__ import annotations

import argparse
import importlib.util
from pathlib import Path

import numpy as np
import pandas as pd


POSTURES = {
    "aggressive": 7.6,
    "balanced": 6.3,
    "neutral": 5.5,
    "conservative": 4.2,
    "defensive": 3.4,
}
WEIGHTS = (0.00, 0.01, 0.02, 0.03, 0.05)
HORIZONS = (1, 5)
CRASH_THRESHOLDS = {1: -5.0, 5: -10.0}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Test low Zhuge weights across all posture states.")
    parser.add_argument("--source", required=True, help="Top-30 daily_replay_trades.csv.")
    parser.add_argument("--output-dir", required=True)
    return parser.parse_args()


def load_attribution_module(script_dir: Path):
    path = script_dir / "analyze-stock-pdc-role-contributions.py"
    spec = importlib.util.spec_from_file_location("stock_pdc_role_attribution", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load attribution module: {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def scenario_scores(frame: pd.DataFrame, module, posture: str, zhuge_weight: float) -> np.ndarray:
    if zhuge_weight < 0 or zhuge_weight > 0.05:
        raise ValueError("Zhuge weight must be between 0% and the Chair's 5% weight.")
    working = frame.copy()
    working["zhuge_orion_score"] = POSTURES[posture]
    working["final_chair_score"] = module.recompute_chair(working, removed_key=None)

    active_weights = {
        key: float(module.ROLE_BY_KEY[key]["weight"])
        for key in module.ROLE_BY_KEY
    }
    active_weights["zhuge_orion"] = zhuge_weight
    active_weights["chair"] = 0.05 - zhuge_weight
    score = np.zeros(len(working), dtype=float)
    for key, weight in active_weights.items():
        column = str(module.ROLE_BY_KEY[key]["column"])
        score += working[column].to_numpy(dtype=float) * weight
    for _key, (column, threshold, cap) in module.CAP_RULES.items():
        values = working[column].to_numpy(dtype=float)
        score = np.where(values <= threshold, np.minimum(score, cap), score)
    return np.round(score, 2)


def selected_by_day(frame: pd.DataFrame, score: np.ndarray) -> dict[pd.Timestamp, pd.DataFrame]:
    working = frame[["signal_date", "ticker", "pdc_rank", *[f"return_{h}d_pct" for h in HORIZONS]]].copy()
    working["scenario_score"] = score
    selected: dict[pd.Timestamp, pd.DataFrame] = {}
    for signal_date, group in working.groupby("signal_date", sort=True):
        selected[signal_date] = group.sort_values(
            ["scenario_score", "ticker"], ascending=[False, True], kind="stable"
        ).head(20)
    return selected


def aggregate_scenario(
    frame: pd.DataFrame,
    selected: dict[pd.Timestamp, pd.DataFrame],
    baseline: dict[pd.Timestamp, pd.DataFrame],
    posture: str,
    weight: float,
) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for horizon in HORIZONS:
        column = f"return_{horizon}d_pct"
        daily_returns: list[float] = []
        baseline_daily_returns: list[float] = []
        all_returns: list[float] = []
        changed_names: list[int] = []
        for signal_date, group in selected.items():
            base = baseline[signal_date]
            valid = group[column].dropna()
            base_valid = base[column].dropna()
            if len(valid) < 18 or len(base_valid) < 18:
                continue
            daily_returns.append(float(valid.mean()))
            baseline_daily_returns.append(float(base_valid.mean()))
            all_returns.extend(float(value) for value in valid)
            changed_names.append(len(set(base["ticker"]) - set(group["ticker"])))
        values = np.asarray(all_returns, dtype=float)
        daily = np.asarray(daily_returns, dtype=float)
        base_daily = np.asarray(baseline_daily_returns, dtype=float)
        rows.append(
            {
                "posture": posture,
                "zhuge_score": POSTURES[posture],
                "zhuge_weight_pct": weight * 100.0,
                "chair_weight_pct": (0.05 - weight) * 100.0,
                "horizon_days": horizon,
                "signal_days": len(daily),
                "mean_return_pct": float(daily.mean()) if len(daily) else np.nan,
                "return_delta_vs_current_bp": float((daily - base_daily).mean() * 100.0) if len(daily) else np.nan,
                "win_rate_pct": float((values > 0).mean() * 100.0) if len(values) else np.nan,
                "crash_rate_pct": float((values <= CRASH_THRESHOLDS[horizon]).mean() * 100.0)
                if len(values)
                else np.nan,
                "mean_names_changed_vs_current_top20": float(np.mean(changed_names)) if changed_names else np.nan,
                "days_with_any_change_pct": float(np.mean(np.asarray(changed_names) > 0) * 100.0)
                if changed_names
                else np.nan,
            }
        )
    return rows


def build_report(results: pd.DataFrame, validation_overlap: float, source: Path) -> str:
    five_day = results.loc[results["horizon_days"] == 5].copy()
    two_percent = five_day.loc[five_day["zhuge_weight_pct"] == 2.0]
    lines = [
        "# 诸葛 Orion 低权重机械实验",
        "",
        f"- 来源：`{source}`",
        "- 权重资金来源：从 Final Chair 的 5% 中划转给 Zhuge；其他角色权重不变。",
        "- 五种姿态在整个历史区间内分别固定。该实验只测试系统机械反应，不验证周易预测力。",
        f"- 0% + neutral 对当前 Top 20 的复原重合率：{validation_overlap:.2f}% 。",
        "",
        "## 2% 权重的5日结果",
        "",
        "| 姿态 | 诸葛分 | 5日平均收益 | 相对当前 | 胜率 | ≤-10%暴跌率 | 平均换入/出股票 | 有换榜的日期 |",
        "|---|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for row in two_percent.to_dict("records"):
        lines.append(
            f"| {row['posture']} | {row['zhuge_score']:.1f} | {row['mean_return_pct']:.3f}% | "
            f"{row['return_delta_vs_current_bp']:+.2f}bp | {row['win_rate_pct']:.2f}% | "
            f"{row['crash_rate_pct']:.2f}% | {row['mean_names_changed_vs_current_top20']:.3f} | "
            f"{row['days_with_any_change_pct']:.2f}% |"
        )

    lines.extend(
        [
            "",
            "## 解释",
            "",
            "- Zhuge 姿态是同一天所有股票共享的日期级变量，直接权重本身几乎不能区分个股；主要变化来自 Chair 交互与 defensive 封顶。",
            "- 真正的周易实验必须从实验开始日起，逐日或逐周在看行情前生成 posture 并锁定留档；事后补历史卦象会产生前视偏差。",
            "- 建议把 Zhuge 主要用于组合仓位与节奏，而不是作为个股 alpha。2% 可作为不压过市场、风险与过热否决的实验上限。",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    args = parse_args()
    script_dir = Path(__file__).resolve().parent
    module = load_attribution_module(script_dir)
    source = Path(args.source).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    frame, _quality = module.load_replay(source)

    current_score = module.base_reconstructed_score(frame)
    baseline = selected_by_day(frame, current_score)
    actual_overlap: list[float] = []
    for signal_date, group in baseline.items():
        actual = set(frame.loc[(frame["signal_date"] == signal_date) & frame["selected_top20"], "ticker"])
        actual_overlap.append(len(actual & set(group["ticker"])) / 20.0 * 100.0)

    rows: list[dict[str, object]] = []
    for posture in POSTURES:
        for weight in WEIGHTS:
            score = scenario_scores(frame, module, posture, weight)
            selected = selected_by_day(frame, score)
            rows.extend(aggregate_scenario(frame, selected, baseline, posture, weight))
    results = pd.DataFrame(rows)
    results.to_csv(output_dir / "zhuge-weight-scenarios.csv", index=False)
    report = build_report(results, float(np.mean(actual_overlap)), source)
    (output_dir / "zhuge-weight-experiment.md").write_text(report + "\n")
    print(f"Wrote: {output_dir / 'zhuge-weight-experiment.md'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
