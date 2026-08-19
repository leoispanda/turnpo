"""The two frozen rules the sustainable committee must never drift from.

1. Every AI seat scores the entire Hawkeye pool. Top-N is a display slice of the
   final ranking, never a filter applied before scoring.
2. Blue Whale is an execution layer. Disagreement is resolved by arithmetic, not
   by asking a model which colleague to believe.
"""

from __future__ import annotations

import unittest

from stock_pdc.sustainable import blue_whale
from stock_pdc.sustainable.blue_whale import (
    CoverageError,
    assert_full_coverage,
    display_slice,
)
from stock_pdc.sustainable.contracts import DIMENSIONS
from stock_pdc.sustainable.round_one import DEFAULT_BATCH_SIZE, batches


def card(ticker: str, score: float = 5.0, decision: str = "WATCH", confidence: float = 0.6) -> dict:
    return {
        "ticker": ticker,
        "dimensions": {name: score for name in DIMENSIONS},
        "confidence": confidence,
        "risk_flags": [],
        "decision": decision,
        "note": "reason",
    }


def frozen(**members: list[dict]) -> dict:
    return {
        "runId": "run-1",
        "memberResults": [
            {"memberId": name, "status": "COMPLETED", "scorecards": cards}
            for name, cards in members.items()
        ],
    }


def facts(**by_ticker: dict) -> dict:
    return {
        ticker: {"riskScore": 6.0, "overheatScore": 6.0, "finalStatus": "Watch", **overrides}
        for ticker, overrides in by_ticker.items()
    }


class FullPoolCoverageTest(unittest.TestCase):
    def test_a_seat_that_scored_everything_passes(self) -> None:
        assert_full_coverage(
            ("A", "B"),
            frozen(sol=[card("A", 7), card("B", 6)], claude=[card("A", 7), card("B", 6)]),
        )

    def test_a_seat_that_dropped_a_candidate_is_rejected(self) -> None:
        # Silently ranking a shrunken pool is the failure this guard exists for.
        with self.assertRaises(CoverageError):
            assert_full_coverage(
                ("A", "B"),
                frozen(sol=[card("A", 7), card("B", 6)], claude=[card("A", 7)]),
            )

    def test_a_seat_that_invented_a_candidate_is_rejected(self) -> None:
        with self.assertRaises(CoverageError):
            assert_full_coverage(("A",), frozen(sol=[card("A", 7)], claude=[card("A", 7), card("Z", 9)]))

    def test_a_failed_seat_is_not_held_to_coverage(self) -> None:
        payload = frozen(sol=[card("A", 7)])
        payload["memberResults"].append(
            {"memberId": "claude", "status": "FAILED", "scorecards": []}
        )
        assert_full_coverage(("A",), payload)


class BatchingTest(unittest.TestCase):
    def test_batching_partitions_the_pool_exactly_once(self) -> None:
        pool = [{"ticker": f"T{index:03d}"} for index in range(57)]
        groups = batches(pool, 25)
        flattened = [item["ticker"] for group in groups for item in group]
        self.assertEqual(len(groups), 3)
        self.assertEqual(sorted(flattened), sorted(item["ticker"] for item in pool))
        self.assertEqual(len(flattened), len(set(flattened)))

    def test_batching_is_deterministic(self) -> None:
        pool = [{"ticker": f"T{index}"} for index in range(30)]
        self.assertEqual(batches(pool, 7), batches(list(reversed(pool)), 7))

    def test_a_pool_smaller_than_one_batch_is_a_single_group(self) -> None:
        self.assertEqual(len(batches([{"ticker": "A"}], DEFAULT_BATCH_SIZE)), 1)


class DisplaySliceTest(unittest.TestCase):
    def test_top_n_is_a_view_over_a_ranking_it_does_not_change(self) -> None:
        ranking = {"rows": [{"ticker": f"T{i}", "rank": i + 1} for i in range(5)]}
        self.assertEqual(len(display_slice(ranking, 2)), 2)
        # Slicing for display must not disturb what was ranked.
        self.assertEqual(len(ranking["rows"]), 5)

    def test_asking_for_more_rows_than_exist_returns_what_there_is(self) -> None:
        ranking = {"rows": [{"ticker": "A"}]}
        self.assertEqual(len(display_slice(ranking, 20)), 1)


class ExecutionLayerBoundaryTest(unittest.TestCase):
    def test_blue_whale_exposes_no_way_to_ask_a_model_to_decide(self) -> None:
        # Guards the boundary itself: reintroducing a model-invoking entry point
        # here would make the seat a chair again, whatever the diagram says.
        exported = {name for name in dir(blue_whale) if not name.startswith("_")}
        for forbidden in ("run_blue_whale", "prompt_for", "gate_schema", "invoke", "aggregate"):
            self.assertNotIn(forbidden, exported)


if __name__ == "__main__":
    unittest.main()
