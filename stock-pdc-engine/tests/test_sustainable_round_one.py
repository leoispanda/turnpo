from __future__ import annotations

import json
import unittest

from stock_pdc.sustainable.contracts import DIMENSIONS, ContractError
from stock_pdc.sustainable.round_one import (
    build_candidate,
    build_input,
    consensus,
    prompt_for,
    submissions_from,
)


def deterministic_row(ticker: str = "600519.SH") -> dict[str, object]:
    row: dict[str, object] = {
        "ticker": ticker,
        "rank": 1,
        "final_score": 7.44,
        "final_status": "Watch",
        "latest_date": "2026-08-11",
        "latest_close": 1500.0,
        "main_reason": "trend intact",
        "analysis_date": "2026-08-11",
    }
    for name in DIMENSIONS:
        row[f"{name}_score"] = 6.0
        row[f"{name}_reason"] = f"{name} reason text"
        row[f"{name}_signal"] = "NEUTRAL"
    return row


def card(ticker: str, score: float, decision: str = "WATCH") -> dict[str, object]:
    """A scorecard as the contract actually produces one.

    No `score` key: a seat that supplies its own total is rejected by
    `validate_scorecards`, so the total is computed from the dimensions and the
    engine's fixed weights. Uniform dimensions make that total equal `score`.
    """
    return {
        "ticker": ticker,
        "dimensions": {name: score for name in DIMENSIONS},
        "confidence": 0.6,
        "risk_flags": [],
        "decision": decision,
        "note": "reason",
    }


def frozen_with(**members: list[dict[str, object]]) -> dict[str, object]:
    return {
        "memberResults": [
            {"memberId": name, "status": "COMPLETED", "scorecards": cards}
            for name, cards in members.items()
        ]
    }


class CandidateFactsTest(unittest.TestCase):
    def test_measured_signals_travel_but_the_engine_verdict_does_not(self) -> None:
        candidate = build_candidate(deterministic_row())
        self.assertEqual(set(candidate["measuredSignals"]), set(DIMENSIONS))
        self.assertEqual(candidate["latest_close"], 1500.0)
        self.assertNotIn("deterministicScores", candidate)

    def test_prose_reasons_are_not_forwarded(self) -> None:
        # Rule-engine prose would be echoed back as if it were the seat's own
        # judgement; only measurements are facts worth reasoning from.
        candidate = build_candidate(deterministic_row())
        self.assertNotIn("main_reason", candidate)
        self.assertNotIn("market_regime_reason", str(candidate))

    def test_ticker_is_normalized(self) -> None:
        self.assertEqual(build_candidate({"ticker": " 600519.sh "})["ticker"], "600519.SH")

    def test_a_row_without_a_ticker_is_rejected(self) -> None:
        with self.assertRaises(ContractError):
            build_candidate({"final_score": 5})

    def test_an_empty_candidate_set_is_rejected(self) -> None:
        with self.assertRaises(ContractError):
            build_input("run-1", [])


class InputPackageTest(unittest.TestCase):
    def test_every_seat_would_receive_an_identical_package(self) -> None:
        payload = build_input("run-1", [deterministic_row("600519.SH")])
        self.assertEqual(payload["candidateCount"], 1)
        self.assertTrue(payload["researchOnly"])
        self.assertFalse(payload["liveTrading"])

    def test_prompt_states_the_exact_expected_coverage(self) -> None:
        self.assertIn("20 candidates", prompt_for(20))
        self.assertIn("no more, no fewer", prompt_for(20))

    def test_prompt_forbids_invention_and_trading(self) -> None:
        text = prompt_for(3).lower()
        self.assertIn("do not invent", text)
        self.assertIn("never orders", text)


class ConsensusTest(unittest.TestCase):
    def test_only_completed_submissions_are_compared(self) -> None:
        frozen = {
            "memberResults": [
                {"memberId": "sol", "status": "COMPLETED", "scorecards": [card("A", 7)]},
                {"memberId": "claude", "status": "FAILED", "scorecards": []},
            ]
        }
        self.assertEqual(set(submissions_from(frozen)), {"sol"})

    def test_close_scores_are_not_flagged(self) -> None:
        result = consensus(frozen_with(sol=[card("A", 7.0)], claude=[card("A", 6.0)]))
        row = result["tickers"][0]
        self.assertEqual(row["scoreSpread"], 1.0)
        self.assertFalse(row["hasMaterialDisagreement"])

    def test_a_wide_spread_is_flagged(self) -> None:
        result = consensus(frozen_with(sol=[card("A", 9.0)], claude=[card("A", 5.0)]))
        self.assertTrue(result["tickers"][0]["hasMaterialDisagreement"])
        self.assertEqual(result["disagreementCount"], 1)

    def test_opposing_decisions_are_flagged_even_when_scores_are_close(self) -> None:
        # One seat buying while another sells is a real conflict regardless of
        # how near the numbers happen to land.
        result = consensus(
            frozen_with(sol=[card("A", 6.0, "BUY")], claude=[card("A", 5.5, "SELL")])
        )
        row = result["tickers"][0]
        self.assertLess(row["scoreSpread"], 3.0)
        self.assertTrue(row["hasMaterialDisagreement"])

    def test_ranking_is_by_mean_score_descending(self) -> None:
        result = consensus(
            frozen_with(
                sol=[card("A", 5.0), card("B", 9.0)],
                claude=[card("A", 5.0), card("B", 9.0)],
            )
        )
        self.assertEqual([row["ticker"] for row in result["tickers"]], ["B", "A"])
        self.assertEqual(result["tickers"][0]["consensusRank"], 1)

    def test_each_member_score_is_retained_for_later_comparison(self) -> None:
        result = consensus(frozen_with(sol=[card("A", 7.0)], claude=[card("A", 4.0)]))
        self.assertEqual(result["tickers"][0]["byMember"], {"sol": 7.0, "claude": 4.0})

    def test_the_total_is_computed_locally_and_never_read_off_the_card(self) -> None:
        """A card carries nine dimensions and no total; reading `score` crashed."""
        result = consensus(frozen_with(sol=[card("A", 8.0)], claude=[card("A", 6.0)]))
        row = result["tickers"][0]
        self.assertEqual(row["meanScore"], 7.0)
        self.assertNotIn("score", frozen_with(sol=[card("A", 8.0)])["memberResults"][0]["scorecards"][0])


class BlindInputTest(unittest.TestCase):
    """The engine's verdict is withheld so the seats must judge for themselves."""

    def test_no_engine_verdict_reaches_a_seat_by_default(self) -> None:
        candidate = build_candidate(deterministic_row())
        for leaked in ("rank", "final_score", "final_status", "deterministicScores"):
            self.assertNotIn(leaked, candidate)

    def test_measurements_still_travel(self) -> None:
        # Withholding the measurements too would invite invention, not independence.
        candidate = build_candidate(deterministic_row())
        self.assertEqual(set(candidate["measuredSignals"]), set(DIMENSIONS))
        self.assertEqual(candidate["latest_close"], 1500.0)

    def test_no_dimension_score_survives_anywhere_in_the_payload(self) -> None:
        payload = build_input("run-1", [deterministic_row()])
        serialized = json.dumps(payload, ensure_ascii=False)
        for name in DIMENSIONS:
            self.assertNotIn(f'"{name}_score"', serialized)
        self.assertNotIn("deterministicScores", serialized)

    def test_control_mode_restores_the_baseline_for_comparison(self) -> None:
        candidate = build_candidate(deterministic_row(), include_baseline=True)
        self.assertIn("deterministicScores", candidate)
        self.assertEqual(candidate["final_score"], 7.44)

    def test_package_records_which_mode_produced_it(self) -> None:
        self.assertFalse(build_input("r", [deterministic_row()])["includesBaseline"])
        self.assertTrue(
            build_input("r", [deterministic_row()], include_baseline=True)["includesBaseline"]
        )

    def test_prompt_tells_a_blind_seat_that_producing_scores_is_its_job(self) -> None:
        text = prompt_for(3, build_input("r", [deterministic_row()]))
        self.assertIn("No score, rank, status or verdict is supplied", text)
        self.assertNotIn("not as opinions to be flattered", text)

    def test_prompt_keeps_the_anchored_framing_for_the_control_run(self) -> None:
        text = prompt_for(3, build_input("r", [deterministic_row()], include_baseline=True))
        self.assertIn("not as opinions to be flattered", text)


if __name__ == "__main__":
    unittest.main()
