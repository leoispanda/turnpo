from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path

from .indicators import closes, pct_change, safe_round, sma
from .models import Bar


@dataclass(frozen=True)
class HawkeyeMetadata:
    ticker: str
    name: str = ""
    total_mcap: float | None = None
    universe_status: str = ""
    history_status: str = ""
    history_error: str = ""
    market_data_timestamp: str = ""
    market_data_provider: str = ""


@dataclass(frozen=True)
class HawkeyeResult:
    ticker: str
    status: str
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
    market_data_provider: str = ""


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
        universe_status_col = _column(reader.fieldnames, "universe_status")
        history_status_col = _column(reader.fieldnames, "history_status")
        history_error_col = _column(reader.fieldnames, "history_error")
        market_timestamp_col = _column(reader.fieldnames, "market_data_timestamp", "snapshot_at")
        market_provider_col = _column(reader.fieldnames, "market_data_provider", "market_data_source")
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
                universe_status=str(row.get(universe_status_col) or "").strip() if universe_status_col else "",
                history_status=str(row.get(history_status_col) or "").strip() if history_status_col else "",
                history_error=str(row.get(history_error_col) or "").strip() if history_error_col else "",
                market_data_timestamp=(
                    str(row.get(market_timestamp_col) or "").strip() if market_timestamp_col else ""
                ),
                market_data_provider=(
                    str(row.get(market_provider_col) or "").strip() if market_provider_col else ""
                ),
            )
        return metadata


def _daily_returns(bars: list[Bar], lookback: int) -> list[float]:
    recent = bars[-(lookback + 1) :] if len(bars) > lookback else bars
    returns: list[float] = []
    for previous, current in zip(recent, recent[1:]):
        if previous.close:
            returns.append((current.close / previous.close - 1.0) * 100.0)
    return returns


def _is_clear_uptrend(latest: float, sma20: float | None, sma50: float | None, sma200: float | None) -> bool:
    if sma20 is None or sma50 is None:
        return False
    if latest <= sma20 or sma20 <= sma50:
        return False
    if sma200 is not None and latest <= sma200:
        return False
    return True


def screen_stock(
    ticker: str,
    bars: list[Bar] | None,
    metadata: HawkeyeMetadata | None,
    min_market_cap: float,
    min_return_60d: float,
    max_daily_move: float,
    daily_move_lookback: int,
    min_bars: int,
) -> HawkeyeResult:
    bars = bars or []
    close_values = closes(bars)
    latest_close = close_values[-1] if close_values else None
    latest_sma20 = sma(close_values, 20)
    latest_sma50 = sma(close_values, 50)
    latest_sma200 = sma(close_values, 200)
    return_60d = pct_change(close_values, 60)
    daily_returns = _daily_returns(bars, daily_move_lookback)
    latest_daily_return = daily_returns[-1] if daily_returns else None
    max_gain = max(daily_returns) if daily_returns else None
    max_loss = min(daily_returns) if daily_returns else None
    total_mcap = metadata.total_mcap if metadata else None
    name = metadata.name if metadata else ""
    market_data_provider = metadata.market_data_provider if metadata else ""

    reasons: list[str] = []
    rejections: list[str] = []

    # Hawkeye has exactly two eligibility rules: market cap and positive
    # 60-day return. Technical and risk interpretation belongs to PDC.
    _ = min_bars, max_daily_move, daily_move_lookback

    if metadata is None:
        return HawkeyeResult(
            ticker=ticker,
            status="DATA_FAILED_MISSING_METADATA",
            passed=False,
            name="",
            total_mcap=None,
            return_60d=None,
            latest_daily_return=None,
            max_single_day_gain=None,
            max_single_day_loss=None,
            latest_close=None,
            sma20=None,
            sma50=None,
            sma200=None,
            market_data_provider=market_data_provider,
            reason="",
            rejection_reason="market metadata missing",
        )

    if metadata.universe_status.startswith("UNIVERSE_EXCLUDED"):
        return HawkeyeResult(
            ticker=ticker,
            status=metadata.universe_status,
            passed=False,
            name=name,
            total_mcap=total_mcap,
            return_60d=None,
            latest_daily_return=None,
            max_single_day_gain=None,
            max_single_day_loss=None,
            latest_close=None,
            sma20=None,
            sma50=None,
            sma200=None,
            market_data_provider=market_data_provider,
            reason="",
            rejection_reason=metadata.history_error or metadata.universe_status,
        )

    if total_mcap is None:
        return HawkeyeResult(
            ticker=ticker,
            status="DATA_FAILED_MISSING_MARKET_CAP",
            passed=False,
            name=name,
            total_mcap=None,
            return_60d=None,
            latest_daily_return=None,
            max_single_day_gain=None,
            max_single_day_loss=None,
            latest_close=None,
            sma20=None,
            sma50=None,
            sma200=None,
            market_data_provider=market_data_provider,
            reason="",
            rejection_reason="missing total market cap metadata",
        )
    elif total_mcap <= min_market_cap:
        rejections.append(f"total market cap {safe_round(total_mcap / 100_000_000)}亿 <= {safe_round(min_market_cap / 100_000_000)}亿")
        # Once the first hard rule fails, missing history cannot change the
        # result.  Keep the rejection explicit rather than misclassifying it
        # as a model or market-data failure.
        return HawkeyeResult(
            ticker=ticker,
            status="REJECTED_HAWKEYE",
            passed=False,
            name=name,
            total_mcap=total_mcap,
            return_60d=None,
            latest_daily_return=None,
            max_single_day_gain=None,
            max_single_day_loss=None,
            latest_close=None,
            sma20=None,
            sma50=None,
            sma200=None,
            market_data_provider=market_data_provider,
            reason="",
            rejection_reason="; ".join(rejections),
        )
    else:
        reasons.append(f"total market cap > {safe_round(min_market_cap / 100_000_000)}亿")

    if metadata.history_status and metadata.history_status != "HISTORY_READY":
        return HawkeyeResult(
            ticker=ticker,
            status=f"DATA_FAILED_{metadata.history_status}",
            passed=False,
            name=name,
            total_mcap=total_mcap,
            return_60d=None,
            latest_daily_return=None,
            max_single_day_gain=None,
            max_single_day_loss=None,
            latest_close=None,
            sma20=None,
            sma50=None,
            sma200=None,
            market_data_provider=market_data_provider,
            reason="; ".join(reasons),
            rejection_reason=metadata.history_error or metadata.history_status,
        )

    if not bars:
        return HawkeyeResult(
            ticker=ticker,
            status="DATA_FAILED_MISSING_HISTORY",
            passed=False,
            name=name,
            total_mcap=total_mcap,
            return_60d=None,
            latest_daily_return=None,
            max_single_day_gain=None,
            max_single_day_loss=None,
            latest_close=None,
            sma20=None,
            sma50=None,
            sma200=None,
            market_data_provider=market_data_provider,
            reason="; ".join(reasons),
            rejection_reason="OHLCV history missing",
        )

    if return_60d is None:
        rejections.append("missing 60d return")
    elif return_60d <= min_return_60d:
        rejections.append(f"60d return {safe_round(return_60d)}% <= {safe_round(min_return_60d)}%")
    else:
        reasons.append(f"60d return {safe_round(return_60d)}%")

    return HawkeyeResult(
        ticker=ticker,
        status="PASSED_HAWKEYE" if not rejections else "REJECTED_HAWKEYE",
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
        market_data_provider=market_data_provider,
        reason="; ".join(reasons),
        rejection_reason="; ".join(rejections),
    )


def screen_universe(
    universe: dict[str, list[Bar]],
    metadata: dict[str, HawkeyeMetadata],
    min_market_cap: float,
    min_return_60d: float,
    max_daily_move: float,
    daily_move_lookback: int,
    min_bars: int,
) -> list[HawkeyeResult]:
    # Metadata is the full API market snapshot; `universe` contains only
    # tickers whose OHLCV history is ready.  Iterating their union prevents a
    # failed or deliberately unrequested history download from disappearing
    # from the Hawkeye audit.
    all_tickers = set(universe) | set(metadata)
    results = [
        screen_stock(
            ticker,
            universe.get(ticker),
            metadata.get(ticker),
            min_market_cap,
            min_return_60d,
            max_daily_move,
            daily_move_lookback,
            min_bars,
        )
        for ticker in sorted(all_tickers)
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
        "status": result.status,
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
        "market_data_provider": result.market_data_provider,
        "reason": result.reason,
        "rejection_reason": result.rejection_reason,
    }
