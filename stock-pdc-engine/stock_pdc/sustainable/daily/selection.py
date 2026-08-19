"""The final gate: exactly ten seats, or cash in the seats that fail it.

Ranking answers "which candidates look best". This module answers a different
question — "which of them may be bought today" — and the two are not the same.
Freshness, ST status, halts, liquidity, the engine's risk and overheat floors,
the distance to the technical stop, sector concentration and a turnover buffer
against yesterday's list all sit here, after the ranking and before the sheet.

Two rules matter more than the rest. A seat is never filled with a worse or a
blocked candidate to make the number ten: an unfilled seat is CASH, which is a
real position. And market regime and personal posture change *how much* is
deployed, never *which* names rank where — a global dial cannot be allowed to
quietly reorder a cross-section.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from ..blue_whale import (
    APPROVE_RISK_FLOOR,
    APPROVE_SCORE_FLOOR,
    HARD_RISK_FLOOR,
    OVERHEAT_CAUTION,
)
from .consensus import UNRESOLVED


SELECTION_SCHEMA_VERSION = "pdc-daily-selection-v1"

SEAT_COUNT = 10

ACTION_BUY = "BUY"
ACTION_HOLD = "HOLD"
ACTION_PAUSE = "PAUSE"
ACTION_CASH = "CASH"
ACTIONS: tuple[str, ...] = (ACTION_BUY, ACTION_HOLD, ACTION_PAUSE, ACTION_CASH)

# Gate reason codes, closed vocabulary.
GATE_BLOCKED = "BLOCKED"
GATE_UNRESOLVED = UNRESOLVED
GATE_RISK_FLOOR = "RISK_FLOOR"
GATE_SCORE_FLOOR = "SCORE_FLOOR"
GATE_OVERHEATED = "OVERHEATED"
GATE_STOP_DISTANCE = "STOP_DISTANCE"
GATE_STOP_MISSING = "STOP_MISSING"
GATE_SECTOR_CAP = "SECTOR_CAP"
GATE_ENGINE_REMOVE = "ENGINE_REMOVE"

SECTOR_CAP_ACTIVE = "ACTIVE"
SECTOR_CAP_INACTIVE = "INACTIVE_MISSING_DATA"

# Exposure is a global dial. The bands are deliberately coarse: a finer curve
# would imply a precision two trading days of history cannot support.
MARKET_EXPOSURE_BANDS: tuple[tuple[float, float], ...] = (
    (7.0, 1.0),
    (5.0, 0.9),
    (3.0, 0.7),
    (0.0, 0.5),
)
POSTURE_FACTORS: dict[str, float] = {
    "": 1.0,
    "aggressive": 1.0,
    "balanced": 0.95,
    "neutral": 0.9,
    "conservative": 0.75,
    "defensive": 0.5,
}


@dataclass(frozen=True)
class SelectionConfig:
    """Every threshold the final gate applies, in one place."""

    seats: int = SEAT_COUNT
    # A held name keeps its seat while it stays within this many ranks of the
    # cut, so a one-place drift does not churn the book.
    turnover_buffer: int = 3
    max_per_sector: int = 3
    # Beyond this distance the technical stop is too far below the close for the
    # position to be sized sensibly today.
    max_stop_distance_pct: float = 12.0
    min_consensus_total: float = APPROVE_SCORE_FLOOR
    min_risk_score: float = APPROVE_RISK_FLOOR
    hard_risk_floor: float = HARD_RISK_FLOOR
    min_overheat_score: float = OVERHEAT_CAUTION
    sectors: dict[str, str] = field(default_factory=dict)


def exposure_factor(market_regime_score: float | None, posture: str = "") -> float:
    """How much of the book to deploy. Never reorders anything."""
    band = 1.0
    if market_regime_score is not None:
        for floor, factor in MARKET_EXPOSURE_BANDS:
            if float(market_regime_score) >= floor:
                band = factor
                break
    return round(band * POSTURE_FACTORS.get(str(posture or "").strip().lower(), 1.0), 4)


def stop_distance_pct(record: dict[str, Any] | None) -> float | None:
    """Percent the close sits above the engine's technical stop."""
    if not record:
        return None
    value = record.get("values", {}).get("stop_dist_pct")
    return None if value is None else float(value)


def gate_candidate(
    row: dict[str, Any],
    record: dict[str, Any] | None,
    blocked: dict[str, list[str]],
    config: SelectionConfig,
) -> dict[str, Any]:
    """Decide whether one ranked candidate may take a seat, and on what terms."""
    ticker = row["ticker"]
    hard: list[str] = []
    soft: list[str] = []

    if ticker in blocked:
        hard.append(GATE_BLOCKED)
    if str(row.get("finalStatus") or "") == "Remove":
        hard.append(GATE_ENGINE_REMOVE)
    if float(row.get("riskScore") or 0.0) <= config.hard_risk_floor:
        hard.append(GATE_RISK_FLOOR)
    if row.get("unresolvedDisagreement"):
        # Not a hard block on the stock, a hard block on buying it today.
        hard.append(GATE_UNRESOLVED)

    if float(row["consensusTotal"]) < config.min_consensus_total:
        soft.append(GATE_SCORE_FLOOR)
    if float(row.get("riskScore") or 0.0) < config.min_risk_score:
        soft.append(GATE_RISK_FLOOR)
    if float(row.get("overheatScore") or 0.0) < config.min_overheat_score:
        soft.append(GATE_OVERHEATED)
    distance = stop_distance_pct(record)
    if distance is None:
        soft.append(GATE_STOP_MISSING)
    elif distance > config.max_stop_distance_pct:
        soft.append(GATE_STOP_DISTANCE)

    return {
        "ticker": ticker,
        "rank": row["rank"],
        "seatable": not hard,
        "entryEligible": not hard and not soft,
        "hardReasons": hard,
        "softReasons": soft,
        "stopDistancePct": distance,
        "blockReasons": blocked.get(ticker, []),
    }


def _sector_of(ticker: str, config: SelectionConfig) -> str:
    return config.sectors.get(ticker, "")


def select(
    ranking: dict[str, Any],
    records: dict[str, dict[str, Any]],
    blocked: dict[str, list[str]],
    previous: dict[str, int],
    config: SelectionConfig = SelectionConfig(),
    allow_new_buys: bool = True,
) -> dict[str, Any]:
    """Fill exactly ``config.seats`` seats: held names first, then new entries, then cash."""
    rows = sorted(ranking["rows"], key=lambda row: row["rank"])
    gates = {row["ticker"]: gate_candidate(row, records.get(row["ticker"]), blocked, config) for row in rows}
    by_ticker = {row["ticker"]: row for row in rows}

    sector_counts: dict[str, int] = {}
    seated: list[dict[str, Any]] = []
    taken: set[str] = set()

    def seat(ticker: str, action: str, gate: dict[str, Any]) -> None:
        sector = _sector_of(ticker, config)
        if sector:
            sector_counts[sector] = sector_counts.get(sector, 0) + 1
        taken.add(ticker)
        seated.append({
            "ticker": ticker,
            "action": action,
            "consensusRank": gate["rank"],
            "gate": gate,
            "sector": sector,
        })

    def sector_has_room(ticker: str) -> bool:
        if not config.sectors:
            return True
        sector = _sector_of(ticker, config)
        if not sector:
            return True
        return sector_counts.get(sector, 0) < config.max_per_sector

    # Held names first. The buffer is what keeps a name that slipped two places
    # from being sold and re-bought a day later.
    dropped: list[dict[str, Any]] = []
    for ticker, _previous_rank in sorted(previous.items(), key=lambda item: item[1]):
        if len(seated) >= config.seats:
            break
        gate = gates.get(ticker)
        if gate is None:
            dropped.append({"ticker": ticker, "reason": "NOT_IN_RANKING"})
            continue
        if not gate["seatable"]:
            dropped.append({"ticker": ticker, "reason": ",".join(gate["hardReasons"])})
            continue
        if gate["rank"] > config.seats + config.turnover_buffer:
            dropped.append({"ticker": ticker, "reason": "OUTSIDE_BUFFER"})
            continue
        seat(ticker, ACTION_HOLD if gate["entryEligible"] else ACTION_PAUSE, gate)

    # Then new entries, strictly from the top of the ranking.
    if allow_new_buys:
        for row in rows:
            if len(seated) >= config.seats:
                break
            ticker = row["ticker"]
            if ticker in taken:
                continue
            gate = gates[ticker]
            if not gate["entryEligible"]:
                continue
            if not sector_has_room(ticker):
                gate["softReasons"].append(GATE_SECTOR_CAP)
                continue
            seat(ticker, ACTION_BUY, gate)

    seated.sort(key=lambda item: item["consensusRank"])
    seats: list[dict[str, Any]] = []
    for position, item in enumerate(seated, start=1):
        row = by_ticker[item["ticker"]]
        seats.append({
            "rank": position,
            "ticker": item["ticker"],
            "action": item["action"],
            "consensusRank": item["consensusRank"],
            "consensusTotal": row["consensusTotal"],
            "seatTotals": row["seatTotals"],
            "totalDisagreement": row["totalDisagreement"],
            "riskScore": row.get("riskScore"),
            "overheatScore": row.get("overheatScore"),
            "sector": item["sector"],
            "gateReasons": item["gate"]["softReasons"],
            "stopDistancePct": item["gate"]["stopDistancePct"],
        })

    for position in range(len(seats) + 1, config.seats + 1):
        # An empty seat is cash, not the next name down. Filling it with a
        # candidate the gate rejected is exactly the failure this guards.
        seats.append({
            "rank": position,
            "ticker": "CASH",
            "action": ACTION_CASH,
            "consensusRank": None,
            "consensusTotal": None,
            "seatTotals": {},
            "totalDisagreement": None,
            "riskScore": None,
            "overheatScore": None,
            "sector": "",
            "gateReasons": [],
            "stopDistancePct": None,
        })

    return {
        "schemaVersion": SELECTION_SCHEMA_VERSION,
        "seatCount": config.seats,
        "seats": seats[: config.seats],
        "cashSeats": sum(1 for item in seats[: config.seats] if item["action"] == ACTION_CASH),
        "allowNewBuys": allow_new_buys,
        "turnoverBuffer": config.turnover_buffer,
        "sectorCapStatus": SECTOR_CAP_ACTIVE if config.sectors else SECTOR_CAP_INACTIVE,
        "maxPerSector": config.max_per_sector,
        "maxStopDistancePct": config.max_stop_distance_pct,
        "unresolvedTickers": sorted(
            ticker for ticker, gate in gates.items() if GATE_UNRESOLVED in gate["hardReasons"]
        ),
        "droppedHoldings": dropped,
        "gates": [gates[row["ticker"]] for row in rows],
    }


def carry_forward(
    previous: dict[str, int],
    blocked: dict[str, list[str]],
    config: SelectionConfig = SelectionConfig(),
) -> dict[str, Any]:
    """Yesterday's seats, re-checked, when today cannot produce a new opinion.

    Used when a seat failed the detail round: one model's scores are not a
    committee, so nothing new is bought. Names that are no longer tradeable —
    ST, halted, thin — do not keep their seat either; that seat becomes cash.
    """
    seats: list[dict[str, Any]] = []
    dropped: list[dict[str, Any]] = []
    for ticker, _rank in sorted(previous.items(), key=lambda item: item[1]):
        if len(seats) >= config.seats:
            break
        if ticker in blocked:
            dropped.append({"ticker": ticker, "reason": ",".join(blocked[ticker])})
            continue
        seats.append({
            "rank": len(seats) + 1,
            "ticker": ticker,
            "action": ACTION_PAUSE,
            "consensusRank": None,
            "consensusTotal": None,
            "seatTotals": {},
            "totalDisagreement": None,
            "riskScore": None,
            "overheatScore": None,
            "sector": "",
            "gateReasons": ["CARRIED_FORWARD"],
            "stopDistancePct": None,
        })
    for position in range(len(seats) + 1, config.seats + 1):
        seats.append({
            "rank": position,
            "ticker": "CASH",
            "action": ACTION_CASH,
            "consensusRank": None,
            "consensusTotal": None,
            "seatTotals": {},
            "totalDisagreement": None,
            "riskScore": None,
            "overheatScore": None,
            "sector": "",
            "gateReasons": [],
            "stopDistancePct": None,
        })
    return {
        "schemaVersion": SELECTION_SCHEMA_VERSION,
        "seatCount": config.seats,
        "seats": seats[: config.seats],
        "cashSeats": sum(1 for item in seats[: config.seats] if item["action"] == ACTION_CASH),
        "allowNewBuys": False,
        "turnoverBuffer": config.turnover_buffer,
        "sectorCapStatus": SECTOR_CAP_INACTIVE if not config.sectors else SECTOR_CAP_ACTIVE,
        "maxPerSector": config.max_per_sector,
        "maxStopDistancePct": config.max_stop_distance_pct,
        "unresolvedTickers": [],
        "droppedHoldings": dropped,
        "gates": [],
    }


def allocate(
    selection: dict[str, Any],
    factor: float,
) -> dict[str, Any]:
    """Equal seats, scaled by the global exposure dial; the rest is cash."""
    share = round(100.0 / max(selection["seatCount"], 1), 4)
    total = 0.0
    for seat in selection["seats"]:
        if seat["action"] == ACTION_CASH:
            seat["allocation_pct"] = round(share, 2)
        else:
            seat["allocation_pct"] = round(share * factor, 2)
        total += seat["allocation_pct"]
    selection["exposureFactor"] = factor
    selection["investedPct"] = round(
        sum(
            seat["allocation_pct"]
            for seat in selection["seats"]
            if seat["action"] != ACTION_CASH
        ),
        2,
    )
    selection["cashReservePct"] = round(100.0 - total, 2)
    return selection
