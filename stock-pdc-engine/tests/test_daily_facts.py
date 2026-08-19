"""What the seats are allowed to see, and what the fact hash has to prove."""

from __future__ import annotations

import json
import unittest

from stock_pdc.models import Bar
from stock_pdc.sustainable.daily import detail, discovery, facts


def bars(count: int = 250, start: float = 10.0, step: float = 0.02) -> list[Bar]:
    made: list[Bar] = []
    price = start
    for index in range(count):
        price = round(price + step, 4)
        made.append(
            Bar(
                date=f"2026-{1 + index // 28:02d}-{1 + index % 28:02d}",
                open=price - 0.05,
                high=price + 0.08,
                low=price - 0.10,
                close=price,
                volume=1_000_000 + index,
            )
        )
    return made


def record(ticker: str = "600000.SH", **meta) -> dict:
    metadata = {
        "latest_date": "2026-08-17",
        "turnover_amount": 900_000_000.0,
        "turnover_rate": 1.5,
        "total_mcap": 500_000_000_000.0,
    }
    metadata.update(meta)
    return facts.build_record(ticker, bars(), metadata, {"trend_signal": "above 50d SMA"})


class FactRecordTest(unittest.TestCase):
    def test_every_numeric_field_is_present_for_a_full_history(self) -> None:
        values = record()["values"]
        self.assertEqual(set(values), set(facts.NUMERIC_FIELDS))
        self.assertIsNotNone(values["stop"])
        self.assertIsNotNone(values["pivot55"])

    def test_the_stop_comes_from_the_engine_not_from_here(self) -> None:
        from stock_pdc.pdc_orchestrator import _technical_stop

        self.assertEqual(record()["values"]["stop"], round(_technical_stop(bars()), 3))

    def test_a_candidate_without_bars_is_an_error_not_a_zero(self) -> None:
        with self.assertRaises(facts.FactError):
            facts.build_record("600000.SH", [], {})

    def test_fact_ids_are_offered_only_for_values_that_exist(self) -> None:
        short = facts.build_record("600000.SH", bars(30), {"latest_date": "2026-08-17"})
        ids = facts.fact_ids(short)
        self.assertIn("600000.SH.close", ids)
        self.assertNotIn("600000.SH.sma200_dist_pct", ids)


class FrozenTableTest(unittest.TestCase):
    def setUp(self) -> None:
        self.table = facts.build_table(
            [record("600000.SH"), record("000001.SZ")], "2026-08-17", "daily-test"
        )

    def test_the_same_records_hash_the_same_way(self) -> None:
        again = facts.build_table(
            [record("000001.SZ"), record("600000.SH")], "2026-08-17", "daily-test"
        )
        self.assertEqual(self.table["factsHash"], again["factsHash"])

    def test_a_changed_measurement_changes_the_hash(self) -> None:
        moved = facts.build_table(
            [record("600000.SH", turnover_amount=1.0), record("000001.SZ")],
            "2026-08-17",
            "daily-test",
        )
        self.assertNotEqual(self.table["factsHash"], moved["factsHash"])

    def test_a_duplicate_candidate_is_refused(self) -> None:
        with self.assertRaises(facts.FactError):
            facts.build_table([record("600000.SH"), record("600000.SH")], "2026-08-17", "x")

    def test_a_subset_still_points_at_the_table_it_came_from(self) -> None:
        narrowed = facts.subset(self.table, ("600000.SH",))
        self.assertEqual(narrowed["parentFactsHash"], self.table["factsHash"])
        self.assertEqual(narrowed["tickers"], ["600000.SH"])

    def test_a_subset_cannot_invent_a_candidate(self) -> None:
        with self.assertRaises(facts.FactError):
            facts.subset(self.table, ("999999.SZ",))


class BothSeatsSeeTheSameEvidenceTest(unittest.TestCase):
    """The two payloads are one object, so identical evidence is structural."""

    def setUp(self) -> None:
        self.table = facts.build_table(
            [record("600000.SH"), record("000001.SZ")], "2026-08-17", "daily-test"
        )

    def test_the_discovery_prompt_is_byte_identical_for_both_seats(self) -> None:
        payload = discovery.build_payload(self.table, "daily-test", 1)
        self.assertEqual(discovery.prompt_for(payload), discovery.prompt_for(payload))

    def test_the_discovery_payload_carries_the_facts_hash(self) -> None:
        payload = discovery.build_payload(self.table, "daily-test", 1)
        self.assertEqual(payload["factsHash"], self.table["factsHash"])

    def test_no_company_name_reaches_a_seat(self) -> None:
        """Names invite recall; the committee is asked to read measurements."""
        payload = discovery.build_payload(self.table, "daily-test", 1)
        detail_payload = detail.build_payload(self.table, "daily-test")
        for text in (
            json.dumps(payload, ensure_ascii=False),
            json.dumps(detail_payload, ensure_ascii=False),
            discovery.prompt_for(payload),
            detail.prompt_for(detail_payload),
        ):
            self.assertNotIn("浦发", text)
            self.assertNotIn("name", json.loads(json.dumps(self.table))["records"][0])

    def test_no_engine_score_rank_or_verdict_reaches_a_seat(self) -> None:
        text = detail.prompt_for(detail.build_payload(self.table, "daily-test"))
        for forbidden in ("final_score", "final_status", "\"rank\"", "deterministicScores"):
            self.assertNotIn(forbidden, text)

    def test_the_compact_table_carries_one_row_per_candidate(self) -> None:
        rendered = facts.render_table(self.table)
        self.assertEqual(len(rendered.splitlines()), self.table["candidateCount"] + 1)


if __name__ == "__main__":
    unittest.main()
