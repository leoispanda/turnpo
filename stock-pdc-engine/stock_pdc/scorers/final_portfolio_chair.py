from __future__ import annotations

from statistics import mean

from ..indicators import clamp_score
from ..models import Bar, ScorerResult


def score(
    ticker: str,
    bars: list[Bar],
    market_context: dict[str, object],
    previous_scores: dict[str, ScorerResult] | None = None,
) -> ScorerResult:
    if not previous_scores:
        return ScorerResult(5.0, "chair has no prior committee scores", "missing scorer context")

    values = {key: result.score for key, result in previous_scores.items()}
    raw_score = mean(values.values())
    reasons: list[str] = []
    warnings: list[str] = []

    trend = values.get("trend", 5.0)
    breakout = values.get("livermore", 5.0)
    volume_price = values.get("volume_price", 5.0)
    candlestick = values.get("candlestick", 5.0)
    overheat = values.get("overheat", 5.0)
    risk = values.get("risk", 5.0)
    market = values.get("market_regime", 5.0)
    zhuge = values.get("zhuge_orion", 5.5)

    if trend >= 7 and breakout >= 7 and risk >= 6 and overheat >= 5:
        raw_score += 0.8
        reasons.append("trend, breakout, and risk controls align")

    if volume_price >= 7 and trend >= 7:
        raw_score += 0.4
        reasons.append("volume supports the trend")

    if candlestick >= 7 and trend >= 7:
        raw_score += 0.3
        reasons.append("candlestick timing confirms demand")
    elif candlestick <= 3.5 and trend >= 7:
        raw_score -= 0.7
        warnings.append("bearish candlestick warns against chasing")

    if market >= 7:
        raw_score += 0.3
        reasons.append("market backdrop supports offense")
    elif market <= 4:
        raw_score -= 0.6
        warnings.append("market backdrop argues for defense")

    if overheat <= 4 and trend >= 7:
        raw_score -= 0.8
        warnings.append("strong trend but overheat risk is high")

    if risk <= 4:
        raw_score -= 1.5
        warnings.append("risk manager does not approve current setup")

    if zhuge <= 4.5:
        raw_score -= 0.5
        warnings.append("personal posture favors conservative execution")
    elif zhuge >= 7.5 and market >= 6 and risk >= 6:
        raw_score += 0.2
        reasons.append("personal posture allows measured offense")

    if trend <= 4 and breakout <= 4:
        raw_score -= 0.8
        warnings.append("no trend or breakout edge")

    reason = "; ".join(reasons) if reasons else "committee evidence is mixed"
    warning = "; ".join(dict.fromkeys(warnings))
    return ScorerResult(clamp_score(raw_score), reason, warning)
