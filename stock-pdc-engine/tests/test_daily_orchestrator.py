"""One DAILY_TOP10 day, end to end, on fake seats: budget, degradation, boundaries."""

from __future__ import annotations

import json
import unittest
from datetime import date
from pathlib import Path
from tempfile import TemporaryDirectory

from stock_pdc.models import Bar
from stock_pdc.sustainable.contracts import DIMENSIONS
from stock_pdc.sustainable.daily import detail, discovery, facts, review
from stock_pdc.sustainable.daily.orchestrator import (
    DEGRADATION_NONE,
    DEGRADATION_R1_FAILED,
    DEGRADATION_R2_FAILED,
    DEGRADATION_R3_FAILED,
    DEGRADATION_R3_SKIPPED,
    DailyConfig,
    run_daily,
)
from stock_pdc.sustainable.daily.quota import MAX_CALLS_PER_MEMBER, QuotaLedger
from stock_pdc.sustainable.daily.sources import DailyInputs
from stock_pdc.sustainable.roster import DEFAULT_ROSTER
from stock_pdc.sustainable.runner import RunnerOutcome


ANALYSIS = "2026-08-17"
TODAY = date(2026, 8, 18)
POOL = 40


def bars(seed: int) -> list[Bar]:
    made: list[Bar] = []
    price = 10.0 + seed * 0.5
    for index in range(240):
        price = round(price + 0.01, 4)
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
    made[-1] = Bar(ANALYSIS, price, price + 0.05, price - 0.05, price, 1_000_000)
    return made


def inputs(blocked: dict[str, dict] | None = None) -> DailyInputs:
    blocked = blocked or {}
    candidates, records, names, engine, risks, reasons = [], [], {}, {}, {}, {}
    for index in range(POOL):
        ticker = f"{600000 + index}.SH"
        history = bars(index)
        override = blocked.get(ticker, {})
        candidates.append({
            "ticker": ticker,
            "name": f"公司{index}",
            "close": history[-1].close,
            "bar_count": len(history),
            "bar_date": ANALYSIS,
            "quote_date": ANALYSIS,
            "turnover_amount": 900_000_000.0,
            "turnover_rate": 1.0,
            "total_mcap": 400_000_000_000.0,
            "final_status": "Watch",
            **override,
        })
        records.append(
            facts.build_record(
                ticker,
                history,
                {
                    "latest_date": ANALYSIS,
                    "turnover_amount": 900_000_000.0,
                    "turnover_rate": 1.0,
                    "total_mcap": 400_000_000_000.0,
                },
                {"trend_signal": "above 50d SMA"},
            )
        )
        names[ticker] = f"公司{index}"
        engine[ticker] = {"riskScore": 7.0, "overheatScore": 7.0, "finalStatus": "Watch"}
        risks[ticker] = "RSI warming"
        reasons[ticker] = "trend intact"
    return DailyInputs(
        analysis_date=ANALYSIS,
        candidates=candidates,
        records=records,
        names=names,
        engine_facts=engine,
        main_risks=risks,
        main_reasons=reasons,
        market_regime_score=6.5,
        data_dir=Path("data"),
        scores_path=Path("scores.csv"),
        universe_path=Path("universe.csv"),
        missing_bars=[],
    )


class FakeSeats:
    """Both seats, answering every round; each failure mode is opt-in."""

    def __init__(
        self, *, fail: set[str] | None = None, spread: bool = True, revise: bool = False
    ) -> None:
        self.fail = fail or set()
        self.spread = spread
        self.revise = revise
        self.calls: list[dict] = []

    def __call__(self, member, workspace, prompt, schema, payload, timeout_seconds=0):
        stage = payload["stageId"]
        self.calls.append({"member": member.member_id, "stage": stage, "payload": payload})
        if stage in self.fail or f"{member.member_id}:{stage}" in self.fail:
            return RunnerOutcome(False, None, ["fake"], 1, "fake failure", "")
        tickers = list(payload["tickers"])
        if stage == discovery.DISCOVERY_STAGE_ID:
            count = payload["picksRequested"]
            offset = 5 if (self.spread and member.member_id == "sol") else 0
            chosen = (tickers[offset:] + tickers[:offset])[:count]
            return RunnerOutcome(
                True,
                {
                    "picks": [
                        {
                            "ticker": ticker,
                            "rank": index,
                            "lightweight_score": round(9.0 - index * 0.05, 2),
                            "reason_codes": ["TREND_STACK"],
                        }
                        for index, ticker in enumerate(chosen, start=1)
                    ]
                },
                ["fake"], 0, "", "",
            )
        if stage == detail.DETAIL_STAGE_ID:
            bias = 0.2 if member.member_id == "sol" else 0.0
            return RunnerOutcome(
                True,
                {
                    "scorecards": [
                        {
                            "ticker": ticker,
                            "dimensions": {
                                name: round(min(9.5, 6.0 + bias + index * 0.05), 2)
                                for name in DIMENSIONS
                            },
                            "confidence": 0.7,
                            "risk_flags": [],
                            "decision": "WATCH",
                            # Neutral wording: a seat that names itself in its
                            # own note would defeat the blind packet, and the
                            # committee's guard rightly rejects that.
                            "note": "trend intact" if bias else "volume confirms",
                        }
                        for index, ticker in enumerate(reversed(tickers))
                    ]
                },
                ["fake"], 0, "", "",
            )
        if stage == review.REVIEW_STAGE_ID:
            assessments = []
            for index, ticker in enumerate(tickers):
                revisions = []
                if self.revise and index == 0:
                    # A comparison against the next finalist: the shape the first
                    # real run produced and the old contract rejected.
                    revisions = [{
                        "dimension": "risk",
                        "from_score": payload["comparisons"][0]["yourScores"]["risk"],
                        "to_score": 9.5,
                        "fact_refs": [
                            {"ticker": ticker, "field": "atr_pct"},
                            {"ticker": tickers[1], "field": "atr_pct"},
                        ],
                        "note": "peer comparison",
                    }]
                assessments.append({
                    "ticker": ticker,
                    "confidence": 0.8,
                    "challenge": "c",
                    "revisions": revisions,
                })
            return RunnerOutcome(True, {"assessments": assessments}, ["fake"], 0, "", "")
        raise AssertionError(stage)


def run(seats: FakeSeats, previous=None, config: DailyConfig | None = None, max_calls: int = MAX_CALLS_PER_MEMBER):
    tmp = TemporaryDirectory()
    ledger = QuotaLedger(max_calls_per_member=max_calls)
    result = run_daily(
        inputs(),
        Path(tmp.name) / "run",
        TODAY,
        previous or {},
        "2026-08-15",
        config or DailyConfig(),
        DEFAULT_ROSTER,
        ledger,
        seats,
    )
    return result, ledger, tmp


class HappyPathTest(unittest.TestCase):
    def setUp(self) -> None:
        self.seats = FakeSeats()
        self.result, self.ledger, self._tmp = run(self.seats)

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def test_a_normal_day_costs_three_calls_per_model(self) -> None:
        for member in DEFAULT_ROSTER:
            self.assertEqual(self.ledger.calls(member.member_id), 3)

    def test_a_normal_day_never_exceeds_the_daily_budget(self) -> None:
        for member in DEFAULT_ROSTER:
            self.assertLessEqual(self.ledger.calls(member.member_id), MAX_CALLS_PER_MEMBER)

    def test_the_union_stays_between_thirty_and_sixty(self) -> None:
        self.assertGreaterEqual(len(self.result["union"]), 30)
        self.assertLessEqual(len(self.result["union"]), 60)

    def test_both_seats_score_exactly_the_same_union(self) -> None:
        submissions = self.result["detail"]["submissions"]
        pools = [tuple(sorted(card["ticker"] for card in cards)) for cards in submissions.values()]
        self.assertEqual(pools[0], pools[1])
        self.assertEqual(pools[0], tuple(sorted(self.result["union"])))

    def test_the_review_round_sees_only_the_preliminary_top_twenty(self) -> None:
        review_calls = [call for call in self.seats.calls if call["stage"] == review.REVIEW_STAGE_ID]
        self.assertEqual(len(review_calls), 2)
        for call in review_calls:
            self.assertEqual(len(call["payload"]["tickers"]), 20)

    def test_the_day_ends_in_exactly_ten_seats(self) -> None:
        self.assertEqual(len(self.result["rows"]), 10)
        self.assertEqual(self.result["degradationStatus"], DEGRADATION_NONE)

    def test_the_artifacts_of_every_round_are_written(self) -> None:
        target = self.result["target"]
        for name in (
            "eligibility.json", "snapshot.json", "facts.json", "d1-input.json",
            "d1-discovery.json", "d1-union.json", "d2-detail.json", "d2-consensus.json",
            "d3-preliminary.json", "d3-review.json", "d3-ledger.json", "d3-consensus.json",
            "d3-final-sol.json", "d3-final-claude.json", "selection.json",
            "run.json", "quota.json",
        ):
            self.assertTrue((target / name).is_file(), msg=f"缺少产物 {name}")

    def test_the_matrix_before_and_after_the_review_are_both_kept(self) -> None:
        target = self.result["target"]
        before = json.loads((target / "d2-detail.json").read_text(encoding="utf-8"))
        after = json.loads((target / "d3-final-sol.json").read_text(encoding="utf-8"))
        self.assertTrue(before["submissions"]["sol"])
        self.assertEqual(len(after), 20)

    def test_the_run_record_names_the_runtime_mode(self) -> None:
        record = json.loads((self.result["target"] / "run.json").read_text(encoding="utf-8"))
        self.assertEqual(record["runtimeMode"], "DAILY_TOP10")
        self.assertFalse(record["liveTrading"])
        self.assertTrue(record["researchOnly"])


class ReviewRevisionTest(unittest.TestCase):
    """The round-three path that the first real run never got to exercise."""

    def setUp(self) -> None:
        self.result, self.ledger, self._tmp = run(FakeSeats(revise=True))

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def test_a_cited_revision_survives_into_the_final_matrix(self) -> None:
        target = self.result["target"]
        after = json.loads((target / "d3-final-sol.json").read_text(encoding="utf-8"))
        moved = [card for card in after if card["dimensions"]["risk"] == 9.5]
        self.assertTrue(moved)

    def test_a_cross_ticker_citation_is_kept_in_the_audit(self) -> None:
        record = json.loads(
            (self.result["target"] / "d3-review.json").read_text(encoding="utf-8")
        )
        revisions = [
            revision
            for member in record["memberResults"]
            for item in member["assessments"]
            for revision in item["revisions"]
        ]
        self.assertTrue(revisions)
        self.assertTrue(any(revision["cross_ticker_refs"] for revision in revisions))

    def test_the_review_round_still_produced_ten_seats(self) -> None:
        self.assertEqual(len(self.result["rows"]), 10)
        self.assertEqual(self.result["degradationStatus"], DEGRADATION_NONE)


class DegradationTest(unittest.TestCase):
    def test_a_failed_discovery_seat_stops_new_buys(self) -> None:
        result, ledger, tmp = run(FakeSeats(fail={"sol:D1"}), previous={"600000.SH": 1})
        with tmp:
            self.assertEqual(result["degradationStatus"], DEGRADATION_R1_FAILED)
            self.assertNotIn("BUY", [row["action"] for row in result["rows"]])
            self.assertEqual(len(result["rows"]), 10)

    def test_a_failed_detail_seat_stops_new_buys_and_carries_yesterday(self) -> None:
        result, ledger, tmp = run(FakeSeats(fail={"claude:D2"}), previous={"600000.SH": 1})
        with tmp:
            self.assertEqual(result["degradationStatus"], DEGRADATION_R2_FAILED)
            actions = [row["action"] for row in result["rows"]]
            self.assertNotIn("BUY", actions)
            self.assertEqual(result["rows"][0]["ticker"], "600000.SH")

    def test_a_single_seat_never_produces_the_daily_list_alone(self) -> None:
        result, _ledger, tmp = run(FakeSeats(fail={"claude:D2"}))
        with tmp:
            self.assertEqual(
                [row["action"] for row in result["rows"]], ["CASH"] * 10
            )

    def test_a_failed_review_round_falls_back_to_the_detail_consensus(self) -> None:
        result, _ledger, tmp = run(FakeSeats(fail={"D3"}))
        with tmp:
            self.assertEqual(result["degradationStatus"], DEGRADATION_R3_FAILED)
            self.assertIn("BUY", [row["action"] for row in result["rows"]])

    def test_an_exhausted_budget_skips_the_review_round_safely(self) -> None:
        result, ledger, tmp = run(FakeSeats(), max_calls=2)
        with tmp:
            self.assertEqual(result["degradationStatus"], DEGRADATION_R3_SKIPPED)
            self.assertIn("BUY", [row["action"] for row in result["rows"]])
            for member in DEFAULT_ROSTER:
                self.assertEqual(ledger.calls(member.member_id), 2)

    def test_skipping_the_review_round_is_recorded_not_implied(self) -> None:
        result, _ledger, tmp = run(FakeSeats(), config=DailyConfig(skip_review=True))
        with tmp:
            self.assertEqual(result["degradationStatus"], DEGRADATION_R3_SKIPPED)
            self.assertTrue(result["degradation"])


class BoundaryTest(unittest.TestCase):
    def test_the_daily_path_never_enters_the_full_pool_round_two(self) -> None:
        """DAILY_TOP10 and FULL_COMMITTEE stay separate code paths."""
        package = Path("stock_pdc/sustainable/daily")
        for path in package.glob("*.py"):
            source = path.read_text(encoding="utf-8")
            self.assertNotIn("round_two", source, msg=f"{path} 引用了全池 Round 2")
            self.assertNotIn("from ..round_one import run_round_one", source)

    def test_a_blocked_candidate_never_appears_in_any_seat_payload(self) -> None:
        seats = FakeSeats()
        tmp = TemporaryDirectory()
        with tmp:
            data = inputs()
            data.candidates[0]["turnover_amount"] = 0.0  # halted
            blocked_ticker = data.candidates[0]["ticker"]
            run_daily(
                data, Path(tmp.name) / "run", TODAY, {}, "", DailyConfig(),
                DEFAULT_ROSTER, QuotaLedger(), seats,
            )
            for call in seats.calls:
                self.assertNotIn(blocked_ticker, call["payload"]["tickers"])

    def test_no_seat_call_is_made_before_the_hard_gate(self) -> None:
        seats = FakeSeats()
        tmp = TemporaryDirectory()
        with tmp:
            result = run_daily(
                inputs(), Path(tmp.name) / "run", TODAY, {}, "", DailyConfig(),
                DEFAULT_ROSTER, QuotaLedger(), seats,
            )
            eligible = set(result["eligibility"]["eligible"])
            first_payload = seats.calls[0]["payload"]
            self.assertTrue(set(first_payload["tickers"]).issubset(eligible))

    def test_the_committee_weights_still_come_from_the_engine(self) -> None:
        from stock_pdc.config import DEFAULT_WEIGHTS
        from stock_pdc.sustainable.arbitration import WEIGHT_KEY, canonical_weights

        weights = canonical_weights()
        for name in DIMENSIONS:
            self.assertEqual(weights[name], DEFAULT_WEIGHTS[WEIGHT_KEY[name]])


if __name__ == "__main__":
    unittest.main()
