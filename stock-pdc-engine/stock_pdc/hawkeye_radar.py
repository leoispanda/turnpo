from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path

from .indicators import closes, pct_change, safe_round, sma
from .models import Bar
from .config import HAWKEYE_MIN_MARKET_CAP_CNY, HAWKEYE_MIN_RETURN_60D_PCT


@dataclass(frozen=True)
class HawkeyeMetadata:
    ticker: str
    name: str = ""
    total_mcap: float | None = None


@dataclass(frozen=True)
class HawkeyeResult:
    ticker: str
    passed: bool
    name: str
    total_mcap: float | None
    return_60d: float | None
    latest_daily_return: float | None
    max_single_day_gain: float | None
    max_single_day_loss: float | None
    latest_close: float | None
    sma20: float | None
    sma50: float | None
    sma200: float | None
    reason: str
    rejection_reason: str


def _normalize_header(value: str) -> str:
    return value.strip().lower().replace("_", " ")


def _number(value: str | None) -> float | None:
    if value is None:
        return None
    clean = value.strip().replace(",", "")
    if clean.lower() in {"", "-", "nan", "none"}:
        return None
    try:
        return float(clean)
    except ValueError:
        return None


def _column(fieldnames: list[str], *aliases: str) -> str | None:
    normalized = {_normalize_header(name): name for name in fieldnames}
    for alias in aliases:
        match = normalized.get(_normalize_header(alias))
        if match:
            return match
    return None


def load_hawkeye_metadata(path: Path) -> dict[str, HawkeyeMetadata]:
    if not path.exists():
        return {}

    with path.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)
        if not reader.fieldnames:
            return {}
        ticker_col = _column(reader.fieldnames, "ticker", "symbol")
        name_col = _column(reader.fieldnames, "name", "security_name")
        mcap_col = _column(reader.fieldnames, "total_mcap", "market_cap", "total market cap", "mcap")
        if ticker_col is None:
            return {}

        metadata: dict[str, HawkeyeMetadata] = {}
        for row in reader:
            ticker = str(row.get(ticker_col) or "").strip().upper()
            if not ticker:
                continue
            metadata[ticker] = HawkeyeMetadata(
                ticker=ticker,
                name=str(row.get(name_col) or "").strip() if name_col else "",
                total_mcap=_number(row.get(mcap_col)) if mcap_col else None,
            )
        return metadata


def _daily_returns(bars: list[Bar], lookback: int) -> list[float]:
    recent = bars[-(lookback + 1) :] if len(bars) > lookback else bars
    returns: list[float] = []
    for previous, current in zip(recent, recent[1:]):
        if previous.close:
            returns.append((current.close / previous.close - 1.0) * 100.0)
    return returns


def screen_stock(
    ticker: str,
    bars: list[Bar],
    metadata: HawkeyeMetadata | None,
) -> HawkeyeResult:
    close_values = closes(bars)
    latest_close = close_values[-1] if close_values else None
    latest_sma20 = sma(close_values, 20)
    latest_sma50 = sma(close_values, 50)
    latest_sma200 = sma(close_values, 200)
    return_60d = pct_change(close_values, 60)
    daily_returns = _daily_returns(bars, 1)
    latest_daily_return = daily_returns[-1] if daily_returns else None
    max_gain = max(daily_returns) if daily_returns else None
    max_loss = min(daily_returns) if daily_returns else None
    total_mcap = metadata.total_mcap if metadata else None
    name = metadata.name if metadata else ""

    reasons: list[str] = []
    rejections: list[str] = []

    # Hawkeye has exactly two fixed eligibility rules. Technical and risk
    # interpretation belongs exclusively to the PDC members.

    if total_mcap is None:
        rejections.append("missing total market cap metadata")
    elif total_mcap <= HAWKEYE_MIN_MARKET_CAP_CNY:
        rejections.append(f"total market cap {safe_round(total_mcap / 100_000_000)}亿 <= {safe_round(HAWKEYE_MIN_MARKET_CAP_CNY / 100_000_000)}亿")
    else:
        reasons.append(f"total market cap > {safe_round(HAWKEYE_MIN_MARKET_CAP_CNY / 100_000_000)}亿")

    if return_60d is None:
        rejections.append("missing 60d return")
    elif return_60d <= HAWKEYE_MIN_RETURN_60D_PCT:
        rejections.append(f"60d return {safe_round(return_60d)}% <= {safe_round(HAWKEYE_MIN_RETURN_60D_PCT)}%")
    else:
        reasons.append(f"60d return {safe_round(return_60d)}%")

    return HawkeyeResult(
        ticker=ticker,
        passed=not rejections,
        name=name,
        total_mcap=total_mcap,
        return_60d=return_60d,
        latest_daily_return=latest_daily_return,
        max_single_day_gain=max_gain,
        max_single_day_loss=max_loss,
        latest_close=latest_close,
        sma20=latest_sma20,
        sma50=latest_sma50,
        sma200=latest_sma200,
        reason="; ".join(reasons),
        rejection_reason="; ".join(rejections),
    )


def screen_universe(
    universe: dict[str, list[Bar]],
    metadata: dict[str, HawkeyeMetadata],
) -> list[HawkeyeResult]:
    results = [
        screen_stock(
            ticker,
            bars,
            metadata.get(ticker),
        )
        for ticker, bars in sorted(universe.items())
    ]
    results.sort(
        key=lambda result: (
            not result.passed,
            -(result.return_60d or -9999),
            result.ticker,
        )
    )
    return results


def result_to_row(result: HawkeyeResult) -> dict[str, object]:
    return {
        "ticker": result.ticker,
        "passed": result.passed,
        "name": result.name,
        "total_mcap": result.total_mcap,
        "return_60d": result.return_60d,
        "latest_daily_return": result.latest_daily_return,
        "max_single_day_gain": result.max_single_day_gain,
        "max_single_day_loss": result.max_single_day_loss,
        "latest_close": result.latest_close,
        "sma20": result.sma20,
        "sma50": result.sma50,
        "sma200": result.sma200,
        "reason": result.reason,
        "rejection_reason": result.rejection_reason,
    }
