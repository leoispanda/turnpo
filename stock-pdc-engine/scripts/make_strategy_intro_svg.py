#!/usr/bin/env python3
"""Build a public-facing strategy parameter poster from the rank combo summary."""

from __future__ import annotations

import argparse
import csv
import html
from pathlib import Path


DEFAULT_INPUT = Path(
    "outputs/rank_combo_backtests/2023-01-01_to_2026-06-26/"
    "strategy_1_30_by_sharpe.csv"
)
DEFAULT_OUTPUT = Path(
    "outputs/rank_combo_backtests/2023-01-01_to_2026-06-26/"
    "strategy_1_30_intro_public.svg"
)


COPY = {
    "zh": {
        "brand": "股票大作手",
        "title": "30个策略参数看板",
        "subtitle": "只公开调参维度，不公开底层组合、股票池与选股规则",
        "chips": ["总收益", "年化收益", "年化波动", "夏普比率", "最大回撤", "胜率", "调仓稳定性"],
        "header_left": "公开展示：策略代号 + 风险收益参数",
        "header_right": "回测区间 2023-01-03 至 2026-06-26",
        "strategy": "策略{index}",
        "card_note": "参数版",
        "metrics": [
            ("total", "总收益", "total_return_pct", "pct"),
            ("annual", "年化", "annualized_return_pct", "pct"),
            ("vol", "波动", "annualized_volatility_pct", "pct"),
            ("sharpe", "夏普", "sharpe_ratio", "sharpe"),
            ("drawdown", "回撤", "max_drawdown_pct", "pct"),
            ("win", "胜率", "win_day_pct", "pct"),
        ],
        "footer_label": "Fine tune 逻辑",
        "footer_main": "不是只看收益，而是同时压住波动、回撤和胜率；策略细节保留，只展示可验证参数。",
        "footer_sub": "仅供研究交流 | 不展示股票代码、rank组合、持仓明细或模型权重",
    },
    "en": {
        "brand": "Stock PDC",
        "title": "30 Strategy Parameter Board",
        "subtitle": "Parameter dimensions are public; combinations, universe, and selection rules stay private",
        "chips": ["Total Return", "Ann. Return", "Ann. Vol", "Sharpe", "Max DD", "Win Rate", "Rebalance"],
        "header_left": "Public view: strategy codes + risk/return metrics",
        "header_right": "Backtest window: 2023-01-03 to 2026-06-26",
        "strategy": "Strategy {index}",
        "card_note": "Param View",
        "metrics": [
            ("total", "Total", "total_return_pct", "pct"),
            ("annual", "Ann. Ret", "annualized_return_pct", "pct"),
            ("vol", "Ann. Vol", "annualized_volatility_pct", "pct"),
            ("sharpe", "Sharpe", "sharpe_ratio", "sharpe"),
            ("drawdown", "Max DD", "max_drawdown_pct", "pct"),
            ("win", "Win Rate", "win_day_pct", "pct"),
        ],
        "footer_label": "Fine-tuning logic",
        "footer_main": "Not just chasing return: I tune for return quality by balancing volatility, drawdown, and win rate.",
        "footer_sub": "Research only | No stock codes, rank combinations, holdings, or model weights disclosed",
    },
}


def pct(value: str) -> str:
    return f"{float(value):.1f}%"


def sharpe(value: str) -> str:
    return f"{float(value):.2f}"


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def metric_text(row: dict[str, str], language: str) -> list[tuple[str, str, str]]:
    metrics = []
    for key, label, field, formatter in COPY[language]["metrics"]:
        value = pct(row[field]) if formatter == "pct" else sharpe(row[field])
        metrics.append((key, label, value))
    return metrics


def card_color(index: int) -> tuple[str, str]:
    if index <= 5:
        return "#f6c453", "#2c2515"
    if index <= 15:
        return "#42d7c8", "#102a2c"
    return "#9db4ff", "#151d35"


def svg_text(x: float, y: float, text: str, size: int, fill: str, weight: int = 500,
             anchor: str = "start", opacity: float = 1.0) -> str:
    return (
        f'<text x="{x:.1f}" y="{y:.1f}" fill="{fill}" font-size="{size}" '
        f'font-weight="{weight}" text-anchor="{anchor}" opacity="{opacity:.3f}">'
        f"{esc(text)}</text>"
    )


def chip_width(chip: str, language: str) -> int:
    return 28 + len(chip) * (25 if language == "zh" else 13)


def build_svg(rows: list[dict[str, str]], language: str) -> str:
    copy = COPY[language]
    width = 1800
    height = 2600
    margin = 84
    gap = 42
    col_w = (width - margin * 2 - gap) / 2
    card_h = 108
    row_gap = 16
    top_y = 430

    parts: list[str] = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
            f'viewBox="0 0 {width} {height}">'
        ),
        "<defs>",
        (
            '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">'
            '<stop offset="0%" stop-color="#080b10"/>'
            '<stop offset="46%" stop-color="#101720"/>'
            '<stop offset="100%" stop-color="#0b1118"/>'
            "</linearGradient>"
        ),
        (
            '<radialGradient id="glow" cx="50%" cy="15%" r="65%">'
            '<stop offset="0%" stop-color="#173a42" stop-opacity="0.9"/>'
            '<stop offset="70%" stop-color="#173a42" stop-opacity="0.08"/>'
            '<stop offset="100%" stop-color="#173a42" stop-opacity="0"/>'
            "</radialGradient>"
        ),
        (
            '<filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">'
            '<feDropShadow dx="0" dy="14" stdDeviation="20" flood-color="#000000" flood-opacity="0.35"/>'
            "</filter>"
        ),
        (
            "<style>"
            "text{font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',"
            "'Noto Sans CJK SC','Helvetica Neue',Arial,sans-serif;letter-spacing:0}"
            "</style>"
        ),
        "</defs>",
        f'<rect width="{width}" height="{height}" fill="url(#bg)"/>',
        f'<rect width="{width}" height="{height}" fill="url(#glow)"/>',
        f'<path d="M80 345 C390 250 665 440 950 315 S1370 270 {width - 80} 365" '
        'fill="none" stroke="#274b55" stroke-width="3" opacity="0.55"/>',
        f'<path d="M85 2210 C350 2090 650 2260 930 2140 S1390 2065 {width - 80} 2215" '
        'fill="none" stroke="#21434d" stroke-width="3" opacity="0.38"/>',
    ]

    parts.extend(
        [
            svg_text(margin, 132, copy["brand"], 48, "#9fe7df", 700),
            svg_text(margin, 214, copy["title"], 74 if language == "en" else 84, "#f4f7fb", 760),
            svg_text(
                margin,
                274,
                copy["subtitle"],
                31,
                "#aab7c4",
                520,
            ),
        ]
    )

    chip_y = 332
    x = margin
    for chip in copy["chips"]:
        chip_w = chip_width(chip, language)
        parts.append(
            f'<rect x="{x}" y="{chip_y}" width="{chip_w}" height="44" rx="22" '
            'fill="#121d27" stroke="#273849" stroke-width="1"/>'
        )
        parts.append(svg_text(x + chip_w / 2, chip_y + 30, chip, 22, "#d2dde8", 560, "middle"))
        x += chip_w + 13

    header_y = 408
    parts.append(svg_text(margin, header_y, copy["header_left"], 24, "#718294", 520))
    parts.append(svg_text(width - margin, header_y, copy["header_right"], 24, "#718294", 520, "end"))

    for idx, row in enumerate(rows, start=1):
        col = 0 if idx <= 15 else 1
        inner_idx = idx if idx <= 15 else idx - 15
        card_x = margin + col * (col_w + gap)
        card_y = top_y + (inner_idx - 1) * (card_h + row_gap)
        accent, accent_bg = card_color(idx)

        parts.append(
            f'<rect x="{card_x:.1f}" y="{card_y:.1f}" width="{col_w:.1f}" height="{card_h}" '
            'rx="18" fill="#111923" stroke="#263545" stroke-width="1.2" filter="url(#softShadow)"/>'
        )
        parts.append(
            f'<rect x="{card_x:.1f}" y="{card_y:.1f}" width="128" height="{card_h}" '
            f'rx="18" fill="{accent_bg}" opacity="0.95"/>'
        )
        parts.append(
            f'<rect x="{card_x + 126:.1f}" y="{card_y + 14:.1f}" width="2" height="{card_h - 28}" '
            f'fill="{accent}" opacity="0.75"/>'
        )

        strategy_label = copy["strategy"].format(index=idx)
        parts.append(svg_text(card_x + 64, card_y + 65, strategy_label, 24 if language == "en" else 29, accent, 780, "middle"))
        parts.append(svg_text(card_x + 64, card_y + 91, copy["card_note"], 15 if language == "en" else 17, "#8fa0b0", 520, "middle"))

        metrics = metric_text(row, language)
        metric_x = card_x + 158
        label_y = card_y + 42
        value_y = card_y + 78
        metric_gap = (col_w - 186) / 6
        for j, (key, label, value) in enumerate(metrics):
            x0 = metric_x + j * metric_gap
            parts.append(svg_text(x0, label_y, label, 17, "#728397", 520))
            value_fill = "#f2f6fb"
            if key == "sharpe":
                value_fill = accent
            elif key == "drawdown":
                value_fill = "#ff9a8e"
            parts.append(svg_text(x0, value_y, value, 23, value_fill, 720))

    foot_y = 2470
    parts.append(
        f'<rect x="{margin}" y="{foot_y - 58}" width="{width - margin * 2}" height="98" '
        'rx="22" fill="#0f1721" stroke="#273849" stroke-width="1.2"/>'
    )
    footer_label_x = margin + 30
    footer_main_x = margin + (210 if language == "zh" else 300)
    parts.append(svg_text(footer_label_x, foot_y - 20, copy["footer_label"], 25, "#9fe7df", 760))
    parts.append(
        svg_text(
            footer_main_x,
            foot_y - 20,
            copy["footer_main"],
            25,
            "#d9e3ec",
            560,
        )
    )
    parts.append(
        svg_text(
            margin + 30,
            foot_y + 20,
            copy["footer_sub"],
            22,
            "#718294",
            500,
        )
    )

    parts.append("</svg>")
    return "\n".join(parts)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--language", choices=sorted(COPY), default="zh")
    args = parser.parse_args()

    with args.input.open(newline="") as f:
        rows = list(csv.DictReader(f))

    rows = rows[:30]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(build_svg(rows, args.language), encoding="utf-8")
    print(args.output)


if __name__ == "__main__":
    main()
