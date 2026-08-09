from __future__ import annotations

import csv
import json
from pathlib import Path

from .outputs import write_csv, write_xlsx
from .strategy_b import STRATEGY_B_FULL_HEADERS, STRATEGY_B_PLAN_HEADERS


def _read_rows(path: Path) -> list[dict[str, str]]:
    if not path.exists() or path.stat().st_size == 0:
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def _replace_date_rows(
    path: Path,
    new_rows: list[dict[str, object]],
    headers: list[str],
    analysis_date: str,
    date_field: str,
) -> None:
    existing = [row for row in _read_rows(path) if row.get(date_field) != analysis_date]
    write_csv(path, [*existing, *new_rows], headers)


def write_strategy_b_outputs(
    outputs_dir: Path,
    ranked_rows: list[dict[str, object]],
    portfolio_plan: list[dict[str, object]],
    config: dict[str, object],
    analysis_date: str,
    snapshot_id: str,
    top_n: int = 20,
) -> dict[str, Path]:
    outputs_dir.mkdir(parents=True, exist_ok=True)
    top_rows = ranked_rows[:top_n]
    full_csv = outputs_dir / "full_pdc_scores.csv"
    history_csv = outputs_dir / "scoring_history.csv"
    top_xlsx = outputs_dir / "a_share_top20_b.xlsx"
    daily_watchlist = outputs_dir / "daily_watchlists" / f"watchlist_{analysis_date}.csv"
    watchlist_history = outputs_dir / "watchlist_history.csv"
    daily_plan = outputs_dir / "daily_research_plan.csv"
    plan_history = outputs_dir / "research_plan_history.csv"
    manifest = outputs_dir / "strategy_manifest.json"

    write_csv(full_csv, ranked_rows, STRATEGY_B_FULL_HEADERS)
    _replace_date_rows(history_csv, ranked_rows, STRATEGY_B_FULL_HEADERS, analysis_date, "analysis_date")
    write_xlsx(top_xlsx, top_rows, STRATEGY_B_FULL_HEADERS)
    write_csv(daily_watchlist, top_rows, STRATEGY_B_FULL_HEADERS)
    _replace_date_rows(watchlist_history, top_rows, STRATEGY_B_FULL_HEADERS, analysis_date, "analysis_date")
    write_csv(daily_plan, portfolio_plan, STRATEGY_B_PLAN_HEADERS)
    _replace_date_rows(plan_history, portfolio_plan, STRATEGY_B_PLAN_HEADERS, analysis_date, "signal_date")

    manifest_payload = {
        "strategyId": "B",
        "modelVersion": config["modelVersion"],
        "status": config["status"],
        "analysisDate": analysis_date,
        "snapshotId": snapshot_id,
        "topCount": len(top_rows),
        "portfolioPlanCount": len([row for row in portfolio_plan if float(row.get("target_weight_pct") or 0) > 0]),
        "zhugeMode": (config.get("zhugeOrion") or {}).get("mode"),
        "sectorCapStatus": (config.get("exposure") or {}).get("sectorCapStatus"),
        "config": config,
    }
    manifest.parent.mkdir(parents=True, exist_ok=True)
    with manifest.open("w", encoding="utf-8") as handle:
        json.dump(manifest_payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")

    return {
        "full_csv": full_csv,
        "history_csv": history_csv,
        "top_xlsx": top_xlsx,
        "daily_watchlist": daily_watchlist,
        "watchlist_history": watchlist_history,
        "daily_plan": daily_plan,
        "plan_history": plan_history,
        "manifest": manifest,
    }
