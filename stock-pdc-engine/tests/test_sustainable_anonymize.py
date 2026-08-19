from __future__ import annotations

import json
import unittest

from stock_pdc.sustainable.anonymize import (
    AnonymizationError,
    assert_packet_is_blind,
    assign_labels,
    build_peer_packet,
    self_recognition_report,
)
from stock_pdc.sustainable.contracts import DIMENSIONS


def card(ticker: str, score: float, rationale: str) -> dict[str, object]:
    return {
        "ticker": ticker,
        "dimensions": {name: 5.0 for name in DIMENSIONS},
        "score": score,
        "confidence": 0.7,
        "risk_flags": ["WEAK_TREND"],
        "decision": "WATCH",
        "note": rationale,
    }


SUBMISSIONS = {
    "sol": [
        card("600519.SH", 7.0, "trend holds above the 55-day line"),
        card("601919.SH", 6.0, "volume confirms the breakout"),
    ],
    "claude": [
        card("600519.SH", 5.0, "extended from the mean, waiting for a pullback"),
        card("601919.SH", 8.0, "base is tight and risk is contained"),
    ],
}


class LabelAssignmentTest(unittest.TestCase):
    def test_each_member_gets_one_distinct_label(self) -> None:
        labels = assign_labels("run-1", "03", SUBMISSIONS)
        self.assertEqual(set(labels), {"sol", "claude"})
        self.assertEqual(len(set(labels.values())), 2)

    def test_assignment_is_reproducible_for_audit(self) -> None:
        self.assertEqual(
            assign_labels("run-1", "03", SUBMISSIONS),
            assign_labels("run-1", "03", SUBMISSIONS),
        )

    def test_different_runs_do_not_share_one_fixed_assignment(self) -> None:
        # A label that always means the same seat would be learnable over time.
        assignments = {
            tuple(sorted(assign_labels(f"run-{index}", "03", SUBMISSIONS).items()))
            for index in range(40)
        }
        self.assertGreater(len(assignments), 1)

    def test_a_single_submission_cannot_be_peer_reviewed(self) -> None:
        with self.assertRaises(AnonymizationError):
            assign_labels("run-1", "03", {"sol": SUBMISSIONS["sol"]})


class PeerPacketTest(unittest.TestCase):
    def setUp(self) -> None:
        self.packet, self.ledger = build_peer_packet("run-1", "03", SUBMISSIONS)

    def test_packet_carries_every_card(self) -> None:
        self.assertEqual(len(self.packet["cards"]), 4)

    def test_packet_never_names_an_author(self) -> None:
        assert_packet_is_blind(self.packet, ("sol", "claude"))
        serialized = json.dumps(self.packet, ensure_ascii=False)
        self.assertNotIn("memberId", serialized)
        self.assertNotIn("labelByMember", serialized)

    def test_blindness_check_catches_a_leaked_author(self) -> None:
        leaky = dict(self.packet)
        leaky["cards"] = [{**self.packet["cards"][0], "author": "claude"}]
        with self.assertRaises(AnonymizationError):
            assert_packet_is_blind(leaky, ("sol", "claude"))

    def test_a_seat_naming_itself_in_its_rationale_is_caught(self) -> None:
        # The most direct way anonymity dies: the model signs its own work.
        confessing = {
            "sol": [card("600519.SH", 7.0, "As Sol, I read the trend as intact.")],
            "claude": [card("600519.SH", 5.0, "the base is tight")],
        }
        packet, _ = build_peer_packet("run-1", "03", confessing)
        with self.assertRaises(AnonymizationError):
            assert_packet_is_blind(packet, ("sol", "claude"))

    def test_ordinary_prose_containing_a_member_name_does_not_false_positive(self) -> None:
        # "solid" and "console" contain "sol"; a substring rule would cry wolf
        # on every run until the guard stopped being trusted.
        innocent = {
            "sol": [card("600519.SH", 7.0, "a solid base, console-style consolidation")],
            "claude": [card("600519.SH", 5.0, "volume is unconvincing")],
        }
        packet, _ = build_peer_packet("run-1", "03", innocent)
        assert_packet_is_blind(packet, ("sol", "claude"))

    def test_cards_are_ordered_by_content_not_by_author(self) -> None:
        # Author-grouped ordering would identify authorship despite the labels.
        tickers = [item["ticker"] for item in self.packet["cards"]]
        self.assertEqual(tickers, sorted(tickers))
        first_ticker = [item for item in self.packet["cards"] if item["ticker"] == "600519.SH"]
        self.assertEqual(len(first_ticker), 2)
        self.assertNotEqual(first_ticker[0]["label"], first_ticker[1]["label"])

    def test_unexpected_input_fields_do_not_reach_the_packet(self) -> None:
        tagged = {
            "sol": [{**card("600519.SH", 7.0, "x"), "writtenBy": "sol"}],
            "claude": [card("600519.SH", 5.0, "y")],
        }
        packet, _ = build_peer_packet("run-1", "03", tagged)
        self.assertNotIn("writtenBy", json.dumps(packet))

    def test_ledger_holds_the_mapping_in_both_directions(self) -> None:
        self.assertEqual(set(self.ledger["labelByMember"]), {"sol", "claude"})
        for member, label in self.ledger["labelByMember"].items():
            self.assertEqual(self.ledger["memberByLabel"][label], member)


class SelfRecognitionTest(unittest.TestCase):
    def setUp(self) -> None:
        _, self.ledger = build_peer_packet("run-1", "03", SUBMISSIONS)
        self.sol_label = self.ledger["labelByMember"]["sol"]
        self.other_label = self.ledger["labelByMember"]["claude"]

    def _review(self, label: str, ticker: str, agreement: float, guess: str) -> dict[str, object]:
        return {
            "label": label,
            "ticker": ticker,
            "agreement": agreement,
            "challenge": "reason",
            "author_guess": guess,
        }

    def test_perfect_recognition_is_reported_as_one(self) -> None:
        reviews = {
            "sol": [
                self._review(self.sol_label, "600519.SH", 0.0, "SELF"),
                self._review(self.other_label, "600519.SH", -1.0, "OTHER"),
            ]
        }
        report = self_recognition_report(reviews, self.ledger)
        self.assertEqual(report["members"][0]["selfRecognitionRate"], 1.0)

    def test_missing_its_own_card_lowers_the_rate(self) -> None:
        reviews = {
            "sol": [
                self._review(self.sol_label, "600519.SH", 0.0, "UNSURE"),
                self._review(self.other_label, "600519.SH", -1.0, "OTHER"),
            ]
        }
        report = self_recognition_report(reviews, self.ledger)
        self.assertEqual(report["members"][0]["selfRecognitionRate"], 0.0)

    def test_favouring_the_card_it_believes_is_its_own_shows_a_positive_delta(self) -> None:
        reviews = {
            "sol": [
                self._review(self.sol_label, "600519.SH", 2.0, "SELF"),
                self._review(self.other_label, "600519.SH", -2.0, "OTHER"),
            ]
        }
        report = self_recognition_report(reviews, self.ledger)
        self.assertEqual(report["members"][0]["selfPreferenceDelta"], 4.0)

    def test_delta_is_absent_when_there_is_nothing_to_compare(self) -> None:
        reviews = {"sol": [self._review(self.sol_label, "600519.SH", 2.0, "SELF")]}
        report = self_recognition_report(reviews, self.ledger)
        self.assertIsNone(report["members"][0]["selfPreferenceDelta"])


if __name__ == "__main__":
    unittest.main()
