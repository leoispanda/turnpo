from __future__ import annotations

import unittest
from datetime import date, timedelta
from pathlib import Path

from stock_pdc.models import Bar
from stock_pdc.strategy_b import (
    PortfolioRiskState,
    _average_percentiles,
    _entry_gate,
    _position_active_stop,
    build_strategy_b_portfolio_plan,
    build_strategy_b_rows,
    load_strategy_b_config,
)


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "configs" / "stock_pdc_b_v1.json"


def _bars(count: int = 220) -> list[Bar]:
    start = date(2025, 1, 1)
    result: list[Bar] = []
    for index in range(count):
        close = 50.0 + index * 0.2 + ((index % 7) - 3) * 0.01
        result.append(
            Bar(
                date=(start + timedelta(days=index)).isoformat(),
                open=close * 0.999,
                high=close * 1.01,
                low=close * 0.99,
                close=close,
                volume=1_000_000.0 + index * 1_000.0,
            )
        )
    return result


def _a_row(
    ticker: str,
    rank: int,
    *,
    trend: float,
    breakout: float,
    volume_price: float,
    zhuge: float = 5.0,
) -> dict[str, object]:
    return {
        "ticker": ticker,
        "rank": rank,
        "final_score": 5.0,
        "market_regime_score": 7.0,
        "trend_score": trend,
        "livermore_breakout_score": breakout,
        "volume_price_score": volume_price,
        "candlestick_score": 5.0,
        "overheat_score": 5.0,
        "risk_score": 5.0,
        "zhuge_orion_score": zhuge,
        "final_chair_score": 5.0,
    }


def _ranked_rows(count: int, *, market_score: float = 7.0) -> list[dict[str, object]]:
    return [
        {
            "ticker": f"T{rank:03d}",
            "alpha_rank": rank,
            "candidate_pass": True,
            "candidate_reason": "candidate gate passed",
            "market_regime_score": market_score,
            "risk_score": 5.0,
            "overheat_score": 5.0,
            "candlestick_score": 5.0,
            "stop_distance_pct": 5.0,
            "latest_close": 100.0,
            "latest_day_return_pct": -1.0,
            "atr14": 1.0,
            "initial_stop": 80.0,
            "active_stop": 80.0,
            "raw_target_weight_pct": 0.0,
            "target_weight_pct": 0.0,
            "gross_exposure_cap_pct": 0.0,
            "market_gross_cap_pct": 0.0,
            "drawdown_gross_cap_pct": 0.0,
            "volatility_gross_cap_pct": 0.0,
        }
        for rank in range(1, count + 1)
    ]


def _position() -> dict[str, object]:
    return {
        "entry_price": 100.0,
        "initial_stop": 80.0,
        "active_stop": 80.0,
        "peak_close": 100.0,
        "current_weight_pct": 4.0,
    }


class StrategyBTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.config = load_strategy_b_config(CONFIG_PATH)

    def test_average_percentiles_use_deterministic_average_rank_for_ties(self) -> None:
        first = _average_percentiles({"B": 10.0, "A": 10.0, "C": 20.0})
        second = _average_percentiles({"C": 20.0, "A": 10.0, "B": 10.0})

        self.assertEqual(first, second)
        self.assertEqual(first, {"A": 0.25, "B": 0.25, "C": 1.0})
        self.assertEqual(_average_percentiles({"ONLY": 3.0}), {"ONLY": 0.5})

    def test_alpha_rank_uses_only_weighted_trend_breakout_and_volume_percentiles(self) -> None:
        a_rows = [
            _a_row("TREND", 3, trend=9.0, breakout=1.0, volume_price=1.0, zhuge=0.0),
            _a_row("BREAK", 2, trend=1.0, breakout=9.0, volume_price=1.0, zhuge=5.0),
            _a_row("VOLUME", 1, trend=1.0, breakout=1.0, volume_price=9.0, zhuge=10.0),
        ]
        universe = {row["ticker"]: _bars() for row in a_rows}

        rows = build_strategy_b_rows(
            a_rows=a_rows,
            universe=universe,
            names={ticker: ticker for ticker in universe},
            config=self.config,
            analysis_date="2025-08-08",
            snapshot_id="snapshot-test",
        )

        self.assertEqual([row["ticker"] for row in rows], ["TREND", "BREAK", "VOLUME"])
        self.assertEqual([row["alpha_rank"] for row in rows], [1, 2, 3])
        self.assertEqual([row["alpha_score"] for row in rows], [5.875, 5.125, 4.0])
        self.assertEqual(
            [row["zhuge_orion_shadow_score"] for row in rows],
            [0.0, 5.0, 10.0],
        )

    def test_entry_gate_boundaries_and_reduced_size_multiplier(self) -> None:
        passing_boundary = {
            "candidate_pass": True,
            "market_regime_score": 4.0,
            "risk_score": 4.0,
            "overheat_score": 4.0,
            "candlestick_score": 3.200001,
            "stop_distance_pct": 12.0,
        }
        gate, reason, multiplier = _entry_gate(passing_boundary, self.config)

        self.assertEqual(gate, "ELIGIBLE_REDUCED")
        self.assertIn("half-risk", reason)
        self.assertEqual(multiplier, 0.25)

        failures = {
            "candidate": {**passing_boundary, "candidate_pass": False, "candidate_reason": "failed"},
            "market": {**passing_boundary, "market_regime_score": 3.999},
            "risk": {**passing_boundary, "risk_score": 3.999},
            "overheat": {**passing_boundary, "overheat_score": 3.999},
            "candlestick": {**passing_boundary, "candlestick_score": 3.2},
            "stop": {**passing_boundary, "stop_distance_pct": 12.000001},
        }
        for label, row in failures.items():
            with self.subTest(label=label):
                failed_gate, _failed_reason, failed_multiplier = _entry_gate(row, self.config)
                self.assertEqual(failed_gate, "WAIT_GATE")
                self.assertEqual(failed_multiplier, 0.0)

    def test_new_entries_stop_at_top_15(self) -> None:
        rows = _ranked_rows(20)

        plan, _caps = build_strategy_b_portfolio_plan(
            ranked_rows=rows,
            current_positions={},
            risk_state=PortfolioRiskState(),
            config=self.config,
            signal_date="2026-07-10",
            snapshot_id="snapshot-test",
        )

        entries = [row for row in plan if row["action"] == "ENTER_B"]
        self.assertEqual([row["rank"] for row in entries], list(range(1, 16)))
        self.assertNotIn("T016", {row["ticker"] for row in plan})

    def test_top_20_boundary_and_dropped_up_day_override(self) -> None:
        rows = _ranked_rows(22)
        rows[20]["latest_day_return_pct"] = 0.01
        current_positions = {
            "T020": _position(),
            "T021": _position(),
            "T022": _position(),
        }

        plan, _caps = build_strategy_b_portfolio_plan(
            ranked_rows=rows,
            current_positions=current_positions,
            risk_state=PortfolioRiskState(),
            config=self.config,
            signal_date="2026-07-10",
            snapshot_id="snapshot-test",
        )
        actions = {row["ticker"]: row["action"] for row in plan}

        self.assertEqual(actions["T020"], "HOLD_B")
        self.assertEqual(actions["T021"], "HOLD_DROPPED_UP_DAY")
        self.assertEqual(actions["T022"], "SELL_REVIEW_DROPPED")
        targets = {row["ticker"]: float(row["target_weight_pct"]) for row in plan}
        self.assertGreater(targets["T021"], 0.0)
        self.assertEqual(targets["T022"], 0.0)

    def test_trailing_stop_uses_peak_and_never_moves_back_down(self) -> None:
        row = {
            "latest_close": 101.0,
            "atr14": 1.0,
            "initial_stop": 80.0,
        }
        position = {
            "entry_price": 100.0,
            "initial_stop": 80.0,
            "active_stop": 108.0,
            "peak_close": 110.0,
        }

        active_stop = _position_active_stop(row, position, self.config)

        self.assertEqual(active_stop, 108.0)

    def test_locked_risk_stop_overrides_up_day_when_holding_leaves_universe(self) -> None:
        rows = _ranked_rows(3)
        missing_position = {
            "entry_price": 100.0,
            "initial_stop": 90.0,
            "active_stop": 105.0,
            "peak_close": 110.0,
            "last_price": 100.0,
            "current_weight_pct": 4.0,
            "signal_day_return_pct": 1.0,
        }

        plan, _caps = build_strategy_b_portfolio_plan(
            ranked_rows=rows,
            current_positions={"MISSING": missing_position},
            risk_state=PortfolioRiskState(),
            config=self.config,
            signal_date="2026-07-10",
            snapshot_id="snapshot-test",
        )
        missing = next(row for row in plan if row["ticker"] == "MISSING")
        self.assertEqual(missing["action"], "RISK_EXIT_REVIEW")
        self.assertEqual(missing["target_weight_pct"], 0.0)

    def test_risk_weight_is_capped_at_five_percent_then_scaled_to_gross_cap(self) -> None:
        rows = _ranked_rows(15)

        plan, caps = build_strategy_b_portfolio_plan(
            ranked_rows=rows,
            current_positions={},
            risk_state=PortfolioRiskState(drawdown_pct=-12.0),
            config=self.config,
            signal_date="2026-07-10",
            snapshot_id="snapshot-test",
        )

        self.assertEqual(caps["market"], 100.0)
        self.assertEqual(caps["drawdown"], 25.0)
        self.assertEqual(caps["gross"], 25.0)
        self.assertTrue(all(row["raw_target_weight_pct"] == 5.0 for row in rows))
        self.assertTrue(all(float(row["target_weight_pct"]) <= 5.0 for row in plan))
        self.assertAlmostEqual(sum(float(row["target_weight_pct"]) for row in plan), 25.0, places=5)


if __name__ == "__main__":
    unittest.main()
