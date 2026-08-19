#!/usr/bin/env python3
"""Export one DAILY_TOP10 audit result for the Turnpo stock timeline.

The exporter is presentation-only.  It reads the frozen audit artifacts and
normalizes the final seats into the same day/row shape used by Turnpo's
historical rank flow.  It does not run a model or change selection logic.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


ENGINE_ROOT = Path(__file__).resolve().parents[1]
TURNPO_ROOT = ENGINE_ROOT.parent
DEFAULT_AUDIT = ENGINE_ROOT / "outputs/sustainable/daily/daily-20260819-real-01"
DEFAULT_OUTPUT = TURNPO_ROOT / "stock-pdc/daily-top10.json"


def read_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def export(audit_dir: Path, output: Path) -> None:
    selection = read_json(audit_dir / "selection.json")
    run = read_json(audit_dir / "run.json")
    snapshot = read_json(audit_dir / "snapshot.json")
    eligibility = read_json(audit_dir / "eligibility.json")

    names = {
        row.get("ticker"): row.get("name", "")
        for row in eligibility.get("rows", [])
        if row.get("ticker")
    }
    seats = sorted(selection.get("seats", []), key=lambda seat: seat.get("rank", 999))
    rows = []
    for seat in seats:
        ticker = seat.get("ticker", "")
        rows.append(
            {
                "ticker": ticker,
                "name": names.get(ticker, ticker),
                "rank": seat.get("rank"),
                "previousRank": None,
                "rankDelta": None,
                "changeType": "NEW",
                "movement": "DAILY_TOP10",
                "score": seat.get("consensusTotal"),
                "status": seat.get("action", ""),
                "frontDeskInstruction": seat.get("action", ""),
                "signalDayChangePct": None,
                "dayChangePct": None,
                "consensusTotal": seat.get("consensusTotal"),
                "seatTotals": seat.get("seatTotals", {}),
                "totalDisagreement": seat.get("totalDisagreement"),
                "sector": seat.get("sector", ""),
                "riskScore": seat.get("riskScore"),
                "overheatScore": seat.get("overheatScore"),
                "stopDistancePct": seat.get("stopDistancePct"),
                "allocation_pct": seat.get("allocation_pct"),
                "gateReasons": seat.get("gateReasons", []),
                "dailyTop10": True,
            }
        )

    analysis_date = run.get("analysisDate", snapshot.get("analysisDate", ""))
    invested_pct = selection.get("investedPct")
    cash_pct = selection.get("cashReservePct")
    average_score = (
        round(sum(row["consensusTotal"] for row in rows) / len(rows), 4)
        if rows
        else None
    )
    audit_rel = audit_dir.relative_to(TURNPO_ROOT).as_posix()
    output_payload = {
        "schemaVersion": "turnpo-stock-pdc-daily-top10-v1",
        "generatedAt": run.get("snapshot", {}).get("frozenAt", ""),
        "source": {
            "kind": "DAILY_TOP10_AUDIT",
            "runId": run.get("runId", ""),
            "auditDirectory": audit_rel,
            "selectionFile": f"{audit_rel}/selection.json",
            "auditPage": "../stock-pdc-engine/visualizations/daily_top10_flow.html",
        },
        "verification": {
            "status": "DAILY_TOP10_RESEARCH",
            "runId": run.get("runId", ""),
            "analysisDate": analysis_date,
            "researchOnly": bool(run.get("researchOnly", True)),
            "liveTrading": bool(run.get("liveTrading", False)),
            "dataFreshnessStatus": snapshot.get("dataFreshnessStatus", ""),
            "dataAgeDays": snapshot.get("dataAgeDays"),
        },
        "days": [
            {
                "date": analysis_date,
                "kind": "DAILY_TOP10",
                "sourceFile": f"{audit_rel}/selection.json",
                "summary": {
                    "total": len(rows),
                    "targetHoldings": len(rows),
                    "inTop20": len(rows),
                    "new": len(rows),
                    "up": 0,
                    "down": 0,
                    "unchanged": 0,
                    "retained": 0,
                    "dropped": 0,
                    "avgScore": average_score,
                    "decisionRule": "DAILY_TOP10 双模型共识研究清单；不连接券商、不自动下单。",
                    "investedPct": invested_pct,
                    "cashReservePct": cash_pct,
                    "cashSeats": selection.get("cashSeats"),
                    "exposureFactor": selection.get("exposureFactor"),
                    "sectorCapStatus": selection.get("sectorCapStatus", ""),
                    "maxPerSector": selection.get("maxPerSector"),
                    "degradationStatus": run.get("degradationStatus", ""),
                },
                "rows": rows,
                "dropped": [],
            }
        ],
        "dates": [analysis_date],
        "latestDate": analysis_date,
    }

    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8") as handle:
        json.dump(output_payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--audit-dir", type=Path, default=DEFAULT_AUDIT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    export(args.audit_dir, args.output)


if __name__ == "__main__":
    main()
