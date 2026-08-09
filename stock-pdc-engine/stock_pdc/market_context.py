from __future__ import annotations

from .config import BENCHMARK_PRIORITY
from .indicators import closes, distance_pct, drawdown_from_high, pct_change, sma, volatility_pct
from .models import Bar


def _benchmark_stats(ticker: str, bars: list[Bar]) -> dict[str, object]:
    close_values = closes(bars)
    latest = close_values[-1]
    sma20 = sma(close_values, 20)
    sma50 = sma(close_values, 50)
    sma200 = sma(close_values, 200)
    return {
        "mode": "benchmark",
        "benchmark": ticker,
        "latest_close": latest,
        "sma20": sma20,
        "sma50": sma50,
        "sma200": sma200,
        "dist_20": distance_pct(latest, sma20),
        "dist_50": distance_pct(latest, sma50),
        "dist_200": distance_pct(latest, sma200),
        "return_5d": pct_change(close_values, 5),
        "return_20d": pct_change(close_values, 20),
        "return_60d": pct_change(close_values, 60),
        "drawdown_60d": drawdown_from_high(close_values, 60),
        "volatility_20d": volatility_pct(close_values, 20),
    }


def _breadth_stats(universe: dict[str, list[Bar]]) -> dict[str, object]:
    candidates = 0
    above_50 = 0
    positive_20d = 0
    positive_60d = 0

    for bars in universe.values():
        close_values = closes(bars)
        if len(close_values) < 60:
            continue
        candidates += 1
        latest = close_values[-1]
        sma50 = sma(close_values, 50)
        return_20d = pct_change(close_values, 20)
        return_60d = pct_change(close_values, 60)
        if sma50 and latest > sma50:
            above_50 += 1
        if return_20d is not None and return_20d > 0:
            positive_20d += 1
        if return_60d is not None and return_60d > 0:
            positive_60d += 1

    if candidates == 0:
        return {"mode": "empty", "benchmark": None}

    return {
        "mode": "breadth",
        "benchmark": None,
        "breadth_above_50": above_50 / candidates,
        "breadth_positive_20d": positive_20d / candidates,
        "breadth_positive_60d": positive_60d / candidates,
        "breadth_count": candidates,
    }


def build_market_context(
    universe: dict[str, list[Bar]], preferred_benchmark: str | None = None
) -> dict[str, object]:
    candidates: list[str] = []
    if preferred_benchmark:
        candidates.append(preferred_benchmark.upper())
    candidates.extend(BENCHMARK_PRIORITY)

    for ticker in candidates:
        if ticker in universe and len(universe[ticker]) >= 50:
            return _benchmark_stats(ticker, universe[ticker])

    return _breadth_stats(universe)
