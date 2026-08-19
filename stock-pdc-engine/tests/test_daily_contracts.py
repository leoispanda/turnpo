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


def revision(dimension: str = "trend", to: float = 7.0, refs=None, legacy=None) -> dict:
    item = {
        "dimension": dimension,
        "from_score": 5.0,
        "to_score": to,
        "note": "",
    }
    if legacy is not None:
        item["fact_ids"] = legacy
    else:
        item["fact_refs"] = refs if refs is not None else [{"ticker": "A", "field": "rsi14"}]
    return item


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
        for schema in (discovery_schema(30), detail_schema(60), review_schema(("A", "B"), 20)):
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
        self.own = {"A": card("A", trend=5.0), "B": card("B", trend=5.0)}
        # Field names, not dotted ids: a citation names a candidate and a field
        # separately so neither can be misspelled into the other.
        self.fact_index = {"A": {"rsi14", "atr_pct"}, "B": {"rsi14"}}

    def _validate(self, *assessments):
        return validate_assessments(
            {"assessments": list(assessments)}, ("A", "B"), self.own, self.fact_index
        )

    def test_an_empty_revision_list_is_a_complete_answer(self) -> None:
        result = self._validate(assessment("A"), assessment("B"))
        self.assertEqual([item["revisions"] for item in result], [[], []])

    def test_a_cited_revision_is_accepted(self) -> None:
        result = self._validate(assessment("A", [revision()]), assessment("B"))
        self.assertEqual(result[0]["revisions"][0]["to_score"], 7.0)

    def test_a_citation_is_recorded_in_its_fully_qualified_form(self) -> None:
        result = self._validate(assessment("A", [revision()]), assessment("B"))
        self.assertEqual(result[0]["revisions"][0]["fact_ids"], ["A.rsi14"])

    def test_a_revision_must_cite_a_fact_that_exists(self) -> None:
        bad = revision(refs=[{"ticker": "A", "field": "made_up"}])
        with self.assertRaises(ContractError):
            self._validate(assessment("A", [bad]), assessment("B"))

    def test_a_field_the_candidate_has_no_value_for_is_rejected(self) -> None:
        """B has no ATR in this run, so B.atr_pct is not evidence."""
        bad = revision(refs=[{"ticker": "B", "field": "atr_pct"}])
        with self.assertRaises(ContractError):
            self._validate(assessment("A", [bad]), assessment("B"))

    def test_from_score_must_match_the_detail_round(self) -> None:
        stale = {**revision(), "from_score": 9.0}
        with self.assertRaises(ContractError):
            self._validate(assessment("A", [stale]), assessment("B"))

    def test_a_revision_that_changes_nothing_is_rejected(self) -> None:
        with self.assertRaises(ContractError):
            self._validate(assessment("A", [revision(to=5.0)]), assessment("B"))

    def test_coverage_of_the_finalists_is_exact(self) -> None:
        with self.assertRaises(ContractError):
            self._validate(assessment("A"))

    def test_a_candidate_outside_the_finalists_is_rejected(self) -> None:
        with self.assertRaises(ContractError):
            self._validate(assessment("A"), assessment("Z"))

    def test_confidence_must_be_a_probability(self) -> None:
        with self.assertRaises(ContractError):
            self._validate(assessment("A", confidence=1.4), assessment("B"))


class RealRunRegressionTest(unittest.TestCase):
    """The two ways the first real Round 3 died, on 2026-08-19."""

    def setUp(self) -> None:
        self.own = {"A": card("A", trend=5.0, risk=5.0), "B": card("B", trend=5.0)}
        self.fact_index = {"A": {"rsi14", "atr_pct"}, "B": {"rsi14", "atr_pct"}}

    def _validate(self, *assessments):
        return validate_assessments(
            {"assessments": list(assessments)}, ("A", "B"), self.own, self.fact_index
        )

    def test_a_comparison_against_another_finalist_is_evidence_not_an_error(self) -> None:
        """Claude cited a peer's ATR while revising this candidate's risk.

        Both numbers were in the packet it was handed, and comparing them is the
        reasoning a cross-sectional round is supposed to produce. Rejecting it
        threw away the round.
        """
        comparative = revision(
            dimension="risk",
            refs=[{"ticker": "A", "field": "atr_pct"}, {"ticker": "B", "field": "atr_pct"}],
        )
        result = self._validate(assessment("A", [comparative]), assessment("B"))
        stored = result[0]["revisions"][0]
        self.assertEqual(stored["fact_ids"], ["A.atr_pct", "B.atr_pct"])
        self.assertEqual(stored["cross_ticker_refs"], ["B.atr_pct"])

    def test_the_ticker_enum_makes_a_mistyped_exchange_suffix_unrepresentable(self) -> None:
        """Sol wrote 600968.SZ for 600968.SH and lost 25 valid revisions with it."""
        schema = review_schema(("600968.SH", "000651.SZ"), 20)
        enum = (
            schema["properties"]["assessments"]["items"]["properties"]["revisions"]
            ["items"]["properties"]["fact_refs"]["items"]["properties"]["ticker"]["enum"]
        )
        self.assertEqual(enum, ["600968.SH", "000651.SZ"])
        self.assertNotIn("600968.SZ", enum)

    def test_a_mistyped_suffix_is_still_rejected_if_a_seat_ignores_the_schema(self) -> None:
        bad = revision(legacy=["A.rsi14", "AA.rsi14"])
        with self.assertRaises(ContractError):
            self._validate(assessment("A", [bad]), assessment("B"))

    def test_a_seat_that_ignores_the_schema_still_has_its_dotted_ids_read(self) -> None:
        result = self._validate(
            assessment("A", [revision(legacy=["A.rsi14"])]), assessment("B")
        )
        self.assertEqual(
            result[0]["revisions"][0]["fact_refs"], [{"ticker": "A", "field": "rsi14"}]
        )

    def test_a_bare_field_name_resolves_to_the_candidate_being_revised(self) -> None:
        result = self._validate(
            assessment("A", [revision(legacy=["rsi14"])]), assessment("B")
        )
        self.assertEqual(result[0]["revisions"][0]["fact_ids"], ["A.rsi14"])

    def test_a_revision_with_no_citation_at_all_is_rejected(self) -> None:
        naked = {"dimension": "trend", "from_score": 5.0, "to_score": 7.0, "note": ""}
        with self.assertRaises(ContractError):
            self._validate(assessment("A", [naked]), assessment("B"))


if __name__ == "__main__":
    unittest.main()
