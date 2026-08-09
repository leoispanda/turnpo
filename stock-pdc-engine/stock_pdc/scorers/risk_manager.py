from __future__ import annotations

from ..indicators import atr, clamp_score, closes, drawdown_from_high, safe_round, sma
from ..models import Bar, ScorerResult


def score(
    ticker: str,
    bars: list[Bar],
    market_context: dict[str, object],
    previous_scores: dict[str, ScorerResult] | None = None,
) -> ScorerResult:
    close_values = closes(bars)
    if len(close_values) < 30:
        return ScorerResult(3.0, "less than 30 bars for risk review", "insufficient history for risk control")

    latest = close_values[-1]
    atr14 = atr(bars, 14)
    atr_pct = (atr14 / latest) * 100.0 if atr14 and latest else None
    sma50 = sma(close_values, 50)
    sma200 = sma(close_values, 200)
    low_20 = min(bar.low for bar in bars[-20:])
    stop_candidates = [low_20]
    if sma50 and sma50 < latest:
        stop_candidates.append(sma50)
    technical_stop = max(stop_candidates)
    stop_distance = (latest / technical_stop - 1.0) * 100.0 if technical_stop else None
    drawdown_60d = drawdown_from_high(close_values, 60)

    raw_score = 7.0
    reasons: list[str] = []
    warnings: list[str] = []

    if atr_pct is not None:
        if atr_pct < 2:
            raw_score += 1.0
            reasons.append(f"ATR risk low at {safe_round(atr_pct)}%")
        elif atr_pct <= 4:
            reasons.append(f"ATR risk manageable at {safe_round(atr_pct)}%")
        elif atr_pct <= 6:
            raw_score -= 1.0
            warnings.append(f"ATR elevated at {safe_round(atr_pct)}%")
        else:
            raw_score -= 2.0
            warnings.append(f"ATR high at {safe_round(atr_pct)}%")

    if stop_distance is not None:
        if 4 <= stop_distance <= 10:
            raw_score += 1.0
            reasons.append(f"technical stop distance {safe_round(stop_distance)}%")
        elif stop_distance < 3:
            raw_score -= 0.5
            warnings.append("stop is tight and may shake out")
        elif stop_distance <= 15:
            reasons.append(f"technical stop distance {safe_round(stop_distance)}%")
        elif stop_distance <= 22:
            raw_score -= 1.2
            warnings.append(f"wide stop distance {safe_round(stop_distance)}%")
        else:
            raw_score -= 2.2
            warnings.append(f"very wide stop distance {safe_round(stop_distance)}%")

    if drawdown_60d is not None:
        if drawdown_60d > -6:
            raw_score += 0.4
        elif drawdown_60d < -20:
            raw_score -= 1.4
            warnings.append(f"60d drawdown {safe_round(drawdown_60d)}%")
        elif drawdown_60d < -12:
            raw_score -= 0.7
            warnings.append(f"pullback from recent high {safe_round(drawdown_60d)}%")

    if sma50 and latest < sma50:
        raw_score -= 1.0
        warnings.append("below 50d SMA")
    if sma200 and latest < sma200:
        raw_score -= 1.2
        warnings.append("below 200d SMA")

    if len(close_values) < 90:
        raw_score -= 0.5
        warnings.append("limited trading history")

    reason = "; ".join(reasons) if reasons else "risk is acceptable but not exceptional"
    warning = "; ".join(dict.fromkeys(warnings))
    return ScorerResult(clamp_score(raw_score), reason, warning)
