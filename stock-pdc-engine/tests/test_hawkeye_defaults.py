import unittest
import csv
import tempfile
from pathlib import Path

from scripts.run_latest_pdc import (
    _build_pdc_command,
    _validate_latest_data,
    build_parser as build_latest_parser,
)
from scripts.fetch_a_share_eastmoney import build_parser as build_fetch_parser, write_bars
from stock_pdc.config import HAWKEYE_MIN_MARKET_CAP_CNY, HAWKEYE_MIN_RETURN_60D_PCT
from stock_pdc.hawkeye_radar import HawkeyeMetadata, screen_stock
from stock_pdc.models import Bar


class HawkeyeDefaultTests(unittest.TestCase):
    def test_hawkeye_rules_are_fixed_and_broad(self) -> None:
        self.assertEqual(HAWKEYE_MIN_MARKET_CAP_CNY, 30_000_000_000)
        self.assertEqual(HAWKEYE_MIN_RETURN_60D_PCT, 0.0)

    def test_guarded_daily_workflow_is_strict_radar_without_padding(self) -> None:
        args = build_latest_parser().parse_args([])
        self.assertFalse(hasattr(args, "candidate_count"))
        self.assertFalse(hasattr(args, "min_amount"))
        self.assertFalse(hasattr(build_fetch_parser().parse_args([]), "candidate_count"))
        self.assertFalse(hasattr(build_fetch_parser().parse_args([]), "min_amount"))
        self.assertFalse(hasattr(build_fetch_parser().parse_args([]), "continue_on_error"))
        command = _build_pdc_command(
            args,
            Path("/tmp/data"),
            Path("/tmp/universe.csv"),
            Path("/tmp/outputs"),
            "2026-07-20",
        )

        self.assertEqual(args.variants, "a")
        self.assertIn("--use-radar", command)
        self.assertNotIn("--radar-min-return-60d", command)

    def test_hawkeye_applies_only_market_cap_and_positive_60d_return(self) -> None:
        bars = [
            Bar(
                date=f"2026-01-{index + 1:02d}",
                open=10 + index,
                high=10 + index,
                low=10 + index,
                close=10 + index,
                volume=1,
            )
            for index in range(61)
        ]
        passed = screen_stock(
            "000001.SZ",
            bars,
            HawkeyeMetadata("000001.SZ", "样本", HAWKEYE_MIN_MARKET_CAP_CNY + 1),
        )
        self.assertTrue(passed.passed)

        cap_boundary = screen_stock(
            "000002.SZ", bars, HawkeyeMetadata("000002.SZ", "边界", HAWKEYE_MIN_MARKET_CAP_CNY)
        )
        self.assertFalse(cap_boundary.passed)

        flat_bars = [
            Bar(date=bar.date, open=10, high=10, low=10, close=10, volume=1)
            for bar in bars
        ]
        flat = screen_stock(
            "000003.SZ", flat_bars, HawkeyeMetadata("000003.SZ", "平盘", HAWKEYE_MIN_MARKET_CAP_CNY + 1)
        )
        self.assertFalse(flat.passed)

    def test_validation_allows_a_suspended_stock_but_not_missing_data(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            data_dir = root / "data"
            data_dir.mkdir()
            universe_csv = root / "universe.csv"
            with universe_csv.open("w", encoding="utf-8", newline="") as file:
                writer = csv.DictWriter(file, fieldnames=["ticker", "last_date"])
                writer.writeheader()
                writer.writerow({"ticker": "600001.SH", "last_date": "2026-08-06"})
            write_bars(data_dir / "CSI300ETF.csv", [{"Date": "2026-08-07", "Open": "1", "High": "1", "Low": "1", "Close": "1", "Volume": "1"}])
            write_bars(data_dir / "600001.SH.csv", [{"Date": "2026-08-06", "Open": "1", "High": "1", "Low": "1", "Close": "1", "Volume": "1"}])

            self.assertEqual(_validate_latest_data(data_dir, universe_csv, "CSI300ETF"), "2026-08-07")


if __name__ == "__main__":
    unittest.main()
