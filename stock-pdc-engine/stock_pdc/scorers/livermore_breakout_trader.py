from __future__ import annotations

from statistics import mean

from ..indicators import clamp_score, closes, safe_round, sma
from ..models import Bar, ScorerResult


def score(
    ticker: str,
    bars: list[Bar],
    market_context: dict[str, object],
    previous_scores: dict[str, ScorerResult] | None = None,
) -> ScorerResult:
    if len(bars) < 55:
        return ScorerResult(3.5, "less than 55 bars for pivot analysis", "breakout evidence is thin")

    close_values = closes(bars)
    latest = close_values[-1]
    prior_high = max(bar.high for bar in bars[-56:-1])
    high_20 = max(bar.high for bar in bars[-21:-1])
    low_20 = min(bar.low for bar in bars[-21:-1])
    avg_volume_20 = mean(bar.volume for bar in bars[-21:-1])
    latest_volume = bars[-1].volume
    sma50 = sma(close_values, 50)
    distance_to_pivot = (latest / prior_high - 1.0) * 100.0 if prior_high else 0.0
    base_range = (high_20 / low_20 - 1.0) * 100.0 if low_20 else 99.0

    raw_score = 5.0
    reasons: list[str] = []
    warnings: list[str] = []

    if latest > prior_high:
        raw_score += 2.4
        reasons.append(f"cleared 55d pivot by {safe_round(distance_to_pivot)}%")
        if latest_volume > avg_volume_20 * 1.35:
            raw_score += 1.0
            reasons.append("breakout volume confirmed")
        else:
            warnings.append("breakout volume is not convincing")
    elif distance_to_pivot >= -3:
        raw_score += 1.5
        reasons.append(f"within {safe_round(abs(distance_to_pivot))}% of 55d pivot")
    elif distance_to_pivot >= -7:
        raw_score += 0.6
    else:
        raw_score -= 0.8
        warnings.append("far from breakout pivot")

    if base_range <= 12:
        raw_score += 0.9
        reasons.append(f"tight 20d base range {safe_round(base_range)}%")
    elif base_range > 25:
        raw_score -= 0.9
        warnings.append("wide base increases failure risk")

    if latest_volume > avg_volume_20 * 1.5 and latest > bars[-2].close:
        raw_score += 0.6
        reasons.append("latest up move came with volume")

    if sma50 and latest < sma50:
        raw_score -= 1.2
        warnings.append("below 50d SMA while waiting for breakout")

    if len(close_values) >= 20 and latest < min(close_values[-10:]):
        raw_score -= 0.8
        warnings.append("recent price action is weakening")

    reason = "; ".join(reasons) if reasons else "no clear Livermore pivot setup"
    warning = "; ".join(dict.fromkeys(warnings))
    return ScorerResult(clamp_score(raw_score), reason, warning)
