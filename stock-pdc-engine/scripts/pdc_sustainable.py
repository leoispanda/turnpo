#!/usr/bin/env python3
"""Entry point for the sustainable, locally-run Stock PDC committee.

`doctor` proves the local seats work before any daily job depends on them. It
reports the exact command it ran, so a changed CLI flag is visible rather than
hidden behind a generic failure.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import shutil
import sys
import tempfile
from datetime import date
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from stock_pdc.local_app.pipeline import PipelineError, PipelineStore
from stock_pdc.sustainable.arbitration import (
    acceptance_report,
    arbitrate,
    final_gate,
)
from stock_pdc.sustainable.blue_whale import (
    CoverageError,
    assert_full_coverage,
    display_slice,
)
from stock_pdc.sustainable.disagreement import DEFAULT_CHALLENGE_THRESHOLD, build_matrix
from stock_pdc.sustainable.evidence import freeze, freeze_round_one
from stock_pdc.sustainable.round_two import run_round_two
from stock_pdc.sustainable.round_one import (
    DEFAULT_BATCH_SIZE,
    build_input,
    consensus,
    run_round_one,
    write_json,
)
from stock_pdc.sustainable.roster import DEFAULT_ROSTER, roster_status
from stock_pdc.sustainable.runner import (
    DEFAULT_TIMEOUT_SECONDS,
    TOKEN_MISSING,
    TOKEN_NOT_REQUIRED,
    resolve_token,
    smoke,
)


TOKEN_LABELS = {
    TOKEN_NOT_REQUIRED: "无需令牌（继承桌面 App 凭证）",
    "environment": "环境变量",
    "keychain": "钥匙串",
    TOKEN_MISSING: "缺失",
}


def _doctor(args: argparse.Namespace) -> int:
    status = roster_status(DEFAULT_ROSTER)
    print("委员会席位：")
    for member in status["members"]:
        mark = "OK  " if member["available"] else "缺失"
        location = member["executable"] or member["message"]
        print(f"  [{mark}] {member['displayName']:<8} {member['runnerId']:<8} {location}")
    print()

    print("认证状态：")
    token_missing = False
    for member in DEFAULT_ROSTER:
        # Only the provenance is printed; the credential itself never is.
        _, source = resolve_token(member.runner, os.environ)
        print(f"  {member.display_name:<8} {TOKEN_LABELS.get(source, source)}")
        if source == TOKEN_MISSING:
            token_missing = True
            print(
                f"           需要 {member.runner.token_env_var}，"
                f"或钥匙串条目 {member.runner.keychain_service}"
            )
    print()

    if not status["quorumMet"]:
        print("至少需要两个可用席位才能进行同行复核。请先安装缺失的 CLI。")
        return 1
    if token_missing and not args.no_call:
        print("有席位缺少认证令牌，实际调用一定会失败。请先补齐后重试。")
        return 1

    if args.no_call:
        print("已跳过实际调用（--no-call）。席位存在，但尚未证明能返回结构化 JSON。")
        return 0

    print(f"正在对每个席位做一次最小 smoke 调用（超时 {args.timeout} 秒）……")
    workspace_root = Path(tempfile.mkdtemp(prefix="pdc-sustainable-doctor-"))
    failures = 0
    try:
        for member in DEFAULT_ROSTER:
            if not member.runner.resolve():
                continue
            result = smoke(member, workspace_root / member.member_id, timeout_seconds=args.timeout)
            label = "通过" if result["ok"] else "失败"
            print(f"\n  {member.display_name}: {label}")
            print(f"    命令: {' '.join(result['command'])}")
            if result["ok"]:
                print(f"    返回: {json.dumps(result['output'], ensure_ascii=False)}")
                continue
            failures += 1
            print(f"    原因: {result['error']}")
            if result["output"] is not None:
                print(f"    实际返回: {json.dumps(result['output'], ensure_ascii=False)}")
            if result["stdoutExcerpt"]:
                print(f"    输出片段: {result['stdoutExcerpt'][:600]}")
    finally:
        shutil.rmtree(workspace_root, ignore_errors=True)

    print()
    if failures:
        print(f"{failures} 个席位未通过。上面的命令行可直接复制到终端手动复现。")
        return 1
    print("全部席位可用，可以进入下一步（R1 独立评分）。")
    return 0


def _latest_run_id() -> str:
    """Newest Run whose Round 1 checkpoint is actually selected.

    The dashboard is review-first: an Attempt exists long before a human accepts
    it. Consuming an unselected Attempt would score candidates the operator never
    approved, so those Runs are skipped rather than silently used.
    """
    runs = PROJECT_ROOT / "runs"
    if not runs.is_dir():
        raise SystemExit("runs/ 目录不存在，请先跑一次本地 PDC。")
    usable = []
    for path in runs.iterdir():
        manifest = path / "run.json"
        if not manifest.is_file():
            continue
        try:
            selected = json.loads(manifest.read_text(encoding="utf-8")).get("selectedAttempts", {})
        except (OSError, json.JSONDecodeError):
            continue
        if isinstance(selected, dict) and selected.get("03"):
            usable.append(path)
    if not usable:
        raise SystemExit(
            "没有找到 Stage 03 已选定的 Run。\n"
            "请先在本地 dashboard 里选定 Stage 03 的 Attempt，或用 --run 指定。"
        )
    return max(usable, key=lambda path: path.stat().st_mtime).name


NUMERIC_COLUMNS = ("rank", "final_score", "latest_close", "breakout_trigger", "technical_stop")


def _rows_from_csv(path: Path) -> tuple[list[dict], str]:
    """Read the full-market scores produced by scripts/run_latest_pdc.py.

    That workflow already fetches the whole A-share market, verifies the bars
    are current, and runs Hawkeye plus the nine deterministic members. The
    committee consumes its result rather than re-deriving any of it.
    """
    if not path.is_file():
        raise SystemExit(
            f"找不到全市场评分文件：{path}\n"
            "请先运行 scripts/run_latest_pdc.py 抓取并评分。"
        )
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        raw = list(csv.DictReader(handle))
    if not raw:
        raise SystemExit(f"{path} 里没有数据行。")

    rows: list[dict] = []
    for record in raw:
        row: dict = dict(record)
        for column, value in record.items():
            if column.endswith("_score") or column in NUMERIC_COLUMNS:
                try:
                    row[column] = float(value)
                except (TypeError, ValueError):
                    row.pop(column, None)
        rows.append(row)
    analysis_date = str(raw[0].get("analysis_date") or "").strip()
    return rows, analysis_date


def _assert_data_is_current(analysis_date: str, allow_stale: bool) -> None:
    """A recommendation derived from stale bars is wrong, not merely old."""
    if not analysis_date:
        raise SystemExit("评分文件缺少 analysis_date，无法确认数据新鲜度。")
    age = (date.today() - date.fromisoformat(analysis_date)).days
    if age <= 4 or allow_stale:
        if age > 4:
            print(f"⚠️  数据为 {analysis_date}（{age} 天前），已按 --allow-stale 继续。\n")
        return
    raise SystemExit(
        f"数据日期 {analysis_date} 距今 {age} 天，据此产出的建议是错的。\n"
        "请先运行 scripts/run_latest_pdc.py 刷新，或用 --allow-stale 明确接受。"
    )


def _deterministic_rows(run_id: str) -> list[dict]:
    store = PipelineStore(PROJECT_ROOT / "runs")
    try:
        output = store.load_selected_output(run_id, "03")
    except PipelineError as exc:
        raise SystemExit(f"无法读取 Stage 03 的已选结果：{exc}") from exc
    # A stage attempt wraps its payload in `data`; older shapes carried rows at
    # the top level.
    container = output.get("data") if isinstance(output.get("data"), dict) else output
    rows = container.get("rows") if isinstance(container, dict) else None
    if not isinstance(rows, list) or not rows:
        raise SystemExit("Stage 03 的已选结果里没有候选行。")
    return rows


def _r1(args: argparse.Namespace) -> int:
    run_id = args.run_id or _latest_run_id()
    rows = _deterministic_rows(run_id)
    ranked = sorted(rows, key=lambda row: row.get("rank") or 10**9)[: args.top]
    payload = build_input(run_id, ranked, {"topN": args.top})

    print(f"Run: {run_id}")
    print(f"候选: {payload['candidateCount']} 支（按确定性排名取前 {args.top}）")
    print(f"席位: {', '.join(member.display_name for member in DEFAULT_ROSTER)}")
    print("两个席位并行独立评分，互相看不到对方结果……\n")

    target = PROJECT_ROOT / "runs" / run_id / "sustainable" / "r1"
    workspace_root = Path(tempfile.mkdtemp(prefix="pdc-sustainable-r1-"))
    try:
        frozen = run_round_one(DEFAULT_ROSTER, workspace_root, payload, args.timeout)
    finally:
        shutil.rmtree(workspace_root, ignore_errors=True)

    # The package each seat saw is kept as audit evidence even when a seat failed.
    write_json(target / "input.json", payload)
    write_json(target / "frozen.json", frozen)

    for record in frozen["memberResults"]:
        mark = "通过" if record["status"] == "COMPLETED" else "失败"
        print(f"  {record['memberId']:<8} {mark}", end="")
        if record["status"] == "COMPLETED":
            print(f"  {len(record['scorecards'])} 张打分卡")
        else:
            print(f"  {record['failureReason']}")

    if not frozen["quorumMet"]:
        print("\n完成的席位不足两个，无法进入盲审。")
        return 1

    summary = consensus(frozen)
    write_json(target / "consensus.json", summary)
    print(f"\n共识排名（分歧 {summary['disagreementCount']} 支）：")
    print(f"  {'#':<3} {'代码':<12} {'均分':>6} {'分差':>6}  各席位")
    for row in summary["tickers"]:
        flag = " ⚠️" if row["hasMaterialDisagreement"] else ""
        by_member = "  ".join(f"{name}={score}" for name, score in row["byMember"].items())
        print(
            f"  {row['consensusRank']:<3} {row['ticker']:<12} "
            f"{row['meanScore']:>6} {row['scoreSpread']:>6}  {by_member}{flag}"
        )
    print(f"\n已冻结：{target}")
    return 0


def _facts_by_ticker(rows: list[dict]) -> dict[str, dict]:
    """Deterministic facts the rule gate needs but consensus does not carry."""
    return {
        str(row.get("ticker") or "").upper(): {
            "riskScore": float(row.get("risk_score") or 0.0),
            "overheatScore": float(row.get("overheat_score") or 0.0),
            "finalStatus": str(row.get("final_status") or ""),
        }
        for row in rows
    }


def _pdc(args: argparse.Namespace) -> int:
    analysis_date = ""
    if args.scores_csv:
        source = Path(args.scores_csv)
        source = source if source.is_absolute() else PROJECT_ROOT / source
        rows, analysis_date = _rows_from_csv(source)
        _assert_data_is_current(analysis_date, args.allow_stale)
        suffix = "-anchored" if args.with_baseline else ""
        run_id = args.run_id or f"market-{analysis_date}{suffix}"
        target = PROJECT_ROOT / "outputs" / "sustainable" / run_id
    else:
        run_id = args.run_id or _latest_run_id()
        rows = _deterministic_rows(run_id)
        target = PROJECT_ROOT / "runs" / run_id / "sustainable"

    # The whole Hawkeye pool goes to the seats. Top-N is applied to the final
    # ranking for display only; using it here would make it an input filter.
    pool = sorted(rows, key=lambda row: row.get("rank") or 10**9)
    payload = build_input(
        run_id, pool, {"analysisDate": analysis_date}, include_baseline=args.with_baseline
    )
    hawkeye_tickers = tuple(item["ticker"] for item in payload["candidates"])

    print("运行模式: FULL_COMMITTEE（离线审计）—— 日常 10 只清单请用 scripts/pdc_daily_top10.py")
    print(f"Run: {run_id}")
    if analysis_date:
        print(f"数据日期: {analysis_date}")
    print(f"鹰眼候选池: {payload['candidateCount']} 支（全部交给 AI 席位，不预筛）")
    print(
        "输入模式: "
        + ("带确定性基准分（对照组）" if args.with_baseline else "只给测量事实，不给任何评分/名次/结论")
    )
    print(f"席位: {', '.join(member.display_name for member in DEFAULT_ROSTER)}")
    print(f"分批: 每批 {args.batch_size} 支\n")

    print("── Round 1：两个席位对全部候选独立评分 ──")
    existing = target / "r1" / "frozen.json"
    if args.reuse_r1 and existing.is_file():
        # Round 1 is the expensive half and its scores are already frozen and
        # hashed. Re-running it to retry Round 2 would both waste quota and
        # invalidate every Round 2 batch already paid for, because new scores
        # produce a different disagreement matrix.
        frozen = json.loads(existing.read_text(encoding="utf-8"))
        payload = json.loads((target / "r1" / "input.json").read_text(encoding="utf-8"))
        hawkeye_tickers = tuple(item["ticker"] for item in payload["candidates"])
        print(f"  复用已冻结的 Round 1（{existing}）")
    else:
        workspace_root = Path(tempfile.mkdtemp(prefix="pdc-sustainable-"))
        try:
            frozen = run_round_one(
                DEFAULT_ROSTER, workspace_root, payload, args.timeout, args.batch_size
            )
        finally:
            shutil.rmtree(workspace_root, ignore_errors=True)
        write_json(target / "r1" / "input.json", payload)
        write_json(target / "r1" / "frozen.json", frozen)
    for record in frozen["memberResults"]:
        mark = "通过" if record["status"] == "COMPLETED" else "失败"
        detail = (
            f"{len(record['scorecards'])} 张打分卡 / {record['batchCount']} 批"
            if record["status"] == "COMPLETED"
            else record["failureReason"]
        )
        print(f"  {record['memberId']:<8} {mark}  {detail}")
    if not frozen["quorumMet"]:
        print("\n完成的席位不足两个，本次 PDC 中止。")
        return 1

    print("\n── Blue Whale（执行层）：冻结 → 校验 → 分歧矩阵 ──")
    snapshot = freeze(run_id, payload, analysis_date or str(date.today()))
    write_json(target / "snapshot.json", snapshot)
    print(f"  snapshot {snapshot['snapshotId']}")
    print(f"  candidate_set_hash {snapshot['candidateSetHash'][:16]}  facts_hash {snapshot['factsHash'][:16]}")

    try:
        assert_full_coverage(hawkeye_tickers, frozen)
    except CoverageError as exc:
        print(f"  覆盖校验失败：{exc}")
        return 1
    print(f"  覆盖校验通过：每个完成席位都评了全部 {len(hawkeye_tickers)} 支")

    r1_hashes = freeze_round_one(snapshot, frozen)
    write_json(target / "r1" / "hashes.json", r1_hashes)

    submissions = {
        record["memberId"]: record["scorecards"]
        for record in frozen["memberResults"]
        if record["status"] == "COMPLETED"
    }
    matrix = build_matrix(submissions, args.challenge_threshold)
    write_json(target / "disagreement.json", matrix)
    print(
        f"  逐维度分歧（阈值 {matrix['threshold']}）："
        f"{matrix['challengedCount']} 支需复议，{matrix['highDisagreementCount']} 支高分歧"
    )

    facts_by_ticker = {item["ticker"]: item for item in payload["candidates"]}
    print(f"\n── Round 2：匿名结构化复议（仅 KEEP / REVISE）──")
    workspace_root = Path(tempfile.mkdtemp(prefix="pdc-sustainable-r2-"))
    try:
        round_two = run_round_two(
            DEFAULT_ROSTER, workspace_root, submissions, matrix,
            facts_by_ticker, run_id, args.timeout,
            cache_dir=target / "round2" / "cache",
        )
    finally:
        shutil.rmtree(workspace_root, ignore_errors=True)

    ledger = round_two.pop("ledger")
    final_scores = round_two.pop("finalScores")
    # The ledger unseals authorship; it is written beside the run, never into a
    # workspace any seat can read.
    write_json(target / "round2" / "ledger.json", ledger)
    write_json(target / "round2" / "revisions.json", round_two)
    for record in round_two["memberResults"]:
        mark = "通过" if record["status"] == "COMPLETED" else "失败"
        detail = (
            f"{len(record['revisions'])} 处修订"
            f"（{record['batchCount']} 批，复用 {record.get('reusedBatches', 0)}）"
            if record["status"] == "COMPLETED" else record["failureReason"]
        )
        print(f"  {record['memberId']:<8} {mark}  {detail}")
    if len(final_scores) < 2:
        print("\n复议后完成的席位不足两个，本次 PDC 中止。")
        return 1
    for member_id, cards in final_scores.items():
        write_json(target / "round2" / f"final-{member_id}.json", cards)

    print("\n── 确定性仲裁：逐维度取均值 → 固定权重算总分 ──")
    facts = _facts_by_ticker(pool)
    ranking = arbitrate(final_scores, matrix, facts)
    print(f"  权重来自引擎 DEFAULT_WEIGHTS，池内 {ranking['poolSize']} 支全部保留")
    print(f"  高分歧（少数意见保全）：{ranking['highDisagreementCount']} 支")

    age = (date.today() - date.fromisoformat(snapshot["analysisDate"])).days
    gate = final_gate(ranking, snapshot, len(hawkeye_tickers), age)
    # Written after the gate, which stamps each row: saving the ranking first
    # left the per-row verdict out of the audit trail entirely.
    write_json(target / "arbitration.json", ranking)
    write_json(target / "final-gate.json", gate)
    print(f"\n── Final Gate：{gate['status']} ──")
    print(f"  PASS {gate['passCount']} / REVIEW_REQUIRED {gate['reviewCount']} / BLOCK {gate['blockCount']}")
    for reason in gate["blockingReasons"] + gate["reviewReasons"]:
        print(f"  · {reason}")

    print(f"\n── 完整排名的前 {args.top}（展示层）──")
    print(f"  {'#':<4} {'代码':<12} {'共识':>6} {'分歧':>6} {'风险':>6}  {'闸门':<16} 席位总分")
    for row in display_slice(ranking, args.top):
        seats = " ".join(f"{k}={v}" for k, v in sorted(row["seatTotals"].items()))
        flag = " ⚠️" if row["highDisagreement"] else ""
        print(
            f"  {row['rank']:<4} {row['ticker']:<12} {row['consensusTotal']:>6} "
            f"{row['absoluteDisagreement']:>6} {row['riskScore']:>6}  {row['gate']:<16} {seats}{flag}"
        )

    report = acceptance_report(
        snapshot, frozen, r1_hashes, matrix, round_two, ranking, gate,
        len(hawkeye_tickers), args.top, ledger,
    )
    write_json(target / "acceptance.json", report)
    print("\n── 验收 ──")
    for key, value in report.items():
        print(f"  {key:<28} {value}")
    print(f"\n全部产物：{target}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Sustainable local Stock PDC committee.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    doctor = subparsers.add_parser("doctor", help="check that every local seat can answer")
    doctor.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT_SECONDS)
    doctor.add_argument("--no-call", action="store_true", help="only look for the CLIs, do not invoke them")
    doctor.set_defaults(handler=_doctor)

    r1 = subparsers.add_parser("r1", help="run Round 1 independent scoring on both seats")
    r1.add_argument("--run", dest="run_id", help="Run ID; defaults to the most recent Run")
    r1.add_argument("--top", type=int, default=5, help="how many top-ranked candidates to score")
    r1.add_argument("--timeout", type=int, default=600)
    r1.set_defaults(handler=_r1)

    pdc = subparsers.add_parser("pdc", help="Round 1 through the Blue Whale gate")
    pdc.add_argument("--run", dest="run_id", help="Run ID; defaults to the most recent selected Run")
    pdc.add_argument(
        "--top",
        type=int,
        default=20,
        help="how many ranked rows to print; display only, never an input filter",
    )
    pdc.add_argument(
        "--batch-size",
        type=int,
        default=DEFAULT_BATCH_SIZE,
        help="candidates per request; bounds one response, never the pool",
    )
    pdc.add_argument("--timeout", type=int, default=900)
    pdc.add_argument(
        "--challenge-threshold",
        type=float,
        default=DEFAULT_CHALLENGE_THRESHOLD,
        help="per-dimension gap that sends a candidate to Round 2",
    )
    pdc.add_argument(
        "--reuse-r1",
        action="store_true",
        help="load the frozen Round 1 instead of re-scoring; needed to retry Round 2 cheaply",
    )
    pdc.add_argument(
        "--with-baseline",
        action="store_true",
        help="also show seats the engine's scores/rank/status (anchored control run)",
    )
    pdc.add_argument(
        "--scores-csv",
        nargs="?",
        const="outputs/full_pdc_scores.csv",
        help="Full-market scores from run_latest_pdc.py (default: outputs/full_pdc_scores.csv)",
    )
    pdc.add_argument(
        "--allow-stale",
        action="store_true",
        help="proceed even when the bars are more than four days old",
    )
    pdc.set_defaults(handler=_pdc)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    return int(args.handler(args))


if __name__ == "__main__":
    raise SystemExit(main())
