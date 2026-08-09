from __future__ import annotations

import csv
import json
import tempfile
import unittest
from pathlib import Path

from stock_pdc.committee_audit import MODEL_IDS, summarize_model_consensus, validate_model_result, write_committee_stage
from stock_pdc.decision_memory import record_committee_model_stage, write_performance_report
from stock_pdc.outputs import CANDIDATE_UNIVERSE_HEADERS, FULL_SCORE_HEADERS
from stock_pdc.run_artifacts import stage_verified_run


class CommitteeAuditTests(unittest.TestCase):
    def _write_csv(self, path: Path, headers: list[str], rows: list[dict[str, object]]) -> None:
        with path.open("w", encoding="utf-8", newline="") as file:
            writer = csv.DictWriter(file, fieldnames=headers)
            writer.writeheader()
            writer.writerows(rows)

    def _run_dir(self, root: Path) -> Path:
        row = {"ticker": "600001.SH", "passed": True, "name": "样本", "latest_close": 10.0}
        self._write_csv(root / "candidate_universe.csv", CANDIDATE_UNIVERSE_HEADERS, [row])
        self._write_csv(root / "hawkeye_radar_audit.csv", CANDIDATE_UNIVERSE_HEADERS, [row])
        self._write_csv(root / "full_pdc_scores.csv", FULL_SCORE_HEADERS, [{"ticker": "600001.SH", "rank": 1, "final_score": 7.2}])
        return stage_verified_run(root, "committee-test", {"analysis_date": "2026-08-09", "market_data_date": "2026-08-09"})

    def test_validates_real_or_failed_model_results_and_writes_once(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            run_dir = self._run_dir(Path(temporary))
            package = json.loads((run_dir / "committee" / "02_market_data_package" / "market_data_package.json").read_text(encoding="utf-8"))
            result = validate_model_result(
                {
                    "modelId": "gpt",
                    "modelVersion": "gpt-real-version",
                    "status": "COMPLETED",
                    "marketDataPackageSha256": package["packageSha256"],
                    "opinions": [{"ticker": "600001.SH", "score": 7.5, "confidence": 0.7, "decision": "BUY", "summary": "Real callback summary", "evidenceIds": ["fact-1"]}],
                },
                package["packageSha256"],
            )
            failed = validate_model_result(
                {"modelId": "claude", "modelVersion": "claude-real-version", "status": "FAILED", "failureReason": "provider timeout", "marketDataPackageSha256": package["packageSha256"]},
                package["packageSha256"],
            )
            consensus = summarize_model_consensus([result, failed])
            self.assertEqual(consensus["completedModels"], ["gpt"])
            self.assertFalse(consensus["minimumQuorumMet"])
            stage = write_committee_stage(run_dir, "01", "COMPLETED", {"market_data_package": package["packageSha256"]}, {"validatedModels": [result, failed]})
            self.assertTrue((stage / "manifest.json").exists())
            with self.assertRaises(FileExistsError):
                write_committee_stage(run_dir, "01", "COMPLETED", {"market_data_package": package["packageSha256"]}, {})

    def test_rejects_completed_result_without_real_summary(self) -> None:
        with self.assertRaisesRegex(ValueError, "real summary"):
            validate_model_result(
                {"modelId": "gpt", "modelVersion": "x", "status": "COMPLETED", "marketDataPackageSha256": "a" * 64, "opinions": [{"ticker": "600001.SH", "score": 7, "confidence": 0.5, "decision": "BUY", "summary": ""}]},
                "a" * 64,
            )

    def test_round_model_results_are_saved_for_future_performance(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            run_dir = self._run_dir(root)
            package = json.loads((run_dir / "committee" / "02_market_data_package" / "market_data_package.json").read_text(encoding="utf-8"))
            raw_results = []
            for model_id in MODEL_IDS:
                if model_id == "gpt":
                    raw_results.append({"modelId": model_id, "modelVersion": "real", "status": "COMPLETED", "marketDataPackageSha256": package["packageSha256"], "opinions": [{"ticker": "600001.SH", "score": 7, "confidence": 0.6, "decision": "BUY", "summary": "Real provider output"}]})
                else:
                    raw_results.append({"modelId": model_id, "modelVersion": "real", "status": "FAILED", "failureReason": "real provider unavailable", "marketDataPackageSha256": package["packageSha256"]})
            normalized = [validate_model_result(item, package["packageSha256"]) for item in raw_results]
            write_committee_stage(run_dir, "03", "COMPLETED", {"market_data_package": package["packageSha256"]}, {"modelResults": normalized, "programmaticConsensus": summarize_model_consensus(normalized)})
            database = root / "performance.sqlite"
            self.assertEqual(record_committee_model_stage(database, run_dir, "03"), 1)
            report = root / "performance.md"
            write_performance_report(database, report)
            self.assertIn("gpt", report.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
