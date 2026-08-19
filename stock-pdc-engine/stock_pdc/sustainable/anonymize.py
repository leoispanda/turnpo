"""Relabel frozen Round 1 scorecards for blind peer review.

Anonymity here is structural, not cosmetic. The label→author ledger is written
*outside* every model workspace, so no seat can read who wrote which card even
if it ignores its instructions and lists the directory it was given.

The blindness is nonetheless only partial, by explicit choice: the `rationale`
prose is forwarded verbatim, so a seat may recognize its own writing style. That
residual leak is measured rather than assumed away — each review carries an
`author_guess`, and :func:`self_recognition_report` turns those guesses into
accuracy and self-preference numbers after the ledger is unsealed.
"""

from __future__ import annotations

import hashlib
import json
import random
import re
from typing import Any

from .contracts import DIMENSIONS


# Labels are deliberately opaque: no initial, ordering, or seat count is
# recoverable from them.
LABEL_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"


class AnonymizationError(ValueError):
    """The submissions cannot be anonymized without leaking authorship."""


def _shuffle_seed(run_id: str, stage_id: str, submissions: dict[str, Any]) -> int:
    """Derive label assignment from run identity, not from wall-clock time.

    A deterministic seed makes a run reproducible for audit while remaining
    unpredictable to a seat that never sees the run id and member order
    together.
    """
    material = "|".join([run_id, stage_id, *sorted(submissions)])
    digest = hashlib.sha256(material.encode("utf-8")).digest()
    return int.from_bytes(digest[:8], "big")


def assign_labels(
    run_id: str,
    stage_id: str,
    submissions: dict[str, list[dict[str, Any]]],
) -> dict[str, str]:
    """Map each member id to an opaque label. Returns ``{member_id: label}``."""
    if len(submissions) < 2:
        raise AnonymizationError("少于两份提交时同行复核没有意义")
    if len(submissions) > len(LABEL_ALPHABET):
        raise AnonymizationError("提交数量超出可用标签")
    members = sorted(submissions)
    labels = list(LABEL_ALPHABET[: len(members)])
    random.Random(_shuffle_seed(run_id, stage_id, submissions)).shuffle(labels)
    return dict(zip(members, labels))


def build_peer_packet(
    run_id: str,
    stage_id: str,
    submissions: dict[str, list[dict[str, Any]]],
) -> tuple[dict[str, Any], dict[str, Any]]:
    """Split frozen submissions into a blind packet and a sealed ledger.

    Returns ``(packet, ledger)``. The packet is safe to place in a model
    workspace; the ledger must never be.
    """
    labels = assign_labels(run_id, stage_id, submissions)

    cards: list[dict[str, Any]] = []
    for member_id, scorecards in submissions.items():
        label = labels[member_id]
        for card in scorecards:
            # Copy field by field: an unexpected key on an input card must not
            # ride along into the blind packet and identify its author.
            cards.append({
                "label": label,
                "ticker": card["ticker"],
                "dimensions": {name: card["dimensions"][name] for name in DIMENSIONS},
                "confidence": card["confidence"],
                "risk_flags": list(card["risk_flags"]),
                "decision": card["decision"],
                "note": card["note"],
            })

    # Order by content, never by author: grouping or interleaving by member
    # would betray authorship no matter how opaque the labels are.
    cards.sort(key=lambda item: (item["ticker"], item["label"]))

    packet = {
        "runId": run_id,
        "stageId": stage_id,
        "researchOnly": True,
        "liveTrading": False,
        "labels": sorted(labels.values()),
        "cards": cards,
    }
    ledger = {
        "runId": run_id,
        "stageId": stage_id,
        "sealed": True,
        "labelByMember": labels,
        "memberByLabel": {label: member for member, label in labels.items()},
    }
    return packet, ledger


def assert_packet_is_blind(packet: dict[str, Any], member_ids: tuple[str, ...]) -> None:
    """Fail loudly if an author name survived anywhere in the blind packet.

    A seat naming itself in its own rationale ("as Sol, I read this as…") defeats
    anonymity far more directly than writing style does, so the packet is checked
    rather than trusted. Matching is on whole words: a substring rule would trip
    over ordinary prose like "solid" or "console" and make the guard useless by
    crying wolf.
    """
    serialized = json.dumps(packet, ensure_ascii=False)
    for member_id in member_ids:
        needle = member_id.strip()
        if not needle:
            continue
        if re.search(rf"(?<![0-9A-Za-z]){re.escape(needle)}(?![0-9A-Za-z])", serialized, re.IGNORECASE):
            raise AnonymizationError(f"匿名包中仍含有成员标识：{member_id}")


def self_recognition_report(
    reviews_by_member: dict[str, list[dict[str, Any]]],
    ledger: dict[str, Any],
) -> dict[str, Any]:
    """Measure how far blindness actually held, once the ledger is unsealed.

    Two numbers matter. ``selfRecognitionRate`` is how often a seat correctly
    flagged its own card as SELF. ``selfPreferenceDelta`` is the mean agreement
    it gave cards it believed were its own, minus the mean it gave the rest: a
    positive value is the self-preference bias the semi-blind design accepts.
    """
    label_by_member = ledger.get("labelByMember")
    if not isinstance(label_by_member, dict):
        raise AnonymizationError("ledger 缺少 labelByMember")

    rows: list[dict[str, Any]] = []
    for member_id, reviews in sorted(reviews_by_member.items()):
        own_label = label_by_member.get(member_id)
        guessed_self = [item for item in reviews if item["author_guess"] == "SELF"]
        actually_own = [item for item in reviews if item["label"] == own_label]
        correct = [item for item in guessed_self if item["label"] == own_label]

        believed_own = [float(item["agreement"]) for item in guessed_self]
        believed_other = [
            float(item["agreement"]) for item in reviews if item["author_guess"] != "SELF"
        ]
        delta = None
        if believed_own and believed_other:
            delta = round(
                sum(believed_own) / len(believed_own)
                - sum(believed_other) / len(believed_other),
                4,
            )

        rows.append({
            "memberId": member_id,
            "ownLabel": own_label,
            "reviewCount": len(reviews),
            "ownCardCount": len(actually_own),
            "guessedSelfCount": len(guessed_self),
            "correctSelfCount": len(correct),
            "selfRecognitionRate": (
                round(len(correct) / len(actually_own), 4) if actually_own else None
            ),
            "selfPreferenceDelta": delta,
        })
    return {"schemaVersion": "pdc-sustainable-blindness-v1", "members": rows}
