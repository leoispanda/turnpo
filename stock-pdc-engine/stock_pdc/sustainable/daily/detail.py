"""Round 2 of the daily path: the nine dimensions, on the union only.

Both seats score exactly the same 30–60 candidates with the committee's existing
scorecard contract. The schema, the dimension list, the risk-flag vocabulary and
the ban on a model-supplied total all come from the frozen module; nothing about
what a scorecard is changes here.

What changes is the budget. One call carries the whole round. If a seat's answer
comes back short — a truncated response, a dropped tail — the second call asks
only for the names that are missing. It never repeats the round, and it never
fills a gap with a plausible-looking score.
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any

from ..contracts import DECISIONS, RISK_FLAGS
from ..roster import Member
from ..runner import DEFAULT_TIMEOUT_SECONDS
from . import facts as facts_module
from .contracts import ContractError, detail_schema, validate_scorecard_subset
from .quota import ROUND_DETAIL, Invoker, QuotaExceeded, QuotaLedger, guarded_invoke
from .quota import invoke as default_invoke


DETAIL_STAGE_ID = "D2"
DETAIL_RECORD_VERSION = "pdc-daily-detail-record-v1"


def build_payload(table: dict[str, Any], run_id: str) -> dict[str, Any]:
    """The frozen package for the detail round, over the union of nominations."""
    return {
        "schemaVersion": "pdc-daily-detail-input-v1",
        "runId": run_id,
        "stageId": DETAIL_STAGE_ID,
        "runtimeMode": "DAILY_TOP10",
        "researchOnly": True,
        "liveTrading": False,
        "analysisDate": table["analysisDate"],
        "factsHash": table["factsHash"],
        "parentFactsHash": table.get("parentFactsHash", table["factsHash"]),
        "candidateCount": table["candidateCount"],
        "tickers": list(table["tickers"]),
        "facts": facts_module.render_detail(table),
    }


def prompt_for(payload: dict[str, Any]) -> str:
    return f"""You are one independent member of a local stock research committee. This is the detail round.

{payload['candidateCount']} candidates survived the discovery round. The frozen facts for all of them are below: measurements from real daily bars, plus the engine's per-dimension observations. They are facts. No score, rank, status or verdict is supplied, because producing those is your job.

Column meanings: {facts_module.FIELD_MEANINGS}.

Return only JSON conforming to the supplied output schema, with exactly one scorecard per candidate — no more, no fewer, and for these tickers only.

For each candidate: score every one of the nine dimensions from 0 to 10, give a `confidence` between 0 and 1, any applicable `risk_flags` from the allowed list ({", ".join(RISK_FLAGS)}), a `decision` from {", ".join(DECISIONS)}, and a short `note` naming the single fact that most drove your view. Do not supply an overall score: the total is computed locally from your nine dimensions and the engine's fixed weights.

Two candidates with similar measurements may still deserve different scores, and saying why in `note` is the point. Do not browse the web, do not use tools, do not read any file, and do not modify anything. Do not invent prices, dates, fundamentals or news that are not below; where evidence is thin, say so and lower your confidence. If a candidate's facts look incomplete, still return a scorecard for it with MISSING_DATA and low confidence — never substitute a ticker you were not given. Your decisions are research labels only; nothing here places an order.

{payload['facts']}"""


def _missing(expected: tuple[str, ...], collected: list[dict[str, Any]]) -> tuple[str, ...]:
    covered = {card["ticker"] for card in collected}
    return tuple(ticker for ticker in expected if ticker not in covered)


def score_one(
    member: Member,
    workspace: Path,
    table: dict[str, Any],
    run_id: str,
    ledger: QuotaLedger,
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
    invoker: Invoker = default_invoke,
) -> dict[str, Any]:
    """Score the union with one seat: one call, plus a top-up for what is missing."""
    expected = tuple(table["tickers"])
    record: dict[str, Any] = {
        "schemaVersion": DETAIL_RECORD_VERSION,
        "memberId": member.member_id,
        "modelId": member.model_id,
        "status": "FAILED",
        "failureReason": "",
        "candidateCount": len(expected),
        "callCount": 0,
        "scorecards": [],
    }

    collected: list[dict[str, Any]] = []
    outstanding = expected
    attempt = 0
    while outstanding:
        attempt += 1
        narrowed = facts_module.subset(table, outstanding) if len(outstanding) != len(expected) else table
        payload = build_payload(narrowed, run_id)
        try:
            outcome = guarded_invoke(
                ledger,
                ROUND_DETAIL,
                member,
                workspace / f"call-{attempt:02d}",
                prompt_for(payload),
                detail_schema(max(len(outstanding), 1)),
                payload,
                timeout_seconds=timeout_seconds,
                invoker=invoker,
            )
        except QuotaExceeded as exc:
            record["failureReason"] = (
                f"仍缺 {len(outstanding)} 支未评分，但额度已用尽：{exc}"
            )
            record["callCount"] = attempt - 1
            return record

        record["callCount"] = attempt
        if not outcome.ok:
            record["failureReason"] = f"第 {attempt} 次调用失败：{outcome.error}"
            if not ledger.may_call(member.member_id, ROUND_DETAIL):
                return record
            continue
        try:
            collected.extend(validate_scorecard_subset(outcome.output, outstanding))
        except ContractError as exc:
            # Off-contract is a real failure, not a flake: the same prompt is
            # unlikely to produce a different shape, and a repaired scorecard is
            # not the seat's judgement.
            record["failureReason"] = f"第 {attempt} 次调用契约校验失败：{exc}"
            record["rejectedOutput"] = outcome.output
            return record

        outstanding = _missing(expected, collected)
        if outstanding and not ledger.may_call(member.member_id, ROUND_DETAIL):
            record["failureReason"] = (
                f"缺少 {len(outstanding)} 支的打分卡，且本轮额度已用尽："
                f"{', '.join(outstanding[:10])}"
            )
            return record

    record["scorecards"] = sorted(collected, key=lambda card: card["ticker"])
    record["status"] = "COMPLETED"
    return record


def run_detail(
    members: tuple[Member, ...],
    workspace_root: Path,
    table: dict[str, Any],
    run_id: str,
    ledger: QuotaLedger,
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
    invoker: Invoker = default_invoke,
) -> dict[str, Any]:
    """Both seats score the identical union, independently and in parallel."""
    if len(members) < 2:
        raise ContractError("每日流程需要两个席位")

    def task(member: Member) -> dict[str, Any]:
        return score_one(
            member,
            workspace_root / member.member_id,
            table,
            run_id,
            ledger,
            timeout_seconds,
            invoker,
        )

    with ThreadPoolExecutor(max_workers=len(members)) as pool:
        records = list(pool.map(task, members))

    submissions = {
        record["memberId"]: record["scorecards"]
        for record in records
        if record["status"] == "COMPLETED"
    }
    return {
        "schemaVersion": DETAIL_RECORD_VERSION,
        "runId": run_id,
        "stageId": DETAIL_STAGE_ID,
        "factsHash": table["factsHash"],
        "candidateCount": len(table["tickers"]),
        "tickers": list(table["tickers"]),
        "memberResults": records,
        "submissions": submissions,
        # Both seats, or no new opinion: a single seat's scores are not a
        # committee, and the daily list never rests on one.
        "quorumMet": len(submissions) == len(records) and len(submissions) >= 2,
    }


def assert_identical_coverage(detail: dict[str, Any]) -> None:
    """Both seats must have scored exactly the same names.

    Checked rather than trusted: a consensus computed over two different pools
    is an average of different questions.
    """
    submissions = detail["submissions"]
    if len(submissions) < 2:
        raise ContractError("完成的席位不足两个，无法比较覆盖范围")
    expected = {ticker.upper() for ticker in detail["tickers"]}
    for member_id, cards in sorted(submissions.items()):
        covered = {card["ticker"] for card in cards}
        if covered != expected:
            missing = ", ".join(sorted(expected - covered)[:10]) or "（无）"
            extra = ", ".join(sorted(covered - expected)[:10]) or "（无）"
            raise ContractError(
                f"{member_id} 的覆盖范围与本轮候选不一致：缺少 {missing}；多出 {extra}"
            )
