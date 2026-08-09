from __future__ import annotations

from ..indicators import clamp_score, closes, distance_pct, pct_change, rsi, safe_round, sma
from ..models import Bar, ScorerResult


def score(
    ticker: str,
    bars: list[Bar],
    market_context: dict[str, object],
    previous_scores: dict[str, ScorerResult] | None = None,
) -> ScorerResult:
    close_values = closes(bars)
    if len(close_values) < 30:
        return ScorerResult(4.0, "less than 30 bars for overheat review", "overheat evidence is thin")

    latest = close_values[-1]
    rsi14 = rsi(close_values, 14)
    sma20 = sma(close_values, 20)
    sma50 = sma(close_values, 50)
    return_10d = pct_change(close_values, 10)
    return_20d = pct_change(close_values, 20)
    distance_20 = distance_pct(latest, sma20)
    distance_50 = distance_pct(latest, sma50)

    raw_score = 7.0
    reasons: list[str] = []
    warnings: list[str] = []

    if rsi14 is not None:
        if 45 <= rsi14 <= 62:
            raw_score += 1.0
            reasons.append(f"RSI {safe_round(rsi14)} is controlled")
        elif 62 < rsi14 <= 68:
            raw_score -= 0.5
            warnings.append(f"RSI warming at {safe_round(rsi14)}")
        elif 68 < rsi14 <= 75:
            raw_score -= 1.4
            warnings.append(f"RSI elevated at {safe_round(rsi14)}")
        elif rsi14 > 75:
            raw_score -= 2.4
            warnings.append(f"RSI overheated at {safe_round(rsi14)}")
        elif rsi14 < 35:
            raw_score -= 0.9
            warnings.append(f"RSI weak at {safe_round(rsi14)}")

    if distance_50 is not None:
        if 0 <= distance_50 <= 8:
            raw_score += 0.5
            reasons.append(f"{safe_round(distance_50)}% above 50d SMA")
        elif distance_50 > 18:
            raw_score -= 1.5
            warnings.append(f"{safe_round(distance_50)}% above 50d SMA")
        elif distance_50 > 10:
            raw_score -= 0.8
            warnings.append("stretched above 50d SMA")

    if distance_20 is not None and distance_20 > 9:
        raw_score -= 0.8
        warnings.append("stretched above 20d SMA")

    if return_10d is not None and return_10d > 15:
        raw_score -= 1.1
        warnings.append(f"10d gain {safe_round(return_10d)}% invites pullback")

    if return_20d is not None and return_20d > 30:
        raw_score -= 1.4
        warnings.append(f"20d gain {safe_round(return_20d)}% is chase-risky")

    reason = "; ".join(reasons) if reasons else "overheat risk is acceptable"
    warning = "; ".join(dict.fromkeys(warnings))
    return ScorerResult(clamp_score(raw_score), reason, warning)
