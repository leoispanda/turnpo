#!/usr/bin/env python3
"""DAILY_TOP10 — the two-seat daily run that ends in exactly ten seats.

`plan` is the preflight: it reads the day's inputs, applies the hard gate, and
prints exactly how many calls the run will make and how large each prompt is,
without invoking a single seat. Run it before spending quota.

`run` is the day. Three rounds, at most four calls per model, one CSV and one
page at the end. It never connects to a broker, never logs in anywhere, never
places an order, and never reads or prints a credential.

The full-pool committee stays where it is: `scripts/pdc_sustainable.py pdc` is
the offline FULL_COMMITTEE audit and is not part of the daily path.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from stock_pdc.sustainable.daily import RUNTIME_MODE
from stock_pdc.sustainable.daily import discovery as discovery_module
from stock_pdc.sustainable.daily import detail as detail_module
from stock_pdc.sustainable.daily import facts as facts_module
from stock_pdc.sustainable.daily import report as report_module
from stock_pdc.sustainable.daily.consensus import (
    DEFAULT_PRELIMINARY_TOP,
    DEFAULT_TOTAL_DISAGREEMENT_LIMIT,
)
from stock_pdc.sustainable.daily.contracts import DISCOVERY_PICKS
from stock_pdc.sustainable.daily.eligibility import EligibilityConfig, screen_all
from stock_pdc.sustainable.daily.orchestrator import DailyConfig, run_daily
from stock_pdc.sustainable.daily.quota import MAX_CALLS_PER_MEMBER, QuotaLedger
from stock_pdc.sustainable.daily.selection import SEAT_COUNT, SelectionConfig
from stock_pdc.sustainable.daily.sources import SourceError, load, load_sector_map, newest_data_dir
from stock_pdc.sustainable.roster import DEFAULT_ROSTER, roster_status


DEFAULT_SCORES_CSV = "outputs/full_pdc_scores.csv"
DEFAULT_UNIVERSE_CSV = "outputs_a_share/a_share_universe.csv"
DEFAULT_BARS_ROOT = "data_a_share_latest_runs"
DEFAULT_OUTPUTS_DIR = "outputs"
DEFAULT_SECTOR_MAP = "configs/a_share_industry_sina_sw1.json"


def _project_path(value: str | Path) -> Path:
    path = Path(value)
    return path if path.is_absolute() else PROJECT_ROOT / path


def _resolve_data_dir(args: argparse.Namespace) -> Path:
    if args.data_dir:
        return _project_path(args.data_dir)
    return newest_data_dir(_project_path(DEFAULT_BARS_ROOT))


def _load_inputs(args: argparse.Namespace):
    return load(
        _project_path(args.scores_csv),
        _project_path(args.universe_csv),
        _resolve_data_dir(args),
    )


def _assert_fresh(analysis_date: str, allow_stale: bool, max_age_days: int) -> int:
    """A recommendation derived from stale bars is wrong, not merely old."""
    age = (date.today() - date.fromisoformat(analysis_date)).days
    if age <= max_age_days:
        return age
    if allow_stale:
        print(f"⚠️  数据为 {analysis_date}（{age} 天前），已按 --allow-stale 继续。\n")
        return age
    raise SystemExit(
        f"数据日期 {analysis_date} 距今 {age} 天，据此产出的建议是错的。\n"
        "请先运行 scripts/run_latest_pdc.py 刷新，或用 --allow-stale 明确接受。"
    )


def _configs(args: argparse.Namespace, sectors: dict[str, str]) -> DailyConfig:
    return DailyConfig(
        run_id=args.run_id or "",
        discovery_picks=args.picks,
        preliminary_top=args.top,
        disagreement_limit=args.disagreement_limit,
        challenge_threshold=args.challenge_threshold,
        posture=args.posture or "",
        timeout_seconds=args.timeout,
        skip_review=args.skip_review,
        eligibility=EligibilityConfig(
            min_turnover_cny=args.min_turnover,
            max_data_age_days=args.max_age_days,
            block_engine_remove=args.block_engine_remove,
        ),
        selection=SelectionConfig(
            seats=args.seats,
            turnover_buffer=args.buffer,
            max_per_sector=args.max_per_sector,
            max_stop_distance_pct=args.max_stop_distance,
            sectors=sectors,
        ),
    )


def _plan(args: argparse.Namespace) -> int:
    inputs = _load_inputs(args)
    sectors = load_sector_map(_project_path(args.sector_map) if args.sector_map else None)
    config = _configs(args, sectors)
    age = (date.today() - date.fromisoformat(inputs.analysis_date)).days

    report = screen_all(inputs.candidates, inputs.analysis_date, date.today(), config.eligibility)
    eligible = set(report["eligible"])
    records = [record for record in inputs.records if record["ticker"] in eligible]
    if not records:
        raise SystemExit("硬资格检查后没有候选，无法进入发现轮。")
    table = facts_module.build_table(records, inputs.analysis_date, args.run_id or "plan")

    picks = discovery_module.picks_for(len(records), config.discovery_picks)
    discovery_payload = discovery_module.build_payload(table, "plan", config.discovery_picks)
    discovery_prompt = discovery_module.prompt_for(discovery_payload)

    union_size = min(picks * 2, len(records))
    union_table = facts_module.subset(table, tuple(table["tickers"][:union_size]))
    detail_prompt = detail_module.prompt_for(detail_module.build_payload(union_table, "plan"))

    print(f"运行模式        {RUNTIME_MODE}")
    print(f"数据日期        {inputs.analysis_date}（{age} 天前，上限 {config.eligibility.max_data_age_days}）")
    print(f"行情目录        {inputs.data_dir}")
    print(f"评分文件        {inputs.scores_path}")
    print()
    print(f"鹰眼池          {report['screenedCount']} 支")
    print(f"硬资格通过      {report['eligibleCount']} 支")
    print(f"硬资格拦截      {report['blockedCount']} 支 {report['blockedReasonCounts']}")
    if inputs.missing_bars:
        print(f"缺少行情        {len(inputs.missing_bars)} 支：{', '.join(inputs.missing_bars[:8])}")
    print()
    print("预计调用（每个席位）：")
    print(f"  第一轮 发现     1 次，提名 {picks} 支，prompt {len(discovery_prompt):,} 字符")
    print(f"  第二轮 详评     1 次（最多 2），并集 30–{union_size} 支，prompt ≈{len(detail_prompt):,} 字符")
    print(f"  第三轮 终审     1 次，终选 {min(config.preliminary_top, union_size)} 支")
    print(f"  合计            3–4 次 / 席位（硬上限 {MAX_CALLS_PER_MEMBER}）")
    print()
    print(f"席位数          {config.selection.seats}（不足以 CASH 补齐，不得用较差标的凑数）")
    print(f"行业集中度      {'启用' if sectors else '未启用（缺少行业映射）'}")
    print(f"敞口姿态        {config.posture or '未设置（系数 1.0）'}")
    print(f"分歧上限        {config.disagreement_limit}（超过标记 UNRESOLVED_DISAGREEMENT，不得买入）")
    print()
    print("本命令没有调用任何模型。真实运行请使用 `run`。")
    return 0


def _run(args: argparse.Namespace) -> int:
    status = roster_status(DEFAULT_ROSTER)
    if not status["quorumMet"]:
        for member in status["members"]:
            print(f"  [{'OK' if member['available'] else '缺失'}] {member['displayName']}: {member['message']}")
        raise SystemExit(
            "可用席位不足两个。请先运行 `python3 scripts/pdc_sustainable.py doctor` 排查。"
        )

    inputs = _load_inputs(args)
    sectors = load_sector_map(_project_path(args.sector_map) if args.sector_map else None)
    config = _configs(args, sectors)
    _assert_fresh(inputs.analysis_date, args.allow_stale, config.eligibility.max_data_age_days)

    outputs_dir = _project_path(args.outputs_dir)
    history_path = outputs_dir / "daily_top10_history.csv"
    latest_csv = outputs_dir / "daily_top10.csv"
    latest_html = outputs_dir / "daily_top10.html"
    previous, previous_date = report_module.load_previous(
        history_path, latest_csv, inputs.analysis_date
    )

    run_id = args.run_id or f"daily-{inputs.analysis_date}"
    target = outputs_dir / "sustainable" / "daily" / run_id

    print(f"Run: {run_id}   模式 {RUNTIME_MODE}")
    print(f"数据日期: {inputs.analysis_date}   行情: {inputs.data_dir}")
    print(f"席位: {', '.join(member.display_name for member in DEFAULT_ROSTER)}")
    if previous:
        print(f"昨日名单: {previous_date}（{len(previous)} 支）")
    else:
        print("昨日名单: 无（首次运行）")
    print()

    ledger = QuotaLedger(max_calls_per_member=args.max_calls)
    result = run_daily(
        inputs,
        target,
        date.today(),
        previous,
        previous_date,
        config,
        DEFAULT_ROSTER,
        ledger,
    )

    rows = result["rows"]
    report_module.write_csv(target / "daily_top10.csv", rows)
    report_module.write_html(target / "daily_top10.html", rows, result["context"], result["audit"])
    report_module.write_csv(latest_csv, rows)
    report_module.write_html(latest_html, rows, result["context"], result["audit"])
    report_module.append_history(history_path, rows, date.today().isoformat())

    print(f"── 最终 {len(rows)} 个席位 ──")
    print(f"  {'#':<3} {'代码':<11} {'名称':<10} {'动作':<6} {'仓位%':>6}  {'止损':>8} {'昨日':>5} {'变化':>5}")
    for row in rows:
        print(
            f"  {row['rank']:<3} {row['ticker']:<11} {str(row['name'])[:10]:<10} "
            f"{row['action']:<6} {str(row['allocation_pct']):>6}  "
            f"{str(row['technical_stop_reference']):>8} {str(row['previous_rank']):>5} {str(row['rank_change']):>5}"
        )
    print()
    quota = ledger.to_json()
    print("── 额度 ──")
    for member_id, stats in sorted(quota["byMember"].items()):
        print(
            f"  {member_id:<8} {stats['calls']} 次（剩 {stats['remaining']}）"
            f"  输入 {stats['promptChars']:,} 字符  输出 {stats['outputChars']:,} 字符"
            f"  {stats['seconds']} 秒"
        )
    print(f"\n── 降级状态：{result['degradationStatus']} ──")
    for line in result["degradation"]:
        print(f"  · {line}")
    print(f"\n主产物：{latest_csv}")
    print(f"       {latest_html}")
    print(f"审计：{target}")
    return 0


def _show(args: argparse.Namespace) -> int:
    """Print the current daily sheet without running anything."""
    path = _project_path(args.outputs_dir) / "daily_top10.csv"
    if not path.is_file():
        raise SystemExit(f"还没有产出：{path}")
    print(path.read_text(encoding="utf-8"))
    return 0


def _add_common(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--scores-csv", default=DEFAULT_SCORES_CSV)
    parser.add_argument("--universe-csv", default=DEFAULT_UNIVERSE_CSV)
    parser.add_argument("--data-dir", default=None, help="行情目录；默认取最新的一次抓取")
    parser.add_argument("--outputs-dir", default=DEFAULT_OUTPUTS_DIR)
    parser.add_argument("--run-id", default=None)
    parser.add_argument("--picks", type=int, default=DISCOVERY_PICKS)
    parser.add_argument("--top", type=int, default=DEFAULT_PRELIMINARY_TOP)
    parser.add_argument("--seats", type=int, default=SEAT_COUNT)
    parser.add_argument("--buffer", type=int, default=3, help="换手缓冲：持仓名次容忍度")
    parser.add_argument("--max-per-sector", type=int, default=3)
    parser.add_argument("--max-stop-distance", type=float, default=12.0)
    parser.add_argument("--min-turnover", type=float, default=50_000_000.0)
    parser.add_argument("--max-age-days", type=int, default=4)
    parser.add_argument("--disagreement-limit", type=float, default=DEFAULT_TOTAL_DISAGREEMENT_LIMIT)
    parser.add_argument("--challenge-threshold", type=float, default=2.0)
    parser.add_argument("--posture", default="", help="个人风险姿态：全局敞口调节，不影响排序")
    parser.add_argument(
        "--sector-map",
        default=DEFAULT_SECTOR_MAP,
        help=f"{{ticker: 行业}} JSON（默认 {DEFAULT_SECTOR_MAP}）",
    )
    parser.add_argument("--timeout", type=int, default=900)
    parser.add_argument("--max-calls", type=int, default=MAX_CALLS_PER_MEMBER)
    parser.add_argument("--skip-review", action="store_true", help="跳过第三轮，直接用第二轮共识")
    parser.add_argument(
        "--block-engine-remove",
        action="store_true",
        help="硬资格阶段就剔除引擎判定 Remove 的标的（默认关闭：不在评分前给席位灌入引擎结论）",
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="DAILY_TOP10 two-seat daily committee.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    plan = subparsers.add_parser("plan", help="offline preflight: pool sizes and call budget, no seat calls")
    _add_common(plan)
    plan.set_defaults(handler=_plan)

    run = subparsers.add_parser("run", help="run the three rounds and write the daily sheet")
    _add_common(run)
    run.add_argument("--allow-stale", action="store_true")
    run.set_defaults(handler=_run)

    show = subparsers.add_parser("show", help="print the latest daily sheet")
    show.add_argument("--outputs-dir", default=DEFAULT_OUTPUTS_DIR)
    show.set_defaults(handler=_show)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        return int(args.handler(args))
    except SourceError as exc:
        raise SystemExit(str(exc)) from exc


if __name__ == "__main__":
    raise SystemExit(main())
