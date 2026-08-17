from __future__ import annotations

import hashlib
import json
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PIPELINE_SCHEMA_VERSION = "pdc-local-pipeline-v1"
CHECKPOINT_SCHEMA_VERSION = "pdc-local-checkpoint-v1"
STAGE_OUTPUT_SCHEMA_VERSION = "pdc-stage-output-v1"
ATTEMPT_FILE_NAMES = ("input.json", "config.json", "output.json", "validation.json", "checkpoint.json", "audit.json")

STAGES: tuple[tuple[str, str, tuple[str, ...]], ...] = (
    ("01", "Frozen Facts", ()),
    ("02", "Hawkeye", ("01",)),
    ("03", "Round 1 Members", ("01", "02")),
    ("04", "R1 Aggregate / Shortlist", ("03",)),
    ("05", "Round 2 Members", ("01", "04")),
    ("06", "Secretary", ("03", "04", "05")),
    ("07", "Blue Whale", ("01", "03", "05", "06")),
    ("08", "Final Gate", ("02", "04", "05", "06", "07")),
    ("09", "Final Decision", ("07", "08")),
)
STAGE_BY_ID = {stage_id: (name, parents) for stage_id, name, parents in STAGES}
STAGE_ID_RE = re.compile(r"^\d{2}$")
RUN_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$")


class PipelineError(Exception):
    """A safe, user-facing pipeline state error."""


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def canonical_hash(value: object) -> str:
    encoded = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def file_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _atomic_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{uuid.uuid4().hex}.tmp")
    encoded = json.dumps(value, ensure_ascii=False, indent=2) + "\n"
    try:
        with temporary.open("w", encoding="utf-8") as handle:
            handle.write(encoded)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    finally:
        if temporary.exists():
            temporary.unlink()


def _read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise PipelineError(f"无法读取 {path.name}") from exc
    if not isinstance(value, dict):
        raise PipelineError(f"{path.name} 必须是 JSON 对象")
    return value


def stage_name(stage_id: str) -> str:
    try:
        return STAGE_BY_ID[stage_id][0]
    except KeyError as exc:
        raise PipelineError(f"未知 Stage：{stage_id}") from exc


def stage_parents(stage_id: str) -> tuple[str, ...]:
    try:
        return STAGE_BY_ID[stage_id][1]
    except KeyError as exc:
        raise PipelineError(f"未知 Stage：{stage_id}") from exc


def _descendants(stage_id: str) -> list[str]:
    found: list[str] = []
    pending = [stage_id]
    while pending:
        current = pending.pop(0)
        for candidate, _name, parents in STAGES:
            if current in parents and candidate not in found:
                found.append(candidate)
                pending.append(candidate)
    return found


class PipelineStore:
    """Filesystem-backed Run/Attempt/Checkpoint state for the local dashboard."""

    def __init__(self, root: Path) -> None:
        self.root = root
        self.root.mkdir(parents=True, exist_ok=True)

    def _run_dir(self, run_id: str) -> Path:
        self._validate_run_id(run_id)
        return self.root / run_id

    def _run_manifest_path(self, run_id: str) -> Path:
        return self._run_dir(run_id) / "run.json"

    def _stage_dir(self, run_id: str, stage_id: str) -> Path:
        self._validate_stage_id(stage_id)
        return self._run_dir(run_id) / "stages" / f"stage-{stage_id}"

    def _attempt_dir(self, run_id: str, stage_id: str, attempt_id: str) -> Path:
        if not re.fullmatch(r"attempt-\d{3,}", attempt_id):
            raise PipelineError("Attempt ID 格式无效")
        return self._stage_dir(run_id, stage_id) / attempt_id

    @staticmethod
    def _validate_run_id(run_id: str) -> None:
        if not RUN_ID_RE.fullmatch(run_id):
            raise PipelineError("Run ID 必须是 3–80 位字母、数字、下划线或连字符")

    @staticmethod
    def _validate_stage_id(stage_id: str) -> None:
        if not STAGE_ID_RE.fullmatch(stage_id) or stage_id not in STAGE_BY_ID:
            raise PipelineError(f"未知 Stage：{stage_id}")

    def create_run(self, run_id: str | None = None, metadata: dict[str, Any] | None = None) -> dict[str, Any]:
        if run_id is not None and not isinstance(run_id, str):
            raise PipelineError("Run ID 必须是字符串")
        generated = run_id or f"local-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:6]}"
        self._validate_run_id(generated)
        target = self._run_dir(generated)
        if target.exists():
            raise PipelineError(f"Run 已存在：{generated}")
        now = _utc_now()
        manifest: dict[str, Any] = {
            "schemaVersion": PIPELINE_SCHEMA_VERSION,
            "runId": generated,
            "status": "OPEN",
            "createdAt": now,
            "updatedAt": now,
            "selectedAttempts": {},
            "metadata": metadata or {},
            "liveTrading": False,
        }
        target.mkdir(parents=True)
        _atomic_json(target / "run.json", manifest)
        # NDJSON is an append-only text log, not a JSON document.  Keep the
        # file empty until the first state transition is recorded.
        (target / "events.ndjson").touch()
        return manifest

    def load_run(self, run_id: str) -> dict[str, Any]:
        path = self._run_manifest_path(run_id)
        if not path.exists():
            raise PipelineError(f"Run 不存在：{run_id}")
        return _read_json(path)

    def _save_run(self, run: dict[str, Any]) -> None:
        run["updatedAt"] = _utc_now()
        _atomic_json(self._run_manifest_path(str(run["runId"])), run)

    def _event(self, run_id: str, event: str, payload: dict[str, Any]) -> None:
        path = self._run_dir(run_id) / "events.ndjson"
        path.parent.mkdir(parents=True, exist_ok=True)
        row = {"timestamp": _utc_now(), "event": event, **payload}
        with path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")

    def list_runs(self) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for path in sorted(self.root.glob("*/run.json"), reverse=True):
            try:
                run = _read_json(path)
            except PipelineError:
                continue
            view = self.run_view(str(run.get("runId") or path.parent.name))
            rows.append(
                {
                    "runId": view["runId"],
                    "status": view["status"],
                    "createdAt": view["createdAt"],
                    "updatedAt": view["updatedAt"],
                    "selectedStageCount": sum(stage["status"] == "VALID" for stage in view["stages"]),
                }
            )
        return rows

    def _attempt_ids(self, run_id: str, stage_id: str) -> list[str]:
        directory = self._stage_dir(run_id, stage_id)
        if not directory.exists():
            return []
        return sorted(
            (path.name for path in directory.iterdir() if path.is_dir() and re.fullmatch(r"attempt-\d{3,}", path.name)),
            reverse=True,
        )

    def _next_attempt_id(self, run_id: str, stage_id: str) -> str:
        numbers = [int(item.removeprefix("attempt-")) for item in self._attempt_ids(run_id, stage_id)]
        return f"attempt-{(max(numbers) + 1 if numbers else 1):03d}"

    def _checkpoint_path(self, run_id: str, stage_id: str, attempt_id: str) -> Path:
        return self._attempt_dir(run_id, stage_id, attempt_id) / "checkpoint.json"

    def load_checkpoint(self, run_id: str, stage_id: str, attempt_id: str) -> dict[str, Any]:
        path = self._checkpoint_path(run_id, stage_id, attempt_id)
        if not path.exists():
            raise PipelineError(f"Checkpoint 不存在：{stage_id}/{attempt_id}")
        return _read_json(path)

    def load_attempt_output(self, run_id: str, stage_id: str, attempt_id: str) -> dict[str, Any]:
        """Read an Attempt output through the state layer's safe path checks."""
        path = self._attempt_dir(run_id, stage_id, attempt_id) / "output.json"
        if not path.exists():
            raise PipelineError(f"Attempt output 不存在：{stage_id}/{attempt_id}")
        return _read_json(path)

    def attempt_file_inventory(self, run_id: str, stage_id: str, attempt_id: str) -> list[dict[str, Any]]:
        """Return the six immutable Attempt files without accepting a path from a client."""
        directory = self._attempt_dir(run_id, stage_id, attempt_id)
        if not directory.exists():
            raise PipelineError(f"Attempt 不存在：{stage_id}/{attempt_id}")
        files: list[dict[str, Any]] = []
        for name in ATTEMPT_FILE_NAMES:
            path = directory / name
            if not path.is_file():
                raise PipelineError(f"Attempt 缺少文件：{name}")
            files.append({"name": name, "bytes": path.stat().st_size, "sha256": file_hash(path)})
        return files

    def load_attempt_file(self, run_id: str, stage_id: str, attempt_id: str, name: str) -> dict[str, Any]:
        if name not in ATTEMPT_FILE_NAMES:
            raise PipelineError("不允许读取该 Attempt 文件")
        path = self._attempt_dir(run_id, stage_id, attempt_id) / name
        if not path.is_file():
            raise PipelineError(f"Attempt 文件不存在：{name}")
        return _read_json(path)

    def selected_attempt_id(self, run_id: str, stage_id: str) -> str:
        run = self.load_run(run_id)
        attempt_id = str((run.get("selectedAttempts") or {}).get(stage_id) or "")
        if not attempt_id:
            raise PipelineError(f"Stage {stage_id} 尚未选择当前 Attempt")
        checkpoint = self.load_checkpoint(run_id, stage_id, attempt_id)
        if checkpoint.get("status") != "SELECTED" or checkpoint.get("validationStatus") != "VALID":
            raise PipelineError(f"Stage {stage_id}/{attempt_id} 不是当前有效 Checkpoint")
        return attempt_id

    def load_selected_output(self, run_id: str, stage_id: str) -> dict[str, Any]:
        attempt_id = self.selected_attempt_id(run_id, stage_id)
        return self.load_attempt_output(run_id, stage_id, attempt_id)

    def _selected_parent_refs(self, run: dict[str, Any], stage_id: str) -> dict[str, str]:
        refs: dict[str, str] = {}
        for parent in stage_parents(stage_id):
            attempt_id = str(run.get("selectedAttempts", {}).get(parent) or "")
            if not attempt_id:
                raise PipelineError(f"Stage {stage_id} 依赖 Stage {parent}，但上游尚未选择 Attempt")
            checkpoint = self.load_checkpoint(str(run["runId"]), parent, attempt_id)
            if checkpoint.get("status") != "SELECTED" or checkpoint.get("validationStatus") != "VALID":
                raise PipelineError(f"Stage {parent}/{attempt_id} 不是当前有效 Checkpoint")
            refs[parent] = str(checkpoint.get("checkpointSha256") or "")
        return refs

    def _validate_attempt_files(self, run_id: str, stage_id: str, attempt_id: str) -> dict[str, Any]:
        directory = self._attempt_dir(run_id, stage_id, attempt_id)
        missing = [name for name in ATTEMPT_FILE_NAMES if not (directory / name).exists()]
        if missing:
            raise PipelineError(f"Attempt 缺少文件：{', '.join(missing)}")
        checkpoint = _read_json(directory / "checkpoint.json")
        output = _read_json(directory / "output.json")
        validation = _read_json(directory / "validation.json")
        expected_output_hash = file_hash(directory / "output.json")
        if checkpoint.get("outputSha256") != expected_output_hash:
            raise PipelineError("Attempt output hash 不一致，可能被修改")
        if output.get("runId") != run_id or output.get("stageId") != stage_id or output.get("attemptId") != attempt_id:
            raise PipelineError("Attempt output lineage 不一致")
        if checkpoint.get("checkpointSha256") != canonical_hash({key: value for key, value in checkpoint.items() if key != "checkpointSha256"}):
            raise PipelineError("Checkpoint hash 不一致")
        if validation.get("status") not in {"PENDING", "VALID", "INVALID"}:
            raise PipelineError("validation.json 状态无效")
        return checkpoint

    def create_attempt(
        self,
        run_id: str,
        stage_id: str,
        *,
        data: dict[str, Any] | None = None,
        config: dict[str, Any] | None = None,
        complete: bool = False,
        execution_mode: str = "SCHEMA_TEST_ONLY",
    ) -> dict[str, Any]:
        run = self.load_run(run_id)
        self._validate_stage_id(stage_id)
        parent_refs = self._selected_parent_refs(run, stage_id)
        attempt_id = self._next_attempt_id(run_id, stage_id)
        directory = self._attempt_dir(run_id, stage_id, attempt_id)
        directory.mkdir(parents=True)
        output = {
            "schemaVersion": STAGE_OUTPUT_SCHEMA_VERSION,
            "runId": run_id,
            "stageId": stage_id,
            "attemptId": attempt_id,
            "executionMode": execution_mode,
            "data": data or {},
        }
        config_value = config or {"pipelineSchemaVersion": PIPELINE_SCHEMA_VERSION}
        input_value = {
            "runId": run_id,
            "stageId": stage_id,
            "parentCheckpointSha256": parent_refs,
        }
        validation_status = "VALID" if complete else "PENDING"
        execution_status = "COMPLETED" if complete else "CREATED"
        validation = {
            "schemaVersion": "pdc-validation-v1",
            "status": validation_status,
            "executionStatus": execution_status,
            "checkedAt": _utc_now(),
            "errors": [],
            "warnings": ["SCHEMA_TEST_ONLY：该 Attempt 不代表真实股票分析结果"] if execution_mode == "SCHEMA_TEST_ONLY" else [],
        }
        _atomic_json(directory / "input.json", input_value)
        _atomic_json(directory / "config.json", config_value)
        _atomic_json(directory / "output.json", output)
        _atomic_json(directory / "validation.json", validation)
        _atomic_json(directory / "audit.json", {"createdAt": _utc_now(), "executionMode": execution_mode, "events": []})
        checkpoint: dict[str, Any] = {
            "schemaVersion": CHECKPOINT_SCHEMA_VERSION,
            "runId": run_id,
            "stageId": stage_id,
            "stageName": stage_name(stage_id),
            "attemptId": attempt_id,
            "status": "CANDIDATE" if complete else "INCOMPLETE",
            "validationStatus": validation_status,
            "executionStatus": execution_status,
            "executionMode": execution_mode,
            "inputCheckpointSha256": parent_refs,
            "configSha256": file_hash(directory / "config.json"),
            "outputSha256": file_hash(directory / "output.json"),
            "createdAt": _utc_now(),
            "staleReason": "",
        }
        checkpoint["checkpointSha256"] = canonical_hash(checkpoint)
        _atomic_json(directory / "checkpoint.json", checkpoint)
        self._event(run_id, "ATTEMPT_CREATED", {"stageId": stage_id, "attemptId": attempt_id, "executionMode": execution_mode})
        return checkpoint

    def validate_attempt(self, run_id: str, stage_id: str, attempt_id: str) -> dict[str, Any]:
        run = self.load_run(run_id)
        checkpoint = self._validate_attempt_files(run_id, stage_id, attempt_id)
        current_parents = self._selected_parent_refs(run, stage_id)
        if checkpoint.get("inputCheckpointSha256") != current_parents:
            checkpoint["validationStatus"] = "INVALID"
            checkpoint["staleReason"] = "INPUT_HASH_MISMATCH"
            checkpoint["checkpointSha256"] = canonical_hash({key: value for key, value in checkpoint.items() if key != "checkpointSha256"})
            _atomic_json(self._checkpoint_path(run_id, stage_id, attempt_id), checkpoint)
            raise PipelineError("Attempt 的上游 Checkpoint 已变化，不能作为当前链路版本")
        if checkpoint.get("validationStatus") == "PENDING":
            checkpoint["validationStatus"] = "VALID"
            checkpoint["status"] = "CANDIDATE"
            checkpoint["checkpointSha256"] = canonical_hash({key: value for key, value in checkpoint.items() if key != "checkpointSha256"})
            _atomic_json(self._checkpoint_path(run_id, stage_id, attempt_id), checkpoint)
        return checkpoint

    def select_attempt(self, run_id: str, stage_id: str, attempt_id: str) -> dict[str, Any]:
        run = self.load_run(run_id)
        checkpoint = self.validate_attempt(run_id, stage_id, attempt_id)
        if checkpoint.get("validationStatus") != "VALID":
            raise PipelineError("只有 VALID Attempt 才能被选择")
        selected = dict(run.get("selectedAttempts") or {})
        old_attempt = selected.get(stage_id)
        if old_attempt and old_attempt != attempt_id:
            old_checkpoint = self.load_checkpoint(run_id, stage_id, str(old_attempt))
            old_checkpoint["status"] = "SUPERSEDED"
            old_checkpoint["staleReason"] = "REPLACED_BY_SELECTED_ATTEMPT"
            old_checkpoint["checkpointSha256"] = canonical_hash({key: value for key, value in old_checkpoint.items() if key != "checkpointSha256"})
            _atomic_json(self._checkpoint_path(run_id, stage_id, str(old_attempt)), old_checkpoint)
        selected[stage_id] = attempt_id
        run["selectedAttempts"] = selected
        self._save_run(run)
        checkpoint["status"] = "SELECTED"
        checkpoint["selectedAt"] = _utc_now()
        checkpoint["staleReason"] = ""
        checkpoint["checkpointSha256"] = canonical_hash({key: value for key, value in checkpoint.items() if key != "checkpointSha256"})
        _atomic_json(self._checkpoint_path(run_id, stage_id, attempt_id), checkpoint)
        stale: list[str] = []
        for downstream in _descendants(stage_id):
            downstream_attempt = selected.get(downstream)
            if not downstream_attempt:
                continue
            downstream_checkpoint = self.load_checkpoint(run_id, downstream, str(downstream_attempt))
            downstream_checkpoint["status"] = "STALE"
            downstream_checkpoint["staleReason"] = f"UPSTREAM_SELECTION_CHANGED:{stage_id}"
            downstream_checkpoint["checkpointSha256"] = canonical_hash({key: value for key, value in downstream_checkpoint.items() if key != "checkpointSha256"})
            _atomic_json(self._checkpoint_path(run_id, downstream, str(downstream_attempt)), downstream_checkpoint)
            stale.append(downstream)
        self._event(run_id, "ATTEMPT_SELECTED", {"stageId": stage_id, "attemptId": attempt_id, "staleStages": stale})
        return {"run": self.run_view(run_id), "selectedStage": stage_id, "selectedAttempt": attempt_id, "staleStages": stale}

    def run_view(self, run_id: str) -> dict[str, Any]:
        run = self.load_run(run_id)
        stages: list[dict[str, Any]] = []
        selected = run.get("selectedAttempts") or {}
        for stage_id, name, parents in STAGES:
            attempts: list[dict[str, Any]] = []
            for attempt_id in self._attempt_ids(run_id, stage_id):
                try:
                    checkpoint = self.load_checkpoint(run_id, stage_id, attempt_id)
                except PipelineError as exc:
                    checkpoint = {"attemptId": attempt_id, "status": "CORRUPT", "validationStatus": "INVALID", "error": str(exc)}
                attempts.append(
                    {
                        "attemptId": attempt_id,
                        "status": checkpoint.get("status", "UNKNOWN"),
                        "validationStatus": checkpoint.get("validationStatus", "UNKNOWN"),
                        "executionMode": checkpoint.get("executionMode", ""),
                        "createdAt": checkpoint.get("createdAt", ""),
                        "staleReason": checkpoint.get("staleReason", ""),
                    }
                )
            selected_attempt = str(selected.get(stage_id) or "")
            selected_checkpoint = None
            if selected_attempt:
                selected_checkpoint = next((item for item in attempts if item["attemptId"] == selected_attempt), None)
            if selected_checkpoint and selected_checkpoint["status"] == "STALE":
                status = "STALE"
            elif selected_checkpoint and selected_checkpoint["status"] == "SELECTED":
                status = "VALID"
            elif attempts:
                status = "CANDIDATE"
            else:
                status = "NOT_STARTED"
            stages.append(
                {
                    "stageId": stage_id,
                    "name": name,
                    "parents": list(parents),
                    "status": status,
                    "selectedAttempt": selected_attempt,
                    "attempts": attempts,
                }
            )
        return {
            "runId": run["runId"],
            "status": run.get("status", "OPEN"),
            "createdAt": run.get("createdAt", ""),
            "updatedAt": run.get("updatedAt", ""),
            "selectedAttempts": selected,
            "metadata": run.get("metadata", {}),
            "liveTrading": False,
            "stages": stages,
        }

    def resume_plan(self, run_id: str) -> dict[str, Any]:
        view = self.run_view(run_id)
        first = next((stage for stage in view["stages"] if stage["status"] in {"NOT_STARTED", "CANDIDATE", "STALE"}), None)
        if first is None:
            return {"runId": run_id, "status": "COMPLETE", "resumeFrom": None, "stages": []}
        index = next(index for index, stage in enumerate(view["stages"]) if stage["stageId"] == first["stageId"])
        return {
            "runId": run_id,
            "status": "RESUMABLE",
            "resumeFrom": first["stageId"],
            "stages": [stage["stageId"] for stage in view["stages"][index:]],
        }

    def diff_attempts(self, run_id: str, stage_id: str, left_attempt: str, right_attempt: str) -> dict[str, Any]:
        left_dir = self._attempt_dir(run_id, stage_id, left_attempt)
        right_dir = self._attempt_dir(run_id, stage_id, right_attempt)
        left = _read_json(left_dir / "output.json")
        right = _read_json(right_dir / "output.json")
        changes: list[dict[str, Any]] = []

        def walk(path: str, left_value: Any, right_value: Any) -> None:
            if isinstance(left_value, dict) and isinstance(right_value, dict):
                for key in sorted(set(left_value) | set(right_value)):
                    child = f"{path}.{key}" if path else key
                    if key not in left_value:
                        changes.append({"path": child, "kind": "ADDED", "right": right_value[key]})
                    elif key not in right_value:
                        changes.append({"path": child, "kind": "REMOVED", "left": left_value[key]})
                    else:
                        walk(child, left_value[key], right_value[key])
                return
            if isinstance(left_value, list) and isinstance(right_value, list):
                if left_value != right_value:
                    changes.append({"path": path, "kind": "CHANGED", "left": left_value, "right": right_value})
                return
            if left_value != right_value:
                changes.append({"path": path, "kind": "CHANGED", "left": left_value, "right": right_value})

        walk("", left, right)
        return {
            "runId": run_id,
            "stageId": stage_id,
            "leftAttempt": left_attempt,
            "rightAttempt": right_attempt,
            "sameInput": _read_json(left_dir / "input.json") == _read_json(right_dir / "input.json"),
            "changes": changes,
        }
