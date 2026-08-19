"""Deterministic arbitration: arithmetic decides, no third model does.

Consensus is the per-dimension mean of the seats' final matrices, with the two
seats weighted equally. The canonical total is then computed from those
dimensions using the PDC's own fixed nine-dimension weights — the same constants
the deterministic core uses, imported rather than restated, so the two paths
cannot drift apart.

A wide split is preserved, never averaged away: both seat scores, the consensus,
and the size of the gap all travel into the final row. High disagreement is a
signal for a human to look, not a reason to drop a candidate.
"""

from __future__ import annotations

from typing import Any

from ..config import DEFAULT_WEIGHTS
from .contracts import DECISIONS, DIMENSIONS
from .disagreement import HIGH_DISAGREEMENT


ARBITRATION_SCHEMA_VERSION = "pdc-sustainable-arbitration-v1"

# The committee's dimension names and the engine's weight keys differ for two
# entries. Mapping them here keeps a single source of truth for the weights.
WEIGHT_KEY = {
    "market_regime": "market_regime",
    "trend": "trend",
    "livermore_breakout": "livermore",
    "volume_price": "volume_price",
    "candlestick": "candlestick",
    "overheat": "overheat",
    "risk": "risk",
    "zhuge_orion": "zhuge_orion",
    "final_chair": "chair",
}


def canonical_weights() -> dict[str, float]:
    """The committee's weights, taken from the engine's own constants."""
    missing = [name for name in DIMENSIONS if WEIGHT_KEY[name] not in DEFAULT_WEIGHTS]
    if missing:
        raise ValueError(f"引擎权重缺少维度：{', '.join(missing)}")
    return {name: float(DEFAULT_WEIGHTS[WEIGHT_KEY[name]]) for name in DIMENSIONS}


def canonical_total(dimensions: dict[str, float]) -> float:
    """Weighted total over the nine dimensions. Never supplied by a model."""
    weights = canonical_weights()
    total = sum(float(dimensions[name]) * weights[name] for name in DIMENSIONS)
    return round(total / sum(weights.values()), 4)


def arbitrate(
    final_scores: dict[str, list[dict[str, Any]]],
    matrix: dict[str, Any],
    facts: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    """Combine both seats' final matrices into one ranked, deterministic result."""
    if len(final_scores) != 2:
        raise ValueError("仲裁需要恰好两个完成的席位")
    left_id, right_id = sorted(final_scores)
    left = {card["ticker"]: card for card in final_scores[left_id]}
    right = {card["ticker"]: card for card in final_scores[right_id]}
    if set(left) != set(right):
        raise ValueError("两个席位的最终票池不一致，拒绝仲裁")

    challenged = {row["ticker"]: row for row in matrix.get("rows", [])}
    rows: list[dict[str, Any]] = []
    for ticker in sorted(left):
        consensus: dict[str, float] = {}
        per_seat: dict[str, dict[str, float]] = {left_id: {}, right_id: {}}
        widest = 0.0
        for name in DIMENSIONS:
            a = float(left[ticker]["dimensions"][name])
            b = float(right[ticker]["dimensions"][name])
            per_seat[left_id][name] = a
            per_seat[right_id][name] = b
            consensus[name] = round((a + b) / 2.0, 4)
            widest = max(widest, abs(a - b))

        seat_totals = {
            left_id: canonical_total(per_seat[left_id]),
            right_id: canonical_total(per_seat[right_id]),
        }
        votes = {
            name: sum(
                card[ticker]["decision"] == name for card in (left, right)
            )
            for name in DECISIONS
        }
        rows.append({
            "ticker": ticker,
            # Minority preservation: every seat's own view survives the merge.
            "seatDimensions": per_seat,
            "seatTotals": seat_totals,
            "seatDecisions": {
                left_id: left[ticker]["decision"],
                right_id: right[ticker]["decision"],
            },
            "consensusDimensions": consensus,
            "consensusTotal": canonical_total(consensus),
            "absoluteDisagreement": round(widest, 4),
            "totalDisagreement": round(abs(seat_totals[left_id] - seat_totals[right_id]), 4),
            "highDisagreement": widest >= HIGH_DISAGREEMENT,
            "challengedDimensions": challenged.get(ticker, {}).get("challengedDimensions", []),
            "decisionVotes": votes,
            "meanConfidence": round(
                (float(left[ticker]["confidence"]) + float(right[ticker]["confidence"])) / 2.0, 4
            ),
            "riskScore": float(facts.get(ticker, {}).get("riskScore") or 0.0),
            "overheatScore": float(facts.get(ticker, {}).get("overheatScore") or 0.0),
            "finalStatus": str(facts.get(ticker, {}).get("finalStatus") or ""),
        })

    rows.sort(key=lambda row: (-row["consensusTotal"], -row["meanConfidence"], row["ticker"]))
    for position, row in enumerate(rows, start=1):
        row["rank"] = position

    return {
        "schemaVersion": ARBITRATION_SCHEMA_VERSION,
        "aggregationMode": "deterministic",
        "weights": canonical_weights(),
        "memberIds": [left_id, right_id],
        "poolSize": len(rows),
        "highDisagreementCount": sum(row["highDisagreement"] for row in rows),
        "rows": rows,
    }


def _revision_history(round_two: dict[str, Any]) -> dict[str, Any]:
    return {
        record["memberId"]: record.get("revisions", [])
        for record in round_two.get("memberResults", [])
    }


def final_gate(
    arbitration: dict[str, Any],
    snapshot: dict[str, Any],
    hawkeye_count: int,
    data_age_days: int,
    max_age_days: int = 4,
) -> dict[str, Any]:
    """Apply the repository's existing deterministic gates. No new thresholds.

    Risk floors come from the Stage 07 constants already in use; freshness and
    completeness mirror the checks `run_latest_pdc.py` performs before scoring.
    """
    from .blue_whale import APPROVE_RISK_FLOOR, APPROVE_SCORE_FLOOR, HARD_RISK_FLOOR

    blocking: list[str] = []
    review: list[str] = []
    if data_age_days > max_age_days:
        blocking.append(f"数据 {snapshot['analysisDate']} 距今 {data_age_days} 天")
    if arbitration["poolSize"] != hawkeye_count:
        blocking.append(
            f"候选池不完整：仲裁 {arbitration['poolSize']} 支 ≠ 鹰眼 {hawkeye_count} 支"
        )
    if arbitration["highDisagreementCount"]:
        review.append(f"{arbitration['highDisagreementCount']} 支存在高分歧，需人工复核")

    for row in arbitration["rows"]:
        if row["riskScore"] <= HARD_RISK_FLOOR or row["finalStatus"] == "Remove":
            row["gate"] = "BLOCK"
        elif row["consensusTotal"] >= APPROVE_SCORE_FLOOR and row["riskScore"] >= APPROVE_RISK_FLOOR:
            row["gate"] = "REVIEW_REQUIRED" if row["highDisagreement"] else "PASS"
        else:
            row["gate"] = "REVIEW_REQUIRED"

    if blocking:
        status = "BLOCK"
    elif review or not any(row["gate"] == "PASS" for row in arbitration["rows"]):
        status = "REVIEW_REQUIRED"
    else:
        status = "PASS"

    return {
        "schemaVersion": "pdc-sustainable-final-gate-v1",
        "status": status,
        "blockingReasons": blocking,
        "reviewReasons": review,
        "passCount": sum(row["gate"] == "PASS" for row in arbitration["rows"]),
        "reviewCount": sum(row["gate"] == "REVIEW_REQUIRED" for row in arbitration["rows"]),
        "blockCount": sum(row["gate"] == "BLOCK" for row in arbitration["rows"]),
    }


def acceptance_report(
    snapshot: dict[str, Any],
    frozen_r1: dict[str, Any],
    r1_hashes: dict[str, Any],
    matrix: dict[str, Any],
    round_two: dict[str, Any],
    arbitration: dict[str, Any],
    gate: dict[str, Any],
    hawkeye_count: int,
    top_n: int,
    ledger: dict[str, Any] | None = None,
) -> dict[str, str]:
    """The acceptance checklist, computed from artifacts rather than asserted."""
    seats = {
        record["memberId"]: record
        for record in frozen_r1.get("memberResults", [])
    }
    def coverage(member_id: str) -> str:
        record = seats.get(member_id)
        if record is None or record.get("status") != "COMPLETED":
            return f"0/{hawkeye_count}"
        return f"{len(record['scorecards'])}/{hawkeye_count}"

    r2 = {record["memberId"]: record for record in round_two.get("memberResults", [])}
    # Passed in explicitly: the ledger is removed from the Round 2 record before
    # the artifacts are written, so reading it back from there always reported a
    # failure the run had not actually had.
    seal = ledger if ledger is not None else round_two.get("ledger", {})
    return {
        "CANDIDATE_POOL_PRESERVED": (
            "PASS" if arbitration["poolSize"] == hawkeye_count else "FAIL"
        ),
        "SOL_R1": coverage("sol"),
        "CLAUDE_R1": coverage("claude"),
        "ROUND1_FROZEN": "PASS" if len(r1_hashes.get("roundOneHashes", {})) >= 2 else "FAIL",
        "ANONYMIZATION": (
            "PASS"
            if isinstance(seal, dict)
            and len(seal.get("labelByMember") or {}) == len(r2) >= 2
            else "FAIL"
        ),
        "ROUND2_SOL": r2.get("sol", {}).get("status", "MISSING"),
        "ROUND2_CLAUDE": r2.get("claude", {}).get("status", "MISSING"),
        "MINORITY_PRESERVATION": (
            "PASS"
            if all("seatDimensions" in row and "seatTotals" in row for row in arbitration["rows"])
            else "FAIL"
        ),
        "DETERMINISTIC_AGGREGATION": (
            "PASS" if arbitration["aggregationMode"] == "deterministic" else "FAIL"
        ),
        "FINAL_GATE": gate["status"],
        "FINAL_RANKING_COUNT": str(arbitration["poolSize"]),
        "TOP20_GENERATED": "PASS" if arbitration["poolSize"] >= min(top_n, hawkeye_count) else "FAIL",
        "SNAPSHOT_ID": snapshot["snapshotId"],
        "CANDIDATE_SET_HASH": snapshot["candidateSetHash"][:16],
        "FACTS_HASH": snapshot["factsHash"][:16],
        "CHALLENGED_CANDIDATES": str(matrix.get("challengedCount", 0)),
        "REVISIONS_APPLIED": str(
            sum(len(v) for v in _revision_history(round_two).values())
        ),
    }
