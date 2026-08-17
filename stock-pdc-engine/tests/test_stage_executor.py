from __future__ import annotations

import csv
import tempfile
import unittest
from pathlib import Path

from stock_pdc.local_app.pipeline import PipelineStore
from stock_pdc.local_app.stage_executor import execute_stage


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def _write_bars(path: Path, base: float) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["date", "open", "high", "low", "close", "volume"])
        for index in range(220):
            close = base + index * 0.1
            writer.writerow([f"2026-01-{index + 1:03d}", close, close + 0.2, close - 0.2, close, 1000 + index])


class StageExecutorTests(unittest.TestCase):
    def test_full_local_stage_flow_creates_selected_attempts(self) -> None:
        with tempfile.TemporaryDirectory(dir=PROJECT_ROOT) as temp_root:
            root = Path(temp_root)
            data_dir = root / "prices"
            data_dir.mkdir()
            _write_bars(data_dir / "000001.SZ.csv", 10)
            _write_bars(data_dir / "CSI300ETF.csv", 4)
            metadata = root / "universe.csv"
            with metadata.open("w", encoding="utf-8", newline="") as handle:
                writer = csv.writer(handle)
                writer.writerow(["ticker", "name", "total_mcap"])
                writer.writerow(["000001.SZ", "Test Stock", "50000000000"])
                writer.writerow(["CSI300ETF", "Benchmark", ""])

            store = PipelineStore(root / "runs")
            run_id = "stage-exec-001"
            store.create_run(
                run_id,
                {
                    "executionConfig": {
                        "dataDir": str(data_dir.relative_to(PROJECT_ROOT)),
                        "metadataCsv": str(metadata.relative_to(PROJECT_ROOT)),
                        "topN": 1,
                        "asOf": "2026-08-11",
                    }
                },
            )

            for stage_id in ["01", "02", "03", "04", "05", "06", "07", "08", "09"]:
                checkpoint = execute_stage(store, run_id, stage_id)
                store.select_attempt(run_id, stage_id, str(checkpoint["attemptId"]))

            view = store.run_view(run_id)
            self.assertTrue(all(stage["status"] == "VALID" for stage in view["stages"]))
            final_output = store.load_selected_output(run_id, "09")["data"]
            self.assertTrue(final_output["researchOnly"])
            self.assertFalse(final_output["liveTrading"])
            self.assertIn("decisions", final_output)


if __name__ == "__main__":
    unittest.main()
