from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

from stock_pdc.local_app.codex_jobs import CodexJobManager
from stock_pdc.local_app.pipeline import PipelineError, PipelineStore


class CodexJobTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.store = PipelineStore(Path(self.temp_dir.name) / "runs")
        self.run_id = "codex-job-001"
        self.store.create_run(
            self.run_id,
            {"source": "test", "secret": "must-not-leave-run", "executionConfig": {"topN": 20, "asOf": "2026-08-11", "dataDir": "private-path"}},
        )
        self.jobs = CodexJobManager(self.store)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _complete_and_select(self, stage_id: str, data: dict[str, object]) -> None:
        checkpoint = self.store.create_attempt(self.run_id, stage_id, data=data, complete=True, execution_mode="TEST")
        self.store.select_attempt(self.run_id, stage_id, str(checkpoint["attemptId"]))

    def test_review_workspace_contains_only_selected_parent_evidence(self) -> None:
        self._complete_and_select("01", {"facts": "frozen"})
        self._complete_and_select("02", {"candidates": ["000001.SZ"]})

        job = self.jobs.prepare_stage_review(self.run_id, "03", Path(sys.executable))
        workspace = Path(str(job["workspace"]))
        self.assertEqual(sorted(path.name for path in workspace.iterdir()), ["input.json", "output_schema.json", "task.json"])
        payload = json.loads((workspace / "input.json").read_text(encoding="utf-8"))
        self.assertEqual(set(payload["selectedParents"]), {"01", "02"})
        self.assertFalse(payload["liveTrading"])
        self.assertEqual(payload["runMetadata"], {"executionConfig": {"topN": 20, "asOf": "2026-08-11"}})
        self.assertEqual(self.store.run_view(self.run_id)["stages"][2]["status"], "NOT_STARTED")

        command = self.jobs._command(job, Path(sys.executable))
        self.assertIn("exec", command)
        self.assertIn("read-only", command)
        self.assertNotIn("--dangerously-bypass-approvals-and-sandbox", command)
        self.assertNotIn("workspace-write", command)

    def test_review_requires_selected_parents_and_allows_only_review_stages(self) -> None:
        with self.assertRaisesRegex(PipelineError, "Stage 01 尚未选择"):
            self.jobs.prepare_stage_review(self.run_id, "03", Path(sys.executable))
        with self.assertRaisesRegex(PipelineError, "不开放 Codex 复核"):
            self.jobs.prepare_stage_review(self.run_id, "01", Path(sys.executable))

    def test_result_contract_rejects_malformed_payload(self) -> None:
        self.assertFalse(self.jobs._valid_result({"status": "COMPLETED"}))
        self.assertTrue(
            self.jobs._valid_result(
                {"status": "COMPLETED", "summary": "research only", "findings": [], "riskFlags": [], "evidenceIds": []}
            )
        )


if __name__ == "__main__":
    unittest.main()
