"""Rules the daily contracts must not drift from."""

from __future__ import annotations

import unittest

from stock_pdc.sustainable.contracts import DIMENSIONS
from stock_pdc.sustainable.daily.contracts import (
    DISCOVERY_PICKS,
    REASON_CODES,
    ContractError,
    detail_schema,
    discovery_schema,
    review_schema,
    validate_assessments,
    validate_picks,
    validate_scorecard_subset,
)


def pick(ticker: str, rank: int, score: float = 7.0, codes: list[str] | None = None) -> dict:
    return {
        "ticker": ticker,
        "rank": rank,
        "lightweight_score": score,
        "reason_codes": codes or ["TREND_STACK"],
    }


def card(ticker: str, **dims: float) -> dict:
    values = {name: 5.0 for name in DIMENSIONS}
    values.update(dims)
    return {
        "ticker": ticker,
        "dimensions": values,
        "confidence": 0.6,
        "risk_flags": [],
        "decision": "WATCH",
        "note": "n",
    }


def assessment(ticker: str, revisions: list[dict] | None = None, confidence: float = 0.7) -> dict:
    return {
        "ticker": ticker,
        "confidence": confidence,
        "challenge": "c",
        "revisions": revisions or [],
    }


class StrictSchemaTest(unittest.TestCase):
    """Structured output rejects a schema whose `required` misses a property."""

    def _assert_required_covers_properties(self, schema: dict) -> None:
        if schema.get("type") == "object" and "properties" in schema:
            self.assertEqual(
                set(schema.get("required", [])),
                set(schema["properties"]),
                msg=f"required 未覆盖全部 properties: {sorted(schema['properties'])}",
            )
        for value in schema.get("properties", {}).values():
            self._assert_required_covers_properties(value)
        if "items" in schema:
            self._assert_required_covers_properties(schema["items"])

    def test_every_daily_schema_lists_all_keys_as_required(self) -> None:
        for schema in (discovery_schema(30), detail_schema(60), review_schema(20)):
            self._assert_required_covers_properties(schema)

    def test_discovery_schema_bounds_rank_to_the_list_length(self) -> None:
        schema = discovery_schema(30)
        rank = schema["properties"]["picks"]["items"]["properties"]["rank"]
        self.assertEqual(rank["maximum"], 30)

    def test_detail_schema_is_the_committee_scorecard(self) -> None:
        from stock_pdc.sustainable.contracts import scorecard_schema

        self.assertEqual(detail_schema(12), scorecard_schema(12))


class DiscoveryPickTest(unittest.TestCase):
    def test_a_valid_short_list_is_returned_in_rank_order(self) -> None:
        picks = validate_picks(
            {"picks": [pick("B", 2), pick("A", 1)]}, ("A", "B", "C"), 2
        )
        self.assertEqual([item["ticker"] for item in picks], ["A", "B"])

    def test_a_short_list_of_the_wrong_length_is_rejected(self) -> None:
        with self.assertRaises(ContractError):
            validate_picks({"picks": [pick("A", 1)]}, ("A", "B"), 2)

    def test_a_ticker_that_was_never_offered_is_rejected(self) -> None:
        with self.assertRaises(ContractError):
            validate_picks({"picks": [pick("A", 1), pick("ZZZZ", 2)]}, ("A", "B"), 2)

    def test_duplicate_ranks_are_rejected(self) -> None:
        with self.assertRaises(ContractError):
            validate_picks({"picks": [pick("A", 1), pick("B", 1)]}, ("A", "B"), 2)

    def test_duplicate_tickers_are_rejected(self) -> None:
        with self.assertRaises(ContractError):
            validate_picks({"picks": [pick("A", 1), pick("A", 2)]}, ("A", "B"), 2)

    def test_an_unknown_reason_code_is_rejected(self) -> None:
        with self.assertRaises(ContractError):
            validate_picks(
                {"picks": [pick("A", 1, codes=["BECAUSE_I_LIKE_IT"])]}, ("A",), 1
            )

    def test_reason_codes_are_a_closed_vocabulary(self) -> None:
        self.assertIn("TREND_STACK", REASON_CODES)
        self.assertEqual(len(set(REASON_CODES)), len(REASON_CODES))

    def test_thirty_is_the_committee_default(self) -> None:
        self.assertEqual(DISCOVERY_PICKS, 30)


class DetailSubsetTest(unittest.TestCase):
    def test_a_partial_answer_is_accepted_so_the_gap_can_be_re_asked(self) -> None:
        cards = validate_scorecard_subset({"scorecards": [card("A")]}, ("A", "B", "C"))
        self.assertEqual([item["ticker"] for item in cards], ["A"])

    def test_a_candidate_outside_the_round_is_still_rejected(self) -> None:
        with self.assertRaises(ContractError):
            validate_scorecard_subset({"scorecards": [card("D")]}, ("A", "B"))

    def test_a_seat_supplied_total_is_still_rejected(self) -> None:
        payload = {"scorecards": [{**card("A"), "score": 8.0}]}
        with self.assertRaises(ContractError):
            validate_scorecard_subset(payload, ("A",))

    def test_a_duplicate_scorecard_is_rejected(self) -> None:
        with self.assertRaises(ContractError):
            validate_scorecard_subset({"scorecards": [card("A"), card("A")]}, ("A",))


class ReviewAssessmentTest(unittest.TestCase):
    def setUp(self) -> None:
        self.own = {"A": card("A", trend=5.0), "B": card("B")}
        self.fact_ids = {"A": {"A.rsi14", "A.atr_pct"}, "B": {"B.rsi14"}}

    def test_an_empty_revision_list_is_a_complete_answer(self) -> None:
        result = validate_assessments(
            {"assessments": [assessment("A"), assessment("B")]},
            ("A", "B"),
            self.own,
            self.fact_ids,
        )
        self.assertEqual([item["revisions"] for item in result], [[], []])

    def test_a_revision_must_cite_a_fact_id_that_exists(self) -> None:
        revision = {
            "dimension": "trend",
            "from_score": 5.0,
            "to_score": 7.0,
            "fact_ids": ["A.made_up"],
            "note": "",
        }
        with self.assertRaises(ContractError):
            validate_assessments(
                {"assessments": [assessment("A", [revision]), assessment("B")]},
                ("A", "B"),
                self.own,
                self.fact_ids,
            )

    def test_a_cited_revision_is_accepted(self) -> None:
        revision = {
            "dimension": "trend",
            "from_score": 5.0,
            "to_score": 7.0,
            "fact_ids": ["A.rsi14"],
            "note": "",
        }
        result = validate_assessments(
            {"assessments": [assessment("A", [revision]), assessment("B")]},
            ("A", "B"),
            self.own,
            self.fact_ids,
        )
        self.assertEqual(result[0]["revisions"][0]["to_score"], 7.0)

    def test_from_score_must_match_the_detail_round(self) -> None:
        revision = {
            "dimension": "trend",
            "from_score": 9.0,
            "to_score": 7.0,
            "fact_ids": ["A.rsi14"],
            "note": "",
        }
        with self.assertRaises(ContractError):
            validate_assessments(
                {"assessments": [assessment("A", [revision]), assessment("B")]},
                ("A", "B"),
                self.own,
                self.fact_ids,
            )

    def test_a_revision_that_changes_nothing_is_rejected(self) -> None:
        revision = {
            "dimension": "trend",
            "from_score": 5.0,
            "to_score": 5.0,
            "fact_ids": ["A.rsi14"],
            "note": "",
        }
        with self.assertRaises(ContractError):
            validate_assessments(
                {"assessments": [assessment("A", [revision]), assessment("B")]},
                ("A", "B"),
                self.own,
                self.fact_ids,
            )

    def test_coverage_of_the_finalists_is_exact(self) -> None:
        with self.assertRaises(ContractError):
            validate_assessments(
                {"assessments": [assessment("A")]}, ("A", "B"), self.own, self.fact_ids
            )

    def test_a_candidate_outside_the_finalists_is_rejected(self) -> None:
        with self.assertRaises(ContractError):
            validate_assessments(
                {"assessments": [assessment("A"), assessment("Z")]},
                ("A", "B"),
                self.own,
                self.fact_ids,
            )

    def test_confidence_must_be_a_probability(self) -> None:
        with self.assertRaises(ContractError):
            validate_assessments(
                {"assessments": [assessment("A", confidence=1.4), assessment("B")]},
                ("A", "B"),
                self.own,
                self.fact_ids,
            )


if __name__ == "__main__":
    unittest.main()
