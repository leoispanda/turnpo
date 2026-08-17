"""Local deterministic adapters for the nine-stage Stock PDC pipeline.

The state engine owns attempts and checkpoints; this module owns the work done
inside an attempt.  It deliberately calls the existing local Stock PDC Core
only.  Provider-backed model calls can be added behind the same stage boundary
later without changing Run/Attempt/Checkpoint semantics.
"""

from __future__ import annotations

import csv
import hashlib
import json
from dataclasses import asdict
from datetime import date
from pathlib import Path
from statistics import mean
from typing import Any

from ..config import DEFAULT_WEIGHTS, pdc_weights_with_zhuge
from ..data_loader import load_universe
from ..hawkeye_radar import HawkeyeMetadata, result_to_row, screen_universe
from ..market_context import build_market_context
from ..models import Bar
from ..pdc_orchestrator import full_score_row, run_all_skills
from .pipeline import PipelineError, PipelineStore, file_hash


PROJECT_ROOT = Path(__file__).resolve().parents[2]
EXECUTION_MODE = "LOCAL_DETERMINISTIC_CORE"
STAGE_EXECUTION_SCHEMA = "pdc-local-stage-execution-v1"
DEFAULT_TOP_N = 20


def _hash_json(value: object) -> str:
    encoded = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _project_path(value: object, label: str, *, must_exist: bool = True) -> Path:
    if not isinstance(value, str) or not value.strip():
        raise PipelineError(f"{label} 必须是项目内路径")
    raw = Path(value)
    path = raw if raw.is_absolute() else PROJECT_ROOT / raw
    resolved = path.resolve()
    try:
        resolved.relative_to(PROJECT_ROOT.resolve())
    except ValueError as exc:
        raise PipelineError(f"{label} 必须位于本地 PDC 工程目录内") from exc
    if must_exist and not resolved.exists():
        raise PipelineError(f"{label} 不存在：{resolved}")
    return resolved


def _default_data_dir() -> Path:
    candidates = [
        PROJECT_ROOT / "data/prices",
        PROJECT_ROOT / "data_a_share_latest_runs/run_20260809_171554",
    ]
    return next((candidate for candidate in candidates if candidate.exists()), candidates[-1])


def _default_metadata_csv() -> Path:
    candidates = [
        PROJECT_ROOT / "outputs_a_share/a_share_universe.csv",
        PROJECT_ROOT / "outputs_a_share_latest_runs/run_20260809_171554/a_share_universe.csv",
    ]
    return next((candidate for candidate in candidates if candidate.exists()), candidates[-1])


def _run_config(store: PipelineStore, run_id: str, override: dict[str, Any] | None = None) -> dict[str, Any]:
    run = store.load_run(run_id)
    metadata = run.get("metadata") if isinstance(run.get("metadata"), dict) else {}
    stored = metadata.get("executionConfig") if isinstance(metadata.get("executionConfig"), dict) else {}
    incoming = override if isinstance(override, dict) else {}
    data_dir = incoming.get("dataDir", stored.get("dataDir", str(_default_data_dir().relative_to(PROJECT_ROOT))))
    metadata_csv = incoming.get("metadataCsv", stored.get("metadataCsv", str(_default_metadata_csv().relative_to(PROJECT_ROOT))))
    try:
        top_n = int(incoming.get("topN", stored.get("topN", DEFAULT_TOP_N)))
    except (TypeError, ValueError) as exc:
        raise PipelineError("topN 必须是整数") from exc
    if not 1 <= top_n <= 100:
        raise PipelineError("topN 必须在 1–100 之间")
    as_of = str(incoming.get("asOf", stored.get("asOf", date.today().isoformat())))
    benchmark = incoming.get("benchmark", stored.get("benchmark"))
    if benchmark is not None:
        benchmark = str(benchmark).strip().upper() or None
    posture = incoming.get("zhugePosture", stored.get("zhugePosture"))
    zhuge_weight = incoming.get("zhugeWeight", stored.get("zhugeWeight"))
    if zhuge_weight in (None, ""):
        zhuge_weight = None
    else:
        try:
            zhuge_weight = float(zhuge_weight)
        except (TypeError, ValueError) as exc:
            raise PipelineError("zhugeWeight 必须是数字") from exc
    return {
        "schemaVersion": STAGE_EXECUTION_SCHEMA,
        "dataDir": str(_project_path(data_dir, "dataDir")),
        "metadataCsv": str(_project_path(metadata_csv, "metadataCsv")),
        "topN": top_n,
        "asOf": as_of,
        "benchmark": benchmark,
        "zhugePosture": str(posture).strip().lower() if posture else None,
        "zhugeWeight": zhuge_weight,
        "executionMode": EXECUTION_MODE,
        "liveTrading": False,
    }


def _load_metadata(path: Path) -> dict[str, HawkeyeMetadata]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            return {}
        fields = {field.strip().lower().replace("_", " "): field for field in reader.fieldnames}
        ticker_field = fields.get("ticker") or fields.get("symbol")
        if not ticker_field:
            return {}
        name_field = fields.get("name") or fields.get("security name")
        mcap_field = fields.get("total mcap") or fields.get("market cap") or fields.get("mcap")
        values: dict[str, HawkeyeMetadata] = {}
        for row in reader:
            ticker = str(row.get(ticker_field) or "").strip().upper()
            if not ticker:
                continue
            raw_mcap = str(row.get(mcap_field) or "").replace(",", "").strip() if mcap_field else ""
            try:
                mcap = float(raw_mcap) if raw_mcap else None
            except ValueError:
                mcap = None
            values[ticker] = HawkeyeMetadata(
                ticker=ticker,
                name=str(row.get(name_field) or "").strip() if name_field else "",
                total_mcap=mcap,
            )
        return values


def _serialize_universe(universe: dict[str, list[Bar]]) -> dict[str, list[dict[str, Any]]]:
    return {ticker: [asdict(bar) for bar in bars] for ticker, bars in sorted(universe.items())}


def _deserialize_universe(value: object) -> dict[str, list[Bar]]:
    if not isinstance(value, dict):
        raise PipelineError("Frozen Facts 缺少 universe")
    universe: dict[str, list[Bar]] = {}
    for ticker, raw_bars in value.items():
        if not isinstance(raw_bars, list):
            raise PipelineError(f"Frozen Facts 的 {ticker} bars 无效")
        bars: list[Bar] = []
        for raw in raw_bars:
            if not isinstance(raw, dict):
                raise PipelineError(f"Frozen Facts 的 {ticker} bar 无效")
            try:
                bars.append(
                    Bar(
                        date=str(raw["date"]),
                        open=float(raw["open"]),
                        high=float(raw["high"]),
                        low=float(raw["low"]),
                        close=float(raw["close"]),
                        volume=float(raw["volume"]),
                    )
                )
            except (KeyError, TypeError, ValueError) as exc:
                raise PipelineError(f"Frozen Facts 的 {ticker} bar 字段无效") from exc
        universe[str(ticker).upper()] = bars
    if not universe:
        raise PipelineError("Frozen Facts 的 universe 为空")
    return universe


def _metadata_payload(metadata: dict[str, HawkeyeMetadata]) -> dict[str, dict[str, Any]]:
    return {
        ticker: {
            "ticker": item.ticker,
            "name": item.name,
            "total_mcap": item.total_mcap,
        }
        for ticker, item in sorted(metadata.items())
    }


def _metadata_from_payload(value: object) -> dict[str, HawkeyeMetadata]:
    if not isinstance(value, dict):
        return {}
    result: dict[str, HawkeyeMetadata] = {}
    for ticker, raw in value.items():
        if not isinstance(raw, dict):
            continue
        mcap = raw.get("total_mcap")
        try:
            mcap_value = float(mcap) if mcap is not None else None
        except (TypeError, ValueError):
            mcap_value = None
        result[str(ticker).upper()] = HawkeyeMetadata(
            ticker=str(raw.get("ticker") or ticker).upper(),
            name=str(raw.get("name") or ""),
            total_mcap=mcap_value,
        )
    return result


def _selected_data(store: PipelineStore, run_id: str, stage_id: str) -> dict[str, Any]:
    output = store.load_selected_output(run_id, stage_id)
    data = output.get("data")
    if not isinstance(data, dict):
        raise PipelineError(f"Stage {stage_id} output.data 必须是 JSON 对象")
    return data


def _market_context(universe: dict[str, list[Bar]], config: dict[str, Any]) -> dict[str, Any]:
    context = build_market_context(universe, config.get("benchmark"))
    posture = config.get("zhugePosture")
    if posture:
        context["zhuge_orion"] = {"posture": posture, "mode": "manual", "tail_decimals": 3}
    return context


def _weights(config: dict[str, Any]) -> dict[str, float]:
    return pdc_weights_with_zhuge(config.get("zhugeWeight")) if config.get("zhugeWeight") is not None else dict(DEFAULT_WEIGHTS)


def _evaluate_rows(
    universe: dict[str, list[Bar]],
    tickers: list[str],
    config: dict[str, Any],
    *,
    round_name: str,
) -> list[dict[str, Any]]:
    context = _market_context(universe, config)
    rows: list[dict[str, Any]] = []
    for ticker in tickers:
        bars = universe.get(ticker)
        if not bars:
            continue
        evaluation = run_all_skills(ticker, bars, context, _weights(config))
        row = full_score_row(evaluation, str(config["asOf"]))
        row.update(
            {
                "round": round_name,
                "provider": "local-deterministic-core",
                "latest_date": evaluation.latest_date,
                "latest_close": evaluation.latest_close,
                "breakout_trigger": evaluation.breakout_trigger,
                "technical_stop": evaluation.technical_stop,
            }
        )
        rows.append(row)
    rows.sort(key=lambda row: (-float(row.get("final_score") or 0), str(row.get("ticker") or "")))
    for index, row in enumerate(rows, start=1):
        row["rank"] = index
    return rows


def _create(store: PipelineStore, run_id: str, stage_id: str, data: dict[str, Any], config: dict[str, Any]) -> dict[str, Any]:
    return store.create_attempt(
        run_id,
        stage_id,
        data={"schemaVersion": STAGE_EXECUTION_SCHEMA, **data},
        config=config,
        complete=True,
        execution_mode=EXECUTION_MODE,
    )


def _stage_01(store: PipelineStore, run_id: str, config: dict[str, Any]) -> dict[str, Any]:
    data_dir = Path(config["dataDir"])
    metadata_path = Path(config["metadataCsv"])
    universe = load_universe(data_dir)
    metadata = _load_metadata(metadata_path)
    latest_dates = {ticker: (bars[-1].date if bars else "") for ticker, bars in universe.items()}
    source_files = {
        str(path.relative_to(PROJECT_ROOT)): file_hash(path)
        for path in sorted(data_dir.glob("*.csv"))
        if path.is_file()
    }
    if metadata_path.exists():
        source_files[str(metadata_path.relative_to(PROJECT_ROOT))] = file_hash(metadata_path)
    return _create(
        store,
        run_id,
        "01",
        {
            "factsSchemaVersion": "pdc-frozen-facts-v1",
            "sourceFilesSha256": source_files,
            "tickerCount": len(universe),
            "tickers": sorted(universe),
            "latestDates": latest_dates,
            "metadata": _metadata_payload(metadata),
            "universe": _serialize_universe(universe),
            "factsSha256": _hash_json({"tickers": sorted(universe), "latestDates": latest_dates, "sourceFilesSha256": source_files}),
        },
        config,
    )


def _stage_02(store: PipelineStore, run_id: str, config: dict[str, Any]) -> dict[str, Any]:
    frozen = _selected_data(store, run_id, "01")
    universe = _deserialize_universe(frozen.get("universe"))
    metadata = _metadata_from_payload(frozen.get("metadata"))
    results = screen_universe(universe, metadata)
    rows = [result_to_row(result) for result in results]
    passed = [row for row in rows if row.get("passed") is True]
    return _create(
        store,
        run_id,
        "02",
        {
            "hawkeyeSchemaVersion": "pdc-hawkeye-output-v1",
            "provider": "local-deterministic-core",
            "checkedCount": len(rows),
            "candidateCount": len(passed),
            "candidateTickers": [str(row["ticker"]) for row in passed],
            "results": rows,
        },
        config,
    )


def _stage_03_or_05(store: PipelineStore, run_id: str, stage_id: str, config: dict[str, Any]) -> dict[str, Any]:
    frozen = _selected_data(store, run_id, "01")
    universe = _deserialize_universe(frozen.get("universe"))
    if stage_id == "03":
        hawkeye = _selected_data(store, run_id, "02")
        tickers = [str(ticker) for ticker in hawkeye.get("candidateTickers", [])]
        round_name = "ROUND_1"
    else:
        shortlist = _selected_data(store, run_id, "04")
        tickers = [str(ticker) for ticker in shortlist.get("shortlistTickers", [])]
        round_name = "ROUND_2"
    rows = _evaluate_rows(universe, tickers, config, round_name=round_name)
    return _create(
        store,
        run_id,
        stage_id,
        {
            "memberSchemaVersion": "pdc-round-members-output-v1",
            "provider": "local-deterministic-core",
            "memberIsolation": "ticker-local; no peer result is read while a ticker is evaluated",
            "tickerCount": len(rows),
            "tickers": [str(row["ticker"]) for row in rows],
            "rows": rows,
        },
        config,
    )


def _stage_04(store: PipelineStore, run_id: str, config: dict[str, Any]) -> dict[str, Any]:
    round_one = _selected_data(store, run_id, "03")
    rows = [row for row in round_one.get("rows", []) if isinstance(row, dict)]
    rows.sort(key=lambda row: (-float(row.get("final_score") or 0), str(row.get("ticker") or "")))
    shortlist = rows[: int(config["topN"])]
    return _create(
        store,
        run_id,
        "04",
        {
            "aggregateSchemaVersion": "pdc-r1-aggregate-output-v1",
            "provider": "local-deterministic-core",
            "sourceTickerCount": len(rows),
            "shortlistCount": len(shortlist),
            "shortlistTickers": [str(row.get("ticker")) for row in shortlist],
            "shortlist": shortlist,
        },
        config,
    )


def _stage_06(store: PipelineStore, run_id: str, config: dict[str, Any]) -> dict[str, Any]:
    round_two = _selected_data(store, run_id, "05")
    rows = [row for row in round_two.get("rows", []) if isinstance(row, dict)]
    score_fields = [
        "market_regime_score",
        "trend_score",
        "livermore_breakout_score",
        "volume_price_score",
        "candlestick_score",
        "overheat_score",
        "risk_score",
        "zhuge_orion_score",
        "final_chair_score",
    ]
    summaries: list[dict[str, Any]] = []
    for row in rows:
        scores = [float(row[field]) for field in score_fields if isinstance(row.get(field), (int, float))]
        summaries.append(
            {
                "ticker": row.get("ticker", ""),
                "finalScore": row.get("final_score", 0),
                "finalStatus": row.get("final_status", ""),
                "meanMemberScore": round(mean(scores), 4) if scores else None,
                "scoreSpread": round(max(scores) - min(scores), 4) if scores else None,
                "riskScore": row.get("risk_score"),
                "marketRegimeScore": row.get("market_regime_score"),
                "status": row.get("final_status", ""),
            }
        )
    status_counts: dict[str, int] = {}
    for row in summaries:
        status = str(row.get("status") or "UNKNOWN")
        status_counts[status] = status_counts.get(status, 0) + 1
    return _create(
        store,
        run_id,
        "06",
        {
            "secretarySchemaVersion": "pdc-secretary-output-v1",
            "provider": "local-deterministic-core",
            "tickerCount": len(summaries),
            "statusCounts": status_counts,
            "summaries": summaries,
        },
        config,
    )


def _stage_07(store: PipelineStore, run_id: str, config: dict[str, Any]) -> dict[str, Any]:
    round_two = _selected_data(store, run_id, "05")
    secretary = _selected_data(store, run_id, "06")
    secretary_by_ticker = {str(row.get("ticker")): row for row in secretary.get("summaries", []) if isinstance(row, dict)}
    rows: list[dict[str, Any]] = []
    for source in round_two.get("rows", []):
        if not isinstance(source, dict):
            continue
        ticker = str(source.get("ticker") or "")
        summary = secretary_by_ticker.get(ticker, {})
        final_score = float(source.get("final_score") or 0)
        risk = float(source.get("risk_score") or 0)
        overheat = float(source.get("overheat_score") or 0)
        spread = float(summary.get("scoreSpread") or 0)
        blockers: list[str] = []
        cautions: list[str] = []
        if risk <= 3.5:
            blockers.append("risk score is at or below 3.5")
        if str(source.get("final_status") or "") == "Remove":
            blockers.append("Final Chair status is Remove")
        if overheat <= 3.0:
            cautions.append("overheat score is at or below 3.0")
        if spread >= 3.0:
            cautions.append("member score spread is at least 3.0")
        if blockers:
            decision = "BLOCK"
        elif final_score >= 6.0 and risk >= 5.0:
            decision = "APPROVE"
        else:
            decision = "REVIEW"
        rows.append(
            {
                "ticker": ticker,
                "blueWhaleScore": round(final_score, 2),
                "decision": decision,
                "blockers": blockers,
                "cautions": cautions,
                "finalStatus": source.get("final_status", ""),
                "riskScore": risk,
                "scoreSpread": spread,
            }
        )
    return _create(
        store,
        run_id,
        "07",
        {
            "blueWhaleSchemaVersion": "pdc-blue-whale-output-v1",
            "provider": "local-deterministic-core",
            "researchOnly": True,
            "rows": rows,
        },
        config,
    )


def _stage_08(store: PipelineStore, run_id: str, config: dict[str, Any]) -> dict[str, Any]:
    blue = _selected_data(store, run_id, "07")
    rows = [row for row in blue.get("rows", []) if isinstance(row, dict)]
    approved = [str(row.get("ticker")) for row in rows if row.get("decision") == "APPROVE"]
    review = [str(row.get("ticker")) for row in rows if row.get("decision") == "REVIEW"]
    blocked = [str(row.get("ticker")) for row in rows if row.get("decision") == "BLOCK"]
    gate_status = "OPEN" if approved else "HOLD"
    return _create(
        store,
        run_id,
        "08",
        {
            "finalGateSchemaVersion": "pdc-final-gate-output-v1",
            "provider": "local-deterministic-core",
            "gateStatus": gate_status,
            "approvedTickers": approved,
            "reviewTickers": review,
            "blockedTickers": blocked,
            "reason": "risk and score gates passed" if approved else "no ticker passed the local research gate",
        },
        config,
    )


def _stage_09(store: PipelineStore, run_id: str, config: dict[str, Any]) -> dict[str, Any]:
    gate = _selected_data(store, run_id, "08")
    round_two = _selected_data(store, run_id, "05")
    by_ticker = {str(row.get("ticker")): row for row in round_two.get("rows", []) if isinstance(row, dict)}
    approved = set(str(item) for item in gate.get("approvedTickers", []))
    review = set(str(item) for item in gate.get("reviewTickers", []))
    decisions: list[dict[str, Any]] = []
    for ticker in [*gate.get("approvedTickers", []), *gate.get("reviewTickers", []), *gate.get("blockedTickers", [])]:
        ticker = str(ticker)
        source = by_ticker.get(ticker, {})
        if ticker in approved:
            decision = "RESEARCH_CANDIDATE"
            instruction = "MANUAL_REVIEW_ONLY"
        elif ticker in review:
            decision = "WATCH"
            instruction = "WATCH_ONLY"
        else:
            decision = "EXCLUDED"
            instruction = "IGNORE"
        decisions.append(
            {
                "ticker": ticker,
                "decision": decision,
                "instruction": instruction,
                "finalScore": source.get("final_score"),
                "finalStatus": source.get("final_status"),
                "mainRisk": source.get("main_risk", ""),
            }
        )
    return _create(
        store,
        run_id,
        "09",
        {
            "finalDecisionSchemaVersion": "pdc-final-decision-output-v1",
            "provider": "local-deterministic-core",
            "researchOnly": True,
            "liveTrading": False,
            "decisions": decisions,
        },
        config,
    )


STAGE_HANDLERS = {
    "01": _stage_01,
    "02": _stage_02,
    "03": lambda store, run_id, config: _stage_03_or_05(store, run_id, "03", config),
    "04": _stage_04,
    "05": lambda store, run_id, config: _stage_03_or_05(store, run_id, "05", config),
    "06": _stage_06,
    "07": _stage_07,
    "08": _stage_08,
    "09": _stage_09,
}


def execute_stage(
    store: PipelineStore,
    run_id: str,
    stage_id: str,
    override_config: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Execute one stage into a new Attempt; never overwrites an old Attempt."""
    handler = STAGE_HANDLERS.get(stage_id)
    if handler is None:
        raise PipelineError(f"未知 Stage：{stage_id}")
    config = _run_config(store, run_id, override_config)
    return handler(store, run_id, config)

