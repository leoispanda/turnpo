"""Round 3 of the daily path: a bounded cross review of the finalists only.

Each seat sees its own detail scores, the same frozen facts, and one anonymous
peer's scores for the same twenty names. It answers with a challenge, a
confidence, and — only where a fact justifies it — a revision that cites the
fact ids behind the change.

The shape is the same one the full committee settled on, narrowed to twenty
candidates and one call. A seat may not regenerate a fresh matrix: the schema has
no room for one, ``from_score`` must match what that seat already submitted, and
an uncited revision is rejected. Free argument between two models converges on
whoever writes with more confidence, which is persuasion rather than evidence.
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any

from ..anonymize import assert_packet_is_blind, build_peer_packet
from ..contracts import DIMENSIONS
from ..roster import Member
from ..runner import DEFAULT_TIMEOUT_SECONDS
from . import facts as facts_module
from .contracts import ContractError, review_schema, validate_assessments
from .quota import ROUND_REVIEW, Invoker, QuotaExceeded, QuotaLedger, guarded_invoke
from .quota import invoke as default_invoke


REVIEW_STAGE_ID = "D3"
REVIEW_RECORD_VERSION = "pdc-daily-review-record-v1"


def build_payload(
    member_id: str,
    table: dict[str, Any],
    own_cards: dict[str, dict[str, Any]],
    packet: dict[str, Any],
    own_label: str,
    run_id: str,
) -> dict[str, Any]:
    """One seat's symmetric review packet: own scores, peer scores, same facts."""
    peer_by_ticker: dict[str, dict[str, Any]] = {}
    for card in packet["cards"]:
        if card["label"] == own_label:
            continue
        peer_by_ticker[card["ticker"]] = card

    items: list[dict[str, Any]] = []
    for ticker in table["tickers"]:
        mine = own_cards.get(ticker)
        peer = peer_by_ticker.get(ticker)
        if mine is None or peer is None:
            continue
        items.append({
            "ticker": ticker,
            "yourScores": {name: mine["dimensions"][name] for name in DIMENSIONS},
            "yourDecision": mine["decision"],
            "yourNote": mine["note"],
            # The peer arrives under an opaque label with no provider, name or
            # reputation attached, and the seat is never told which is its own.
            "reviewerLabel": peer["label"],
            "reviewerScores": {name: peer["dimensions"][name] for name in DIMENSIONS},
            "reviewerDecision": peer["decision"],
            "reviewerNote": peer["note"],
        })

    return {
        "schemaVersion": "pdc-daily-review-input-v1",
        "runId": run_id,
        "stageId": REVIEW_STAGE_ID,
        "runtimeMode": "DAILY_TOP10",
        "researchOnly": True,
        "liveTrading": False,
        "analysisDate": table["analysisDate"],
        "factsHash": table["factsHash"],
        "parentFactsHash": table.get("parentFactsHash", table["factsHash"]),
        "candidateCount": len(items),
        "tickers": [item["ticker"] for item in items],
        "facts": facts_module.render_detail(table),
        "factIds": facts_module.render_fact_ids(table),
        "comparisons": items,
    }


def prompt_for(payload: dict[str, Any]) -> str:
    import json

    comparisons = json.dumps(
        payload["comparisons"], ensure_ascii=False, sort_keys=True, separators=(",", ":")
    )
    return f"""You scored these {payload['candidateCount']} stocks earlier. They are the finalists. An independent reviewer scored the same stocks from the same facts; their scores appear beside yours under an opaque label.

Re-read the original frozen facts below and, for each finalist, return one assessment: a `confidence` between 0 and 1 in your own scores, a short `challenge` stating the strongest objection you have to the current picture, and a `revisions` array.

Rules for `revisions`:
- Include an entry only for a dimension you are actually changing. Standing by all of your scores is a complete and expected answer: return an empty array.
- `from_score` must equal the score you submitted; you cannot restate history.
- Every revision must carry `fact_ids` drawn from the list of available fact ids below. An id that is not in that list will be rejected and your whole answer discarded.
- Do not split the difference. Moving toward the other number because it is different is not a reason.
- Do not defer to the reviewer. You have no information about who or what produced those scores, and none is available.
- Do not introduce facts that are not in this message, and do not produce a fresh set of scores; only cited changes to individual dimensions are accepted.

Do not browse, do not use tools, do not read any file. These are research labels only; nothing here places an order.

Available fact ids:
{payload['factIds']}

Frozen facts:
{payload['facts']}

Your scores and the reviewer's scores:
{comparisons}"""


def review_one(
    member: Member,
    workspace: Path,
    payload: dict[str, Any],
    own_cards: dict[str, dict[str, Any]],
    fact_ids: dict[str, set[str]],
    ledger: QuotaLedger,
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
    invoker: Invoker = default_invoke,
) -> dict[str, Any]:
    """One seat's final review: one call, or a recorded failure."""
    record: dict[str, Any] = {
        "schemaVersion": REVIEW_RECORD_VERSION,
        "memberId": member.member_id,
        "status": "FAILED",
        "failureReason": "",
        "candidateCount": payload["candidateCount"],
        "assessments": [],
    }
    try:
        outcome = guarded_invoke(
            ledger,
            ROUND_REVIEW,
            member,
            workspace,
            prompt_for(payload),
            review_schema(max(payload["candidateCount"], 1)),
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
        record["assessments"] = validate_assessments(
            outcome.output, tuple(payload["tickers"]), own_cards, fact_ids
        )
    except ContractError as exc:
        record["failureReason"] = f"契约校验失败：{exc}"
        record["rejectedOutput"] = outcome.output
        return record
    record["status"] = "COMPLETED"
    record["revisionCount"] = sum(len(item["revisions"]) for item in record["assessments"])
    return record


def apply_assessments(
    cards: list[dict[str, Any]],
    assessments: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """One seat's post-review matrix: its own cited revisions, applied to itself."""
    by_ticker = {
        card["ticker"]: {**card, "dimensions": dict(card["dimensions"])} for card in cards
    }
    confidence = {item["ticker"]: item["confidence"] for item in assessments}
    for item in assessments:
        card = by_ticker.get(item["ticker"])
        if card is None:
            continue
        for revision in item["revisions"]:
            card["dimensions"][revision["dimension"]] = revision["to_score"]
        card["reviewConfidence"] = item["confidence"]
        card["challenge"] = item["challenge"]
    for ticker, card in by_ticker.items():
        card.setdefault("reviewConfidence", confidence.get(ticker, card["confidence"]))
    return sorted(by_ticker.values(), key=lambda card: card["ticker"])


def run_review(
    members: tuple[Member, ...],
    workspace_root: Path,
    table: dict[str, Any],
    submissions: dict[str, list[dict[str, Any]]],
    run_id: str,
    ledger: QuotaLedger,
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
    invoker: Invoker = default_invoke,
) -> dict[str, Any]:
    """Give both seats the same anonymous, evidence-bound chance to reconsider."""
    finalists = tuple(table["tickers"])
    narrowed = {
        member_id: [card for card in cards if card["ticker"] in set(finalists)]
        for member_id, cards in submissions.items()
    }
    packet, seal = build_peer_packet(run_id, REVIEW_STAGE_ID, narrowed)
    assert_packet_is_blind(packet, tuple(narrowed))
    label_by_member = seal["labelByMember"]
    fact_ids = facts_module.all_fact_ids(table)
    own = {
        member_id: {card["ticker"]: card for card in cards}
        for member_id, cards in narrowed.items()
    }

    def task(member: Member) -> dict[str, Any]:
        payload = build_payload(
            member.member_id,
            table,
            own[member.member_id],
            packet,
            label_by_member[member.member_id],
            run_id,
        )
        return review_one(
            member,
            workspace_root / member.member_id,
            payload,
            own[member.member_id],
            fact_ids,
            ledger,
            timeout_seconds,
            invoker,
        )

    eligible = [member for member in members if member.member_id in narrowed]
    with ThreadPoolExecutor(max_workers=max(len(eligible), 1)) as pool:
        records = list(pool.map(task, eligible))

    finals = {
        record["memberId"]: apply_assessments(
            narrowed[record["memberId"]], record["assessments"]
        )
        for record in records
        if record["status"] == "COMPLETED"
    }
    return {
        "schemaVersion": REVIEW_RECORD_VERSION,
        "runId": run_id,
        "stageId": REVIEW_STAGE_ID,
        "factsHash": table["factsHash"],
        "candidateCount": len(finalists),
        "tickers": list(finalists),
        "memberResults": records,
        "finalScores": finals,
        # The ledger unseals authorship; it never goes into a seat's workspace.
        "ledger": seal,
        "quorumMet": len(finals) == len(records) and len(finals) >= 2,
    }
