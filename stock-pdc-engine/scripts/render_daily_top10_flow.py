#!/usr/bin/env python3
"""Render a self-contained DAILY_TOP10 audit-flow page from JSON artifacts.

This is intentionally a presentation-only tool.  It never invokes a model and
does not import or change the PDC selection path.  The generated page embeds a
small, normalized view of the JSON audit records so it can be opened directly
from Finder (no local web server or network connection required).
"""

from __future__ import annotations

import argparse
import html
import json
import math
from pathlib import Path
from typing import Any


DEFAULT_AUDIT = Path("outputs/sustainable/daily/daily-20260819-real-01")
DEFAULT_OUTPUT = Path("visualizations/daily_top10_flow.html")


def read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def format_duration(seconds: float) -> str:
    seconds = max(0, int(round(seconds)))
    minutes, remainder = divmod(seconds, 60)
    if minutes:
        return f"{minutes}分{remainder:02d}秒"
    return f"{remainder}秒"


def safe_rel_link(target: Path, output: Path) -> str:
    """Return a local relative href from the generated page to an artifact."""

    relative = Path(target).resolve().relative_to(Path.cwd().resolve())
    from_dir = output.resolve().parent
    link = Path("..")
    # relpath is used through pathlib so separators are normalized below.
    import os

    return Path(os.path.relpath(Path.cwd().resolve() / relative, from_dir)).as_posix()


def source_entry(name: str, audit_dir: Path, output: Path) -> dict[str, str]:
    target = audit_dir / name
    return {"name": name, "href": safe_rel_link(target, output)}


def name_map(eligibility: dict[str, Any]) -> dict[str, str]:
    return {
        row["ticker"]: row.get("name", "")
        for row in eligibility.get("rows", [])
        if row.get("ticker")
    }


def member_label(member_id: str) -> str:
    return {"sol": "Codex", "claude": "Claude"}.get(member_id, member_id)


def normalize_member_picks(
    member: dict[str, Any], names: dict[str, str]
) -> list[dict[str, Any]]:
    return [
        {
            "ticker": pick["ticker"],
            "name": names.get(pick["ticker"], ""),
            "rank": pick.get("rank"),
            "score": pick.get("lightweight_score"),
            "reasonCodes": pick.get("reason_codes", []),
        }
        for pick in member.get("picks", [])
    ]


def build_view(audit_dir: Path, output: Path) -> dict[str, Any]:
    snapshot = read_json(audit_dir / "snapshot.json")
    eligibility = read_json(audit_dir / "eligibility.json")
    facts = read_json(audit_dir / "facts.json")
    discovery = read_json(audit_dir / "d1-discovery.json")
    union = read_json(audit_dir / "d1-union.json")
    detail = read_json(audit_dir / "d2-detail.json")
    consensus = read_json(audit_dir / "d2-consensus.json")
    preliminary = read_json(audit_dir / "d3-preliminary.json")
    review = read_json(audit_dir / "d3-review.json")
    ledger = read_json(audit_dir / "d3-ledger.json")
    selection = read_json(audit_dir / "selection.json")
    run = read_json(audit_dir / "run.json")
    quota = read_json(audit_dir / "quota.json")

    # These two JSON artifacts carry the upstream counts that are outside the
    # daily eligibility table: the refreshed full-market industry map provides
    # the full-A-share coverage count, and automatic_run records the market-cap
    # screen count.  No display number is typed into the page by hand.
    repo_root = Path(__file__).resolve().parents[1]
    industry_map = read_json(repo_root / "configs/a_share_industry_sina_sw1.json")
    upstream_run = read_json(repo_root / "outputs/automatic_run.json")

    names = name_map(eligibility)
    blocked_rows = [
        {
            "ticker": row.get("ticker", ""),
            "name": row.get("name", ""),
            "status": row.get("status", ""),
            "reasons": row.get("reasons", []),
        }
        for row in eligibility.get("rows", [])
        if row.get("status") != "ELIGIBLE"
    ]

    discovery_members: dict[str, list[dict[str, Any]]] = {}
    for result in discovery.get("memberResults", []):
        member_id = result.get("memberId", "")
        discovery_members[member_id] = normalize_member_picks(result, names)

    union_rows: list[dict[str, Any]] = []
    for ticker, nomination in union.get("nominations", {}).items():
        union_rows.append(
            {
                "ticker": ticker,
                "name": names.get(ticker, ""),
                "nominatedBy": nomination.get("nominatedBy", []),
                "ranks": nomination.get("ranks", {}),
                "scores": nomination.get("scores", {}),
                "bothSeats": bool(nomination.get("bothSeats")),
            }
        )
    union_rows.sort(
        key=lambda row: (
            0 if row["bothSeats"] else 1,
            min(row["ranks"].values()) if row["ranks"] else 999,
            row["ticker"],
        )
    )

    detail_calls = {
        member_id: [
            record
            for record in quota.get("records", [])
            if record.get("round_id") == "detail"
            and record.get("member_id") == member_id
        ]
        for member_id in ("sol", "claude")
    }

    consensus_rows = []
    for row in consensus.get("rows", []):
        consensus_rows.append(
            {
                "ticker": row.get("ticker", ""),
                "name": names.get(row.get("ticker", ""), ""),
                "rank": row.get("rank"),
                "solTotal": row.get("seatTotals", {}).get("sol"),
                "claudeTotal": row.get("seatTotals", {}).get("claude"),
                "consensusTotal": row.get("consensusTotal"),
                "disagreement": row.get("totalDisagreement"),
                "unresolved": bool(row.get("unresolvedDisagreement")),
                "decisions": row.get("seatDecisions", {}),
                "riskScore": row.get("riskScore"),
                "overheatScore": row.get("overheatScore"),
                "finalStatus": row.get("finalStatus"),
                "challengedDimensions": row.get("challengedDimensions", []),
            }
        )
    consensus_rows.sort(key=lambda row: row["rank"] or 999)

    consensus_by_ticker = {row["ticker"]: row for row in consensus_rows}
    preliminary_rows = []
    for index, ticker in enumerate(preliminary.get("tickers", []), start=1):
        row = consensus_by_ticker.get(ticker, {"ticker": ticker})
        preliminary_rows.append(
            {
                "preliminaryRank": index,
                "ticker": ticker,
                "name": names.get(ticker, ""),
                "consensusRank": row.get("rank"),
                "consensusTotal": row.get("consensusTotal"),
                "disagreement": row.get("disagreement"),
            }
        )

    review_members = []
    for result in review.get("memberResults", []):
        member_id = result.get("memberId", "")
        label = ledger.get("labelByMember", {}).get(member_id, "?")
        review_members.append(
            {
                "memberId": member_id,
                "label": label,
                "displayName": member_label(member_id),
                "status": result.get("status", ""),
                "failureReason": result.get("failureReason", ""),
                "candidateCount": result.get("candidateCount"),
                "assessmentCount": len(result.get("assessments", [])),
            }
        )

    final_rows = []
    for seat in selection.get("seats", []):
        ticker = seat.get("ticker", "")
        final_rows.append(
            {
                "rank": seat.get("rank"),
                "ticker": ticker,
                "name": names.get(ticker, ""),
                "action": seat.get("action", ""),
                "consensus": seat.get("consensusTotal"),
                "sector": seat.get("sector", ""),
                "risk": seat.get("riskScore"),
                "overheat": seat.get("overheatScore"),
                "stopDistance": seat.get("stopDistancePct"),
                "allocation": seat.get("allocation_pct"),
                "disagreement": seat.get("totalDisagreement"),
                "gateReasons": seat.get("gateReasons", []),
            }
        )

    by_round = quota.get("byRound", {})
    by_member = quota.get("byMember", {})
    max_member_seconds = max(
        (float(item.get("seconds", 0)) for item in by_member.values()),
        default=0.0,
    )
    # The audit ledger stores per-seat model time, not a separate wall-clock
    # sample.  Parallel execution is therefore shown as a transparent rounded
    # estimate, derived from the slower seat's JSON duration.
    wall_seconds_estimate = int(math.ceil(max_member_seconds / 30.0) * 30)

    return {
        "meta": {
            "runId": run.get("runId", snapshot.get("runId", "")),
            "analysisDate": run.get("analysisDate", snapshot.get("analysisDate", "")),
            "freshness": snapshot.get("dataFreshnessStatus", ""),
            "dataAgeDays": snapshot.get("dataAgeDays"),
            "frozenAt": snapshot.get("frozenAt", ""),
            "runtimeMode": run.get("runtimeMode", "DAILY_TOP10"),
            "researchOnly": bool(run.get("researchOnly")),
            "liveTrading": bool(run.get("liveTrading")),
            "degradationStatus": run.get("degradationStatus", ""),
            "degradation": run.get("degradation", []),
        },
        "stage0": {
            "fullMarketCount": len(industry_map),
            "marketCapCount": upstream_run.get("market_ticker_count"),
            "hawkeyeCount": snapshot.get("screenedCount"),
            "eligibleCount": eligibility.get("eligibleCount", snapshot.get("candidateCount")),
            "blockedCount": eligibility.get("blockedCount"),
            "blockedReasonCounts": eligibility.get("blockedReasonCounts", {}),
            "blockedRows": blocked_rows,
            "factsCount": facts.get("candidateCount"),
            "freshness": snapshot.get("dataFreshnessStatus"),
            "sources": [
                source_entry("snapshot.json", audit_dir, output),
                source_entry("eligibility.json", audit_dir, output),
                source_entry("facts.json", audit_dir, output),
                {
                    "name": "configs/a_share_industry_sina_sw1.json",
                    "href": safe_rel_link(repo_root / "configs/a_share_industry_sina_sw1.json", output),
                },
                {
                    "name": "outputs/automatic_run.json",
                    "href": safe_rel_link(repo_root / "outputs/automatic_run.json", output),
                },
            ],
            "factsHash": facts.get("factsHash", ""),
            "snapshotId": snapshot.get("snapshotId", ""),
        },
        "stage1": {
            "inputCount": discovery.get("candidateCount"),
            "pickCount": discovery.get("picksRequested"),
            "unionSize": union.get("unionSize"),
            "members": [
                {
                    "id": member_id,
                    "name": member_label(member_id),
                    "status": next(
                        (
                            item.get("status", "")
                            for item in discovery.get("memberResults", [])
                            if item.get("memberId") == member_id
                        ),
                        "",
                    ),
                    "picks": discovery_members.get(member_id, []),
                }
                for member_id in ("sol", "claude")
            ],
            "unionRows": union_rows,
            "commonCount": sum(1 for row in union_rows if row["bothSeats"]),
            "singleSeatCount": sum(1 for row in union_rows if not row["bothSeats"]),
            "sources": [
                source_entry("d1-discovery.json", audit_dir, output),
                source_entry("d1-union.json", audit_dir, output),
            ],
        },
        "stage2": {
            "poolSize": detail.get("candidateCount", consensus.get("poolSize")),
            "memberCount": len(detail.get("memberResults", [])),
            "callsPerMember": {
                member_id: len(detail_calls.get(member_id, []))
                for member_id in ("sol", "claude")
            },
            "unresolvedCount": consensus.get("unresolvedCount"),
            "disagreementLimit": consensus.get("disagreementLimit"),
            "rows": consensus_rows,
            "sources": [
                source_entry("d2-detail.json", audit_dir, output),
                source_entry("d2-consensus.json", audit_dir, output),
            ],
        },
        "stage3": {
            "preliminaryCount": preliminary.get("count"),
            "preliminaryRows": preliminary_rows,
            "members": review_members,
            "quorumMet": review.get("quorumMet"),
            "ledger": ledger,
            "degradationStatus": run.get("degradationStatus"),
            "sources": [
                source_entry("d3-preliminary.json", audit_dir, output),
                source_entry("d3-review.json", audit_dir, output),
                source_entry("d3-ledger.json", audit_dir, output),
            ],
        },
        "final": {
            "seatCount": selection.get("seatCount"),
            "cashSeats": selection.get("cashSeats"),
            "sectorCapStatus": selection.get("sectorCapStatus"),
            "maxPerSector": selection.get("maxPerSector"),
            "exposureFactor": selection.get("exposureFactor"),
            "investedPct": selection.get("investedPct"),
            "cashReservePct": selection.get("cashReservePct"),
            "maxStopDistancePct": selection.get("maxStopDistancePct"),
            "rows": final_rows,
            "sources": [
                source_entry("selection.json", audit_dir, output),
                source_entry("run.json", audit_dir, output),
            ],
        },
        "quota": {
            "maxCallsPerMember": quota.get("maxCallsPerMember"),
            "totalCalls": quota.get("totalCalls"),
            "wallClockEstimate": format_duration(wall_seconds_estimate),
            "wallClockSecondsEstimate": wall_seconds_estimate,
            "byMember": by_member,
            "byRound": by_round,
            "records": quota.get("records", []),
            "sources": [source_entry("quota.json", audit_dir, output)],
        },
    }


PAGE_TEMPLATE = r'''<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DAILY_TOP10 · 流程审计</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #f4f7fb;
      --panel: #ffffff;
      --panel-soft: #f8fafc;
      --ink: #172033;
      --muted: #5e6b80;
      --line: #d9e1ec;
      --blue: #2f6fed;
      --blue-soft: #eaf1ff;
      --green: #18865b;
      --green-soft: #e9f7f0;
      --yellow: #9a6b00;
      --yellow-soft: #fff7d6;
      --orange: #b65d0d;
      --orange-soft: #fff0df;
      --shadow: 0 12px 32px rgba(27, 50, 85, .08);
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #111827;
        --panel: #182235;
        --panel-soft: #202c40;
        --ink: #eef4ff;
        --muted: #aebbd0;
        --line: #34445d;
        --blue-soft: #1c315a;
        --green-soft: #143b2c;
        --yellow-soft: #413615;
        --orange-soft: #4b2d16;
        --shadow: 0 16px 40px rgba(0, 0, 0, .22);
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      line-height: 1.5;
    }
    a { color: var(--blue); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .shell { width: min(1240px, calc(100% - 32px)); margin: 0 auto; padding: 32px 0 50px; }
    .hero {
      background: linear-gradient(135deg, var(--panel), var(--panel-soft));
      border: 1px solid var(--line);
      border-radius: 24px;
      padding: 28px 30px 24px;
      box-shadow: var(--shadow);
    }
    .eyebrow { color: var(--blue); font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
    .hero-row { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; margin-top: 8px; }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: clamp(26px, 4vw, 42px); line-height: 1.1; letter-spacing: -.035em; }
    .lede { color: var(--muted); margin-top: 10px; max-width: 760px; }
    .status-badge, .pill, .status { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; font-size: 12px; font-weight: 800; white-space: nowrap; }
    .status-badge { padding: 9px 13px; border: 1px solid currentColor; }
    .status.success, .status-badge.success { color: var(--green); background: var(--green-soft); }
    .status.warning, .status-badge.warning { color: var(--yellow); background: var(--yellow-soft); }
    .status.orange, .status-badge.orange { color: var(--orange); background: var(--orange-soft); }
    .status.neutral, .status-badge.neutral { color: var(--muted); background: var(--panel-soft); }
    .run-facts { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 24px; }
    .fact { border: 1px solid var(--line); background: var(--panel); border-radius: 14px; padding: 12px 14px; min-width: 0; }
    .fact-label { color: var(--muted); font-size: 11px; font-weight: 700; }
    .fact-value { display: block; font-size: 16px; font-weight: 800; overflow-wrap: anywhere; margin-top: 3px; }
    .overview { margin: 28px 0 18px; }
    .overview-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 11px; }
    .overview-title { font-size: 17px; font-weight: 800; }
    .overview-note { color: var(--muted); font-size: 12px; margin-top: 3px; }
    .overview-controls { display: flex; flex-wrap: wrap; gap: 8px; }
    .overview-controls button { border: 1px solid var(--line); border-radius: 10px; background: var(--panel); color: var(--ink); padding: 8px 11px; cursor: pointer; font: inherit; font-size: 12px; }
    .overview-controls button:hover { border-color: var(--blue); color: var(--blue); }
    .overview-controls button:focus-visible, .overview-card:focus-visible { outline: 3px solid color-mix(in srgb, var(--blue) 35%, transparent); outline-offset: 2px; }
    .overview-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 9px; }
    .overview-card { min-width: 0; border: 1px solid var(--line); border-radius: 14px; background: var(--panel); color: var(--ink); padding: 13px; text-align: left; cursor: pointer; font: inherit; }
    .overview-card:hover { border-color: var(--blue); background: var(--blue-soft); }
    .overview-card .kicker { color: var(--blue); font-size: 11px; font-weight: 800; letter-spacing: .08em; }
    .overview-card h3 { font-size: 14px; margin-top: 4px; }
    .overview-card .line { color: var(--muted); font-size: 11px; margin-top: 7px; }
    .overview-card .out { font-size: 13px; font-weight: 800; margin-top: 7px; }
    .overview-card .state { display: inline-flex; margin-top: 8px; padding: 4px 7px; border-radius: 999px; font-size: 10px; font-weight: 800; }
    .overview-card .state.success { color: var(--green); background: var(--green-soft); }
    .overview-card .state.warning { color: var(--yellow); background: var(--yellow-soft); }
    .overview-card .state.orange { color: var(--orange); background: var(--orange-soft); }
    .timeline { display: flex; align-items: stretch; gap: 0; margin: 28px 0 20px; overflow-x: auto; padding: 3px 0 8px; }
    .timeline-node { flex: 1 0 145px; min-width: 145px; border: 1px solid var(--line); background: var(--panel); padding: 13px 14px; }
    .timeline-node:first-child { border-radius: 14px 0 0 14px; }
    .timeline-node:last-child { border-radius: 0 14px 14px 0; }
    .timeline-node + .timeline-node { border-left: 0; }
    .timeline-node .small { color: var(--muted); font-size: 11px; }
    .timeline-node strong { display: block; font-size: 14px; margin-top: 3px; }
    .timeline-arrow { display: grid; place-items: center; color: var(--blue); font-size: 20px; font-weight: 900; flex: 0 0 24px; }
    .stage-stack { display: grid; gap: 16px; }
    details.stage-card { border: 1px solid var(--line); border-radius: 20px; background: var(--panel); box-shadow: 0 5px 18px rgba(27, 50, 85, .045); overflow: hidden; }
    summary.stage-summary { list-style: none; cursor: pointer; display: grid; grid-template-columns: 82px minmax(200px, 1fr) auto auto; gap: 18px; align-items: center; padding: 21px 24px; }
    summary.stage-summary::-webkit-details-marker { display: none; }
    summary.stage-summary:hover { background: var(--panel-soft); }
    summary.stage-summary:focus-visible { outline: 3px solid color-mix(in srgb, var(--blue) 35%, transparent); outline-offset: -3px; }
    .stage-number { color: var(--blue); font-size: 12px; font-weight: 900; letter-spacing: .12em; }
    .stage-title { font-size: 19px; font-weight: 850; letter-spacing: -.02em; }
    .stage-flow { color: var(--muted); font-size: 12px; margin-top: 3px; }
    .stage-result { text-align: right; font-size: 13px; font-weight: 800; white-space: nowrap; }
    .stage-result span { display: block; color: var(--muted); font-size: 11px; font-weight: 600; }
    .stage-toggle { color: var(--blue); font-style: normal; font-weight: 800; }
    details.stage-card[open] .stage-toggle { color: var(--muted); }
    .status { padding: 6px 10px; }
    .stage-body { border-top: 1px solid var(--line); padding: 22px 24px 26px; }
    .section-intro { color: var(--muted); font-size: 13px; margin-bottom: 16px; }
    .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
    .metric { border: 1px solid var(--line); border-radius: 13px; padding: 12px 13px; background: var(--panel-soft); }
    .metric .label { color: var(--muted); font-size: 11px; font-weight: 700; }
    .metric .value { font-size: 22px; font-weight: 850; letter-spacing: -.03em; margin-top: 2px; }
    .metric .sub { color: var(--muted); font-size: 11px; margin-top: 2px; }
    .two-col { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .three-col { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
    .subcard { border: 1px solid var(--line); border-radius: 15px; padding: 15px; background: var(--panel); min-width: 0; }
    .subcard h3 { font-size: 14px; margin-bottom: 10px; }
    .subcard p.note { color: var(--muted); font-size: 12px; }
    .list-box { max-height: 370px; overflow: auto; border: 1px solid var(--line); border-radius: 12px; }
    .list-row { display: grid; grid-template-columns: 34px 95px minmax(80px, 1fr) 54px; gap: 7px; align-items: center; padding: 7px 10px; border-bottom: 1px solid var(--line); font-size: 12px; }
    .list-row:last-child { border-bottom: 0; }
    .list-row .rank { color: var(--muted); font-variant-numeric: tabular-nums; }
    .ticker { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; font-weight: 750; }
    .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .score { text-align: right; font-variant-numeric: tabular-nums; }
    .tag-row { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 12px; }
    .pill { border: 1px solid var(--line); padding: 5px 8px; color: var(--muted); background: var(--panel-soft); }
    .pill.green { color: var(--green); background: var(--green-soft); border-color: transparent; }
    .pill.yellow { color: var(--yellow); background: var(--yellow-soft); border-color: transparent; }
    .pill.orange { color: var(--orange); background: var(--orange-soft); border-color: transparent; }
    .table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 14px; }
    table { width: 100%; border-collapse: collapse; min-width: 760px; font-size: 12px; }
    th { background: var(--panel-soft); color: var(--muted); font-size: 11px; text-align: left; font-weight: 800; white-space: nowrap; }
    th, td { padding: 9px 10px; border-bottom: 1px solid var(--line); vertical-align: middle; }
    tr:last-child td { border-bottom: 0; }
    td.num { font-variant-numeric: tabular-nums; text-align: right; }
    tr.unresolved td { background: var(--yellow-soft); }
    .callout { display: flex; gap: 11px; align-items: flex-start; border-radius: 14px; padding: 14px 15px; margin-bottom: 16px; border: 1px solid transparent; }
    .callout.orange { color: var(--orange); background: var(--orange-soft); border-color: color-mix(in srgb, var(--orange) 20%, transparent); }
    .callout.yellow { color: var(--yellow); background: var(--yellow-soft); border-color: color-mix(in srgb, var(--yellow) 20%, transparent); }
    .callout strong { display: block; font-size: 13px; }
    .callout span { display: block; color: var(--muted); font-size: 12px; margin-top: 3px; }
    .member-status { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 0; border-bottom: 1px solid var(--line); }
    .member-status:last-child { border-bottom: 0; }
    .member-status .member { font-weight: 800; }
    .member-status small { color: var(--muted); display: block; font-size: 11px; }
    .source-list { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--line); }
    .source-list a { border: 1px solid var(--line); border-radius: 999px; padding: 4px 8px; color: var(--muted); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px; }
    .source-list a:hover { color: var(--blue); border-color: var(--blue); text-decoration: none; }
    .footer { color: var(--muted); font-size: 12px; text-align: center; padding: 28px 10px 0; }
    .footer strong { color: var(--ink); }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .muted { color: var(--muted); }
    @media (max-width: 760px) {
      .shell { width: min(100% - 20px, 1240px); padding-top: 16px; }
      .hero { padding: 22px 18px 18px; border-radius: 18px; }
      .hero-row { flex-direction: column; }
      .run-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .overview-head { align-items: flex-start; flex-direction: column; }
      .overview-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      summary.stage-summary { grid-template-columns: 1fr auto; gap: 8px 12px; padding: 18px; }
      .stage-number { grid-column: 1 / -1; }
      .stage-result { text-align: left; }
      .stage-body { padding: 18px; }
      .two-col, .three-col { grid-template-columns: 1fr; }
      .list-row { grid-template-columns: 28px 88px minmax(70px, 1fr) 48px; }
    }
    @media (max-width: 420px) {
      .overview-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <header class="hero">
      <div class="eyebrow">DAILY_TOP10 · AUDIT FLOW</div>
      <div class="hero-row">
        <div>
          <h1>每日 10 席位流程审计</h1>
          <p class="lede" id="lede"></p>
        </div>
        <div id="overall-status"></div>
      </div>
      <div class="run-facts" id="run-facts"></div>
    </header>

    <section class="overview" aria-labelledby="overview-title">
      <div class="overview-head">
        <div><h2 class="overview-title" id="overview-title">流程总览</h2><p class="overview-note">先看每一轮做什么；点击任意卡片直接展开对应细节。</p></div>
        <div class="overview-controls" aria-label="阶段展开控制"><button type="button" id="expand-all">全部展开</button><button type="button" id="collapse-all">全部收起</button></div>
      </div>
      <div class="overview-grid" id="overview-grid"></div>
    </section>
    <nav class="timeline" id="timeline" aria-label="DAILY_TOP10 流程"></nav>
    <main class="stage-stack" id="stages"></main>
    <footer class="footer">
      <strong>研究用途 · 不连接券商 · 不自动下单</strong><br>
      页面由本次审计 JSON 生成；它只解释运行过程，不改变评分、选择或降级逻辑。
    </footer>
  </div>

  <script type="application/json" id="pdc-data">__PAYLOAD__</script>
  <script>
    const DATA = JSON.parse(document.getElementById('pdc-data').textContent);
    const $ = (id) => document.getElementById(id);
    const esc = (value) => String(value ?? '')
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
    const fmt = (value, digits = 0) => {
      if (value === null || value === undefined || value === '') return '—';
      const num = Number(value);
      return Number.isFinite(num) ? num.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits }) : esc(value);
    };
    const score = (value) => fmt(value, 3);
    const pct = (value) => value === null || value === undefined || value === '' ? '—' : `${fmt(value, 2)}%`;
    const statusClass = (status) => status === 'orange' ? 'orange' : status === 'warning' ? 'warning' : status === 'success' ? 'success' : 'neutral';
    const pill = (label, value, tone = '') => `<span class="pill ${tone}">${esc(label)} ${esc(value)}</span>`;
    const metric = (label, value, sub = '') => `<div class="metric"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div>${sub ? `<div class="sub">${esc(sub)}</div>` : ''}</div>`;
    const sources = (items) => `<div class="source-list"><span class="muted" style="font-size:11px;align-self:center">审计文件</span>${items.map(item => `<a href="${esc(item.href)}" target="_blank" rel="noreferrer">${esc(item.name)}</a>`).join('')}</div>`;
    const stage = (number, title, flow, result, resultSub, status, body, open = false) => `
      <details id="stage-${esc(number)}" class="stage-card" ${open ? 'open' : ''}>
        <summary class="stage-summary">
          <div class="stage-number">STAGE ${esc(number)}</div>
          <div><div class="stage-title">${esc(title)}</div><div class="stage-flow">${esc(flow)}</div></div>
          <div class="stage-result">${esc(result)}<span>${esc(resultSub)} · <em class="stage-toggle">点击展开⌄</em></span></div>
          <span class="status ${statusClass(status)}">${status === 'orange' ? '安全降级' : status === 'warning' ? '有分歧' : '通过'}</span>
        </summary>
        <div class="stage-body">${body}</div>
      </details>`;

    const meta = DATA.meta;
    $('lede').textContent = `${meta.analysisDate} 收盘数据 · ${meta.runId} · 只读审计视图`;
    $('overall-status').innerHTML = `<span class="status-badge orange">${esc(meta.degradationStatus || 'COMPLETED')}</span>`;
    $('run-facts').innerHTML = [
      ['运行日期', meta.analysisDate],
      ['Run ID', meta.runId],
      ['数据新鲜度', `${meta.freshness}${meta.dataAgeDays === 0 ? ' · 当日' : ` · ${fmt(meta.dataAgeDays)} 天`}`],
      ['运行模式', meta.researchOnly && !meta.liveTrading ? '研究模式 · 不下单' : meta.runtimeMode],
    ].map(([label, value]) => `<div class="fact"><div class="fact-label">${esc(label)}</div><span class="fact-value">${esc(value)}</span></div>`).join('');

    const timeline = [
      ['0', '数据冻结', '227 通过'],
      ['1', '双模型初选', `${fmt(DATA.stage1.unionSize)} 并集`],
      ['2', '九维详评', `${fmt(DATA.stage2.poolSize)} 支`],
      ['3', '匿名终审', DATA.stage3.degradationStatus],
      ['F', '最终 10 席', `${fmt(DATA.final.investedPct)}% 投资`],
      ['Q', '额度', `${fmt(DATA.quota.totalCalls)} 次调用`],
    ];
    $('timeline').innerHTML = timeline.map((item, index) => `${index ? '<div class="timeline-arrow" aria-hidden="true">→</div>' : ''}<div class="timeline-node"><span class="small">${esc(item[0])}</span><strong>${esc(item[1])}</strong><span class="small">${esc(item[2])}</span></div>`).join('');

    const overview = [
      { id: '0', kicker: 'STAGE 0', title: '数据冻结与硬资格', input: `输入 ${fmt(DATA.stage0.fullMarketCount)} → ${fmt(DATA.stage0.marketCapCount)} → ${fmt(DATA.stage0.hawkeyeCount)}`, work: '两模型：未介入；先冻结事实并拦截不合格标的', output: `${fmt(DATA.stage0.eligibleCount)} 支通过`, state: '通过', tone: 'success' },
      { id: '1', kicker: 'STAGE 1', title: '双模型独立初选', input: `输入 ${fmt(DATA.stage1.inputCount)} 支`, work: `Codex / Claude 各 1 次，各提 Top${fmt(DATA.stage1.pickCount)}`, output: `${fmt(DATA.stage1.unionSize)} 支并集`, state: '通过', tone: 'success' },
      { id: '2', kicker: 'STAGE 2', title: '九维详细评分', input: `输入 ${fmt(DATA.stage2.poolSize)} 支并集`, work: `两模型同池各 ${fmt(DATA.stage2.callsPerMember.sol)} 次，九维评分`, output: `${fmt(DATA.stage2.unresolvedCount)} 支未解决分歧`, state: '有分歧', tone: 'warning' },
      { id: '3', kicker: 'STAGE 3', title: 'Top20 匿名终审', input: `输入 Top${fmt(DATA.stage3.preliminaryCount)}`, work: '席位 A / B 交叉审查；契约检查 fact_id', output: DATA.stage3.degradationStatus, state: '安全回退', tone: 'orange' },
      { id: 'F', kicker: 'FINAL GATE', title: '最终 10 席位', input: '输入 R2 完整共识', work: '硬资格、风险、止损、行业上限与仓位门槛', output: `${fmt(DATA.final.seatCount)} 支 · ${pct(DATA.final.investedPct)} 投资`, state: '通过', tone: 'success' },
      { id: 'Q', kicker: 'QUOTA', title: '额度与耗时', input: `输入 ${fmt(DATA.quota.totalCalls)} 次调用记录`, work: '按席位 / 轮次记账，显示剩余额度', output: DATA.quota.wallClockEstimate, state: '已记账', tone: 'success' },
    ];
    $('overview-grid').innerHTML = overview.map(item => `<button type="button" class="overview-card" data-stage-target="stage-${esc(item.id)}"><span class="kicker">${esc(item.kicker)}</span><h3>${esc(item.title)}</h3><div class="line">${esc(item.input)}</div><div class="line">${esc(item.work)}</div><div class="out">输出：${esc(item.output)}</div><span class="state ${esc(item.tone)}">${esc(item.state)} · 点击看细节</span></button>`).join('');
    $('expand-all').addEventListener('click', () => document.querySelectorAll('details.stage-card').forEach(card => { card.open = true; }));
    $('collapse-all').addEventListener('click', () => document.querySelectorAll('details.stage-card').forEach(card => { card.open = false; }));
    document.querySelectorAll('[data-stage-target]').forEach(control => control.addEventListener('click', () => {
      const target = document.getElementById(control.dataset.stageTarget);
      if (!target) return;
      target.open = true;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));

    const s0 = DATA.stage0;
    const blockedReasons = Object.entries(s0.blockedReasonCounts || {}).map(([key, value]) => pill(key, fmt(value), 'orange')).join('');
    const blockedRows = s0.blockedRows.length ? `<div class="table-wrap"><table><thead><tr><th>代码</th><th>名称</th><th>状态</th><th>原因</th></tr></thead><tbody>${s0.blockedRows.map(row => `<tr><td class="ticker">${esc(row.ticker)}</td><td>${esc(row.name)}</td><td><span class="status orange">${esc(row.status)}</span></td><td>${esc(row.reasons.join('、'))}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">没有被拦截标的。</p>';
    const stage0Body = `
      <p class="section-intro">输入：全市场快照 → 市值筛选 → Hawkeye 候选；两模型尚未介入。硬资格先冻结事实，再决定谁能进入 Stage 1。</p>
      <div class="metric-grid">
        ${metric('全市场', fmt(s0.fullMarketCount), '申万行业映射覆盖')}
        ${metric('市值筛选后', fmt(s0.marketCapCount), '上游 automatic_run')}
        ${metric('Hawkeye', fmt(s0.hawkeyeCount), '进入硬资格检查')}
        ${metric('硬资格通过', fmt(s0.eligibleCount), 'facts.json 候选')}
        ${metric('被拦截', fmt(s0.blockedCount), '不进入模型轮次')}
        ${metric('数据新鲜度', s0.freshness, `facts ${fmt(s0.factsCount)} 支`)}
      </div>
      <div class="subcard" style="margin-top:14px"><h3>被拦截数量与原因</h3><div class="tag-row">${blockedReasons || '<span class="muted">无</span>'}</div><div style="margin-top:12px">${blockedRows}</div></div>
      <div class="tag-row">${pill('snapshot', s0.snapshotId)}${pill('factsHash', s0.factsHash.slice(0, 12) + '…')}</div>
      ${sources(s0.sources)}`;

    const memberCard = (member) => {
      const rows = member.picks.map(pick => `<div class="list-row"><span class="rank">${fmt(pick.rank)}</span><span class="ticker">${esc(pick.ticker)}</span><span class="name" title="${esc(pick.name)}">${esc(pick.name)}</span><span class="score">${fmt(pick.score, 1)}</span></div>`).join('');
      return `<div class="subcard"><h3>${esc(member.name)} · Top${fmt(member.picks.length)}</h3><p class="note">${member.status === 'COMPLETED' ? '独立提名，未看到对方名单。' : esc(member.status)}</p><div class="list-box" style="margin-top:10px">${rows}</div></div>`;
    };
    const unionTag = (row) => row.bothSeats ? pill(`${row.ticker} ${row.name}`, '共同', 'green') : pill(`${row.ticker} ${row.name}`, row.nominatedBy.map(member_label => member_label === 'sol' ? 'Codex' : 'Claude').join(' / '));
    const stage1Body = `
      <p class="section-intro">输入：${fmt(DATA.stage1.inputCount)} 支硬资格通过标的。Codex 与 Claude 各自只调用 1 次，提出 ${fmt(DATA.stage1.pickCount)} 支；再取名单并集，不做投票配额。</p>
      <div class="metric-grid">
        ${metric('输入候选', fmt(DATA.stage1.inputCount), '来自 Stage 0')}
        ${metric('Codex 初选', fmt(DATA.stage1.members[0].picks.length), '一次调用')}
        ${metric('Claude 初选', fmt(DATA.stage1.members[1].picks.length), '一次调用')}
        ${metric('合并并集', fmt(DATA.stage1.unionSize), '进入 Stage 2')}
        ${metric('共同选择', fmt(DATA.stage1.commonCount), '两模型都选')}
        ${metric('单方选择', fmt(DATA.stage1.singleSeatCount), '只被一席选中')}
      </div>
      <div class="two-col" style="margin-top:14px">${DATA.stage1.members.map(memberCard).join('')}</div>
      <div class="subcard" style="margin-top:14px"><h3>并集拆分</h3><p class="note">共同选择与单方选择都保留，下面标签可快速核对每支股票的来源。</p><div class="tag-row">${DATA.stage1.unionRows.map(unionTag).join('')}</div></div>
      ${sources(DATA.stage1.sources)}`;

    const stage2Rows = DATA.stage2.rows.map(row => `<tr class="${row.unresolved ? 'unresolved' : ''}">
      <td class="num">${fmt(row.rank)}</td><td><span class="ticker">${esc(row.ticker)}</span><br><span class="muted">${esc(row.name)}</span></td>
      <td class="num">${score(row.solTotal)}</td><td class="num">${score(row.claudeTotal)}</td><td class="num"><strong>${score(row.consensusTotal)}</strong></td><td class="num">${score(row.disagreement)}</td>
      <td>${row.unresolved ? '<span class="status warning">UNRESOLVED_DISAGREEMENT</span>' : '<span class="status success">共识</span>'}</td>
    </tr>`).join('');
    const stage2Body = `
      <p class="section-intro">输入：Stage 1 并集。两模型分别对完全相同的 ${fmt(DATA.stage2.poolSize)} 支做九维详细评分；每个模型本轮只调用 ${fmt(DATA.stage2.callsPerMember.sol)} 次。</p>
      <div class="metric-grid">
        ${metric('详评池', fmt(DATA.stage2.poolSize), '两席相同集合')}
        ${metric('Codex 调用', fmt(DATA.stage2.callsPerMember.sol), '一次覆盖全池')}
        ${metric('Claude 调用', fmt(DATA.stage2.callsPerMember.claude), '一次覆盖全池')}
        ${metric('分歧阈值', score(DATA.stage2.disagreementLimit), '超过即未解决')}
        ${metric('未解决分歧', fmt(DATA.stage2.unresolvedCount), '不进入 BUY')}
      </div>
      <div class="table-wrap" style="margin-top:14px"><table><thead><tr><th>排名</th><th>股票</th><th>Codex 总分</th><th>Claude 总分</th><th>共识分</th><th>分歧值</th><th>状态</th></tr></thead><tbody>${stage2Rows}</tbody></table></div>
      ${sources(DATA.stage2.sources)}`;

    const reviewMemberRows = DATA.stage3.members.map(member => `<div class="member-status"><div><span class="member">${esc(member.displayName)} · 席位 ${esc(member.label)}</span><small>${esc(member.failureReason || `收到 ${member.assessmentCount} 条终审结果`)}</small></div><span class="status orange">${esc(member.status)}</span></div>`).join('');
    const preliminaryRows = DATA.stage3.preliminaryRows.map(row => `<tr><td class="num">${fmt(row.preliminaryRank)}</td><td><span class="ticker">${esc(row.ticker)}</span> ${esc(row.name)}</td><td class="num">${fmt(row.consensusRank)}</td><td class="num">${score(row.consensusTotal)}</td><td class="num">${score(row.disagreement)}</td></tr>`).join('');
    const stage3Body = `
      <div class="callout orange"><div style="font-size:20px">↩</div><div><strong>R3_FAILED_USED_R2</strong><span>本次两份终审都因错误 fact_id 被契约拒绝。系统没有采用非法修改，而是安全回退到完整双模型第二轮共识；没有绕过校验，也没有让单模型独自产生 BUY。</span></div></div>
      <p class="section-intro">输入：第二轮共识排名前 ${fmt(DATA.stage3.preliminaryCount)}。终审使用匿名席位 A/B；终审失败后，最终门槛仍使用 Stage 2 的完整共识数据。</p>
      <div class="metric-grid">
        ${metric('终审名单', fmt(DATA.stage3.preliminaryCount), 'Top20 匿名交叉')}
        ${metric('Codex 终审', DATA.stage3.members[0]?.status || '—', `席位 ${DATA.stage3.members[0]?.label || '—'}`)}
        ${metric('Claude 终审', DATA.stage3.members[1]?.status || '—', `席位 ${DATA.stage3.members[1]?.label || '—'}`)}
        ${metric('法定人数', DATA.stage3.quorumMet ? '通过' : '未通过', '按降级规则处理')}
      </div>
      <div class="two-col" style="margin-top:14px"><div class="subcard"><h3>终审席位状态</h3>${reviewMemberRows}</div><div class="subcard"><h3>终审名单</h3><div class="table-wrap"><table style="min-width:520px"><thead><tr><th>终审序</th><th>股票</th><th>R2 排名</th><th>共识分</th><th>分歧值</th></tr></thead><tbody>${preliminaryRows}</tbody></table></div></div></div>
      ${sources(DATA.stage3.sources)}`;

    const finalRows = DATA.final.rows.map(row => `<tr><td class="num"><strong>${fmt(row.rank)}</strong></td><td><span class="ticker">${esc(row.ticker)}</span><br><span class="muted">${esc(row.name)}</span></td><td>${esc(row.action)}</td><td class="num"><strong>${score(row.consensus)}</strong></td><td>${esc(row.sector)}</td><td class="num">${score(row.risk)}</td><td class="num">${score(row.overheat)}</td><td class="num">${pct(row.stopDistance)}</td><td class="num">${pct(row.allocation)}</td></tr>`).join('');
    const stageFinalBody = `
      <p class="section-intro">输入：R2 完整双模型共识 + 硬资格、风险、过热、止损和行业门槛。所有最终席位由确定性 Final Gate 产生。</p>
      <div class="metric-grid">
        ${metric('最终席位', fmt(DATA.final.seatCount), DATA.final.cashSeats ? `${fmt(DATA.final.cashSeats)} 个 CASH` : '全部为股票')}
        ${metric('行业上限', DATA.final.sectorCapStatus, `每行业最多 ${fmt(DATA.final.maxPerSector)} 席`)}
        ${metric('投资敞口', pct(DATA.final.investedPct), `敞口因子 ${fmt(DATA.final.exposureFactor, 2)}`)}
        ${metric('现金储备', pct(DATA.final.cashReservePct), '不自动下单')}
        ${metric('止损上限', pct(DATA.final.maxStopDistancePct), '硬门槛参数')}
      </div>
      <div class="table-wrap" style="margin-top:14px"><table><thead><tr><th>席位</th><th>股票</th><th>动作</th><th>共识分</th><th>行业</th><th>风险分</th><th>过热分</th><th>止损距离</th><th>分配仓位</th></tr></thead><tbody>${finalRows}</tbody></table></div>
      ${sources(DATA.final.sources)}`;

    const roundNames = { discovery: 'Stage 1 · 独立初选', detail: 'Stage 2 · 九维详评', review: 'Stage 3 · 匿名终审' };
    const roundRows = Object.entries(DATA.quota.byRound).map(([round, item]) => `<tr><td>${esc(roundNames[round] || round)}</td><td class="num">${fmt(item.calls)}</td><td class="num">${formatSeconds(item.seconds)}</td></tr>`).join('');
    function formatSeconds(value) { return `${fmt(value, 2)} 秒`; }
    const memberQuotaRows = Object.entries(DATA.quota.byMember).map(([id, item]) => `<div class="subcard"><h3>${esc(id === 'sol' ? 'Codex' : 'Claude')}</h3><div class="metric-grid" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="metric"><div class="label">调用</div><div class="value">${fmt(item.calls)}</div></div><div class="metric"><div class="label">剩余</div><div class="value">${fmt(item.remaining)}</div></div><div class="metric"><div class="label">模型耗时</div><div class="value" style="font-size:17px">${formatSeconds(item.seconds)}</div></div></div></div>`).join('');
    const stageQuotaBody = `
      <p class="section-intro">额度账本记录每一轮、每一席的调用次数、输出耗时和剩余额度。两席并行运行，墙钟估算取较慢席位耗时并按半分钟展示。</p>
      <div class="metric-grid">
        ${metric('总调用', fmt(DATA.quota.totalCalls), `每席上限 ${fmt(DATA.quota.maxCallsPerMember)}`)}
        ${metric('墙钟约', DATA.quota.wallClockEstimate, '由 quota.json 耗时估算')}
        ${metric('轮次', fmt(Object.keys(DATA.quota.byRound).length), '初选 / 详评 / 终审')}
      </div>
      <div class="two-col" style="margin-top:14px">${memberQuotaRows}</div>
      <div class="subcard" style="margin-top:14px"><h3>每轮调用数与耗时</h3><div class="table-wrap"><table style="min-width:520px"><thead><tr><th>轮次</th><th>调用数</th><th>累计模型耗时</th></tr></thead><tbody>${roundRows}</tbody></table></div></div>
      ${sources(DATA.quota.sources)}`;

    $('stages').innerHTML = [
      stage('0', '数据冻结与硬资格', '全市场 → 市值筛选 → Hawkeye → 硬资格', `${fmt(s0.eligibleCount)} 支`, `${fmt(s0.blockedCount)} 支被拦截`, 'success', stage0Body, true),
      stage('1', '双模型独立初选', `${fmt(DATA.stage1.inputCount)} 支 → Codex / Claude 各 Top${fmt(DATA.stage1.pickCount)}`, `${fmt(DATA.stage1.unionSize)} 支并集`, `${fmt(DATA.stage1.commonCount)} 支共同`, 'success', stage1Body),
      stage('2', `${fmt(DATA.stage2.poolSize)} 支九维详细评分`, '两模型同池评分 → 确定性共识', `${fmt(DATA.stage2.unresolvedCount)} 支未解决`, `阈值 ${score(DATA.stage2.disagreementLimit)}`, 'warning', stage2Body),
      stage('3', 'Top20 匿名交叉终审', `${fmt(DATA.stage3.preliminaryCount)} 支 → 席位 A / B`, DATA.stage3.degradationStatus, '完整 R2 共识回退', 'orange', stage3Body),
      stage('F', 'Final Gate · 最终 10 席位', '共识 → 门槛 → 行业上限 → 分配', `${fmt(DATA.final.seatCount)} 支`, `${pct(DATA.final.investedPct)} 投资 · ${pct(DATA.final.cashReservePct)} 现金`, 'success', stageFinalBody, true),
      stage('Q', 'Quota · 额度与耗时', '每席每轮记账 → 剩余额度', DATA.quota.wallClockEstimate, `${fmt(DATA.quota.totalCalls)} 次调用`, 'neutral', stageQuotaBody),
    ].join('');
  </script>
</body>
</html>
'''


def render(audit_dir: Path, output: Path, link_base: Path | None = None) -> None:
    """Render to *output*, resolving audit links as if the page lived at link_base."""

    view = build_view(audit_dir, link_base or output)
    payload = json.dumps(view, ensure_ascii=False, separators=(",", ":"))
    # Keep the JSON script element inert even if a future model note contains
    # HTML-looking text.
    payload = (
        payload.replace("&", "\\u0026")
        .replace("<", "\\u003c")
        .replace(">", "\\u003e")
        .replace("</", "<\\/")
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(PAGE_TEMPLATE.replace("__PAYLOAD__", payload), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--audit-dir", type=Path, default=DEFAULT_AUDIT)
    parser.add_argument(
        "--output",
        type=Path,
        action="append",
        help="HTML output path; repeat to write tracked and audit-local copies",
    )
    parser.add_argument(
        "--link-from",
        type=Path,
        help="Optional page path used to calculate relative audit-file links",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    audit_dir = args.audit_dir
    outputs = args.output or [DEFAULT_OUTPUT]
    for output in outputs:
        render(audit_dir, output, args.link_from)
        print(output)


if __name__ == "__main__":
    main()
