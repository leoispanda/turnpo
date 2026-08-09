from __future__ import annotations

import csv
import sqlite3
import tempfile
import unittest
from pathlib import Path

from stock_pdc.decision_memory import record_completed_run, record_failed_run
from stock_pdc.models import Bar, ScorerResult, StockEvaluation


ROLE_SCORES = {
    "market_regime": 7.0,
    "trend": 7.0,
    "livermore": 7.0,
    "volume_price": 7.0,
    "candlestick": 5.0,
    "overheat": 5.0,
    "risk": 3.0,
    "zhuge_orion": 5.0,
    "chair": 7.0,
}


def evaluation(latest: Bar) -> StockEvaluation:
    scores = {key: ScorerResult(score, f"{key} factual summary") for key, score in ROLE_SCORES.items()}
    return StockEvaluation(
        ticker="600001.SH",
        final_score=7.0,
        rank=1,
        status="Strong Watch",
        suggested_action="Strong Watch",
        scores=scores,
        short_reason="real PDC conclusion",
        main_risk="real risk summary",
        latest_date=latest.date,
        latest_close=latest.close,
    )


class DecisionMemoryTests(unittest.TestCase):
    def _write_audit(self, path: Path) -> None:
        with path.open("w", encoding="utf-8", newline="") as file:
            writer = csv.DictWriter(file, fieldnames=["ticker", "passed", "total_mcap", "return_60d", "reason", "rejection_reason"])
            writer.writeheader()
            writer.writerow({"ticker": "600001.SH", "passed": "True", "total_mcap": "31000000000", "return_60d": "4.2", "reason": "fixed Hawkeye rules", "rejection_reason": ""})

    def test_records_real_role_scores_and_resolves_only_when_future_bars_exist(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            database = root / "performance.sqlite"
            report = root / "report.md"
            logs = root / "logs"
            audit = root / "hawkeye.csv"
            self._write_audit(audit)
            first = Bar("2026-01-01", 10, 10, 10, 10, 1)
            result = record_completed_run(database, report, logs, "2026-01-01", {"600001.SH": [first]}, [evaluation(first)], audit, 20)

            self.assertTrue(result["log"].exists())
            log = result["log"].read_text(encoding="utf-8")
            self.assertIn("Final decision: BUY", log)
            self.assertIn("NOT_EXECUTED_RESEARCH_ONLY", log)
            self.assertIn("No AI model was invoked", log)

            bars = [Bar(f"2026-02-{index + 1:02d}", 10, 10, 10, 10 + index * 0.1, 1) for index in range(21)]
            bars[0] = first
            record_completed_run(database, report, logs, "2026-02-21", {"600001.SH": bars}, [evaluation(bars[-1])], audit, 20)

            with sqlite3.connect(database) as connection:
                trend = connection.execute("SELECT outcome_status, is_correct, outcome_return_pct FROM role_predictions WHERE role_key = 'trend' ORDER BY prediction_id LIMIT 1").fetchone()
                risk = connection.execute("SELECT outcome_status, is_correct FROM role_predictions WHERE role_key = 'risk' ORDER BY prediction_id LIMIT 1").fetchone()
            self.assertEqual(trend[0], "RESOLVED")
            self.assertEqual(trend[1], 1)
            self.assertGreater(trend[2], 0)
            self.assertEqual(risk, ("RESOLVED", 0))
            report_text = report.read_text(encoding="utf-8")
            self.assertIn("Trend Follower", report_text)
            self.assertIn("No actual AI model predictions", report_text)

    def test_failed_execution_is_recorded_without_scores(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            path = record_failed_run(root / "logs", root / "performance.sqlite", "2026-02-01", "market data unavailable", 20)
            self.assertIn("Status: FAILED", path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
