from __future__ import annotations

from dataclasses import replace

from .config import DEFAULT_WEIGHTS
from .market_context import build_market_context
from .models import Bar, ScorerResult, StockEvaluation
from .scorers import (
    candlestick_pattern_analyst,
    final_portfolio_chair,
    livermore_breakout_trader,
    market_regime_judge,
    overheat_auditor,
    risk_manager,
    trend_follower,
    volume_price_analyst,
    zhuge_orion,
)

FIRST_PASS_SCORERS = [
    ("market_regime", market_regime_judge.score),
    ("trend", trend_follower.score),
    ("livermore", livermore_breakout_trader.score),
    ("volume_price", volume_price_analyst.score),
    ("candlestick", candlestick_pattern_analyst.score),
    ("overheat", overheat_auditor.score),
    ("risk", risk_manager.score),
    ("zhuge_orion", zhuge_orion.score),
]


def _score(results: dict[str, ScorerResult], key: str) -> float:
    return results[key].score


def _weighted_score(results: dict[str, ScorerResult], weights: dict[str, float]) -> float:
    total = 0.0
    for key, weight in weights.items():
        if key in results:
            total += results[key].score * weight
    return total


def _risk_adjusted_score(final_score: float, results: dict[str, ScorerResult]) -> float:
    risk = _score(results, "risk")
    overheat = _score(results, "overheat")
    market = _score(results, "market_regime")
    candlestick = _score(results, "candlestick")

    adjusted = final_score
    if risk <= 3.5:
        adjusted = min(adjusted, 5.0)
    if overheat <= 3.0:
        adjusted = min(adjusted, 6.2)
    if market <= 3.5:
        adjusted = min(adjusted, 6.8)
    if candlestick <= 3.2:
        adjusted = min(adjusted, 6.4)
    return round(adjusted, 2)


def _select_status(final_score: float, results: dict[str, ScorerResult]) -> str:
    trend = _score(results, "trend")
    breakout = _score(results, "livermore")
    candlestick = _score(results, "candlestick")
    overheat = _score(results, "overheat")
    risk = _score(results, "risk")

    if final_score < 4.6 or risk <= 3.2 or trend <= 3.2:
        return "Remove"
    if risk <= 4.5 or (overheat <= 4.0 and final_score >= 6.0):
        return "High Risk Watch"
    if trend >= 7.0 and overheat <= 5.3:
        return "Wait for Pullback"
    if breakout >= 8.0 and trend >= 7.0 and risk >= 6.0 and overheat >= 5.5 and candlestick >= 5.0:
        return "Trial Position"
    if breakout >= 7.3 and trend >= 6.8 and final_score >= 6.5 and candlestick >= 4.5:
        return "Breakout Pending"
    if final_score >= 8.0:
        return "Strong Watch"
    if final_score >= 6.0:
        return "Watch"
    return "Remove"


def _main_risk(results: dict[str, ScorerResult]) -> str:
    for key in ["risk", "overheat", "candlestick", "market_regime", "volume_price", "livermore", "trend"]:
        warning = results[key].warning
        if warning:
            return warning
    return "No major single risk flag; keep monitoring market regime and stop distance."


def _short_reason(results: dict[str, ScorerResult]) -> str:
    pieces = [results["chair"].reason, results["trend"].reason]
    if results["livermore"].score >= 7:
        pieces.append(results["livermore"].reason)
    if results["volume_price"].score >= 7:
        pieces.append(results["volume_price"].reason)
    if results["candlestick"].score >= 7:
        pieces.append(results["candlestick"].reason)
    return " | ".join(piece for piece in pieces if piece)


def evaluate_stock(
    ticker: str,
    bars: list[Bar],
    market_context: dict[str, object],
    weights: dict[str, float] | None = None,
) -> StockEvaluation:
    active_weights = weights or DEFAULT_WEIGHTS
    results: dict[str, ScorerResult] = {}

    for key, scorer in FIRST_PASS_SCORERS:
        results[key] = scorer(ticker, bars, market_context, results)

    results["chair"] = final_portfolio_chair.score(ticker, bars, market_context, results)
    final_score = _risk_adjusted_score(_weighted_score(results, active_weights), results)
    status = _select_status(final_score, results)

    return StockEvaluation(
        ticker=ticker,
        final_score=final_score,
        rank=0,
        status=status,
        suggested_action=status,
        scores=results,
        short_reason=_short_reason(results),
        main_risk=_main_risk(results),
        latest_date=bars[-1].date if bars else "",
        latest_close=round(bars[-1].close, 3) if bars else 0.0,
    )


def evaluate_universe(
    universe: dict[str, list[Bar]],
    preferred_benchmark: str | None = None,
    include_benchmark: bool = False,
    weights: dict[str, float] | None = None,
) -> tuple[list[StockEvaluation], dict[str, object]]:
    market_context = build_market_context(universe, preferred_benchmark)
    benchmark = market_context.get("benchmark")
    evaluations: list[StockEvaluation] = []

    for ticker, bars in sorted(universe.items()):
        if not include_benchmark and benchmark and ticker == benchmark:
            continue
        evaluations.append(evaluate_stock(ticker, bars, market_context, weights))

    latest_date = max((evaluation.latest_date for evaluation in evaluations if evaluation.latest_date), default="")
    evaluations.sort(
        key=lambda evaluation: (
            evaluation.latest_date == latest_date if latest_date else True,
            evaluation.final_score,
        ),
        reverse=True,
    )
    ranked = [replace(evaluation, rank=index) for index, evaluation in enumerate(evaluations, start=1)]
    return ranked, market_context


def evaluation_to_row(evaluation: StockEvaluation) -> dict[str, object]:
    scores = evaluation.scores
    return {
        "ticker": evaluation.ticker,
        "rank": evaluation.rank,
        "final_score": evaluation.final_score,
        "final_status": evaluation.status,
        "market_regime_score": scores["market_regime"].score,
        "trend_score": scores["trend"].score,
        "livermore_breakout_score": scores["livermore"].score,
        "volume_price_score": scores["volume_price"].score,
        "candlestick_score": scores["candlestick"].score,
        "overheat_score": scores["overheat"].score,
        "risk_score": scores["risk"].score,
        "zhuge_orion_score": scores["zhuge_orion"].score,
        "final_chair_score": scores["chair"].score,
        "main_reason": evaluation.short_reason,
        "main_risk": evaluation.main_risk,
        "suggested_action_status": evaluation.suggested_action,
    }
