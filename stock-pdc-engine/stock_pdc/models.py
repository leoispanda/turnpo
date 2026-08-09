from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Bar:
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float


@dataclass(frozen=True)
class ScorerResult:
    score: float
    reason: str
    warning: str = ""


@dataclass(frozen=True)
class StockEvaluation:
    ticker: str
    final_score: float
    rank: int
    status: str
    suggested_action: str
    scores: dict[str, ScorerResult]
    short_reason: str
    main_risk: str
    latest_date: str = ""
    latest_close: float = 0.0
    breakout_trigger: float | None = None
    technical_stop: float | None = None
