from __future__ import annotations

import csv
from dataclasses import replace
from pathlib import Path
from typing import Callable

from .config import ACTION_STATUSES, DEFAULT_WEIGHTS, ENABLE_LIVE_ORDERS, SKILL_ALIASES
from .data_loader import load_universe
from .indicators import closes, sma
from .market_context import build_market_context
from .models import Bar, ScorerResult, StockEvaluation
from .outputs import (
    DAILY_INSTRUCTION_HEADERS,
    DAILY_WATCHLIST_HEADERS,
    FULL_SCORE_HEADERS,
    LEADERBOARD_CHANGE_HEADERS,
    REPORT_HEADERS,
    WATCHLIST_HISTORY_HEADERS,
    append_history_csv,
    build_leaderboard_change_rows,
    load_previous_daily_rows,
    replace_daily_csv_rows,
    write_csv,
    write_html_report,
    write_leaderboard_html,
    write_xlsx,
)
from .portfolio import active_positions, save_position_monitor
from .quotes import LiveQuote, fetch_eastmoney_quotes
from .scorers import (
    candlestick_pattern_analyst,
    final_portfolio_chair,
    livermore_breakout_trader,
    market_regime_judge,
    overheat_auditor,
    risk_manager,
    trend_follower,
    volume_price_analyst,
    zhuge_orion,
)

Scorer = Callable[[str, list[Bar], dict[str, object], dict[str, ScorerResult] | None], ScorerResult]

PDC_MEMBERS: list[tuple[str, str, Scorer]] = [
    ("market_regime", "Market Regime Judge", market_regime_judge.score),
    ("trend", "Trend Follower", trend_follower.score),
    ("livermore", "Livermore Breakout Trader", livermore_breakout_trader.score),
    ("volume_price", "Volume-Price Analyst", volume_price_analyst.score),
    ("candlestick", "Candlestick Pattern Analyst", candlestick_pattern_analyst.score),
    ("overheat", "Overheat Auditor", overheat_auditor.score),
    ("risk", "Risk Manager", risk_manager.score),
    ("zhuge_orion", "Zhuge Orion", zhuge_orion.score),
    ("chair", "Final Portfolio Chair", final_portfolio_chair.score),
]

PRE_CHAIR_MEMBERS = PDC_MEMBERS[:-1]
STATUS_POWER = {
    "Remove": 0,
    "High Risk Watch": 1,
    "Wait for Pullback": 2,
    "Watch": 3,
    "Breakout Pending": 4,
    "Trial Position": 5,
    "Strong Watch": 6,
}
POWER_STATUS = {value: key for key, value in STATUS_POWER.items()}

FRONT_DESK_INSTRUCTIONS = {
    "Strong Watch": "BUY_CANDIDATE_RESEARCH",
    "Trial Position": "BUY_CANDIDATE_RESEARCH",
    "Breakout Pending": "BUY_ON_BREAKOUT_CONFIRMATION",
    "Watch": "WATCH_ONLY",
    "Wait for Pullback": "WAIT_FOR_PULLBACK",
    "High Risk Watch": "NO_BUY_HIGH_RISK",
    "Remove": "IGNORE",
}

DEFAULT_DAILY_RECOMMENDATION_COUNT = 20
BUY_APPROVED_MANUAL = "BUY_PDC_APPROVED_MANUAL"
TOP20_PURCHASE_INSTRUCTION = "BUY_TOP20_MANUAL"
BUYABLE_STATUSES = {"Strong Watch", "Trial Position"}


def assert_live_orders_disabled() -> None:
    if ENABLE_LIVE_ORDERS:
        raise RuntimeError("Live order support is intentionally unavailable in this Stock PDC version.")


def normalize_skill_name(value: str) -> str:
    key = value.strip().lower().replace(" ", "_")
    if key not in SKILL_ALIASES:
        choices = ", ".join(sorted(SKILL_ALIASES))
        raise ValueError(f"Unknown PDC skill '{value}'. Available aliases: {choices}")
    return SKILL_ALIASES[key]


def member_label(skill_key: str) -> str:
    for key, label, _scorer in PDC_MEMBERS:
        if key == skill_key:
            return label
    return skill_key


def _score(results: dict[str, ScorerResult], key: str) -> float:
    return results[key].score


def _weighted_score(results: dict[str, ScorerResult], weights: dict[str, float]) -> float:
    total = 0.0
    for key, weight in weights.items():
        if key in results:
            total += results[key].score * weight
    return total


def _breakout_trigger(bars: list[Bar]) -> float | None:
    if len(bars) < 56:
        return None
    return round(max(bar.high for bar in bars[-56:-1]), 3)


def _technical_stop(bars: list[Bar]) -> float | None:
    if len(bars) < 20:
        return None
    latest = bars[-1].close
    close_values = closes(bars)
    low_20 = min(bar.low for bar in bars[-20:])
    stop_candidates = [low_20]
    sma50 = sma(close_values, 50)
    if sma50 and sma50 < latest:
        stop_candidates.append(sma50)
    return round(max(stop_candidates), 3)


def _front_desk_instruction(status: str) -> str:
    return FRONT_DESK_INSTRUCTIONS.get(status, "IGNORE")


def _risk_adjusted_score(final_score: float, results: dict[str, ScorerResult]) -> float:
    risk = _score(results, "risk")
    overheat = _score(results, "overheat")
    market = _score(results, "market_regime")
    candlestick = _score(results, "candlestick")
    zhuge = _score(results, "zhuge_orion")

    adjusted = final_score
    if risk <= 3.5:
        adjusted = min(adjusted, 5.0)
    if overheat <= 3.0:
        adjusted = min(adjusted, 6.2)
    if market <= 3.5:
        adjusted = min(adjusted, 6.8)
    if candlestick <= 3.2:
        adjusted = min(adjusted, 6.4)
    if zhuge <= 3.5:
        adjusted = min(adjusted, 6.5)
    return round(adjusted, 2)


def _cap_status(status: str, cap: str) -> str:
    if STATUS_POWER[status] <= STATUS_POWER[cap]:
        return status
    return cap


def _select_status(final_score: float, results: dict[str, ScorerResult]) -> str:
    trend = _score(results, "trend")
    breakout = _score(results, "livermore")
    volume_price = _score(results, "volume_price")
    candlestick = _score(results, "candlestick")
    overheat = _score(results, "overheat")
    risk = _score(results, "risk")
    market = _score(results, "market_regime")
    zhuge = _score(results, "zhuge_orion")

    if final_score < 4.6 or risk <= 3.2 or trend <= 3.2:
        status = "Remove"
    elif risk <= 4.5 or (overheat <= 4.0 and final_score >= 6.0):
        status = "High Risk Watch"
    elif trend >= 7.0 and overheat <= 5.3:
        status = "Wait for Pullback"
    elif breakout >= 8.0 and trend >= 7.0 and risk >= 6.0 and overheat >= 5.5 and candlestick >= 5.0:
        status = "Trial Position"
    elif breakout >= 7.3 and trend >= 6.8 and final_score >= 6.5 and candlestick >= 4.5:
        status = "Breakout Pending"
    elif final_score >= 8.0 and trend >= 6.0 and risk >= 5.5 and market >= 4.0:
        status = "Strong Watch"
    elif final_score >= 6.0:
        status = "Watch"
    else:
        status = "Remove"

    if market < 4.0:
        status = _cap_status(status, "Watch")
    if trend < 4.0:
        status = _cap_status(status, "Watch")
    if overheat < 4.0:
        status = _cap_status(status, "Wait for Pullback")
    if risk < 4.0:
        status = _cap_status(status, "High Risk Watch")
    if volume_price <= 3.0:
        status = _cap_status(status, "Watch")
    if candlestick <= 3.2:
        status = _cap_status(status, "Wait for Pullback")
    if zhuge <= 4.5:
        status = _cap_status(status, "Watch")
    if status not in ACTION_STATUSES:
        raise ValueError(f"Invalid final status generated: {status}")
    return status


def _main_risk(results: dict[str, ScorerResult]) -> str:
    for key in ["risk", "zhuge_orion", "overheat", "candlestick", "market_regime", "volume_price", "livermore", "trend"]:
        warning = results[key].warning
        if warning:
            return warning
    return "No major single risk flag; keep monitoring market regime and stop distance."


def _short_reason(results: dict[str, ScorerResult]) -> str:
    pieces = [results["chair"].reason, results["trend"].reason]
    if results["livermore"].score >= 7:
        pieces.append(results["livermore"].reason)
    if results["volume_price"].score >= 7:
        pieces.append(results["volume_price"].reason)
    if results["candlestick"].score >= 7:
        pieces.append(results["candlestick"].reason)
    return " | ".join(piece for piece in pieces if piece)


def _key_signal(result: ScorerResult) -> str:
    neutral_reasons = {"trend is mixed", "volume-price picture is neutral", "candlestick pattern is neutral"}
    if result.reason and result.reason.lower() not in neutral_reasons:
        return result.reason
    return result.warning or result.reason


def run_single_skill(
    skill_key: str,
    ticker: str,
    bars: list[Bar],
    market_context: dict[str, object],
) -> ScorerResult:
    normalized = normalize_skill_name(skill_key)
    previous_scores: dict[str, ScorerResult] = {}
    for key, _label, scorer in PRE_CHAIR_MEMBERS:
        if normalized == key:
            return scorer(ticker, bars, market_context, previous_scores)
        previous_scores[key] = scorer(ticker, bars, market_context, previous_scores)

    if normalized == "chair":
        return final_portfolio_chair.score(ticker, bars, market_context, previous_scores)
    raise ValueError(f"Unknown PDC skill: {skill_key}")


def run_all_skills(
    ticker: str,
    bars: list[Bar],
    market_context: dict[str, object],
    weights: dict[str, float] | None = None,
) -> StockEvaluation:
    active_weights = weights or DEFAULT_WEIGHTS
    results: dict[str, ScorerResult] = {}

    for key, _label, scorer in PRE_CHAIR_MEMBERS:
        results[key] = scorer(ticker, bars, market_context, results)

    results["chair"] = final_portfolio_chair.score(ticker, bars, market_context, results)
    final_score = _risk_adjusted_score(_weighted_score(results, active_weights), results)
    status = _select_status(final_score, results)

    return StockEvaluation(
        ticker=ticker,
        final_score=final_score,
        rank=0,
        status=status,
        suggested_action=status,
        scores=results,
        short_reason=_short_reason(results),
        main_risk=_main_risk(results),
        latest_date=bars[-1].date if bars else "",
        latest_close=round(bars[-1].close, 3) if bars else 0.0,
        breakout_trigger=_breakout_trigger(bars),
        technical_stop=_technical_stop(bars),
    )


def run_pdc_loop(
    universe: dict[str, list[Bar]],
    preferred_benchmark: str | None = None,
    include_benchmark: bool = False,
    weights: dict[str, float] | None = None,
    zhuge_context: dict[str, object] | None = None,
) -> tuple[list[StockEvaluation], dict[str, object]]:
    assert_live_orders_disabled()
    market_context = build_market_context(universe, preferred_benchmark)
    if zhuge_context is not None:
        market_context["zhuge_orion"] = zhuge_context
    benchmark = market_context.get("benchmark")
    evaluations: list[StockEvaluation] = []

    for ticker, bars in sorted(universe.items()):
        if not include_benchmark and benchmark and ticker == benchmark:
            continue
        evaluations.append(run_all_skills(ticker, bars, market_context, weights))

    latest_date = max((evaluation.latest_date for evaluation in evaluations if evaluation.latest_date), default="")
    evaluations.sort(
        key=lambda evaluation: (
            evaluation.latest_date == latest_date if latest_date else True,
            evaluation.final_score,
        ),
        reverse=True,
    )
    ranked = [replace(evaluation, rank=index) for index, evaluation in enumerate(evaluations, start=1)]
    return ranked, market_context


def report_row(evaluation: StockEvaluation, analysis_date: str) -> dict[str, object]:
    scores = evaluation.scores
    return {
        "ticker": evaluation.ticker,
        "rank": evaluation.rank,
        "final_score": evaluation.final_score,
        "final_status": evaluation.status,
        "market_regime_score": scores["market_regime"].score,
        "trend_score": scores["trend"].score,
        "livermore_breakout_score": scores["livermore"].score,
        "volume_price_score": scores["volume_price"].score,
        "candlestick_score": scores["candlestick"].score,
        "overheat_score": scores["overheat"].score,
        "risk_score": scores["risk"].score,
        "zhuge_orion_score": scores["zhuge_orion"].score,
        "final_chair_score": scores["chair"].score,
        "main_reason": evaluation.short_reason,
        "main_risk": evaluation.main_risk,
        "suggested_action_status": evaluation.suggested_action,
        "analysis_date": analysis_date,
    }


def full_score_row(evaluation: StockEvaluation, analysis_date: str) -> dict[str, object]:
    row = report_row(evaluation, analysis_date)
    skill_columns = {
        "market_regime": "market_regime",
        "trend": "trend",
        "livermore": "livermore_breakout",
        "volume_price": "volume_price",
        "candlestick": "candlestick",
        "overheat": "overheat",
        "risk": "risk",
        "zhuge_orion": "zhuge_orion",
        "chair": "final_chair",
    }
    for key, prefix in skill_columns.items():
        result = evaluation.scores[key]
        row[f"{prefix}_reason"] = result.reason
        row[f"{prefix}_warning"] = result.warning
        row[f"{prefix}_signal"] = _key_signal(result)
    return row


def watchlist_row(evaluation: StockEvaluation, analysis_date: str) -> dict[str, object]:
    row = report_row(evaluation, analysis_date)
    row["front_desk_instruction"] = _front_desk_instruction(evaluation.status)
    return row


def _instruction_trigger(evaluation: StockEvaluation) -> str:
    instruction = _front_desk_instruction(evaluation.status)
    if instruction == "BUY_CANDIDATE_RESEARCH":
        return "manual review candidate; use technical_stop as risk reference"
    if instruction == "BUY_ON_BREAKOUT_CONFIRMATION":
        if evaluation.breakout_trigger is not None:
            return f"confirm breakout above {evaluation.breakout_trigger}"
        return "confirm breakout above recent pivot"
    if instruction == "WAIT_FOR_PULLBACK":
        return "wait for price cooling or constructive pullback"
    if instruction == "NO_BUY_HIGH_RISK":
        return "do not buy while risk flag remains active"
    if instruction == "WATCH_ONLY":
        return "watch only; no purchase trigger"
    return "ignore until PDC status improves"


def _top20_purchase_trigger(evaluation: StockEvaluation) -> str:
    return (
        f"PDC-approved manual buy; rank {evaluation.rank}; "
        "review technical_stop and main_risk before execution"
    )


def _live_quote_row_fields(quote: LiveQuote | None) -> dict[str, object]:
    if quote is None:
        return {
            "current_price": "",
            "current_pct_change": "",
            "current_price_change": "",
            "current_open": "",
            "current_high": "",
            "current_low": "",
            "previous_close": "",
            "quote_source": "",
            "quote_asof": "",
            "quote_status": "UNVERIFIED",
        }
    return {
        "current_price": quote.price if quote.price is not None else "",
        "current_pct_change": quote.pct_change if quote.pct_change is not None else "",
        "current_price_change": quote.price_change if quote.price_change is not None else "",
        "current_open": quote.open if quote.open is not None else "",
        "current_high": quote.high if quote.high is not None else "",
        "current_low": quote.low if quote.low is not None else "",
        "previous_close": quote.previous_close if quote.previous_close is not None else "",
        "quote_source": quote.source,
        "quote_asof": quote.asof,
        "quote_status": quote.status,
    }


def _pdc_member_score_fields(evaluation: StockEvaluation) -> dict[str, object]:
    scores = evaluation.scores
    return {
        "market_regime_score": scores["market_regime"].score,
        "trend_score": scores["trend"].score,
        "livermore_breakout_score": scores["livermore"].score,
        "volume_price_score": scores["volume_price"].score,
        "candlestick_score": scores["candlestick"].score,
        "overheat_score": scores["overheat"].score,
        "risk_score": scores["risk"].score,
        "zhuge_orion_score": scores["zhuge_orion"].score,
        "final_chair_score": scores["chair"].score,
    }


def _daily_instruction_row(
    evaluation: StockEvaluation,
    market_context: dict[str, object],
    analysis_date: str,
    recommendation_rank: int = 1,
    quote: LiveQuote | None = None,
    immediate_buy_only: bool = True,
) -> dict[str, object]:
    return {
        "run_date": analysis_date,
        "analysis_date": analysis_date,
        "recommendation_rank": recommendation_rank,
        "instruction": BUY_APPROVED_MANUAL if immediate_buy_only else TOP20_PURCHASE_INSTRUCTION,
        "ticker": evaluation.ticker,
        "rank": evaluation.rank,
        "final_score": evaluation.final_score,
        "final_status": evaluation.status,
        **_pdc_member_score_fields(evaluation),
        "latest_date": evaluation.latest_date,
        "latest_close": evaluation.latest_close,
        **_live_quote_row_fields(quote),
        "breakout_trigger": evaluation.breakout_trigger or "",
        "technical_stop": evaluation.technical_stop or "",
        "market_context": market_context.get("benchmark") or "breadth",
        "monitor_status": "MANUAL_BUY_PDC_APPROVED" if immediate_buy_only else "MANUAL_BUY_TOP20",
        "trigger": _top20_purchase_trigger(evaluation),
        "main_risk": evaluation.main_risk,
    }


def daily_instruction_rows(
    evaluations: list[StockEvaluation],
    market_context: dict[str, object],
    analysis_date: str,
    top_n: int = DEFAULT_DAILY_RECOMMENDATION_COUNT,
    immediate_buy_only: bool = True,
) -> list[dict[str, object]]:
    source_evaluations = _daily_recommendation_evaluations(evaluations, top_n)
    if immediate_buy_only:
        source_evaluations = [
            evaluation for evaluation in source_evaluations if evaluation.status in BUYABLE_STATUSES
        ]
    live_quotes = market_context.get("live_quotes")
    if not isinstance(live_quotes, dict):
        live_quotes = {}
    return [
        _daily_instruction_row(
            evaluation,
            market_context,
            analysis_date,
            recommendation_rank,
            live_quotes.get(evaluation.ticker),
            immediate_buy_only,
        )
        for recommendation_rank, evaluation in enumerate(source_evaluations[:top_n], start=1)
    ]


def _daily_recommendation_evaluations(
    evaluations: list[StockEvaluation],
    top_n: int = DEFAULT_DAILY_RECOMMENDATION_COUNT,
) -> list[StockEvaluation]:
    latest_date = max((evaluation.latest_date for evaluation in evaluations if evaluation.latest_date), default="")
    fresh_evaluations = [
        evaluation for evaluation in evaluations
        if not latest_date or evaluation.latest_date == latest_date
    ]
    return (fresh_evaluations or evaluations)[:top_n]


def daily_instruction_row(
    evaluations: list[StockEvaluation],
    market_context: dict[str, object],
    analysis_date: str,
) -> dict[str, object]:
    return daily_instruction_rows(evaluations, market_context, analysis_date, top_n=1)[0]


def load_universe_from_dir(data_dir: Path) -> dict[str, list[Bar]]:
    return load_universe(data_dir)


def find_ticker(universe: dict[str, list[Bar]], ticker: str) -> tuple[str, list[Bar]]:
    normalized = ticker.upper()
    if normalized in universe:
        return normalized, universe[normalized]
    available = ", ".join(sorted(universe)[:20])
    raise ValueError(f"Ticker '{ticker}' not found. First available tickers: {available}")


def _load_ticker_names(outputs_dir: Path) -> dict[str, str]:
    universe_csv = outputs_dir.parent / "outputs_a_share" / "a_share_universe.csv"
    if not universe_csv.exists():
        return {}

    with universe_csv.open("r", encoding="utf-8-sig", newline="") as file:
        return {
            row["ticker"]: row.get("name", "")
            for row in csv.DictReader(file)
            if row.get("ticker")
        }


def save_pdc_outputs(
    evaluations: list[StockEvaluation],
    market_context: dict[str, object],
    outputs_dir: Path,
    analysis_date: str,
    top_n: int = 20,
) -> dict[str, Path]:
    outputs_dir.mkdir(parents=True, exist_ok=True)
    full_rows = [full_score_row(evaluation, analysis_date) for evaluation in evaluations]
    report_rows = [report_row(evaluation, analysis_date) for evaluation in evaluations]
    watchlist_rows = [watchlist_row(evaluation, analysis_date) for evaluation in evaluations[:top_n]]
    watchlist_history_rows = [{"run_date": analysis_date, **row} for row in watchlist_rows]
    ticker_names = _load_ticker_names(outputs_dir)
    selection_gate = market_context.get("selection_gate")
    gate_open = not (
        isinstance(selection_gate, dict)
        and selection_gate.get("trade_gate_open") == "NO"
    )
    recommended_evaluations = _daily_recommendation_evaluations(
        evaluations,
        DEFAULT_DAILY_RECOMMENDATION_COUNT,
    ) if gate_open else []
    portfolio_dir = outputs_dir.parent / "portfolio"
    positions_csv = portfolio_dir / "positions.csv"
    position_monitor = portfolio_dir / "position_monitor.csv"
    position_monitor_history = portfolio_dir / "position_monitor_history.csv"
    tracked_positions = active_positions(positions_csv)
    quote_tickers = {
        evaluation.ticker for evaluation in recommended_evaluations
    } | {
        position.get("ticker", "") for position in tracked_positions if position.get("ticker")
    }
    try:
        market_context["live_quotes"] = fetch_eastmoney_quotes(sorted(quote_tickers))
    except Exception as exc:
        market_context["live_quotes"] = {}
        market_context["live_quote_error"] = str(exc)
    instruction_rows = daily_instruction_rows(evaluations, market_context, analysis_date) if gate_open else []
    buy_target_tickers = {str(row["ticker"]) for row in instruction_rows if row.get("ticker")}
    top_rows = report_rows[:top_n]

    top_xlsx = outputs_dir / "a_share_top20.xlsx"
    full_csv = outputs_dir / "full_pdc_scores.csv"
    history_csv = outputs_dir / "scoring_history.csv"
    html_report = outputs_dir / "pdc_report.html"
    daily_instruction = outputs_dir / "daily_purchase_instruction.csv"
    instruction_history = outputs_dir / "purchase_instruction_history.csv"
    daily_watchlist = outputs_dir / "daily_watchlists" / f"watchlist_{analysis_date}.csv"
    watchlist_history = outputs_dir / "watchlist_history.csv"
    daily_leaderboard_changes = outputs_dir / "daily_leaderboard_changes" / f"leaderboard_changes_{analysis_date}.csv"
    leaderboard_changes_history = outputs_dir / "leaderboard_changes_history.csv"
    leaderboard_html = outputs_dir / "leaderboard.html"
    live_quotes = market_context.get("live_quotes")
    if not isinstance(live_quotes, dict):
        live_quotes = {}
    _previous_run_date, previous_watchlist_rows = load_previous_daily_rows(watchlist_history, analysis_date)
    leaderboard_change_rows = build_leaderboard_change_rows(
        watchlist_rows,
        previous_watchlist_rows,
        analysis_date,
        ticker_names,
    )

    write_xlsx(top_xlsx, top_rows, REPORT_HEADERS)
    write_csv(full_csv, full_rows, FULL_SCORE_HEADERS)
    append_history_csv(history_csv, report_rows, analysis_date)
    write_html_report(html_report, top_rows, market_context, analysis_date)
    write_leaderboard_html(leaderboard_html, watchlist_rows, leaderboard_change_rows, market_context, analysis_date, ticker_names)
    write_csv(daily_instruction, instruction_rows, DAILY_INSTRUCTION_HEADERS)
    replace_daily_csv_rows(instruction_history, instruction_rows, DAILY_INSTRUCTION_HEADERS, analysis_date)
    write_csv(daily_watchlist, watchlist_rows, DAILY_WATCHLIST_HEADERS)
    replace_daily_csv_rows(watchlist_history, watchlist_history_rows, WATCHLIST_HISTORY_HEADERS, analysis_date)
    write_csv(daily_leaderboard_changes, leaderboard_change_rows, LEADERBOARD_CHANGE_HEADERS)
    replace_daily_csv_rows(
        leaderboard_changes_history,
        leaderboard_change_rows,
        LEADERBOARD_CHANGE_HEADERS,
        analysis_date,
    )
    if tracked_positions or positions_csv.exists():
        save_position_monitor(
            positions_csv,
            position_monitor,
            position_monitor_history,
            evaluations,
            live_quotes,
            analysis_date,
            buy_target_tickers,
        )

    return {
        "top_xlsx": top_xlsx,
        "full_csv": full_csv,
        "history_csv": history_csv,
        "html_report": html_report,
        "daily_instruction": daily_instruction,
        "instruction_history": instruction_history,
        "daily_watchlist": daily_watchlist,
        "watchlist_history": watchlist_history,
        "daily_leaderboard_changes": daily_leaderboard_changes,
        "leaderboard_changes_history": leaderboard_changes_history,
        "leaderboard_html": leaderboard_html,
        "positions_csv": positions_csv,
        "position_monitor": position_monitor,
        "position_monitor_history": position_monitor_history,
    }
