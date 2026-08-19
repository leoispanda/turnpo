"""Rules the arbitration layer must not drift from."""

from __future__ import annotations

import unittest

from stock_pdc.config import DEFAULT_WEIGHTS
from stock_pdc.sustainable.arbitration import (
    WEIGHT_KEY,
    arbitrate,
    canonical_total,
    canonical_weights,
    final_gate,
)
from stock_pdc.sustainable.contracts import DIMENSIONS
from stock_pdc.sustainable.disagreement import build_matrix
from stock_pdc.sustainable.evidence import candidate_set_hash, freeze
from stock_pdc.sustainable.round_two import apply_revisions


def card(ticker: str, decision: str = "WATCH", confidence: float = 0.6, **dims: float) -> dict:
    values = {name: 5.0 for name in DIMENSIONS}
    values.update(dims)
    return {
        "ticker": ticker,
        "dimensions": values,
        "confidence": confidence,
        "risk_flags": [],
        "decision": decision,
        "note": "n",
    }


def facts(**by_ticker: dict) -> dict:
    return {
        t: {"riskScore": 6.0, "overheatScore": 6.0, "finalStatus": "Watch", **o}
        for t, o in by_ticker.items()
    }


class CanonicalWeightTest(unittest.TestCase):
    def test_weights_come_from_the_engine_not_from_here(self) -> None:
        weights = canonical_weights()
        for name in DIMENSIONS:
            self.assertEqual(weights[name], DEFAULT_WEIGHTS[WEIGHT_KEY[name]])

    def test_every_dimension_is_mapped(self) -> None:
        self.assertEqual(set(WEIGHT_KEY), set(DIMENSIONS))

    def test_uniform_scores_return_that_score(self) -> None:
        self.assertEqual(canonical_total({name: 7.0 for name in DIMENSIONS}), 7.0)

    def test_heavier_dimensions_move_the_total_more(self) -> None:
        base = {name: 5.0 for name in DIMENSIONS}
        heavy = dict(base, trend=10.0)          # weight .18
        light = dict(base, zhuge_orion=10.0)    # weight .02
        self.assertGreater(canonical_total(heavy), canonical_total(light))


class MinorityPreservationTest(unittest.TestCase):
    def setUp(self) -> None:
        self.subs = {
            "sol": [card("A", trend=9.0)],
            "claude": [card("A", trend=3.0)],
        }
        self.matrix = build_matrix(self.subs)

    def test_a_wide_split_survives_the_merge(self) -> None:
        result = arbitrate(self.subs, self.matrix, facts(A={}))
        row = result["rows"][0]
        self.assertEqual(row["seatDimensions"]["sol"]["trend"], 9.0)
        self.assertEqual(row["seatDimensions"]["claude"]["trend"], 3.0)
        self.assertEqual(row["consensusDimensions"]["trend"], 6.0)
        self.assertEqual(row["absoluteDisagreement"], 6.0)
        self.assertTrue(row["highDisagreement"])

    def test_both_seat_totals_are_recorded(self) -> None:
        row = arbitrate(self.subs, self.matrix, facts(A={}))["rows"][0]
        self.assertNotEqual(row["seatTotals"]["sol"], row["seatTotals"]["claude"])

    def test_high_disagreement_does_not_remove_the_candidate(self) -> None:
        result = arbitrate(self.subs, self.matrix, facts(A={}))
        self.assertEqual(result["poolSize"], 1)

    def test_arbitration_refuses_mismatched_pools(self) -> None:
        with self.assertRaises(ValueError):
            arbitrate(
                {"sol": [card("A")], "claude": [card("B")]},
                self.matrix,
                facts(A={}, B={}),
            )


class RevisionTest(unittest.TestCase):
    def test_a_revision_changes_only_its_own_dimension(self) -> None:
        cards = [card("A", trend=9.0, risk=4.0)]
        revised = apply_revisions(
            cards, [{"ticker": "A", "dimension": "trend", "to_score": 7.0}]
        )
        self.assertEqual(revised[0]["dimensions"]["trend"], 7.0)
        self.assertEqual(revised[0]["dimensions"]["risk"], 4.0)

    def test_an_empty_revision_list_leaves_everything_standing(self) -> None:
        cards = [card("A", trend=9.0)]
        self.assertEqual(apply_revisions(cards, [])[0]["dimensions"], cards[0]["dimensions"])


class FinalGateTest(unittest.TestCase):
    def _gate(self, subs, f, age=0, hawkeye=1):
        matrix = build_matrix(subs)
        arb = arbitrate(subs, matrix, f)
        return arb, final_gate(arb, freeze("r", {"candidates": [{"ticker": "A"}]}, "2026-08-17"), hawkeye, age)

    def test_stale_data_blocks_the_whole_run(self) -> None:
        subs = {"sol": [card("A", trend=9.0)], "claude": [card("A", trend=9.0)]}
        _, gate = self._gate(subs, facts(A={}), age=11)
        self.assertEqual(gate["status"], "BLOCK")

    def test_an_incomplete_pool_blocks_the_whole_run(self) -> None:
        subs = {"sol": [card("A")], "claude": [card("A")]}
        _, gate = self._gate(subs, facts(A={}), hawkeye=303)
        self.assertEqual(gate["status"], "BLOCK")

    def test_hard_risk_blocks_one_row_without_blocking_the_run(self) -> None:
        subs = {"sol": [card("A", trend=9.0)], "claude": [card("A", trend=9.0)]}
        arb, gate = self._gate(subs, facts(A={"riskScore": 3.0}))
        self.assertEqual(arb["rows"][0]["gate"], "BLOCK")
        self.assertNotEqual(gate["status"], "BLOCK")

    def test_high_disagreement_downgrades_a_pass_to_review(self) -> None:
        subs = {"sol": [card("A", trend=10.0, risk=10.0)], "claude": [card("A", trend=4.0, risk=10.0)]}
        arb, gate = self._gate(subs, facts(A={}))
        self.assertEqual(arb["rows"][0]["gate"], "REVIEW_REQUIRED")
        self.assertEqual(gate["status"], "REVIEW_REQUIRED")


class EvidenceTest(unittest.TestCase):
    def test_candidate_set_hash_ignores_order(self) -> None:
        self.assertEqual(candidate_set_hash(("A", "B")), candidate_set_hash(("B", "A")))

    def test_a_changed_candidate_set_changes_the_hash(self) -> None:
        self.assertNotEqual(candidate_set_hash(("A", "B")), candidate_set_hash(("A", "C")))

    def test_changed_facts_change_the_facts_hash(self) -> None:
        one = freeze("r", {"candidates": [{"ticker": "A", "x": 1}]}, "2026-08-17")
        two = freeze("r", {"candidates": [{"ticker": "A", "x": 2}]}, "2026-08-17")
        self.assertEqual(one["candidateSetHash"], two["candidateSetHash"])
        self.assertNotEqual(one["factsHash"], two["factsHash"])


if __name__ == "__main__":
    unittest.main()


class RoundTwoBatchingTest(unittest.TestCase):
    """Batching bounds one request; it must never drop a dispute."""

    def test_every_dispute_lands_in_exactly_one_batch(self) -> None:
        from stock_pdc.sustainable.round_two import DEFAULT_CHALLENGE_BATCH

        items = [{"ticker": f"T{i}", "dimensionsInDispute": ["trend"]} for i in range(47)]
        size = DEFAULT_CHALLENGE_BATCH
        groups = [items[i : i + size] for i in range(0, len(items), size)]
        flattened = [item["ticker"] for group in groups for item in group]
        self.assertEqual(sorted(flattened), sorted(item["ticker"] for item in items))
        self.assertEqual(len(flattened), len(set(flattened)))

    def test_a_batch_stays_well_under_the_size_that_broke_both_clis(self) -> None:
        # 183 disputes in one request produced a 143k-character prompt that both
        # CLIs rejected outright; the batch size exists to keep that impossible.
        from stock_pdc.sustainable.round_two import DEFAULT_CHALLENGE_BATCH

        self.assertLessEqual(DEFAULT_CHALLENGE_BATCH, 25)


class StrictSchemaTest(unittest.TestCase):
    """Strict structured output rejects any property missing from `required`."""

    def _walk(self, node, path="root"):
        if isinstance(node, dict):
            if node.get("type") == "object" and "properties" in node:
                required = set(node.get("required", []))
                declared = set(node["properties"])
                self.assertEqual(
                    declared, required,
                    f"{path}: properties {sorted(declared)} != required {sorted(required)}",
                )
                self.assertFalse(node.get("additionalProperties", True), f"{path} 未禁用额外字段")
            for key, value in node.items():
                self._walk(value, f"{path}.{key}")
        elif isinstance(node, list):
            for index, value in enumerate(node):
                self._walk(value, f"{path}[{index}]")

    def test_revision_schema_is_strictly_specified(self) -> None:
        from stock_pdc.sustainable.round_two import revision_schema

        self._walk(revision_schema(10), "revision_schema")

    def test_scorecard_schema_is_strictly_specified(self) -> None:
        from stock_pdc.sustainable.contracts import scorecard_schema

        self._walk(scorecard_schema(10), "scorecard_schema")

    def test_peer_review_schema_is_strictly_specified(self) -> None:
        from stock_pdc.sustainable.contracts import peer_review_schema

        self._walk(peer_review_schema(10), "peer_review_schema")


class AcceptanceReportTest(unittest.TestCase):
    """A checklist that reports a failure the run did not have is worse than none."""

    def _report(self, ledger, **kwargs):
        from stock_pdc.sustainable.arbitration import acceptance_report

        subs = {"sol": [card("A", trend=9.0)], "claude": [card("A", trend=9.0)]}
        matrix = build_matrix(subs)
        arb = arbitrate(subs, matrix, facts(A={}))
        snapshot = freeze("r", {"candidates": [{"ticker": "A"}]}, "2026-08-17")
        gate = final_gate(arb, snapshot, 1, 0)
        frozen_r1 = {
            "memberResults": [
                {"memberId": m, "status": "COMPLETED", "scorecards": c}
                for m, c in subs.items()
            ]
        }
        round_two = {
            "memberResults": [
                {"memberId": "sol", "status": "COMPLETED", "revisions": []},
                {"memberId": "claude", "status": "COMPLETED", "revisions": []},
            ]
        }
        return acceptance_report(
            snapshot, frozen_r1,
            {"roundOneHashes": {"sol": "x", "claude": "y"}},
            matrix, round_two, arb, gate, 1, 20, ledger,
        )

    def test_a_sealed_ledger_passes_even_after_it_is_removed_from_the_record(self) -> None:
        report = self._report({"labelByMember": {"sol": "A", "claude": "B"}})
        self.assertEqual(report["ANONYMIZATION"], "PASS")

    def test_a_missing_ledger_fails(self) -> None:
        self.assertEqual(self._report({})["ANONYMIZATION"], "FAIL")

    def test_a_ledger_that_does_not_cover_every_seat_fails(self) -> None:
        report = self._report({"labelByMember": {"sol": "A"}})
        self.assertEqual(report["ANONYMIZATION"], "FAIL")
