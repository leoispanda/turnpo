from __future__ import annotations

from ..indicators import clamp_score, closes, distance_pct, pct_change, safe_round, sma
from ..models import Bar, ScorerResult


def score(
    ticker: str,
    bars: list[Bar],
    market_context: dict[str, object],
    previous_scores: dict[str, ScorerResult] | None = None,
) -> ScorerResult:
    close_values = closes(bars)
    if len(close_values) < 30:
        return ScorerResult(3.0, "less than 30 bars of price history", "trend evidence is thin")

    latest = close_values[-1]
    sma20 = sma(close_values, 20)
    sma50 = sma(close_values, 50)
    sma200 = sma(close_values, 200)
    return_20d = pct_change(close_values, 20)
    return_60d = pct_change(close_values, 60)
    raw_score = 5.0
    reasons: list[str] = []
    warnings: list[str] = []

    if sma20:
        if latest > sma20:
            raw_score += 0.7
        else:
            raw_score -= 0.7
            warnings.append("below 20d SMA")

    if sma50:
        distance_50 = distance_pct(latest, sma50)
        if latest > sma50:
            raw_score += 1.0
            reasons.append(f"above 50d SMA by {safe_round(distance_50)}%")
        else:
            raw_score -= 1.2
            warnings.append("below 50d SMA")

    if sma200:
        if latest > sma200:
            raw_score += 1.0
        else:
            raw_score -= 1.4
            warnings.append("below 200d SMA")

    if sma20 and sma50 and sma200:
        if sma20 > sma50 > sma200:
            raw_score += 1.3
            reasons.append("20d > 50d > 200d trend stack")
        elif sma20 < sma50 < sma200:
            raw_score -= 1.3
            warnings.append("bearish moving-average stack")

    if return_20d is not None:
        if return_20d > 8:
            raw_score += 1.0
            reasons.append(f"20d momentum {safe_round(return_20d)}%")
        elif return_20d > 0:
            raw_score += 0.5
        elif return_20d < -6:
            raw_score -= 1.0

    if return_60d is not None:
        market_return = market_context.get("return_60d")
        if return_60d > 15:
            raw_score += 1.0
            reasons.append(f"60d momentum {safe_round(return_60d)}%")
        elif return_60d > 5:
            raw_score += 0.5
        elif return_60d < -10:
            raw_score -= 1.0
            warnings.append(f"60d trend down {safe_round(return_60d)}%")

        if isinstance(market_return, (int, float)):
            relative_strength = return_60d - market_return
            if relative_strength > 6:
                raw_score += 0.8
                reasons.append(f"outperforming benchmark by {safe_round(relative_strength)}%")
            elif relative_strength < -6:
                raw_score -= 0.8
                warnings.append("lagging benchmark")

    if sma50:
        distance_50 = distance_pct(latest, sma50)
        if distance_50 is not None and distance_50 > 18:
            warnings.append("extended far above 50d SMA")

    reason = "; ".join(reasons) if reasons else "trend is mixed"
    warning = "; ".join(dict.fromkeys(warnings))
    return ScorerResult(clamp_score(raw_score), reason, warning)
