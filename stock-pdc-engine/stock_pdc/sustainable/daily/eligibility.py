"""Hard eligibility: the checks that run before any model is paid to think.

Hawkeye already answers "is this large enough and has it gone up" — those two
rules are frozen and are not restated here. What Hawkeye does not check is
whether the name is tradeable at all today: an ST designation, a halt, a session
whose turnover is too thin to leave, bars that stopped updating.

A blocked candidate never reaches a seat, is never nominated, and can never take
one of the ten seats. There is no severity ladder and no soft blocking: a
candidate is either eligible or it is out, with the reason recorded.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Any

from ...config import HAWKEYE_MIN_BARS


ELIGIBILITY_SCHEMA_VERSION = "pdc-daily-eligibility-v1"

# Reason codes are a closed vocabulary so the daily report can count them
# without parsing prose.
DATA_MISSING = "DATA_MISSING"
DATA_STALE = "DATA_STALE"
BARS_INSUFFICIENT = "BARS_INSUFFICIENT"
ST_FLAG = "ST_FLAG"
SUSPENDED = "SUSPENDED"
LIQUIDITY_THIN = "LIQUIDITY_THIN"
ENGINE_REMOVE = "ENGINE_REMOVE"

BLOCK_REASONS: tuple[str, ...] = (
    DATA_MISSING,
    DATA_STALE,
    BARS_INSUFFICIENT,
    ST_FLAG,
    SUSPENDED,
    LIQUIDITY_THIN,
    ENGINE_REMOVE,
)

# A name under special treatment, or on its way off the board, trades under
# different limits and different rules. It is out of the daily universe.
ST_MARKERS: tuple[str, ...] = ("ST", "*ST", "退")


@dataclass(frozen=True)
class EligibilityConfig:
    """Thresholds for the hard gate. Deterministic, never model-chosen."""

    # 5000万 of session turnover is the floor for a position that has to be
    # exitable in one session without moving the print.
    min_turnover_cny: float = 50_000_000.0
    max_data_age_days: int = 4
    min_bars: int = HAWKEYE_MIN_BARS
    # The rule engine's own "Remove" verdict is off by default here. It is a
    # judgement, not a tradeability fact, and the committee is deliberately not
    # shown the engine's conclusions before it forms its own — on the 2026-08-17
    # pool it would have removed 122 of 303 names before either seat looked.
    # The final gate still blocks a Remove candidate from taking a seat.
    block_engine_remove: bool = False


def looks_like_st(name: str) -> bool:
    cleaned = str(name or "").replace(" ", "").upper()
    if not cleaned:
        return False
    if cleaned.startswith("ST") or cleaned.startswith("*ST"):
        return True
    return "退" in cleaned


def _age_days(analysis_date: str, today: date) -> int | None:
    try:
        return (today - date.fromisoformat(analysis_date)).days
    except (TypeError, ValueError):
        return None


def screen(
    candidate: dict[str, Any],
    analysis_date: str,
    today: date,
    config: EligibilityConfig = EligibilityConfig(),
) -> dict[str, Any]:
    """Decide whether one candidate may enter the daily committee at all."""
    ticker = str(candidate.get("ticker") or "").strip().upper()
    reasons: list[str] = []

    bar_count = int(candidate.get("bar_count") or 0)
    close = candidate.get("close")
    if not ticker or close in (None, "") or float(close or 0) <= 0:
        reasons.append(DATA_MISSING)
    if bar_count and bar_count < config.min_bars:
        reasons.append(BARS_INSUFFICIENT)
    elif not bar_count:
        reasons.append(DATA_MISSING)

    bar_date = str(candidate.get("bar_date") or "")
    quote_date = str(candidate.get("quote_date") or "")
    age = _age_days(analysis_date, today)
    if age is None or age > config.max_data_age_days:
        reasons.append(DATA_STALE)
    elif bar_date and bar_date != analysis_date:
        reasons.append(DATA_STALE)
    elif quote_date and quote_date != analysis_date:
        reasons.append(DATA_STALE)

    if looks_like_st(candidate.get("name", "")):
        reasons.append(ST_FLAG)

    turnover = candidate.get("turnover_amount")
    if turnover is None:
        reasons.append(DATA_MISSING)
    elif float(turnover) <= 0.0:
        # No turnover on a session the rest of the market traded is a halt.
        reasons.append(SUSPENDED)
    elif float(turnover) < config.min_turnover_cny:
        reasons.append(LIQUIDITY_THIN)

    if config.block_engine_remove and str(candidate.get("final_status") or "").strip() == "Remove":
        reasons.append(ENGINE_REMOVE)

    ordered = [code for code in BLOCK_REASONS if code in reasons]
    return {
        "ticker": ticker,
        "name": str(candidate.get("name") or ""),
        "status": "BLOCKED" if ordered else "ELIGIBLE",
        "reasons": ordered,
    }


def screen_all(
    candidates: list[dict[str, Any]],
    analysis_date: str,
    today: date,
    config: EligibilityConfig = EligibilityConfig(),
) -> dict[str, Any]:
    """Screen the whole pool and report what survived and why the rest did not."""
    rows = [screen(candidate, analysis_date, today, config) for candidate in candidates]
    eligible = [row["ticker"] for row in rows if row["status"] == "ELIGIBLE"]
    counts: dict[str, int] = {}
    for row in rows:
        for code in row["reasons"]:
            counts[code] = counts.get(code, 0) + 1
    return {
        "schemaVersion": ELIGIBILITY_SCHEMA_VERSION,
        "analysisDate": analysis_date,
        "screenedCount": len(rows),
        "eligibleCount": len(eligible),
        "blockedCount": len(rows) - len(eligible),
        "minTurnoverCny": config.min_turnover_cny,
        "maxDataAgeDays": config.max_data_age_days,
        "eligible": sorted(eligible),
        "blockedReasonCounts": dict(sorted(counts.items())),
        "rows": sorted(rows, key=lambda row: row["ticker"]),
    }


def blocked_tickers(report: dict[str, Any]) -> set[str]:
    return {row["ticker"] for row in report["rows"] if row["status"] == "BLOCKED"}
