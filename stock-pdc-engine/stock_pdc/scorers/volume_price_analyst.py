from __future__ import annotations

from statistics import mean

from ..indicators import clamp_score, closes, pct_change, safe_round
from ..models import Bar, ScorerResult


def score(
    ticker: str,
    bars: list[Bar],
    market_context: dict[str, object],
    previous_scores: dict[str, ScorerResult] | None = None,
) -> ScorerResult:
    if len(bars) < 30:
        return ScorerResult(3.0, "less than 30 bars for volume-price analysis", "volume evidence is thin")

    recent = bars[-21:]
    avg_volume_20 = mean(bar.volume for bar in recent[:-1])
    accumulation_days = 0
    distribution_days = 0
    up_volume: list[float] = []
    down_volume: list[float] = []

    for previous, current in zip(recent, recent[1:]):
        if previous.close == 0:
            continue
        day_change = (current.close / previous.close - 1.0) * 100.0
        if day_change > 0:
            up_volume.append(current.volume)
        elif day_change < 0:
            down_volume.append(current.volume)

        if day_change > 0.25 and current.volume > avg_volume_20 * 1.05:
            accumulation_days += 1
        if day_change < -0.25 and current.volume > avg_volume_20 * 1.05:
            distribution_days += 1

    close_values = closes(bars)
    return_20d = pct_change(close_values, 20)
    latest = bars[-1]
    previous = bars[-2]

    raw_score = 5.0
    reasons: list[str] = []
    warnings: list[str] = []

    if accumulation_days > distribution_days + 2:
        raw_score += 1.4
        reasons.append(f"{accumulation_days} accumulation vs {distribution_days} distribution days")
    elif distribution_days > accumulation_days + 2:
        raw_score -= 1.5
        warnings.append(f"{distribution_days} distribution vs {accumulation_days} accumulation days")

    if up_volume and down_volume:
        up_avg = mean(up_volume)
        down_avg = mean(down_volume)
        if up_avg > down_avg * 1.15:
            raw_score += 1.0
            reasons.append("up days carry heavier volume than down days")
        elif down_avg > up_avg * 1.2:
            raw_score -= 1.0
            warnings.append("down days carry heavier volume than up days")

    if latest.close > previous.close and latest.volume > avg_volume_20 * 1.35:
        raw_score += 1.0
        reasons.append("latest advance came on strong volume")
    elif latest.close < previous.close and latest.volume > avg_volume_20 * 1.35:
        raw_score -= 1.2
        warnings.append("latest decline came on strong volume")

    if return_20d is not None:
        if return_20d > 5 and accumulation_days >= distribution_days:
            raw_score += 0.8
            reasons.append(f"20d price gain {safe_round(return_20d)}% is volume-supported")
        elif return_20d < -5 and distribution_days >= accumulation_days:
            raw_score -= 0.8

    if latest.volume < avg_volume_20 * 0.65 and latest.close >= previous.close:
        raw_score += 0.4
        reasons.append("volume dried up without price damage")

    reason = "; ".join(reasons) if reasons else "volume-price picture is neutral"
    warning = "; ".join(dict.fromkeys(warnings))
    return ScorerResult(clamp_score(raw_score), reason, warning)
