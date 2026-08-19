"""Committee roster and local agent CLI discovery.

This module owns *who* sits on the sustainable committee and *which* locally
installed executable speaks for each seat.  It holds no provider key, performs
no network call, and never invokes a model itself.

A seat is only usable when its CLI is actually present on this Mac.  A missing
CLI is reported as missing; it is never silently replaced by another seat, and
an absent member never becomes a fabricated result.
"""

from __future__ import annotations

import os
import re
import shutil
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from ..committee_audit import MODEL_IDS


# Discovery falls back to known install locations only after PATH lookup fails,
# mirroring the existing dashboard behaviour for Codex.
CODEX_FALLBACKS: tuple[Path, ...] = (
    Path("/Applications/ChatGPT.app/Contents/Resources/codex"),
)
CLAUDE_FALLBACKS: tuple[Path, ...] = (
    # Where the official native installer places the CLI.
    Path.home() / ".local" / "bin" / "claude",
    Path.home() / ".claude" / "local" / "claude",
    Path("/opt/homebrew/bin/claude"),
    Path("/usr/local/bin/claude"),
)

# macOS Keychain service holding the Claude CLI's long-lived token. The token is
# never stored in this repository, in a dotfile, or in a shell history entry.
CLAUDE_KEYCHAIN_SERVICE = "pdc-claude-oauth-token"

# The Claude desktop app keeps its downloaded CLI under a version directory, so
# the newest install is discovered by pattern rather than by a pinned version
# that would silently break on the next update.
CLAUDE_GLOBS: tuple[str, ...] = (
    "Library/Application Support/Claude/claude-code/*/claude.app/Contents/MacOS/claude",
)

_VERSION_RE = re.compile(r"\d+(?:\.\d+)*")


def _version_key(path: Path) -> tuple[int, ...]:
    """Sort key taken from the nearest version-shaped directory in the path."""
    for parent in path.parents:
        if _VERSION_RE.fullmatch(parent.name):
            return tuple(int(part) for part in parent.name.split("."))
    return ()


def _glob_candidates(patterns: tuple[str, ...]) -> list[Path]:
    found = [
        path
        for pattern in patterns
        for path in Path.home().glob(pattern)
        if path.is_file() and os.access(path, os.X_OK)
    ]
    return sorted(found, key=_version_key, reverse=True)

# Where each CLI leaves the answer we care about.
RESULT_FROM_FILE = "file"
RESULT_FROM_STDOUT = "stdout"


@dataclass(frozen=True)
class Runner:
    """A locally installed agent CLI able to answer one bounded question.

    ``argv`` is deliberately built in one place: when a CLI changes a flag, the
    fix is a single edit here rather than a rewrite of the committee logic.
    """

    runner_id: str
    executable_name: str
    fallbacks: tuple[Path, ...]
    result_source: str
    globs: tuple[str, ...] = ()
    # A CLI that cannot inherit desktop-app credentials needs its own token.
    # The value is read at call time and never written to disk or logged.
    token_env_var: str = ""
    keychain_service: str = ""

    def resolve(self) -> Path | None:
        """Find this CLI: PATH first, then known locations, then newest bundle."""
        discovered = shutil.which(self.executable_name)
        if discovered:
            return Path(discovered)
        explicit = next((path for path in self.fallbacks if path.is_file()), None)
        if explicit is not None:
            return explicit
        return next(iter(_glob_candidates(self.globs)), None)

    def argv(
        self,
        executable: Path,
        workspace: Path,
        schema_path: Path,
        result_path: Path,
        prompt: str,
        schema_json: str = "{}",
    ) -> list[str]:
        """Build the command for this CLI.

        The two CLIs disagree about how a schema is supplied: Codex reads it from
        a file, Claude Code expects the JSON inline. Both forms are produced here
        so the rest of the committee stays unaware of the difference.
        """
        if self.runner_id == "codex":
            return [
                str(executable),
                "exec",
                "-C",
                str(workspace),
                "--skip-git-repo-check",
                "-s",
                "read-only",
                "--output-schema",
                str(schema_path),
                "-o",
                str(result_path),
                prompt,
            ]
        if self.runner_id == "claude":
            # Claude Code prints a JSON envelope on stdout. The schema is passed
            # explicitly so both seats face the same structural constraint; left
            # off, this seat answers free-form while Codex is held to contract.
            return [
                str(executable),
                "-p",
                prompt,
                "--output-format",
                "json",
                "--json-schema",
                schema_json,
                "--allowed-tools",
                "",
            ]
        raise ValueError(f"unknown runner: {self.runner_id}")


# Codex inherits credentials from the ChatGPT desktop app, so it needs no token.
CODEX_RUNNER = Runner("codex", "codex", CODEX_FALLBACKS, RESULT_FROM_FILE)
CLAUDE_RUNNER = Runner(
    "claude",
    "claude",
    CLAUDE_FALLBACKS,
    RESULT_FROM_STDOUT,
    CLAUDE_GLOBS,
    token_env_var="CLAUDE_CODE_OAUTH_TOKEN",
    keychain_service=CLAUDE_KEYCHAIN_SERVICE,
)

RUNNERS: dict[str, Runner] = {
    CODEX_RUNNER.runner_id: CODEX_RUNNER,
    CLAUDE_RUNNER.runner_id: CLAUDE_RUNNER,
}


@dataclass(frozen=True)
class Member:
    """One committee seat.

    ``model_id`` must stay inside :data:`stock_pdc.committee_audit.MODEL_IDS`
    so results recorded by this package remain valid for the existing audit
    contract and performance database.
    """

    member_id: str
    display_name: str
    model_id: str
    runner_id: str

    @property
    def runner(self) -> Runner:
        return RUNNERS[self.runner_id]


# "Sol" is the local name for the GPT-side seat, which speaks through Codex.
DEFAULT_ROSTER: tuple[Member, ...] = (
    Member("sol", "Sol", "gpt", "codex"),
    Member("claude", "Claude", "claude", "claude"),
)


def validate_roster(roster: tuple[Member, ...]) -> None:
    """Reject a roster the audit layer would later be unable to record."""
    if len(roster) < 2:
        raise ValueError("委员会至少需要两个成员才能进行同行复核")
    seen_members: set[str] = set()
    seen_models: set[str] = set()
    for member in roster:
        if member.member_id in seen_members:
            raise ValueError(f"成员 ID 重复：{member.member_id}")
        if member.model_id in seen_models:
            raise ValueError(f"模型 ID 重复：{member.model_id}")
        if member.model_id not in MODEL_IDS:
            raise ValueError(f"模型 ID 不在审计契约允许范围内：{member.model_id}")
        if member.runner_id not in RUNNERS:
            raise ValueError(f"未知的本地 CLI：{member.runner_id}")
        seen_members.add(member.member_id)
        seen_models.add(member.model_id)


def member_status(member: Member) -> dict[str, Any]:
    """Report whether this seat can actually run, without invoking anything."""
    executable = member.runner.resolve()
    return {
        "memberId": member.member_id,
        "displayName": member.display_name,
        "modelId": member.model_id,
        "runnerId": member.runner_id,
        "available": executable is not None,
        "executable": str(executable) if executable else "",
        "message": (
            f"{member.display_name} 可用" if executable
            else f"未在本机找到 {member.runner.executable_name} 命令，该席位不可用"
        ),
    }


def roster_status(roster: tuple[Member, ...] = DEFAULT_ROSTER) -> dict[str, Any]:
    validate_roster(roster)
    members = [member_status(member) for member in roster]
    available = [item for item in members if item["available"]]
    return {
        "members": members,
        "availableCount": len(available),
        "quorumMet": len(available) >= 2,
    }
