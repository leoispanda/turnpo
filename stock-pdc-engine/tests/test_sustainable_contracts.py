from __future__ import annotations

import unittest

from stock_pdc.sustainable.contracts import (
    DIMENSIONS,
    ContractError,
    scorecard_schema,
    validate_peer_reviews,
    validate_scorecards,
)


TICKERS = ("600519.SH", "601919.SH")


def raw_card(ticker: str, **overrides: object) -> dict[str, object]:
    card: dict[str, object] = {
        "ticker": ticker,
        "dimensions": {name: 5 for name in DIMENSIONS},
        "confidence": 0.7,
        "risk_flags": ["WEAK_TREND"],
        "decision": "WATCH",
        "note": "trend intact",
    }
    card.update(overrides)
    return card


def payload(*cards: dict[str, object]) -> dict[str, object]:
    return {"scorecards": list(cards)}


class ScorecardCoverageTest(unittest.TestCase):
    def test_a_complete_answer_is_normalized_and_sorted(self) -> None:
        rows = validate_scorecards(
            payload(raw_card("601919.SH"), raw_card("600519.SH")), TICKERS
        )
        self.assertEqual([row["ticker"] for row in rows], ["600519.SH", "601919.SH"])

    def test_a_dropped_candidate_fails_the_round(self) -> None:
        # A short answer would silently change what the committee compares.
        with self.assertRaises(ContractError):
            validate_scorecards(payload(raw_card("600519.SH")), TICKERS)

    def test_an_invented_candidate_is_rejected(self) -> None:
        with self.assertRaises(ContractError):
            validate_scorecards(
                payload(raw_card("600519.SH"), raw_card("601919.SH"), raw_card("000001.SZ")),
                TICKERS,
            )

    def test_a_duplicated_candidate_is_rejected(self) -> None:
        with self.assertRaises(ContractError):
            validate_scorecards(
                payload(raw_card("600519.SH"), raw_card("600519.SH")), TICKERS
            )

    def test_ticker_case_is_normalized_before_comparison(self) -> None:
        rows = validate_scorecards(
            payload(raw_card("600519.sh"), raw_card("601919.sh")), TICKERS
        )
        self.assertEqual([row["ticker"] for row in rows], ["600519.SH", "601919.SH"])


class ScorecardFieldTest(unittest.TestCase):
    def _one(self, **overrides: object) -> None:
        validate_scorecards(payload(raw_card("600519.SH", **overrides)), ("600519.SH",))

    def test_a_missing_dimension_is_rejected(self) -> None:
        partial = {name: 5 for name in DIMENSIONS if name != "risk"}
        with self.assertRaises(ContractError):
            self._one(dimensions=partial)

    def test_an_unknown_dimension_is_rejected(self) -> None:
        extra = {name: 5 for name in DIMENSIONS} | {"vibes": 9}
        with self.assertRaises(ContractError):
            self._one(dimensions=extra)

    def test_a_seat_supplied_total_is_rejected(self) -> None:
        # A seat that returns a total is proposing its own weighting; the
        # canonical total is computed locally from the nine dimensions.
        with self.assertRaises(ContractError):
            self._one(score=8.0)

    def test_an_out_of_range_confidence_is_rejected(self) -> None:
        with self.assertRaises(ContractError):
            self._one(confidence=1.5)

    def test_a_boolean_is_not_accepted_as_a_number(self) -> None:
        # bool is an int subclass in Python; unchecked it would score as 1.
        with self.assertRaises(ContractError):
            self._one(confidence=True)

    def test_an_unknown_decision_is_rejected(self) -> None:
        with self.assertRaises(ContractError):
            self._one(decision="MAYBE")

    def test_an_unknown_risk_flag_is_rejected(self) -> None:
        with self.assertRaises(ContractError):
            self._one(risk_flags=["VIBES_OFF"])

    def test_an_empty_note_is_rejected(self) -> None:
        with self.assertRaises(ContractError):
            self._one(note="   ")

    def test_a_non_object_payload_is_rejected(self) -> None:
        with self.assertRaises(ContractError):
            validate_scorecards(["not", "an", "object"], TICKERS)

    def test_an_empty_scorecard_array_is_rejected(self) -> None:
        with self.assertRaises(ContractError):
            validate_scorecards({"scorecards": []}, TICKERS)


class SchemaShapeTest(unittest.TestCase):
    def test_schema_forbids_extra_properties_at_every_level(self) -> None:
        schema = scorecard_schema(10)
        self.assertFalse(schema["additionalProperties"])
        item = schema["properties"]["scorecards"]["items"]
        self.assertFalse(item["additionalProperties"])
        self.assertFalse(item["properties"]["dimensions"]["additionalProperties"])

    def test_schema_never_asks_a_seat_for_a_total(self) -> None:
        item = scorecard_schema(10)["properties"]["scorecards"]["items"]
        self.assertNotIn("score", item["required"])
        self.assertNotIn("score", item["properties"])
        self.assertIn("note", item["required"])


class PeerReviewTest(unittest.TestCase):
    def _review(self, **overrides: object) -> dict[str, object]:
        review: dict[str, object] = {
            "label": "A",
            "ticker": "600519.SH",
            "agreement": -1.5,
            "challenge": "overheat is understated",
            "author_guess": "OTHER",
        }
        review.update(overrides)
        return review

    def test_a_valid_review_is_normalized(self) -> None:
        rows = validate_peer_reviews({"reviews": [self._review()]}, ("A", "B"))
        self.assertEqual(rows[0]["agreement"], -1.5)
        self.assertEqual(rows[0]["author_guess"], "OTHER")

    def test_a_review_of_an_unknown_label_is_rejected(self) -> None:
        with self.assertRaises(ContractError):
            validate_peer_reviews({"reviews": [self._review(label="Z")]}, ("A", "B"))

    def test_an_unknown_author_guess_is_rejected(self) -> None:
        with self.assertRaises(ContractError):
            validate_peer_reviews({"reviews": [self._review(author_guess="PROBABLY")]}, ("A",))

    def test_a_duplicate_label_ticker_pair_is_rejected(self) -> None:
        with self.assertRaises(ContractError):
            validate_peer_reviews({"reviews": [self._review(), self._review()]}, ("A",))

    def test_agreement_may_be_negative_but_stays_bounded(self) -> None:
        validate_peer_reviews({"reviews": [self._review(agreement=-10)]}, ("A",))
        with self.assertRaises(ContractError):
            validate_peer_reviews({"reviews": [self._review(agreement=-11)]}, ("A",))


if __name__ == "__main__":
    unittest.main()
