import unittest
from pathlib import Path

from scripts.run_historical_replay import build_parser as build_replay_parser
from scripts.run_latest_pdc import (
    _build_pdc_command,
    build_parser as build_latest_parser,
)
from scripts.fetch_a_share_eastmoney import build_parser as build_fetch_parser
from stock_pdc.cli import build_parser as build_cli_parser
from stock_pdc.config import HAWKEYE_MIN_MARKET_CAP_CNY, HAWKEYE_MIN_RETURN_60D_PCT


class HawkeyeDefaultTests(unittest.TestCase):
    def test_hawkeye_defaults_keep_the_candidate_pool_broad(self) -> None:
        self.assertEqual(HAWKEYE_MIN_MARKET_CAP_CNY, 30_000_000_000)
        self.assertEqual(HAWKEYE_MIN_RETURN_60D_PCT, 5.0)
        self.assertEqual(build_cli_parser().parse_args([]).radar_min_return_60d, 5.0)
        self.assertEqual(
            build_replay_parser()
            .parse_args(["--start", "2026-01-01", "--end", "2026-01-31"])
            .radar_min_return_60d,
            5.0,
        )

    def test_explicit_hawkeye_threshold_still_overrides_default(self) -> None:
        self.assertEqual(
            build_cli_parser()
            .parse_args(["--radar-min-return-60d", "20"])
            .radar_min_return_60d,
            20.0,
        )

    def test_guarded_daily_workflow_is_strict_radar_without_padding(self) -> None:
        args = build_latest_parser().parse_args([])
        self.assertFalse(hasattr(args, "candidate_count"))
        self.assertFalse(hasattr(args, "min_amount"))
        self.assertFalse(hasattr(build_fetch_parser().parse_args([]), "candidate_count"))
        self.assertFalse(hasattr(build_fetch_parser().parse_args([]), "min_amount"))
        command = _build_pdc_command(
            args,
            Path("/tmp/data"),
            Path("/tmp/universe.csv"),
            Path("/tmp/outputs"),
            "2026-07-20",
        )

        self.assertEqual(args.variants, "a")
        self.assertEqual(args.radar_min_return_60d, 5.0)
        self.assertIn("--use-radar", command)
        threshold_index = command.index("--radar-min-return-60d")
        self.assertEqual(command[threshold_index + 1], "5.0")
        self.assertEqual(
            build_replay_parser()
            .parse_args(
                [
                    "--start",
                    "2026-01-01",
                    "--end",
                    "2026-01-31",
                    "--radar-min-return-60d",
                    "20",
                ]
            )
            .radar_min_return_60d,
            20.0,
        )


if __name__ == "__main__":
    unittest.main()
