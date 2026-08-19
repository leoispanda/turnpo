#!/usr/bin/env python3
"""Refresh the free full-A-share ``{ticker: industry}`` map from Sina."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from stock_pdc.sustainable.daily.industry import (
    IndustrySourceError,
    fetch_sina_sw1,
    write_mapping,
)


DEFAULT_OUTPUT = "configs/a_share_industry_sina_sw1.json"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Fetch Sina Shenwan level-one industries for the full A-share universe."
    )
    parser.add_argument("--output", default=DEFAULT_OUTPUT)
    parser.add_argument("--page-size", type=int, default=100)
    parser.add_argument("--pause", type=float, default=0.08)
    parser.add_argument(
        "--min-coverage",
        type=float,
        default=100.0,
        help="refuse to replace the map below this percentage (default: 100.0)",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    output = Path(args.output)
    output = output if output.is_absolute() else PROJECT_ROOT / output
    mapping, report = fetch_sina_sw1(args.page_size, args.pause)
    print(
        f"新浪 {report['taxonomy']}：{report['industryCount']} 个行业，"
        f"覆盖 {report['mappedCount']}/{report['universeCount']} 支 "
        f"({report['coveragePct']}%)"
    )
    if report["coveragePct"] < args.min_coverage:
        sample = ", ".join(report["missingTickers"][:20])
        raise IndustrySourceError(
            f"覆盖率低于 {args.min_coverage}% ，拒绝覆盖旧文件。缺失示例：{sample}"
        )
    write_mapping(output, mapping)
    print(f"已写入 {output}")
    if report["missingCount"]:
        print(
            f"警告：仍有 {report['missingCount']} 支未被新浪申万一级节点分类；"
            "这些 ticker 不会被伪造行业。"
        )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except IndustrySourceError as exc:
        raise SystemExit(str(exc)) from exc
