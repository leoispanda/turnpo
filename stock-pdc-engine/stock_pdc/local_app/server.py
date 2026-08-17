from __future__ import annotations

import argparse
import json
import mimetypes
import os
import shutil
import subprocess
import threading
import webbrowser
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlsplit

from .codex_jobs import CodexJobManager
from .pipeline import PipelineError, PipelineStore, STAGES as PIPELINE_STAGES
from .stage_executor import execute_stage


PROJECT_ROOT = Path(__file__).resolve().parents[2]
UI_ROOT = Path(__file__).resolve().parent / "ui"
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8765
MAX_BODY_BYTES = 32 * 1024
CODEX_FALLBACK = Path("/Applications/ChatGPT.app/Contents/Resources/codex")

STAGES = tuple((stage_id, name) for stage_id, name, _parents in PIPELINE_STAGES)
PIPELINE = PipelineStore(PROJECT_ROOT / "runs")
CODEX_JOBS = CodexJobManager(PIPELINE)


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def find_codex() -> Path | None:
    discovered = shutil.which("codex")
    if discovered:
        return Path(discovered)
    if CODEX_FALLBACK.exists():
        return CODEX_FALLBACK
    return None


def codex_status() -> dict[str, Any]:
    path = find_codex()
    if path is None:
        return {
            "status": "NOT_INSTALLED",
            "path": "",
            "version": "",
            "message": "Codex CLI was not found on this Mac.",
        }
    try:
        completed = subprocess.run(
            [str(path), "--version"],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
    except (OSError, subprocess.SubprocessError) as exc:
        return {
            "status": "UNAVAILABLE",
            "path": str(path),
            "version": "",
            "message": str(exc),
        }
    version = (completed.stdout or completed.stderr).strip().splitlines()[0] if (completed.stdout or completed.stderr).strip() else ""
    if completed.returncode != 0:
        return {
            "status": "UNAVAILABLE",
            "path": str(path),
            "version": version,
            "message": f"Codex returned exit code {completed.returncode}.",
        }
    return {
        "status": "READY",
        "path": str(path),
        "version": version,
        "message": "Codex CLI is available for the local bridge.",
    }


def _manifest_rows() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    roots = (PROJECT_ROOT / "runs", PROJECT_ROOT / "outputs" / "runs")
    seen: set[str] = set()
    for root in roots:
        if not root.exists():
            continue
        for manifest_path in sorted(root.glob("*/manifest.json"), reverse=True):
            try:
                manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            run_id = str(manifest.get("run_id") or manifest.get("runId") or manifest_path.parent.name)
            if run_id in seen:
                continue
            seen.add(run_id)
            rows.append(
                {
                    "runId": run_id,
                    "status": str(manifest.get("status") or "UNKNOWN"),
                    "analysisDate": str(manifest.get("analysis_date") or manifest.get("analysisDate") or ""),
                    "marketDataDate": str(manifest.get("market_data_date") or manifest.get("marketDataDate") or ""),
                    "candidateCount": manifest.get("candidate_count", manifest.get("candidateCount", "")),
                    "path": str(manifest_path.parent),
                }
            )
    return rows


def system_status(port: int | None = None) -> dict[str, Any]:
    actual_port = port if port is not None else int(os.environ.get("PDC_LOCAL_PORT", DEFAULT_PORT))
    return {
        "service": {
            "status": "READY",
            "host": DEFAULT_HOST,
            "port": actual_port,
            "projectRoot": str(PROJECT_ROOT),
            "timestamp": _utc_now(),
        },
        "codex": codex_status(),
        "pipeline": {
            "status": "LOCAL_STAGE_ENGINE_READY",
            "stageCount": len(STAGES),
            "message": "批准门 C 第一部分已完成；本地确定性 Stage 执行、Attempt 和 Checkpoint 已就绪。",
        },
        "liveTrading": False,
    }


def _stage_rows() -> list[dict[str, str]]:
    return [{"stageId": stage_id, "name": name, "status": "NOT_STARTED"} for stage_id, name in STAGES]


def _all_run_rows() -> list[dict[str, Any]]:
    rows = PIPELINE.list_runs()
    known = {str(row.get("runId")) for row in rows}
    for row in _manifest_rows():
        if str(row.get("runId")) not in known:
            rows.append(row)
    return rows


class LocalRequestHandler(BaseHTTPRequestHandler):
    server_version = "PDC-Local/0.1"
    protocol_version = "HTTP/1.1"

    def log_message(self, format: str, *args: object) -> None:
        # Keep the local dashboard quiet; errors are returned to the browser and
        # the launcher remains readable when it is started from Terminal.
        if args and str(args[1]) not in {"200", "304"}:
            super().log_message(format, *args)

    def _is_loopback(self) -> bool:
        return self.client_address[0] in {"127.0.0.1", "::1"}

    def _send_json(self, payload: object, status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_text(self, body: bytes, content_type: str, status: HTTPStatus = HTTPStatus.OK) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict[str, Any]:
        raw_length = self.headers.get("Content-Length", "0")
        try:
            length = int(raw_length)
        except ValueError as exc:
            raise ValueError("Invalid request length") from exc
        if length < 0 or length > MAX_BODY_BYTES:
            raise ValueError("Request body is too large")
        raw = self.rfile.read(length)
        if not raw:
            return {}
        value = json.loads(raw.decode("utf-8"))
        if not isinstance(value, dict):
            raise ValueError("Request body must be a JSON object")
        return value

    def do_GET(self) -> None:  # noqa: N802
        if not self._is_loopback():
            self._send_json({"error": "PDC Local only accepts loopback requests."}, HTTPStatus.FORBIDDEN)
            return
        parsed = urlsplit(self.path)
        path = parsed.path
        if path == "/api/health":
            self._send_json({"ok": True, "service": "pdc-local", "timestamp": _utc_now()})
            return
        if path == "/api/system/status":
            self._send_json(system_status(int(self.server.server_address[1])))
            return
        if path == "/api/runs":
            self._send_json({"runs": _all_run_rows()})
            return
        if path.startswith("/api/runs/"):
            segments = [segment for segment in path.split("/") if segment]
            run_id = segments[2] if len(segments) > 2 else ""
            if len(segments) == 5 and segments[3] == "codex-jobs":
                try:
                    self._send_json({"job": CODEX_JOBS.get_job(run_id, segments[4])})
                except PipelineError as exc:
                    self._send_json({"error": str(exc)}, HTTPStatus.NOT_FOUND)
                return
            if len(segments) == 6 and segments[3] == "codex-jobs" and segments[5] == "events":
                # Events remain a local audit file. The job summary is enough
                # for the initial dashboard; raw event streaming is purposely
                # not exposed as a general log-reader endpoint.
                try:
                    self._send_json({"job": CODEX_JOBS.get_job(run_id, segments[4])})
                except PipelineError as exc:
                    self._send_json({"error": str(exc)}, HTTPStatus.NOT_FOUND)
                return
            if len(segments) == 6 and segments[3] == "stages" and segments[5] == "diff":
                stage_id = segments[4]
                query = parse_qs(parsed.query)
                left_attempt = (query.get("left") or [""])[0]
                right_attempt = (query.get("right") or [""])[0]
                try:
                    self._send_json(PIPELINE.diff_attempts(run_id, stage_id, left_attempt, right_attempt))
                except PipelineError as exc:
                    self._send_json({"error": str(exc)}, HTTPStatus.CONFLICT)
                return
            if len(segments) == 8 and segments[3] == "stages" and segments[5] == "attempts" and segments[7] == "files":
                try:
                    self._send_json({"files": PIPELINE.attempt_file_inventory(run_id, segments[4], segments[6])})
                except PipelineError as exc:
                    self._send_json({"error": str(exc)}, HTTPStatus.CONFLICT)
                return
            if len(segments) == 9 and segments[3] == "stages" and segments[5] == "attempts" and segments[7] == "files":
                try:
                    self._send_json(
                        {
                            "file": segments[8],
                            "content": PIPELINE.load_attempt_file(run_id, segments[4], segments[6], segments[8]),
                        }
                    )
                except PipelineError as exc:
                    self._send_json({"error": str(exc)}, HTTPStatus.CONFLICT)
                return
            if len(segments) == 7 and segments[3] == "stages" and segments[5] == "attempts":
                stage_id = segments[4]
                attempt_id = segments[6]
                try:
                    self._send_json(
                        {
                            "checkpoint": PIPELINE.load_checkpoint(run_id, stage_id, attempt_id),
                            "output": PIPELINE.load_attempt_output(run_id, stage_id, attempt_id),
                        }
                    )
                except PipelineError as exc:
                    self._send_json({"error": str(exc)}, HTTPStatus.CONFLICT)
                return
            try:
                self._send_json({"run": PIPELINE.run_view(run_id), "resume": PIPELINE.resume_plan(run_id)})
            except PipelineError:
                run = next((row for row in _manifest_rows() if row["runId"] == run_id), None)
                if run is None:
                    self._send_json({"error": "Run not found", "runId": run_id}, HTTPStatus.NOT_FOUND)
                    return
                self._send_json({"run": run, "stages": _stage_rows()})
            return
        self._serve_static(self.path)

    def do_POST(self) -> None:  # noqa: N802
        if not self._is_loopback():
            self._send_json({"error": "PDC Local only accepts loopback requests."}, HTTPStatus.FORBIDDEN)
            return
        try:
            body = self._read_json()
            parsed = urlsplit(self.path)
            path = parsed.path
            if path == "/api/runs":
                allowed = {"runId", "metadata"}
                if set(body) - allowed:
                    raise ValueError("新建 Run 只接受 runId 和 metadata")
                metadata = body.get("metadata", {})
                if not isinstance(metadata, dict):
                    raise ValueError("metadata 必须是 JSON 对象")
                run = PIPELINE.create_run(body.get("runId"), metadata)
                self._send_json({"ok": True, "run": PIPELINE.run_view(str(run["runId"]))}, HTTPStatus.CREATED)
                return
            if path == "/api/codex/open":
                self._open_codex(body)
                return
            if path == "/api/server/stop":
                self._send_json({"ok": True, "message": "PDC Local is stopping."})
                threading.Thread(target=self.server.shutdown, daemon=True).start()
                return
            if path.startswith("/api/runs/"):
                segments = [segment for segment in path.split("/") if segment]
                run_id = segments[2] if len(segments) > 2 else ""
                if len(segments) == 4 and segments[3] == "resume":
                    self._send_json(PIPELINE.resume_plan(run_id))
                    return
                if len(segments) == 6 and segments[3] == "stages" and segments[5] == "execute":
                    allowed = {"config", "select"}
                    if set(body) - allowed:
                        raise ValueError("执行 Stage 只接受 config 和 select")
                    config = body.get("config", {})
                    if not isinstance(config, dict):
                        raise ValueError("config 必须是 JSON 对象")
                    checkpoint = execute_stage(PIPELINE, run_id, segments[4], config)
                    selected = False
                    if bool(body.get("select", False)):
                        PIPELINE.select_attempt(run_id, segments[4], str(checkpoint["attemptId"]))
                        selected = True
                    self._send_json(
                        {
                            "ok": True,
                            "checkpoint": checkpoint,
                            "selected": selected,
                            "run": PIPELINE.run_view(run_id),
                        },
                        HTTPStatus.CREATED,
                    )
                    return
                if len(segments) == 6 and segments[3] == "stages" and segments[5] == "codex-review":
                    if body:
                        raise ValueError("Codex 复核不接受页面传入的提示词、路径或命令")
                    codex = find_codex()
                    if codex is None:
                        self._send_json({"error": codex_status()["message"]}, HTTPStatus.SERVICE_UNAVAILABLE)
                        return
                    job = CODEX_JOBS.start_stage_review(run_id, segments[4], codex)
                    self._send_json({"ok": True, "job": job}, HTTPStatus.CREATED)
                    return
                if len(segments) == 6 and segments[3] == "stages" and segments[5] == "attempts":
                    stage_id = segments[4]
                    allowed = {"data", "config", "complete", "executionMode"}
                    if set(body) - allowed:
                        raise ValueError("创建 Attempt 只接受 data、config、complete 和 executionMode")
                    data = body.get("data", {})
                    config = body.get("config", {})
                    if not isinstance(data, dict) or not isinstance(config, dict):
                        raise ValueError("data 和 config 必须是 JSON 对象")
                    checkpoint = PIPELINE.create_attempt(
                        run_id,
                        stage_id,
                        data=data,
                        config=config,
                        complete=bool(body.get("complete", False)),
                        execution_mode=str(body.get("executionMode") or "SCHEMA_TEST_ONLY"),
                    )
                    self._send_json({"ok": True, "checkpoint": checkpoint}, HTTPStatus.CREATED)
                    return
                if len(segments) == 8 and segments[3] == "stages" and segments[5] == "attempts" and segments[7] == "validate":
                    checkpoint = PIPELINE.validate_attempt(run_id, segments[4], segments[6])
                    self._send_json({"ok": True, "checkpoint": checkpoint})
                    return
                if len(segments) == 6 and segments[3] == "stages" and segments[5] == "select":
                    allowed = {"attemptId"}
                    if set(body) != allowed:
                        raise ValueError("选择 Attempt 只接受 attemptId")
                    result = PIPELINE.select_attempt(run_id, segments[4], str(body["attemptId"]))
                    self._send_json({"ok": True, **result})
                    return
                if len(segments) == 6 and segments[3] == "codex-jobs" and segments[5] == "cancel":
                    if body:
                        raise ValueError("取消 Codex 复核不接受额外参数")
                    self._send_json({"ok": True, "job": CODEX_JOBS.cancel_job(run_id, segments[4])})
                    return
            self._send_json({"error": "Unknown local action."}, HTTPStatus.NOT_FOUND)
        except PipelineError as exc:
            self._send_json({"error": str(exc)}, HTTPStatus.CONFLICT)
        except (OSError, ValueError, json.JSONDecodeError) as exc:
            self._send_json({"error": str(exc)}, HTTPStatus.BAD_REQUEST)

    def _open_codex(self, body: dict[str, Any]) -> None:
        if body:
            raise ValueError("The Codex open action does not accept arbitrary paths or commands.")
        path = find_codex()
        if path is None:
            self._send_json({"ok": False, "codex": codex_status()}, HTTPStatus.SERVICE_UNAVAILABLE)
            return
        process = subprocess.Popen(
            [str(path), "app", str(PROJECT_ROOT)],
            cwd=PROJECT_ROOT,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
        self._send_json(
            {
                "ok": True,
                "message": "Codex desktop launch requested.",
                "pid": process.pid,
                "workspace": str(PROJECT_ROOT),
            }
        )

    def _serve_static(self, request_path: str) -> None:
        relative = request_path.split("?", 1)[0].lstrip("/") or "index.html"
        if relative == "":
            relative = "index.html"
        candidate = (UI_ROOT / relative).resolve()
        try:
            candidate.relative_to(UI_ROOT.resolve())
        except ValueError:
            self._send_json({"error": "Invalid static path."}, HTTPStatus.NOT_FOUND)
            return
        if not candidate.is_file():
            self._send_json({"error": "Page not found."}, HTTPStatus.NOT_FOUND)
            return
        content_type = mimetypes.guess_type(candidate.name)[0] or "application/octet-stream"
        try:
            self._send_text(candidate.read_bytes(), f"{content_type}; charset=utf-8" if content_type.startswith("text/") else content_type)
        except OSError as exc:
            self._send_json({"error": str(exc)}, HTTPStatus.INTERNAL_SERVER_ERROR)


def serve(host: str = DEFAULT_HOST, port: int = DEFAULT_PORT, open_browser: bool = False) -> None:
    httpd = ThreadingHTTPServer((host, port), LocalRequestHandler)
    url = f"http://{host}:{port}/"
    print(f"选股神器 listening at {url}", flush=True)
    print(f"Workspace: {PROJECT_ROOT}", flush=True)
    print(f"Codex: {codex_status()['status']}", flush=True)
    print("Live trading: DISABLED", flush=True)
    if open_browser:
        threading.Timer(0.5, webbrowser.open, args=(url,)).start()
    try:
        httpd.serve_forever(poll_interval=0.25)
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()
        print("选股神器 stopped.", flush=True)


def main() -> int:
    parser = argparse.ArgumentParser(description="Start the local 选股神器 dashboard.")
    parser.add_argument("--host", default=DEFAULT_HOST, help="Bind address; loopback is the safe default.")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PDC_LOCAL_PORT", DEFAULT_PORT)))
    parser.add_argument("--no-browser", action="store_true", help="Do not open a browser automatically.")
    args = parser.parse_args()
    if args.host not in {DEFAULT_HOST, "::1"}:
        parser.error("PDC Local must bind to loopback (127.0.0.1 or ::1).")
    serve(args.host, args.port, open_browser=not args.no_browser)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
