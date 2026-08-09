from __future__ import annotations

import argparse
import csv
import json
import sys
from datetime import datetime
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from stock_pdc.ab_performance import (  # noqa: E402
    fetch_raw_histories,
    freeze_price_observations,
    freeze_signal_pair,
    rebuild_ab_performance,
    signal_tickers,
)
from stock_pdc.ab_snapshot import (  # noqa: E402
    build_snapshot_manifest,
    freeze_snapshot_manifest,
    policy_hash,
    read_a_score_rows,
)
from stock_pdc.data_loader import load_universe  # noqa: E402
from stock_pdc.models import Bar  # noqa: E402
from stock_pdc.strategy_b import (  # noqa: E402
    PortfolioRiskState,
    build_strategy_b_portfolio_plan,
    build_strategy_b_rows,
    load_strategy_b_config,
    selection_plan,
)
from stock_pdc.strategy_b_outputs import write_strategy_b_outputs  # noqa: E402


A_MODEL_VERSION = "stock-pdc-a-legacy-2026-07-10"
EXPERIMENT_ID = "stock-pdc-a-vs-b1-2026-07-10"


def _path(value: str) -> Path:
    path = Path(value)
    return path if path.is_absolute() else PROJECT_ROOT / path


def _names(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return {
            row["ticker"]: row.get("name", "")
            for row in csv.DictReader(handle)
            if row.get("ticker")
        }


def _config_hash(path: Path) -> str:
    return policy_hash([path])


def _validate_output_isolation(a_outputs: Path, b_outputs: Path, ab_outputs: Path) -> None:
    resolved = {
        "A": a_outputs.resolve(),
        "B": b_outputs.resolve(),
        "AB": ab_outputs.resolve(),
    }
    labels = list(resolved)
    for index, left_label in enumerate(labels):
        for right_label in labels[index + 1 :]:
            left = resolved[left_label]
            right = resolved[right_label]
            if left == right or left in right.parents or right in left.parents:
                raise ValueError(
                    f"A, B, and A/B output roots must be disjoint; {left_label}={left} overlaps "
                    f"{right_label}={right}"
                )


def _validate_append_only_signal_date(ab_outputs: Path, signal_date: str) -> None:
    existing_dates = sorted(
        path.stem.removeprefix("signal_")
        for path in (ab_outputs / "signals").glob("signal_*.csv")
    )
    if existing_dates and signal_date < existing_dates[-1]:
        raise ValueError(
            f"Cannot run historical signal {signal_date} after frozen signal {existing_dates[-1]}"
        )


def _initialize_experiment(
    root: Path,
    config_path: Path,
    config: dict[str, object],
    effective_signal_date: str,
    a_runtime_policy: dict[str, object],
    experiment_mode: str,
) -> dict[str, object]:
    experiment_path = root / "experiment.json"
    a_policy_files = [
        PROJECT_ROOT / "scripts" / "fetch_a_share_eastmoney.py",
        PROJECT_ROOT / "scripts" / "run_pdc.py",
        PROJECT_ROOT / "stock_pdc" / "config.py",
        PROJECT_ROOT / "stock_pdc" / "data_loader.py",
        PROJECT_ROOT / "stock_pdc" / "hawkeye_radar.py",
        PROJECT_ROOT / "stock_pdc" / "indicators.py",
        PROJECT_ROOT / "stock_pdc" / "market_context.py",
        PROJECT_ROOT / "stock_pdc" / "models.py",
        PROJECT_ROOT / "stock_pdc" / "outputs.py",
        PROJECT_ROOT / "stock_pdc" / "pdc_orchestrator.py",
        PROJECT_ROOT / "stock_pdc" / "cli.py",
        PROJECT_ROOT / "stock_pdc" / "portfolio.py",
        PROJECT_ROOT / "stock_pdc" / "quotes.py",
        *sorted((PROJECT_ROOT / "stock_pdc" / "scorers").glob("*.py")),
    ]
    b_policy_files = [
        config_path,
        PROJECT_ROOT / "stock_pdc" / "strategy_b.py",
    ]
    comparison_engine_files = [
        PROJECT_ROOT / "scripts" / "run_pdc_b.py",
        PROJECT_ROOT / "stock_pdc" / "ab_performance.py",
        PROJECT_ROOT / "stock_pdc" / "ab_snapshot.py",
    ]
    experiment_status = "active_prospective" if experiment_mode == "prospective" else "offline_test"
    price_mode = (
        "public_tencent_unadjusted_fail_closed"
        if experiment_mode == "prospective"
        else "local_qfq_offline_test_only"
    )
    expected = {
        "experimentId": EXPERIMENT_ID,
        "status": experiment_status,
        "experimentMode": experiment_mode,
        "priceMode": price_mode,
        "effectiveSignalDate": effective_signal_date,
        "firstExecution": "next A-share benchmark trading-session open after the effective signal",
        "noBackfill": True,
        "signalKey": "completed_market_close",
        "A": {
            "strategyId": "A",
            "modelVersion": A_MODEL_VERSION,
            "policy": "legacy Stock PDC final-score Top20; existing outputs remain canonical",
            "outputs": "outputs/",
            "policyHash": policy_hash(a_policy_files),
            "runtimePolicy": a_runtime_policy,
            "legacyHistoryAvailableSince": "2026-06-23",
        },
        "B": {
            "strategyId": "B",
            "modelVersion": config["modelVersion"],
            "policy": "alpha rank plus entry gates, risk sizing, exposure caps, and exit state",
            "outputs": "outputs_b/",
            "policyHash": policy_hash(b_policy_files),
            "configHash": _config_hash(config_path),
            "zhugeMode": "shadow_only",
        },
        "comparisonTracks": {
            "selection": "A and B Top20 at identical 100% equal-weight gross exposure",
            "portfolio": "A legacy portfolio policy versus B risk-managed portfolio policy",
        },
        "comparisonEnginePolicyHash": policy_hash(comparison_engine_files),
        "researchCosts": config["researchCosts"],
        "minimumPairedTradingDays": (config.get("comparison") or {}).get("minimumPairedTradingDays", 60),
        "createdAt": datetime.now().astimezone().isoformat(timespec="seconds"),
    }
    root.mkdir(parents=True, exist_ok=True)
    if experiment_path.exists():
        with experiment_path.open("r", encoding="utf-8") as handle:
            existing = json.load(handle)
        immutable_keys = [
            "experimentId",
            "status",
            "experimentMode",
            "priceMode",
            "effectiveSignalDate",
            "noBackfill",
        ]
        for key in immutable_keys:
            if existing.get(key) != expected.get(key):
                raise ValueError(f"A/B experiment immutable field changed: {key}")
        if existing.get("A", {}).get("policyHash") != expected["A"]["policyHash"]:
            raise ValueError("Strategy A policy changed; create A2 rather than mutating the active A/B experiment")
        if existing.get("A", {}).get("runtimePolicy") != expected["A"]["runtimePolicy"]:
            raise ValueError("Strategy A runtime policy changed; create a new prospective A/B experiment")
        if existing.get("B", {}).get("policyHash") != expected["B"]["policyHash"]:
            raise ValueError("Strategy B1 policy changed; create B2 rather than mutating prospective B1 history")
        if existing.get("comparisonEnginePolicyHash") != expected["comparisonEnginePolicyHash"]:
            raise ValueError("A/B execution engine changed; create a new prospective experiment version")
        return existing
    with experiment_path.open("w", encoding="utf-8") as handle:
        json.dump(expected, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    with (root / "strategy_registry.json").open("w", encoding="utf-8") as handle:
        json.dump({"experimentId": EXPERIMENT_ID, "A": expected["A"], "B": expected["B"]}, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    return expected


def _frozen_signal_day_returns(
    price_path: Path,
    tickers: set[str],
    signal_date: str,
) -> tuple[dict[str, float | None], dict[str, str]]:
    with price_path.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    returns: dict[str, float | None] = {}
    sources: dict[str, str] = {}
    for ticker in tickers:
        ticker_rows = sorted(
            (
                row
                for row in rows
                if row.get("ticker") == ticker
                and row.get("observation_date", "") <= signal_date
                and row.get("close") not in (None, "")
            ),
            key=lambda row: row["observation_date"],
        )
        current = next(
            (row for row in reversed(ticker_rows) if row["observation_date"] == signal_date),
            None,
        )
        previous = next(
            (row for row in reversed(ticker_rows) if row["observation_date"] < signal_date),
            None,
        )
        sources[ticker] = str(current.get("source") if current else "unavailable/frozen")
        if current is None or previous is None or not float(previous["close"]):
            returns[ticker] = None
        else:
            returns[ticker] = (float(current["close"]) / float(previous["close"]) - 1.0) * 100.0
    return returns, sources


def _validate_snapshot_date(
    universe: dict[str, list[Bar]],
    a_rows: list[dict[str, object]],
    benchmark: str,
    as_of: str,
) -> None:
    required = {benchmark, *(str(row.get("ticker") or "") for row in a_rows)}
    missing = sorted(ticker for ticker in required if ticker and ticker not in universe)
    if missing:
        raise ValueError(f"A/B snapshot is missing scored OHLCV files: {', '.join(missing[:20])}")
    stale = sorted(
        f"{ticker}:{universe[ticker][-1].date}"
        for ticker in required
        if ticker and universe[ticker][-1].date != as_of
    )
    if stale:
        raise ValueError(
            f"A/B snapshot mixes stale or future CSV dates versus {as_of}: {', '.join(stale[:20])}"
        )


def _a_portfolio_plan(
    a_rows: list[dict[str, object]],
    current_positions: dict[str, dict[str, object]],
    signal_day_returns: dict[str, float | None],
    signal_date: str,
    snapshot_id: str,
    top_n: int,
) -> list[dict[str, object]]:
    ordered = sorted(a_rows, key=lambda row: int(float(row.get("rank") or 999999)))
    top = [str(row["ticker"]) for row in ordered[:top_n]]
    action_by_ticker: dict[str, tuple[str, str]] = {}
    dropped_hold_weights: dict[str, float] = {}
    for ticker in top:
        if ticker in current_positions:
            action_by_ticker[ticker] = ("HOLD_A", "remains in legacy A Top20")
        else:
            action_by_ticker[ticker] = ("ENTER_A", "entered legacy A Top20")
    for ticker in sorted(current_positions):
        if ticker in top:
            continue
        day_return = signal_day_returns.get(ticker)
        if day_return is not None and day_return > 0:
            dropped_hold_weights[ticker] = float(current_positions[ticker].get("current_weight_pct") or 0.0)
            action_by_ticker[ticker] = (
                "HOLD_DROPPED_UP_DAY",
                "dropped from A Top20 but signal day is up; user override",
            )
        else:
            action_by_ticker[ticker] = (
                "SELL_REVIEW_DROPPED",
                "dropped from A Top20 and signal day is non-up or unverifiable",
            )
    dropped_gross = sum(dropped_hold_weights.values())
    top_weight = max(0.0, 100.0 - dropped_gross) / len(top) if top else 0.0
    target_weights = {ticker: top_weight for ticker in top}
    target_weights.update(dropped_hold_weights)
    total_target = sum(target_weights.values())
    if total_target > 100.0:
        scale = 100.0 / total_target
        target_weights = {ticker: weight * scale for ticker, weight in target_weights.items()}
    rank_by_ticker = {str(row["ticker"]): int(float(row.get("rank") or 0)) for row in ordered}
    return [
        {
            "signal_date": signal_date,
            "strategy_id": "A",
            "model_version": A_MODEL_VERSION,
            "snapshot_id": snapshot_id,
            "ticker": ticker,
            "rank": rank_by_ticker.get(ticker, ""),
            "action": action_by_ticker[ticker][0],
            "reason": action_by_ticker[ticker][1],
            "target_weight_pct": round(target_weights.get(ticker, 0.0), 6),
            "initial_stop": "",
            "active_stop": "",
            "stop_distance_pct": "",
        }
        for ticker in sorted(action_by_ticker, key=lambda item: (rank_by_ticker.get(item, 999999), item))
    ]


def _signal_rows(
    plan: list[dict[str, object]],
    strategy_id: str,
    variant: str,
    track: str,
) -> list[dict[str, object]]:
    return [
        {
            "signal_date": row["signal_date"],
            "snapshot_id": row["snapshot_id"],
            "variant": variant,
            "comparison_track": track,
            "strategy_id": strategy_id,
            "model_version": row["model_version"],
            "ticker": row["ticker"],
            "rank": row["rank"],
            "action": row["action"],
            "reason": row["reason"],
            "target_weight_pct": row["target_weight_pct"],
            "initial_stop": row.get("initial_stop", ""),
            "active_stop": row.get("active_stop", ""),
            "stop_distance_pct": row.get("stop_distance_pct", ""),
        }
        for row in plan
    ]


def _cash_plan(signal_date: str, snapshot_id: str, model_version: str) -> list[dict[str, object]]:
    return [
        {
            "signal_date": signal_date,
            "strategy_id": "B",
            "model_version": model_version,
            "snapshot_id": snapshot_id,
            "ticker": "__CASH__",
            "rank": "",
            "action": "HOLD_CASH",
            "reason": "no eligible B target; retain cash",
            "target_weight_pct": 0.0,
            "initial_stop": "",
            "active_stop": "",
            "stop_distance_pct": "",
        }
    ]


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate frozen Stock PDC B1 and update the prospective A/B paper ledger.")
    parser.add_argument("--data-dir", required=True)
    parser.add_argument("--metadata-csv", required=True)
    parser.add_argument("--a-outputs-dir", default="outputs")
    parser.add_argument("--b-outputs-dir", default="outputs_b")
    parser.add_argument("--ab-outputs-dir", default="outputs_ab")
    parser.add_argument("--config", default="configs/stock_pdc_b_v1.json")
    parser.add_argument("--as-of", required=True)
    parser.add_argument("--effective-signal-date", default=None)
    parser.add_argument("--benchmark", default="CSI300ETF")
    parser.add_argument("--top", type=int, default=20)
    parser.add_argument(
        "--a-zhuge-mode",
        choices=["close_tail_five_elements"],
        default="close_tail_five_elements",
    )
    parser.add_argument("--a-zhuge-weight", type=float, default=0.02)
    parser.add_argument("--a-zhuge-tail-decimals", type=int, choices=range(0, 7), default=3)
    parser.add_argument(
        "--experiment-mode",
        choices=["prospective", "offline_test"],
        default="prospective",
    )
    parser.add_argument("--no-public-price-refresh", action="store_true")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    data_dir = _path(args.data_dir)
    metadata_csv = _path(args.metadata_csv)
    a_outputs = _path(args.a_outputs_dir)
    b_outputs = _path(args.b_outputs_dir)
    ab_outputs = _path(args.ab_outputs_dir)
    _validate_output_isolation(a_outputs, b_outputs, ab_outputs)
    _validate_append_only_signal_date(ab_outputs, args.as_of)
    if args.no_public_price_refresh and args.experiment_mode != "offline_test":
        raise ValueError("Formal prospective A/B experiments cannot disable the public raw price refresh")
    if args.experiment_mode == "offline_test":
        temporary_root = Path("/private/tmp").resolve()
        if not args.no_public_price_refresh:
            raise ValueError("offline_test mode requires --no-public-price-refresh")
        for label, path in (("B", b_outputs), ("AB", ab_outputs)):
            resolved = path.resolve()
            if resolved != temporary_root and temporary_root not in resolved.parents:
                raise ValueError(f"{label} offline-test output must stay under {temporary_root}")
    config_path = _path(args.config)
    config = load_strategy_b_config(config_path)
    if args.benchmark != str(config.get("benchmark")):
        raise ValueError(f"B1 benchmark is frozen as {config.get('benchmark')}, got {args.benchmark}")
    if args.top != int((config.get("entry") or {}).get("publishedTopCount", 20)):
        raise ValueError("B1 requires the frozen Top 20 comparison boundary")
    if not 0.0 <= args.a_zhuge_weight <= 0.05:
        raise ValueError("Strategy A Zhuge weight must remain between 0.00 and 0.05")
    a_score_csv = a_outputs / "full_pdc_scores.csv"
    a_rows = read_a_score_rows(a_score_csv, args.as_of)
    if not all("close-tail five-elements experiment" in str(row.get("zhuge_orion_reason") or "") for row in a_rows):
        raise ValueError("Strategy A scores do not contain the required automatic close-tail Zhuge overlay")
    universe = load_universe(data_dir)
    _validate_snapshot_date(universe, a_rows, args.benchmark, args.as_of)
    names = _names(metadata_csv)
    manifest = build_snapshot_manifest(data_dir, metadata_csv, a_score_csv, args.as_of, args.benchmark)
    snapshot_id = str(manifest["snapshotId"])
    freeze_snapshot_manifest(ab_outputs, manifest)

    experiment_path = ab_outputs / "experiment.json"
    if experiment_path.exists():
        with experiment_path.open("r", encoding="utf-8") as handle:
            existing_experiment = json.load(handle)
        effective_signal_date = str(existing_experiment["effectiveSignalDate"])
    else:
        effective_signal_date = args.effective_signal_date or args.as_of
    a_runtime_policy = {
        "topCount": args.top,
        "benchmark": args.benchmark,
        "zhugeMode": args.a_zhuge_mode,
        "zhugeWeight": args.a_zhuge_weight,
        "finalChairWeight": round(0.05 - args.a_zhuge_weight, 10),
        "zhugeTailDecimals": args.a_zhuge_tail_decimals,
        "manualZhugePostureAllowed": False,
        "priceMode": (
            "public_tencent_unadjusted_fail_closed"
            if args.experiment_mode == "prospective"
            else "local_qfq_offline_test_only"
        ),
    }
    experiment = _initialize_experiment(
        ab_outputs,
        config_path,
        config,
        effective_signal_date,
        a_runtime_policy,
        args.experiment_mode,
    )
    if args.as_of < effective_signal_date:
        raise ValueError(f"Signal date {args.as_of} precedes A/B effective date {effective_signal_date}")

    b_rows = build_strategy_b_rows(a_rows, universe, names, config, args.as_of, snapshot_id)
    a_ordered = sorted(a_rows, key=lambda row: int(float(row.get("rank") or 999999)))
    prior_signal_tickers = signal_tickers(ab_outputs)
    preliminary_tickers = {
        *(str(row["ticker"]) for row in a_ordered[: args.top]),
        *(str(row["ticker"]) for row in b_rows[: args.top]),
        *prior_signal_tickers,
        args.benchmark,
    }
    raw_histories: dict[str, list[Bar]] = {}
    failures: dict[str, str] = {}
    if not args.no_public_price_refresh:
        raw_histories, failures = fetch_raw_histories(preliminary_tickers, args.benchmark)
        if failures:
            sample = "; ".join(
                f"{ticker}: {reason}" for ticker, reason in sorted(failures.items())[:10]
            )
            raise RuntimeError(
                "Public Tencent unadjusted price refresh was incomplete; refusing to update the formal "
                f"A/B ledger. Failures: {sample}"
            )
        scored_tickers = {str(row["ticker"]) for row in a_rows}
        required_current_raw = {
            *(str(row["ticker"]) for row in a_ordered[: args.top]),
            *(str(row["ticker"]) for row in b_rows[: args.top]),
            *(ticker for ticker in prior_signal_tickers if ticker in scored_tickers),
            args.benchmark,
        }
        missing_current = sorted(
            ticker
            for ticker in required_current_raw
            if not any(bar.date == args.as_of for bar in raw_histories.get(ticker, []))
        )
        if missing_current:
            raise RuntimeError(
                f"Tencent raw histories are missing the verified signal date {args.as_of} for: "
                f"{', '.join(missing_current[:20])}"
            )
    histories: dict[str, list[Bar]] = {}
    sources: dict[str, str] = {}
    for ticker in preliminary_tickers:
        if ticker in raw_histories:
            histories[ticker] = raw_histories[ticker]
            sources[ticker] = "Tencent/unadjusted/frozen"
        elif args.no_public_price_refresh and ticker in universe:
            histories[ticker] = universe[ticker]
            sources[ticker] = "local-qfq-offline-test-only/frozen"
        else:
            histories[ticker] = []
            sources[ticker] = "unavailable/carry-forward"
    benchmark_bars = histories.get(args.benchmark) or universe.get(args.benchmark) or []
    in_range_dates = [
        bar.date for bar in benchmark_bars
        if effective_signal_date <= bar.date <= args.as_of
    ]
    previous_dates = [bar.date for bar in benchmark_bars if bar.date < effective_signal_date]
    observation_dates = ([previous_dates[-1]] if previous_dates else []) + in_range_dates
    if args.as_of not in in_range_dates:
        raise ValueError(f"Benchmark has no observation for A/B signal date {args.as_of}")
    price_observations_path = ab_outputs / "price_observations.csv"
    freeze_price_observations(
        price_observations_path,
        histories,
        preliminary_tickers,
        observation_dates,
        sources,
    )
    signal_day_returns, frozen_return_sources = _frozen_signal_day_returns(
        price_observations_path,
        preliminary_tickers,
        args.as_of,
    )
    for row in b_rows:
        ticker = str(row["ticker"])
        if ticker in signal_day_returns:
            day_return = signal_day_returns[ticker]
            row["latest_day_return_pct"] = round(day_return, 6) if day_return is not None else ""
            row["latest_day_return_source"] = frozen_return_sources.get(ticker, "unavailable/frozen")

    minimum_days = int(experiment["minimumPairedTradingDays"])
    prior_ledger = rebuild_ab_performance(
        ab_outputs,
        effective_signal_date,
        args.benchmark,
        config["researchCosts"],
        minimum_days,
    )
    a_selection = selection_plan(
        a_ordered,
        args.as_of,
        snapshot_id,
        A_MODEL_VERSION,
        "A",
        "rank",
        args.top,
    )
    b_selection = selection_plan(
        b_rows,
        args.as_of,
        snapshot_id,
        str(config["modelVersion"]),
        "B",
        "alpha_rank",
        args.top,
    )
    a_summary = prior_ledger.summaries.get("A_PORTFOLIO", {})
    a_nav = float(a_summary.get("nav") or 1.0)
    a_current_positions = {
        ticker: {
            **position,
            "current_weight_pct": (
                float(position.get("shares") or 0.0)
                * float(position.get("last_price") or 0.0)
                / a_nav
                * 100.0
                if a_nav
                else 0.0
            ),
        }
        for ticker, position in prior_ledger.positions.get("A_PORTFOLIO", {}).items()
    }
    a_portfolio = _a_portfolio_plan(
        a_rows,
        a_current_positions,
        signal_day_returns,
        args.as_of,
        snapshot_id,
        args.top,
    )
    b_summary = prior_ledger.summaries.get("B_PORTFOLIO", {})
    b_nav = float(b_summary.get("nav") or 1.0)
    b_current_positions = {
        ticker: {
            **position,
            "current_weight_pct": (
                float(position.get("shares") or 0.0)
                * float(position.get("last_price") or 0.0)
                / b_nav
                * 100.0
                if b_nav
                else 0.0
            ),
            "signal_day_return_pct": signal_day_returns.get(ticker, ""),
        }
        for ticker, position in prior_ledger.positions.get("B_PORTFOLIO", {}).items()
    }
    b_plan, caps = build_strategy_b_portfolio_plan(
        b_rows,
        b_current_positions,
        PortfolioRiskState(
            drawdown_pct=float(b_summary.get("currentDrawdownPct") or 0.0),
            annualized_volatility_pct=(
                float(b_summary["annualizedVolatilityPct"])
                if b_summary.get("annualizedVolatilityPct") is not None
                else None
            ),
        ),
        config,
        args.as_of,
        snapshot_id,
    )
    if not b_plan:
        b_plan = _cash_plan(args.as_of, snapshot_id, str(config["modelVersion"]))
    signals = [
        *_signal_rows(a_selection, "A_SELECTION", "A", "selection"),
        *_signal_rows(b_selection, "B_SELECTION", "B", "selection"),
        *_signal_rows(a_portfolio, "A_PORTFOLIO", "A", "portfolio"),
        *_signal_rows(b_plan, "B_PORTFOLIO", "B", "portfolio"),
    ]
    signal_path, signal_created = freeze_signal_pair(ab_outputs, args.as_of, signals)
    final_ledger = rebuild_ab_performance(
        ab_outputs,
        effective_signal_date,
        args.benchmark,
        config["researchCosts"],
        minimum_days,
    )
    b_paths = write_strategy_b_outputs(
        b_outputs,
        b_rows,
        b_plan,
        config,
        args.as_of,
        snapshot_id,
        args.top,
    )
    status = {
        "experimentId": EXPERIMENT_ID,
        "status": experiment["status"],
        "effectiveSignalDate": effective_signal_date,
        "latestSignalDate": args.as_of,
        "latestSnapshotId": snapshot_id,
        "signalCreated": signal_created,
        "signalPath": str(signal_path),
        "BPortfolioGrossCapPct": caps["gross"],
        "BPortfolioTargetCount": len([row for row in b_plan if float(row.get("target_weight_pct") or 0) > 0]),
        "publicPriceFailures": failures,
        "comparisonDecision": json.loads((ab_outputs / "summary.json").read_text(encoding="utf-8"))["decisionStatus"],
        "updatedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
    }
    with (ab_outputs / "status.json").open("w", encoding="utf-8") as handle:
        json.dump(status, handle, ensure_ascii=False, indent=2)
        handle.write("\n")

    print(f"Stock PDC A preserved: {a_outputs}")
    print(f"Stock PDC B generated: {b_outputs}")
    print(f"B model version: {config['modelVersion']}")
    print(f"A/B effective signal date: {effective_signal_date}")
    print(f"Frozen signal: {signal_path}")
    print(f"Snapshot ID: {snapshot_id}")
    print(f"B full scores: {b_paths['full_csv']}")
    print(f"B watchlist: {b_paths['daily_watchlist']}")
    print(f"B research plan: {b_paths['daily_plan']}")
    print(f"A/B summary: {ab_outputs / 'summary.json'}")
    print(f"Paired trading days: {final_ledger.summaries['A_PORTFOLIO']['valuationDays']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
