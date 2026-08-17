from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from stock_pdc.local_app.pipeline import PipelineError, PipelineStore


class LocalPipelineTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.store = PipelineStore(Path(self.temp_dir.name) / "runs")
        self.store.create_run("test-run-001")

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _complete_and_select(self, stage_id: str, data: dict[str, object]) -> str:
        checkpoint = self.store.create_attempt("test-run-001", stage_id, data=data, complete=True)
        attempt_id = str(checkpoint["attemptId"])
        self.store.select_attempt("test-run-001", stage_id, attempt_id)
        return attempt_id

    def test_attempt_selection_and_stale_propagation(self) -> None:
        self._complete_and_select("01", {"facts": "v1"})
        self._complete_and_select("02", {"candidates": ["600001.SH"]})
        self._complete_and_select("03", {"opinions": ["round1-v1"]})
        self._complete_and_select("04", {"shortlist": ["600001.SH"]})

        replacement = self.store.create_attempt("test-run-001", "03", data={"opinions": ["round1-v2"]}, complete=True)
        self.store.select_attempt("test-run-001", "03", str(replacement["attemptId"]))
        view = self.store.run_view("test-run-001")
        statuses = {stage["stageId"]: stage["status"] for stage in view["stages"]}
        self.assertEqual(statuses["03"], "VALID")
        self.assertEqual(statuses["04"], "STALE")
        self.assertEqual(self.store.resume_plan("test-run-001")["resumeFrom"], "04")

    def test_events_log_starts_as_empty_ndjson_text(self) -> None:
        events_path = Path(self.temp_dir.name) / "runs" / "test-run-001" / "events.ndjson"
        self.assertEqual(events_path.read_text(encoding="utf-8"), "")

    def test_diff_reports_changed_output_without_selecting_attempt(self) -> None:
        first = self.store.create_attempt("test-run-001", "01", data={"value": 1}, complete=True)
        second = self.store.create_attempt("test-run-001", "01", data={"value": 2}, complete=True)
        diff = self.store.diff_attempts("test-run-001", "01", str(first["attemptId"]), str(second["attemptId"]))
        self.assertTrue(diff["sameInput"])
        self.assertTrue(any(change["path"].endswith("data.value") for change in diff["changes"]))
        self.assertEqual(self.store.run_view("test-run-001")["stages"][0]["status"], "CANDIDATE")

    def test_attempt_audit_inventory_exposes_all_and_only_contract_files(self) -> None:
        checkpoint = self.store.create_attempt("test-run-001", "01", data={"facts": "visible"}, complete=True)
        attempt_id = str(checkpoint["attemptId"])
        files = self.store.attempt_file_inventory("test-run-001", "01", attempt_id)
        self.assertEqual(
            [item["name"] for item in files],
            ["input.json", "config.json", "output.json", "validation.json", "checkpoint.json", "audit.json"],
        )
        self.assertTrue(all(int(item["bytes"]) > 0 and len(str(item["sha256"])) == 64 for item in files))
        self.assertEqual(self.store.load_attempt_file("test-run-001", "01", attempt_id, "output.json")["data"]["facts"], "visible")
        with self.assertRaisesRegex(PipelineError, "不允许读取"):
            self.store.load_attempt_file("test-run-001", "01", attempt_id, "../run.json")

    def test_upstream_change_invalidates_old_attempt_input(self) -> None:
        first = self._complete_and_select("01", {"facts": "v1"})
        stage_two = self.store.create_attempt("test-run-001", "02", data={"candidates": ["A"]}, complete=True)
        replacement = self.store.create_attempt("test-run-001", "01", data={"facts": "v2"}, complete=True)
        self.store.select_attempt("test-run-001", "01", str(replacement["attemptId"]))
        with self.assertRaisesRegex(PipelineError, "上游 Checkpoint 已变化"):
            self.store.validate_attempt("test-run-001", "02", str(stage_two["attemptId"]))
        self.assertNotEqual(first, replacement)


if __name__ == "__main__":
    unittest.main()
