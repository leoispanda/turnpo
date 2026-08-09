from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path
from statistics import pstdev
from typing import Iterable

from .indicators import atr, closes, pct_change, sma
from .models import Bar


STRATEGY_B_FULL_HEADERS = [
    "strategy_id",
    "model_version",
    "snapshot_id",
    "analysis_date",
    "ticker",
    "name",
    "a_rank",
    "a_final_score",
    "alpha_rank",
    "alpha_score",
    "trend_percentile",
    "breakout_percentile",
    "volume_price_percentile",
    "risk_adjusted_momentum",
    "momentum_percentile",
    "candidate_pass",
    "candidate_reason",
    "entry_gate",
    "entry_gate_reason",
    "policy_action",
    "policy_action_reason",
    "market_regime_score",
    "trend_score",
    "livermore_breakout_score",
    "volume_price_score",
    "candlestick_score",
    "overheat_score",
    "risk_score",
    "zhuge_orion_shadow_score",
    "final_chair_shadow_score",
    "atr14",
    "structural_stop",
    "initial_stop",
    "active_stop",
    "stop_distance_pct",
    "raw_target_weight_pct",
    "target_weight_pct",
    "gross_exposure_cap_pct",
    "market_gross_cap_pct",
    "drawdown_gross_cap_pct",
    "volatility_gross_cap_pct",
    "latest_date",
    "latest_close",
    "latest_day_return_pct",
    "latest_day_return_source",
    "sector_cap_status",
]

STRATEGY_B_PLAN_HEADERS = [
    "signal_date",
    "strategy_id",
    "model_version",
    "snapshot_id",
    "ticker",
    "rank",
    "action",
    "reason",
    "target_weight_pct",
    "initial_stop",
    "active_stop",
    "stop_distance_pct",
]


@dataclass(frozen=True)
class PortfolioRiskState:
    drawdown_pct: float = 0.0
    annualized_volatility_pct: float | None = None


def load_strategy_b_config(path: Path) -> dict[str, object]:
    with path.open("r", encoding="utf-8") as handle:
        config = json.load(handle)
    if config.get("strategyId") != "B":
        raise ValueError("Strategy B config must declare strategyId=B")
    alpha_weights = config.get("alphaWeights") or {}
    total = sum(float(value) for value in alpha_weights.values())
    if not math.isclose(total, 1.0, abs_tol=1e-9):
        raise ValueError(f"Strategy B alpha weights must sum to 1.0, got {total}")
    if (config.get("zhugeOrion") or {}).get("mode") != "shadow_only":
        raise ValueError("Strategy B requires Zhuge Orion shadow_only mode")
    return config


def _number(row: dict[str, object], key: str, default: float = 0.0) -> float:
    value = row.get(key)
    if value in (None, ""):
        return default
    return float(value)


def _average_percentiles(values_by_ticker: dict[str, float]) -> dict[str, float]:
    if not values_by_ticker:
        return {}
    ordered = sorted(values_by_ticker, key=lambda ticker: (values_by_ticker[ticker], ticker))
    denominator = max(len(ordered) - 1, 1)
    result: dict[str, float] = {}
    cursor = 0
    while cursor < len(ordered):
        end = cursor + 1
        value = values_by_ticker[ordered[cursor]]
        while end < len(ordered) and values_by_ticker[ordered[end]] == value:
            end += 1
        average_index = (cursor + end - 1) / 2.0
        percentile = average_index / denominator if len(ordered) > 1 else 0.5
        for index in range(cursor, end):
            result[ordered[index]] = percentile
        cursor = end
    return result


def _daily_returns(values: list[float], lookback: int) -> list[float]:
    if len(values) <= 1:
        return []
    recent = values[-(lookback + 1) :] if len(values) > lookback else values
    return [current / previous - 1.0 for previous, current in zip(recent, recent[1:]) if previous]


def _risk_adjusted_momentum(bars: list[Bar], momentum_lookback: int, volatility_lookback: int) -> float | None:
    values = closes(bars)
    momentum_pct = pct_change(values, momentum_lookback)
    returns = _daily_returns(values, volatility_lookback)
    if momentum_pct is None or len(returns) < max(20, volatility_lookback // 2):
        return None
    annualized_volatility = pstdev(returns) * math.sqrt(252.0)
    if annualized_volatility <= 0:
        return None
    return (momentum_pct / 100.0) / annualized_volatility


def _clear_uptrend(bars: list[Bar]) -> bool:
    values = closes(bars)
    if not values:
        return False
    latest = values[-1]
    average20 = sma(values, 20)
    average50 = sma(values, 50)
    average200 = sma(values, 200)
    if average20 is None or average50 is None:
        return False
    if not (latest > average20 > average50):
        return False
    return average200 is None or latest > average200


def _latest_day_return_pct(bars: list[Bar]) -> float | None:
    if len(bars) < 2 or not bars[-2].close:
        return None
    return (bars[-1].close / bars[-2].close - 1.0) * 100.0


def _stops(bars: list[Bar], config: dict[str, object]) -> tuple[float | None, float | None, float | None, float | None]:
    if len(bars) < 20 or not bars[-1].close:
        return None, None, None, None
    latest = bars[-1].close
    values = closes(bars)
    low20 = min(bar.low for bar in bars[-20:])
    average50 = sma(values, 50)
    candidates = [low20]
    if average50 is not None and average50 < latest:
        candidates.append(average50)
    structural_stop = max(candidates)
    atr14 = atr(bars, 14)
    structural_distance = max(0.0, (latest - structural_stop) / latest)
    atr_multiple = float((config.get("risk") or {}).get("initialAtrMultiple", 2.5))
    atr_distance = atr_multiple * atr14 / latest if atr14 is not None else 0.0
    stop_distance = max(structural_distance, atr_distance)
    initial_stop = latest * (1.0 - stop_distance) if stop_distance > 0 else None
    return (
        round(atr14, 6) if atr14 is not None else None,
        round(structural_stop, 6),
        round(initial_stop, 6) if initial_stop is not None else None,
        round(stop_distance * 100.0, 6) if stop_distance > 0 else None,
    )


def _market_cap(market_score: float, config: dict[str, object]) -> float:
    caps = (config.get("exposure") or {}).get("marketScoreCapsPct") or []
    for row in sorted(caps, key=lambda item: float(item["minimumScore"]), reverse=True):
        if market_score >= float(row["minimumScore"]):
            return float(row["grossCapPct"])
    return 0.0


def _drawdown_cap(drawdown_pct: float, config: dict[str, object]) -> float:
    caps = (config.get("exposure") or {}).get("drawdownCapsPct") or []
    for row in sorted(caps, key=lambda item: float(item["drawdownAtOrBelowPct"])):
        if drawdown_pct <= float(row["drawdownAtOrBelowPct"]):
            return float(row["grossCapPct"])
    return 100.0


def _volatility_cap(annualized_volatility_pct: float | None, config: dict[str, object]) -> float:
    target = float((config.get("exposure") or {}).get("annualizedVolatilityTargetPct", 12.0))
    if annualized_volatility_pct in (None, 0.0):
        return 100.0
    return min(100.0, target / float(annualized_volatility_pct) * 100.0)


def _entry_gate(row: dict[str, object], config: dict[str, object]) -> tuple[str, str, float]:
    entry = config.get("entry") or {}
    if not row.get("candidate_pass"):
        return "WAIT_GATE", str(row.get("candidate_reason") or "candidate gate failed"), 0.0
    market = _number(row, "market_regime_score")
    risk = _number(row, "risk_score")
    overheat = _number(row, "overheat_score")
    candle = _number(row, "candlestick_score")
    stop_distance = _number(row, "stop_distance_pct", 999.0)
    if market < float(entry.get("minimumMarketScore", 4.0)):
        return "WAIT_GATE", f"market score {market} below entry floor", 0.0
    if risk < float(entry.get("minimumRiskScore", 4.0)):
        return "WAIT_GATE", f"risk score {risk} below entry floor", 0.0
    if overheat < float(entry.get("minimumOverheatScore", 4.0)):
        return "WAIT_GATE", f"overheat score {overheat} requires pullback", 0.0
    if candle <= float(entry.get("minimumCandlestickScore", 3.2)):
        return "WAIT_GATE", f"candlestick score {candle} requires confirmation", 0.0
    maximum_stop = float((config.get("risk") or {}).get("maximumStopDistancePct", 12.0))
    if stop_distance <= 0 or stop_distance > maximum_stop:
        return "WAIT_GATE", f"stop distance {round(stop_distance, 2)}% outside B1 limit", 0.0
    multiplier = 1.0
    reasons: list[str] = []
    if risk < float(entry.get("halfRiskBelowScore", 5.0)):
        multiplier *= 0.5
        reasons.append("risk score uses half-risk size")
    if candle < float(entry.get("halfRiskCandlestickBelowScore", 4.5)):
        multiplier *= 0.5
        reasons.append("candlestick score uses half-risk size")
    gate = "ELIGIBLE_FULL" if multiplier == 1.0 else "ELIGIBLE_REDUCED"
    return gate, "; ".join(reasons) or "all B1 entry gates passed", multiplier


def build_strategy_b_rows(
    a_rows: list[dict[str, object]],
    universe: dict[str, list[Bar]],
    names: dict[str, str],
    config: dict[str, object],
    analysis_date: str,
    snapshot_id: str,
) -> list[dict[str, object]]:
    tickers = [str(row.get("ticker") or "") for row in a_rows if str(row.get("ticker") or "") in universe]
    trend_percentiles = _average_percentiles({ticker: _number(row, "trend_score") for ticker, row in ((str(row["ticker"]), row) for row in a_rows) if ticker in universe})
    breakout_percentiles = _average_percentiles({ticker: _number(row, "livermore_breakout_score") for ticker, row in ((str(row["ticker"]), row) for row in a_rows) if ticker in universe})
    volume_percentiles = _average_percentiles({ticker: _number(row, "volume_price_score") for ticker, row in ((str(row["ticker"]), row) for row in a_rows) if ticker in universe})

    candidate_config = config.get("candidate") or {}
    momentum_values: dict[str, float] = {}
    for ticker in tickers:
        value = _risk_adjusted_momentum(
            universe[ticker],
            int(candidate_config.get("momentumLookback", 60)),
            int(candidate_config.get("volatilityLookback", 60)),
        )
        if value is not None:
            momentum_values[ticker] = value
    momentum_percentiles = _average_percentiles(momentum_values)
    weights = config.get("alphaWeights") or {}
    model_version = str(config["modelVersion"])
    rows: list[dict[str, object]] = []
    for source in a_rows:
        ticker = str(source.get("ticker") or "")
        if ticker not in universe:
            continue
        bars = universe[ticker]
        trend_pct = trend_percentiles[ticker]
        breakout_pct = breakout_percentiles[ticker]
        volume_pct = volume_percentiles[ticker]
        alpha = (
            float(weights["trend"]) * trend_pct
            + float(weights["breakout"]) * breakout_pct
            + float(weights["volumePrice"]) * volume_pct
        )
        momentum_pct = momentum_percentiles.get(ticker)
        minimum_momentum = float(candidate_config.get("minimumRiskAdjustedMomentumPercentile", 0.7))
        enough_bars = len(bars) >= int(candidate_config.get("minimumBars", 200))
        uptrend = _clear_uptrend(bars)
        candidate_pass = bool(
            enough_bars
            and momentum_pct is not None
            and momentum_pct >= minimum_momentum
            and (uptrend or not candidate_config.get("requireClearUptrend", True))
        )
        candidate_reasons: list[str] = []
        if not enough_bars:
            candidate_reasons.append(f"history rows {len(bars)} below minimum")
        if momentum_pct is None:
            candidate_reasons.append("risk-adjusted momentum unavailable")
        elif momentum_pct < minimum_momentum:
            candidate_reasons.append(f"momentum percentile {round(momentum_pct, 3)} below {minimum_momentum}")
        if candidate_config.get("requireClearUptrend", True) and not uptrend:
            candidate_reasons.append("not close>SMA20>SMA50 and above SMA200")
        if candidate_pass:
            candidate_reasons.append("candidate gate passed")
        atr14, structural_stop, initial_stop, stop_distance = _stops(bars, config)
        day_return = _latest_day_return_pct(bars)
        row = {
            "strategy_id": "B",
            "model_version": model_version,
            "snapshot_id": snapshot_id,
            "analysis_date": analysis_date,
            "ticker": ticker,
            "name": names.get(ticker, ""),
            "a_rank": int(float(source.get("rank") or 0)),
            "a_final_score": _number(source, "final_score"),
            "alpha_rank": 0,
            "alpha_score": round(alpha * 10.0, 6),
            "trend_percentile": round(trend_pct, 6),
            "breakout_percentile": round(breakout_pct, 6),
            "volume_price_percentile": round(volume_pct, 6),
            "risk_adjusted_momentum": round(momentum_values[ticker], 6) if ticker in momentum_values else "",
            "momentum_percentile": round(momentum_pct, 6) if momentum_pct is not None else "",
            "candidate_pass": candidate_pass,
            "candidate_reason": "; ".join(candidate_reasons),
            "entry_gate": "",
            "entry_gate_reason": "",
            "policy_action": "WATCH_B",
            "policy_action_reason": "ranked alpha candidate; portfolio policy applied separately",
            "market_regime_score": _number(source, "market_regime_score"),
            "trend_score": _number(source, "trend_score"),
            "livermore_breakout_score": _number(source, "livermore_breakout_score"),
            "volume_price_score": _number(source, "volume_price_score"),
            "candlestick_score": _number(source, "candlestick_score"),
            "overheat_score": _number(source, "overheat_score"),
            "risk_score": _number(source, "risk_score"),
            "zhuge_orion_shadow_score": _number(source, "zhuge_orion_score"),
            "final_chair_shadow_score": _number(source, "final_chair_score"),
            "atr14": atr14 if atr14 is not None else "",
            "structural_stop": structural_stop if structural_stop is not None else "",
            "initial_stop": initial_stop if initial_stop is not None else "",
            "active_stop": initial_stop if initial_stop is not None else "",
            "stop_distance_pct": stop_distance if stop_distance is not None else "",
            "raw_target_weight_pct": 0.0,
            "target_weight_pct": 0.0,
            "gross_exposure_cap_pct": 0.0,
            "market_gross_cap_pct": 0.0,
            "drawdown_gross_cap_pct": 0.0,
            "volatility_gross_cap_pct": 0.0,
            "latest_date": bars[-1].date if bars else "",
            "latest_close": round(bars[-1].close, 6) if bars else "",
            "latest_day_return_pct": round(day_return, 6) if day_return is not None else "",
            "latest_day_return_source": "local-qfq-research",
            "sector_cap_status": str((config.get("exposure") or {}).get("sectorCapStatus", "INACTIVE_MISSING_DATA")),
        }
        gate, reason, _multiplier = _entry_gate(row, config)
        row["entry_gate"] = gate
        row["entry_gate_reason"] = reason
        rows.append(row)

    rows.sort(key=lambda row: (-float(row["alpha_score"]), str(row["ticker"])))
    for rank, row in enumerate(rows, start=1):
        row["alpha_rank"] = rank
    return rows


def _position_active_stop(
    row: dict[str, object],
    position: dict[str, object],
    config: dict[str, object],
) -> float | None:
    latest = _number(row, "latest_close")
    atr14 = _number(row, "atr14")
    entry = _number(position, "entry_price")
    initial = _number(position, "initial_stop") or _number(row, "initial_stop")
    previous_active = _number(position, "active_stop") or initial
    peak = max(_number(position, "peak_close"), latest)
    if not initial:
        return None
    risk_per_share = max(entry - initial, 0.0)
    activate_r = float((config.get("risk") or {}).get("activateTrailingAtR", 1.0))
    if entry and risk_per_share and peak >= entry + activate_r * risk_per_share and atr14:
        multiple = float((config.get("risk") or {}).get("trailingAtrMultiple", 3.0))
        return max(previous_active, initial, peak - multiple * atr14)
    return max(previous_active, initial)


def _raw_weight(row: dict[str, object], multiplier: float, config: dict[str, object]) -> float:
    stop_distance = _number(row, "stop_distance_pct")
    if stop_distance <= 0:
        return 0.0
    risk_config = config.get("risk") or {}
    budget = float(risk_config.get("perNameRiskBudgetPctNav", 0.4))
    maximum = float(risk_config.get("maximumWeightPct", 5.0))
    return min(maximum, budget / stop_distance * 100.0) * multiplier


def build_strategy_b_portfolio_plan(
    ranked_rows: list[dict[str, object]],
    current_positions: dict[str, dict[str, object]],
    risk_state: PortfolioRiskState,
    config: dict[str, object],
    signal_date: str,
    snapshot_id: str,
) -> tuple[list[dict[str, object]], dict[str, float]]:
    by_ticker = {str(row["ticker"]): row for row in ranked_rows}
    entry = config.get("entry") or {}
    maximum_positions = int(entry.get("maximumPositions", 20))
    entry_rank = int(entry.get("newRankMaximum", 15))
    published_top = int(entry.get("publishedTopCount", 20))
    actions: dict[str, tuple[str, str]] = {}
    selected: list[str] = []

    for ticker, position in sorted(current_positions.items()):
        row = by_ticker.get(ticker)
        if row is None:
            stored_active_stop = _number(position, "active_stop")
            last_price = _number(position, "last_price")
            if stored_active_stop and last_price and last_price <= stored_active_stop:
                actions[ticker] = (
                    "RISK_EXIT_REVIEW",
                    f"universe-dropped holding closed below locked active stop {round(stored_active_stop, 4)}",
                )
                continue
            day_return = _number(position, "signal_day_return_pct", -999.0)
            if day_return > 0:
                selected.append(ticker)
                actions[ticker] = (
                    "HOLD_DROPPED_UP_DAY",
                    "dropped from the scored universe but frozen raw signal-day return is up; user override",
                )
            else:
                actions[ticker] = (
                    "SELL_REVIEW_DROPPED",
                    "dropped from the scored universe and the raw signal-day move is non-up or unverifiable",
                )
            continue
        active_stop = _position_active_stop(row, position, config)
        row["active_stop"] = round(active_stop, 6) if active_stop is not None else ""
        if active_stop is not None and _number(row, "latest_close") <= active_stop:
            actions[ticker] = ("RISK_EXIT_REVIEW", f"close confirmed below active stop {round(active_stop, 4)}")
            continue
        if _number(row, "risk_score") < float(entry.get("minimumRiskScore", 4.0)):
            actions[ticker] = ("RISK_EXIT_REVIEW", "risk score fell below hard hold floor")
            continue
        if int(row["alpha_rank"]) <= published_top:
            selected.append(ticker)
            actions[ticker] = ("HOLD_B", f"alpha rank {row['alpha_rank']} remains within B Top {published_top}")
            continue
        if _number(row, "latest_day_return_pct", -999.0) > 0:
            selected.append(ticker)
            actions[ticker] = ("HOLD_DROPPED_UP_DAY", "outside hold buffer but current signal day is up; user override")
        else:
            actions[ticker] = ("SELL_REVIEW_DROPPED", "outside hold buffer and signal day is non-up or unverifiable")

    for row in ranked_rows:
        ticker = str(row["ticker"])
        if len(selected) >= maximum_positions:
            break
        if ticker in current_positions or ticker in selected:
            continue
        if int(row["alpha_rank"]) > entry_rank:
            break
        gate, reason, _multiplier = _entry_gate(row, config)
        row["entry_gate"] = gate
        row["entry_gate_reason"] = reason
        if not gate.startswith("ELIGIBLE"):
            continue
        selected.append(ticker)
        actions[ticker] = ("ENTER_B", f"alpha rank {row['alpha_rank']} and {reason}")

    market_score = _number(ranked_rows[0], "market_regime_score") if ranked_rows else 0.0
    market_cap = _market_cap(market_score, config)
    drawdown_cap = _drawdown_cap(risk_state.drawdown_pct, config)
    volatility_cap = _volatility_cap(risk_state.annualized_volatility_pct, config)
    gross_cap = min(market_cap, drawdown_cap, volatility_cap)
    raw_weights: dict[str, float] = {}
    for ticker in selected:
        row = by_ticker.get(ticker)
        position = current_positions.get(ticker, {})
        if row is None:
            raw_weights[ticker] = _number(position, "current_weight_pct")
            continue
        if ticker in current_positions:
            multiplier = 0.5 if _number(row, "risk_score") < float(entry.get("halfRiskBelowScore", 5.0)) else 1.0
        else:
            _gate, _reason, multiplier = _entry_gate(row, config)
        risk_weight = _raw_weight(row, multiplier, config)
        if actions[ticker][0] == "HOLD_DROPPED_UP_DAY":
            current_weight = _number(position, "current_weight_pct")
            raw_weights[ticker] = min(current_weight, risk_weight) if current_weight and risk_weight else current_weight
        else:
            raw_weights[ticker] = risk_weight
    total_raw = sum(raw_weights.values())
    scale = min(1.0, gross_cap / total_raw) if total_raw > 0 else 0.0

    plan: list[dict[str, object]] = []
    for ticker, (action, reason) in sorted(actions.items(), key=lambda item: (int(by_ticker[item[0]]["alpha_rank"]) if item[0] in by_ticker else 999999, item[0])):
        row = by_ticker.get(ticker, {})
        position = current_positions.get(ticker, {})
        target_weight = raw_weights.get(ticker, 0.0) * scale
        if row:
            row["policy_action"] = action
            row["policy_action_reason"] = reason
            row["raw_target_weight_pct"] = round(raw_weights.get(ticker, 0.0), 6)
            row["target_weight_pct"] = round(target_weight, 6)
            row["gross_exposure_cap_pct"] = round(gross_cap, 6)
            row["market_gross_cap_pct"] = round(market_cap, 6)
            row["drawdown_gross_cap_pct"] = round(drawdown_cap, 6)
            row["volatility_gross_cap_pct"] = round(volatility_cap, 6)
        plan.append(
            {
                "signal_date": signal_date,
                "strategy_id": "B",
                "model_version": str(config["modelVersion"]),
                "snapshot_id": snapshot_id,
                "ticker": ticker,
                "rank": row.get("alpha_rank", ""),
                "action": action,
                "reason": reason,
                "target_weight_pct": round(target_weight, 6),
                "initial_stop": row.get("initial_stop", position.get("initial_stop", "")),
                "active_stop": row.get("active_stop", position.get("active_stop", "")),
                "stop_distance_pct": row.get("stop_distance_pct", ""),
            }
        )
    caps = {
        "market": market_cap,
        "drawdown": drawdown_cap,
        "volatility": volatility_cap,
        "gross": gross_cap,
    }
    return plan, caps


def selection_plan(
    ranked_rows: Iterable[dict[str, object]],
    signal_date: str,
    snapshot_id: str,
    model_version: str,
    strategy_id: str,
    rank_field: str,
    top_n: int = 20,
) -> list[dict[str, object]]:
    selected = list(ranked_rows)[:top_n]
    weight = 100.0 / len(selected) if selected else 0.0
    return [
        {
            "signal_date": signal_date,
            "strategy_id": strategy_id,
            "model_version": model_version,
            "snapshot_id": snapshot_id,
            "ticker": str(row["ticker"]),
            "rank": int(float(row[rank_field])),
            "action": "SELECT_EQUAL_WEIGHT",
            "reason": f"{strategy_id} selection-track Top {top_n}",
            "target_weight_pct": round(weight, 6),
            "initial_stop": "",
            "active_stop": "",
            "stop_distance_pct": "",
        }
        for row in selected
    ]
