"""Invoke one local agent CLI inside a bounded, single-purpose workspace.

Every invocation gets a fresh directory containing only the files that seat is
allowed to read.  The prompt is owned by this module; no caller-supplied path or
shell command reaches the CLI.  A response that does not parse, or that fails
the caller's expectation, is a failure — it is never repaired into a result.
"""

from __future__ import annotations

import json
import os
import subprocess
from collections.abc import Callable, Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .roster import RESULT_FROM_FILE, Member, Runner


# A seat that has not answered within this window is treated as unavailable for
# the round rather than retried indefinitely.
DEFAULT_TIMEOUT_SECONDS = 180
MAX_CAPTURED_OUTPUT = 64 * 1024

# Where a seat's credential came from. These names are safe to log; the value
# they describe never is.
TOKEN_NOT_REQUIRED = "not-required"
TOKEN_FROM_ENVIRONMENT = "environment"
TOKEN_FROM_KEYCHAIN = "keychain"
TOKEN_MISSING = "missing"

KEYCHAIN_TIMEOUT_SECONDS = 15

# The local smoke contract mirrors the provider readiness gate already used by
# the metered gateway, so both paths prove liveness the same way.
SMOKE_PROMPT = (
    'Here is the input: {"provider_test": true, "echo": 7}. Reply with only JSON '
    "matching the supplied schema: set `provider_test` to the value you were "
    "given, and set `score` to the value of `echo`. Do not browse, do not use "
    "tools, do not read any file, and do not add commentary or extra fields."
)
SMOKE_INPUT: dict[str, Any] = {"provider_test": True, "echo": 7}
# The expected answer is derivable only from the supplied input, not from the
# wording of the instruction: an earlier version stated the answer in the prompt
# and so proved liveness while proving nothing about comprehension.
SMOKE_EXPECTED: dict[str, Any] = {"provider_test": True, "score": 7}
SMOKE_SCHEMA: dict[str, Any] = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": False,
    "required": ["provider_test", "score"],
    "properties": {
        "provider_test": {"type": "boolean"},
        "score": {"type": "integer"},
    },
}


@dataclass(frozen=True)
class RunnerOutcome:
    """What one CLI invocation produced, including why it failed."""

    ok: bool
    output: dict[str, Any] | None
    command: list[str]
    exit_code: int | None
    error: str
    stdout_excerpt: str
    token_source: str = TOKEN_NOT_REQUIRED

    def to_json(self) -> dict[str, Any]:
        return {
            "ok": self.ok,
            "output": self.output,
            # The command is surfaced so a wrong CLI flag is visible and fixable
            # instead of hiding behind a generic failure. It carries no secret:
            # credentials travel in the child environment, never in argv.
            "command": self.command,
            "exitCode": self.exit_code,
            "error": self.error,
            "stdoutExcerpt": self.stdout_excerpt,
            # Where the credential came from, never the credential itself.
            "tokenSource": self.token_source,
        }


def keychain_secret(service: str) -> str:
    """Read one secret from the macOS Keychain.

    The value is returned to the caller and injected straight into a child
    process environment; it is never written to a file, an event log, or a
    reported command line.
    """
    try:
        completed = subprocess.run(
            ["security", "find-generic-password", "-s", service, "-w"],
            capture_output=True,
            text=True,
            timeout=KEYCHAIN_TIMEOUT_SECONDS,
        )
    except (OSError, subprocess.TimeoutExpired):
        return ""
    if completed.returncode != 0:
        return ""
    return (completed.stdout or "").strip()


def resolve_token(
    runner: Runner,
    environ: Mapping[str, str],
    lookup: Callable[[str], str] = keychain_secret,
) -> tuple[str, str]:
    """Return ``(token, source)`` for one seat.

    An already-exported variable wins so a scheduled job can supply the token
    directly; the Keychain is the fallback for interactive use.
    """
    if not runner.token_env_var:
        return "", TOKEN_NOT_REQUIRED
    existing = str(environ.get(runner.token_env_var, "")).strip()
    if existing:
        return existing, TOKEN_FROM_ENVIRONMENT
    if runner.keychain_service:
        stored = lookup(runner.keychain_service).strip()
        if stored:
            return stored, TOKEN_FROM_KEYCHAIN
    return "", TOKEN_MISSING


def inline_schema_json(schema: dict[str, Any]) -> str:
    """Serialize a schema for a CLI that takes it inline on the command line.

    The `$schema` meta-reference is dropped: a CLI that cannot resolve
    "https://json-schema.org/draft/2020-12/schema" rejects the whole schema and
    the seat then answers with no structural constraint at all. The file form
    keeps the key, because the other CLI reads it happily.
    """
    stripped = {key: value for key, value in schema.items() if key != "$schema"}
    return json.dumps(stripped, ensure_ascii=False, separators=(",", ":"))


def _write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _first_json_object(text: str) -> dict[str, Any] | None:
    """Extract the first balanced JSON object from CLI output.

    Agent CLIs may wrap an answer in a transcript envelope or a fenced block.
    Scanning is tolerant on purpose; the caller still validates the result, so a
    lenient parse never turns into a lenient acceptance.
    """
    depth = 0
    start = -1
    in_string = False
    escaped = False
    for index, character in enumerate(text):
        if in_string:
            if escaped:
                escaped = False
            elif character == "\\":
                escaped = True
            elif character == '"':
                in_string = False
            continue
        if character == '"':
            in_string = True
            continue
        if character == "{":
            if depth == 0:
                start = index
            depth += 1
            continue
        if character == "}" and depth:
            depth -= 1
            if depth == 0 and start >= 0:
                try:
                    parsed = json.loads(text[start : index + 1])
                except json.JSONDecodeError:
                    start = -1
                    continue
                if isinstance(parsed, dict):
                    return parsed
                start = -1
    return None


def _unwrap(payload: dict[str, Any]) -> dict[str, Any]:
    """Return the answer carried inside a CLI transcript envelope, if any."""
    inner = payload.get("result")
    if isinstance(inner, dict):
        return inner
    if isinstance(inner, str):
        nested = _first_json_object(inner)
        if nested is not None:
            return nested
    return payload


def invoke(
    member: Member,
    workspace: Path,
    prompt: str,
    schema: dict[str, Any],
    input_payload: dict[str, Any],
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
) -> RunnerOutcome:
    """Run one bounded question against one seat and return its parsed answer."""
    executable = member.runner.resolve()
    if executable is None:
        return RunnerOutcome(
            ok=False,
            output=None,
            command=[],
            exit_code=None,
            error=f"未在本机找到 {member.runner.executable_name} 命令",
            stdout_excerpt="",
        )

    token, token_source = resolve_token(member.runner, os.environ)
    if token_source == TOKEN_MISSING:
        return RunnerOutcome(
            ok=False,
            output=None,
            command=[],
            exit_code=None,
            error=(
                f"{member.display_name} 缺少认证令牌："
                f"未设置 {member.runner.token_env_var}，钥匙串中也没有 "
                f"{member.runner.keychain_service}"
            ),
            stdout_excerpt="",
            token_source=token_source,
        )

    workspace.mkdir(parents=True, exist_ok=True)
    _write_json(workspace / "input.json", input_payload)
    schema_path = workspace / "output_schema.json"
    _write_json(schema_path, schema)
    result_path = workspace / "result.json"
    command = member.runner.argv(
        executable,
        workspace,
        schema_path,
        result_path,
        prompt,
        inline_schema_json(schema),
    )

    environment = os.environ.copy()
    if token:
        environment[member.runner.token_env_var] = token

    try:
        completed = subprocess.run(
            command,
            cwd=str(workspace),
            env=environment,
            stdin=subprocess.DEVNULL,
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            start_new_session=True,
        )
    except subprocess.TimeoutExpired:
        return RunnerOutcome(
            ok=False,
            output=None,
            command=command,
            exit_code=None,
            error=f"{member.display_name} 在 {timeout_seconds} 秒内没有返回",
            stdout_excerpt="",
            token_source=token_source,
        )
    except OSError as exc:
        return RunnerOutcome(
            False, None, command, None, f"无法启动 CLI：{exc}", "", token_source
        )

    stdout = (completed.stdout or "")[:MAX_CAPTURED_OUTPUT]
    stderr = (completed.stderr or "")[:MAX_CAPTURED_OUTPUT]
    excerpt = stdout.strip() or stderr.strip()

    if completed.returncode != 0:
        return RunnerOutcome(
            ok=False,
            output=None,
            command=command,
            exit_code=completed.returncode,
            error=f"{member.display_name} 退出码 {completed.returncode}",
            stdout_excerpt=excerpt[:2000],
            token_source=token_source,
        )

    payload: dict[str, Any] | None = None
    if member.runner.result_source == RESULT_FROM_FILE and result_path.is_file():
        try:
            candidate = json.loads(result_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            candidate = None
        if isinstance(candidate, dict):
            payload = _unwrap(candidate)
    if payload is None:
        candidate = _first_json_object(stdout)
        if candidate is not None:
            payload = _unwrap(candidate)

    if payload is None:
        return RunnerOutcome(
            ok=False,
            output=None,
            command=command,
            exit_code=completed.returncode,
            error=f"{member.display_name} 没有返回可解析的 JSON",
            stdout_excerpt=excerpt[:2000],
            token_source=token_source,
        )

    return RunnerOutcome(
        True, payload, command, completed.returncode, "", excerpt[:400], token_source
    )


def smoke(member: Member, workspace: Path, timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS) -> dict[str, Any]:
    """Prove one seat can answer a fixed question with exact structured JSON."""
    outcome = invoke(
        member,
        workspace,
        SMOKE_PROMPT,
        SMOKE_SCHEMA,
        SMOKE_INPUT,
        timeout_seconds=timeout_seconds,
    )
    result = {
        "memberId": member.member_id,
        "displayName": member.display_name,
        "runnerId": member.runner_id,
        **outcome.to_json(),
    }
    if outcome.ok and outcome.output != SMOKE_EXPECTED:
        # Reaching the CLI is not the same as getting a contract-shaped answer.
        result["ok"] = False
        result["error"] = "返回的 JSON 与约定的 smoke 结果不一致"
    return result
