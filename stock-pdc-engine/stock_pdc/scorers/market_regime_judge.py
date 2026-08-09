from __future__ import annotations

from ..indicators import clamp_score, safe_round
from ..models import Bar, ScorerResult


def score(
    ticker: str,
    bars: list[Bar],
    market_context: dict[str, object],
    previous_scores: dict[str, ScorerResult] | None = None,
) -> ScorerResult:
    mode = market_context.get("mode")
    raw_score = 5.0
    reasons: list[str] = []
    warnings: list[str] = []

    if mode == "benchmark":
        benchmark = str(market_context.get("benchmark"))
        latest = market_context.get("latest_close")
        sma50 = market_context.get("sma50")
        sma200 = market_context.get("sma200")
        return_20d = market_context.get("return_20d")
        drawdown_60d = market_context.get("drawdown_60d")
        volatility_20d = market_context.get("volatility_20d")

        if isinstance(latest, (int, float)) and isinstance(sma50, (int, float)):
            if latest > sma50:
                raw_score += 1.2
                reasons.append(f"{benchmark} above 50d SMA")
            else:
                raw_score -= 1.2
                warnings.append(f"{benchmark} below 50d SMA")

        if isinstance(latest, (int, float)) and isinstance(sma200, (int, float)):
            if latest > sma200:
                raw_score += 1.2
                reasons.append(f"{benchmark} above 200d SMA")
            else:
                raw_score -= 1.4
                warnings.append(f"{benchmark} below 200d SMA")

        if isinstance(sma50, (int, float)) and isinstance(sma200, (int, float)):
            if sma50 > sma200:
                raw_score += 1.0
                reasons.append("major trend slope is constructive")
            else:
                raw_score -= 1.0

        if isinstance(return_20d, (int, float)):
            if return_20d > 4:
                raw_score += 0.9
                reasons.append(f"20d market return {safe_round(return_20d)}%")
            elif return_20d > 0:
                raw_score += 0.5
            elif return_20d < -5:
                raw_score -= 1.0
                warnings.append(f"20d market return {safe_round(return_20d)}%")

        if isinstance(drawdown_60d, (int, float)):
            if drawdown_60d > -4:
                raw_score += 0.5
            elif drawdown_60d < -10:
                raw_score -= 1.1
                warnings.append(f"market drawdown {safe_round(drawdown_60d)}%")

        if isinstance(volatility_20d, (int, float)) and volatility_20d > 2.2:
            raw_score -= 0.7
            warnings.append("market volatility elevated")

    elif mode == "breadth":
        above_50 = float(market_context.get("breadth_above_50", 0.0))
        positive_20d = float(market_context.get("breadth_positive_20d", 0.0))
        positive_60d = float(market_context.get("breadth_positive_60d", 0.0))

        if above_50 >= 0.65:
            raw_score += 1.6
            reasons.append(f"{safe_round(above_50 * 100)}% of universe above 50d")
        elif above_50 >= 0.5:
            raw_score += 0.6
        else:
            raw_score -= 1.0
            warnings.append(f"only {safe_round(above_50 * 100)}% above 50d")

        if positive_20d >= 0.6:
            raw_score += 1.0
        elif positive_20d < 0.4:
            raw_score -= 0.8

        if positive_60d >= 0.6:
            raw_score += 0.8
        elif positive_60d < 0.4:
            raw_score -= 0.8

        reasons.append("using universe breadth because no benchmark CSV was found")

    else:
        warnings.append("no market benchmark or breadth context available")

    final_score = clamp_score(raw_score)
    if final_score <= 4:
        warnings.append("defensive market regime")

    reason = "; ".join(reasons) if reasons else "market regime is neutral"
    warning = "; ".join(dict.fromkeys(warnings))
    return ScorerResult(final_score, reason, warning)
