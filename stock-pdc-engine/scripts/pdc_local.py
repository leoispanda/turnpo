#!/usr/bin/env python3
"""Command-line access to the local 1–9 Stock PDC stage engine."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from stock_pdc.local_app.pipeline import PipelineError, PipelineStore
from stock_pdc.local_app.stage_executor import execute_stage


STORE = PipelineStore(PROJECT_ROOT / "runs")
STAGE_IDS = {f"{index:02d}" for index in range(1, 10)}


def _stage_id(value: str) -> str:
    normalized = str(value).strip()
    if normalized.isdigit():
        normalized = f"{int(normalized):02d}"
    if normalized not in STAGE_IDS:
        raise argparse.ArgumentTypeError("stage 必须是 1–9")
    return normalized


def _json(value: object) -> None:
    print(json.dumps(value, ensure_ascii=False, indent=2))


def _config(args: argparse.Namespace) -> dict[str, object]:
    result: dict[str, object] = {}
    if args.data_dir:
        result["dataDir"] = args.data_dir
    if args.metadata_csv:
        result["metadataCsv"] = args.metadata_csv
    if args.top is not None:
        result["topN"] = args.top
    if args.as_of:
        result["asOf"] = args.as_of
    if args.benchmark:
        result["benchmark"] = args.benchmark
    return result


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run the local Stock PDC stage engine.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    run = subparsers.add_parser("run", help="execute one Stage or the full 1–9 pipeline")
    run.add_argument("--run", dest="run_id", help="existing Run ID; otherwise a new Run is created")
    run.add_argument("--stage", type=_stage_id, help="single Stage number, for example 5")
    run.add_argument("--select", action="store_true", help="select the new Attempt as the current Checkpoint")
    run.add_argument("--data-dir")
    run.add_argument("--metadata-csv")
    run.add_argument("--top", type=int)
    run.add_argument("--as-of")
    run.add_argument("--benchmark")

    validate = subparsers.add_parser("validate", help="validate one Attempt")
    validate.add_argument("--run", dest="run_id", required=True)
    validate.add_argument("--stage", type=_stage_id, required=True)
    validate.add_argument("--attempt", required=True)

    diff = subparsers.add_parser("diff", help="compare two Attempts")
    diff.add_argument("--run", dest="run_id", required=True)
    diff.add_argument("--stage", type=_stage_id, required=True)
    diff.add_argument("--attempt", nargs=2, metavar=("LEFT", "RIGHT"), required=True)

    resume = subparsers.add_parser("resume", help="show the earliest resumable Stage")
    resume.add_argument("--run", dest="run_id", required=True)

    show = subparsers.add_parser("show", help="show Run and Stage status")
    show.add_argument("--run", dest="run_id", required=True)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        if args.command == "validate":
            _json(STORE.validate_attempt(args.run_id, args.stage, args.attempt))
            return 0
        if args.command == "diff":
            _json(STORE.diff_attempts(args.run_id, args.stage, args.attempt[0], args.attempt[1]))
            return 0
        if args.command == "resume":
            _json(STORE.resume_plan(args.run_id))
            return 0
        if args.command == "show":
            _json(STORE.run_view(args.run_id))
            return 0

        config = _config(args)
        run_id = args.run_id
        if not run_id:
            run = STORE.create_run(metadata={"executionConfig": config})
            run_id = str(run["runId"])
            print(f"Run: {run_id}")
        if args.stage:
            checkpoint = execute_stage(STORE, run_id, args.stage, config)
            selected = False
            if args.select:
                STORE.select_attempt(run_id, args.stage, str(checkpoint["attemptId"]))
                selected = True
            _json({"runId": run_id, "checkpoint": checkpoint, "selected": selected})
            return 0

        # A full deterministic run selects each freshly-created Attempt so the
        # next Stage can consume it. The Dashboard remains review-first.
        for stage_id in sorted(STAGE_IDS):
            checkpoint = execute_stage(STORE, run_id, stage_id, config)
            STORE.select_attempt(run_id, stage_id, str(checkpoint["attemptId"]))
            print(f"Stage {stage_id}: {checkpoint['attemptId']} SELECTED")
        print(f"Run complete: {run_id}")
        return 0
    except (PipelineError, OSError, ValueError) as exc:
        print(f"PDC Local failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

