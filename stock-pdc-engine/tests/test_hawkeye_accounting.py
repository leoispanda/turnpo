from __future__ import annotations

import unittest

from stock_pdc.hawkeye_radar import HawkeyeMetadata, screen_universe
from stock_pdc.models import Bar


def _bars(growth: float) -> list[Bar]:
    rows: list[Bar] = []
    close = 10.0
    for index in range(61):
        close *= 1 + growth
        rows.append(Bar(date=f"2026-01-{index + 1:02d}", open=close, high=close, low=close, close=close, volume=1_000))
    return rows


class HawkeyeAccountingTests(unittest.TestCase):
    def test_full_snapshot_rows_are_accounted_for_even_without_history(self) -> None:
        metadata = {
            "600001.SH": HawkeyeMetadata(
                ticker="600001.SH",
                name="通过",
                total_mcap=50_000_000_000,
                universe_status="UNIVERSE_INCLUDED_A_SHARE",
                history_status="HISTORY_READY",
                market_data_provider="sina",
            ),
            "600002.SH": HawkeyeMetadata(
                ticker="600002.SH",
                name="市值不达标",
                total_mcap=20_000_000_000,
                universe_status="UNIVERSE_INCLUDED_A_SHARE",
                history_status="NOT_REQUESTED_BELOW_HAWKEYE_MARKET_CAP",
            ),
            "600003.SH": HawkeyeMetadata(
                ticker="600003.SH",
                name="历史失败",
                total_mcap=50_000_000_000,
                universe_status="UNIVERSE_INCLUDED_A_SHARE",
                history_status="HISTORY_FETCH_FAILED",
                history_error="upstream timeout",
            ),
        }
        results = screen_universe(
            {"600001.SH": _bars(0.001)},
            metadata,
            min_market_cap=30_000_000_000,
            min_return_60d=0,
            max_daily_move=99,
            daily_move_lookback=20,
            min_bars=61,
        )

        by_ticker = {result.ticker: result for result in results}
        self.assertEqual(set(by_ticker), set(metadata))
        self.assertTrue(by_ticker["600001.SH"].passed)
        self.assertEqual(by_ticker["600001.SH"].status, "PASSED_HAWKEYE")
        self.assertEqual(by_ticker["600001.SH"].market_data_provider, "sina")
        self.assertFalse(by_ticker["600002.SH"].passed)
        self.assertEqual(by_ticker["600002.SH"].status, "REJECTED_HAWKEYE")
        self.assertIn("total market cap", by_ticker["600002.SH"].rejection_reason)
        self.assertFalse(by_ticker["600003.SH"].passed)
        self.assertEqual(by_ticker["600003.SH"].status, "DATA_FAILED_HISTORY_FETCH_FAILED")
        self.assertEqual(by_ticker["600003.SH"].rejection_reason, "upstream timeout")


if __name__ == "__main__":
    unittest.main()
