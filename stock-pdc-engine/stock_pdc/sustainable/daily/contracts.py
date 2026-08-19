"""Strict contracts for the three daily rounds.

The nine-dimension scorecard is not redefined here: the detail round reuses the
committee's existing schema and its existing validator, so the daily path and
the offline audit path cannot drift into scoring different things. What is new
is the shape of the first and third rounds.

Round 1 asks for a ranked short list and nothing else — no dimension matrix for
several hundred names, which is the cost that made the full committee unusable
daily. Round 3 asks for revisions that cite fact ids, so a seat that changes its
mind has to point at the evidence that changed it.
"""

from __future__ import annotations

from typing import Any

from ..contracts import (
    DECISIONS,
    DIMENSIONS,
    MAX_RATIONALE,
    RISK_FLAGS,
    ContractError,
    scorecard_schema,
    validate_scorecards,
)
from .facts import NUMERIC_FIELDS, fact_id


DISCOVERY_SCHEMA_VERSION = "pdc-daily-discovery-v1"
DETAIL_SCHEMA_VERSION = "pdc-daily-detail-v1"
REVIEW_SCHEMA_VERSION = "pdc-daily-review-v1"

# Round 1 output is deliberately tiny: a ticker, where the seat ranks it, one
# number, and codes from a closed list. Prose here would cost output tokens the
# detail round needs and would invite an argument nobody reads.
REASON_CODES: tuple[str, ...] = (
    "TREND_STACK",
    "ABOVE_SMA50",
    "MOMENTUM_20D",
    "MOMENTUM_60D",
    "RELATIVE_STRENGTH",
    "PIVOT_PROXIMITY",
    "BASE_TIGHT",
    "PULLBACK_HEALTHY",
    "VOLUME_SUPPORT",
    "LOW_VOLATILITY",
    "RSI_ROOM",
    "STOP_TIGHT",
    "LIQUIDITY_DEEP",
    "LARGE_CAP",
)
MAX_REASON_CODES = 4

# Round 1 nominates this many names per seat. Two seats therefore hand the
# detail round between 30 (identical lists) and 60 (disjoint lists) candidates.
DISCOVERY_PICKS = 30

MAX_CHALLENGE = 200
MAX_REVISION_NOTE = 200
MAX_FACT_IDS = 6


def discovery_schema(max_items: int) -> dict[str, Any]:
    """Round 1 output: a ranked short list, no dimension matrix."""
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "additionalProperties": False,
        "required": ["picks"],
        "properties": {
            "picks": {
                "type": "array",
                "minItems": 1,
                "maxItems": max_items,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["ticker", "rank", "lightweight_score", "reason_codes"],
                    "properties": {
                        "ticker": {"type": "string", "minLength": 1, "maxLength": 32},
                        "rank": {"type": "integer", "minimum": 1, "maximum": max_items},
                        "lightweight_score": {"type": "number", "minimum": 0, "maximum": 10},
                        "reason_codes": {
                            "type": "array",
                            "minItems": 1,
                            "maxItems": MAX_REASON_CODES,
                            "items": {"type": "string", "enum": list(REASON_CODES)},
                        },
                    },
                },
            }
        },
    }


def detail_schema(max_items: int) -> dict[str, Any]:
    """Round 2 output: the committee's existing nine-dimension scorecard."""
    return scorecard_schema(max_items)


def review_schema(tickers: tuple[str, ...], max_items: int) -> dict[str, Any]:
    """Round 3 output: one assessment per finalist, revisions cite frozen facts.

    A citation is a ticker and a field, each drawn from an enumeration, not a
    dotted string the seat has to spell. The first real run showed why: one seat
    wrote `600968.SZ.pivot55` for `600968.SH` and lost twenty-five otherwise
    valid revisions to a single mistyped exchange suffix. Enumerated, that
    mistake cannot be expressed.

    The ticker enum is the whole finalist set, not the revision's own ticker,
    because the round's job is comparing twenty candidates: "its ATR is double
    the one ranked above it" is evidence, and both numbers are in the packet.
    """
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "additionalProperties": False,
        "required": ["assessments"],
        "properties": {
            "assessments": {
                "type": "array",
                "minItems": 1,
                "maxItems": max_items,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["ticker", "confidence", "challenge", "revisions"],
                    "properties": {
                        "ticker": {"type": "string", "minLength": 1, "maxLength": 32},
                        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                        "challenge": {
                            "type": "string",
                            "minLength": 1,
                            "maxLength": MAX_CHALLENGE,
                        },
                        "revisions": {
                            "type": "array",
                            # Standing by every score is a complete answer.
                            "minItems": 0,
                            "maxItems": len(DIMENSIONS),
                            "items": {
                                "type": "object",
                                "additionalProperties": False,
                                "required": [
                                    "dimension",
                                    "from_score",
                                    "to_score",
                                    "fact_refs",
                                    "note",
                                ],
                                "properties": {
                                    "dimension": {"type": "string", "enum": list(DIMENSIONS)},
                                    "from_score": {"type": "number", "minimum": 0, "maximum": 10},
                                    "to_score": {"type": "number", "minimum": 0, "maximum": 10},
                                    "fact_refs": {
                                        "type": "array",
                                        "minItems": 1,
                                        "maxItems": MAX_FACT_IDS,
                                        "items": {
                                            "type": "object",
                                            "additionalProperties": False,
                                            "required": ["ticker", "field"],
                                            "properties": {
                                                "ticker": {
                                                    "type": "string",
                                                    "enum": list(tickers),
                                                },
                                                "field": {
                                                    "type": "string",
                                                    "enum": list(NUMERIC_FIELDS),
                                                },
                                            },
                                        },
                                    },
                                    "note": {"type": "string", "maxLength": MAX_REVISION_NOTE},
                                },
                            },
                        },
                    },
                },
            }
        },
    }


def _number(value: object, label: str, low: float, high: float) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ContractError(f"{label} 必须是数字")
    number = float(value)
    if not low <= number <= high:
        raise ContractError(f"{label} 必须在 {low}–{high} 之间")
    return round(number, 4)


def validate_picks(
    value: object,
    allowed_tickers: tuple[str, ...],
    expected_count: int,
) -> list[dict[str, Any]]:
    """Return one seat's normalized short list, or raise.

    The count is exact and the ranks must be a permutation of 1..N. A seat that
    returns twenty-eight names, or two names at rank 3, has not produced the
    list the union is defined over.
    """
    if not isinstance(value, dict):
        raise ContractError("输出必须是 JSON 对象")
    rows = value.get("picks")
    if not isinstance(rows, list) or not rows:
        raise ContractError("输出缺少 picks 数组")
    if len(rows) != expected_count:
        raise ContractError(f"提名数量必须恰好 {expected_count} 个，实际 {len(rows)} 个")

    allowed = {ticker.upper() for ticker in allowed_tickers}
    normalized: list[dict[str, Any]] = []
    seen_tickers: set[str] = set()
    seen_ranks: set[int] = set()
    for row in rows:
        if not isinstance(row, dict):
            raise ContractError("每个提名必须是对象")
        ticker = str(row.get("ticker") or "").strip().upper()
        if not ticker:
            raise ContractError("提名缺少 ticker")
        if ticker not in allowed:
            # A nominated name that was never offered is either a hallucination
            # or a candidate the hard gate already removed.
            raise ContractError(f"提名了不在候选池中的股票：{ticker}")
        if ticker in seen_tickers:
            raise ContractError(f"提名重复：{ticker}")
        rank = row.get("rank")
        if isinstance(rank, bool) or not isinstance(rank, int):
            raise ContractError(f"{ticker} 的 rank 必须是整数")
        if not 1 <= rank <= expected_count:
            raise ContractError(f"{ticker} 的 rank {rank} 越界")
        if rank in seen_ranks:
            raise ContractError(f"rank 重复：{rank}")
        codes = row.get("reason_codes")
        if not isinstance(codes, list) or not codes:
            raise ContractError(f"{ticker} 缺少 reason_codes")
        unknown = [str(code) for code in codes if str(code) not in REASON_CODES]
        if unknown:
            raise ContractError(f"{ticker} 含未知 reason_code：{', '.join(unknown)}")
        if len(codes) > MAX_REASON_CODES:
            raise ContractError(f"{ticker} 的 reason_codes 超过 {MAX_REASON_CODES} 个")

        seen_tickers.add(ticker)
        seen_ranks.add(rank)
        normalized.append({
            "ticker": ticker,
            "rank": rank,
            "lightweight_score": _number(
                row.get("lightweight_score"), f"{ticker}.lightweight_score", 0, 10
            ),
            "reason_codes": [str(code) for code in codes],
        })

    return sorted(normalized, key=lambda item: item["rank"])


def validate_scorecard_subset(
    value: object,
    allowed_tickers: tuple[str, ...],
) -> list[dict[str, Any]]:
    """Validate a detail answer that may cover only part of the round.

    Coverage of the whole round is still required — but it is required of the
    *seat*, not of a single response, so a truncated answer can be completed by
    asking for the missing names instead of paying for the whole round again.
    Every other rule, including the ban on a model-supplied total, comes from
    the committee's own validator.
    """
    if not isinstance(value, dict):
        raise ContractError("输出必须是 JSON 对象")
    rows = value.get("scorecards")
    if not isinstance(rows, list) or not rows:
        raise ContractError("输出缺少 scorecards 数组")
    allowed = {ticker.upper() for ticker in allowed_tickers}
    returned: list[str] = []
    for row in rows:
        if not isinstance(row, dict):
            raise ContractError("每张打分卡必须是对象")
        ticker = str(row.get("ticker") or "").strip().upper()
        if not ticker:
            raise ContractError("打分卡缺少 ticker")
        if ticker not in allowed:
            raise ContractError(f"打分卡包含未提供的候选：{ticker}")
        returned.append(ticker)
    return validate_scorecards(value, tuple(returned))


def resolve_fact_refs(
    item: dict[str, Any],
    own_ticker: str,
    fact_index: dict[str, set[str]],
    label: str,
) -> list[tuple[str, str]]:
    """Return the ``(ticker, field)`` pairs one revision cites, or raise.

    The schema asks for objects, but a CLI whose structured-output support is
    weaker may still emit the older dotted strings, so those are parsed too. The
    shape is forgiving; the meaning is not. Every citation must resolve to a
    field that actually has a value on a candidate in this round's frozen facts,
    so a fabricated reference is rejected either way.
    """
    refs = item.get("fact_refs")
    parsed: list[tuple[str, str]] = []
    if isinstance(refs, list) and refs:
        for ref in refs:
            if not isinstance(ref, dict):
                raise ContractError(f"{label} 的 fact_refs 每一项必须是对象")
            parsed.append((
                str(ref.get("ticker") or "").strip().upper(),
                str(ref.get("field") or "").strip(),
            ))
    else:
        legacy = item.get("fact_ids")
        if not isinstance(legacy, list) or not legacy:
            raise ContractError(f"{label} 的修改缺少 fact_refs")
        for ref in legacy:
            token = str(ref).strip()
            if not token:
                continue
            # `600968.SH.pivot55` splits into candidate and field; a bare field
            # name is read as this revision's own candidate.
            candidate, separator, field = token.rpartition(".")
            parsed.append(((candidate or own_ticker).upper(), field if separator else token))

    if not parsed:
        raise ContractError(f"{label} 的修改缺少 fact_refs")

    unknown: list[str] = []
    resolved: list[tuple[str, str]] = []
    for candidate, field in parsed:
        if field not in fact_index.get(candidate, set()):
            unknown.append(f"{candidate}.{field}")
            continue
        if (candidate, field) not in resolved:
            resolved.append((candidate, field))
    if unknown:
        raise ContractError(
            f"{label} 引用了本轮冻结事实中不存在的依据：{', '.join(unknown)}"
        )
    return resolved[:MAX_FACT_IDS]


def validate_assessments(
    value: object,
    expected_tickers: tuple[str, ...],
    own_cards: dict[str, dict[str, Any]],
    fact_index: dict[str, set[str]],
) -> list[dict[str, Any]]:
    """Return one seat's normalized final review, or raise.

    Three rules do the work. Coverage is exact, so a seat cannot quietly drop the
    finalists it has nothing to say about. ``from_score`` must match what that
    seat actually submitted in the detail round, so history cannot be restated.
    And every revision must cite facts that exist in this round's frozen table,
    so the final round moves scores on evidence rather than on a second
    impression.

    A citation may name any finalist, not only the revision's own. The first real
    run showed a seat arguing "this candidate's ATR against the one ranked above
    it" — a comparison is exactly the kind of reasoning a cross-sectional round
    should produce, and both numbers were already in the packet it was handed.
    Cross-ticker citations are recorded rather than forbidden.
    """
    if not isinstance(value, dict):
        raise ContractError("输出必须是 JSON 对象")
    rows = value.get("assessments")
    if not isinstance(rows, list) or not rows:
        raise ContractError("输出缺少 assessments 数组")

    expected = {ticker.upper() for ticker in expected_tickers}
    normalized: list[dict[str, Any]] = []
    seen: set[str] = set()
    for row in rows:
        if not isinstance(row, dict):
            raise ContractError("每条终审必须是对象")
        ticker = str(row.get("ticker") or "").strip().upper()
        if ticker not in expected:
            raise ContractError(f"终审引用了不在终选名单中的股票：{ticker or '空'}")
        if ticker in seen:
            raise ContractError(f"终审重复：{ticker}")
        challenge = str(row.get("challenge") or "").strip()
        if not challenge:
            raise ContractError(f"{ticker} 缺少 challenge")

        raw_revisions = row.get("revisions")
        if not isinstance(raw_revisions, list):
            raise ContractError(f"{ticker} 的 revisions 必须是数组")
        card = own_cards.get(ticker)
        if card is None:
            raise ContractError(f"{ticker} 没有本席位的第二轮打分，无法校验修改")

        revisions: list[dict[str, Any]] = []
        seen_dimensions: set[str] = set()
        for item in raw_revisions:
            if not isinstance(item, dict):
                raise ContractError(f"{ticker} 的每条修改必须是对象")
            dimension = str(item.get("dimension") or "").strip()
            if dimension not in DIMENSIONS:
                raise ContractError(f"{ticker} 的修改维度非法：{dimension or '空'}")
            if dimension in seen_dimensions:
                raise ContractError(f"{ticker}/{dimension} 修改重复")
            original = float(card["dimensions"][dimension])
            from_score = _number(item.get("from_score"), f"{ticker}/{dimension}.from_score", 0, 10)
            to_score = _number(item.get("to_score"), f"{ticker}/{dimension}.to_score", 0, 10)
            if abs(from_score - original) > 1e-6:
                raise ContractError(
                    f"{ticker}/{dimension} 的 from_score {from_score} 与第二轮记录 {original} 不符"
                )
            if abs(to_score - from_score) < 1e-9:
                # A revision that changes nothing is not a revision; saying so
                # belongs in `challenge`.
                raise ContractError(f"{ticker}/{dimension} 的修改前后分数相同")
            resolved = resolve_fact_refs(item, ticker, fact_index, f"{ticker}/{dimension}")
            seen_dimensions.add(dimension)
            revisions.append({
                "dimension": dimension,
                "from_score": from_score,
                "to_score": to_score,
                "fact_refs": [
                    {"ticker": candidate, "field": field} for candidate, field in resolved
                ],
                # The fully qualified form is kept for the audit trail, so a
                # revision can be traced to the exact frozen value it cited.
                "fact_ids": [fact_id(candidate, field) for candidate, field in resolved],
                "cross_ticker_refs": [
                    fact_id(candidate, field)
                    for candidate, field in resolved
                    if candidate != ticker
                ],
                "note": str(item.get("note") or "")[:MAX_REVISION_NOTE],
            })

        seen.add(ticker)
        normalized.append({
            "ticker": ticker,
            "confidence": _number(row.get("confidence"), f"{ticker}.confidence", 0, 1),
            "challenge": challenge[:MAX_CHALLENGE],
            "revisions": revisions,
        })

    if seen != expected:
        missing = ", ".join(sorted(expected - seen))
        raise ContractError(f"终审未覆盖全部终选名单，缺少：{missing}")
    return sorted(normalized, key=lambda item: item["ticker"])


__all__ = [
    "DECISIONS",
    "DIMENSIONS",
    "DISCOVERY_PICKS",
    "MAX_RATIONALE",
    "REASON_CODES",
    "RISK_FLAGS",
    "ContractError",
    "detail_schema",
    "discovery_schema",
    "resolve_fact_refs",
    "review_schema",
    "validate_assessments",
    "validate_picks",
    "validate_scorecard_subset",
]
