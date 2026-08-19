"""Round 1 of the daily path: two independent short lists.

Each seat reads the entire eligible pool once — the same frozen table, in the
same order, in a single call — and returns thirty names with a rank, one number
and codes from a closed list. Nothing else. Producing a nine-dimension matrix
for several hundred candidates is what made the full committee cost thirteen
calls per seat; producing thirty rows costs one.

The two lists are then combined by plain union. There is no vote, no Borda
count and no quota: a name either seat thought worth a closer look goes to the
detail round, because with two members a vote is either unanimous or tied.
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any

from ..roster import Member
from ..runner import DEFAULT_TIMEOUT_SECONDS
from . import facts as facts_module
from .contracts import (
    DISCOVERY_PICKS,
    REASON_CODES,
    ContractError,
    discovery_schema,
    validate_picks,
)
from .quota import ROUND_DISCOVERY, Invoker, QuotaExceeded, QuotaLedger, guarded_invoke
from .quota import invoke as default_invoke


DISCOVERY_STAGE_ID = "D1"
DISCOVERY_RECORD_VERSION = "pdc-daily-discovery-record-v1"

# Two seats nominating thirty each can hand the detail round no fewer than
# thirty names and no more than sixty. Both bounds are asserted rather than
# assumed, because a silently wider pool is a silently more expensive round.
UNION_FLOOR = DISCOVERY_PICKS
UNION_CAP = DISCOVERY_PICKS * 2


def picks_for(pool_size: int, requested: int = DISCOVERY_PICKS) -> int:
    """How many names to ask for when the pool is smaller than the short list."""
    return max(min(requested, pool_size), 1)


def build_payload(
    table: dict[str, Any],
    run_id: str,
    requested: int = DISCOVERY_PICKS,
) -> dict[str, Any]:
    """The frozen package both seats receive, byte for byte identical."""
    count = picks_for(table["candidateCount"], requested)
    return {
        "schemaVersion": "pdc-daily-discovery-input-v1",
        "runId": run_id,
        "stageId": DISCOVERY_STAGE_ID,
        "runtimeMode": "DAILY_TOP10",
        "researchOnly": True,
        "liveTrading": False,
        "analysisDate": table["analysisDate"],
        "factsHash": table["factsHash"],
        "candidateCount": table["candidateCount"],
        "picksRequested": count,
        "tickers": list(table["tickers"]),
        "factTable": facts_module.render_table(table),
    }


def prompt_for(payload: dict[str, Any]) -> str:
    """Server-owned instruction, with the fact table carried inline.

    Inline delivery is not a preference: both CLIs run with their tools disabled,
    so a seat told to open a file answers from an empty conversation and invents
    tickers. It also makes byte-identical evidence a property of the code rather
    than of the filesystem.
    """
    return f"""You are one independent member of a local stock research committee. This is the discovery round.

Below is a table of {payload['candidateCount']} candidates that have already passed a hard eligibility screen for {payload['analysisDate']}. Every column is a measurement taken from real daily bars or from the exchange's own turnover figures. No score, rank, verdict or company name is supplied, because producing a judgement is your job and recalling a brand is not.

Column meanings: {facts_module.FIELD_MEANINGS}.

Select exactly {payload['picksRequested']} candidates — the ones you would look at most closely today — and return only JSON conforming to the supplied schema:
- `ticker`: one of the tickers in the table, never anything else
- `rank`: 1 is your strongest candidate; the ranks must be exactly 1..{payload['picksRequested']}, each used once
- `lightweight_score`: 0–10, your quick overall read; ties are allowed
- `reason_codes`: 1–4 codes from this list, naming what the measurements support: {", ".join(REASON_CODES)}

Do not return a dimension matrix, prose, or any candidate outside the table. Do not browse the web, do not use tools, do not read any file, and do not modify anything. Do not invent prices, dates, fundamentals or news beyond this table. Your output is a research label only — it is never an order, and nothing here executes a trade.

{payload['factTable']}"""


def discover_one(
    member: Member,
    workspace: Path,
    payload: dict[str, Any],
    ledger: QuotaLedger,
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
    invoker: Invoker = default_invoke,
) -> dict[str, Any]:
    """One seat, one call, one short list."""
    record: dict[str, Any] = {
        "schemaVersion": DISCOVERY_RECORD_VERSION,
        "memberId": member.member_id,
        "modelId": member.model_id,
        "status": "FAILED",
        "failureReason": "",
        "picksRequested": payload["picksRequested"],
        "picks": [],
    }
    try:
        outcome = guarded_invoke(
            ledger,
            ROUND_DISCOVERY,
            member,
            workspace,
            prompt_for(payload),
            discovery_schema(payload["picksRequested"]),
            payload,
            timeout_seconds=timeout_seconds,
            invoker=invoker,
        )
    except QuotaExceeded as exc:
        record["failureReason"] = str(exc)
        return record

    if not outcome.ok:
        record["failureReason"] = outcome.error
        return record
    try:
        record["picks"] = validate_picks(
            outcome.output, tuple(payload["tickers"]), payload["picksRequested"]
        )
    except ContractError as exc:
        # Kept, not repaired: "which field was wrong" is unanswerable from the
        # message alone, and a patched-up short list is not the seat's opinion.
        record["failureReason"] = f"契约校验失败：{exc}"
        record["rejectedOutput"] = outcome.output
        return record
    record["status"] = "COMPLETED"
    return record


def run_discovery(
    members: tuple[Member, ...],
    workspace_root: Path,
    payload: dict[str, Any],
    ledger: QuotaLedger,
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
    invoker: Invoker = default_invoke,
) -> dict[str, Any]:
    """Run every seat's discovery call in parallel, without contact.

    Parallelism is safe here in a way it was not for the old Round 2: one call
    per seat returning thirty short rows is nothing like twenty batches emitting
    twenty thousand output tokens each.
    """
    if len(members) < 2:
        raise ContractError("每日流程需要两个席位")

    def task(member: Member) -> dict[str, Any]:
        return discover_one(
            member,
            workspace_root / member.member_id,
            payload,
            ledger,
            timeout_seconds,
            invoker,
        )

    with ThreadPoolExecutor(max_workers=len(members)) as pool:
        records = list(pool.map(task, members))

    completed = [item for item in records if item["status"] == "COMPLETED"]
    return {
        "schemaVersion": DISCOVERY_RECORD_VERSION,
        "runId": payload["runId"],
        "stageId": DISCOVERY_STAGE_ID,
        "factsHash": payload["factsHash"],
        "candidateCount": payload["candidateCount"],
        "picksRequested": payload["picksRequested"],
        "memberResults": records,
        "completedMembers": [item["memberId"] for item in completed],
        "failedMembers": [
            {"memberId": item["memberId"], "failureReason": item["failureReason"]}
            for item in records
            if item["status"] != "COMPLETED"
        ],
        # Both seats must have nominated for the union to mean anything.
        "quorumMet": len(completed) == len(records) and len(completed) >= 2,
    }


def union_of(discovery: dict[str, Any], cap: int = UNION_CAP) -> tuple[str, ...]:
    """Every name either seat nominated, in ticker order.

    Union, not intersection: the second round exists to settle disagreement, so
    a name only one seat saw is exactly the name worth scoring properly.
    """
    tickers: set[str] = set()
    for record in discovery["memberResults"]:
        if record["status"] != "COMPLETED":
            continue
        tickers.update(pick["ticker"] for pick in record["picks"])
    if not tickers:
        raise ContractError("没有任何提名，无法进入详细评分")
    if len(tickers) > cap:
        raise ContractError(f"并集 {len(tickers)} 支超过上限 {cap}")
    return tuple(sorted(tickers))


def nomination_index(discovery: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """Who nominated what, and where — carried into the audit trail."""
    index: dict[str, dict[str, Any]] = {}
    for record in discovery["memberResults"]:
        if record["status"] != "COMPLETED":
            continue
        for pick in record["picks"]:
            entry = index.setdefault(
                pick["ticker"],
                {"ticker": pick["ticker"], "nominatedBy": [], "ranks": {}, "scores": {}, "reasonCodes": {}},
            )
            entry["nominatedBy"].append(record["memberId"])
            entry["ranks"][record["memberId"]] = pick["rank"]
            entry["scores"][record["memberId"]] = pick["lightweight_score"]
            entry["reasonCodes"][record["memberId"]] = pick["reason_codes"]
    for entry in index.values():
        entry["nominatedBy"].sort()
        entry["bothSeats"] = len(entry["nominatedBy"]) >= 2
    return index
