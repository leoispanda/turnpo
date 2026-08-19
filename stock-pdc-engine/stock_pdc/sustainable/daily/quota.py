"""The call budget, and the ledger that proves it was kept.

A subscription seat is not free: it is a five-hour window that a careless run
empties before lunch. The daily path is therefore built around a hard number —
four calls per model per day — and the budget is enforced in code rather than
assumed from the shape of the pipeline.

Every call is recorded whether it succeeded or not, with how much text went in,
how much came back, and how long it took. When a run degrades, the ledger is
what shows why.
"""

from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Callable

from ..roster import Member
from ..runner import DEFAULT_TIMEOUT_SECONDS, RunnerOutcome, invoke


QUOTA_SCHEMA_VERSION = "pdc-daily-quota-v1"

# The whole point of the daily shape. Round 1 and Round 3 take one call each;
# Round 2 is allowed a second only to fetch the candidates a truncated first
# answer left out.
MAX_CALLS_PER_MEMBER = 4

ROUND_DISCOVERY = "discovery"
ROUND_DETAIL = "detail"
ROUND_REVIEW = "review"

ROUND_BUDGET: dict[str, int] = {
    ROUND_DISCOVERY: 1,
    ROUND_DETAIL: 2,
    ROUND_REVIEW: 1,
}


class QuotaExceeded(RuntimeError):
    """A round asked for a call the daily budget does not have."""


@dataclass(frozen=True)
class CallRecord:
    round_id: str
    member_id: str
    attempt: int
    ok: bool
    prompt_chars: int
    output_chars: int
    seconds: float
    error: str = ""


@dataclass
class QuotaLedger:
    """Counts calls per seat and refuses the one that would break the budget."""

    max_calls_per_member: int = MAX_CALLS_PER_MEMBER
    records: list[CallRecord] = field(default_factory=list)

    def calls(self, member_id: str) -> int:
        return sum(1 for record in self.records if record.member_id == member_id)

    def calls_in_round(self, member_id: str, round_id: str) -> int:
        return sum(
            1
            for record in self.records
            if record.member_id == member_id and record.round_id == round_id
        )

    def remaining(self, member_id: str) -> int:
        return max(self.max_calls_per_member - self.calls(member_id), 0)

    def may_call(self, member_id: str, round_id: str) -> bool:
        if self.remaining(member_id) <= 0:
            return False
        return self.calls_in_round(member_id, round_id) < ROUND_BUDGET.get(round_id, 1)

    def record(self, record: CallRecord) -> CallRecord:
        self.records.append(record)
        return record

    def to_json(self) -> dict[str, Any]:
        members = sorted({record.member_id for record in self.records})
        by_member = {
            member_id: {
                "calls": self.calls(member_id),
                "remaining": self.remaining(member_id),
                "promptChars": sum(
                    r.prompt_chars for r in self.records if r.member_id == member_id
                ),
                "outputChars": sum(
                    r.output_chars for r in self.records if r.member_id == member_id
                ),
                "seconds": round(
                    sum(r.seconds for r in self.records if r.member_id == member_id), 2
                ),
                "failedCalls": sum(
                    1 for r in self.records if r.member_id == member_id and not r.ok
                ),
            }
            for member_id in members
        }
        by_round = {
            round_id: {
                "calls": sum(1 for r in self.records if r.round_id == round_id),
                "seconds": round(
                    sum(r.seconds for r in self.records if r.round_id == round_id), 2
                ),
            }
            for round_id in sorted({record.round_id for record in self.records})
        }
        return {
            "schemaVersion": QUOTA_SCHEMA_VERSION,
            "maxCallsPerMember": self.max_calls_per_member,
            "totalCalls": len(self.records),
            "byMember": by_member,
            "byRound": by_round,
            "records": [asdict(record) for record in self.records],
        }

    def write(self, path: Path) -> Path:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            json.dumps(self.to_json(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        return path


Invoker = Callable[..., RunnerOutcome]


def guarded_invoke(
    ledger: QuotaLedger,
    round_id: str,
    member: Member,
    workspace: Path,
    prompt: str,
    schema: dict[str, Any],
    payload: dict[str, Any],
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
    invoker: Invoker = invoke,
) -> RunnerOutcome:
    """Spend one budgeted call, and record what it cost.

    Raising rather than silently skipping is deliberate: a round that has run out
    of budget must degrade through the caller's explicit path, not by quietly
    returning an empty answer that later looks like a model opinion.
    """
    if not ledger.may_call(member.member_id, round_id):
        raise QuotaExceeded(
            f"{member.display_name} 在 {round_id} 轮已用尽额度"
            f"（本轮上限 {ROUND_BUDGET.get(round_id, 1)}，全天上限 {ledger.max_calls_per_member}）"
        )
    attempt = ledger.calls_in_round(member.member_id, round_id) + 1
    started = time.monotonic()
    try:
        outcome = invoker(
            member, workspace, prompt, schema, payload, timeout_seconds=timeout_seconds
        )
    except BaseException as exc:
        # A CLI may already have consumed quota before an unexpected local
        # exception reaches us.  Record that attempt before either degrading
        # (ordinary Exception) or respecting process-level interruption.
        elapsed = time.monotonic() - started
        error = f"{type(exc).__name__}: {exc}"
        ledger.record(
            CallRecord(
                round_id=round_id,
                member_id=member.member_id,
                attempt=attempt,
                ok=False,
                prompt_chars=len(prompt),
                output_chars=0,
                seconds=round(elapsed, 3),
                error=error,
            )
        )
        if not isinstance(exc, Exception):
            raise
        return RunnerOutcome(False, None, [], None, error, "")
    elapsed = time.monotonic() - started
    ledger.record(
        CallRecord(
            round_id=round_id,
            member_id=member.member_id,
            attempt=attempt,
            ok=outcome.ok,
            prompt_chars=len(prompt),
            output_chars=len(json.dumps(outcome.output, ensure_ascii=False))
            if outcome.output is not None
            else 0,
            seconds=round(elapsed, 3),
            error=outcome.error,
        )
    )
    return outcome
