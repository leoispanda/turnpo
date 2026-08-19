"""Consensus for the daily path — the same arithmetic the audit path uses.

Nothing is re-derived here. The per-dimension disagreement matrix and the
deterministic merge come from the committee's own modules, so the daily list and
the offline audit rank candidates by identical rules and identical weights.

What this module adds is the daily consequence of a split. When the two seats'
final totals sit further apart than the configured limit, the candidate is
marked UNRESOLVED_DISAGREEMENT: it cannot be bought today, and the seat it would
have taken passes to the next name. A disagreement that survives a round of
evidence-bound review is not something arithmetic should paper over.
"""

from __future__ import annotations

from typing import Any

from ..arbitration import arbitrate
from ..disagreement import DEFAULT_CHALLENGE_THRESHOLD, build_matrix


CONSENSUS_SCHEMA_VERSION = "pdc-daily-consensus-v1"

# On a 0–10 canonical total, a gap this wide means the seats are describing two
# different stocks. Configurable, deterministic, never chosen by a model.
DEFAULT_TOTAL_DISAGREEMENT_LIMIT = 1.5

UNRESOLVED = "UNRESOLVED_DISAGREEMENT"

# How many names the review round re-examines.
DEFAULT_PRELIMINARY_TOP = 20


def build(
    submissions: dict[str, list[dict[str, Any]]],
    facts: dict[str, dict[str, Any]],
    stage: str,
    threshold: float = DEFAULT_CHALLENGE_THRESHOLD,
    disagreement_limit: float = DEFAULT_TOTAL_DISAGREEMENT_LIMIT,
) -> dict[str, Any]:
    """Merge both seats into one ranking, and mark the splits that survived."""
    matrix = build_matrix(submissions, threshold)
    ranking = arbitrate(submissions, matrix, facts)

    cards_by_member = {
        member_id: {card["ticker"]: card for card in cards}
        for member_id, cards in submissions.items()
    }
    unresolved = 0
    for row in ranking["rows"]:
        row["unresolvedDisagreement"] = row["totalDisagreement"] > disagreement_limit
        unresolved += bool(row["unresolvedDisagreement"])
        review_confidence = {
            member_id: cards[row["ticker"]]["reviewConfidence"]
            for member_id, cards in cards_by_member.items()
            if "reviewConfidence" in cards.get(row["ticker"], {})
        }
        if review_confidence:
            row["seatReviewConfidence"] = review_confidence
        challenges = {
            member_id: cards[row["ticker"]]["challenge"]
            for member_id, cards in cards_by_member.items()
            if cards.get(row["ticker"], {}).get("challenge")
        }
        if challenges:
            row["seatChallenges"] = challenges

    ranking["schemaVersion"] = CONSENSUS_SCHEMA_VERSION
    ranking["stage"] = stage
    ranking["disagreementLimit"] = disagreement_limit
    ranking["unresolvedCount"] = unresolved
    ranking["disagreementMatrix"] = matrix
    return ranking


def preliminary_top(ranking: dict[str, Any], count: int = DEFAULT_PRELIMINARY_TOP) -> tuple[str, ...]:
    """The finalists the review round re-examines: the top of the merged ranking.

    Taken after the merge, never before it — this is a slice of a ranking that
    already covered the whole union, not a filter applied to what the seats saw.
    """
    rows = sorted(ranking["rows"], key=lambda row: row["rank"])
    return tuple(row["ticker"] for row in rows[: max(count, 0)])


def seat_notes(submissions: dict[str, list[dict[str, Any]]]) -> dict[str, dict[str, Any]]:
    """Each seat's note and confidence per ticker, for the human-facing report."""
    notes: dict[str, dict[str, Any]] = {}
    for member_id, cards in submissions.items():
        for card in cards:
            entry = notes.setdefault(card["ticker"], {})
            entry[member_id] = {
                "note": card["note"],
                "confidence": card["confidence"],
                "decision": card["decision"],
                "riskFlags": list(card["risk_flags"]),
            }
    return notes


def main_reason_for(ticker: str, notes: dict[str, dict[str, Any]]) -> str:
    """The note from whichever seat was most confident about this candidate.

    Deterministic on ties by member id, so the same inputs always produce the
    same daily sheet.
    """
    entries = notes.get(ticker, {})
    if not entries:
        return ""
    member_id = min(entries, key=lambda key: (-float(entries[key]["confidence"]), key))
    return str(entries[member_id]["note"])


def risk_flags_for(ticker: str, notes: dict[str, dict[str, Any]]) -> list[str]:
    """Every risk flag either seat raised, deduplicated and ordered."""
    flags: set[str] = set()
    for entry in notes.get(ticker, {}).values():
        flags.update(entry.get("riskFlags") or [])
    return sorted(flags)
