from __future__ import annotations

from statistics import mean, pstdev

from .models import Bar


def clamp_score(value: float) -> float:
    return round(max(1.0, min(10.0, value)), 1)


def closes(bars: list[Bar]) -> list[float]:
    return [bar.close for bar in bars]


def volumes(bars: list[Bar]) -> list[float]:
    return [bar.volume for bar in bars]


def sma(values: list[float], period: int) -> float | None:
    if len(values) < period or period <= 0:
        return None
    return mean(values[-period:])


def pct_change(values: list[float], periods: int) -> float | None:
    if len(values) <= periods or periods <= 0:
        return None
    start = values[-periods - 1]
    end = values[-1]
    if start == 0:
        return None
    return (end / start - 1.0) * 100.0


def distance_pct(value: float, reference: float | None) -> float | None:
    if reference in (None, 0):
        return None
    return (value / reference - 1.0) * 100.0


def drawdown_from_high(values: list[float], lookback: int) -> float | None:
    if not values:
        return None
    sample = values[-lookback:] if len(values) >= lookback else values
    high = max(sample)
    if high == 0:
        return None
    return (values[-1] / high - 1.0) * 100.0


def rsi(values: list[float], period: int = 14) -> float | None:
    if len(values) <= period:
        return None

    gains: list[float] = []
    losses: list[float] = []
    recent = values[-period - 1 :]
    for previous, current in zip(recent, recent[1:]):
        change = current - previous
        gains.append(max(change, 0.0))
        losses.append(abs(min(change, 0.0)))

    avg_gain = mean(gains)
    avg_loss = mean(losses)
    if avg_loss == 0:
        return 100.0
    relative_strength = avg_gain / avg_loss
    return 100.0 - (100.0 / (1.0 + relative_strength))


def atr(bars: list[Bar], period: int = 14) -> float | None:
    if len(bars) <= period:
        return None

    true_ranges: list[float] = []
    recent = bars[-period - 1 :]
    for previous, current in zip(recent, recent[1:]):
        true_range = max(
            current.high - current.low,
            abs(current.high - previous.close),
            abs(current.low - previous.close),
        )
        true_ranges.append(true_range)

    return mean(true_ranges)


def volatility_pct(values: list[float], period: int = 20) -> float | None:
    if len(values) <= period:
        return None
    returns: list[float] = []
    recent = values[-period - 1 :]
    for previous, current in zip(recent, recent[1:]):
        if previous:
            returns.append((current / previous - 1.0) * 100.0)
    if not returns:
        return None
    return pstdev(returns)


def safe_round(value: float | None, digits: int = 1) -> str:
    if value is None:
        return "n/a"
    return str(round(value, digits))
