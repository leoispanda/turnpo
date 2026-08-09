from __future__ import annotations

import csv
import json
import tempfile
import unittest
from pathlib import Path

from stock_pdc.outputs import CANDIDATE_UNIVERSE_HEADERS, FULL_SCORE_HEADERS
from stock_pdc.run_artifacts import stage_verified_run


class RunArtifactsTests(unittest.TestCase):
    def _write_csv(self, path: Path, headers: list[str], rows: list[dict[str, object]]) -> None:
        with path.open("w", encoding="utf-8", newline="") as file:
            writer = csv.DictWriter(file, fieldnames=headers)
            writer.writeheader()
            writer.writerows(rows)

    def test_verified_run_requires_one_pdc_score_per_hawkeye_candidate(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            outputs = Path(temporary)
            candidate_rows = [{"ticker": "600001.SH", "passed": True}]
            self._write_csv(outputs / "candidate_universe.csv", CANDIDATE_UNIVERSE_HEADERS, candidate_rows)
            self._write_csv(outputs / "hawkeye_radar_audit.csv", CANDIDATE_UNIVERSE_HEADERS, candidate_rows)
            self._write_csv(outputs / "full_pdc_scores.csv", FULL_SCORE_HEADERS, [{"ticker": "600001.SH", "rank": 1}])

            artifact_dir = stage_verified_run(outputs, "stock-pdc-test-1", {"analysis_date": "2026-08-07"})
            manifest = json.loads((artifact_dir / "manifest.json").read_text(encoding="utf-8"))

            self.assertEqual(manifest["status"], "READY")
            self.assertEqual(manifest["candidate_count"], 1)
            self.assertEqual(manifest["pdc_count"], 1)
            self.assertEqual(manifest["market_count"], 1)
            self.assertIn("manifest_payload_sha256", manifest)
            display = json.loads((artifact_dir / "display.json").read_text(encoding="utf-8"))
            self.assertEqual(display["verification"]["status"], "VERIFIED")
            self.assertEqual(display["days"][0]["rows"][0]["ticker"], "600001.SH")
            package = json.loads((artifact_dir / "committee" / "02_market_data_package" / "market_data_package.json").read_text(encoding="utf-8"))
            self.assertEqual(package["schemaVersion"], "stock-pdc-market-data-package-v1")
            self.assertTrue(package["packageSha256"])
            self.assertTrue((outputs / "latest_ready_run.json").exists())

    def test_verified_run_rejects_missing_pdc_scores(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            outputs = Path(temporary)
            candidate_rows = [{"ticker": "600001.SH", "passed": True}]
            self._write_csv(outputs / "candidate_universe.csv", CANDIDATE_UNIVERSE_HEADERS, candidate_rows)
            self._write_csv(outputs / "hawkeye_radar_audit.csv", CANDIDATE_UNIVERSE_HEADERS, candidate_rows)
            self._write_csv(outputs / "full_pdc_scores.csv", FULL_SCORE_HEADERS, [])

            with self.assertRaisesRegex(ValueError, "Every Hawkeye candidate"):
                stage_verified_run(outputs, "stock-pdc-test-2", {})

    def test_verified_run_rejects_scores_for_the_wrong_ticker(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            outputs = Path(temporary)
            candidate_rows = [{"ticker": "600001.SH", "passed": True}]
            self._write_csv(outputs / "candidate_universe.csv", CANDIDATE_UNIVERSE_HEADERS, candidate_rows)
            self._write_csv(outputs / "hawkeye_radar_audit.csv", CANDIDATE_UNIVERSE_HEADERS, candidate_rows)
            self._write_csv(outputs / "full_pdc_scores.csv", FULL_SCORE_HEADERS, [{"ticker": "000001.SZ", "rank": 1}])

            with self.assertRaisesRegex(ValueError, "match the Hawkeye candidate tickers exactly"):
                stage_verified_run(outputs, "stock-pdc-test-3", {})


if __name__ == "__main__":
    unittest.main()
