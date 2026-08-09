from __future__ import annotations

import argparse
import csv
import statistics
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from stock_pdc.config import (
    DEFAULT_ZHUGE_ORION_PROFILE,
    DEFAULT_SELECTION_GATE_MIN_CANDIDATES,
    DEFAULT_SELECTION_GATE_MIN_PDC_POOL,
    pdc_weights_with_zhuge,
)
from stock_pdc.data_loader import load_universe
from stock_pdc.hawkeye_radar import HawkeyeMetadata, load_hawkeye_metadata, result_to_row, screen_universe
from stock_pdc.models import Bar
from stock_pdc.pdc_orchestrator import daily_instruction_rows, run_pdc_loop


MEMBER_SCORE_COLUMNS = [
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


LIMIT_TOLERANCE_PCT = 0.15


def _project_path(value: str) -> Path:
    path = Path(value)
    if path.is_absolute():
        return path
    return PROJECT_ROOT / path


def _load_ticker_names(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        return {
            row["ticker"]: row.get("name", "")
            for row in csv.DictReader(file)
            if row.get("ticker")
        }


def _trading_dates(universe: dict[str, list[Bar]], start: str, end: str, benchmark: str) -> list[str]:
    if benchmark in universe:
        source = universe[benchmark]
    else:
        source = max(universe.values(), key=len)
    return [bar.date for bar in source if start <= bar.date <= end]


def _truncate_universe(universe: dict[str, list[Bar]], as_of: str, min_bars: int) -> dict[str, list[Bar]]:
    truncated: dict[str, list[Bar]] = {}
    for ticker, bars in universe.items():
        history = [bar for bar in bars if bar.date <= as_of]
        if len(history) >= min_bars:
            truncated[ticker] = history
    return truncated


def _bar_index_by_date(bars: list[Bar]) -> dict[str, int]:
    return {bar.date: index for index, bar in enumerate(bars)}


def _forward_trade_return(
    bars: list[Bar],
    signal_date: str,
    hold_days: int,
) -> tuple[str, float, str, float, float] | None:
    index = _bar_index_by_date(bars).get(signal_date)
    if index is None:
        return None
    entry_index = index + 1
    exit_index = entry_index + hold_days - 1
    if entry_index >= len(bars) or exit_index >= len(bars):
        return None
    entry = bars[entry_index]
    exit_bar = bars[exit_index]
    if entry.open == 0:
        return None
    return (
        entry.date,
        round(entry.open, 4),
        exit_bar.date,
        round(exit_bar.close, 4),
        round((exit_bar.close / entry.open - 1.0) * 100.0, 4),
    )


def _month_end_trade_return(
    bars: list[Bar],
    signal_date: str,
    month_end_date: str,
) -> tuple[str, float, str, float, float] | None:
    indexes = _bar_index_by_date(bars)
    signal_index = indexes.get(signal_date)
    exit_index = indexes.get(month_end_date)
    if signal_index is None or exit_index is None:
        return None
    entry_index = signal_index + 1
    if entry_index >= len(bars) or exit_index <= entry_index:
        return None
    entry = bars[entry_index]
    exit_bar = bars[exit_index]
    if entry.open == 0:
        return None
    return (
        entry.date,
        round(entry.open, 4),
        exit_bar.date,
        round(exit_bar.close, 4),
        round((exit_bar.close / entry.open - 1.0) * 100.0, 4),
    )


def _pct(value: float) -> float:
    return round(value, 4)


def _parse_csv_set(value: str) -> set[str]:
    return {item.strip() for item in value.split(",") if item.strip()}


def _filter_entry_instructions(
    instructions: list[dict[str, object]],
    allowed_instructions: set[str],
    min_overheat_score: float | None,
) -> list[dict[str, object]]:
    filtered: list[dict[str, object]] = []
    for instruction in instructions:
        if allowed_instructions and str(instruction.get("instruction", "")) not in allowed_instructions:
            continue
        if min_overheat_score is not None:
            try:
                overheat_score = float(instruction.get("overheat_score", ""))
            except (TypeError, ValueError):
                continue
            if overheat_score < min_overheat_score:
                continue
        filtered.append(instruction)
    return filtered


def _summarize_returns(rows: list[dict[str, object]], horizons: list[int]) -> list[dict[str, object]]:
    summary: list[dict[str, object]] = []
    for hold_days in horizons:
        column = f"return_{hold_days}d_pct"
        values = [float(row[column]) for row in rows if row.get(column) not in ("", None)]
        daily_values: list[float] = []
        by_date: dict[str, list[float]] = {}
        for row in rows:
            value = row.get(column)
            if value in ("", None):
                continue
            by_date.setdefault(str(row["signal_date"]), []).append(float(value))
        for values_for_day in by_date.values():
            if values_for_day:
                daily_values.append(sum(values_for_day) / len(values_for_day))

        if not values:
            summary.append(
                {
                    "horizon": f"{hold_days}d",
                    "trade_count": 0,
                    "signal_days": 0,
                    "avg_trade_return_pct": "",
                    "median_trade_return_pct": "",
                    "win_rate_pct": "",
                    "avg_daily_top_return_pct": "",
                    "best_trade_return_pct": "",
                    "worst_trade_return_pct": "",
                }
            )
            continue

        wins = sum(1 for value in values if value > 0)
        summary.append(
            {
                "horizon": f"{hold_days}d",
                "trade_count": len(values),
                "signal_days": len(daily_values),
                "avg_trade_return_pct": _pct(sum(values) / len(values)),
                "median_trade_return_pct": _pct(statistics.median(values)),
                "win_rate_pct": _pct(wins / len(values) * 100.0),
                "avg_daily_top_return_pct": _pct(sum(daily_values) / len(daily_values)) if daily_values else "",
                "best_trade_return_pct": _pct(max(values)),
                "worst_trade_return_pct": _pct(min(values)),
            }
        )
    return summary


def _write_csv(path: Path, rows: list[dict[str, object]], headers: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=headers, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def _selection_gate_row(
    signal_date: str,
    candidate_count: int,
    pdc_pool_count: int,
    min_candidate_count: int,
    min_pdc_pool_size: int,
    recommendation_count: int,
    disabled: bool,
    candidate_mode: str,
    ignored_market_cap: bool,
    candidate_tickers: list[str],
    pdc_pool_tickers: list[str],
) -> dict[str, object]:
    if disabled:
        gate_open = True
        reason = "selection gate disabled"
    elif candidate_count < min_candidate_count:
        gate_open = False
        reason = f"candidate_count {candidate_count} < {min_candidate_count}"
    elif pdc_pool_count < min_pdc_pool_size:
        gate_open = False
        reason = f"pdc_pool_count {pdc_pool_count} < {min_pdc_pool_size}"
    else:
        gate_open = True
        reason = "candidate breadth sufficient"

    return {
        "signal_date": signal_date,
        "candidate_count": candidate_count,
        "min_candidate_count": min_candidate_count,
        "pdc_pool_count": pdc_pool_count,
        "min_pdc_pool_size": min_pdc_pool_size,
        "trade_gate_open": "YES" if gate_open else "NO",
        "gate_reason": reason,
        "candidate_mode": candidate_mode,
        "ignored_market_cap": ignored_market_cap,
        "candidate_tickers": ";".join(candidate_tickers),
        "pdc_pool_tickers": ";".join(pdc_pool_tickers),
        "recommendation_count": recommendation_count if gate_open else 0,
    }


def _candidate_screen(
    truncated: dict[str, list[Bar]],
    metadata: dict[str, HawkeyeMetadata],
    benchmark: str,
) -> list[dict[str, object]]:
    stock_universe = {
        ticker: bars
        for ticker, bars in truncated.items()
        if ticker != benchmark
    }
    return [
        result_to_row(result)
        for result in screen_universe(
            stock_universe,
            metadata,
        )
    ]


def _bar_on_date(bars: list[Bar], date: str) -> Bar | None:
    for bar in bars:
        if bar.date == date:
            return bar
    return None


def _bar_on_or_before(bars: list[Bar], date: str) -> Bar | None:
    for bar in reversed(bars):
        if bar.date <= date:
            return bar
    return None


def _mark_to_market(
    positions: dict[str, float],
    universe: dict[str, list[Bar]],
    date: str,
    cash: float,
    price_field: str = "close",
) -> float:
    equity = cash
    for ticker, shares in positions.items():
        bar = _bar_on_date(universe[ticker], date) or _bar_on_or_before(universe[ticker], date)
        if bar is None:
            continue
        price = getattr(bar, price_field)
        equity += shares * price
    return equity


def _previous_bar(bars: list[Bar], date: str) -> Bar | None:
    indexes = _bar_index_by_date(bars)
    index = indexes.get(date)
    if index is None or index == 0:
        return None
    return bars[index - 1]


def _daily_limit_rate(ticker: str, name: str) -> float:
    upper_name = name.upper()
    if "ST" in upper_name:
        return 0.05
    code = ticker.split(".")[0]
    if code.startswith(("300", "301", "688", "689")):
        return 0.20
    if ticker.endswith(".BJ") or code.startswith(("4", "8", "920")):
        return 0.30
    return 0.10


def _is_limit_move(
    ticker: str,
    name: str,
    bars: list[Bar],
    date: str,
    price: float,
    direction: str,
    tolerance_pct: float,
) -> tuple[bool, float, float | None]:
    previous = _previous_bar(bars, date)
    if previous is None or previous.close <= 0:
        return False, _daily_limit_rate(ticker, name), None
    limit_rate = _daily_limit_rate(ticker, name)
    tolerance = tolerance_pct / 100.0
    move = price / previous.close - 1.0
    if direction == "up":
        return move >= limit_rate - tolerance, limit_rate, previous.close
    return move <= -limit_rate + tolerance, limit_rate, previous.close


def _max_drawdown(curve_rows: list[dict[str, object]]) -> float:
    peak = 1.0
    max_dd = 0.0
    for row in curve_rows:
        equity = float(row["equity"])
        peak = max(peak, equity)
        if peak:
            max_dd = min(max_dd, equity / peak - 1.0)
    return _pct(max_dd * 100.0)


def _simulate_membership_portfolio(
    top_by_date: dict[str, list[dict[str, object]]],
    evaluation_signals_by_date: dict[str, dict[str, dict[str, object]]],
    universe: dict[str, list[Bar]],
    dates: list[str],
    ticker_names: dict[str, str],
    gate_by_date: dict[str, dict[str, object]] | None = None,
    hold_dropped_up_day: bool = False,
    commission_bps: float = 0.0,
    slippage_bps: float = 0.0,
    sell_stamp_duty_bps: float = 0.0,
    strict_action_contract: bool = False,
) -> tuple[list[dict[str, object]], list[dict[str, object]], list[dict[str, object]], dict[str, object]]:
    cash = 1.0
    positions: dict[str, float] = {}
    curve_rows: list[dict[str, object]] = []
    trade_rows: list[dict[str, object]] = []
    previous_equity = 1.0
    total_buys = 0
    total_sells = 0

    for index, signal_date in enumerate(dates[:-1]):
        target_rows = top_by_date.get(signal_date, [])
        execution_date = dates[index + 1]
        target = [str(row["ticker"]) for row in target_rows]
        target_set = set(target)

        if target_rows or strict_action_contract:
            for ticker in list(positions):
                if ticker in target_set:
                    continue
                evaluation_signal = evaluation_signals_by_date.get(signal_date, {}).get(ticker)
                if strict_action_contract and evaluation_signal is not None:
                    trend_score = float(evaluation_signal.get("trend_score") or 0.0)
                    latest_close = float(evaluation_signal.get("latest_close") or 0.0)
                    technical_stop = float(evaluation_signal.get("technical_stop") or 0.0)
                    if trend_score >= 7.0 and latest_close > 0 and (technical_stop <= 0 or latest_close >= technical_stop):
                        continue
                elif hold_dropped_up_day:
                    signal_bar = _bar_on_date(universe[ticker], signal_date)
                    previous_bar = _previous_bar(universe[ticker], signal_date)
                    if signal_bar is not None and previous_bar is not None and signal_bar.close > previous_bar.close:
                        continue
                bar = _bar_on_date(universe[ticker], execution_date)
                if bar is None:
                    continue
                shares = positions.pop(ticker)
                execution_price = bar.open * (1.0 - slippage_bps / 10_000.0)
                value = shares * execution_price
                fees = value * (commission_bps + sell_stamp_duty_bps) / 10_000.0
                cash += value - fees
                total_sells += 1
                trade_rows.append(
                    {
                        "signal_date": signal_date,
                        "execution_date": execution_date,
                        "action": "SELL_DROPPED",
                        "ticker": ticker,
                        "name": ticker_names.get(ticker, ""),
                        "price": round(execution_price, 4),
                        "shares": round(shares, 8),
                        "value": round(value, 8),
                        "fees": round(fees, 8),
                        "action_reason": "dropped and signal day was non-up or unverifiable" if hold_dropped_up_day else "dropped",
                        "cash_after": round(cash, 8),
                    }
                )

            new_tickers = [ticker for ticker in target if ticker not in positions and ticker in universe]
            if new_tickers:
                allocation = cash / len(new_tickers)
                if allocation <= 1e-12:
                    new_tickers = []
                for ticker in new_tickers:
                    bar = _bar_on_date(universe[ticker], execution_date)
                    if bar is None or bar.open == 0:
                        continue
                    execution_price = bar.open * (1.0 + slippage_bps / 10_000.0)
                    shares = allocation / (execution_price * (1.0 + commission_bps / 10_000.0))
                    value = shares * execution_price
                    fees = value * commission_bps / 10_000.0
                    positions[ticker] = positions.get(ticker, 0.0) + shares
                    cash -= value + fees
                    total_buys += 1
                    trade_rows.append(
                        {
                            "signal_date": signal_date,
                            "execution_date": execution_date,
                            "action": "BUY_NEW",
                            "ticker": ticker,
                            "name": ticker_names.get(ticker, ""),
                            "price": round(execution_price, 4),
                            "shares": round(shares, 8),
                            "value": round(value, 8),
                            "fees": round(fees, 8),
                            "action_reason": "complete PDC entry gate passed",
                            "cash_after": round(cash, 8),
                        }
                    )

        equity = _mark_to_market(positions, universe, execution_date, cash)
        daily_return = equity / previous_equity - 1.0 if previous_equity else 0.0
        previous_equity = equity
        gate = (gate_by_date or {}).get(signal_date, {})
        curve_rows.append(
            {
                "signal_date": signal_date,
                "execution_date": execution_date,
                "equity": round(equity, 8),
                "daily_return_pct": _pct(daily_return * 100.0),
                "cash": round(cash, 8),
                "holding_count": len(positions),
                "holdings": ";".join(sorted(positions)),
                "trade_gate_open": gate.get("trade_gate_open", ""),
                "gate_reason": gate.get("gate_reason", ""),
            }
        )

    final_date = curve_rows[-1]["execution_date"] if curve_rows else ""
    final_equity = float(curve_rows[-1]["equity"]) if curve_rows else 1.0
    holdings_rows: list[dict[str, object]] = []
    for ticker, shares in sorted(positions.items()):
        bar = _bar_on_date(universe[ticker], str(final_date))
        if bar is None:
            continue
        value = shares * bar.close
        holdings_rows.append(
            {
                "date": final_date,
                "ticker": ticker,
                "name": ticker_names.get(ticker, ""),
                "shares": round(shares, 8),
                "close": round(bar.close, 4),
                "value": round(value, 8),
                "weight_pct": _pct(value / final_equity * 100.0) if final_equity else "",
            }
        )

    win_days = sum(1 for row in curve_rows if float(row["daily_return_pct"]) > 0)
    summary = {
        "strategy": "top_membership_replacement",
        "start_signal_date": dates[0] if dates else "",
        "final_date": final_date,
        "trading_days": len(curve_rows),
        "final_equity": round(final_equity, 8),
        "total_return_pct": _pct((final_equity - 1.0) * 100.0),
        "max_drawdown_pct": _max_drawdown(curve_rows),
        "win_day_pct": _pct(win_days / len(curve_rows) * 100.0) if curve_rows else "",
        "buy_count": total_buys,
        "sell_count": total_sells,
        "ending_cash": round(cash, 8),
        "hold_dropped_up_day": hold_dropped_up_day,
        "commission_bps_per_side": commission_bps,
        "slippage_bps_per_side": slippage_bps,
        "sell_stamp_duty_bps": sell_stamp_duty_bps,
        "strict_action_contract": strict_action_contract,
    }
    return curve_rows, trade_rows, holdings_rows, summary


def _position_shares(positions: dict[str, dict[str, object]]) -> dict[str, float]:
    return {ticker: float(position["shares"]) for ticker, position in positions.items()}


def _simulate_trailing_stop_portfolio(
    top_by_date: dict[str, list[dict[str, object]]],
    universe: dict[str, list[Bar]],
    dates: list[str],
    ticker_names: dict[str, str],
    max_positions: int,
    trailing_stop_pct: float,
    allocation_mode: str,
    limit_trade_model: str,
    limit_tolerance_pct: float,
    gate_by_date: dict[str, dict[str, object]] | None = None,
) -> tuple[list[dict[str, object]], list[dict[str, object]], list[dict[str, object]], dict[str, object]]:
    cash = 1.0
    positions: dict[str, dict[str, object]] = {}
    curve_rows: list[dict[str, object]] = []
    trade_rows: list[dict[str, object]] = []
    previous_equity = 1.0
    total_buys = 0
    total_sells = 0
    blocked_buys = 0
    blocked_sells = 0
    stop_multiplier = 1.0 - trailing_stop_pct / 100.0

    def sell_position(
        signal_date: str,
        execution_date: str,
        ticker: str,
        action: str,
        price: float,
        peak_price: float,
        stop_price: float,
    ) -> None:
        nonlocal cash, total_sells
        position = positions.pop(ticker)
        shares = float(position["shares"])
        value = shares * price
        cash += value
        total_sells += 1
        trade_rows.append(
            {
                "signal_date": signal_date,
                "execution_date": execution_date,
                "action": action,
                "ticker": ticker,
                "name": ticker_names.get(ticker, ""),
                "price": round(price, 4),
                "shares": round(shares, 8),
                "value": round(value, 8),
                "cash_after": round(cash, 8),
                "entry_date": position.get("entry_date", ""),
                "entry_price": round(float(position.get("entry_price", 0.0)), 4),
                "peak_price": round(peak_price, 4),
                "stop_price": round(stop_price, 4),
                "trailing_stop_pct": _pct(trailing_stop_pct),
            }
        )

    def record_blocked_trade(
        signal_date: str,
        execution_date: str,
        ticker: str,
        action: str,
        price: float,
        reason: str,
        limit_rate: float,
        reference_close: float | None,
        peak_price: float | None = None,
        stop_price: float | None = None,
    ) -> None:
        position = positions.get(ticker)
        shares = float(position["shares"]) if position else 0.0
        trade_rows.append(
            {
                "signal_date": signal_date,
                "execution_date": execution_date,
                "action": action,
                "ticker": ticker,
                "name": ticker_names.get(ticker, ""),
                "price": round(price, 4),
                "shares": round(shares, 8) if shares else "",
                "value": "",
                "cash_after": round(cash, 8),
                "entry_date": position.get("entry_date", "") if position else "",
                "entry_price": round(float(position.get("entry_price", 0.0)), 4) if position else "",
                "peak_price": round(peak_price, 4) if peak_price is not None else "",
                "stop_price": round(stop_price, 4) if stop_price is not None else "",
                "trailing_stop_pct": _pct(trailing_stop_pct),
                "block_reason": reason,
                "limit_rate_pct": _pct(limit_rate * 100.0),
                "limit_reference_close": round(reference_close, 4) if reference_close is not None else "",
            }
        )

    for index, signal_date in enumerate(dates[:-1]):
        execution_date = dates[index + 1]
        stopped_today: set[str] = set()
        blocked_today: set[str] = set()

        for ticker in list(positions):
            bar = _bar_on_date(universe[ticker], execution_date)
            if bar is None:
                continue
            peak_price = float(positions[ticker]["peak_price"])
            stop_price = peak_price * stop_multiplier
            if bar.open <= stop_price:
                is_limit_down, limit_rate, reference_close = _is_limit_move(
                    ticker,
                    ticker_names.get(ticker, ""),
                    universe[ticker],
                    execution_date,
                    bar.open,
                    "down",
                    limit_tolerance_pct,
                )
                if limit_trade_model != "none" and is_limit_down:
                    blocked_sells += 1
                    blocked_today.add(ticker)
                    record_blocked_trade(
                        signal_date,
                        execution_date,
                        ticker,
                        "BLOCKED_SELL_LIMIT_DOWN_GAP",
                        bar.open,
                        "open at or near limit-down; trailing-stop sell treated as not executable",
                        limit_rate,
                        reference_close,
                        peak_price,
                        stop_price,
                    )
                    continue
                sell_position(
                    signal_date,
                    execution_date,
                    ticker,
                    "SELL_TRAILING_STOP_GAP",
                    bar.open,
                    peak_price,
                    stop_price,
                )
                stopped_today.add(ticker)

        target_rows = top_by_date.get(signal_date, [])
        target = [str(row["ticker"]) for row in target_rows if str(row["ticker"]) in universe]
        new_tickers: list[str] = []
        capacity = max(0, max_positions - len(positions))
        for ticker in target:
            if capacity <= 0:
                break
            if ticker in positions or ticker in stopped_today:
                continue
            new_tickers.append(ticker)
            capacity -= 1

        if new_tickers and cash > 0:
            if allocation_mode == "slot_equal":
                open_equity = _mark_to_market(
                    _position_shares(positions),
                    universe,
                    execution_date,
                    cash,
                    price_field="open",
                )
                allocation = open_equity / max_positions if max_positions else cash
            else:
                allocation = cash / len(new_tickers)
            for ticker in new_tickers:
                bar = _bar_on_date(universe[ticker], execution_date)
                if bar is None or bar.open == 0:
                    continue
                is_limit_up, limit_rate, reference_close = _is_limit_move(
                    ticker,
                    ticker_names.get(ticker, ""),
                    universe[ticker],
                    execution_date,
                    bar.open,
                    "up",
                    limit_tolerance_pct,
                )
                if limit_trade_model != "none" and is_limit_up:
                    blocked_buys += 1
                    record_blocked_trade(
                        signal_date,
                        execution_date,
                        ticker,
                        "BLOCKED_BUY_LIMIT_UP",
                        bar.open,
                        "open at or near limit-up; next-open buy treated as not executable",
                        limit_rate,
                        reference_close,
                    )
                    continue
                value = min(cash, allocation)
                if value <= 0:
                    continue
                shares = value / bar.open
                value = shares * bar.open
                positions[ticker] = {
                    "shares": shares,
                    "entry_signal_date": signal_date,
                    "entry_date": execution_date,
                    "entry_price": bar.open,
                    "peak_price": bar.open,
                }
                cash -= value
                total_buys += 1
                trade_rows.append(
                    {
                        "signal_date": signal_date,
                        "execution_date": execution_date,
                        "action": "BUY_TOP_AVAILABLE_SLOT",
                        "ticker": ticker,
                        "name": ticker_names.get(ticker, ""),
                        "price": round(bar.open, 4),
                        "shares": round(shares, 8),
                        "value": round(value, 8),
                        "cash_after": round(cash, 8),
                        "entry_date": execution_date,
                        "entry_price": round(bar.open, 4),
                        "peak_price": round(bar.open, 4),
                        "stop_price": round(bar.open * stop_multiplier, 4),
                        "trailing_stop_pct": _pct(trailing_stop_pct),
                    }
                )

        for ticker in list(positions):
            if ticker in blocked_today:
                continue
            bar = _bar_on_date(universe[ticker], execution_date)
            if bar is None:
                continue
            position = positions[ticker]
            current_peak = max(float(position["peak_price"]), bar.open)
            stop_price = current_peak * stop_multiplier
            if bar.low <= stop_price:
                is_limit_down_low, limit_rate, reference_close = _is_limit_move(
                    ticker,
                    ticker_names.get(ticker, ""),
                    universe[ticker],
                    execution_date,
                    bar.low,
                    "down",
                    limit_tolerance_pct,
                )
                is_limit_down_close, _, _ = _is_limit_move(
                    ticker,
                    ticker_names.get(ticker, ""),
                    universe[ticker],
                    execution_date,
                    bar.close,
                    "down",
                    limit_tolerance_pct,
                )
                if limit_trade_model != "none" and is_limit_down_low and is_limit_down_close:
                    blocked_sells += 1
                    blocked_today.add(ticker)
                    record_blocked_trade(
                        signal_date,
                        execution_date,
                        ticker,
                        "BLOCKED_SELL_LIMIT_DOWN_INTRADAY",
                        bar.low,
                        "intraday stop hit while stock closed at or near limit-down; sell treated as not executable",
                        limit_rate,
                        reference_close,
                        current_peak,
                        stop_price,
                    )
                    continue
                sell_position(
                    signal_date,
                    execution_date,
                    ticker,
                    "SELL_TRAILING_STOP",
                    stop_price,
                    current_peak,
                    stop_price,
                )
                stopped_today.add(ticker)
                continue
            position["peak_price"] = max(current_peak, bar.high)

        equity = _mark_to_market(_position_shares(positions), universe, execution_date, cash)
        daily_return = equity / previous_equity - 1.0 if previous_equity else 0.0
        previous_equity = equity
        gate = (gate_by_date or {}).get(signal_date, {})
        curve_rows.append(
            {
                "signal_date": signal_date,
                "execution_date": execution_date,
                "equity": round(equity, 8),
                "daily_return_pct": _pct(daily_return * 100.0),
                "cash": round(cash, 8),
                "holding_count": len(positions),
                "holdings": ";".join(sorted(positions)),
                "stopped_tickers": ";".join(sorted(stopped_today)),
                "blocked_tickers": ";".join(sorted(blocked_today)),
                "trade_gate_open": gate.get("trade_gate_open", ""),
                "gate_reason": gate.get("gate_reason", ""),
            }
        )

    final_date = curve_rows[-1]["execution_date"] if curve_rows else ""
    final_equity = float(curve_rows[-1]["equity"]) if curve_rows else 1.0
    holdings_rows: list[dict[str, object]] = []
    for ticker, position in sorted(positions.items()):
        bar = _bar_on_date(universe[ticker], str(final_date))
        if bar is None:
            continue
        shares = float(position["shares"])
        value = shares * bar.close
        peak_price = float(position["peak_price"])
        holdings_rows.append(
            {
                "date": final_date,
                "ticker": ticker,
                "name": ticker_names.get(ticker, ""),
                "shares": round(shares, 8),
                "entry_date": position.get("entry_date", ""),
                "entry_price": round(float(position.get("entry_price", 0.0)), 4),
                "close": round(bar.close, 4),
                "peak_price": round(peak_price, 4),
                "trailing_stop_price": round(peak_price * stop_multiplier, 4),
                "value": round(value, 8),
                "weight_pct": _pct(value / final_equity * 100.0) if final_equity else "",
            }
        )

    win_days = sum(1 for row in curve_rows if float(row["daily_return_pct"]) > 0)
    summary = {
        "strategy": "top_entries_trailing_stop",
        "trailing_stop_pct": _pct(trailing_stop_pct),
        "allocation_mode": allocation_mode,
        "limit_trade_model": limit_trade_model,
        "limit_tolerance_pct": _pct(limit_tolerance_pct),
        "stop_model": "daily_confirmed_peak_open_low_trigger",
        "start_signal_date": dates[0] if dates else "",
        "final_date": final_date,
        "trading_days": len(curve_rows),
        "final_equity": round(final_equity, 8),
        "total_return_pct": _pct((final_equity - 1.0) * 100.0),
        "max_drawdown_pct": _max_drawdown(curve_rows),
        "win_day_pct": _pct(win_days / len(curve_rows) * 100.0) if curve_rows else "",
        "buy_count": total_buys,
        "sell_count": total_sells,
        "blocked_buy_limit_up_count": blocked_buys,
        "blocked_sell_limit_down_count": blocked_sells,
        "blocked_trade_count": blocked_buys + blocked_sells,
        "ending_cash": round(cash, 8),
    }
    return curve_rows, trade_rows, holdings_rows, summary


def _benchmark_buy_hold(
    universe: dict[str, list[Bar]],
    benchmark: str,
    signal_start_date: str,
    final_date: str,
) -> dict[str, object]:
    bars = universe.get(benchmark)
    if not bars:
        return {}
    indexes = _bar_index_by_date(bars)
    start_index = indexes.get(signal_start_date)
    final_index = indexes.get(final_date)
    if start_index is None or final_index is None or start_index + 1 > final_index:
        return {}
    entry = bars[start_index + 1]
    exit_bar = bars[final_index]
    if entry.open == 0:
        return {}
    return {
        "benchmark": benchmark,
        "entry_date": entry.date,
        "entry_open": round(entry.open, 4),
        "exit_date": exit_bar.date,
        "exit_close": round(exit_bar.close, 4),
        "total_return_pct": _pct((exit_bar.close / entry.open - 1.0) * 100.0),
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Replay Stock PDC recommendations over a historical period.")
    parser.add_argument("--start", required=True, help="Start date, such as 2025-08-01.")
    parser.add_argument("--end", required=True, help="End date, such as 2025-08-31.")
    parser.add_argument("--top", type=int, default=20, help="Daily recommendation count.")
    parser.add_argument("--hold-days", default="5,10,20", help="Comma-separated trading-day holding horizons.")
    parser.add_argument("--data-dir", default="data_a_share", help="OHLCV CSV directory.")
    parser.add_argument("--benchmark", default="CSI300ETF", help="Benchmark ticker for market context and trading calendar.")
    parser.add_argument("--min-bars", type=int, default=120, help="Minimum history needed before a stock enters replay.")
    parser.add_argument("--metadata-csv", default="outputs_a_share/a_share_universe.csv", help="Ticker metadata CSV.")
    parser.add_argument("--outputs-dir", default="outputs/historical_replay", help="Replay output directory.")
    parser.add_argument("--trailing-stop-pct", type=float, default=5.0, help="Trailing stop from each holding's confirmed high.")
    parser.add_argument(
        "--min-candidate-count",
        type=int,
        default=DEFAULT_SELECTION_GATE_MIN_CANDIDATES,
        help="Minimum candidate breadth before new buys are allowed.",
    )
    parser.add_argument(
        "--min-pdc-pool-size",
        type=int,
        default=DEFAULT_SELECTION_GATE_MIN_PDC_POOL,
        help="Minimum PDC scoring pool needed before new buys are allowed.",
    )
    parser.add_argument(
        "--entry-instructions",
        default="",
        help="Comma-separated front-desk instructions allowed for new entries; empty means buy all Top N rows.",
    )
    parser.add_argument(
        "--immediate-buy-only",
        action="store_true",
        help="Replay only Strong Watch / Trial Position rows that pass the production PDC buy gate.",
    )
    parser.add_argument(
        "--hold-dropped-up-day",
        action="store_true",
        help="Keep a dropped holding when its signal-day close is up versus the previous close.",
    )
    parser.add_argument("--commission-bps", type=float, default=0.0)
    parser.add_argument("--slippage-bps", type=float, default=0.0)
    parser.add_argument("--sell-stamp-duty-bps", type=float, default=0.0)
    parser.add_argument(
        "--strict-action-contract",
        action="store_true",
        help="Use the production BUY gate and daily HOLD/SELL trend-integrity monitor for existing positions.",
    )
    parser.add_argument(
        "--entry-min-overheat-score",
        type=float,
        default=None,
        help="Optional minimum overheat score required for a new entry.",
    )
    parser.add_argument(
        "--allocation-mode",
        choices=["cash_split", "slot_equal"],
        default="cash_split",
        help=(
            "How to size new trailing-stop entries: cash_split fully deploys remaining cash "
            "across today's new names; slot_equal reserves one equal portfolio slot per max position."
        ),
    )
    parser.add_argument(
        "--limit-trade-model",
        choices=["none", "conservative"],
        default="none",
        help=(
            "Whether to model A-share limit-up/limit-down non-execution. Conservative skips next-open "
            "buys at limit-up and blocks stop sells when price is at/near limit-down."
        ),
    )
    parser.add_argument(
        "--limit-tolerance-pct",
        type=float,
        default=LIMIT_TOLERANCE_PCT,
        help="Tolerance, in percentage points, for detecting limit-up or limit-down moves.",
    )
    parser.add_argument("--disable-selection-gate", action="store_true", help="Disable candidate breadth gate for comparison runs.")
    parser.add_argument(
        "--zhuge-mode",
        choices=["manual", "close_tail_five_elements"],
        default="manual",
        help="Zhuge posture source used for every replay date.",
    )
    parser.add_argument(
        "--zhuge-posture",
        choices=["aggressive", "balanced", "neutral", "conservative", "defensive"],
        default=None,
        help="Optional fixed posture override for the replay.",
    )
    parser.add_argument(
        "--zhuge-tail-decimals",
        type=int,
        choices=range(0, 7),
        default=3,
        help="Decimal precision used to extract the benchmark close tail digit.",
    )
    parser.add_argument(
        "--zhuge-weight",
        type=float,
        default=None,
        help="Experimental Zhuge weight from 0.00 to 0.05, funded from the Chair budget.",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    active_weights = pdc_weights_with_zhuge(args.zhuge_weight)
    zhuge_context = dict(DEFAULT_ZHUGE_ORION_PROFILE)
    zhuge_context["mode"] = args.zhuge_mode
    zhuge_context["tail_decimals"] = args.zhuge_tail_decimals
    if args.zhuge_posture is not None:
        zhuge_context["posture"] = args.zhuge_posture
    horizons = [int(value.strip()) for value in args.hold_days.split(",") if value.strip()]
    allowed_entry_instructions = _parse_csv_set(args.entry_instructions)
    data_dir = _project_path(args.data_dir)
    output_dir = _project_path(args.outputs_dir) / f"{args.start}_to_{args.end}"
    universe = load_universe(data_dir)
    metadata_path = _project_path(args.metadata_csv)
    ticker_names = _load_ticker_names(metadata_path)
    hawkeye_metadata = load_hawkeye_metadata(metadata_path)
    dates = _trading_dates(universe, args.start, args.end, args.benchmark)
    if not dates:
        print(f"No trading dates found between {args.start} and {args.end}.", file=sys.stderr)
        return 1

    trade_rows: list[dict[str, object]] = []
    top_by_date: dict[str, list[dict[str, object]]] = {}
    evaluation_signals_by_date: dict[str, dict[str, dict[str, object]]] = {}
    selection_gate_rows: list[dict[str, object]] = []
    candidate_screen_rows: list[dict[str, object]] = []
    for signal_date in dates:
        truncated = _truncate_universe(universe, signal_date, args.min_bars)
        if args.benchmark in universe and args.benchmark not in truncated:
            benchmark_history = [bar for bar in universe[args.benchmark] if bar.date <= signal_date]
            if benchmark_history:
                truncated[args.benchmark] = benchmark_history
        if not truncated:
            continue

        candidate_rows = _candidate_screen(
            truncated,
            hawkeye_metadata,
            args.benchmark,
        )
        for candidate_row in candidate_rows:
            candidate_screen_rows.append(
                {
                    "signal_date": signal_date,
                    **candidate_row,
                }
            )
        passed_candidates = [
            str(row["ticker"])
            for row in candidate_rows
            if row.get("passed") is True or str(row.get("passed")).lower() == "true"
        ]
        pdc_pool_tickers = passed_candidates
        candidate_count = len(passed_candidates)
        pdc_pool_count = len(pdc_pool_tickers)
        gate_row = _selection_gate_row(
            signal_date,
            candidate_count,
            pdc_pool_count,
            args.min_candidate_count,
            args.min_pdc_pool_size,
            0,
            args.disable_selection_gate,
            "hawkeye_radar",
            False,
            passed_candidates,
            pdc_pool_tickers,
        )
        pdc_universe = {
            ticker: truncated[ticker]
            for ticker in pdc_pool_tickers
            if ticker in truncated
        }
        if args.benchmark in truncated:
            pdc_universe[args.benchmark] = truncated[args.benchmark]
        if not pdc_universe:
            top_by_date[signal_date] = []
            gate_row["trade_gate_open"] = "NO"
            gate_row["gate_reason"] = "empty PDC universe after candidate screening"
            selection_gate_rows.append(gate_row)
            continue

        evaluations, market_context = run_pdc_loop(
            pdc_universe,
            preferred_benchmark=args.benchmark,
            weights=active_weights,
            zhuge_context=zhuge_context,
        )
        evaluation_signals_by_date[signal_date] = {
            evaluation.ticker: {
                "rank": evaluation.rank,
                "latest_close": evaluation.latest_close,
                "technical_stop": evaluation.technical_stop or 0.0,
                "trend_score": evaluation.scores["trend"].score,
            }
            for evaluation in evaluations
        }
        raw_instructions = daily_instruction_rows(
            evaluations,
            market_context,
            signal_date,
            top_n=args.top,
            immediate_buy_only=args.immediate_buy_only,
        )
        instructions = _filter_entry_instructions(
            raw_instructions,
            allowed_entry_instructions,
            args.entry_min_overheat_score,
        )
        if gate_row["trade_gate_open"] != "YES":
            instructions = []
        top_by_date[signal_date] = instructions
        gate_row["recommendation_count"] = len(instructions)
        selection_gate_rows.append(gate_row)

        for instruction in instructions:
            ticker = str(instruction["ticker"])
            bars = universe.get(ticker)
            if not bars:
                continue
            row: dict[str, object] = {
                "signal_date": signal_date,
                "recommendation_rank": instruction["recommendation_rank"],
                "ticker": ticker,
                "name": ticker_names.get(ticker, ""),
                "pdc_rank": instruction["rank"],
                "final_score": instruction["final_score"],
                "final_status": instruction["final_status"],
                "instruction": instruction["instruction"],
                "latest_close": instruction["latest_close"],
                "main_risk": instruction["main_risk"],
            }
            for column in MEMBER_SCORE_COLUMNS:
                row[column] = instruction.get(column, "")
            for hold_days in horizons:
                result = _forward_trade_return(bars, signal_date, hold_days)
                if result is None:
                    row[f"entry_date_{hold_days}d"] = ""
                    row[f"entry_open_{hold_days}d"] = ""
                    row[f"exit_date_{hold_days}d"] = ""
                    row[f"exit_close_{hold_days}d"] = ""
                    row[f"return_{hold_days}d_pct"] = ""
                else:
                    entry_date, entry_open, exit_date, exit_close, return_pct = result
                    row[f"entry_date_{hold_days}d"] = entry_date
                    row[f"entry_open_{hold_days}d"] = entry_open
                    row[f"exit_date_{hold_days}d"] = exit_date
                    row[f"exit_close_{hold_days}d"] = exit_close
                    row[f"return_{hold_days}d_pct"] = return_pct
            trade_rows.append(row)

    month_hold_rows: list[dict[str, object]] = []
    first_signal_date = dates[0]
    month_end_date = dates[-1]
    for instruction in top_by_date.get(first_signal_date, []):
        ticker = str(instruction["ticker"])
        bars = universe.get(ticker)
        if not bars:
            continue
        result = _month_end_trade_return(bars, first_signal_date, month_end_date)
        if result is None:
            continue
        entry_date, entry_open, exit_date, exit_close, return_pct = result
        month_hold_rows.append(
            {
                "signal_date": first_signal_date,
                "ticker": ticker,
                "name": ticker_names.get(ticker, ""),
                "recommendation_rank": instruction["recommendation_rank"],
                "final_score": instruction["final_score"],
                "final_status": instruction["final_status"],
                "entry_date": entry_date,
                "entry_open": entry_open,
                "exit_date": exit_date,
                "exit_close": exit_close,
                "return_pct": return_pct,
            }
        )

    summary_rows = _summarize_returns(trade_rows, horizons)
    if month_hold_rows:
        month_returns = [float(row["return_pct"]) for row in month_hold_rows]
        summary_rows.append(
            {
                "horizon": "month_start_to_month_end",
                "trade_count": len(month_returns),
                "signal_days": 1,
                "avg_trade_return_pct": _pct(sum(month_returns) / len(month_returns)),
                "median_trade_return_pct": _pct(statistics.median(month_returns)),
                "win_rate_pct": _pct(sum(1 for value in month_returns if value > 0) / len(month_returns) * 100.0),
                "avg_daily_top_return_pct": _pct(sum(month_returns) / len(month_returns)),
                "best_trade_return_pct": _pct(max(month_returns)),
                "worst_trade_return_pct": _pct(min(month_returns)),
            }
        )

    gate_by_date = {str(row["signal_date"]): row for row in selection_gate_rows}
    portfolio_curve, portfolio_trades, portfolio_holdings, portfolio_summary = _simulate_membership_portfolio(
        top_by_date,
        evaluation_signals_by_date,
        universe,
        dates,
        ticker_names,
        gate_by_date,
        args.hold_dropped_up_day,
        args.commission_bps,
        args.slippage_bps,
        args.sell_stamp_duty_bps,
        args.strict_action_contract,
    )
    trailing_curve, trailing_trades, trailing_holdings, trailing_summary = _simulate_trailing_stop_portfolio(
        top_by_date,
        universe,
        dates,
        ticker_names,
        args.top,
        args.trailing_stop_pct,
        args.allocation_mode,
        args.limit_trade_model,
        args.limit_tolerance_pct,
        gate_by_date,
    )
    gate_open_days = sum(1 for row in selection_gate_rows if row["trade_gate_open"] == "YES")
    gate_closed_days = sum(1 for row in selection_gate_rows if row["trade_gate_open"] != "YES")
    gate_summary = {
        "selection_gate_min_candidate_count": args.min_candidate_count,
        "selection_gate_min_pdc_pool_size": args.min_pdc_pool_size,
        "selection_gate_disabled": args.disable_selection_gate,
        "candidate_mode": "hawkeye_radar",
        "selection_gate_open_days": gate_open_days,
        "selection_gate_closed_days": gate_closed_days,
    }
    portfolio_summary.update(gate_summary)
    trailing_summary.update(gate_summary)
    benchmark_summary = _benchmark_buy_hold(
        universe,
        args.benchmark,
        dates[0],
        str(portfolio_summary.get("final_date") or trailing_summary.get("final_date") or dates[-1]),
    )

    base_headers = [
        "signal_date",
        "recommendation_rank",
        "ticker",
        "name",
        "pdc_rank",
        "final_score",
        "final_status",
        "instruction",
        *MEMBER_SCORE_COLUMNS,
        "latest_close",
        "main_risk",
    ]
    horizon_headers: list[str] = []
    for hold_days in horizons:
        horizon_headers.extend(
            [
                f"entry_date_{hold_days}d",
                f"entry_open_{hold_days}d",
                f"exit_date_{hold_days}d",
                f"exit_close_{hold_days}d",
                f"return_{hold_days}d_pct",
            ]
        )
    trade_path = output_dir / "daily_replay_trades.csv"
    summary_path = output_dir / "summary.csv"
    month_hold_path = output_dir / "month_start_hold.csv"
    selection_gate_path = output_dir / "selection_gate_audit.csv"
    candidate_screen_path = output_dir / "candidate_screen_audit.csv"
    portfolio_curve_path = output_dir / "membership_portfolio_curve.csv"
    portfolio_trades_path = output_dir / "membership_portfolio_trades.csv"
    portfolio_holdings_path = output_dir / "membership_portfolio_holdings.csv"
    portfolio_summary_path = output_dir / "membership_portfolio_summary.csv"
    trailing_curve_path = output_dir / "trailing_stop_portfolio_curve.csv"
    trailing_trades_path = output_dir / "trailing_stop_portfolio_trades.csv"
    trailing_holdings_path = output_dir / "trailing_stop_portfolio_holdings.csv"
    trailing_summary_path = output_dir / "trailing_stop_portfolio_summary.csv"
    _write_csv(trade_path, trade_rows, [*base_headers, *horizon_headers])
    _write_csv(
        summary_path,
        summary_rows,
        [
            "horizon",
            "trade_count",
            "signal_days",
            "avg_trade_return_pct",
            "median_trade_return_pct",
            "win_rate_pct",
            "avg_daily_top_return_pct",
            "best_trade_return_pct",
            "worst_trade_return_pct",
        ],
    )
    _write_csv(
        month_hold_path,
        month_hold_rows,
        [
            "signal_date",
            "ticker",
            "name",
            "recommendation_rank",
            "final_score",
            "final_status",
            "entry_date",
            "entry_open",
            "exit_date",
            "exit_close",
            "return_pct",
        ],
    )
    _write_csv(
        selection_gate_path,
        selection_gate_rows,
        [
            "signal_date",
            "candidate_count",
            "min_candidate_count",
            "pdc_pool_count",
            "min_pdc_pool_size",
            "trade_gate_open",
            "gate_reason",
            "candidate_mode",
            "ignored_market_cap",
            "candidate_tickers",
            "pdc_pool_tickers",
            "recommendation_count",
        ],
    )
    _write_csv(
        candidate_screen_path,
        candidate_screen_rows,
        [
            "signal_date",
            "ticker",
            "passed",
            "name",
            "total_mcap",
            "return_60d",
            "latest_daily_return",
            "max_single_day_gain",
            "max_single_day_loss",
            "latest_close",
            "sma20",
            "sma50",
            "sma200",
            "reason",
            "rejection_reason",
        ],
    )
    _write_csv(
        portfolio_curve_path,
        portfolio_curve,
        [
            "signal_date",
            "execution_date",
            "equity",
            "daily_return_pct",
            "cash",
            "holding_count",
            "holdings",
            "trade_gate_open",
            "gate_reason",
        ],
    )
    _write_csv(
        portfolio_trades_path,
        portfolio_trades,
        [
            "signal_date",
            "execution_date",
            "action",
            "ticker",
            "name",
            "price",
            "shares",
            "value",
            "fees",
            "action_reason",
            "cash_after",
        ],
    )
    _write_csv(
        portfolio_holdings_path,
        portfolio_holdings,
        [
            "date",
            "ticker",
            "name",
            "shares",
            "close",
            "value",
            "weight_pct",
        ],
    )
    _write_csv(
        portfolio_summary_path,
        [
            {"metric": key, "value": value}
            for key, value in {
                **portfolio_summary,
                **{f"benchmark_{key}": value for key, value in benchmark_summary.items()},
            }.items()
        ],
        ["metric", "value"],
    )
    _write_csv(
        trailing_curve_path,
        trailing_curve,
        [
            "signal_date",
            "execution_date",
            "equity",
            "daily_return_pct",
            "cash",
            "holding_count",
            "holdings",
            "stopped_tickers",
            "blocked_tickers",
            "trade_gate_open",
            "gate_reason",
        ],
    )
    _write_csv(
        trailing_trades_path,
        trailing_trades,
        [
            "signal_date",
            "execution_date",
            "action",
            "ticker",
            "name",
            "price",
            "shares",
            "value",
            "cash_after",
            "entry_date",
            "entry_price",
            "peak_price",
            "stop_price",
            "trailing_stop_pct",
            "block_reason",
            "limit_rate_pct",
            "limit_reference_close",
        ],
    )
    _write_csv(
        trailing_holdings_path,
        trailing_holdings,
        [
            "date",
            "ticker",
            "name",
            "shares",
            "entry_date",
            "entry_price",
            "close",
            "peak_price",
            "trailing_stop_price",
            "value",
            "weight_pct",
        ],
    )
    _write_csv(
        trailing_summary_path,
        [
            {"metric": key, "value": value}
            for key, value in {
                **trailing_summary,
                **{f"benchmark_{key}": value for key, value in benchmark_summary.items()},
            }.items()
        ],
        ["metric", "value"],
    )

    print(f"Replay dates: {dates[0]} to {dates[-1]} ({len(dates)} trading days)")
    print(f"Daily trade rows: {len(trade_rows)}")
    print(f"Trades CSV: {trade_path}")
    print(f"Summary CSV: {summary_path}")
    print(f"Month-start hold CSV: {month_hold_path}")
    print(f"Selection gate audit: {selection_gate_path}")
    print(f"Candidate screen audit: {candidate_screen_path}")
    print(f"Membership portfolio curve: {portfolio_curve_path}")
    print(f"Membership portfolio trades: {portfolio_trades_path}")
    print(f"Membership portfolio holdings: {portfolio_holdings_path}")
    print(f"Membership portfolio summary: {portfolio_summary_path}")
    print(f"Trailing-stop portfolio curve: {trailing_curve_path}")
    print(f"Trailing-stop portfolio trades: {trailing_trades_path}")
    print(f"Trailing-stop portfolio holdings: {trailing_holdings_path}")
    print(f"Trailing-stop portfolio summary: {trailing_summary_path}")
    print("")
    print("Summary:")
    for row in summary_rows:
        print(
            f"{row['horizon']}: avg={row['avg_trade_return_pct']}% "
            f"median={row['median_trade_return_pct']}% win={row['win_rate_pct']}% "
            f"trades={row['trade_count']}"
        )
    print("")
    print(
        "Membership strategy: "
        f"return={portfolio_summary['total_return_pct']}% "
        f"max_dd={portfolio_summary['max_drawdown_pct']}% "
        f"win_days={portfolio_summary['win_day_pct']}% "
        f"buys={portfolio_summary['buy_count']} sells={portfolio_summary['sell_count']}"
    )
    print(
        f"Trailing-stop strategy ({args.trailing_stop_pct}%): "
        f"return={trailing_summary['total_return_pct']}% "
        f"max_dd={trailing_summary['max_drawdown_pct']}% "
        f"win_days={trailing_summary['win_day_pct']}% "
        f"buys={trailing_summary['buy_count']} sells={trailing_summary['sell_count']}"
    )
    print(
        "Selection gate: "
        f"open_days={gate_open_days} closed_days={gate_closed_days} "
        f"min_candidates={args.min_candidate_count} min_pdc_pool={args.min_pdc_pool_size} "
        "pdc_pool=all Hawkeye-qualified names"
    )
    if benchmark_summary:
        print(
            f"{args.benchmark} buy-hold: "
            f"return={benchmark_summary['total_return_pct']}% "
            f"{benchmark_summary['entry_date']}->{benchmark_summary['exit_date']}"
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
