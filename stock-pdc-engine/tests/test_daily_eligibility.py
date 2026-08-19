"""The hard gate: what may never reach a seat, and what may never take a seat."""

from __future__ import annotations

import unittest
from datetime import date

from stock_pdc.sustainable.daily.eligibility import (
    BARS_INSUFFICIENT,
    DATA_STALE,
    ENGINE_REMOVE,
    LIQUIDITY_THIN,
    ST_FLAG,
    SUSPENDED,
    EligibilityConfig,
    blocked_tickers,
    looks_like_st,
    screen,
    screen_all,
)


TODAY = date(2026, 8, 19)
ANALYSIS = "2026-08-17"


def candidate(**overrides) -> dict:
    base = {
        "ticker": "600000.SH",
        "name": "浦发银行",
        "close": 10.0,
        "bar_count": 300,
        "bar_date": ANALYSIS,
        "quote_date": ANALYSIS,
        "turnover_amount": 800_000_000.0,
        "turnover_rate": 1.2,
        "total_mcap": 400_000_000_000.0,
        "final_status": "Watch",
    }
    base.update(overrides)
    return base


class HardGateTest(unittest.TestCase):
    def test_a_normal_candidate_is_eligible(self) -> None:
        self.assertEqual(screen(candidate(), ANALYSIS, TODAY)["status"], "ELIGIBLE")

    def test_an_st_name_never_reaches_a_seat(self) -> None:
        result = screen(candidate(name="*ST新研"), ANALYSIS, TODAY)
        self.assertIn(ST_FLAG, result["reasons"])

    def test_a_delisting_name_is_blocked(self) -> None:
        self.assertTrue(looks_like_st("退市海润"))

    def test_a_halted_session_is_blocked(self) -> None:
        result = screen(candidate(turnover_amount=0.0), ANALYSIS, TODAY)
        self.assertIn(SUSPENDED, result["reasons"])

    def test_thin_turnover_is_blocked(self) -> None:
        result = screen(candidate(turnover_amount=1_000_000.0), ANALYSIS, TODAY)
        self.assertIn(LIQUIDITY_THIN, result["reasons"])

    def test_bars_that_stopped_updating_are_stale(self) -> None:
        result = screen(candidate(bar_date="2026-08-11"), ANALYSIS, TODAY)
        self.assertIn(DATA_STALE, result["reasons"])

    def test_a_quote_from_another_session_is_stale(self) -> None:
        result = screen(candidate(quote_date="2026-08-14"), ANALYSIS, TODAY)
        self.assertIn(DATA_STALE, result["reasons"])

    def test_data_older_than_the_limit_is_stale_for_every_candidate(self) -> None:
        result = screen(candidate(bar_date="2026-08-01", quote_date="2026-08-01"), "2026-08-01", TODAY)
        self.assertIn(DATA_STALE, result["reasons"])

    def test_too_few_bars_is_blocked(self) -> None:
        result = screen(candidate(bar_count=40), ANALYSIS, TODAY)
        self.assertIn(BARS_INSUFFICIENT, result["reasons"])

    def test_the_engine_verdict_is_not_a_pre_filter_by_default(self) -> None:
        """The seats form their own view before the engine's conclusion applies.

        The rule engine's Remove status still blocks a seat at the final gate; it
        just does not shrink the pool the committee gets to look at.
        """
        result = screen(candidate(final_status="Remove"), ANALYSIS, TODAY)
        self.assertEqual(result["status"], "ELIGIBLE")

    def test_the_engine_verdict_can_be_opted_into(self) -> None:
        result = screen(
            candidate(final_status="Remove"),
            ANALYSIS,
            TODAY,
            EligibilityConfig(block_engine_remove=True),
        )
        self.assertIn(ENGINE_REMOVE, result["reasons"])

    def test_reasons_are_ordered_and_deduplicated(self) -> None:
        result = screen(
            candidate(name="ST某某", turnover_amount=0.0, bar_count=10), ANALYSIS, TODAY
        )
        self.assertEqual(result["reasons"], sorted(set(result["reasons"]), key=result["reasons"].index))


class PoolReportTest(unittest.TestCase):
    def test_the_report_separates_eligible_from_blocked(self) -> None:
        report = screen_all(
            [candidate(), candidate(ticker="000002.SZ", name="ST某某")], ANALYSIS, TODAY
        )
        self.assertEqual(report["eligibleCount"], 1)
        self.assertEqual(report["blockedCount"], 1)
        self.assertEqual(report["eligible"], ["600000.SH"])
        self.assertEqual(blocked_tickers(report), {"000002.SZ"})

    def test_block_reasons_are_counted_for_the_daily_page(self) -> None:
        report = screen_all(
            [
                candidate(ticker="A", turnover_amount=0.0),
                candidate(ticker="B", turnover_amount=0.0),
                candidate(ticker="C", name="ST某某"),
            ],
            ANALYSIS,
            TODAY,
        )
        self.assertEqual(report["blockedReasonCounts"][SUSPENDED], 2)
        self.assertEqual(report["blockedReasonCounts"][ST_FLAG], 1)


if __name__ == "__main__":
    unittest.main()
