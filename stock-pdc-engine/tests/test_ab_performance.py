from __future__ import annotations

import csv
import tempfile
import unittest
from pathlib import Path

from stock_pdc.ab_performance import (
    freeze_price_observations,
    freeze_signal_pair,
    rebuild_ab_performance,
)
from stock_pdc.models import Bar


BENCHMARK = "CSI300ETF"
SIGNAL_DATE = "2026-07-10"
NEXT_SESSION = "2026-07-13"
FOLLOWING_SESSION = "2026-07-14"
TICKER = "600001.SH"
STRATEGY_IDS = ["A_SELECTION", "B_SELECTION", "A_PORTFOLIO", "B_PORTFOLIO"]
COSTS = {
    "commissionBpsPerSide": 3.0,
    "slippageBpsPerSide": 5.0,
    "sellStampDutyBps": 5.0,
}


def _signal_row(strategy_id: str, *, target_weight_pct: float = 100.0) -> dict[str, object]:
    variant, track = strategy_id.split("_", 1)
    return {
        "signal_date": SIGNAL_DATE,
        "snapshot_id": "snapshot-2026-07-10",
        "variant": variant,
        "comparison_track": track.lower(),
        "strategy_id": strategy_id,
        "model_version": f"{variant.lower()}-test-v1",
        "ticker": TICKER,
        "rank": 1,
        "action": "ENTER_TEST",
        "reason": "frozen prospective test signal",
        "target_weight_pct": target_weight_pct,
        "initial_stop": 8.0,
        "active_stop": 8.0,
        "stop_distance_pct": 20.0,
    }


def _bar(
    date: str,
    *,
    open_: float,
    close: float,
    volume: float = 1_000_000.0,
) -> Bar:
    return Bar(
        date=date,
        open=open_,
        high=max(open_, close) * 1.01,
        low=min(open_, close) * 0.99,
        close=close,
        volume=volume,
    )


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


class AbPerformanceTests(unittest.TestCase):
    def test_signal_freeze_is_idempotent_and_rejects_same_date_revision(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            rows = [_signal_row(strategy_id) for strategy_id in STRATEGY_IDS]

            path, created = freeze_signal_pair(root, SIGNAL_DATE, rows)
            same_path, created_again = freeze_signal_pair(
                root,
                SIGNAL_DATE,
                list(reversed(rows)),
            )

            self.assertTrue(created)
            self.assertFalse(created_again)
            self.assertEqual(path, same_path)
            self.assertEqual(len(_read_csv(root / "signal_history.csv")), 4)

            revised = [dict(row) for row in rows]
            revised[0]["reason"] = "attempted after-the-fact revision"
            with self.assertRaisesRegex(ValueError, "already frozen"):
                freeze_signal_pair(root, SIGNAL_DATE, revised)

            frozen = _read_csv(path)
            self.assertEqual(len(frozen), 4)
            self.assertEqual(
                {row["target_weight_pct"] for row in frozen},
                {"100.0"},
            )

    def test_signal_freeze_requires_one_complete_consistent_ab_pair(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            incomplete = [_signal_row(strategy_id) for strategy_id in STRATEGY_IDS[:-1]]

            with self.assertRaisesRegex(ValueError, "must contain exactly"):
                freeze_signal_pair(root, SIGNAL_DATE, incomplete)

            self.assertFalse((root / "signal_history.csv").exists())
            self.assertFalse((root / "signals" / f"signal_{SIGNAL_DATE}.csv").exists())

    def test_signal_history_is_rebuilt_from_all_authoritative_daily_files(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            first_rows = [_signal_row(strategy_id) for strategy_id in STRATEGY_IDS]
            freeze_signal_pair(root, SIGNAL_DATE, first_rows)
            (root / "signal_history.csv").write_text("interrupted write", encoding="utf-8")

            second_date = NEXT_SESSION
            second_rows = []
            for row in first_rows:
                copied = dict(row)
                copied["signal_date"] = second_date
                copied["snapshot_id"] = "snapshot-2026-07-13"
                second_rows.append(copied)
            freeze_signal_pair(root, second_date, second_rows)

            history = _read_csv(root / "signal_history.csv")
            self.assertEqual(len(history), 8)
            self.assertEqual({row["signal_date"] for row in history}, {SIGNAL_DATE, second_date})

            backfilled_date = "2026-07-09"
            backfilled_rows = []
            for row in first_rows:
                copied = dict(row)
                copied["signal_date"] = backfilled_date
                copied["snapshot_id"] = "snapshot-backfill-attempt"
                backfilled_rows.append(copied)
            with self.assertRaisesRegex(ValueError, "append-only"):
                freeze_signal_pair(root, backfilled_date, backfilled_rows)

    def test_signal_never_executes_on_close_date_and_executes_at_next_session_open(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            freeze_signal_pair(
                root,
                SIGNAL_DATE,
                [_signal_row(strategy_id) for strategy_id in STRATEGY_IDS],
            )
            histories = {
                BENCHMARK: [
                    _bar(SIGNAL_DATE, open_=4.90, close=4.85),
                    _bar(NEXT_SESSION, open_=4.86, close=4.88),
                ],
                TICKER: [
                    _bar(SIGNAL_DATE, open_=10.00, close=10.00),
                    _bar(NEXT_SESSION, open_=10.25, close=10.50),
                ],
            }
            sources = {BENCHMARK: "TEST_RAW", TICKER: "TEST_RAW"}

            freeze_price_observations(
                root / "price_observations.csv",
                histories,
                {BENCHMARK, TICKER},
                [SIGNAL_DATE],
                sources,
            )
            close_date_result = rebuild_ab_performance(
                root,
                effective_signal_date=SIGNAL_DATE,
                benchmark=BENCHMARK,
                costs=COSTS,
                minimum_paired_days=60,
            )
            self.assertEqual(close_date_result.trade_rows, [])
            self.assertTrue(
                all(not positions for positions in close_date_result.positions.values())
            )

            freeze_price_observations(
                root / "price_observations.csv",
                histories,
                {BENCHMARK, TICKER},
                [NEXT_SESSION],
                sources,
            )
            next_session_result = rebuild_ab_performance(
                root,
                effective_signal_date=SIGNAL_DATE,
                benchmark=BENCHMARK,
                costs=COSTS,
                minimum_paired_days=60,
            )

            filled_buys = [
                row
                for row in next_session_result.trade_rows
                if row["action"] == "BUY" and row["status"] == "FILLED_PAPER"
            ]
            self.assertEqual(len(filled_buys), 4)
            self.assertEqual(
                {row["execution_date"] for row in filled_buys},
                {NEXT_SESSION},
            )
            self.assertEqual(
                {row["signal_date"] for row in filled_buys},
                {SIGNAL_DATE},
            )
            self.assertEqual({row["price"] for row in filled_buys}, {10.25})
            self.assertTrue(
                all(TICKER in positions for positions in next_session_result.positions.values())
            )

    def test_buy_cost_is_deducted_and_missing_bar_carries_last_close(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            freeze_signal_pair(
                root,
                SIGNAL_DATE,
                [_signal_row(strategy_id) for strategy_id in STRATEGY_IDS],
            )
            histories = {
                BENCHMARK: [
                    _bar(SIGNAL_DATE, open_=4.90, close=4.85),
                    _bar(NEXT_SESSION, open_=4.86, close=4.88),
                    _bar(FOLLOWING_SESSION, open_=4.88, close=4.89),
                ],
                TICKER: [
                    _bar(SIGNAL_DATE, open_=10.00, close=10.00),
                    _bar(NEXT_SESSION, open_=10.00, close=11.00),
                    # Deliberately no FOLLOWING_SESSION bar: suspension/missing data.
                ],
            }
            freeze_price_observations(
                root / "price_observations.csv",
                histories,
                {BENCHMARK, TICKER},
                [SIGNAL_DATE, NEXT_SESSION, FOLLOWING_SESSION],
                {BENCHMARK: "TEST_RAW", TICKER: "TEST_RAW"},
            )

            result = rebuild_ab_performance(
                root,
                effective_signal_date=SIGNAL_DATE,
                benchmark=BENCHMARK,
                costs=COSTS,
                minimum_paired_days=60,
            )

            buys = [row for row in result.trade_rows if row["action"] == "BUY"]
            self.assertEqual(len(buys), 4)
            buy_cost_rate = (3.0 + 5.0) / 10_000.0
            for buy in buys:
                self.assertAlmostEqual(
                    float(buy["transaction_cost"]),
                    float(buy["notional"]) * buy_cost_rate,
                    places=9,
                )
                self.assertGreater(float(buy["transaction_cost"]), 0.0)

            for strategy_id in STRATEGY_IDS:
                rows = [
                    row for row in result.nav_rows if row["strategy_id"] == strategy_id
                ]
                next_session = next(
                    row for row in rows if row["valuation_date"] == NEXT_SESSION
                )
                following_session = next(
                    row for row in rows if row["valuation_date"] == FOLLOWING_SESSION
                )
                self.assertGreater(float(next_session["nav_net"]), 1.0)
                self.assertEqual(following_session["carry_forward_count"], 1)
                self.assertAlmostEqual(
                    float(following_session["nav_net"]),
                    float(next_session["nav_net"]),
                    places=9,
                )
                self.assertAlmostEqual(
                    float(following_session["daily_return_pct"]),
                    0.0,
                    places=9,
                )

            frozen_price_rows = _read_csv(root / "price_observations.csv")
            missing = next(
                row
                for row in frozen_price_rows
                if row["observation_date"] == FOLLOWING_SESSION
                and row["ticker"] == TICKER
            )
            self.assertEqual(missing["status"], "NO_BAR_CARRY_FORWARD")
            self.assertEqual(missing["close"], "")


if __name__ == "__main__":
    unittest.main()
