"""Frozen evidence identifiers for one committee run.

Every downstream artifact references these hashes, so a later reader can prove
which candidate set and which facts a score was actually produced from. Nothing
here fetches, screens, or scores: it only fingerprints what the existing
pipeline already froze.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from typing import Any


EVIDENCE_SCHEMA_VERSION = "pdc-sustainable-evidence-v1"


def canonical_hash(value: object) -> str:
    """SHA-256 over a canonical JSON encoding, stable across runs."""
    encoded = json.dumps(
        value, ensure_ascii=False, sort_keys=True, separators=(",", ":")
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def candidate_set_hash(tickers: tuple[str, ...]) -> str:
    """Fingerprint of the candidate set alone, independent of fact content."""
    return canonical_hash(sorted({ticker.upper() for ticker in tickers}))


def facts_hash(payload: dict[str, Any]) -> str:
    """Fingerprint of the exact facts package handed to every seat."""
    return canonical_hash(payload.get("candidates", []))


def freeze(run_id: str, payload: dict[str, Any], analysis_date: str) -> dict[str, Any]:
    """Produce the snapshot record that Round 1 is bound to."""
    tickers = tuple(item["ticker"] for item in payload["candidates"])
    fingerprints = {
        "candidateSetHash": candidate_set_hash(tickers),
        "factsHash": facts_hash(payload),
    }
    return {
        "schemaVersion": EVIDENCE_SCHEMA_VERSION,
        # Derived from content, not from the clock: two runs over the same
        # candidates and facts carry the same snapshot id.
        "snapshotId": f"snap-{analysis_date}-{fingerprints['candidateSetHash'][:12]}",
        "runId": run_id,
        "analysisDate": analysis_date,
        "frozenAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "candidateCount": len(tickers),
        "includesBaseline": bool(payload.get("includesBaseline")),
        **fingerprints,
    }


def seat_result_hash(record: dict[str, Any]) -> str:
    """Fingerprint one seat's frozen Round 1 submission."""
    return canonical_hash({
        "memberId": record.get("memberId"),
        "scorecards": record.get("scorecards", []),
    })


def freeze_round_one(snapshot: dict[str, Any], frozen: dict[str, Any]) -> dict[str, Any]:
    """Bind each completed seat's Round 1 to the snapshot it answered."""
    hashes = {
        record["memberId"]: seat_result_hash(record)
        for record in frozen.get("memberResults", [])
        if record.get("status") == "COMPLETED"
    }
    return {
        "schemaVersion": EVIDENCE_SCHEMA_VERSION,
        "snapshotId": snapshot["snapshotId"],
        "candidateSetHash": snapshot["candidateSetHash"],
        "factsHash": snapshot["factsHash"],
        "roundOneHashes": hashes,
    }
