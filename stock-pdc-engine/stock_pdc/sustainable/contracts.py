"""Strict JSON contracts for the sustainable committee.

The scorecard here is a superset of `contracts/pdc-ai-scorecard-output-v1`: the
nine dimensions, the risk-flag vocabulary and the decision vocabulary are copied
exactly so results stay comparable with the deterministic core and with the
metered gateway path. One field is added — `rationale` — because peer review
needs something to argue with beyond the numbers.

Nothing here is repaired or defaulted. A seat that answers off-contract has
failed for the round; a plausible-looking scorecard is never synthesized.
"""

from __future__ import annotations

from typing import Any


R1_INPUT_SCHEMA_VERSION = "pdc-sustainable-r1-input-v1"
R1_OUTPUT_SCHEMA_VERSION = "pdc-sustainable-scorecard-v1"
PEER_INPUT_SCHEMA_VERSION = "pdc-sustainable-peer-input-v1"
PEER_OUTPUT_SCHEMA_VERSION = "pdc-sustainable-peer-review-v1"

# Copied verbatim from contracts/pdc-ai-scorecard-output-v1.schema.json.
DIMENSIONS: tuple[str, ...] = (
    "market_regime",
    "trend",
    "livermore_breakout",
    "volume_price",
    "candlestick",
    "overheat",
    "risk",
    "zhuge_orion",
    "final_chair",
)
RISK_FLAGS: tuple[str, ...] = (
    "MISSING_DATA",
    "DATA_STALE",
    "HIGH_VOLATILITY",
    "OVERHEATED",
    "WEAK_TREND",
    "LIQUIDITY_RISK",
    "MARKET_REGIME_RISK",
    "BREAKOUT_UNCONFIRMED",
    "MODEL_DISAGREEMENT",
)
DECISIONS: tuple[str, ...] = ("BUY", "WATCH", "HOLD", "SELL")

# A short note, not an essay. Round 1 exists to produce nine numbers; long prose
# invites debate the committee is not allowed to have, and costs quota to
# generate. Revisions carry their evidence in `evidence_refs` instead.
MAX_RATIONALE = 160

# Whether a reviewer believes an anonymized card is its own work. This turns the
# accepted blindness leak into a measurable column instead of an assumption.
AUTHOR_GUESSES: tuple[str, ...] = ("SELF", "OTHER", "UNSURE")


def _dimension_properties() -> dict[str, Any]:
    return {name: {"type": "number", "minimum": 0, "maximum": 10} for name in DIMENSIONS}


def scorecard_schema(max_items: int) -> dict[str, Any]:
    """Round 1 output: one independent scorecard per candidate."""
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "additionalProperties": False,
        "required": ["scorecards"],
        "properties": {
            "scorecards": {
                "type": "array",
                "minItems": 1,
                "maxItems": max_items,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    # No `score`: the canonical total is computed locally from
                    # these dimensions and the PDC's own fixed weights, so a
                    # seat cannot set its own weighting by the back door.
                    "required": [
                        "ticker",
                        "dimensions",
                        "confidence",
                        "risk_flags",
                        "decision",
                        "note",
                    ],
                    "properties": {
                        "ticker": {"type": "string", "minLength": 1, "maxLength": 32},
                        "dimensions": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": list(DIMENSIONS),
                            "properties": _dimension_properties(),
                        },
                        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                        "risk_flags": {
                            "type": "array",
                            "maxItems": 12,
                            "items": {"type": "string", "enum": list(RISK_FLAGS)},
                        },
                        "decision": {"type": "string", "enum": list(DECISIONS)},
                        "note": {
                            "type": "string",
                            "minLength": 1,
                            "maxLength": MAX_RATIONALE,
                        },
                    },
                },
            }
        },
    }


def peer_review_schema(max_items: int) -> dict[str, Any]:
    """Peer round output: one critique per anonymized card."""
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "additionalProperties": False,
        "required": ["reviews"],
        "properties": {
            "reviews": {
                "type": "array",
                "minItems": 1,
                "maxItems": max_items,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": [
                        "label",
                        "ticker",
                        "agreement",
                        "challenge",
                        "author_guess",
                    ],
                    "properties": {
                        "label": {"type": "string", "minLength": 1, "maxLength": 4},
                        "ticker": {"type": "string", "minLength": 1, "maxLength": 32},
                        # How far the reviewer would move the card's score.
                        "agreement": {"type": "number", "minimum": -10, "maximum": 10},
                        "challenge": {
                            "type": "string",
                            "minLength": 1,
                            "maxLength": MAX_RATIONALE,
                        },
                        "author_guess": {
                            "type": "string",
                            "enum": list(AUTHOR_GUESSES),
                        },
                    },
                },
            }
        },
    }


class ContractError(ValueError):
    """A seat's answer did not satisfy the contract for its round."""


def _number(value: object, label: str, low: float, high: float) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ContractError(f"{label} 必须是数字")
    number = float(value)
    if not low <= number <= high:
        raise ContractError(f"{label} 必须在 {low}–{high} 之间")
    return round(number, 4)


def validate_scorecards(
    value: object,
    expected_tickers: tuple[str, ...],
) -> list[dict[str, Any]]:
    """Return normalized scorecards, or raise.

    Coverage is exact: a seat may not quietly drop, duplicate, or invent a
    candidate, because a partial round would silently change what the committee
    is comparing.
    """
    if not isinstance(value, dict):
        raise ContractError("输出必须是 JSON 对象")
    rows = value.get("scorecards")
    if not isinstance(rows, list) or not rows:
        raise ContractError("输出缺少 scorecards 数组")

    expected = {ticker.upper() for ticker in expected_tickers}
    normalized: list[dict[str, Any]] = []
    seen: set[str] = set()
    for row in rows:
        if not isinstance(row, dict):
            raise ContractError("每张打分卡必须是对象")
        ticker = str(row.get("ticker") or "").strip().upper()
        if not ticker:
            raise ContractError("打分卡缺少 ticker")
        if ticker in seen:
            raise ContractError(f"打分卡重复：{ticker}")
        if ticker not in expected:
            raise ContractError(f"打分卡包含未提供的候选：{ticker}")
        raw_dimensions = row.get("dimensions")
        if not isinstance(raw_dimensions, dict):
            raise ContractError(f"{ticker} 缺少 dimensions")
        missing = [name for name in DIMENSIONS if name not in raw_dimensions]
        if missing:
            raise ContractError(f"{ticker} 缺少维度：{', '.join(missing)}")
        extra = [name for name in raw_dimensions if name not in DIMENSIONS]
        if extra:
            raise ContractError(f"{ticker} 含未知维度：{', '.join(extra)}")
        decision = str(row.get("decision") or "").strip().upper()
        if decision not in DECISIONS:
            raise ContractError(f"{ticker} 的 decision 非法：{decision or '空'}")
        if "score" in row:
            # A seat that supplies a total is proposing its own weighting.
            raise ContractError(f"{ticker} 不得自带 score，总分由本地按固定权重计算")
        flags = row.get("risk_flags", [])
        if not isinstance(flags, list):
            raise ContractError(f"{ticker} 的 risk_flags 必须是数组")
        unknown = [str(flag) for flag in flags if str(flag) not in RISK_FLAGS]
        if unknown:
            raise ContractError(f"{ticker} 含未知 risk flag：{', '.join(unknown)}")
        note = str(row.get("note") or "").strip()
        if not note:
            raise ContractError(f"{ticker} 缺少 note")

        seen.add(ticker)
        normalized.append({
            "ticker": ticker,
            "dimensions": {
                name: _number(raw_dimensions[name], f"{ticker}.{name}", 0, 10)
                for name in DIMENSIONS
            },
            "confidence": _number(row.get("confidence"), f"{ticker}.confidence", 0, 1),
            "risk_flags": [str(flag) for flag in flags],
            "decision": decision,
            "note": note[:MAX_RATIONALE],
        })

    if seen != expected:
        absent = ", ".join(sorted(expected - seen))
        raise ContractError(f"打分卡未覆盖全部候选，缺少：{absent}")
    return sorted(normalized, key=lambda item: item["ticker"])


def validate_peer_reviews(
    value: object,
    expected_labels: tuple[str, ...],
) -> list[dict[str, Any]]:
    """Return normalized peer reviews, or raise."""
    if not isinstance(value, dict):
        raise ContractError("输出必须是 JSON 对象")
    rows = value.get("reviews")
    if not isinstance(rows, list) or not rows:
        raise ContractError("输出缺少 reviews 数组")

    allowed = set(expected_labels)
    normalized: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for row in rows:
        if not isinstance(row, dict):
            raise ContractError("每条复核必须是对象")
        label = str(row.get("label") or "").strip().upper()
        if label not in allowed:
            raise ContractError(f"复核引用了未知标签：{label or '空'}")
        ticker = str(row.get("ticker") or "").strip().upper()
        if not ticker:
            raise ContractError("复核缺少 ticker")
        key = (label, ticker)
        if key in seen:
            raise ContractError(f"复核重复：{label}/{ticker}")
        guess = str(row.get("author_guess") or "").strip().upper()
        if guess not in AUTHOR_GUESSES:
            raise ContractError(f"{label}/{ticker} 的 author_guess 非法")
        challenge = str(row.get("challenge") or "").strip()
        if not challenge:
            raise ContractError(f"{label}/{ticker} 缺少 challenge")
        seen.add(key)
        normalized.append({
            "label": label,
            "ticker": ticker,
            "agreement": _number(row.get("agreement"), f"{label}/{ticker}.agreement", -10, 10),
            "challenge": challenge[:MAX_RATIONALE],
            "author_guess": guess,
        })
    return normalized
