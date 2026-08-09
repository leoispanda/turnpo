"""Record one real output from the existing five-model PDC committee.

This is intentionally a storage command, not a model runner. The protected
compute service calls it only after a real existing stage finishes. It refuses
to invent a result when an API key, model, or response is unavailable.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from stock_pdc.committee_audit import (
    MODEL_IDS,
    STAGES,
    summarize_model_consensus,
    validate_model_result,
    write_committee_stage,
)
from stock_pdc.decision_memory import record_committee_model_stage, write_performance_report


def _path(value: str) -> Path:
    path = Path(value)
    return path if path.is_absolute() else PROJECT_ROOT / path


def _json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def _package_hash(run_dir: Path) -> str:
    package = _json(run_dir / "committee" / "02_market_data_package" / "market_data_package.json")
    if not isinstance(package, dict) or not isinstance(package.get("packageSha256"), str):
        raise ValueError("run has no valid frozen Market Data Package")
    return package["packageSha256"]


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Append one immutable result from an existing PDC committee stage.")
    parser.add_argument("--run-dir", required=True, help="Verified outputs/runs/<run-id> directory.")
    parser.add_argument("--stage", required=True, choices=sorted(STAGES))
    parser.add_argument("--status", required=True, choices=["COMPLETED", "FAILED"])
    parser.add_argument("--inputs-json", required=True, help="JSON object mapping input names to SHA-256 digests.")
    parser.add_argument("--output-json", required=True, help="Actual protected-service output JSON for this stage.")
    parser.add_argument("--performance-db", default="outputs/performance/pdc_performance.sqlite")
    parser.add_argument("--performance-report", default="outputs/performance/pdc_performance_report.md")
    return parser


def _normalize_model_round(output: object, expected_hash: str) -> dict[str, object]:
    if not isinstance(output, dict) or not isinstance(output.get("modelResults"), list):
        raise ValueError("model rounds require output.modelResults")
    normalized = [validate_model_result(item, expected_hash) for item in output["modelResults"]]
    ids = [str(item["modelId"]) for item in normalized]
    if sorted(ids) != sorted(MODEL_IDS) or len(set(ids)) != len(MODEL_IDS):
        raise ValueError("model rounds must record exactly one real COMPLETED or FAILED result for all five models")
    return {
        "modelResults": normalized,
        "programmaticConsensus": summarize_model_consensus(normalized),
    }


def main() -> int:
    args = build_parser().parse_args()
    run_dir = _path(args.run_dir)
    inputs = _json(_path(args.inputs_json))
    output = _json(_path(args.output_json))
    if not isinstance(inputs, dict) or not all(isinstance(key, str) and isinstance(value, str) for key, value in inputs.items()):
        raise SystemExit("--inputs-json must contain only input-name to SHA-256 mappings")
    if args.stage in {"03", "05"}:
        output = _normalize_model_round(output, _package_hash(run_dir))
    if not isinstance(output, dict):
        raise SystemExit("--output-json must be an object")
    stage_dir = write_committee_stage(run_dir, args.stage, args.status, inputs, output)
    print(f"Recorded immutable committee stage {args.stage} ({STAGES[args.stage]}): {stage_dir}")
    if args.stage in {"03", "05"}:
        database_path = _path(args.performance_db)
        report_path = _path(args.performance_report)
        stored = record_committee_model_stage(database_path, run_dir, args.stage)
        write_performance_report(database_path, report_path)
        print(f"Recorded {stored} real model predictions in: {database_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
