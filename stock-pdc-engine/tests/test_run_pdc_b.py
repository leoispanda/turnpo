from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from scripts.run_pdc_b import (
    _a_portfolio_plan,
    _frozen_signal_day_returns,
    _validate_output_isolation,
)
from stock_pdc.ab_performance import freeze_price_observations
from stock_pdc.models import Bar


def _bar(date: str, close: float) -> Bar:
    return Bar(date=date, open=close, high=close, low=close, close=close, volume=1.0)


class RunPdcBTests(unittest.TestCase):
    def test_signal_day_return_uses_frozen_observations_and_requires_exact_date(self) -> None:
        histories = {
            "600000.SH": [
                _bar("2026-07-09", 10.0),
                _bar("2026-07-10", 10.2),
            ]
        }
        with tempfile.TemporaryDirectory() as temporary:
            price_path = Path(temporary) / "price_observations.csv"
            freeze_price_observations(
                price_path,
                histories,
                {"600000.SH"},
                ["2026-07-09", "2026-07-10"],
                {"600000.SH": "TEST_RAW"},
            )
            returns, sources = _frozen_signal_day_returns(
                price_path,
                {"600000.SH"},
                "2026-07-10",
            )
            missing_date_returns, _ = _frozen_signal_day_returns(
                price_path,
                {"600000.SH"},
                "2026-07-11",
            )

        self.assertAlmostEqual(returns["600000.SH"], 2.0)
        self.assertEqual(sources["600000.SH"], "TEST_RAW")
        self.assertIsNone(missing_date_returns["600000.SH"])

    def test_a_b_and_comparison_output_roots_must_be_disjoint(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            _validate_output_isolation(root / "a", root / "b", root / "ab")
            with self.assertRaises(ValueError):
                _validate_output_isolation(root / "a", root / "a", root / "ab")
            with self.assertRaises(ValueError):
                _validate_output_isolation(root / "a", root / "a" / "b", root / "ab")

    def test_a_dropped_up_position_is_held_without_adding_to_it(self) -> None:
        rows = [{"ticker": f"T{rank:03d}", "rank": rank} for rank in range(1, 22)]
        positions = {"T021": {"current_weight_pct": 4.0}}

        up_plan = _a_portfolio_plan(
            rows,
            positions,
            {"T021": 0.5},
            "2026-07-10",
            "snapshot-test",
            20,
        )
        up = next(row for row in up_plan if row["ticker"] == "T021")
        self.assertEqual(up["action"], "HOLD_DROPPED_UP_DAY")
        self.assertEqual(up["target_weight_pct"], 4.0)
        self.assertAlmostEqual(sum(float(row["target_weight_pct"]) for row in up_plan), 100.0, places=4)

        down_plan = _a_portfolio_plan(
            rows,
            positions,
            {"T021": -0.5},
            "2026-07-10",
            "snapshot-test",
            20,
        )
        down = next(row for row in down_plan if row["ticker"] == "T021")
        self.assertEqual(down["action"], "SELL_REVIEW_DROPPED")
        self.assertEqual(down["target_weight_pct"], 0.0)


if __name__ == "__main__":
    unittest.main()
