from __future__ import annotations

import csv
import hashlib
import json
import os
import shutil
from pathlib import Path
from typing import Any

from .committee_audit import write_market_data_package


REQUIRED_ARTIFACTS = (
    "candidate_universe.csv",
    "hawkeye_radar_audit.csv",
    "full_pdc_scores.csv",
)


def _read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _csv_rows(path: Path) -> int:
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        return sum(1 for _ in csv.DictReader(file))


def _csv_tickers(path: Path) -> set[str]:
    rows = _read_csv_rows(path)
    tickers = [str(row.get("ticker") or "").strip().upper() for row in rows]
    if not all(tickers):
        raise ValueError(f"Every row in {path.name} must include a ticker")
    if len(set(tickers)) != len(tickers):
        raise ValueError(f"Duplicate tickers found in {path.name}")
    return set(tickers)


def _number_or_none(value: object) -> float | None:
    try:
        return float(str(value))
    except (TypeError, ValueError):
        return None


def _write_display_snapshot(
    path: Path,
    run_id: str,
    manifest: dict[str, Any],
    candidate_path: Path,
    score_path: Path,
    market_count: int,
    candidate_count: int,
) -> None:
    """Create the small, immutable public payload used by the Top 20 page."""
    names = {row["ticker"].strip().upper(): row.get("name", "").strip() for row in _read_csv_rows(candidate_path)}
    rows = sorted(_read_csv_rows(score_path), key=lambda row: int(row.get("rank") or 999999))[:20]
    display_rows = [
        {
            "ticker": row["ticker"].strip().upper(),
            "name": names.get(row["ticker"].strip().upper(), row["ticker"].strip().upper()),
            "rank": int(row.get("rank") or 0),
            "status": row.get("final_status", ""),
            "finalScore": _number_or_none(row.get("final_score")),
            "frontDeskInstruction": row.get("suggested_action_status", ""),
            "mainReason": row.get("main_reason", ""),
            "mainRisk": row.get("main_risk", ""),
        }
        for row in rows
    ]
    payload = {
        "schemaVersion": "stock-pdc-display-v1",
        "runId": run_id,
        "verification": {
            "status": "VERIFIED",
            "runId": run_id,
            "marketCount": market_count,
            "candidateCount": candidate_count,
            "pdcCount": candidate_count,
            "rulesVersion": "hawkeye-fixed-v1",
        },
        "days": [{"date": str(manifest.get("analysis_date") or ""), "rows": display_rows}],
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def stage_verified_run(outputs_dir: Path, run_id: str, manifest: dict[str, Any]) -> Path:
    """Copy a completed local run into an immutable, verified artifact directory."""
    if not run_id or any(char not in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_" for char in run_id):
        raise ValueError("run_id must contain only letters, digits, hyphens, and underscores")

    source_paths = {name: outputs_dir / name for name in REQUIRED_ARTIFACTS}
    missing = [name for name, path in source_paths.items() if not path.exists()]
    if missing:
        raise ValueError(f"Cannot stage run without required artifacts: {', '.join(missing)}")

    candidate_count = _csv_rows(source_paths["candidate_universe.csv"])
    audit_count = _csv_rows(source_paths["hawkeye_radar_audit.csv"])
    pdc_count = _csv_rows(source_paths["full_pdc_scores.csv"])
    if audit_count < candidate_count:
        raise ValueError("Hawkeye audit cannot contain fewer rows than the candidate universe")
    if pdc_count != candidate_count:
        raise ValueError("Every Hawkeye candidate must receive exactly one PDC score")
    candidate_tickers = _csv_tickers(source_paths["candidate_universe.csv"])
    audit_tickers = _csv_tickers(source_paths["hawkeye_radar_audit.csv"])
    pdc_tickers = _csv_tickers(source_paths["full_pdc_scores.csv"])
    if not candidate_tickers.issubset(audit_tickers):
        raise ValueError("Every Hawkeye candidate must be present in the Hawkeye audit")
    if pdc_tickers != candidate_tickers:
        raise ValueError("PDC scores must match the Hawkeye candidate tickers exactly")

    runs_dir = outputs_dir / "runs"
    target_dir = runs_dir / run_id
    staging_dir = runs_dir / f".staging-{run_id}"
    if target_dir.exists() or staging_dir.exists():
        raise FileExistsError(f"Run artifact directory already exists for {run_id}")
    staging_dir.mkdir(parents=True)

    try:
        artifacts: dict[str, dict[str, object]] = {}
        for name, source_path in source_paths.items():
            target_path = staging_dir / name
            shutil.copy2(source_path, target_path)
            artifacts[name] = {"sha256": _sha256(target_path), "rows": _csv_rows(target_path)}

        display_path = staging_dir / "display.json"
        _write_display_snapshot(
            display_path,
            run_id,
            manifest,
            source_paths["candidate_universe.csv"],
            source_paths["full_pdc_scores.csv"],
            audit_count,
            candidate_count,
        )
        artifacts["display.json"] = {"sha256": _sha256(display_path), "rows": min(pdc_count, 20)}

        verified_manifest = {
            **manifest,
            "schema_version": "stock-pdc-run-v1",
            "run_id": run_id,
            "status": "READY",
            "source_scope": "full_a_share_market",
            "rules_version": "hawkeye-fixed-v1",
            "market_count": audit_count,
            "candidate_count": candidate_count,
            "pdc_count": pdc_count,
            "artifacts": artifacts,
        }
        manifest_path = staging_dir / "manifest.json"
        manifest_path.write_text(json.dumps(verified_manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        # A manifest cannot contain a hash of its own final bytes. This digest
        # is deliberately over the canonical payload before this field is
        # attached, and the name makes that boundary explicit to consumers.
        manifest_hash = _sha256(manifest_path)
        verified_manifest["manifest_payload_sha256"] = manifest_hash
        manifest_path.write_text(json.dumps(verified_manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        staging_dir.rename(target_dir)
    except Exception:
        # Leave the staging folder for an explicit operator inspection rather
        # than deleting evidence from a failed financial-data run.
        raise

    pointer = {
        "schema_version": "stock-pdc-ready-run-pointer-v1",
        "run_id": run_id,
        "status": "READY",
        "manifest": str((target_dir / "manifest.json").relative_to(outputs_dir)),
    }
    pointer_tmp = outputs_dir / f".latest_ready_run-{run_id}.json"
    pointer_path = outputs_dir / "latest_ready_run.json"
    pointer_tmp.write_text(json.dumps(pointer, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(pointer_tmp, pointer_path)
    # This is an additive, immutable Stage 02 artifact. It does not alter the
    # existing PDC outputs or any Top 20 decision; it freezes their factual
    # inputs for the existing multi-model committee.
    write_market_data_package(target_dir)
    return target_dir
