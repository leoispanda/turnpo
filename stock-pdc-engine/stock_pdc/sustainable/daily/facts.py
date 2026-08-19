"""Frozen facts for the daily path, and the fact ids a seat may cite.

One fact table is built per run and hashed. Both seats see projections of that
same table — a compact numeric line in discovery, the full record plus the
engine's measured signal prose in detail — so "the two seats read the same
evidence" is true by construction rather than by convention.

Every numeric field carries a stable id (``600519.SH.rsi14``). Round 3 accepts a
revision only when it cites ids from this registry, which is what stops the
final round from becoming a second opinion with no evidence behind it.

Company names never reach a seat. The committee is meant to read measurements,
not to recall what it knows about a brand; the name is carried alongside for the
human-facing report only.
"""

from __future__ import annotations

from typing import Any

from ...indicators import (
    atr,
    closes,
    distance_pct,
    drawdown_from_high,
    pct_change,
    rsi,
    sma,
    volatility_pct,
)
from ...models import Bar
from ..evidence import canonical_hash


FACTS_SCHEMA_VERSION = "pdc-daily-facts-v1"

# The numeric fields a seat may reason from, in the order they are rendered.
# Every one is arithmetic over real bars or over the exchange's own turnover
# figures; none of them is a verdict.
NUMERIC_FIELDS: tuple[str, ...] = (
    "close",
    "sma20_dist_pct",
    "sma50_dist_pct",
    "sma200_dist_pct",
    "mom20_pct",
    "mom60_pct",
    "rsi14",
    "atr_pct",
    "vol20_pct",
    "dd60_pct",
    "pivot55",
    "pivot_dist_pct",
    "stop",
    "stop_dist_pct",
    "turnover_yi",
    "turnover_rate",
    "mcap_yi",
)

# Short headers for the compact discovery table. Keeping the rendered table
# narrow is what makes one call for the whole pool possible at all.
FIELD_HEADERS: dict[str, str] = {
    "close": "close",
    "sma20_dist_pct": "d20",
    "sma50_dist_pct": "d50",
    "sma200_dist_pct": "d200",
    "mom20_pct": "m20",
    "mom60_pct": "m60",
    "rsi14": "rsi",
    "atr_pct": "atr%",
    "vol20_pct": "vol%",
    "dd60_pct": "dd60",
    "pivot55": "pivot",
    "pivot_dist_pct": "dpivot",
    "stop": "stop",
    "stop_dist_pct": "dstop",
    "turnover_yi": "amt亿",
    "turnover_rate": "turn%",
    "mcap_yi": "mcap亿",
}

FIELD_MEANINGS = (
    "close=latest close; d20/d50/d200=percent distance from the 20/50/200-day SMA; "
    "m20/m60=20/60-day price change percent; rsi=14-day RSI; atr%=14-day ATR as a "
    "percent of close; vol%=20-day return standard deviation; dd60=percent below the "
    "60-day high; pivot=highest high of the prior 55 sessions; dpivot=percent distance "
    "from that pivot; stop=engine technical stop (20-day low, or the 50-day SMA when it "
    "sits below price); dstop=percent the close sits above that stop; amt亿=session "
    "turnover in 100M CNY; turn%=turnover rate; mcap亿=total market cap in 100M CNY"
)

# The engine's per-dimension prose. Measurements, not scores: the rule engine's
# own verdict stays withheld for the same reason Round 1 withholds it upstream —
# a seat shown a finished answer edits it instead of forming one.
SIGNAL_FIELDS: tuple[str, ...] = (
    "market_regime_signal",
    "trend_signal",
    "livermore_breakout_signal",
    "volume_price_signal",
    "candlestick_signal",
    "overheat_signal",
    "risk_signal",
    "zhuge_orion_signal",
    "final_chair_signal",
)


class FactError(ValueError):
    """A candidate cannot be turned into a usable fact record."""


def _round(value: float | None, digits: int) -> float | None:
    return None if value is None else round(float(value), digits)


def measure(bars: list[Bar]) -> dict[str, float | None]:
    """Derive every numeric fact for one candidate from its bars.

    The pivot and the stop are imported from the orchestrator rather than
    restated here, so the number a seat reads is the same number the engine
    would place on the daily instruction sheet.
    """
    from ...pdc_orchestrator import _breakout_trigger, _technical_stop

    if not bars:
        raise FactError("没有 K 线，无法生成事实")
    close_values = closes(bars)
    latest = close_values[-1]
    if latest <= 0:
        raise FactError("最新收盘价非正数")

    average_true_range = atr(bars)
    pivot = _breakout_trigger(bars)
    stop = _technical_stop(bars)
    return {
        "close": _round(latest, 3),
        "sma20_dist_pct": _round(distance_pct(latest, sma(close_values, 20)), 2),
        "sma50_dist_pct": _round(distance_pct(latest, sma(close_values, 50)), 2),
        "sma200_dist_pct": _round(distance_pct(latest, sma(close_values, 200)), 2),
        "mom20_pct": _round(pct_change(close_values, 20), 2),
        "mom60_pct": _round(pct_change(close_values, 60), 2),
        "rsi14": _round(rsi(close_values), 1),
        "atr_pct": _round(
            None if average_true_range is None else average_true_range / latest * 100.0, 2
        ),
        "vol20_pct": _round(volatility_pct(close_values), 2),
        "dd60_pct": _round(drawdown_from_high(close_values, 60), 2),
        "pivot55": _round(pivot, 3),
        "pivot_dist_pct": _round(distance_pct(latest, pivot), 2),
        "stop": _round(stop, 3),
        "stop_dist_pct": _round(distance_pct(latest, stop), 2),
    }


def build_record(
    ticker: str,
    bars: list[Bar],
    metadata: dict[str, Any],
    signals: dict[str, str] | None = None,
) -> dict[str, Any]:
    """One frozen fact record: measurements, market metadata, and prose signals."""
    symbol = str(ticker or "").strip().upper()
    if not symbol:
        raise FactError("缺少 ticker")
    numbers = measure(bars)
    turnover = metadata.get("turnover_amount")
    mcap = metadata.get("total_mcap")
    numbers["turnover_yi"] = _round(None if turnover is None else float(turnover) / 1e8, 3)
    numbers["turnover_rate"] = _round(metadata.get("turnover_rate"), 3)
    numbers["mcap_yi"] = _round(None if mcap is None else float(mcap) / 1e8, 1)
    return {
        "ticker": symbol,
        "latestDate": str(metadata.get("latest_date") or bars[-1].date),
        "values": {name: numbers.get(name) for name in NUMERIC_FIELDS},
        "signals": {
            name: str((signals or {}).get(name) or "").strip()
            for name in SIGNAL_FIELDS
            if str((signals or {}).get(name) or "").strip()
        },
    }


def fact_id(ticker: str, field: str) -> str:
    return f"{ticker.upper()}.{field}"


def fact_ids(record: dict[str, Any]) -> tuple[str, ...]:
    """Every id a seat may cite for this candidate, values only."""
    return tuple(
        fact_id(record["ticker"], name)
        for name in NUMERIC_FIELDS
        if record["values"].get(name) is not None
    )


def build_table(records: list[dict[str, Any]], analysis_date: str, run_id: str) -> dict[str, Any]:
    """Freeze the fact records for one run, with the hash both seats answer to."""
    if not records:
        raise FactError("没有可用的事实记录")
    ordered = sorted(records, key=lambda item: item["ticker"])
    seen: set[str] = set()
    for record in ordered:
        if record["ticker"] in seen:
            raise FactError(f"事实表中出现重复候选：{record['ticker']}")
        seen.add(record["ticker"])
    return {
        "schemaVersion": FACTS_SCHEMA_VERSION,
        "runId": run_id,
        "analysisDate": analysis_date,
        "researchOnly": True,
        "liveTrading": False,
        "candidateCount": len(ordered),
        "tickers": [record["ticker"] for record in ordered],
        "records": ordered,
        "factsHash": canonical_hash(ordered),
    }


def records_by_ticker(table: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {record["ticker"]: record for record in table["records"]}


def subset(table: dict[str, Any], tickers: tuple[str, ...]) -> dict[str, Any]:
    """The same frozen table narrowed to a later round's candidates.

    The hash of the parent table travels with the subset, so a Round 3 artifact
    can still be traced to the evidence Round 1 was frozen against.
    """
    wanted = {ticker.upper() for ticker in tickers}
    index = records_by_ticker(table)
    missing = sorted(wanted - set(index))
    if missing:
        raise FactError(f"事实表缺少候选：{', '.join(missing)}")
    narrowed = [index[ticker] for ticker in sorted(wanted)]
    return {
        **table,
        "candidateCount": len(narrowed),
        "tickers": [record["ticker"] for record in narrowed],
        "records": narrowed,
        "parentFactsHash": table["factsHash"],
        "factsHash": canonical_hash(narrowed),
    }


def _cell(value: float | None) -> str:
    return "" if value is None else f"{value:g}"


def render_table(table: dict[str, Any]) -> str:
    """The compact table a seat reads in discovery.

    Rendered as pipe-separated rows rather than JSON: the same numbers cost
    roughly a third of the characters, which is the difference between one call
    for the whole pool and thirteen.
    """
    header = "ticker|" + "|".join(FIELD_HEADERS[name] for name in NUMERIC_FIELDS)
    lines = [header]
    for record in table["records"]:
        values = record["values"]
        lines.append(
            record["ticker"] + "|" + "|".join(_cell(values.get(name)) for name in NUMERIC_FIELDS)
        )
    return "\n".join(lines)


def render_record(record: dict[str, Any]) -> str:
    """One candidate's measurements and signals, as a seat reads them."""
    values = record["values"]
    numbers = " ".join(
        f"{FIELD_HEADERS[name]}={_cell(values.get(name))}"
        for name in NUMERIC_FIELDS
        if values.get(name) is not None
    )
    block = f"{record['ticker']} [{record['latestDate']}] {numbers}"
    for name, text in sorted(record["signals"].items()):
        block += f"\n  {name}: {text}"
    return block


def render_detail(table: dict[str, Any]) -> str:
    """The fuller per-candidate view used from the detail round onwards."""
    return "\n".join(render_record(record) for record in table["records"])


def render_fact_ids(table: dict[str, Any]) -> str:
    """The citable ids, listed so a seat cannot invent one."""
    return "\n".join(
        f"{record['ticker']}: " + ", ".join(fact_ids(record)) for record in table["records"]
    )


def all_fact_ids(table: dict[str, Any]) -> dict[str, set[str]]:
    return {record["ticker"]: set(fact_ids(record)) for record in table["records"]}


def available_fields(record: dict[str, Any]) -> tuple[str, ...]:
    """The field names this candidate actually has a value for."""
    return tuple(name for name in NUMERIC_FIELDS if record["values"].get(name) is not None)


def fields_by_ticker(table: dict[str, Any]) -> dict[str, set[str]]:
    """The citable field names per candidate.

    A citation names a ticker and a field separately rather than a single
    dotted string. Both are enumerated in the schema, which is what makes a
    mistyped exchange suffix impossible instead of merely rejected.
    """
    return {record["ticker"]: set(available_fields(record)) for record in table["records"]}
