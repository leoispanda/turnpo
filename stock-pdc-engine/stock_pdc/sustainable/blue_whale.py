"""Blue Whale: the execution layer, not a chair.

Blue Whale starts the seats, validates what they return, proves no candidate was
lost, runs the deterministic aggregation and writes the artifacts. It holds no
opinion about any stock.

This boundary is the point. A model that may break ties becomes the real
decision-maker no matter what the pipeline diagram says, and its preferences
would silently replace rules that were frozen deliberately. So when the seats
disagree, the disagreement is carried into the output as a fact and resolved by
arithmetic — never by asking a model which of its colleagues to believe.

Consensus and ranking are computed in `arbitration`, from the seats' final
matrices and the engine's own fixed weights. Any Top-N is a slice of that
ranking for display; it is never an input to a seat.
"""

from __future__ import annotations

from typing import Any

AGGREGATION_SCHEMA_VERSION = "pdc-sustainable-aggregation-v1"

# Thresholds copied from the deterministic Stage 07 gate so both paths draw the
# same lines and any drift between them is visible rather than silent.
HARD_RISK_FLOOR = 3.5
APPROVE_SCORE_FLOOR = 6.0
APPROVE_RISK_FLOOR = 5.0
OVERHEAT_CAUTION = 3.0
SPREAD_CAUTION = 3.0


class CoverageError(ValueError):
    """A seat's pool does not match the Hawkeye pool it was given."""


def assert_full_coverage(
    hawkeye_tickers: tuple[str, ...],
    frozen: dict[str, Any],
) -> None:
    """Every completed seat must have scored the entire Hawkeye pool.

    Checked rather than assumed: a seat that dropped names would shrink the pool
    that gets ranked, and the loss would be invisible in the final table.
    """
    expected = {ticker.upper() for ticker in hawkeye_tickers}
    for record in frozen.get("memberResults", []):
        if record.get("status") != "COMPLETED":
            continue
        covered = {card["ticker"] for card in record["scorecards"]}
        if covered != expected:
            missing = ", ".join(sorted(expected - covered)[:10]) or "（无）"
            extra = ", ".join(sorted(covered - expected)[:10]) or "（无）"
            raise CoverageError(
                f"{record['memberId']} 未覆盖完整候选池："
                f"缺少 {len(expected - covered)} 支（{missing}），"
                f"多出 {len(covered - expected)} 支（{extra}）"
            )


def display_slice(ranking: dict[str, Any], top: int) -> list[dict[str, Any]]:
    """The top rows for presentation.

    A view over a ranking already computed across the whole pool — never a
    filter applied before scoring.
    """
    return ranking["rows"][: max(top, 0)]
