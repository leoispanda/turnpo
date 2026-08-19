"""The three daily rounds, driven by fake seats: budget, union, coverage, blindness."""

from __future__ import annotations

import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from stock_pdc.models import Bar
from stock_pdc.sustainable.contracts import DIMENSIONS
from stock_pdc.sustainable.daily import detail, discovery, facts, review
from stock_pdc.sustainable.daily.quota import (
    MAX_CALLS_PER_MEMBER,
    QuotaExceeded,
    QuotaLedger,
    guarded_invoke,
)
from stock_pdc.sustainable.roster import DEFAULT_ROSTER
from stock_pdc.sustainable.runner import RunnerOutcome


def bars(seed: int = 0) -> list[Bar]:
    made: list[Bar] = []
    price = 10.0 + seed
    for index in range(240):
        price = round(price + 0.01 + (index % 5) * 0.001, 4)
        made.append(
            Bar(
                date=f"2026-{1 + index // 28:02d}-{1 + index % 28:02d}",
                open=price - 0.05,
                high=price + 0.06,
                low=price - 0.08,
                close=price,
                volume=1_000_000,
            )
        )
    return made


def table(count: int = 8) -> dict:
    records = [
        facts.build_record(
            f"{600000 + index}.SH",
            bars(index),
            {
                "latest_date": "2026-08-17",
                "turnover_amount": 900_000_000.0,
                "turnover_rate": 1.1,
                "total_mcap": 400_000_000_000.0,
            },
            {"trend_signal": "above 50d SMA"},
        )
        for index in range(count)
    ]
    return facts.build_table(records, "2026-08-17", "daily-test")


def outcome(payload: dict | None, ok: bool = True, error: str = "") -> RunnerOutcome:
    return RunnerOutcome(ok, payload, ["fake"], 0 if ok else 1, error, "")


class FakeSeats:
    """Answers whatever round it is handed, and remembers every prompt."""

    def __init__(self, *, detail_limit: int | None = None, fail: set[str] | None = None) -> None:
        self.detail_limit = detail_limit
        self.fail = fail or set()
        self.calls: list[dict] = []

    def __call__(self, member, workspace, prompt, schema, payload, timeout_seconds=0):
        stage = payload["stageId"]
        self.calls.append(
            {"member": member.member_id, "stage": stage, "prompt": prompt, "payload": payload}
        )
        if f"{member.member_id}:{stage}" in self.fail or stage in self.fail:
            return outcome(None, ok=False, error="fake failure")
        tickers = list(payload["tickers"])
        if stage == discovery.DISCOVERY_STAGE_ID:
            chosen = tickers[: payload["picksRequested"]]
            return outcome({
                "picks": [
                    {
                        "ticker": ticker,
                        "rank": index,
                        "lightweight_score": 9.0 - index * 0.1,
                        "reason_codes": ["TREND_STACK"],
                    }
                    for index, ticker in enumerate(chosen, start=1)
                ]
            })
        if stage == detail.DETAIL_STAGE_ID:
            served = tickers if self.detail_limit is None else tickers[: self.detail_limit]
            return outcome({
                "scorecards": [
                    {
                        "ticker": ticker,
                        "dimensions": {name: 6.0 for name in DIMENSIONS},
                        "confidence": 0.7,
                        "risk_flags": [],
                        "decision": "WATCH",
                        "note": "fake",
                    }
                    for ticker in served
                ]
            })
        if stage == review.REVIEW_STAGE_ID:
            return outcome({
                "assessments": [
                    {"ticker": ticker, "confidence": 0.8, "challenge": "c", "revisions": []}
                    for ticker in tickers
                ]
            })
        raise AssertionError(f"unexpected stage {stage}")


class QuotaTest(unittest.TestCase):
    def test_the_daily_budget_is_four_calls_per_model(self) -> None:
        self.assertEqual(MAX_CALLS_PER_MEMBER, 4)

    def test_a_round_that_exceeds_its_budget_raises_instead_of_skipping(self) -> None:
        ledger = QuotaLedger()
        seats = FakeSeats()
        member = DEFAULT_ROSTER[0]
        with TemporaryDirectory() as tmp:
            payload = discovery.build_payload(table(4), "daily-test", 2)
            guarded_invoke(
                ledger, "discovery", member, Path(tmp), "p",
                discovery.discovery_schema(2), payload, invoker=seats,
            )
            with self.assertRaises(QuotaExceeded):
                guarded_invoke(
                    ledger, "discovery", member, Path(tmp), "p",
                    discovery.discovery_schema(2), payload, invoker=seats,
                )

    def test_every_call_is_recorded_with_its_size_and_duration(self) -> None:
        ledger = QuotaLedger()
        seats = FakeSeats()
        with TemporaryDirectory() as tmp:
            payload = discovery.build_payload(table(4), "daily-test", 2)
            guarded_invoke(
                ledger, "discovery", DEFAULT_ROSTER[0], Path(tmp), "prompt-text",
                discovery.discovery_schema(2), payload, invoker=seats,
            )
        recorded = ledger.to_json()
        self.assertEqual(recorded["totalCalls"], 1)
        entry = recorded["byMember"][DEFAULT_ROSTER[0].member_id]
        self.assertEqual(entry["promptChars"], len("prompt-text"))
        self.assertGreater(entry["outputChars"], 0)
        self.assertEqual(entry["remaining"], 3)


class DiscoveryRoundTest(unittest.TestCase):
    def setUp(self) -> None:
        self.table = table(8)
        self.payload = discovery.build_payload(self.table, "daily-test", 5)

    def _run(self, seats: FakeSeats, ledger: QuotaLedger) -> dict:
        with TemporaryDirectory() as tmp:
            return discovery.run_discovery(
                DEFAULT_ROSTER, Path(tmp), self.payload, ledger, 10, seats
            )

    def test_each_seat_spends_exactly_one_call(self) -> None:
        ledger = QuotaLedger()
        self._run(FakeSeats(), ledger)
        for member in DEFAULT_ROSTER:
            self.assertEqual(ledger.calls(member.member_id), 1)

    def test_the_union_is_every_name_either_seat_nominated(self) -> None:
        record = self._run(FakeSeats(), QuotaLedger())
        self.assertTrue(record["quorumMet"])
        self.assertEqual(len(discovery.union_of(record)), 5)

    def test_a_seat_that_fails_breaks_the_quorum(self) -> None:
        record = self._run(FakeSeats(fail={"sol:D1"}), QuotaLedger())
        self.assertFalse(record["quorumMet"])
        self.assertEqual(record["failedMembers"][0]["memberId"], "sol")

    def test_a_short_list_of_the_wrong_length_fails_the_seat(self) -> None:
        class Truncating(FakeSeats):
            def __call__(self, member, workspace, prompt, schema, payload, timeout_seconds=0):
                result = super().__call__(member, workspace, prompt, schema, payload, timeout_seconds)
                if payload["stageId"] == discovery.DISCOVERY_STAGE_ID:
                    return outcome({"picks": result.output["picks"][:-1]})
                return result

        record = self._run(Truncating(), QuotaLedger())
        self.assertFalse(record["quorumMet"])
        self.assertIn("提名数量", record["memberResults"][0]["failureReason"])

    def test_the_union_is_capped(self) -> None:
        record = self._run(FakeSeats(), QuotaLedger())
        with self.assertRaises(Exception):
            discovery.union_of(record, cap=1)

    def test_the_nomination_index_records_who_nominated_what(self) -> None:
        index = discovery.nomination_index(self._run(FakeSeats(), QuotaLedger()))
        first = index[self.table["tickers"][0]]
        self.assertTrue(first["bothSeats"])
        self.assertEqual(sorted(first["nominatedBy"]), ["claude", "sol"])


class DetailRoundTest(unittest.TestCase):
    def setUp(self) -> None:
        self.table = table(6)

    def _run(self, seats: FakeSeats, ledger: QuotaLedger) -> dict:
        with TemporaryDirectory() as tmp:
            return detail.run_detail(
                DEFAULT_ROSTER, Path(tmp), self.table, "daily-test", ledger, 10, seats
            )

    def test_a_complete_answer_costs_one_call(self) -> None:
        ledger = QuotaLedger()
        record = self._run(FakeSeats(), ledger)
        self.assertTrue(record["quorumMet"])
        for member in DEFAULT_ROSTER:
            self.assertEqual(ledger.calls(member.member_id), 1)

    def test_a_truncated_answer_re_asks_only_for_what_is_missing(self) -> None:
        seats = FakeSeats(detail_limit=4)
        ledger = QuotaLedger()
        record = self._run(seats, ledger)
        self.assertTrue(record["quorumMet"])
        second = [
            call for call in seats.calls
            if call["stage"] == detail.DETAIL_STAGE_ID and call["member"] == "sol"
        ][1]
        self.assertEqual(len(second["payload"]["tickers"]), 2)
        self.assertEqual(ledger.calls("sol"), 2)

    def test_the_round_never_costs_more_than_two_calls_per_seat(self) -> None:
        ledger = QuotaLedger()
        record = self._run(FakeSeats(detail_limit=1), ledger)
        self.assertFalse(record["quorumMet"])
        for member in DEFAULT_ROSTER:
            self.assertEqual(ledger.calls(member.member_id), 2)

    def test_an_incomplete_seat_is_a_failure_not_a_partial_pool(self) -> None:
        record = self._run(FakeSeats(detail_limit=1), QuotaLedger())
        self.assertEqual(record["memberResults"][0]["status"], "FAILED")
        self.assertEqual(record["submissions"], {})

    def test_both_seats_must_cover_exactly_the_same_names(self) -> None:
        record = self._run(FakeSeats(), QuotaLedger())
        detail.assert_identical_coverage(record)
        record["submissions"]["sol"] = record["submissions"]["sol"][:-1]
        with self.assertRaises(Exception):
            detail.assert_identical_coverage(record)


class ReviewRoundTest(unittest.TestCase):
    def setUp(self) -> None:
        self.table = table(4)
        self.cards = {
            member.member_id: [
                {
                    "ticker": ticker,
                    "dimensions": {name: 6.0 for name in DIMENSIONS},
                    "confidence": 0.7,
                    "risk_flags": [],
                    "decision": "WATCH",
                    "note": "fake",
                }
                for ticker in self.table["tickers"]
            ]
            for member in DEFAULT_ROSTER
        }

    def _run(self, seats: FakeSeats, ledger: QuotaLedger) -> dict:
        with TemporaryDirectory() as tmp:
            return review.run_review(
                DEFAULT_ROSTER, Path(tmp), self.table, self.cards, "daily-test", ledger, 10, seats
            )

    def test_each_seat_spends_exactly_one_call(self) -> None:
        ledger = QuotaLedger()
        record = self._run(FakeSeats(), ledger)
        self.assertTrue(record["quorumMet"])
        for member in DEFAULT_ROSTER:
            self.assertEqual(ledger.calls(member.member_id), 1)

    def test_a_seat_never_learns_who_wrote_the_other_scores(self) -> None:
        import re

        seats = FakeSeats()
        self._run(seats, QuotaLedger())
        for call in seats.calls:
            text = json.dumps(call["payload"], ensure_ascii=False) + call["prompt"]
            for member in DEFAULT_ROSTER:
                pattern = rf"(?<![0-9A-Za-z]){re.escape(member.member_id)}(?![0-9A-Za-z])"
                self.assertIsNone(
                    re.search(pattern, text, re.IGNORECASE),
                    msg=f"{member.member_id} 出现在了席位可见的文本里",
                )

    def test_each_seat_sees_its_own_scores_beside_one_anonymous_peer(self) -> None:
        seats = FakeSeats()
        self._run(seats, QuotaLedger())
        comparison = seats.calls[0]["payload"]["comparisons"][0]
        self.assertIn("yourScores", comparison)
        self.assertIn("reviewerScores", comparison)
        self.assertEqual(len(comparison["reviewerLabel"]), 1)

    def test_the_authorship_ledger_never_enters_a_payload(self) -> None:
        seats = FakeSeats()
        record = self._run(seats, QuotaLedger())
        self.assertIn("labelByMember", record["ledger"])
        for call in seats.calls:
            self.assertNotIn("labelByMember", json.dumps(call["payload"], ensure_ascii=False))

    def test_a_failed_review_breaks_the_quorum_and_leaves_round_two_standing(self) -> None:
        record = self._run(FakeSeats(fail={"D3"}), QuotaLedger())
        self.assertFalse(record["quorumMet"])
        self.assertEqual(record["finalScores"], {})

    def test_a_cited_revision_moves_only_that_dimension(self) -> None:
        cards = self.cards["sol"]
        assessments = [
            {
                "ticker": cards[0]["ticker"],
                "confidence": 0.9,
                "challenge": "c",
                "revisions": [
                    {
                        "dimension": "trend",
                        "from_score": 6.0,
                        "to_score": 8.0,
                        "fact_ids": [f"{cards[0]['ticker']}.rsi14"],
                        "note": "",
                    }
                ],
            }
        ]
        revised = review.apply_assessments(cards, assessments)
        moved = next(card for card in revised if card["ticker"] == cards[0]["ticker"])
        self.assertEqual(moved["dimensions"]["trend"], 8.0)
        self.assertEqual(moved["dimensions"]["risk"], 6.0)
        self.assertEqual(moved["reviewConfidence"], 0.9)


if __name__ == "__main__":
    unittest.main()
