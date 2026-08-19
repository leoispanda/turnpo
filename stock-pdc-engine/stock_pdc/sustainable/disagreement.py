"""Per-dimension disagreement between the two seats.

Comparing only the totals hides the interesting case: two seats can land on the
same overall number while disputing trend and risk in opposite directions. The
matrix is therefore built dimension by dimension, and the threshold that marks a
dispute is a constant here — never something a model chooses for itself.
"""

from __future__ import annotations

from typing import Any

from .contracts import DIMENSIONS


DISAGREEMENT_SCHEMA_VERSION = "pdc-sustainable-disagreement-v1"

# A two-point gap on a ten-point dimension is the default line for asking a seat
# to look again. Configurable, deterministic, applied identically to every
# candidate.
DEFAULT_CHALLENGE_THRESHOLD = 2.0

# Where the two seats are furthest apart, the pool is flagged for a human rather
# than resolved by arithmetic alone.
HIGH_DISAGREEMENT = 4.0


def build_matrix(
    submissions: dict[str, list[dict[str, Any]]],
    threshold: float = DEFAULT_CHALLENGE_THRESHOLD,
) -> dict[str, Any]:
    """Compare every seat pair on every dimension of every candidate."""
    if len(submissions) != 2:
        raise ValueError("逐维度分歧矩阵目前只定义在两个席位之间")
    left_id, right_id = sorted(submissions)
    left = {card["ticker"]: card for card in submissions[left_id]}
    right = {card["ticker"]: card for card in submissions[right_id]}
    shared = sorted(set(left) & set(right))

    rows: list[dict[str, Any]] = []
    for ticker in shared:
        dimensions: dict[str, Any] = {}
        challenged: list[str] = []
        for name in DIMENSIONS:
            a = float(left[ticker]["dimensions"][name])
            b = float(right[ticker]["dimensions"][name])
            difference = round(abs(a - b), 4)
            dimensions[name] = {
                left_id: a,
                right_id: b,
                "difference": difference,
                "challenge": difference >= threshold,
            }
            if difference >= threshold:
                challenged.append(name)
        widest = max(item["difference"] for item in dimensions.values())
        rows.append({
            "ticker": ticker,
            "dimensions": dimensions,
            "challengedDimensions": challenged,
            "maxDifference": widest,
            "needsChallenge": bool(challenged),
            "highDisagreement": widest >= HIGH_DISAGREEMENT,
        })

    return {
        "schemaVersion": DISAGREEMENT_SCHEMA_VERSION,
        "memberIds": [left_id, right_id],
        "threshold": threshold,
        "highDisagreementThreshold": HIGH_DISAGREEMENT,
        "candidateCount": len(rows),
        "challengedCount": sum(row["needsChallenge"] for row in rows),
        "highDisagreementCount": sum(row["highDisagreement"] for row in rows),
        "rows": rows,
    }


def challenges_for(matrix: dict[str, Any]) -> list[dict[str, Any]]:
    """The candidates that crossed the threshold, for Round 2."""
    return [row for row in matrix["rows"] if row["needsChallenge"]]
