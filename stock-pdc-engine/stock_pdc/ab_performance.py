from __future__ import annotations

import csv
import json
import math
import statistics
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from .models import Bar
from .outputs import write_csv


SIGNAL_HEADERS = [
    "signal_date",
    "snapshot_id",
    "variant",
    "comparison_track",
    "strategy_id",
    "model_version",
    "ticker",
    "rank",
    "action",
    "reason",
    "target_weight_pct",
    "initial_stop",
    "active_stop",
    "stop_distance_pct",
]

PRICE_HEADERS = [
    "observation_date",
    "ticker",
    "open",
    "high",
    "low",
    "close",
    "volume",
    "source",
    "status",
]

TRADE_HEADERS = [
    "execution_date",
    "signal_date",
    "strategy_id",
    "action",
    "ticker",
    "price",
    "shares",
    "notional",
    "transaction_cost",
    "cash_after",
    "status",
    "reason",
]

NAV_HEADERS = [
    "valuation_date",
    "variant",
    "comparison_track",
    "strategy_id",
    "nav_net",
    "daily_return_pct",
    "cumulative_return_pct",
    "peak_nav",
    "drawdown_pct",
    "gross_exposure_pct",
    "cash_pct",
    "holding_count",
    "turnover_pct",
    "transaction_cost",
    "carry_forward_count",
    "last_executed_signal_date",
]

POSITION_HEADERS = [
    "strategy_id",
    "ticker",
    "shares",
    "entry_date",
    "entry_price",
    "initial_stop",
    "active_stop",
    "peak_close",
    "last_price",
    "market_value",
    "weight_pct",
]

COMPARISON_HEADERS = [
    "comparison_track",
    "valuation_date",
    "a_nav",
    "b_nav",
    "b_minus_a_return_pct_points",
    "relative_nav_b_vs_a_pct",
    "a_drawdown_pct",
    "b_drawdown_pct",
    "drawdown_improvement_pct_points",
]


@dataclass
class LedgerResult:
    positions: dict[str, dict[str, dict[str, object]]]
    summaries: dict[str, dict[str, object]]
    nav_rows: list[dict[str, object]]
    trade_rows: list[dict[str, object]]


def _read_rows(path: Path) -> list[dict[str, str]]:
    if not path.exists() or path.stat().st_size == 0:
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def _normalized(rows: list[dict[str, object]], headers: list[str]) -> list[list[str]]:
    return [[str(row.get(header, "")) for header in headers] for row in rows]


def _write_csv_atomic(path: Path, rows: list[dict[str, object]], headers: list[str]) -> None:
    temporary = path.with_name(path.name + ".tmp")
    write_csv(temporary, rows, headers)
    temporary.replace(path)


def _validate_signal_pair(signal_date: str, rows: list[dict[str, object]]) -> None:
    required = {"A_SELECTION", "B_SELECTION", "A_PORTFOLIO", "B_PORTFOLIO"}
    grouped: dict[str, list[dict[str, object]]] = {}
    for row in rows:
        row_date = str(row.get("signal_date") or "")
        if row_date != signal_date:
            raise ValueError(f"Signal row date {row_date!r} does not match frozen date {signal_date}")
        strategy_id = str(row.get("strategy_id") or "")
        grouped.setdefault(strategy_id, []).append(row)
    if set(grouped) != required:
        raise ValueError(
            f"A/B signal pair must contain exactly {sorted(required)}, got {sorted(grouped)}"
        )

    snapshot_ids = {str(row.get("snapshot_id") or "") for row in rows}
    if len(snapshot_ids) != 1 or not next(iter(snapshot_ids)):
        raise ValueError("A/B signal rows must share one non-empty snapshot_id")

    expected_labels = {
        "A_SELECTION": ("A", "selection"),
        "B_SELECTION": ("B", "selection"),
        "A_PORTFOLIO": ("A", "portfolio"),
        "B_PORTFOLIO": ("B", "portfolio"),
    }
    for strategy_id, strategy_rows in grouped.items():
        expected_variant, expected_track = expected_labels[strategy_id]
        tickers = [str(row.get("ticker") or "") for row in strategy_rows]
        if any(not ticker for ticker in tickers) or len(tickers) != len(set(tickers)):
            raise ValueError(f"{strategy_id} contains blank or duplicate tickers")
        for row in strategy_rows:
            if str(row.get("variant") or "") != expected_variant:
                raise ValueError(f"{strategy_id} has an inconsistent variant label")
            if str(row.get("comparison_track") or "") != expected_track:
                raise ValueError(f"{strategy_id} has an inconsistent comparison_track label")
            target_weight = float(row.get("target_weight_pct") or 0.0)
            if target_weight < 0.0 or target_weight > 100.0:
                raise ValueError(f"{strategy_id} has invalid target weight {target_weight}")
        total_weight = sum(float(row.get("target_weight_pct") or 0.0) for row in strategy_rows)
        if total_weight > 100.0001:
            raise ValueError(f"{strategy_id} target weights exceed 100%: {total_weight}")
        if strategy_id.endswith("_SELECTION") and not math.isclose(total_weight, 100.0, abs_tol=0.001):
            raise ValueError(f"{strategy_id} selection track must total 100%, got {total_weight}")


def freeze_signal_pair(root: Path, signal_date: str, rows: list[dict[str, object]]) -> tuple[Path, bool]:
    _validate_signal_pair(signal_date, rows)
    ordered = sorted(
        rows,
        key=lambda row: (
            str(row.get("strategy_id", "")),
            int(float(row.get("rank") or 999999)),
            str(row.get("ticker", "")),
        ),
    )
    path = root / "signals" / f"signal_{signal_date}.csv"
    path.parent.mkdir(parents=True, exist_ok=True)
    created = False
    existing_signal_dates = sorted(
        daily_path.stem.removeprefix("signal_")
        for daily_path in (root / "signals").glob("signal_*.csv")
    )
    if not path.exists() and existing_signal_dates and signal_date < existing_signal_dates[-1]:
        raise ValueError(
            f"Cannot insert historical A/B signal {signal_date} after frozen signal "
            f"{existing_signal_dates[-1]}; prospective history is append-only"
        )
    if path.exists():
        existing = _read_rows(path)
        if _normalized(existing, SIGNAL_HEADERS) != _normalized(ordered, SIGNAL_HEADERS):
            raise ValueError(
                f"A/B signal {signal_date} is already frozen and differs from this rerun; "
                "create a new model version instead of revising prospective history"
            )
    else:
        _write_csv_atomic(path, ordered, SIGNAL_HEADERS)
        created = True

    history_rows: list[dict[str, object]] = []
    for daily_path in sorted((root / "signals").glob("signal_*.csv")):
        daily_rows = _read_rows(daily_path)
        daily_date = daily_path.stem.removeprefix("signal_")
        _validate_signal_pair(daily_date, daily_rows)
        history_rows.extend(daily_rows)
    _write_csv_atomic(root / "signal_history.csv", history_rows, SIGNAL_HEADERS)
    return path, created


def signal_tickers(root: Path) -> set[str]:
    signal_files = sorted((root / "signals").glob("signal_*.csv"))
    if not signal_files:
        return set()
    return {
        row.get("ticker", "")
        for row in _read_rows(signal_files[-1])
        if row.get("ticker") and not str(row.get("ticker")).startswith("__")
    }


def _symbol(ticker: str, benchmark: str) -> str:
    if ticker == benchmark:
        return "sh510300"
    code, exchange = ticker.split(".")
    return exchange.lower() + code


def _fetch_raw_history(ticker: str, benchmark: str, bars_count: int) -> tuple[str, list[Bar]]:
    symbol = _symbol(ticker, benchmark)
    params = urllib.parse.urlencode({"param": f"{symbol},day,,,{bars_count},"})
    request = urllib.request.Request(
        "https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?" + params,
        headers={"User-Agent": "Mozilla/5.0"},
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        payload = json.loads(response.read().decode("utf-8"))
    node = ((payload.get("data") or {}).get(symbol) or {})
    rows = node.get("day") or []
    bars = [
        Bar(
            date=str(row[0]),
            open=float(row[1]),
            high=float(row[3]),
            low=float(row[4]),
            close=float(row[2]),
            volume=float(row[5]),
        )
        for row in rows
        if len(row) >= 6
    ]
    return ticker, bars


def fetch_raw_histories(
    tickers: set[str],
    benchmark: str,
    bars_count: int = 180,
    workers: int = 10,
) -> tuple[dict[str, list[Bar]], dict[str, str]]:
    histories: dict[str, list[Bar]] = {}
    failures: dict[str, str] = {}
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {
            pool.submit(_fetch_raw_history, ticker, benchmark, bars_count): ticker
            for ticker in sorted(tickers)
        }
        for future in as_completed(futures):
            ticker = futures[future]
            try:
                key, bars = future.result()
                if not bars:
                    raise ValueError("empty Tencent raw history")
                histories[key] = bars
            except Exception as exc:  # public-data failures are recorded and may use local fallback
                failures[ticker] = str(exc)
    return histories, failures


def freeze_price_observations(
    path: Path,
    histories: dict[str, list[Bar]],
    tickers: set[str],
    dates: list[str],
    source_by_ticker: dict[str, str],
) -> None:
    existing = _read_rows(path)
    existing_keys = {(row.get("observation_date", ""), row.get("ticker", "")) for row in existing}
    additions: list[dict[str, object]] = []
    for ticker in sorted(tickers):
        bar_map = {bar.date: bar for bar in histories.get(ticker, [])}
        for date in dates:
            key = (date, ticker)
            if key in existing_keys:
                continue
            bar = bar_map.get(date)
            additions.append(
                {
                    "observation_date": date,
                    "ticker": ticker,
                    "open": bar.open if bar else "",
                    "high": bar.high if bar else "",
                    "low": bar.low if bar else "",
                    "close": bar.close if bar else "",
                    "volume": bar.volume if bar else "",
                    "source": source_by_ticker.get(ticker, "UNAVAILABLE"),
                    "status": "TRADED" if bar else "NO_BAR_CARRY_FORWARD",
                }
            )
    _write_csv_atomic(path, [*existing, *additions], PRICE_HEADERS)


def _float(row: dict[str, object], key: str, default: float = 0.0) -> float:
    value = row.get(key)
    if value in (None, ""):
        return default
    return float(value)


def _limit_rate(ticker: str) -> float:
    if ticker == "CSI300ETF":
        return 0.10
    code = ticker.split(".")[0]
    if code.startswith(("300", "301", "688", "689")):
        return 0.20
    if ticker.endswith(".BJ") or code.startswith(("4", "8", "920")):
        return 0.30
    return 0.10


def _at_limit(ticker: str, price: float, previous_close: float | None, direction: str) -> bool:
    if previous_close in (None, 0.0):
        return False
    move = price / float(previous_close) - 1.0
    rate = _limit_rate(ticker)
    tolerance = 0.0015
    return move >= rate - tolerance if direction == "up" else move <= -rate + tolerance


def _previous_close(
    price_map: dict[tuple[str, str], dict[str, str]],
    dates: list[str],
    date_index: int,
    ticker: str,
) -> float | None:
    for previous_index in range(date_index - 1, -1, -1):
        row = price_map.get((dates[previous_index], ticker))
        if row and row.get("close") not in (None, ""):
            return float(row["close"])
    return None


def _price_or_last(
    price_map: dict[tuple[str, str], dict[str, str]],
    date: str,
    ticker: str,
    field: str,
    last_price: float,
) -> tuple[float, bool]:
    row = price_map.get((date, ticker))
    if row and row.get(field) not in (None, ""):
        return float(row[field]), False
    return last_price, True


def _variant_track(strategy_id: str) -> tuple[str, str]:
    variant, track = strategy_id.split("_", 1)
    return variant, track.lower()


def _annualized_volatility(returns: list[float]) -> float | None:
    sample = returns[-60:]
    if len(sample) < 2:
        return None
    return statistics.pstdev(sample) * math.sqrt(252.0) * 100.0


def _summary_for_rows(rows: list[dict[str, object]]) -> dict[str, object]:
    if not rows:
        return {
            "valuationDays": 0,
            "nav": 1.0,
            "cumulativeReturnPct": 0.0,
            "maxDrawdownPct": 0.0,
            "annualizedVolatilityPct": None,
            "sharpe": None,
            "calmar": None,
        }
    nav = float(rows[-1]["nav_net"])
    daily_returns = [float(row["daily_return_pct"]) / 100.0 for row in rows[1:]]
    volatility = _annualized_volatility(daily_returns)
    mean_return = statistics.fmean(daily_returns) if daily_returns else 0.0
    daily_sigma = statistics.pstdev(daily_returns) if len(daily_returns) >= 2 else 0.0
    sharpe = mean_return / daily_sigma * math.sqrt(252.0) if daily_sigma else None
    max_drawdown = min(float(row["drawdown_pct"]) for row in rows)
    years = max((len(rows) - 1) / 252.0, 0.0)
    cagr = nav ** (1.0 / years) - 1.0 if years > 0 and nav > 0 else None
    calmar = cagr / abs(max_drawdown / 100.0) if cagr is not None and max_drawdown < 0 else None
    return {
        "valuationDays": max(len(rows) - 1, 0),
        "nav": round(nav, 8),
        "cumulativeReturnPct": round((nav - 1.0) * 100.0, 6),
        "maxDrawdownPct": round(max_drawdown, 6),
        "annualizedVolatilityPct": round(volatility, 6) if volatility is not None else None,
        "sharpe": round(sharpe, 6) if sharpe is not None else None,
        "cagrPct": round(cagr * 100.0, 6) if cagr is not None else None,
        "calmar": round(calmar, 6) if calmar is not None else None,
        "grossExposurePct": float(rows[-1]["gross_exposure_pct"]),
        "cashPct": float(rows[-1]["cash_pct"]),
        "holdingCount": int(rows[-1]["holding_count"]),
        "currentDrawdownPct": float(rows[-1]["drawdown_pct"]),
        "totalTurnoverPct": round(sum(float(row["turnover_pct"]) for row in rows), 6),
        "totalTransactionCostNav": round(sum(float(row["transaction_cost"]) for row in rows), 10),
        "carryForwardMarks": sum(int(row["carry_forward_count"]) for row in rows),
    }


def rebuild_ab_performance(
    root: Path,
    effective_signal_date: str,
    benchmark: str,
    costs: dict[str, object],
    minimum_paired_days: int,
) -> LedgerResult:
    signal_rows = _read_rows(root / "signal_history.csv")
    price_rows = _read_rows(root / "price_observations.csv")
    price_map = {(row["observation_date"], row["ticker"]): row for row in price_rows}
    benchmark_dates = sorted(
        row["observation_date"]
        for row in price_rows
        if row.get("ticker") == benchmark and row.get("close") not in (None, "") and row["observation_date"] >= effective_signal_date
    )
    strategy_ids = ["A_SELECTION", "B_SELECTION", "A_PORTFOLIO", "B_PORTFOLIO"]
    signals: dict[tuple[str, str], list[dict[str, str]]] = {}
    for row in signal_rows:
        signals.setdefault((row["strategy_id"], row["signal_date"]), []).append(row)

    commission = float(costs.get("commissionBpsPerSide", 3.0)) / 10000.0
    slippage = float(costs.get("slippageBpsPerSide", 5.0)) / 10000.0
    sell_tax = float(costs.get("sellStampDutyBps", 5.0)) / 10000.0
    positions_by_strategy: dict[str, dict[str, dict[str, object]]] = {}
    nav_rows: list[dict[str, object]] = []
    trade_rows: list[dict[str, object]] = []
    summaries: dict[str, dict[str, object]] = {}

    for strategy_id in strategy_ids:
        variant, track = _variant_track(strategy_id)
        cash = 1.0
        positions: dict[str, dict[str, object]] = {}
        previous_nav = 1.0
        peak_nav = 1.0
        executed_signal_dates: set[str] = set()
        strategy_nav_rows: list[dict[str, object]] = []
        if benchmark_dates:
            baseline = {
                "valuation_date": effective_signal_date,
                "variant": variant,
                "comparison_track": track,
                "strategy_id": strategy_id,
                "nav_net": 1.0,
                "daily_return_pct": 0.0,
                "cumulative_return_pct": 0.0,
                "peak_nav": 1.0,
                "drawdown_pct": 0.0,
                "gross_exposure_pct": 0.0,
                "cash_pct": 100.0,
                "holding_count": 0,
                "turnover_pct": 0.0,
                "transaction_cost": 0.0,
                "carry_forward_count": 0,
                "last_executed_signal_date": "",
            }
            strategy_nav_rows.append(baseline)

        for date_index, valuation_date in enumerate(benchmark_dates):
            if valuation_date <= effective_signal_date:
                continue
            scheduled = sorted(
                signal_date
                for (key_strategy, signal_date) in signals
                if key_strategy == strategy_id
                and signal_date < valuation_date
                and signal_date not in executed_signal_dates
                and not any(date > signal_date and date < valuation_date for date in benchmark_dates)
            )
            daily_turnover = 0.0
            daily_cost = 0.0
            last_executed_signal = ""
            if scheduled:
                signal_date = scheduled[-1]
                target_rows = signals[(strategy_id, signal_date)]
                target_by_ticker = {
                    row["ticker"]: row
                    for row in target_rows
                    if float(row.get("target_weight_pct") or 0) > 0
                }
                nav_open = cash
                for ticker, position in positions.items():
                    price, _carry = _price_or_last(
                        price_map, valuation_date, ticker, "open", float(position["last_price"])
                    )
                    nav_open += float(position["shares"]) * price

                desired_shares: dict[str, float] = {}
                for ticker, target in target_by_ticker.items():
                    row = price_map.get((valuation_date, ticker))
                    if row and row.get("open") not in (None, "") and float(row.get("volume") or 0) > 0:
                        desired_shares[ticker] = (
                            nav_open * float(target["target_weight_pct"]) / 100.0 / float(row["open"])
                        )

                for ticker in sorted(list(positions)):
                    position = positions[ticker]
                    current_shares = float(position["shares"])
                    desired = desired_shares.get(ticker, 0.0)
                    if desired >= current_shares - 1e-12:
                        continue
                    row = price_map.get((valuation_date, ticker))
                    if not row or row.get("open") in (None, "") or float(row.get("volume") or 0) <= 0:
                        trade_rows.append({
                            "execution_date": valuation_date,
                            "signal_date": signal_date,
                            "strategy_id": strategy_id,
                            "action": "SELL",
                            "ticker": ticker,
                            "price": "",
                            "shares": round(current_shares - desired, 10),
                            "notional": "",
                            "transaction_cost": "",
                            "cash_after": round(cash, 10),
                            "status": "BLOCKED_NO_BAR",
                            "reason": "no executable open; holding carried forward",
                        })
                        continue
                    if str(position.get("entry_date")) >= valuation_date:
                        continue
                    price = float(row["open"])
                    previous = _previous_close(price_map, benchmark_dates, date_index, ticker)
                    if _at_limit(ticker, price, previous, "down"):
                        trade_rows.append({
                            "execution_date": valuation_date,
                            "signal_date": signal_date,
                            "strategy_id": strategy_id,
                            "action": "SELL",
                            "ticker": ticker,
                            "price": price,
                            "shares": round(current_shares - desired, 10),
                            "notional": "",
                            "transaction_cost": "",
                            "cash_after": round(cash, 10),
                            "status": "BLOCKED_LIMIT_DOWN",
                            "reason": "conservative A-share limit model",
                        })
                        continue
                    shares = current_shares - desired
                    notional = shares * price
                    cost = notional * (commission + slippage + sell_tax)
                    cash += notional - cost
                    daily_turnover += notional
                    daily_cost += cost
                    if desired <= 1e-12:
                        del positions[ticker]
                    else:
                        position["shares"] = desired
                    trade_rows.append({
                        "execution_date": valuation_date,
                        "signal_date": signal_date,
                        "strategy_id": strategy_id,
                        "action": "SELL",
                        "ticker": ticker,
                        "price": round(price, 6),
                        "shares": round(shares, 10),
                        "notional": round(notional, 10),
                        "transaction_cost": round(cost, 10),
                        "cash_after": round(cash, 10),
                        "status": "FILLED_PAPER",
                        "reason": "rebalance to frozen target",
                    })

                planned_buys: list[tuple[str, float, float, dict[str, str]]] = []
                for ticker, desired in desired_shares.items():
                    current = float(positions.get(ticker, {}).get("shares", 0.0))
                    if desired <= current + 1e-12:
                        continue
                    row = price_map[(valuation_date, ticker)]
                    price = float(row["open"])
                    previous = _previous_close(price_map, benchmark_dates, date_index, ticker)
                    if _at_limit(ticker, price, previous, "up"):
                        trade_rows.append({
                            "execution_date": valuation_date,
                            "signal_date": signal_date,
                            "strategy_id": strategy_id,
                            "action": "BUY",
                            "ticker": ticker,
                            "price": price,
                            "shares": round(desired - current, 10),
                            "notional": "",
                            "transaction_cost": "",
                            "cash_after": round(cash, 10),
                            "status": "BLOCKED_LIMIT_UP",
                            "reason": "conservative A-share limit model",
                        })
                        continue
                    planned_buys.append((ticker, desired - current, price, target_by_ticker[ticker]))
                required = sum(shares * price * (1.0 + commission + slippage) for ticker, shares, price, target in planned_buys)
                required_notional = sum(shares * price for ticker, shares, price, target in planned_buys)
                actual_open_gross = sum(
                    float(position["shares"])
                    * _price_or_last(
                        price_map,
                        valuation_date,
                        ticker,
                        "open",
                        float(position["last_price"]),
                    )[0]
                    for ticker, position in positions.items()
                )
                target_gross = nav_open * sum(
                    float(target["target_weight_pct"]) for target in target_by_ticker.values()
                ) / 100.0
                gross_capacity = max(0.0, target_gross - actual_open_gross)
                cash_scale = min(1.0, cash / required) if required > 0 else 0.0
                gross_scale = min(1.0, gross_capacity / required_notional) if required_notional > 0 else 0.0
                buy_scale = min(cash_scale, gross_scale)
                for ticker, planned_shares, price, target in planned_buys:
                    shares = planned_shares * buy_scale
                    if shares <= 1e-12:
                        continue
                    notional = shares * price
                    cost = notional * (commission + slippage)
                    cash -= notional + cost
                    daily_turnover += notional
                    daily_cost += cost
                    if ticker in positions:
                        position = positions[ticker]
                        old_shares = float(position["shares"])
                        total_shares = old_shares + shares
                        position["entry_price"] = (
                            old_shares * float(position["entry_price"]) + shares * price
                        ) / total_shares
                        position["shares"] = total_shares
                    else:
                        positions[ticker] = {
                            "shares": shares,
                            "entry_date": valuation_date,
                            "entry_price": price,
                            "initial_stop": target.get("initial_stop", ""),
                            "active_stop": target.get("active_stop", ""),
                            "peak_close": price,
                            "last_price": price,
                        }
                    trade_rows.append({
                        "execution_date": valuation_date,
                        "signal_date": signal_date,
                        "strategy_id": strategy_id,
                        "action": "BUY",
                        "ticker": ticker,
                        "price": round(price, 6),
                        "shares": round(shares, 10),
                        "notional": round(notional, 10),
                        "transaction_cost": round(cost, 10),
                        "cash_after": round(cash, 10),
                        "status": "FILLED_PAPER",
                        "reason": "rebalance to frozen target",
                    })
                for ticker, target in target_by_ticker.items():
                    position = positions.get(ticker)
                    if not position:
                        continue
                    target_initial = _float(target, "initial_stop")
                    target_active = _float(target, "active_stop")
                    if target_initial:
                        existing_initial = _float(position, "initial_stop")
                        position["initial_stop"] = max(existing_initial, target_initial)
                    if target_active:
                        existing_active = _float(position, "active_stop")
                        position["active_stop"] = max(existing_active, target_active)
                executed_signal_dates.add(signal_date)
                last_executed_signal = signal_date

            nav = cash
            gross = 0.0
            carry_count = 0
            for ticker, position in positions.items():
                price, carried = _price_or_last(
                    price_map, valuation_date, ticker, "close", float(position["last_price"])
                )
                if carried:
                    carry_count += 1
                position["last_price"] = price
                position["peak_close"] = max(float(position.get("peak_close") or price), price)
                value = float(position["shares"]) * price
                gross += value
                nav += value
            daily_return = nav / previous_nav - 1.0 if previous_nav else 0.0
            previous_nav = nav
            peak_nav = max(peak_nav, nav)
            drawdown = nav / peak_nav - 1.0 if peak_nav else 0.0
            nav_row = {
                "valuation_date": valuation_date,
                "variant": variant,
                "comparison_track": track,
                "strategy_id": strategy_id,
                "nav_net": round(nav, 10),
                "daily_return_pct": round(daily_return * 100.0, 8),
                "cumulative_return_pct": round((nav - 1.0) * 100.0, 8),
                "peak_nav": round(peak_nav, 10),
                "drawdown_pct": round(drawdown * 100.0, 8),
                "gross_exposure_pct": round(gross / nav * 100.0, 8) if nav else 0.0,
                "cash_pct": round(cash / nav * 100.0, 8) if nav else 0.0,
                "holding_count": len(positions),
                "turnover_pct": round(daily_turnover / nav * 100.0, 8) if nav else 0.0,
                "transaction_cost": round(daily_cost, 10),
                "carry_forward_count": carry_count,
                "last_executed_signal_date": last_executed_signal,
            }
            strategy_nav_rows.append(nav_row)
        positions_by_strategy[strategy_id] = positions
        summaries[strategy_id] = _summary_for_rows(strategy_nav_rows)
        nav_rows.extend(strategy_nav_rows)

    write_csv(root / "trades.csv", trade_rows, TRADE_HEADERS)
    write_csv(root / "daily_nav.csv", nav_rows, NAV_HEADERS)

    position_rows: list[dict[str, object]] = []
    for strategy_id, positions in positions_by_strategy.items():
        nav = float(summaries[strategy_id].get("nav") or 1.0)
        for ticker, position in sorted(positions.items()):
            value = float(position["shares"]) * float(position["last_price"])
            position_rows.append({
                "strategy_id": strategy_id,
                "ticker": ticker,
                "shares": round(float(position["shares"]), 10),
                "entry_date": position.get("entry_date", ""),
                "entry_price": round(float(position["entry_price"]), 6),
                "initial_stop": position.get("initial_stop", ""),
                "active_stop": position.get("active_stop", ""),
                "peak_close": round(float(position.get("peak_close") or 0), 6),
                "last_price": round(float(position["last_price"]), 6),
                "market_value": round(value, 10),
                "weight_pct": round(value / nav * 100.0, 8) if nav else 0.0,
            })
    write_csv(root / "positions.csv", position_rows, POSITION_HEADERS)

    comparison_rows: list[dict[str, object]] = []
    nav_by_key = {(row["comparison_track"], row["valuation_date"], row["variant"]): row for row in nav_rows}
    for track in ("selection", "portfolio"):
        dates = sorted({date for row_track, date, variant in nav_by_key if row_track == track})
        for date in dates:
            a = nav_by_key.get((track, date, "A"))
            b = nav_by_key.get((track, date, "B"))
            if not a or not b:
                continue
            a_nav = float(a["nav_net"])
            b_nav = float(b["nav_net"])
            comparison_rows.append({
                "comparison_track": track,
                "valuation_date": date,
                "a_nav": a_nav,
                "b_nav": b_nav,
                "b_minus_a_return_pct_points": round((b_nav - a_nav) * 100.0, 8),
                "relative_nav_b_vs_a_pct": round((b_nav / a_nav - 1.0) * 100.0, 8) if a_nav else "",
                "a_drawdown_pct": a["drawdown_pct"],
                "b_drawdown_pct": b["drawdown_pct"],
                "drawdown_improvement_pct_points": round(abs(float(a["drawdown_pct"])) - abs(float(b["drawdown_pct"])), 8),
            })
    write_csv(root / "comparison.csv", comparison_rows, COMPARISON_HEADERS)

    paired_days = min(
        int(summaries["A_PORTFOLIO"].get("valuationDays") or 0),
        int(summaries["B_PORTFOLIO"].get("valuationDays") or 0),
    )
    a_portfolio = summaries["A_PORTFOLIO"]
    b_portfolio = summaries["B_PORTFOLIO"]
    signal_dates_by_strategy = {
        strategy_id: {row["signal_date"] for row in signal_rows if row["strategy_id"] == strategy_id}
        for strategy_id in strategy_ids
    }
    paired_signal_dates = set.intersection(*(signal_dates_by_strategy[strategy_id] for strategy_id in strategy_ids))
    if paired_days < minimum_paired_days:
        decision = "INSUFFICIENT_DATA"
    elif (
        float(b_portfolio["cumulativeReturnPct"]) > float(a_portfolio["cumulativeReturnPct"])
        and abs(float(b_portfolio["maxDrawdownPct"])) <= abs(float(a_portfolio["maxDrawdownPct"]))
    ):
        decision = "B_WIN"
    elif (
        float(a_portfolio["cumulativeReturnPct"]) > float(b_portfolio["cumulativeReturnPct"])
        and abs(float(a_portfolio["maxDrawdownPct"])) <= abs(float(b_portfolio["maxDrawdownPct"]))
    ):
        decision = "A_WIN"
    else:
        decision = "MIXED"
    experiment_status = "active_prospective"
    price_mode = "public_tencent_unadjusted_fail_closed"
    experiment_path = root / "experiment.json"
    if experiment_path.exists():
        with experiment_path.open("r", encoding="utf-8") as handle:
            experiment_payload = json.load(handle)
        experiment_status = str(experiment_payload.get("status") or experiment_status)
        price_mode = str(experiment_payload.get("priceMode") or price_mode)
    summary_payload = {
        "experimentStatus": experiment_status,
        "effectiveSignalDate": effective_signal_date,
        "lastValuationDate": benchmark_dates[-1] if benchmark_dates else None,
        "pairedTradingDays": paired_days,
        "pairedSignalDays": len(paired_signal_dates),
        "minimumPairedTradingDays": minimum_paired_days,
        "decisionStatus": decision,
        "tracks": {
            "selection": {"A": summaries["A_SELECTION"], "B": summaries["B_SELECTION"]},
            "portfolio": {"A": a_portfolio, "B": b_portfolio},
        },
        "executionDiagnostics": {
            strategy_id: {
                "blockedTrades": sum(
                    1
                    for row in trade_rows
                    if row["strategy_id"] == strategy_id and str(row["status"]).startswith("BLOCKED_")
                ),
                "filledTrades": sum(
                    1
                    for row in trade_rows
                    if row["strategy_id"] == strategy_id and row["status"] == "FILLED_PAPER"
                ),
            }
            for strategy_id in strategy_ids
        },
        "method": {
            "signal": "completed market close",
            "execution": "next benchmark trading-session open",
            "priceMode": price_mode,
            "priceBasis": (
                "frozen unadjusted public Tencent daily OHLC; production refresh fails closed"
                if price_mode == "public_tencent_unadjusted_fail_closed"
                else "frozen local qfq daily OHLC; offline test only"
            ),
            "returnBasis": "price return net of modeled costs; cash dividends are not yet credited",
            "tPlusOne": True,
            "limitModel": "conservative open-price limit check",
            "missingPrice": "carry forward last frozen close",
            "researchCosts": costs,
        },
        "updatedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
    }
    with (root / "summary.json").open("w", encoding="utf-8") as handle:
        json.dump(summary_payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    return LedgerResult(positions_by_strategy, summaries, nav_rows, trade_rows)
