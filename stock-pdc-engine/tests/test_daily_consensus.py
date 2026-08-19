"""Consensus, the unresolved-split rule, and what the review round is allowed to move."""

from __future__ import annotations

import unittest

from stock_pdc.config import DEFAULT_WEIGHTS
from stock_pdc.sustainable.arbitration import WEIGHT_KEY, canonical_total
from stock_pdc.sustainable.contracts import DIMENSIONS
from stock_pdc.sustainable.daily.consensus import (
    DEFAULT_TOTAL_DISAGREEMENT_LIMIT,
    build,
    main_reason_for,
    preliminary_top,
    risk_flags_for,
    seat_notes,
)
from stock_pdc.sustainable.daily.orchestrator import merge_rankings


def card(ticker: str, value: float, confidence: float = 0.6, note: str = "n", flags=None) -> dict:
    return {
        "ticker": ticker,
        "dimensions": {name: value for name in DIMENSIONS},
        "confidence": confidence,
        "risk_flags": list(flags or []),
        "decision": "WATCH",
        "note": note,
    }


def facts(*tickers: str) -> dict:
    return {
        ticker: {"riskScore": 7.0, "overheatScore": 7.0, "finalStatus": "Watch"}
        for ticker in tickers
    }


class ConsensusTest(unittest.TestCase):
    def test_the_two_seats_are_weighted_equally_per_dimension(self) -> None:
        ranking = build(
            {"sol": [card("A", 8.0)], "claude": [card("A", 6.0)]}, facts("A"), "post-detail"
        )
        row = ranking["rows"][0]
        self.assertEqual(row["consensusDimensions"]["trend"], 7.0)
        self.assertEqual(row["consensusTotal"], 7.0)

    def test_the_total_uses_the_engine_weights_not_a_model_supplied_one(self) -> None:
        dimensions = {name: 5.0 for name in DIMENSIONS}
        dimensions["trend"] = 10.0
        expected = canonical_total(dimensions)
        self.assertAlmostEqual(
            expected,
            sum(dimensions[name] * DEFAULT_WEIGHTS[WEIGHT_KEY[name]] for name in DIMENSIONS)
            / sum(DEFAULT_WEIGHTS[WEIGHT_KEY[name]] for name in DIMENSIONS),
            places=4,
        )

    def test_both_seat_views_survive_the_merge(self) -> None:
        ranking = build(
            {"sol": [card("A", 9.0)], "claude": [card("A", 3.0)]}, facts("A"), "post-detail"
        )
        row = ranking["rows"][0]
        self.assertEqual(row["seatTotals"]["sol"], 9.0)
        self.assertEqual(row["seatTotals"]["claude"], 3.0)
        self.assertIn("seatDimensions", row)


class UnresolvedTest(unittest.TestCase):
    def test_a_split_wider_than_the_limit_is_marked_unresolved(self) -> None:
        ranking = build(
            {"sol": [card("A", 9.0)], "claude": [card("A", 3.0)]},
            facts("A"),
            "post-review",
            disagreement_limit=1.5,
        )
        self.assertTrue(ranking["rows"][0]["unresolvedDisagreement"])
        self.assertEqual(ranking["unresolvedCount"], 1)

    def test_a_narrow_split_is_not(self) -> None:
        ranking = build(
            {"sol": [card("A", 6.5)], "claude": [card("A", 6.0)]},
            facts("A"),
            "post-review",
            disagreement_limit=1.5,
        )
        self.assertFalse(ranking["rows"][0]["unresolvedDisagreement"])

    def test_the_limit_is_configurable_and_recorded(self) -> None:
        ranking = build(
            {"sol": [card("A", 7.0)], "claude": [card("A", 6.0)]},
            facts("A"),
            "post-review",
            disagreement_limit=0.5,
        )
        self.assertEqual(ranking["disagreementLimit"], 0.5)
        self.assertTrue(ranking["rows"][0]["unresolvedDisagreement"])

    def test_the_default_limit_is_the_documented_one(self) -> None:
        self.assertEqual(DEFAULT_TOTAL_DISAGREEMENT_LIMIT, 1.5)


class PreliminaryTopTest(unittest.TestCase):
    def setUp(self) -> None:
        submissions = {
            "sol": [card(f"T{index:02d}", 9.0 - index * 0.1) for index in range(1, 31)],
            "claude": [card(f"T{index:02d}", 9.0 - index * 0.1) for index in range(1, 31)],
        }
        self.ranking = build(submissions, facts(*[f"T{i:02d}" for i in range(1, 31)]), "post-detail")

    def test_the_finalists_are_a_slice_of_a_ranking_over_the_whole_union(self) -> None:
        finalists = preliminary_top(self.ranking, 20)
        self.assertEqual(len(finalists), 20)
        self.assertEqual(finalists[0], "T01")
        self.assertEqual(self.ranking["poolSize"], 30)

    def test_asking_for_more_finalists_than_exist_returns_what_there_is(self) -> None:
        self.assertEqual(len(preliminary_top(self.ranking, 99)), 30)


class MergeTest(unittest.TestCase):
    def setUp(self) -> None:
        tickers = [f"T{index:02d}" for index in range(1, 6)]
        self.detail = build(
            {
                "sol": [card(t, 9.0 - index) for index, t in enumerate(tickers)],
                "claude": [card(t, 9.0 - index) for index, t in enumerate(tickers)],
            },
            facts(*tickers),
            "post-detail",
        )

    def test_without_a_review_round_the_detail_ranking_stands(self) -> None:
        self.assertIs(merge_rankings(self.detail, None), self.detail)

    def test_a_reviewed_candidate_replaces_its_detail_row(self) -> None:
        review = build(
            {"sol": [card("T01", 1.0)], "claude": [card("T01", 1.0)]},
            facts("T01"),
            "post-review",
        )
        merged = merge_rankings(self.detail, review)
        row = next(item for item in merged["rows"] if item["ticker"] == "T01")
        self.assertEqual(row["consensusTotal"], 1.0)

    def test_a_finalist_that_fell_in_review_really_falls(self) -> None:
        """Re-sorted, not concatenated: the round is allowed to change the order."""
        review = build(
            {"sol": [card("T01", 1.0)], "claude": [card("T01", 1.0)]},
            facts("T01"),
            "post-review",
        )
        merged = merge_rankings(self.detail, review)
        self.assertEqual(merged["rows"][-1]["ticker"], "T01")
        self.assertEqual([row["rank"] for row in merged["rows"]], [1, 2, 3, 4, 5])
        self.assertEqual(merged["reviewedTickers"], ["T01"])


class ReportingHelpersTest(unittest.TestCase):
    def test_the_main_reason_comes_from_the_more_confident_seat(self) -> None:
        notes = seat_notes({
            "sol": [card("A", 7.0, confidence=0.9, note="breakout base is tight")],
            "claude": [card("A", 7.0, confidence=0.4, note="volume is thin")],
        })
        self.assertEqual(main_reason_for("A", notes), "breakout base is tight")

    def test_a_tie_is_broken_deterministically(self) -> None:
        notes = seat_notes({
            "sol": [card("A", 7.0, confidence=0.5, note="sol view")],
            "claude": [card("A", 7.0, confidence=0.5, note="claude view")],
        })
        self.assertEqual(main_reason_for("A", notes), "claude view")

    def test_every_risk_flag_either_seat_raised_survives(self) -> None:
        notes = seat_notes({
            "sol": [card("A", 7.0, flags=["OVERHEATED"])],
            "claude": [card("A", 7.0, flags=["LIQUIDITY_RISK", "OVERHEATED"])],
        })
        self.assertEqual(risk_flags_for("A", notes), ["LIQUIDITY_RISK", "OVERHEATED"])


if __name__ == "__main__":
    unittest.main()
