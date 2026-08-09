from __future__ import annotations

import csv
from datetime import datetime
from pathlib import Path

from .models import StockEvaluation
from .outputs import (
    DAILY_INSTRUCTION_HEADERS,
    POSITION_HEADERS,
    POSITION_MONITOR_HEADERS,
    replace_daily_csv_rows,
    write_csv,
)
from .quotes import LiveQuote

ACTIVE_POSITION_STATUSES = {"PLANNED_OPEN", "OPEN"}


def read_rows(path: Path) -> list[dict[str, str]]:
    if not path.exists() or path.stat().st_size == 0:
        return []
    with path.open("r", encoding="utf-8", newline="") as file:
        return list(csv.DictReader(file))


def write_positions(path: Path, rows: list[dict[str, object]]) -> None:
    write_csv(path, rows, POSITION_HEADERS)


def active_positions(path: Path) -> list[dict[str, str]]:
    return [
        row for row in read_rows(path)
        if row.get("status") in ACTIVE_POSITION_STATUSES
    ]


def _position_key(row: dict[str, str]) -> tuple[str, str]:
    return (row.get("ticker", ""), row.get("status", ""))


def create_planned_open_positions(
    daily_instruction_path: Path,
    positions_path: Path,
    planned_trade_date: str,
    top_n: int = 20,
    created_at: str | None = None,
    planned_session: str = "A_SHARE_OPEN",
    note: str = "",
) -> list[dict[str, object]]:
    created_at = created_at or datetime.now().astimezone().isoformat(timespec="seconds")
    instruction_rows = read_rows(daily_instruction_path)
    selected = [
        row for row in instruction_rows
        if int(row.get("recommendation_rank") or 0) <= top_n
    ]
    selected.sort(key=lambda row: int(row.get("recommendation_rank") or 0))

    existing = read_rows(positions_path)
    active_keys = {_position_key(row) for row in existing}
    new_rows: list[dict[str, object]] = []
    for row in selected:
        ticker = row.get("ticker", "")
        if not ticker or (ticker, "PLANNED_OPEN") in active_keys or (ticker, "OPEN") in active_keys:
            continue
        position_id = f"{planned_trade_date}-{ticker}-planned-open"
        reference_price = row.get("current_price") or row.get("latest_close") or ""
        reference_source = row.get("quote_source") or "local_close"
        quote_status = row.get("quote_status") or "UNVERIFIED"
        new_rows.append(
            {
                "position_id": position_id,
                "created_at": created_at,
                "status": "PLANNED_OPEN",
                "ticker": ticker,
                "planned_action": "MANUAL_BUY_AT_OPEN",
                "planned_trade_date": planned_trade_date,
                "planned_session": planned_session,
                "source_analysis_date": row.get("analysis_date", ""),
                "recommendation_rank": row.get("recommendation_rank", ""),
                "pdc_rank_at_plan": row.get("rank", ""),
                "pdc_instruction_at_plan": row.get("instruction", ""),
                "pdc_status_at_plan": row.get("final_status", ""),
                "final_score_at_plan": row.get("final_score", ""),
                "reference_price": reference_price,
                "reference_price_source": f"{reference_source}/{quote_status}",
                "reference_price_asof": row.get("quote_asof", ""),
                "breakout_trigger_at_plan": row.get("breakout_trigger", ""),
                "technical_stop_at_plan": row.get("technical_stop", ""),
                "user_plan_note": note,
                "entry_date": "",
                "entry_price": "",
                "shares": "",
                "exit_date": "",
                "exit_price": "",
                "exit_reason": "",
                "last_monitor_date": "",
                "last_sell_instruction": "",
                "last_monitor_price": "",
            }
        )

    if new_rows:
        write_positions(positions_path, [*existing, *new_rows])
    elif not positions_path.exists():
        write_positions(positions_path, existing)
    return new_rows


def _quote_value(quote: LiveQuote | None, attr: str) -> object:
    if quote is None:
        return ""
    value = getattr(quote, attr)
    return value if value is not None else ""


def _uptrend_is_intact(evaluation: StockEvaluation | None, quote: LiveQuote | None) -> bool:
    """Require both a strong PDC trend and price above its current risk line."""
    if evaluation is None or evaluation.scores["trend"].score < 7.0:
        return False
    reference_price = quote.price if quote and quote.price is not None else evaluation.latest_close
    stop = evaluation.technical_stop
    return bool(reference_price and (stop is None or reference_price >= stop))


def _position_sell_instruction(
    position: dict[str, str],
    evaluation: StockEvaluation | None,
    quote: LiveQuote | None,
    buy_target_tickers: set[str],
) -> tuple[str, str]:
    status = position.get("status", "")
    planned = status == "PLANNED_OPEN"
    ticker = position.get("ticker", "")
    if ticker in buy_target_tickers:
        action = "KEEP_PLAN_BUY_TARGET" if planned else "HOLD_BUY_TARGET"
        return action, "ticker is in tomorrow's PDC-approved buy target list"

    if evaluation is None:
        action = "CANCEL_PLAN_NOT_BUY_TARGET" if planned else "SELL_AT_NEXT_OPEN_DATA_MISSING"
        return action, "ticker is not a buy target and was not scored; do not retain an unverifiable holding"

    if not planned and _uptrend_is_intact(evaluation, quote):
        if evaluation.rank > 20:
            return (
                "HOLD_DROPPED_UPTREND",
                f"PDC rank {evaluation.rank} is outside Top 20, but trend score {evaluation.scores['trend'].score} "
                "and the technical stop both confirm the uptrend is intact",
            )
        return (
            "HOLD_NOT_BUY_TARGET_UPTREND",
            f"not in tomorrow's buy target list, but trend score {evaluation.scores['trend'].score} "
            "and the technical stop confirm the uptrend is intact",
        )

    action = "CANCEL_PLAN_NOT_BUY_TARGET" if planned else "SELL_AT_NEXT_OPEN_NOT_BUY_TARGET"
    top20_note = "outside Top 20" if evaluation.rank > 20 else "not an immediate-buy PDC status"
    return action, f"{top20_note}; trend is not intact, so exit manually at the next market open"


def build_position_monitor_rows(
    positions: list[dict[str, str]],
    evaluations: list[StockEvaluation],
    live_quotes: dict[str, LiveQuote],
    analysis_date: str,
    buy_target_tickers: set[str] | None = None,
) -> list[dict[str, object]]:
    evaluation_by_ticker = {evaluation.ticker: evaluation for evaluation in evaluations}
    buy_target_tickers = buy_target_tickers or set()
    rows: list[dict[str, object]] = []
    for position in positions:
        ticker = position.get("ticker", "")
        evaluation = evaluation_by_ticker.get(ticker)
        quote = live_quotes.get(ticker)
        sell_instruction, sell_trigger = _position_sell_instruction(position, evaluation, quote, buy_target_tickers)
        rows.append(
            {
                "analysis_date": analysis_date,
                "position_id": position.get("position_id", ""),
                "ticker": ticker,
                "position_status": position.get("status", ""),
                "planned_trade_date": position.get("planned_trade_date", ""),
                "entry_date": position.get("entry_date", ""),
                "entry_price": position.get("entry_price", ""),
                "shares": position.get("shares", ""),
                "current_price": _quote_value(quote, "price"),
                "current_pct_change": _quote_value(quote, "pct_change"),
                "quote_source": quote.source if quote else "",
                "quote_asof": quote.asof if quote else "",
                "quote_status": quote.status if quote else "UNVERIFIED",
                "final_score": evaluation.final_score if evaluation else "",
                "pdc_rank": evaluation.rank if evaluation else "",
                "top20_status": "IN_TOP20" if evaluation and evaluation.rank <= 20 else "OUT_OF_TOP20",
                "buy_target_status": "BUY_TARGET" if ticker in buy_target_tickers else "NOT_BUY_TARGET",
                "final_status": evaluation.status if evaluation else "NOT_SCORED",
                "trend_score": evaluation.scores["trend"].score if evaluation else "",
                "risk_score": evaluation.scores["risk"].score if evaluation else "",
                "overheat_score": evaluation.scores["overheat"].score if evaluation else "",
                "pdc_instruction": evaluation.suggested_action if evaluation else "",
                "sell_instruction": sell_instruction,
                "sell_trigger": sell_trigger,
                "current_technical_stop": evaluation.technical_stop if evaluation else "",
                "plan_technical_stop": position.get("technical_stop_at_plan", ""),
                "main_risk": evaluation.main_risk if evaluation else "",
                "latest_date": evaluation.latest_date if evaluation else "",
                "latest_close": evaluation.latest_close if evaluation else "",
            }
        )
    return rows


def save_position_monitor(
    positions_path: Path,
    monitor_path: Path,
    history_path: Path,
    evaluations: list[StockEvaluation],
    live_quotes: dict[str, LiveQuote],
    analysis_date: str,
    buy_target_tickers: set[str] | None = None,
) -> list[dict[str, object]]:
    all_positions = read_rows(positions_path)
    positions = [
        row for row in all_positions
        if row.get("status") in ACTIVE_POSITION_STATUSES
    ]
    rows = build_position_monitor_rows(
        positions,
        evaluations,
        live_quotes,
        analysis_date,
        buy_target_tickers,
    )
    write_csv(monitor_path, rows, POSITION_MONITOR_HEADERS)
    replace_daily_csv_rows(history_path, rows, POSITION_MONITOR_HEADERS, analysis_date)
    monitor_by_id = {str(row.get("position_id", "")): row for row in rows}
    updated_positions: list[dict[str, object]] = []
    for position in all_positions:
        monitor = monitor_by_id.get(position.get("position_id", ""))
        if monitor:
            position = {
                **position,
                "last_monitor_date": analysis_date,
                "last_sell_instruction": monitor.get("sell_instruction", ""),
                "last_monitor_price": monitor.get("current_price", ""),
            }
        updated_positions.append(position)
    if updated_positions:
        write_positions(positions_path, updated_positions)
    return rows
