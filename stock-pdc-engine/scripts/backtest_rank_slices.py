from __future__ import annotations

import argparse
import csv
import itertools
import math
import statistics
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]


SCENARIOS: dict[str, set[int]] = {
    "top5": set(range(1, 6)),
    "top10": set(range(1, 11)),
    "top15": set(range(1, 16)),
    "top20": set(range(1, 21)),
    "rank13": {13},
    "rank17": {17},
    "rank19": {19},
    "ranks_13_17_19": {13, 17, 19},
}


def parse_rank_set(value: str) -> list[int]:
    ranks: list[int] = []
    seen: set[int] = set()
    for raw in value.split(","):
        raw = raw.strip()
        if not raw:
            continue
        rank = int(raw)
        if rank <= 0:
            raise ValueError(f"Rank must be positive: {rank}")
        if rank not in seen:
            ranks.append(rank)
            seen.add(rank)
    return ranks


def combo_scenarios(ranks: list[int]) -> dict[str, set[int]]:
    scenarios: dict[str, set[int]] = {}
    for size in range(1, len(ranks) + 1):
        for combo in itertools.combinations(ranks, size):
            name = "ranks_" + "_".join(str(rank) for rank in combo)
            scenarios[name] = set(combo)
    return scenarios


def project_path(value: str) -> Path:
    path = Path(value)
    if path.is_absolute():
        return path
    return PROJECT_ROOT / path


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


def write_csv(path: Path, rows: list[dict[str, object]], headers: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=headers, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def trading_dates(data_dir: Path, benchmark: str, start: str, end: str) -> list[str]:
    rows = read_csv(data_dir / f"{benchmark}.csv")
    return [row["Date"] for row in rows if start <= row.get("Date", "") <= end]


def load_prices(data_dir: Path, tickers: set[str]) -> dict[str, dict[str, dict[str, float]]]:
    prices: dict[str, dict[str, dict[str, float]]] = {}
    for ticker in sorted(tickers):
        path = data_dir / f"{ticker}.csv"
        if not path.exists():
            continue
        by_date: dict[str, dict[str, float]] = {}
        for row in read_csv(path):
            try:
                by_date[row["Date"]] = {
                    "open": float(row["Open"]),
                    "close": float(row["Close"]),
                }
            except (KeyError, TypeError, ValueError):
                continue
        prices[ticker] = by_date
    return prices


def fill_valuation_prices(
    prices: dict[str, dict[str, dict[str, float]]],
    dates: list[str],
) -> dict[str, dict[str, dict[str, float]]]:
    filled: dict[str, dict[str, dict[str, float]]] = {}
    for ticker, source in prices.items():
        last_close: float | None = None
        ticker_prices: dict[str, dict[str, float]] = {}
        for date in dates:
            row = source.get(date)
            if row is not None:
                ticker_prices[date] = row
                last_close = row["close"]
            elif last_close is not None:
                ticker_prices[date] = {"open": last_close, "close": last_close}
        filled[ticker] = ticker_prices
    return filled


def load_top_by_date(trades_csv: Path, start: str, end: str) -> dict[str, list[dict[str, str]]]:
    top_by_date: dict[str, list[dict[str, str]]] = {}
    for row in read_csv(trades_csv):
        signal_date = row.get("signal_date", "")
        if not (start <= signal_date <= end):
            continue
        try:
            rank = int(row.get("recommendation_rank", ""))
        except ValueError:
            continue
        row["recommendation_rank"] = str(rank)
        top_by_date.setdefault(signal_date, []).append(row)
    for rows in top_by_date.values():
        rows.sort(key=lambda row: int(row["recommendation_rank"]))
    return top_by_date


def selected_tickers(rows: list[dict[str, str]], ranks: set[int]) -> list[str]:
    tickers: list[str] = []
    seen: set[str] = set()
    for row in rows:
        try:
            rank = int(row["recommendation_rank"])
        except (KeyError, ValueError):
            continue
        ticker = row.get("ticker", "")
        if rank in ranks and ticker and ticker not in seen:
            tickers.append(ticker)
            seen.add(ticker)
    return tickers


def mark_value(
    cash: float,
    shares: dict[str, float],
    prices: dict[str, dict[str, dict[str, float]]],
    date: str,
    field: str,
) -> float:
    equity = cash
    for ticker, share_count in shares.items():
        price = prices.get(ticker, {}).get(date, {}).get(field)
        if price is None:
            continue
        equity += share_count * price
    return equity


def max_drawdown(equities: list[float]) -> float:
    peak = 1.0
    worst = 0.0
    for equity in equities:
        peak = max(peak, equity)
        if peak:
            worst = min(worst, equity / peak - 1.0)
    return worst


def pct(value: float) -> float:
    return round(value * 100.0, 4)


def sharpe_ratio(returns: list[float], risk_free_rate_pct: float) -> float:
    if len(returns) < 2:
        return 0.0
    daily_risk_free = (1.0 + risk_free_rate_pct / 100.0) ** (1.0 / 252.0) - 1.0
    volatility = statistics.stdev(returns)
    if volatility == 0:
        return 0.0
    return round((statistics.mean(returns) - daily_risk_free) / volatility * math.sqrt(252.0), 4)


def simulate(
    scenario: str,
    ranks: set[int],
    dates: list[str],
    top_by_date: dict[str, list[dict[str, str]]],
    trade_prices: dict[str, dict[str, dict[str, float]]],
    valuation_prices: dict[str, dict[str, dict[str, float]]],
    risk_free_rate_pct: float,
) -> tuple[list[dict[str, object]], dict[str, object]]:
    cash = 1.0
    shares: dict[str, float] = {}
    previous_equity = 1.0
    curve: list[dict[str, object]] = []
    target_signal_days = 0
    rebalance_count = 0

    for index, signal_date in enumerate(dates[:-1]):
        execution_date = dates[index + 1]
        target = selected_tickers(top_by_date.get(signal_date, []), ranks)

        if target:
            target_signal_days += 1
            holdings_are_tradeable = all(
                trade_prices.get(ticker, {}).get(execution_date, {}).get("open", 0.0) > 0.0
                for ticker in shares
            )
            tradable_target = [
                ticker
                for ticker in target
                if trade_prices.get(ticker, {}).get(execution_date, {}).get("open", 0.0) > 0.0
            ]
            if tradable_target and holdings_are_tradeable:
                open_equity = mark_value(cash, shares, valuation_prices, execution_date, "open")
                cash = open_equity
                shares = {}
                allocation = open_equity / len(tradable_target)
                for ticker in tradable_target:
                    open_price = trade_prices[ticker][execution_date]["open"]
                    shares[ticker] = allocation / open_price
                    cash -= allocation
                rebalance_count += 1

        equity = mark_value(cash, shares, valuation_prices, execution_date, "close")
        daily_return = equity / previous_equity - 1.0 if previous_equity else 0.0
        previous_equity = equity
        curve.append(
            {
                "scenario": scenario,
                "signal_date": signal_date,
                "execution_date": execution_date,
                "equity": round(equity, 8),
                "daily_return_pct": pct(daily_return),
                "cash": round(cash, 8),
                "holding_count": len(shares),
                "holdings": ";".join(sorted(shares)),
            }
        )

    returns = [float(row["daily_return_pct"]) / 100.0 for row in curve]
    equities = [float(row["equity"]) for row in curve]
    trading_days = len(curve)
    final_equity = equities[-1] if equities else 1.0
    annualized_return = final_equity ** (252.0 / trading_days) - 1.0 if trading_days else 0.0
    annualized_volatility = statistics.stdev(returns) * math.sqrt(252.0) if len(returns) > 1 else 0.0
    win_day_pct = sum(1 for value in returns if value > 0) / len(returns) if returns else 0.0
    active_days = sum(1 for row in curve if int(row["holding_count"]) > 0)
    summary = {
        "scenario": scenario,
        "ranks": ",".join(str(rank) for rank in sorted(ranks)),
        "start_signal_date": dates[0] if dates else "",
        "final_date": curve[-1]["execution_date"] if curve else "",
        "trading_days": trading_days,
        "target_signal_days": target_signal_days,
        "rebalance_count": rebalance_count,
        "active_days": active_days,
        "final_equity": round(final_equity, 8),
        "total_return_pct": pct(final_equity - 1.0),
        "annualized_return_pct": pct(annualized_return),
        "annualized_volatility_pct": pct(annualized_volatility),
        "sharpe_ratio": sharpe_ratio(returns, risk_free_rate_pct),
        "max_drawdown_pct": pct(max_drawdown(equities)),
        "win_day_pct": pct(win_day_pct),
    }
    return curve, summary


def benchmark_summary(
    data_dir: Path,
    benchmark: str,
    dates: list[str],
    risk_free_rate_pct: float,
) -> dict[str, object]:
    rows = {row["Date"]: row for row in read_csv(data_dir / f"{benchmark}.csv")}
    if len(dates) < 2:
        return {}
    entry_date = dates[1]
    final_date = dates[-1]
    try:
        entry_open = float(rows[entry_date]["Open"])
        final_close = float(rows[final_date]["Close"])
    except (KeyError, TypeError, ValueError):
        return {}

    closes = [float(rows[date]["Close"]) for date in dates if date in rows]
    returns = [closes[index] / closes[index - 1] - 1.0 for index in range(1, len(closes))]
    final_equity = final_close / entry_open
    trading_days = max(1, len(dates) - 1)
    annualized_return = final_equity ** (252.0 / trading_days) - 1.0
    annualized_volatility = statistics.stdev(returns) * math.sqrt(252.0) if len(returns) > 1 else 0.0
    return {
        "scenario": benchmark,
        "ranks": "benchmark",
        "start_signal_date": dates[0],
        "final_date": final_date,
        "trading_days": trading_days,
        "target_signal_days": "",
        "rebalance_count": "",
        "active_days": trading_days,
        "final_equity": round(final_equity, 8),
        "total_return_pct": pct(final_equity - 1.0),
        "annualized_return_pct": pct(annualized_return),
        "annualized_volatility_pct": pct(annualized_volatility),
        "sharpe_ratio": sharpe_ratio(returns, risk_free_rate_pct),
        "max_drawdown_pct": pct(max_drawdown([close / entry_open for close in closes[1:]])),
        "win_day_pct": pct(sum(1 for value in returns if value > 0) / len(returns)) if returns else 0.0,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Backtest rank-slice baskets from an existing Top 20 replay.")
    parser.add_argument("--start", default="2023-01-01")
    parser.add_argument("--end", default="2026-06-26")
    parser.add_argument("--benchmark", default="CSI300")
    parser.add_argument("--data-dir", default="data_a_share_live_mcap_2020_em")
    parser.add_argument(
        "--base-replay-dir",
        default=(
            "outputs/historical_replay_2020/"
            "live_mcap_strict_gate_30_20_stop_10_minbars120_top20/"
            "2020-01-01_to_2026-06-26"
        ),
    )
    parser.add_argument("--outputs-dir", default="outputs/rank_slice_backtests")
    parser.add_argument(
        "--combo-ranks",
        default="",
        help="Comma-separated ranks. When set, all non-empty combinations are backtested.",
    )
    parser.add_argument("--risk-free-rate-pct", type=float, default=0.0)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    data_dir = project_path(args.data_dir)
    base_replay_dir = project_path(args.base_replay_dir)
    output_dir = project_path(args.outputs_dir) / f"{args.start}_to_{args.end}"
    trades_csv = base_replay_dir / "daily_replay_trades.csv"

    dates = trading_dates(data_dir, args.benchmark, args.start, args.end)
    if len(dates) < 2:
        raise RuntimeError(f"Not enough trading dates between {args.start} and {args.end}.")

    top_by_date = load_top_by_date(trades_csv, args.start, args.end)
    tickers = {row["ticker"] for rows in top_by_date.values() for row in rows if row.get("ticker")}
    trade_prices = load_prices(data_dir, tickers)
    valuation_prices = fill_valuation_prices(trade_prices, dates)

    scenarios = SCENARIOS
    if args.combo_ranks:
        scenarios = combo_scenarios(parse_rank_set(args.combo_ranks))

    summaries: list[dict[str, object]] = []
    for scenario, ranks in scenarios.items():
        curve, summary = simulate(
            scenario,
            ranks,
            dates,
            top_by_date,
            trade_prices,
            valuation_prices,
            args.risk_free_rate_pct,
        )
        summaries.append(summary)
        write_csv(
            output_dir / f"{scenario}_curve.csv",
            curve,
            [
                "scenario",
                "signal_date",
                "execution_date",
                "equity",
                "daily_return_pct",
                "cash",
                "holding_count",
                "holdings",
            ],
        )

    bench = benchmark_summary(data_dir, args.benchmark, dates, args.risk_free_rate_pct)
    if bench:
        summaries.append(bench)

    summary_headers = [
        "scenario",
        "ranks",
        "start_signal_date",
        "final_date",
        "trading_days",
        "target_signal_days",
        "rebalance_count",
        "active_days",
        "final_equity",
        "total_return_pct",
        "annualized_return_pct",
        "annualized_volatility_pct",
        "sharpe_ratio",
        "max_drawdown_pct",
        "win_day_pct",
    ]
    write_csv(output_dir / "summary.csv", summaries, summary_headers)

    print(f"Rank-slice backtest: {dates[0]} to {dates[-1]} ({len(dates) - 1} return days)")
    print(f"Base replay: {trades_csv}")
    print(f"Summary CSV: {output_dir / 'summary.csv'}")
    for row in summaries:
        print(
            f"{row['scenario']}: total={row['total_return_pct']}% "
            f"ann={row['annualized_return_pct']}% "
            f"vol={row['annualized_volatility_pct']}% "
            f"sharpe={row['sharpe_ratio']} "
            f"maxDD={row['max_drawdown_pct']}%"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
