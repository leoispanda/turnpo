"""Round 2: a bounded, anonymous re-examination — not a debate.

A seat sees its own Round 1, one anonymised peer's Round 1, the same frozen
facts, and the dimensions where the two diverged. It may answer only KEEP or
REVISE, and a revision must cite the frozen facts that justify it.

The shape is deliberate. Free conversation between two models converges on
whichever writes more confidently, which is persuasion, not evidence. Splitting
the difference is likewise banned: a seat that moves must say which fact moved
it. An empty revision list is a valid, expected answer — it means the seat
looked again and still stands by every score.
"""

from __future__ import annotations

import hashlib
import json
import time
from pathlib import Path
from typing import Any

from .anonymize import assert_packet_is_blind, build_peer_packet
from .contracts import DIMENSIONS, ContractError
from .roster import Member
from .runner import DEFAULT_TIMEOUT_SECONDS, invoke


ROUND_TWO_SCHEMA_VERSION = "pdc-sustainable-round2-v1"

# Round 2 carries far more per candidate than Round 1 — own scores, peer scores
# and the facts behind both — so it batches harder. Sending 183 disputes in one
# request produced a 143k-character prompt that both CLIs refused outright.
DEFAULT_CHALLENGE_BATCH = 10

# Seat calls fail transiently: in the 2026-08-17 run one batch of ten failed and
# then succeeded unchanged on retry. Without these, one flaky call discards every
# batch that already succeeded — and with it the quota they cost.
BATCH_ATTEMPTS = 3
# A seat that has just emitted twenty thousand output tokens per batch across a
# dozen batches is rate limited, not glitching: a twenty-second pause retries
# straight back into the same closed window. Back off in minutes.
RETRY_PAUSE_SECONDS = 120

# Seats take turns in Round 2 rather than running together. Round 1 parallelises
# safely because its batches are cheap, but a Round 2 batch emits ~20k output
# tokens; two seats pushing that concurrently for twenty batches walks straight
# into a rate limit. Taking turns costs wall-clock time and nothing else —
# neither seat ever sees the other's work, so serial execution changes no result.
BATCH_PAUSE_SECONDS = 15


def _batch_key(member_id: str, payload: dict[str, Any]) -> str:
    """Content address for one batch, so a changed batch is never served stale."""
    material = json.dumps(
        {"member": member_id, "challenges": payload["challenges"]},
        ensure_ascii=False, sort_keys=True, separators=(",", ":"),
    )
    return hashlib.sha256(material.encode("utf-8")).hexdigest()[:20]
MAX_EVIDENCE_REFS = 6
MAX_REVISION_NOTE = 200


def revision_schema(max_items: int) -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "additionalProperties": False,
        "required": ["revisions"],
        "properties": {
            "revisions": {
                "type": "array",
                # An empty list is the answer when nothing changed.
                "minItems": 0,
                "maxItems": max_items,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    # Strict structured output requires `required` to list every
                    # key in `properties`; an optional field is rejected outright
                    # with invalid_json_schema, not merely ignored.
                    "required": [
                        "ticker",
                        "dimension",
                        "from_score",
                        "to_score",
                        "evidence_refs",
                        "note",
                    ],
                    "properties": {
                        "ticker": {"type": "string", "minLength": 1, "maxLength": 32},
                        "dimension": {"type": "string", "enum": list(DIMENSIONS)},
                        "from_score": {"type": "number", "minimum": 0, "maximum": 10},
                        "to_score": {"type": "number", "minimum": 0, "maximum": 10},
                        "evidence_refs": {
                            "type": "array",
                            "minItems": 1,
                            "maxItems": MAX_EVIDENCE_REFS,
                            "items": {"type": "string", "minLength": 1, "maxLength": 120},
                        },
                        "note": {"type": "string", "maxLength": MAX_REVISION_NOTE},
                    },
                },
            }
        },
    }


def build_challenge_input(
    member_id: str,
    own_cards: dict[str, dict[str, Any]],
    packet: dict[str, Any],
    label_of_member: str,
    challenges: list[dict[str, Any]],
    facts_by_ticker: dict[str, Any],
) -> dict[str, Any]:
    """Assemble one seat's symmetric Round 2 packet.

    The peer's card arrives under an opaque label with no provider, name or
    reputation attached, and the seat is never told which label is its own.
    """
    peer_by_ticker: dict[str, dict[str, Any]] = {}
    for card in packet["cards"]:
        if card["label"] == label_of_member:
            continue
        peer_by_ticker[card["ticker"]] = card

    items: list[dict[str, Any]] = []
    for row in challenges:
        ticker = row["ticker"]
        mine = own_cards.get(ticker)
        peer = peer_by_ticker.get(ticker)
        if mine is None or peer is None:
            continue
        items.append({
            "ticker": ticker,
            "facts": facts_by_ticker.get(ticker, {}),
            "yourScores": {name: mine["dimensions"][name] for name in row["challengedDimensions"]},
            "peerScores": {name: peer["dimensions"][name] for name in row["challengedDimensions"]},
            "dimensionsInDispute": row["challengedDimensions"],
        })

    return {
        "schemaVersion": ROUND_TWO_SCHEMA_VERSION,
        "researchOnly": True,
        "liveTrading": False,
        "challengeCount": len(items),
        "challenges": items,
    }


def prompt_for(payload: dict[str, Any]) -> str:
    facts = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return f"""You scored a set of stocks earlier. An independent reviewer scored the same stocks from the same facts, and on {payload['challengeCount']} candidates your scores differ materially on at least one dimension.

For each disputed dimension, re-examine your own score against the facts supplied. Then either keep it or change it.

Return only JSON conforming to the supplied schema: a `revisions` array. Include an entry **only** for dimensions you are actually changing. If you re-examined everything and still stand by all of your scores, return an empty array — that is a complete and expected answer.

Every revision must carry `evidence_refs`: the specific facts from this message that justify the change, quoted or named exactly as they appear.

Rules:
- Do not split the difference. Moving toward the other score because it is different is not a reason.
- Do not defer to the reviewer. You have no information about who or what produced those scores, and none is available.
- Do not introduce facts that are not in this message.
- Do not write arguments or commentary; the schema has no field for them.
- Change a score only when a fact you under-weighted or misread actually supports the new number.

Do not browse, do not use tools, do not read any file. These are research labels only; nothing here places an order.

{facts}"""


def validate_revisions(
    value: object,
    own_cards: dict[str, dict[str, Any]],
    allowed: dict[str, set[str]],
) -> list[dict[str, Any]]:
    """Return normalized revisions, or raise.

    A revision is accepted only for a dimension that was actually in dispute and
    only when `from_score` matches what the seat originally submitted — a seat
    cannot quietly restate history or edit a score nobody questioned.
    """
    if not isinstance(value, dict):
        raise ContractError("输出必须是 JSON 对象")
    rows = value.get("revisions")
    if not isinstance(rows, list):
        raise ContractError("输出缺少 revisions 数组")

    normalized: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for row in rows:
        if not isinstance(row, dict):
            raise ContractError("每条修订必须是对象")
        ticker = str(row.get("ticker") or "").strip().upper()
        dimension = str(row.get("dimension") or "").strip()
        if ticker not in allowed or dimension not in allowed[ticker]:
            raise ContractError(f"{ticker}/{dimension} 不在本轮争议范围内")
        key = (ticker, dimension)
        if key in seen:
            raise ContractError(f"修订重复：{ticker}/{dimension}")
        original = float(own_cards[ticker]["dimensions"][dimension])
        try:
            from_score = float(row.get("from_score"))
            to_score = float(row.get("to_score"))
        except (TypeError, ValueError) as exc:
            raise ContractError(f"{ticker}/{dimension} 的分数必须是数字") from exc
        if abs(from_score - original) > 1e-6:
            raise ContractError(
                f"{ticker}/{dimension} 的 from_score {from_score} 与第一轮记录 {original} 不符"
            )
        if not 0.0 <= to_score <= 10.0:
            raise ContractError(f"{ticker}/{dimension} 的 to_score 越界")
        refs = row.get("evidence_refs")
        if not isinstance(refs, list) or not refs or not all(str(r).strip() for r in refs):
            raise ContractError(f"{ticker}/{dimension} 的修订缺少 evidence_refs")
        seen.add(key)
        normalized.append({
            "ticker": ticker,
            "dimension": dimension,
            "from_score": round(from_score, 4),
            "to_score": round(to_score, 4),
            "evidence_refs": [str(r)[:120] for r in refs][:MAX_EVIDENCE_REFS],
            "note": str(row.get("note") or "")[:MAX_REVISION_NOTE],
        })
    return normalized


def challenge_one(
    member: Member,
    workspace: Path,
    payload: dict[str, Any],
    own_cards: dict[str, dict[str, Any]],
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
    batch_size: int = DEFAULT_CHALLENGE_BATCH,
    cache_dir: Path | None = None,
) -> dict[str, Any]:
    """Run one seat's Round 2, batch by batch, and validate what it returns.

    Completed batches are cached by content, so re-running after a failure costs
    only the batches that actually failed.
    """
    record: dict[str, Any] = {
        "schemaVersion": ROUND_TWO_SCHEMA_VERSION,
        "memberId": member.member_id,
        "status": "FAILED",
        "failureReason": "",
        "challengeCount": payload["challengeCount"],
        "batchCount": 0,
        "revisions": [],
    }
    items = payload["challenges"]
    if not items:
        # Nothing crossed the threshold; there is nothing to re-examine.
        record["status"] = "COMPLETED"
        return record

    groups = [items[i : i + batch_size] for i in range(0, len(items), batch_size)]
    record["batchCount"] = len(groups)
    record["reusedBatches"] = 0
    collected: list[dict[str, Any]] = []
    for index, group in enumerate(groups, start=1):
        allowed = {item["ticker"]: set(item["dimensionsInDispute"]) for item in group}
        slice_payload = {**payload, "challengeCount": len(group), "challenges": group}

        cached = cache_dir / f"{_batch_key(member.member_id, slice_payload)}.json" if cache_dir else None
        if cached is not None and cached.is_file():
            try:
                collected.extend(json.loads(cached.read_text(encoding="utf-8")))
                record["reusedBatches"] += 1
                continue
            except (OSError, json.JSONDecodeError):
                pass  # A corrupt cache entry is re-earned, not trusted.

        last_error = ""
        for attempt in range(1, BATCH_ATTEMPTS + 1):
            outcome = invoke(
                member,
                workspace / f"batch-{index:03d}-try{attempt}",
                prompt_for(slice_payload),
                revision_schema(max(sum(len(v) for v in allowed.values()), 1)),
                slice_payload,
                timeout_seconds=timeout_seconds,
            )
            if not outcome.ok:
                last_error = outcome.error
                if attempt < BATCH_ATTEMPTS:
                    time.sleep(RETRY_PAUSE_SECONDS * attempt)
                continue
            try:
                revisions = validate_revisions(outcome.output, own_cards, allowed)
            except ContractError as exc:
                # An off-contract answer is a real failure, not a flake: retrying
                # the same prompt is unlikely to produce a different shape.
                record["failureReason"] = f"第 {index}/{len(groups)} 批契约校验失败：{exc}"
                record["rejectedOutput"] = outcome.output
                return record
            collected.extend(revisions)
            if index < len(groups):
                time.sleep(BATCH_PAUSE_SECONDS)
            if cached is not None:
                cached.parent.mkdir(parents=True, exist_ok=True)
                cached.write_text(
                    json.dumps(revisions, ensure_ascii=False), encoding="utf-8"
                )
            break
        else:
            record["failureReason"] = (
                f"第 {index}/{len(groups)} 批重试 {BATCH_ATTEMPTS} 次仍失败：{last_error}"
            )
            return record

    record["revisions"] = collected
    record["status"] = "COMPLETED"
    return record


def apply_revisions(
    cards: list[dict[str, Any]], revisions: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    """Produce a seat's final matrix by applying its own accepted revisions."""
    by_ticker = {card["ticker"]: {**card, "dimensions": dict(card["dimensions"])} for card in cards}
    for revision in revisions:
        card = by_ticker.get(revision["ticker"])
        if card is not None:
            card["dimensions"][revision["dimension"]] = revision["to_score"]
    return sorted(by_ticker.values(), key=lambda card: card["ticker"])


def run_round_two(
    members: tuple[Member, ...],
    workspace_root: Path,
    submissions: dict[str, list[dict[str, Any]]],
    matrix: dict[str, Any],
    facts_by_ticker: dict[str, Any],
    run_id: str,
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
    batch_size: int = DEFAULT_CHALLENGE_BATCH,
    cache_dir: Path | None = None,
) -> dict[str, Any]:
    """Give every seat the same bounded chance to reconsider, anonymously."""
    from .disagreement import challenges_for

    packet, ledger = build_peer_packet(run_id, "05", submissions)
    assert_packet_is_blind(packet, tuple(submissions))
    challenges = challenges_for(matrix)
    own = {
        member_id: {card["ticker"]: card for card in cards}
        for member_id, cards in submissions.items()
    }
    label_by_member = ledger["labelByMember"]

    def task(member: Member) -> dict[str, Any]:
        payload = build_challenge_input(
            member.member_id,
            own[member.member_id],
            packet,
            label_by_member[member.member_id],
            challenges,
            facts_by_ticker,
        )
        return challenge_one(
            member,
            workspace_root / member.member_id,
            payload,
            own[member.member_id],
            timeout_seconds,
            batch_size,
            cache_dir / member.member_id if cache_dir else None,
        )

    eligible = [member for member in members if member.member_id in submissions]
    records = [task(member) for member in eligible]

    finals = {
        record["memberId"]: apply_revisions(
            submissions[record["memberId"]], record["revisions"]
        )
        for record in records
        if record["status"] == "COMPLETED"
    }
    return {
        "schemaVersion": ROUND_TWO_SCHEMA_VERSION,
        "runId": run_id,
        "challengedCandidates": len(challenges),
        "memberResults": records,
        "finalScores": finals,
        # The ledger is returned separately from the packet and must not be
        # written anywhere a seat can read.
        "ledger": ledger,
        "quorumMet": len(finals) >= 2,
    }
