"""Round 1: every seat scores the same frozen candidates, independently.

Independence is enforced by construction. Each seat receives its own workspace
containing only the frozen facts and the output schema, the seats run in
parallel without a shared channel, and no seat is started with any other seat's
result in scope. Nothing here selects a checkpoint or places an order.

Measured signals travel with the facts; the rule engine's verdict does not. A
seat handed a finished scorecard nudges it a few tenths and calls that judgement,
which is what a full-market run demonstrated. Seats therefore receive the same
measurements the engine used and must reach their own conclusions, so that where
they diverge the divergence means something.
"""

from __future__ import annotations

import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any

from .contracts import (
    DECISIONS,
    DIMENSIONS,
    R1_INPUT_SCHEMA_VERSION,
    R1_OUTPUT_SCHEMA_VERSION,
    RISK_FLAGS,
    ContractError,
    scorecard_schema,
    validate_scorecards,
)
from .roster import Member
from .runner import DEFAULT_TIMEOUT_SECONDS, invoke


# One request cannot carry several hundred scorecards, so the pool is scored in
# batches. This bounds a single response; it never bounds the pool.
DEFAULT_BATCH_SIZE = 25

# Measurements taken from real bars: price levels, not judgements about them.
FACT_FIELDS: tuple[str, ...] = (
    "latest_date",
    "latest_close",
    "breakout_trigger",
    "technical_stop",
)

# The rule engine's finished answer. Withheld by default, because a seat shown a
# completed scorecard edits it by a few tenths instead of forming one: in the
# 2026-08-17 full-market run every one of 303 candidates came back with a spread
# below the 3.0 disagreement threshold, so the cross-check the committee exists
# to provide never fired once.
BASELINE_FIELDS: tuple[str, ...] = ("rank", "final_score", "final_status")


def build_candidate(row: dict[str, Any], include_baseline: bool = False) -> dict[str, Any]:
    """Reduce one deterministic row to what a seat is allowed to see.

    Measured signals always travel — they are arithmetic over real bars, and
    withholding them would invite invention rather than independence. What is
    withheld by default is the engine's verdict: its nine dimension scores, its
    overall score, its rank and its status.
    """
    ticker = str(row.get("ticker") or "").strip().upper()
    if not ticker:
        raise ContractError("确定性结果缺少 ticker")
    facts = {field: row[field] for field in FACT_FIELDS if field in row}
    signals = {
        name: row[f"{name}_signal"]
        for name in DIMENSIONS
        if f"{name}_signal" in row and str(row[f"{name}_signal"]).strip()
    }
    candidate: dict[str, Any] = {
        "ticker": ticker,
        **facts,
        "measuredSignals": signals,
    }
    if include_baseline:
        candidate.update({field: row[field] for field in BASELINE_FIELDS if field in row})
        candidate["deterministicScores"] = {
            name: row[f"{name}_score"] for name in DIMENSIONS if f"{name}_score" in row
        }
    return candidate


def build_input(
    run_id: str,
    rows: list[dict[str, Any]],
    metadata: dict[str, Any] | None = None,
    include_baseline: bool = False,
) -> dict[str, Any]:
    """Assemble the frozen fact package handed to every seat identically."""
    if not rows:
        raise ContractError("没有候选可供评分")
    candidates = [build_candidate(row, include_baseline) for row in rows]
    return {
        "schemaVersion": R1_INPUT_SCHEMA_VERSION,
        "runId": run_id,
        "stageId": "03",
        "stageName": "Round 1 Members",
        "researchOnly": True,
        "liveTrading": False,
        # Recorded in the frozen package so a later comparison of two runs can
        # tell which one the seats were anchored in.
        "includesBaseline": include_baseline,
        "metadata": dict(metadata or {}),
        "candidateCount": len(candidates),
        "candidates": candidates,
    }


def prompt_for(candidate_count: int, payload: dict[str, Any] | None = None) -> str:
    """Server-owned instruction with the frozen facts carried inline.

    The facts travel in the prompt rather than in a file the seat must open. Both
    CLIs run with their tools disabled, so a seat asked to read `input.json`
    answers from an empty conversation and invents placeholder tickers instead of
    admitting it saw nothing. Inline delivery also guarantees, by construction,
    that every seat received byte-identical evidence.
    """
    facts = ""
    anchored = False
    if payload is not None:
        anchored = bool(payload.get("includesBaseline"))
        facts = "\n\nFrozen facts:\n\n" + json.dumps(
            payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")
        )
    if anchored:
        framing = (
            "`deterministicScores` are computed by a rule engine from real price bars — "
            "treat them as accurate arithmetic, not as opinions to be flattered. Your job "
            "is to judge what that arithmetic *means*, and to say so even when you "
            "disagree with the rule engine."
        )
    else:
        framing = (
            "`measuredSignals` are measurements taken from real daily bars — moving-average "
            "distances, momentum, volume behaviour, volatility, pivot proximity. They are "
            "facts. No score, rank, status or verdict is supplied for any candidate, because "
            "producing those is your job. Read the measurements and reach your own conclusion; "
            "two candidates with similar measurements may still deserve different scores, and "
            "saying why is the point."
        )
    return f"""You are one independent member of a local stock research committee.

The frozen facts for {candidate_count} candidates are included at the end of this message. {framing}

Return only JSON conforming to the supplied output schema, with exactly one scorecard per candidate — no more, no fewer.

For each candidate: score every one of the nine dimensions from 0 to 10, give a `confidence` between 0 and 1, any applicable `risk_flags` from the allowed list ({", ".join(RISK_FLAGS)}), a `decision` from {", ".join(DECISIONS)}, and a short `note` naming the single fact that most drove your view. Do not supply an overall score: the total is computed locally from your nine dimensions and the engine's fixed weights.

Do not browse the web, do not use tools, do not read any file, and do not modify anything. Do not invent prices, dates, fundamentals, or news that is not in the frozen facts below; when evidence is thin, say so and lower your confidence. If a candidate's facts look incomplete, still return a scorecard for it with MISSING_DATA and low confidence — never substitute a placeholder ticker for one you were given. Your decisions are research labels only — they are never orders, and nothing here executes a trade.{facts}"""


def batches(candidates: list[dict[str, Any]], size: int) -> list[list[dict[str, Any]]]:
    """Split the pool into request-sized batches, deterministically.

    Batching exists because one request cannot carry several hundred scorecards,
    not because the pool may be trimmed: every candidate Hawkeye passed appears
    in exactly one batch, and a seat that cannot answer a batch fails the whole
    round rather than contributing a partial pool.
    """
    ordered = sorted(candidates, key=lambda item: item["ticker"])
    return [ordered[index : index + size] for index in range(0, len(ordered), size)]


def score_one(
    member: Member,
    workspace: Path,
    payload: dict[str, Any],
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
    batch_size: int = DEFAULT_BATCH_SIZE,
) -> dict[str, Any]:
    """Score every candidate in the pool with one seat, batch by batch."""
    expected = tuple(sorted(candidate["ticker"] for candidate in payload["candidates"]))
    record: dict[str, Any] = {
        "schemaVersion": R1_OUTPUT_SCHEMA_VERSION,
        "memberId": member.member_id,
        "modelId": member.model_id,
        "runnerId": member.runner_id,
        "status": "FAILED",
        "failureReason": "",
        "tokenSource": "",
        "candidateCount": len(expected),
        "batchCount": 0,
        "scorecards": [],
    }

    groups = batches(payload["candidates"], batch_size)
    record["batchCount"] = len(groups)
    collected: list[dict[str, Any]] = []
    for index, group in enumerate(groups, start=1):
        tickers = tuple(item["ticker"] for item in group)
        slice_payload = {**payload, "candidateCount": len(group), "candidates": group}
        outcome = invoke(
            member,
            workspace / f"batch-{index:03d}",
            prompt_for(len(group), slice_payload),
            scorecard_schema(max(len(group), 1)),
            slice_payload,
            timeout_seconds=timeout_seconds,
        )
        record["tokenSource"] = outcome.token_source
        if not outcome.ok:
            record["failureReason"] = f"第 {index}/{len(groups)} 批失败：{outcome.error}"
            return record
        try:
            collected.extend(validate_scorecards(outcome.output, tickers))
        except ContractError as exc:
            # An off-contract answer is a failed round for this seat. It is never
            # patched up into a usable result — but the raw answer is kept,
            # because "which field was wrong" is unanswerable from the message.
            record["failureReason"] = f"第 {index}/{len(groups)} 批契约校验失败：{exc}"
            record["rejectedOutput"] = outcome.output
            return record

    covered = tuple(sorted(card["ticker"] for card in collected))
    if covered != expected:
        # Batching must never quietly lose a candidate; a short pool would change
        # what the committee is comparing without anyone noticing.
        missing = ", ".join(sorted(set(expected) - set(covered))) or "（无）"
        record["failureReason"] = f"合并后未覆盖全部候选，缺少：{missing}"
        return record

    record["scorecards"] = sorted(collected, key=lambda card: card["ticker"])
    record["status"] = "COMPLETED"
    return record


def run_round_one(
    members: tuple[Member, ...],
    workspace_root: Path,
    payload: dict[str, Any],
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
    batch_size: int = DEFAULT_BATCH_SIZE,
) -> dict[str, Any]:
    """Score every seat in parallel and freeze the result.

    Seats run concurrently but never share state: each gets its own workspace
    directory and its own subprocess, so parallelism cannot become contact.
    """
    if len(members) < 2:
        raise ContractError("至少需要两个席位才能构成委员会")

    def task(member: Member) -> dict[str, Any]:
        return score_one(
            member, workspace_root / member.member_id, payload, timeout_seconds, batch_size
        )

    with ThreadPoolExecutor(max_workers=len(members)) as pool:
        records = list(pool.map(task, members))

    completed = [item for item in records if item["status"] == "COMPLETED"]
    return {
        "schemaVersion": R1_OUTPUT_SCHEMA_VERSION,
        "runId": payload["runId"],
        "stageId": payload["stageId"],
        "researchOnly": True,
        "liveTrading": False,
        "candidateCount": payload["candidateCount"],
        "memberResults": records,
        # Peer review needs at least two real submissions to be meaningful.
        "quorumMet": len(completed) >= 2,
        "completedMembers": [item["memberId"] for item in completed],
        "failedMembers": [
            {"memberId": item["memberId"], "failureReason": item["failureReason"]}
            for item in records
            if item["status"] != "COMPLETED"
        ],
    }


def submissions_from(frozen: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    """Extract the completed submissions that peer review will anonymize."""
    return {
        item["memberId"]: item["scorecards"]
        for item in frozen.get("memberResults", [])
        if item.get("status") == "COMPLETED"
    }


def consensus(frozen: dict[str, Any]) -> dict[str, Any]:
    """Where the seats agree, and where they do not.

    Disagreement is the committee's real output: two seats rarely hallucinate
    the same way, so a wide spread marks a ranking that should not be trusted
    without a human look.
    """
    by_ticker: dict[str, list[dict[str, Any]]] = {}
    for member_id, cards in submissions_from(frozen).items():
        for card in cards:
            by_ticker.setdefault(card["ticker"], []).append({**card, "memberId": member_id})

    from .arbitration import canonical_total

    rows: list[dict[str, Any]] = []
    for ticker, cards in sorted(by_ticker.items()):
        # The total is computed here from the nine dimensions and the engine's
        # fixed weights. A seat is forbidden to supply one, so reading `score`
        # off the card raised KeyError for every run.
        scores = [canonical_total(card["dimensions"]) for card in cards]
        totals = dict(zip((card["memberId"] for card in cards), scores))
        votes = {name: sum(card["decision"] == name for card in cards) for name in DECISIONS}
        spread = round(max(scores) - min(scores), 4)
        rows.append({
            "ticker": ticker,
            "memberCount": len(cards),
            "meanScore": round(sum(scores) / len(scores), 4),
            "scoreSpread": spread,
            "decisionVotes": votes,
            # Same thresholds the existing committee audit already uses, so the
            # two paths flag the same situations.
            "hasMaterialDisagreement": spread >= 3.0 or bool(votes["BUY"] and votes["SELL"]),
            "byMember": totals,
        })

    ranked = sorted(rows, key=lambda row: (-row["meanScore"], row["ticker"]))
    for position, row in enumerate(ranked, start=1):
        row["consensusRank"] = position
    return {
        "schemaVersion": "pdc-sustainable-consensus-v1",
        "tickers": ranked,
        "disagreementCount": sum(row["hasMaterialDisagreement"] for row in ranked),
    }


def write_json(path: Path, value: object) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path
