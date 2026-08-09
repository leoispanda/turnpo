"""Append-only audit contracts for the existing five-model PDC committee.

This module deliberately does not call any model and does not decide stocks.
It freezes facts and records only real stage callbacks supplied by the protected
compute service.  Existing Top 30/20/10 and Round 2 logic remains untouched.
"""

from __future__ import annotations

import csv
import hashlib
import json
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


MODEL_IDS = ("gpt", "claude", "gemini", "deepseek", "kimi")
STAGES = {
    "01": "model_validation",
    "02": "market_data_package",
    "03": "round_1_top_30",
    "04": "shared_review_pool_top_20",
    "05": "round_2_top_20",
    "06": "secretary_summary",
    "07": "final_consensus_risk_gate_top_10",
}
DECISIONS = {"BUY", "WATCH", "HOLD", "SELL"}
STATUSES = {"COMPLETED", "FAILED"}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _json_hash(value: object) -> str:
    encoded = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _file_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


def build_market_data_package(run_dir: Path) -> dict[str, object]:
    """Create the frozen factual package consumed by every committee model."""
    manifest_path = run_dir / "manifest.json"
    score_path = run_dir / "full_pdc_scores.csv"
    audit_path = run_dir / "hawkeye_radar_audit.csv"
    candidate_path = run_dir / "candidate_universe.csv"
    required = (manifest_path, score_path, audit_path, candidate_path)
    missing = [path.name for path in required if not path.exists()]
    if missing:
        raise ValueError(f"Cannot build a Market Data Package without: {', '.join(missing)}")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    scores = _read_csv(score_path)
    audit = _read_csv(audit_path)
    candidates = _read_csv(candidate_path)
    facts = {
        "schemaVersion": "stock-pdc-market-data-package-v1",
        "runId": manifest.get("run_id", ""),
        "analysisDate": manifest.get("analysis_date", ""),
        "marketDataDate": manifest.get("market_data_date", ""),
        "sourceScope": manifest.get("source_scope", ""),
        "rulesVersion": manifest.get("rules_version", ""),
        "artifactHashes": {
            "manifest.json": _file_hash(manifest_path),
            "full_pdc_scores.csv": _file_hash(score_path),
            "hawkeye_radar_audit.csv": _file_hash(audit_path),
            "candidate_universe.csv": _file_hash(candidate_path),
        },
        "hawkeyeAudit": audit,
        "candidateUniverse": candidates,
        "deterministicPdcScores": scores,
        "modelInstruction": (
            "Use only this package. Do not browse, infer missing market facts, or alter the Hawkeye rules. "
            "Return FAILED when the package is insufficient for a requested judgment."
        ),
    }
    facts["packageSha256"] = _json_hash(facts)
    return facts


def write_market_data_package(run_dir: Path) -> Path:
    package = build_market_data_package(run_dir)
    committee_dir = run_dir / "committee"
    target = committee_dir / "02_market_data_package"
    staging = committee_dir / ".staging-02_market_data_package"
    if target.exists() or staging.exists():
        raise FileExistsError("Market Data Package already exists for this immutable run")
    staging.mkdir(parents=True)
    package_path = staging / "market_data_package.json"
    package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    stage = {
        "schemaVersion": "stock-pdc-committee-stage-v1",
        "runId": package["runId"],
        "stage": "02",
        "stageName": STAGES["02"],
        "status": "COMPLETED",
        "createdAt": _now(),
        "outputSha256": _file_hash(package_path),
        "marketDataPackageSha256": package["packageSha256"],
    }
    (staging / "manifest.json").write_text(json.dumps(stage, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    staging.rename(target)
    return target / "market_data_package.json"


def validate_model_result(value: object, expected_package_hash: str) -> dict[str, object]:
    """Reject fabricated, incomplete, or mismatched model callbacks."""
    if not isinstance(value, dict):
        raise ValueError("model result must be an object")
    model_id = str(value.get("modelId") or "").strip().lower()
    status = str(value.get("status") or "").strip().upper()
    if model_id not in MODEL_IDS:
        raise ValueError("unknown committee model")
    if status not in STATUSES:
        raise ValueError("model status must be COMPLETED or FAILED")
    if str(value.get("marketDataPackageSha256") or "") != expected_package_hash:
        raise ValueError("model result does not reference the frozen Market Data Package")
    model_version = str(value.get("modelVersion") or "").strip()
    if not model_version:
        raise ValueError("modelVersion is required")
    if status == "FAILED":
        reason = str(value.get("failureReason") or "").strip()
        if not reason:
            raise ValueError("FAILED model result requires failureReason")
        if value.get("opinions") not in (None, [], {}):
            raise ValueError("FAILED model result may not contain opinions")
        return {
            "modelId": model_id,
            "modelVersion": model_version,
            "status": status,
            "failureReason": reason[:1000],
            "marketDataPackageSha256": expected_package_hash,
            "opinions": [],
        }
    opinions = value.get("opinions")
    if not isinstance(opinions, list) or not opinions:
        raise ValueError("COMPLETED model result requires real opinions")
    normalized: list[dict[str, object]] = []
    seen: set[str] = set()
    for opinion in opinions:
        if not isinstance(opinion, dict):
            raise ValueError("model opinion must be an object")
        ticker = str(opinion.get("ticker") or "").strip().upper()
        decision = str(opinion.get("decision") or "").strip().upper()
        summary = str(opinion.get("summary") or "").strip()
        score = opinion.get("score")
        confidence = opinion.get("confidence")
        if not ticker or ticker in seen:
            raise ValueError("every model opinion needs a unique ticker")
        if decision not in DECISIONS:
            raise ValueError("model decision must be BUY, WATCH, HOLD, or SELL")
        if not isinstance(score, (int, float)) or not 0 <= float(score) <= 10:
            raise ValueError("model opinion score must be between 0 and 10")
        if not isinstance(confidence, (int, float)) or not 0 <= float(confidence) <= 1:
            raise ValueError("model opinion confidence must be between 0 and 1")
        if not summary:
            raise ValueError("model opinion requires a real summary")
        seen.add(ticker)
        normalized.append({
            "ticker": ticker,
            "score": round(float(score), 4),
            "confidence": round(float(confidence), 4),
            "decision": decision,
            "summary": summary[:4000],
            "riskFlags": [str(flag)[:200] for flag in opinion.get("riskFlags", []) if str(flag).strip()],
            "evidenceIds": [str(item)[:200] for item in opinion.get("evidenceIds", []) if str(item).strip()],
        })
    return {
        "modelId": model_id,
        "modelVersion": model_version,
        "status": status,
        "failureReason": "",
        "marketDataPackageSha256": expected_package_hash,
        "opinions": normalized,
    }


def write_committee_stage(
    run_dir: Path,
    stage: str,
    status: str,
    inputs: dict[str, str],
    output: dict[str, object],
) -> Path:
    """Write one immutable stage record. Existing records are never overwritten."""
    if stage not in STAGES:
        raise ValueError(f"unknown committee stage: {stage}")
    if status not in STATUSES:
        raise ValueError("stage status must be COMPLETED or FAILED")
    run_manifest = json.loads((run_dir / "manifest.json").read_text(encoding="utf-8"))
    committee_dir = run_dir / "committee"
    target = committee_dir / f"{stage}_{STAGES[stage]}"
    staging = committee_dir / f".staging-{stage}_{STAGES[stage]}"
    if target.exists() or staging.exists():
        raise FileExistsError(f"stage {stage} already exists for run {run_manifest.get('run_id')}")
    for label, digest in inputs.items():
        if not label or not isinstance(digest, str) or len(digest) != 64:
            raise ValueError("stage inputs must be named SHA-256 digests")
    staging.mkdir(parents=True)
    output_path = staging / "output.json"
    output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    manifest = {
        "schemaVersion": "stock-pdc-committee-stage-v1",
        "runId": run_manifest.get("run_id", ""),
        "stage": stage,
        "stageName": STAGES[stage],
        "status": status,
        "createdAt": _now(),
        "inputSha256": dict(sorted(inputs.items())),
        "outputSha256": _file_hash(output_path),
    }
    (staging / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    staging.rename(target)
    return target


def summarize_model_consensus(model_results: list[dict[str, object]]) -> dict[str, object]:
    """Deterministic statistics for Secretary; no language-model inference occurs here."""
    completed = [result for result in model_results if result.get("status") == "COMPLETED"]
    failed = [result for result in model_results if result.get("status") == "FAILED"]
    by_ticker: dict[str, list[dict[str, object]]] = {}
    for result in completed:
        for opinion in result.get("opinions", []):
            by_ticker.setdefault(str(opinion["ticker"]), []).append(opinion)
    rows = []
    for ticker, opinions in sorted(by_ticker.items()):
        scores = [float(opinion["score"]) for opinion in opinions]
        decisions = {decision: sum(opinion["decision"] == decision for opinion in opinions) for decision in DECISIONS}
        rows.append({
            "ticker": ticker,
            "modelCount": len(opinions),
            "meanScore": round(sum(scores) / len(scores), 4),
            "scoreSpread": round(max(scores) - min(scores), 4),
            "decisionVotes": decisions,
            "hasMaterialDisagreement": max(scores) - min(scores) >= 3.0 or (decisions["BUY"] and decisions["SELL"]),
        })
    return {
        "schemaVersion": "stock-pdc-committee-consensus-v1",
        "completedModels": [result["modelId"] for result in completed],
        "failedModels": [{"modelId": result["modelId"], "failureReason": result.get("failureReason", "")} for result in failed],
        "minimumQuorumMet": len(completed) >= 3,
        "tickers": rows,
    }
