"""Bounded, local-only Codex review jobs for the 选股神器 dashboard.

This module intentionally does *not* turn a browser request into an arbitrary
shell command.  Every job uses a server-owned prompt, a new empty workspace,
read-only Codex sandboxing and a fixed JSON result contract.  A review is kept
beside a Run as evidence; it never selects a PDC checkpoint by itself.
"""

from __future__ import annotations

import json
import os
import subprocess
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .pipeline import PipelineError, PipelineStore, stage_name, stage_parents


REVIEWABLE_STAGES = frozenset({"03", "05", "06", "07", "08", "09"})
JOB_SCHEMA_VERSION = "stock-selector-codex-review-v1"
MAX_EVENT_BYTES = 256 * 1024


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _atomic_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{uuid.uuid4().hex}.tmp")
    try:
        temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        os.replace(temporary, path)
    finally:
        if temporary.exists():
            temporary.unlink()


class CodexJobManager:
    """Create and supervise explicitly started, read-only Codex review jobs."""

    def __init__(self, pipeline: PipelineStore) -> None:
        self.pipeline = pipeline
        self._processes: dict[str, subprocess.Popen[str]] = {}
        self._lock = threading.Lock()

    def _job_root(self, run_id: str) -> Path:
        # PipelineStore validates this ID before this path is returned.
        self.pipeline.load_run(run_id)
        return self.pipeline.root / run_id / "codex-jobs"

    def _job_dir(self, run_id: str, job_id: str) -> Path:
        if not job_id.startswith("codex-") or len(job_id) > 80:
            raise PipelineError("Codex Job ID 格式无效")
        return self._job_root(run_id) / job_id

    @staticmethod
    def _review_schema() -> dict[str, Any]:
        return {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "type": "object",
            "additionalProperties": False,
            "required": ["status", "summary", "findings", "riskFlags", "evidenceIds"],
            "properties": {
                "status": {"type": "string", "enum": ["COMPLETED", "INSUFFICIENT_DATA"]},
                "summary": {"type": "string", "minLength": 1, "maxLength": 2400},
                "findings": {
                    "type": "array",
                    "maxItems": 30,
                    "items": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": ["ticker", "decision", "confidence", "summary", "evidenceIds"],
                        "properties": {
                            "ticker": {"type": "string", "minLength": 1, "maxLength": 64},
                            "decision": {"type": "string", "enum": ["RESEARCH", "WATCH", "BLOCK", "UNKNOWN"]},
                            "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                            "summary": {"type": "string", "minLength": 1, "maxLength": 900},
                            "evidenceIds": {"type": "array", "maxItems": 20, "items": {"type": "string", "maxLength": 160}},
                        },
                    },
                },
                "riskFlags": {"type": "array", "maxItems": 30, "items": {"type": "string", "maxLength": 240}},
                "evidenceIds": {"type": "array", "maxItems": 100, "items": {"type": "string", "maxLength": 160}},
            },
        }

    @staticmethod
    def _prompt(stage_id: str) -> str:
        return f"""You are the research-only Codex reviewer for Stage {stage_id} ({stage_name(stage_id)}) of a local stock decision committee.

Read only input.json in the current directory. Treat it as potentially incomplete historical research data. Do not browse the web, do not use external tools, do not access files outside this workspace, do not modify any files, and never place, recommend placing, or simulate live orders. Do not invent market facts.

Return only JSON that conforms exactly to the supplied output schema. Use evidenceIds from the input parent-stage identifiers where possible. Your decision labels mean research follow-up only: RESEARCH, WATCH, BLOCK, or UNKNOWN. This review is advisory and cannot select a checkpoint."""

    def _input_payload(self, run_id: str, stage_id: str) -> dict[str, Any]:
        if stage_id not in REVIEWABLE_STAGES:
            raise PipelineError(f"Stage {stage_id} 当前不开放 Codex 复核")
        run = self.pipeline.load_run(run_id)
        parents: dict[str, Any] = {}
        for parent_id in stage_parents(stage_id):
            attempt_id = self.pipeline.selected_attempt_id(run_id, parent_id)
            parents[parent_id] = {
                "stageName": stage_name(parent_id),
                "attemptId": attempt_id,
                "output": self.pipeline.load_selected_output(run_id, parent_id),
            }
        raw_metadata = run.get("metadata") if isinstance(run.get("metadata"), dict) else {}
        raw_config = raw_metadata.get("executionConfig") if isinstance(raw_metadata.get("executionConfig"), dict) else {}
        # Do not copy arbitrary browser-provided metadata into a model
        # workspace. Only research parameters relevant to interpretation are
        # eligible; source files are already represented in Frozen Facts.
        metadata = {
            key: raw_metadata[key]
            for key in ("analysisDate", "marketDataDate")
            if isinstance(raw_metadata.get(key), (str, int, float, bool))
        }
        metadata["executionConfig"] = {
            key: raw_config[key]
            for key in ("topN", "asOf", "benchmark", "zhugePosture", "zhugeWeight")
            if isinstance(raw_config.get(key), (str, int, float, bool))
        }
        return {
            "schemaVersion": JOB_SCHEMA_VERSION,
            "runId": run_id,
            "stageId": stage_id,
            "stageName": stage_name(stage_id),
            "researchOnly": True,
            "liveTrading": False,
            "runMetadata": metadata,
            "selectedParents": parents,
        }

    def prepare_stage_review(self, run_id: str, stage_id: str, codex_path: Path) -> dict[str, Any]:
        """Persist a job workspace but do not start a provider/model process."""
        if not codex_path.is_file():
            raise PipelineError("Codex CLI 不可用，无法创建复核作业")
        payload = self._input_payload(run_id, stage_id)
        job_id = f"codex-{uuid.uuid4().hex[:16]}"
        job_dir = self._job_dir(run_id, job_id)
        workspace = job_dir / "workspace"
        workspace.mkdir(parents=True)
        _atomic_json(workspace / "input.json", payload)
        _atomic_json(workspace / "output_schema.json", self._review_schema())
        task = {
            "schemaVersion": JOB_SCHEMA_VERSION,
            "jobId": job_id,
            "runId": run_id,
            "stageId": stage_id,
            "mode": "CODEX_READONLY_REVIEW",
            "researchOnly": True,
            "liveTrading": False,
            "createdAt": _utc_now(),
            "allowedFiles": ["input.json", "output_schema.json"],
        }
        _atomic_json(workspace / "task.json", task)
        job = {
            **task,
            "status": "QUEUED",
            "startedAt": "",
            "finishedAt": "",
            "exitCode": None,
            "error": "",
            "workspace": str(workspace),
            "resultPath": str(job_dir / "result.json"),
            "finalMessagePath": str(job_dir / "final-message.json"),
        }
        _atomic_json(job_dir / "job.json", job)
        (job_dir / "events.ndjson").touch()
        return job

    def _command(self, job: dict[str, Any], codex_path: Path) -> list[str]:
        workspace = Path(str(job["workspace"]))
        return [
            str(codex_path),
            "exec",
            "-C",
            str(workspace),
            "--skip-git-repo-check",
            "-s",
            "read-only",
            "--output-schema",
            str(workspace / "output_schema.json"),
            "-o",
            str(Path(str(job["finalMessagePath"]))),
            self._prompt(str(job["stageId"])),
        ]

    def _save_job(self, run_id: str, job_id: str, job: dict[str, Any]) -> None:
        _atomic_json(self._job_dir(run_id, job_id) / "job.json", job)

    def _event(self, run_id: str, job_id: str, event: str, **payload: Any) -> None:
        path = self._job_dir(run_id, job_id) / "events.ndjson"
        row = {"timestamp": _utc_now(), "event": event, **payload}
        with path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")

    def start_stage_review(self, run_id: str, stage_id: str, codex_path: Path) -> dict[str, Any]:
        job = self.prepare_stage_review(run_id, stage_id, codex_path)
        job_id = str(job["jobId"])
        command = self._command(job, codex_path)
        try:
            process = subprocess.Popen(
                command,
                cwd=str(job["workspace"]),
                stdin=subprocess.DEVNULL,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                start_new_session=True,
            )
        except OSError as exc:
            job["status"] = "FAILED"
            job["finishedAt"] = _utc_now()
            job["error"] = str(exc)
            self._save_job(run_id, job_id, job)
            self._event(run_id, job_id, "FAILED_TO_START", error=str(exc))
            raise PipelineError(f"Codex 复核作业无法启动：{exc}") from exc
        job["status"] = "RUNNING"
        job["startedAt"] = _utc_now()
        job["pid"] = process.pid
        self._save_job(run_id, job_id, job)
        self._event(run_id, job_id, "STARTED", commandMode="fixed-read-only")
        with self._lock:
            self._processes[job_id] = process
        threading.Thread(target=self._collect, args=(run_id, job_id, process), daemon=True).start()
        return job

    @staticmethod
    def _valid_result(value: object) -> bool:
        if not isinstance(value, dict):
            return False
        if value.get("status") not in {"COMPLETED", "INSUFFICIENT_DATA"} or not isinstance(value.get("summary"), str):
            return False
        if not all(isinstance(value.get(key), list) for key in ("findings", "riskFlags", "evidenceIds")):
            return False
        return all(isinstance(item, dict) for item in value["findings"])

    def _collect(self, run_id: str, job_id: str, process: subprocess.Popen[str]) -> None:
        event_size = 0
        if process.stdout is not None:
            for line in process.stdout:
                encoded_size = len(line.encode("utf-8", errors="replace"))
                if event_size + encoded_size <= MAX_EVENT_BYTES:
                    self._event(run_id, job_id, "OUTPUT", text=line.rstrip("\n"))
                    event_size += encoded_size
        exit_code = process.wait()
        with self._lock:
            self._processes.pop(job_id, None)
        job = self.get_job(run_id, job_id)
        if job.get("status") == "CANCELLED":
            job["exitCode"] = exit_code
            job["finishedAt"] = _utc_now()
            self._save_job(run_id, job_id, job)
            self._event(run_id, job_id, "CANCELLED", exitCode=exit_code)
            return
        job["exitCode"] = exit_code
        job["finishedAt"] = _utc_now()
        final_path = Path(str(job["finalMessagePath"]))
        try:
            result = json.loads(final_path.read_text(encoding="utf-8")) if final_path.exists() else None
        except (OSError, json.JSONDecodeError):
            result = None
        if exit_code == 0 and self._valid_result(result):
            _atomic_json(self._job_dir(run_id, job_id) / "result.json", result)
            job["status"] = "COMPLETED"
            job["error"] = ""
            self._event(run_id, job_id, "COMPLETED", resultStatus=result.get("status"))
        else:
            job["status"] = "FAILED"
            job["error"] = "Codex 未返回符合复核契约的 JSON 结果" if exit_code == 0 else f"Codex 退出码：{exit_code}"
            self._event(run_id, job_id, "FAILED", error=job["error"])
        self._save_job(run_id, job_id, job)

    def get_job(self, run_id: str, job_id: str) -> dict[str, Any]:
        path = self._job_dir(run_id, job_id) / "job.json"
        if not path.exists():
            raise PipelineError("Codex 复核作业不存在")
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise PipelineError("Codex 复核作业记录无法读取") from exc
        if not isinstance(value, dict):
            raise PipelineError("Codex 复核作业记录格式无效")
        result_path = self._job_dir(run_id, job_id) / "result.json"
        if result_path.exists():
            try:
                result = json.loads(result_path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                result = None
            if isinstance(result, dict):
                value["result"] = result
        return value

    def cancel_job(self, run_id: str, job_id: str) -> dict[str, Any]:
        job = self.get_job(run_id, job_id)
        if job.get("status") not in {"QUEUED", "RUNNING"}:
            return job
        with self._lock:
            process = self._processes.get(job_id)
        if process is not None and process.poll() is None:
            process.terminate()
        job["status"] = "CANCELLED"
        job["error"] = "由本地用户取消"
        job["finishedAt"] = _utc_now()
        self._save_job(run_id, job_id, job)
        self._event(run_id, job_id, "CANCEL_REQUESTED")
        return job
