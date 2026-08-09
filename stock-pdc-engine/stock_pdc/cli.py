from __future__ import annotations

import argparse
import sys
from datetime import date
from pathlib import Path

from .config import (
    BENCHMARK_PRIORITY,
    DEFAULT_DATA_DIR,
    DEFAULT_METADATA_CSV,
    DEFAULT_OUTPUTS_DIR,
    DEFAULT_SELECTION_GATE_MIN_CANDIDATES,
    DEFAULT_SELECTION_GATE_MIN_PDC_POOL,
    DEFAULT_ZHUGE_ORION_PROFILE,
    SKILL_ALIASES,
    pdc_weights_with_zhuge,
)
from .decision_memory import record_completed_run, record_failed_run
from .hawkeye_radar import load_hawkeye_metadata, result_to_row, screen_universe
from .market_context import build_market_context
from .outputs import CANDIDATE_UNIVERSE_HEADERS, write_csv
from .pdc_orchestrator import (
    PDC_MEMBERS,
    daily_instruction_rows,
    find_ticker,
    load_universe_from_dir,
    member_label,
    normalize_skill_name,
    report_row,
    run_all_skills,
    run_pdc_loop,
    run_single_skill,
    save_pdc_outputs,
)

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def _project_path(value: str) -> Path:
    path = Path(value)
    if path.is_absolute():
        return path
    return PROJECT_ROOT / path


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run the Stock PDC committee loop.")
    parser.add_argument(
        "--data-dir",
        "--universe",
        dest="data_dir",
        default=DEFAULT_DATA_DIR,
        help="Directory containing one OHLCV CSV per ticker.",
    )
    parser.add_argument("--outputs-dir", default=DEFAULT_OUTPUTS_DIR, help="Directory for reports and history.")
    parser.add_argument("--logs-dir", default="logs", help="Append-only Markdown decision audit directory.")
    parser.add_argument(
        "--performance-db",
        default="outputs/performance/pdc_performance.sqlite",
        help="SQLite database for role and model performance observations.",
    )
    parser.add_argument(
        "--performance-report",
        default="outputs/performance/pdc_performance_report.md",
        help="Markdown historical performance report generated after each PDC loop.",
    )
    parser.add_argument(
        "--performance-horizon-sessions",
        type=int,
        default=20,
        help="Fixed trading-session horizon used to resolve directional performance predictions.",
    )
    parser.add_argument("--top", type=int, default=20, help="Number of ranked names in the Top 20 report.")
    parser.add_argument("--ticker", default=None, help="Run analysis for a single ticker, such as 600519.SH.")
    parser.add_argument("--skill", default=None, help="Run one PDC member skill for --ticker, such as trend or risk.")
    parser.add_argument("--all-skills", action="store_true", help="Run all PDC member skills for --ticker.")
    parser.add_argument("--pdc-loop", action="store_true", help="Run the full universe PDC loop.")
    parser.add_argument("--use-radar", action="store_true", help="Run Hawkeye Radar before the PDC loop.")
    parser.add_argument("--radar-only", action="store_true", help="Run Hawkeye Radar and write candidate_universe.csv only.")
    parser.add_argument("--metadata-csv", default=DEFAULT_METADATA_CSV, help="Ticker metadata CSV with total_mcap.")
    parser.add_argument(
        "--min-candidate-count",
        type=int,
        default=DEFAULT_SELECTION_GATE_MIN_CANDIDATES,
        help="Deprecated compatibility setting; daily buying no longer requires a candidate count threshold.",
    )
    parser.add_argument(
        "--min-pdc-pool-size",
        type=int,
        default=DEFAULT_SELECTION_GATE_MIN_PDC_POOL,
        help="Deprecated compatibility setting; daily buying is determined by PDC buy status.",
    )
    parser.add_argument("--disable-selection-gate", action="store_true", help="Deprecated; retained for command compatibility.")
    parser.add_argument("--benchmark", default=None, help="Optional benchmark ticker CSV to use, such as SPY or CSI300ETF.")
    parser.add_argument(
        "--include-benchmark",
        action="store_true",
        help="Include the benchmark ticker in the ranked output.",
    )
    parser.add_argument("--as-of", default=date.today().isoformat(), help="Analysis date stored in outputs.")
    parser.add_argument("--list-skills", action="store_true", help="Print available PDC member skill aliases.")
    parser.add_argument("--zhuge-bazi", default=None, help="Optional birth Bazi profile for Zhuge Orion.")
    parser.add_argument("--zhuge-fortune", default=None, help="Optional current fortune note for Zhuge Orion.")
    parser.add_argument(
        "--zhuge-posture",
        choices=["aggressive", "balanced", "neutral", "conservative", "defensive"],
        default=None,
        help="Optional personal risk posture override for Zhuge Orion.",
    )
    parser.add_argument(
        "--zhuge-mode",
        choices=["manual", "close_tail_five_elements"],
        default=None,
        help="Zhuge posture source. Close-tail mode converts the benchmark close's last quoted digit via five elements.",
    )
    parser.add_argument(
        "--zhuge-tail-decimals",
        type=int,
        choices=range(0, 7),
        default=None,
        help="Decimal precision used to extract the close tail digit; CSI300ETF uses 3.",
    )
    parser.add_argument(
        "--zhuge-weight",
        type=float,
        default=None,
        help="Experimental Zhuge weight from 0.00 to 0.05, funded from the Final Chair's 0.05 budget.",
    )
    return parser


def _print_available_skills() -> None:
    canonical = ", ".join(key for key, _label, _scorer in PDC_MEMBERS)
    aliases = ", ".join(sorted(SKILL_ALIASES))
    print(f"PDC members: {canonical}")
    print(f"Aliases: {aliases}")
    print("Pre-PDC skills: hawkeye_radar")


def _print_member_result(skill_key: str, ticker: str, score: object, analysis_date: str) -> None:
    print(f"{ticker} | {member_label(skill_key)} | {analysis_date}")
    print(f"Score: {score.score}")
    print(f"Reason: {score.reason}")
    print(f"Warning: {score.warning or 'None'}")


def _print_all_skill_results(ticker: str, row: dict[str, object], evaluation_scores: dict[str, object]) -> None:
    print(f"{ticker} PDC committee results")
    print(f"Final score: {row['final_score']} | Status: {row['final_status']}")
    print("")
    for key, label, _scorer in PDC_MEMBERS:
        result = evaluation_scores[key]
        print(f"{label}: {result.score}")
        print(f"  Reason: {result.reason}")
        print(f"  Warning: {result.warning or 'None'}")
    print("")
    print(f"Main reason: {row['main_reason']}")
    print(f"Main risk: {row['main_risk']}")


def _zhuge_context(args: argparse.Namespace) -> dict[str, object]:
    context = dict(DEFAULT_ZHUGE_ORION_PROFILE)
    if args.zhuge_bazi is not None:
        context["birth_bazi"] = args.zhuge_bazi
    if args.zhuge_fortune is not None:
        context["fortune_note"] = args.zhuge_fortune
    if args.zhuge_posture is not None:
        context["posture"] = args.zhuge_posture
    if args.zhuge_mode is not None:
        context["mode"] = args.zhuge_mode
    if args.zhuge_tail_decimals is not None:
        context["tail_decimals"] = args.zhuge_tail_decimals
    return context


def _run_hawkeye_radar(
    universe: dict[str, object],
    args: argparse.Namespace,
    outputs_dir: Path,
) -> tuple[dict[str, object], Path, Path, int, int]:
    metadata = load_hawkeye_metadata(_project_path(args.metadata_csv))
    stock_universe = {
        ticker: bars
        for ticker, bars in universe.items()
        if ticker not in BENCHMARK_PRIORITY
    }
    radar_results = screen_universe(
        stock_universe,
        metadata,
    )
    candidate_path = outputs_dir / "candidate_universe.csv"
    audit_path = outputs_dir / "hawkeye_radar_audit.csv"
    passed_results = [result for result in radar_results if result.passed]
    write_csv(candidate_path, [result_to_row(result) for result in passed_results], CANDIDATE_UNIVERSE_HEADERS)
    write_csv(audit_path, [result_to_row(result) for result in radar_results], CANDIDATE_UNIVERSE_HEADERS)

    passed_tickers = [result.ticker for result in passed_results]
    candidate_universe = {ticker: universe[ticker] for ticker in passed_tickers if ticker in universe}
    for ticker in BENCHMARK_PRIORITY:
        if ticker in universe:
            candidate_universe.setdefault(ticker, universe[ticker])

    return candidate_universe, candidate_path, audit_path, len(passed_tickers), len(radar_results)


def _candidate_count(universe: dict[str, object], benchmark: str | None) -> int:
    benchmarks = set(BENCHMARK_PRIORITY)
    if benchmark:
        benchmarks.add(benchmark)
    return sum(1 for ticker in universe if ticker not in benchmarks)


def _selection_gate(
    candidate_count: int,
    min_candidate_count: int,
    min_pdc_pool_size: int,
    disabled: bool,
) -> dict[str, object]:
    # A short candidate list is a market observation, not a reason to force
    # the system to stand aside.  The final gate is applied after PDC scoring:
    # only immediate-buy statuses are emitted, up to the requested Top N.
    pdc_pool_count = candidate_count
    gate_open = candidate_count > 0
    reason = (
        "candidates available; PDC status determines whether any name is buyable"
        if gate_open
        else "no Hawkeye candidates available"
    )
    return {
        "candidate_count": candidate_count,
        "min_candidate_count": min_candidate_count,
        "pdc_pool_count": pdc_pool_count,
        "min_pdc_pool_size": min_pdc_pool_size,
        "trade_gate_open": "YES" if gate_open else "NO",
        "gate_reason": reason,
        "buy_candidate_count": 0,
    }


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.list_skills:
        _print_available_skills()
        return 0

    data_dir = _project_path(args.data_dir)
    outputs_dir = _project_path(args.outputs_dir)
    logs_dir = _project_path(args.logs_dir)
    performance_db = _project_path(args.performance_db)
    performance_report = _project_path(args.performance_report)
    zhuge_context = _zhuge_context(args)

    try:
        active_weights = pdc_weights_with_zhuge(args.zhuge_weight)
        universe = load_universe_from_dir(data_dir)
        outputs_dir.mkdir(parents=True, exist_ok=True)

        if args.skill and not args.ticker:
            raise ValueError("--skill requires --ticker.")

        if args.radar_only:
            _candidate_universe, candidate_path, audit_path, passed_count, checked_count = _run_hawkeye_radar(
                universe, args, outputs_dir
            )
            print(f"Hawkeye Radar checked: {checked_count}")
            print(f"Hawkeye candidates: {passed_count}")
            print(f"Candidate universe: {candidate_path}")
            print(f"Hawkeye audit: {audit_path}")
            return 0

        if args.ticker:
            ticker, bars = find_ticker(universe, args.ticker)
            market_context = build_market_context(universe, args.benchmark)
            market_context["zhuge_orion"] = zhuge_context

            if args.skill:
                skill_key = normalize_skill_name(args.skill)
                result = run_single_skill(skill_key, ticker, bars, market_context)
                _print_member_result(skill_key, ticker, result, args.as_of)
                return 0

            evaluation = run_all_skills(ticker, bars, market_context, active_weights)
            row = report_row(evaluation, args.as_of)
            _print_all_skill_results(ticker, row, evaluation.scores)
            return 0

        active_universe = universe
        candidate_path = None
        audit_path = None
        passed_count = None
        checked_count = None
        if args.use_radar:
            active_universe, candidate_path, audit_path, passed_count, checked_count = _run_hawkeye_radar(
                universe, args, outputs_dir
            )
        candidate_count = passed_count if passed_count is not None else _candidate_count(active_universe, args.benchmark)
        selection_gate = _selection_gate(
            candidate_count,
            args.min_candidate_count,
            args.min_pdc_pool_size,
            args.disable_selection_gate,
        )

        evaluations, market_context = run_pdc_loop(
            active_universe,
            preferred_benchmark=args.benchmark,
            include_benchmark=args.include_benchmark,
            weights=active_weights,
            zhuge_context=zhuge_context,
        )
        buy_candidates = daily_instruction_rows(evaluations, market_context, args.as_of, args.top)
        selection_gate["buy_candidate_count"] = len(buy_candidates)
        if evaluations and not buy_candidates:
            selection_gate["trade_gate_open"] = "NO"
            selection_gate["gate_reason"] = "no immediate-buy PDC candidates; publish watchlist only"
        market_context["selection_gate"] = selection_gate
        if not evaluations and not args.use_radar:
            raise ValueError("No tickers left to score after benchmark filtering.")

        output_paths = save_pdc_outputs(evaluations, market_context, outputs_dir, args.as_of, args.top)
        memory_paths = record_completed_run(
            performance_db,
            performance_report,
            logs_dir,
            args.as_of,
            universe,
            evaluations,
            audit_path,
            args.performance_horizon_sessions,
        )
        top_rows = [report_row(evaluation, args.as_of) for evaluation in evaluations[: args.top]]

    except Exception as exc:
        try:
            failed_log = record_failed_run(
                logs_dir,
                performance_db,
                args.as_of,
                str(exc),
                args.performance_horizon_sessions,
            )
            print(f"Stock PDC failure audit: {failed_log}", file=sys.stderr)
        except Exception as memory_exc:
            print(f"Stock PDC failure audit also failed: {memory_exc}", file=sys.stderr)
        print(f"Stock PDC failed: {exc}", file=sys.stderr)
        return 1

    benchmark = market_context.get("benchmark") or "breadth"
    print(f"Market context: {benchmark}")
    print(
        "Experimental weights: "
        f"zhuge={active_weights['zhuge_orion']:.2%} "
        f"chair={active_weights['chair']:.2%}"
    )
    if evaluations:
        zhuge_result = evaluations[0].scores["zhuge_orion"]
        print(f"Zhuge overlay: score={zhuge_result.score} reason={zhuge_result.reason}")
    print(f"Scored tickers: {len(evaluations)}")
    print(f"Top watchlist: {output_paths['top_xlsx']}")
    print(f"Full scores: {output_paths['full_csv']}")
    print(f"History CSV: {output_paths['history_csv']}")
    print(f"HTML report: {output_paths['html_report']}")
    print(f"Daily instruction: {output_paths['daily_instruction']}")
    print(f"Instruction history: {output_paths['instruction_history']}")
    print(f"Daily watchlist: {output_paths['daily_watchlist']}")
    print(f"Watchlist history: {output_paths['watchlist_history']}")
    print(f"Daily leaderboard changes: {output_paths['daily_leaderboard_changes']}")
    print(f"Leaderboard changes history: {output_paths['leaderboard_changes_history']}")
    print(f"Leaderboard HTML: {output_paths['leaderboard_html']}")
    print(f"Positions: {output_paths['positions_csv']}")
    print(f"Position monitor: {output_paths['position_monitor']}")
    print(f"Position monitor history: {output_paths['position_monitor_history']}")
    print(f"Decision audit log: {memory_paths['log']}")
    print(f"Performance database: {memory_paths['database']}")
    print(f"Performance report: {memory_paths['report']}")
    if candidate_path is not None:
        print(f"Hawkeye candidates: {passed_count}/{checked_count}")
        print(f"Candidate universe: {candidate_path}")
        print(f"Hawkeye audit: {audit_path}")
    selection_gate = market_context.get("selection_gate") if isinstance(market_context, dict) else None
    if isinstance(selection_gate, dict):
        print(
            "Selection gate: "
            f"{selection_gate['trade_gate_open']} "
            f"candidates={selection_gate['candidate_count']} "
            f"pdc_pool={selection_gate['pdc_pool_count']} "
            f"buyable={selection_gate['buy_candidate_count']} "
            f"reason={selection_gate['gate_reason']}"
        )
    gate_open = not (
        isinstance(selection_gate, dict)
        and selection_gate.get("trade_gate_open") == "NO"
    )
    instructions = daily_instruction_rows(evaluations, market_context, args.as_of) if gate_open else []
    print("")
    print("Final recommendations:")
    if not instructions:
        print("No new buy targets today. Check the position monitor: non-target holdings sell next open unless uptrend remains intact.")
    for instruction in instructions:
        price = instruction.get("current_price") or "n/a"
        pct_change = instruction.get("current_pct_change")
        pct_change_text = f"{pct_change}%" if pct_change != "" else "n/a"
        quote_status = instruction.get("quote_status") or "UNVERIFIED"
        print(
            f"{instruction['recommendation_rank']:>2}. {instruction['ticker']:<10} "
            f"price={price} change={pct_change_text} quote={quote_status} "
            f"score={instruction['final_score']:<4} {instruction['instruction']} "
            f"trigger={instruction['trigger']} status={instruction['final_status']}"
        )
        print(
            "    members: "
            f"market={instruction['market_regime_score']} "
            f"trend={instruction['trend_score']} "
            f"breakout={instruction['livermore_breakout_score']} "
            f"volume={instruction['volume_price_score']} "
            f"candle={instruction['candlestick_score']} "
            f"overheat={instruction['overheat_score']} "
            f"risk={instruction['risk_score']} "
            f"zhuge={instruction['zhuge_orion_score']} "
            f"chair={instruction['final_chair_score']}"
        )
    print("")
    print("Top names:")
    for row in top_rows[:10]:
        print(f"{row['rank']:>2}. {row['ticker']:<10} {row['final_score']:<4} {row['final_status']}")

    return 0
