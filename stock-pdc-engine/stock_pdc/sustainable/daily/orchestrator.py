"""Wiring for one DAILY_TOP10 run, including how it degrades.

The happy path is three rounds and ten seats. The interesting part is what
happens when it is not:

* a seat fails discovery or the detail round → **no new buys today**. One model's
  scores are not a committee, and the daily list is not allowed to quietly
  become a single opinion. Yesterday's seats are carried forward, re-checked,
  and anything no longer tradeable becomes cash.
* the review round fails, or the budget is gone → fall back to the detail
  round's consensus. That is a complete, two-seat, evidence-bound result; losing
  the third round costs refinement, not validity.
* the two seats' totals still sit apart after review → that candidate is marked
  UNRESOLVED_DISAGREEMENT and cannot be bought. The next name takes the seat.

Every degradation is named in the artifacts and on the page, never inferred.
"""

from __future__ import annotations

import shutil
import tempfile
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

from ..evidence import canonical_hash, candidate_set_hash
from ..round_one import write_json
from ..roster import DEFAULT_ROSTER, Member
from ..runner import DEFAULT_TIMEOUT_SECONDS, invoke
from . import consensus as consensus_module
from . import detail as detail_module
from . import discovery as discovery_module
from . import facts as facts_module
from . import report as report_module
from . import review as review_module
from . import selection as selection_module
from .contracts import DISCOVERY_PICKS, ContractError
from .eligibility import EligibilityConfig, screen_all
from .quota import Invoker, QuotaLedger
from .sources import DailyInputs


DAILY_RUN_SCHEMA_VERSION = "pdc-daily-run-v1"
RUNTIME_MODE = "DAILY_TOP10"

DEGRADATION_NONE = "NONE"
DEGRADATION_R3_SKIPPED = "R3_SKIPPED_QUOTA"
DEGRADATION_R3_FAILED = "R3_FAILED_USED_R2"
DEGRADATION_R2_FAILED = "R2_SEAT_FAILED_CARRY_FORWARD"
DEGRADATION_R1_FAILED = "R1_SEAT_FAILED_CARRY_FORWARD"


@dataclass
class DailyConfig:
    """Everything one daily run is allowed to decide before it starts."""

    run_id: str = ""
    discovery_picks: int = DISCOVERY_PICKS
    preliminary_top: int = consensus_module.DEFAULT_PRELIMINARY_TOP
    disagreement_limit: float = consensus_module.DEFAULT_TOTAL_DISAGREEMENT_LIMIT
    challenge_threshold: float = 2.0
    posture: str = ""
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS
    skip_review: bool = False
    eligibility: EligibilityConfig = field(default_factory=EligibilityConfig)
    selection: selection_module.SelectionConfig = field(
        default_factory=selection_module.SelectionConfig
    )


def _freshness(analysis_date: str, today: date, max_age_days: int) -> tuple[str, int]:
    try:
        age = (today - date.fromisoformat(analysis_date)).days
    except (TypeError, ValueError):
        return "UNKNOWN", -1
    return ("FRESH" if age <= max_age_days else f"STALE_{age}D"), age


def merge_rankings(
    post_detail: dict[str, Any],
    post_review: dict[str, Any] | None,
) -> dict[str, Any]:
    """Final ranking: reviewed finalists, plus the rest of the union beneath them.

    Re-sorted rather than concatenated. A finalist whose score fell in review can
    legitimately end up below a candidate that was never reviewed, and pretending
    otherwise would hide the very movement the round exists to produce.
    """
    if post_review is None:
        return post_detail
    reviewed = {row["ticker"]: row for row in post_review["rows"]}
    rows = [reviewed.get(row["ticker"], row) for row in post_detail["rows"]]
    rows.sort(key=lambda row: (-row["consensusTotal"], -row["meanConfidence"], row["ticker"]))
    for position, row in enumerate(rows, start=1):
        row["rank"] = position
    merged = {**post_review, "rows": rows}
    merged["poolSize"] = len(rows)
    merged["stage"] = "post-review-merged"
    merged["reviewedTickers"] = sorted(reviewed)
    merged["unresolvedCount"] = sum(bool(row.get("unresolvedDisagreement")) for row in rows)
    merged["highDisagreementCount"] = sum(bool(row.get("highDisagreement")) for row in rows)
    return merged


def run_daily(
    inputs: DailyInputs,
    target: Path,
    today: date,
    previous: dict[str, int],
    previous_trade_date: str = "",
    config: DailyConfig | None = None,
    members: tuple[Member, ...] = DEFAULT_ROSTER,
    ledger: QuotaLedger | None = None,
    invoker: Invoker = invoke,
    workspace_root: Path | None = None,
) -> dict[str, Any]:
    """Run one DAILY_TOP10 day end to end and write its artifacts."""
    config = config or DailyConfig()
    ledger = ledger or QuotaLedger()
    run_id = config.run_id or f"daily-{inputs.analysis_date}"
    owned_workspace = workspace_root is None
    workspace_root = workspace_root or Path(tempfile.mkdtemp(prefix="pdc-daily-"))
    degradation: list[str] = []
    status = DEGRADATION_NONE

    try:
        # ── Hard eligibility ────────────────────────────────────────────────
        eligibility_report = screen_all(
            inputs.candidates, inputs.analysis_date, today, config.eligibility
        )
        blocked = {
            row["ticker"]: row["reasons"]
            for row in eligibility_report["rows"]
            if row["status"] == "BLOCKED"
        }
        eligible = set(eligibility_report["eligible"])
        records = [record for record in inputs.records if record["ticker"] in eligible]
        if not records:
            raise ContractError("硬资格检查后没有候选，无法进入发现轮。")
        table = facts_module.build_table(records, inputs.analysis_date, run_id)

        freshness, age = _freshness(
            inputs.analysis_date, today, config.eligibility.max_data_age_days
        )
        snapshot = {
            "schemaVersion": "pdc-daily-snapshot-v1",
            "runId": run_id,
            "runtimeMode": RUNTIME_MODE,
            "analysisDate": inputs.analysis_date,
            "frozenAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "snapshotId": f"snap-{inputs.analysis_date}-{canonical_hash(table['tickers'])[:12]}",
            "candidateSetHash": candidate_set_hash(tuple(table["tickers"])),
            "factsHash": table["factsHash"],
            "candidateCount": table["candidateCount"],
            "screenedCount": eligibility_report["screenedCount"],
            "dataFreshnessStatus": freshness,
            "dataAgeDays": age,
            "dataDir": str(inputs.data_dir),
            "scoresPath": str(inputs.scores_path),
            "universePath": str(inputs.universe_path),
        }
        write_json(target / "eligibility.json", eligibility_report)
        write_json(target / "snapshot.json", snapshot)
        write_json(target / "facts.json", table)

        # ── Round 1: independent discovery ──────────────────────────────────
        discovery_payload = discovery_module.build_payload(table, run_id, config.discovery_picks)
        write_json(target / "d1-input.json", discovery_payload)
        discovery_record = discovery_module.run_discovery(
            members,
            workspace_root / "d1",
            discovery_payload,
            ledger,
            config.timeout_seconds,
            invoker,
        )
        write_json(target / "d1-discovery.json", discovery_record)

        union: tuple[str, ...] = ()
        detail_record: dict[str, Any] | None = None
        post_detail: dict[str, Any] | None = None
        post_review: dict[str, Any] | None = None
        review_record: dict[str, Any] | None = None
        final_ranking: dict[str, Any] | None = None

        if not discovery_record["quorumMet"]:
            status = DEGRADATION_R1_FAILED
            degradation.append(
                "发现轮未达法定人数："
                + "；".join(
                    f"{item['memberId']} {item['failureReason']}"
                    for item in discovery_record["failedMembers"]
                )
            )
        else:
            union = discovery_module.union_of(discovery_record)
            write_json(
                target / "d1-union.json",
                {
                    "schemaVersion": "pdc-daily-union-v1",
                    "runId": run_id,
                    "unionSize": len(union),
                    "tickers": list(union),
                    "nominations": discovery_module.nomination_index(discovery_record),
                },
            )

            # ── Round 2: nine dimensions on the union only ──────────────────
            union_table = facts_module.subset(table, union)
            detail_record = detail_module.run_detail(
                members,
                workspace_root / "d2",
                union_table,
                run_id,
                ledger,
                config.timeout_seconds,
                invoker,
            )
            write_json(target / "d2-detail.json", detail_record)

            if not detail_record["quorumMet"]:
                status = DEGRADATION_R2_FAILED
                degradation.append(
                    "详细评分轮未达法定人数："
                    + "；".join(
                        f"{item['memberId']} {item['failureReason']}"
                        for item in detail_record["memberResults"]
                        if item["status"] != "COMPLETED"
                    )
                )
            else:
                detail_module.assert_identical_coverage(detail_record)
                submissions = detail_record["submissions"]
                post_detail = consensus_module.build(
                    submissions,
                    inputs.engine_facts,
                    "post-detail",
                    config.challenge_threshold,
                    config.disagreement_limit,
                )
                write_json(target / "d2-consensus.json", post_detail)
                final_ranking = post_detail

                # ── Round 3: anonymous cross review of the finalists ────────
                finalists = consensus_module.preliminary_top(post_detail, config.preliminary_top)
                write_json(
                    target / "d3-preliminary.json",
                    {
                        "schemaVersion": "pdc-daily-preliminary-v1",
                        "runId": run_id,
                        "count": len(finalists),
                        "tickers": list(finalists),
                    },
                )
                if config.skip_review:
                    status = DEGRADATION_R3_SKIPPED
                    degradation.append("按配置跳过终审轮，使用第二轮共识。")
                elif not all(ledger.may_call(member.member_id, "review") for member in members):
                    status = DEGRADATION_R3_SKIPPED
                    degradation.append("终审轮额度不足，安全降级为第二轮共识。")
                else:
                    review_table = facts_module.subset(table, finalists)
                    review_record = review_module.run_review(
                        members,
                        workspace_root / "d3",
                        review_table,
                        submissions,
                        run_id,
                        ledger,
                        config.timeout_seconds,
                        invoker,
                    )
                    seal = review_record.pop("ledger")
                    final_scores = review_record.pop("finalScores")
                    # The ledger unseals authorship; it is written beside the run,
                    # never into a workspace a seat can read.
                    write_json(target / "d3-ledger.json", seal)
                    write_json(target / "d3-review.json", review_record)
                    for member_id, cards in final_scores.items():
                        # The before matrix is `d2-detail.json`; this is the
                        # after. Both are kept so a revision can be replayed.
                        write_json(target / f"d3-final-{member_id}.json", cards)
                    if review_record["quorumMet"]:
                        post_review = consensus_module.build(
                            final_scores,
                            inputs.engine_facts,
                            "post-review",
                            config.challenge_threshold,
                            config.disagreement_limit,
                        )
                        write_json(target / "d3-consensus.json", post_review)
                        final_ranking = merge_rankings(post_detail, post_review)
                    else:
                        status = DEGRADATION_R3_FAILED
                        degradation.append(
                            "终审轮未达法定人数，安全降级为第二轮共识："
                            + "；".join(
                                f"{item['memberId']} {item['failureReason']}"
                                for item in review_record["memberResults"]
                                if item["status"] != "COMPLETED"
                            )
                        )

        # ── Final gate: exactly ten seats ───────────────────────────────────
        records_by_ticker = facts_module.records_by_ticker(table)
        allow_new_buys = final_ranking is not None
        if final_ranking is None:
            # No two-seat opinion today: carry yesterday forward, re-checked.
            selected = selection_module.carry_forward(previous, blocked, config.selection)
            notes: dict[str, dict[str, Any]] = {}
        else:
            selected = selection_module.select(
                final_ranking,
                records_by_ticker,
                blocked,
                previous,
                config.selection,
                allow_new_buys=True,
            )
            notes = consensus_module.seat_notes(detail_record["submissions"])

        factor = selection_module.exposure_factor(inputs.market_regime_score, config.posture)
        selected = selection_module.allocate(selected, factor)
        write_json(target / "selection.json", selected)

        # ── The one artifact of the day ─────────────────────────────────────
        context = {
            "asOfTradeDate": inputs.analysis_date,
            "dataFreshnessStatus": freshness,
            "runtimeMode": RUNTIME_MODE,
            "degradationStatus": status,
            "seatCount": selected["seatCount"],
            "cashSeats": selected["cashSeats"],
            "investedPct": selected["investedPct"],
            "cashReservePct": selected["cashReservePct"],
            "exposureFactor": selected["exposureFactor"],
            "eligibleCount": eligibility_report["eligibleCount"],
            "snapshotId": snapshot["snapshotId"],
            "factsHash": snapshot["factsHash"],
            "generatedAt": snapshot["frozenAt"],
        }
        stops = {
            ticker: record["values"].get("stop")
            for ticker, record in records_by_ticker.items()
        }
        reasons = {
            seat["ticker"]: (
                consensus_module.main_reason_for(seat["ticker"], notes)
                or inputs.main_reasons.get(seat["ticker"], "")
            )
            for seat in selected["seats"]
        }
        risks = {}
        for seat in selected["seats"]:
            ticker = seat["ticker"]
            flags = consensus_module.risk_flags_for(ticker, notes)
            engine_risk = inputs.main_risks.get(ticker, "")
            risks[ticker] = " | ".join(part for part in (engine_risk, ", ".join(flags)) if part)

        rows = report_module.build_rows(
            selected["seats"], context, inputs.names, stops, reasons, risks, previous
        )
        audit = {
            "quota": ledger.to_json(),
            "unresolvedTickers": selected["unresolvedTickers"],
            "droppedHoldings": selected["droppedHoldings"],
            "blockedReasonCounts": eligibility_report["blockedReasonCounts"],
            "degradation": degradation,
        }

        write_json(
            target / "run.json",
            {
                "schemaVersion": DAILY_RUN_SCHEMA_VERSION,
                "runId": run_id,
                "runtimeMode": RUNTIME_MODE,
                "researchOnly": True,
                "liveTrading": False,
                "analysisDate": inputs.analysis_date,
                "snapshot": snapshot,
                "degradationStatus": status,
                "degradation": degradation,
                "allowedNewBuys": allow_new_buys,
                "unionSize": len(union),
                "preliminaryTop": config.preliminary_top,
                "disagreementLimit": config.disagreement_limit,
                "exposureFactor": factor,
                "posture": config.posture,
                "seats": selected["seats"],
                "quota": ledger.to_json(),
                "previousTradeDate": previous_trade_date,
                "previousSeatCount": len(previous),
            },
        )
        ledger.write(target / "quota.json")

        return {
            "runId": run_id,
            "target": target,
            "snapshot": snapshot,
            "eligibility": eligibility_report,
            "discovery": discovery_record,
            "union": union,
            "detail": detail_record,
            "review": review_record,
            "ranking": final_ranking,
            "selection": selected,
            "rows": rows,
            "context": context,
            "audit": audit,
            "degradationStatus": status,
            "degradation": degradation,
            "ledger": ledger,
        }
    finally:
        if owned_workspace:
            shutil.rmtree(workspace_root, ignore_errors=True)
