from __future__ import annotations

from ..indicators import clamp_score, closes, pct_change, safe_round
from ..models import Bar, ScorerResult


def _body(bar: Bar) -> float:
    return abs(bar.close - bar.open)


def _range(bar: Bar) -> float:
    return max(bar.high - bar.low, 0.0)


def _body_ratio(bar: Bar) -> float:
    candle_range = _range(bar)
    if candle_range == 0:
        return 0.0
    return _body(bar) / candle_range


def _upper_shadow(bar: Bar) -> float:
    return max(bar.high - max(bar.open, bar.close), 0.0)


def _lower_shadow(bar: Bar) -> float:
    return max(min(bar.open, bar.close) - bar.low, 0.0)


def _close_position(bar: Bar) -> float:
    candle_range = _range(bar)
    if candle_range == 0:
        return 0.5
    return (bar.close - bar.low) / candle_range


def _is_bullish(bar: Bar) -> bool:
    return bar.close > bar.open


def _is_bearish(bar: Bar) -> bool:
    return bar.close < bar.open


def _engulfs(current: Bar, previous: Bar) -> bool:
    current_low = min(current.open, current.close)
    current_high = max(current.open, current.close)
    previous_low = min(previous.open, previous.close)
    previous_high = max(previous.open, previous.close)
    return current_low <= previous_low and current_high >= previous_high


def score(
    ticker: str,
    bars: list[Bar],
    market_context: dict[str, object],
    previous_scores: dict[str, ScorerResult] | None = None,
) -> ScorerResult:
    if len(bars) < 12:
        return ScorerResult(4.0, "less than 12 bars for candlestick review", "candlestick evidence is thin")

    latest = bars[-1]
    previous = bars[-2]
    body = _body(latest)
    candle_range = _range(latest)
    if candle_range == 0:
        return ScorerResult(5.0, "flat candle with no intraday range", "no candlestick signal")

    body_ratio = _body_ratio(latest)
    upper_shadow = _upper_shadow(latest)
    lower_shadow = _lower_shadow(latest)
    close_position = _close_position(latest)
    recent_return_5d = pct_change(closes(bars), 5)
    recent_return_10d = pct_change(closes(bars), 10)

    raw_score = 5.0
    reasons: list[str] = []
    warnings: list[str] = []

    if _is_bullish(latest) and body_ratio >= 0.6 and close_position >= 0.75:
        raw_score += 1.4
        reasons.append("strong bullish candle closed near high")
    elif _is_bearish(latest) and body_ratio >= 0.6 and close_position <= 0.25:
        raw_score -= 1.4
        warnings.append("strong bearish candle closed near low")

    if _is_bullish(latest) and _is_bearish(previous) and _engulfs(latest, previous):
        raw_score += 1.6
        reasons.append("bullish engulfing pattern")
    elif _is_bearish(latest) and _is_bullish(previous) and _engulfs(latest, previous):
        raw_score -= 1.6
        warnings.append("bearish engulfing pattern")

    if body > 0:
        if lower_shadow >= body * 2.0 and upper_shadow <= body * 0.8 and close_position >= 0.6:
            if isinstance(recent_return_5d, (int, float)) and recent_return_5d < 0:
                raw_score += 1.2
                reasons.append("hammer-style rejection after pullback")
            else:
                raw_score += 0.6
                reasons.append("long lower shadow shows demand")

        if upper_shadow >= body * 2.0 and lower_shadow <= body * 0.8 and close_position <= 0.45:
            if isinstance(recent_return_5d, (int, float)) and recent_return_5d > 0:
                raw_score -= 1.2
                warnings.append("shooting-star rejection after advance")
            else:
                raw_score -= 0.6
                warnings.append("long upper shadow shows supply")

    previous_midpoint = (previous.open + previous.close) / 2.0
    if _is_bullish(latest) and _is_bearish(previous):
        if latest.open < previous.close and latest.close > previous_midpoint and latest.close < previous.open:
            raw_score += 0.9
            reasons.append("piercing-line recovery")
    elif _is_bearish(latest) and _is_bullish(previous):
        if latest.open > previous.close and latest.close < previous_midpoint and latest.close > previous.open:
            raw_score -= 0.9
            warnings.append("dark-cloud-cover warning")

    if body_ratio <= 0.15:
        raw_score -= 0.3
        warnings.append("doji-like indecision candle")

    if isinstance(recent_return_10d, (int, float)) and recent_return_10d > 15 and close_position < 0.45:
        raw_score -= 0.8
        warnings.append(f"weak close after {safe_round(recent_return_10d)}% 10d advance")

    if isinstance(recent_return_10d, (int, float)) and recent_return_10d < -12 and close_position > 0.65:
        raw_score += 0.5
        reasons.append("constructive close after sharp pullback")

    reason = "; ".join(reasons) if reasons else "candlestick pattern is neutral"
    warning = "; ".join(dict.fromkeys(warnings))
    return ScorerResult(clamp_score(raw_score), reason, warning)
