from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from dataclasses import dataclass
from datetime import date
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from stock_pdc.quotes import fetch_eastmoney_quotes


WATCHLIST_RE = re.compile(r"watchlist_(\d{4}-\d{2}-\d{2})\.csv$")


@dataclass
class Bar:
    day: date
    open: float
    close: float


@dataclass
class Lot:
    ticker: str
    name: str
    shares: float
    cost: float
    buy_date: date
    buy_price: float


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as file:
        return list(csv.DictReader(file))


def parse_watchlist_path(path: Path) -> tuple[date, Path]:
    match = WATCHLIST_RE.search(path.name)
    if not match:
        raise ValueError(f"Cannot parse watchlist date from {path}")
    return date.fromisoformat(match.group(1)), path


def read_watchlists(watchlist_dir: Path) -> list[tuple[date, list[dict[str, str]]]]:
    paths = sorted(watchlist_dir.glob("watchlist_*.csv"))
    dated = [(day, read_csv(path)) for day, path in map(parse_watchlist_path, paths)]
    return dated


def read_bars(data_dir: Path, ticker: str) -> list[Bar]:
    rows = read_csv(data_dir / f"{ticker}.csv")
    bars: list[Bar] = []
    for row in rows:
        try:
            bars.append(
                Bar(
                    day=date.fromisoformat(row["Date"]),
                    open=float(row["Open"]),
                    close=float(row["Close"]),
                )
            )
        except (KeyError, TypeError, ValueError):
            continue
    return bars


def next_open_after(bars: list[Bar], signal_date: date) -> tuple[date, float] | None:
    for bar in bars:
        if bar.day > signal_date:
            return bar.day, bar.open
    return None


def latest_close(bars: list[Bar]) -> tuple[date, float] | None:
    if not bars:
        return None
    bar = bars[-1]
    return bar.day, bar.close


def signal_day_pct_change(bars: list[Bar], signal_date: date) -> float | None:
    previous: Bar | None = None
    for bar in bars:
        if bar.day == signal_date:
            if previous is None or previous.close <= 0:
                return None
            return (bar.close / previous.close - 1.0) * 100.0
        if bar.day < signal_date:
            previous = bar
        if bar.day > signal_date:
            break
    return None


def name_map(universe_path: Path) -> dict[str, str]:
    names: dict[str, str] = {}
    if not universe_path.exists():
        return names
    for row in read_csv(universe_path):
        ticker = row.get("ticker", "")
        if ticker:
            names[ticker] = row.get("name", "")
    return names


def simulate(args: argparse.Namespace) -> tuple[dict[str, object], list[dict[str, object]]]:
    watchlists = read_watchlists(args.watchlist_dir)
    if not watchlists:
        raise RuntimeError(f"No daily watchlists found under {args.watchlist_dir}")

    names = name_map(args.universe)
    bars_by_ticker: dict[str, list[Bar]] = {}
    holdings: dict[str, Lot] = {}
    cash = float(args.capital)
    realized_pnl = 0.0
    executed_rebalances: list[dict[str, object]] = []
    pending_rebalances: list[dict[str, object]] = []

    for signal_date, rows in watchlists:
        target = [row["ticker"] for row in sorted(rows, key=lambda row: int(row.get("rank") or 999))]
        target_set = set(target)
        tickers_needed = set(target_set) | set(holdings)
        for ticker in tickers_needed:
            bars_by_ticker.setdefault(ticker, read_bars(args.data_dir, ticker))

        possible_exec_dates = []
        for ticker in tickers_needed:
            open_point = next_open_after(bars_by_ticker[ticker], signal_date)
            if open_point:
                possible_exec_dates.append(open_point[0])

        if not possible_exec_dates:
            pending_rebalances.append(
                {
                    "signal_date": signal_date.isoformat(),
                    "reason": "No next trading-day price is available yet.",
                    "target_count": len(target_set),
                }
            )
            continue

        exec_date = max(possible_exec_dates)
        # Use the common next execution date for tradable names. If a ranked name has
        # no execution open, keep its allocation in cash instead of inventing a fill.
        exec_opens: dict[str, float] = {}
        for ticker in tickers_needed:
            point = next_open_after(bars_by_ticker[ticker], signal_date)
            if point and point[0] == exec_date:
                exec_opens[ticker] = point[1]

        # Sell names that left the Top 20, unless the signal day itself is still positive.
        sold = []
        blocked_sells = []
        held_dropped_up_day = []
        for ticker in sorted(set(holdings) - target_set):
            lot = holdings.pop(ticker)
            signal_pct = signal_day_pct_change(bars_by_ticker[ticker], signal_date)
            if args.hold_dropped_if_up_day and signal_pct is not None and signal_pct > 0:
                holdings[ticker] = lot
                held_dropped_up_day.append(
                    {
                        "ticker": ticker,
                        "name": lot.name,
                        "signal_day_pct_change": round(signal_pct, 4),
                        "reason": "dropped from Top 20 but signal day was positive; user rule says hold",
                    }
                )
                continue
            if ticker not in exec_opens:
                holdings[ticker] = lot
                blocked_sells.append({"ticker": ticker, "name": lot.name, "reason": "missing execution open"})
                continue
            proceeds = lot.shares * exec_opens[ticker]
            cash += proceeds
            pnl = proceeds - lot.cost
            realized_pnl += pnl
            sold.append({"ticker": ticker, "name": lot.name, "price": exec_opens[ticker], "pnl": pnl})

        hold_override_tickers = set(holdings) - target_set
        holding_values = {
            ticker: lot.shares * exec_opens.get(ticker, lot.buy_price)
            for ticker, lot in holdings.items()
        }
        total_equity = cash + sum(holding_values.values())
        held_override_value = sum(holding_values[ticker] for ticker in hold_override_tickers)
        allocatable_equity = max(total_equity - held_override_value, 0.0)
        per_position = allocatable_equity / len(target_set) if target_set else 0.0

        bought_or_adjusted = []
        unfilled_buys = []
        new_holdings: dict[str, Lot] = {
            ticker: lot for ticker, lot in holdings.items()
            if ticker in hold_override_tickers
        }
        for ticker in target:
            if ticker not in exec_opens:
                if ticker in holdings:
                    new_holdings[ticker] = holdings[ticker]
                else:
                    unfilled_buys.append(
                        {
                            "ticker": ticker,
                            "name": names.get(ticker, ""),
                            "target_value": per_position,
                            "reason": "missing execution open",
                        }
                    )
                continue
            current_value = holdings[ticker].shares * exec_opens[ticker] if ticker in holdings else 0.0
            trade_value = per_position - current_value
            cash -= trade_value
            shares = per_position / exec_opens[ticker]
            previous_cost = holdings[ticker].cost if ticker in holdings else 0.0
            lot = Lot(
                ticker=ticker,
                name=names.get(ticker, ""),
                shares=shares,
                cost=per_position,
                buy_date=exec_date,
                buy_price=exec_opens[ticker],
            )
            new_holdings[ticker] = lot
            bought_or_adjusted.append(
                {
                    "ticker": ticker,
                    "name": lot.name,
                    "price": exec_opens[ticker],
                    "target_value": per_position,
                    "trade_value": trade_value,
                    "previous_cost": previous_cost,
                }
            )
        holdings = new_holdings
        executed_rebalances.append(
            {
                "signal_date": signal_date.isoformat(),
                "execution_date": exec_date.isoformat(),
                "target_count": len(target_set),
                "sold_count": len(sold),
                "sold": sold,
                "blocked_sells": blocked_sells,
                "held_dropped_up_day": held_dropped_up_day,
                "unfilled_buys": unfilled_buys,
                "positions": bought_or_adjusted,
            }
        )

    quote_tickers = sorted(holdings)
    live_quotes = fetch_eastmoney_quotes(quote_tickers) if args.live_quotes and quote_tickers else {}

    latest_signal = watchlists[-1][0]
    latest_target = {row["ticker"] for row in watchlists[-1][1]}
    detail_rows: list[dict[str, object]] = []
    market_value = cash
    quote_asofs = set()
    for ticker, lot in sorted(holdings.items()):
        quote = live_quotes.get(ticker)
        mark_source = "live_quote"
        mark_date = ""
        mark_price = quote.price if quote and quote.price is not None else None
        if quote:
            quote_asofs.add(quote.asof)
        if mark_price is None:
            close = latest_close(bars_by_ticker.setdefault(ticker, read_bars(args.data_dir, ticker)))
            if close is None:
                mark_price = lot.buy_price
                mark_source = "buy_price_fallback"
            else:
                close_date, mark_price = close
                mark_source = "latest_csv_close"
                mark_date = close_date.isoformat()
        value = lot.shares * float(mark_price)
        pnl = value - lot.cost
        market_value += value
        detail_rows.append(
            {
                "ticker": ticker,
                "name": lot.name,
                "buy_date": lot.buy_date.isoformat(),
                "buy_price": round(lot.buy_price, 4),
                "cost": round(lot.cost, 2),
                "shares": round(lot.shares, 6),
                "mark_price": round(float(mark_price), 4),
                "mark_source": mark_source,
                "mark_date": mark_date,
                "market_value": round(value, 2),
                "unrealized_pnl": round(pnl, 2),
                "return_pct": round(pnl / lot.cost * 100, 3) if lot.cost else 0,
                "in_latest_top20": ticker in latest_target,
                "would_sell_on_next_execution": (
                    ticker not in latest_target
                    and not (
                        args.hold_dropped_if_up_day
                        and (signal_day_pct_change(
                            bars_by_ticker.setdefault(ticker, read_bars(args.data_dir, ticker)),
                            latest_signal,
                        ) or 0) > 0
                    )
                ),
            }
        )

    total_pnl = market_value - float(args.capital)
    summary: dict[str, object] = {
        "capital": float(args.capital),
        "cash": round(cash, 2),
        "market_value": round(market_value, 2),
        "total_pnl": round(total_pnl, 2),
        "total_return_pct": round(total_pnl / float(args.capital) * 100, 4) if args.capital else 0,
        "realized_pnl": round(realized_pnl, 2),
        "unrealized_pnl": round(total_pnl - realized_pnl, 2),
        "holding_count": len(holdings),
        "latest_signal_date": latest_signal.isoformat(),
        "executed_rebalances": executed_rebalances,
        "pending_rebalances": pending_rebalances,
        "quote_asofs": sorted(quote_asofs),
        "assumptions": [
            "Top 20 is bought equal-weight.",
            "Execution uses the next available trading-day open after each watchlist signal.",
            "Dropped names are sold on that same next execution open unless the signal day itself is positive.",
            "User sell override: if a held stock drops from Top 20 but the signal day is up, the position is held for trend continuity review.",
            "No fees, stamp duty, slippage, market-impact, lot-size rounding, or failed fills.",
            "Live orders remain disabled; this is research/backtest output only.",
        ],
    }
    return summary, detail_rows


def main() -> int:
    parser = argparse.ArgumentParser(description="Simulate equal-weight Top 20 rotation from Stock PDC watchlists.")
    parser.add_argument("--capital", type=float, default=100000.0)
    parser.add_argument("--watchlist-dir", type=Path, default=Path("outputs/daily_watchlists"))
    parser.add_argument("--data-dir", type=Path, default=Path("data_a_share"))
    parser.add_argument("--universe", type=Path, default=Path("outputs_a_share/a_share_universe.csv"))
    parser.add_argument("--output-csv", type=Path, default=Path("outputs/top20_rotation_backtest.csv"))
    parser.add_argument("--summary-json", type=Path, default=Path("outputs/top20_rotation_backtest_summary.json"))
    parser.add_argument("--sell-dropped-even-if-up-day", action="store_false", dest="hold_dropped_if_up_day")
    parser.add_argument("--no-live-quotes", action="store_false", dest="live_quotes")
    parser.set_defaults(live_quotes=True, hold_dropped_if_up_day=True)
    args = parser.parse_args()

    summary, detail_rows = simulate(args)

    args.output_csv.parent.mkdir(parents=True, exist_ok=True)
    with args.output_csv.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=list(detail_rows[0]) if detail_rows else ["ticker"])
        writer.writeheader()
        writer.writerows(detail_rows)

    args.summary_json.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print(f"detail_csv={args.output_csv}")
    print(f"summary_json={args.summary_json}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
