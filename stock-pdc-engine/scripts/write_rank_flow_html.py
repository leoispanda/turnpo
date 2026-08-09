from __future__ import annotations

import argparse
import csv
import html
from collections import Counter
from pathlib import Path


CURRENT_TYPES = {"NEW", "UP", "DOWN", "UNCHANGED"}


def h(value: object) -> str:
    return html.escape("" if value is None else str(value), quote=True)


def as_int(value: str) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def movement_label(row: dict[str, str]) -> tuple[str, str, str]:
    change_type = row.get("change_type", "")
    current_rank = row.get("current_rank", "")
    previous_rank = row.get("previous_rank", "")
    delta = as_int(row.get("rank_delta", ""))

    if change_type == "UP":
        return "up", f"上升 {abs(delta or 0)}", f"昨日 #{previous_rank} -> 今日 #{current_rank}"
    if change_type == "DOWN":
        return "down", f"下降 {abs(delta or 0)}", f"昨日 #{previous_rank} -> 今日 #{current_rank}"
    if change_type == "UNCHANGED":
        return "flat", "持平", f"昨日 #{previous_rank} -> 今日 #{current_rank}"
    if change_type == "NEW":
        return "new", "新进榜", f"昨日未在 Top 20 -> 今日 #{current_rank}"
    if change_type == "DROPPED":
        return "dropped", "跌出榜", f"昨日 #{previous_rank} -> 今日未进 Top 20"
    return "flat", change_type or "未知", ""


def score_bar(label: str, value: str) -> str:
    try:
        score = max(0.0, min(10.0, float(value)))
    except (TypeError, ValueError):
        score = 0.0
    width = score * 10
    return (
        '<div class="score-chip">'
        f'<span>{h(label)}</span>'
        '<div class="score-track">'
        f'<i style="width: {width:.0f}%"></i>'
        "</div>"
        f"<b>{h(value)}</b>"
        "</div>"
    )


def current_row(row: dict[str, str]) -> str:
    tone, label, path = movement_label(row)
    current_rank = h(row.get("current_rank", ""))
    previous_rank = h(row.get("previous_rank") or "-")
    change_type = row.get("change_type", "")
    delta = row.get("rank_delta") or ""
    delta_text = "" if change_type in {"NEW", "UNCHANGED"} else f"{int(delta):+d}" if delta else ""
    score_parts = [
        score_bar("市场", row.get("market_regime_score", "")),
        score_bar("趋势", row.get("trend_score", "")),
        score_bar("突破", row.get("livermore_breakout_score", "")),
        score_bar("量价", row.get("volume_price_score", "")),
        score_bar("过热", row.get("overheat_score", "")),
        score_bar("风险", row.get("risk_score", "")),
    ]

    return f"""
      <article class="rank-row {tone}">
        <div class="rank-now">
          <span>今日</span>
          <strong>#{current_rank}</strong>
        </div>
        <div class="stock-main">
          <div class="stock-title">
            <h2>{h(row.get("name", ""))}</h2>
            <span>{h(row.get("ticker", ""))}</span>
          </div>
          <div class="stock-meta">
            <span>综合分 {h(row.get("current_score", ""))}</span>
            <span>{h(row.get("current_status", ""))}</span>
            <span>{h(row.get("front_desk_instruction", ""))}</span>
          </div>
          <div class="logic-strip">{"".join(score_parts)}</div>
          <p>{h(row.get("main_risk", ""))}</p>
        </div>
        <div class="rank-move">
          <span class="move-label">{h(label)}</span>
          <strong>{h(delta_text)}</strong>
          <small>{h(path)}</small>
        </div>
        <div class="rank-prev">
          <span>昨日</span>
          <strong>{previous_rank}</strong>
        </div>
      </article>
    """


def dropped_row(row: dict[str, str]) -> str:
    tone, label, path = movement_label(row)
    return f"""
      <tr class="{tone}">
        <td>#{h(row.get("previous_rank", ""))}</td>
        <td><strong>{h(row.get("name", ""))}</strong><span>{h(row.get("ticker", ""))}</span></td>
        <td>{h(row.get("previous_score", ""))}</td>
        <td>{h(row.get("previous_status", ""))}</td>
        <td>{h(label)}</td>
        <td>{h(path)}</td>
      </tr>
    """


def write_html(rows: list[dict[str, str]], output: Path) -> None:
    current_rows = sorted(
        [row for row in rows if row.get("change_type") in CURRENT_TYPES],
        key=lambda row: as_int(row.get("current_rank", "")) or 999,
    )
    dropped_rows = sorted(
        [row for row in rows if row.get("change_type") == "DROPPED"],
        key=lambda row: as_int(row.get("previous_rank", "")) or 999,
    )
    counter = Counter(row.get("change_type", "") for row in rows)
    run_date = rows[0].get("run_date", "") if rows else ""
    analysis_date = rows[0].get("analysis_date", "") if rows else ""

    body_rows = "\n".join(current_row(row) for row in current_rows)
    dropped_body = "\n".join(dropped_row(row) for row in dropped_rows)

    page = f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>股票大作手榜单升降图</title>
  <style>
    :root {{
      --bg: #f3f5f7;
      --paper: #ffffff;
      --text: #15191f;
      --muted: #68717d;
      --line: #dfe5eb;
      --up: #cf2f2f;
      --up-soft: #fff0f0;
      --down: #168244;
      --down-soft: #edf8f1;
      --flat: #1e2329;
      --new: #b7202e;
      --dropped: #1f7a46;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      color: var(--text);
      background: var(--bg);
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif;
      letter-spacing: 0;
    }}
    main {{
      max-width: 1180px;
      margin: 0 auto;
      padding: 28px 20px 48px;
    }}
    header {{
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 18px;
      margin-bottom: 18px;
    }}
    h1 {{
      margin: 0;
      font-size: 30px;
      line-height: 1.18;
      letter-spacing: 0;
    }}
    .sub {{
      margin: 8px 0 0;
      color: var(--muted);
      font-size: 14px;
    }}
    .datebox {{
      min-width: 190px;
      text-align: right;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.7;
    }}
    .summary {{
      display: grid;
      grid-template-columns: repeat(5, minmax(120px, 1fr));
      gap: 10px;
      margin: 18px 0;
    }}
    .summary div {{
      background: var(--paper);
      border: 1px solid var(--line);
      padding: 12px 14px;
      border-radius: 8px;
    }}
    .summary span {{
      display: block;
      color: var(--muted);
      font-size: 12px;
      margin-bottom: 4px;
    }}
    .summary strong {{
      font-size: 24px;
      line-height: 1;
    }}
    .summary .up strong, .rank-row.up .move-label, .rank-row.up .rank-move strong,
    .summary .new strong, .rank-row.new .move-label {{
      color: var(--up);
    }}
    .summary .down strong, .rank-row.down .move-label, .rank-row.down .rank-move strong,
    .summary .dropped strong, tr.dropped td:nth-child(5) {{
      color: var(--down);
    }}
    .summary .flat strong, .rank-row.flat .move-label {{
      color: var(--flat);
    }}
    .board {{
      display: grid;
      gap: 10px;
    }}
    .rank-row {{
      display: grid;
      grid-template-columns: 82px minmax(0, 1fr) 210px 82px;
      gap: 12px;
      align-items: stretch;
      background: var(--paper);
      border: 1px solid var(--line);
      border-left-width: 6px;
      border-radius: 8px;
      padding: 12px;
    }}
    .rank-row.up, .rank-row.new {{ border-left-color: var(--up); }}
    .rank-row.down {{ border-left-color: var(--down); }}
    .rank-row.flat {{ border-left-color: var(--flat); }}
    .rank-now, .rank-prev, .rank-move {{
      display: flex;
      flex-direction: column;
      justify-content: center;
      border-radius: 6px;
      padding: 10px;
      background: #f7f9fb;
      min-height: 96px;
    }}
    .rank-now span, .rank-prev span {{
      color: var(--muted);
      font-size: 12px;
      margin-bottom: 6px;
    }}
    .rank-now strong, .rank-prev strong {{
      font-size: 28px;
      line-height: 1;
    }}
    .rank-prev strong {{
      color: var(--muted);
    }}
    .rank-move {{
      align-items: flex-start;
      background: #fafafa;
    }}
    .rank-move .move-label {{
      font-size: 19px;
      font-weight: 750;
      margin-bottom: 4px;
    }}
    .rank-move strong {{
      font-size: 24px;
      line-height: 1;
      min-height: 26px;
    }}
    .rank-move small {{
      color: var(--muted);
      line-height: 1.35;
      margin-top: 8px;
    }}
    .stock-main {{
      min-width: 0;
      padding: 2px 2px 0;
    }}
    .stock-title {{
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin-bottom: 8px;
    }}
    .stock-title h2 {{
      margin: 0;
      font-size: 21px;
      letter-spacing: 0;
    }}
    .stock-title span {{
      color: var(--muted);
      font-size: 13px;
    }}
    .stock-meta {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 10px;
    }}
    .stock-meta span {{
      border: 1px solid var(--line);
      background: #fbfcfd;
      border-radius: 6px;
      padding: 5px 7px;
      font-size: 12px;
      color: #3c4651;
    }}
    .logic-strip {{
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 7px;
      margin-bottom: 8px;
    }}
    .score-chip {{
      display: grid;
      grid-template-columns: 34px minmax(42px, 1fr) 30px;
      align-items: center;
      gap: 6px;
      color: #4b5662;
      font-size: 12px;
      min-width: 0;
    }}
    .score-chip span, .score-chip b {{
      white-space: nowrap;
    }}
    .score-chip b {{
      color: #252c34;
      font-weight: 650;
      text-align: right;
    }}
    .score-track {{
      height: 6px;
      border-radius: 999px;
      background: #e8edf2;
      overflow: hidden;
    }}
    .score-track i {{
      display: block;
      height: 100%;
      background: #323b45;
      border-radius: inherit;
    }}
    .rank-row.up .score-track i, .rank-row.new .score-track i {{ background: var(--up); }}
    .rank-row.down .score-track i {{ background: var(--down); }}
    .stock-main p {{
      margin: 0;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.45;
    }}
    section {{
      margin-top: 26px;
    }}
    section h2 {{
      margin: 0 0 10px;
      font-size: 20px;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: 8px;
      overflow: hidden;
      font-size: 13px;
    }}
    th, td {{
      padding: 11px 12px;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
    }}
    th {{
      background: #edf1f5;
      color: #303842;
      font-weight: 700;
    }}
    td strong {{
      display: block;
      margin-bottom: 3px;
    }}
    td span {{
      color: var(--muted);
      font-size: 12px;
    }}
    @media (max-width: 820px) {{
      main {{ padding: 20px 12px 34px; }}
      header {{ display: block; }}
      .datebox {{ text-align: left; margin-top: 10px; }}
      .summary {{ grid-template-columns: repeat(2, minmax(0, 1fr)); }}
      .rank-row {{
        grid-template-columns: 68px minmax(0, 1fr);
      }}
      .rank-move, .rank-prev {{
        min-height: 70px;
      }}
      .logic-strip {{
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }}
    }}
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>股票大作手榜单升降图</h1>
        <p class="sub">按今日 PDC 综合排名展示：今日名次、昨日名次、升降方向与核心评分。</p>
      </div>
      <div class="datebox">
        <div>运行日期：{h(run_date)}</div>
        <div>分析日期：{h(analysis_date)}</div>
      </div>
    </header>

    <div class="summary">
      <div class="up"><span>上升</span><strong>{counter.get("UP", 0)}</strong></div>
      <div class="down"><span>下降</span><strong>{counter.get("DOWN", 0)}</strong></div>
      <div class="flat"><span>持平</span><strong>{counter.get("UNCHANGED", 0)}</strong></div>
      <div class="new"><span>新进 Top 20</span><strong>{counter.get("NEW", 0)}</strong></div>
      <div class="dropped"><span>跌出 Top 20</span><strong>{counter.get("DROPPED", 0)}</strong></div>
    </div>

    <div class="board">
{body_rows}
    </div>

    <section>
      <h2>跌出 Top 20</h2>
      <table>
        <thead>
          <tr>
            <th>昨日排名</th>
            <th>股票</th>
            <th>昨日分数</th>
            <th>昨日状态</th>
            <th>变化</th>
            <th>路径</th>
          </tr>
        </thead>
        <tbody>
{dropped_body}
        </tbody>
      </table>
    </section>
  </main>
</body>
</html>
"""
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(page, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Write a music-chart-style stock rank flow HTML report.")
    parser.add_argument("changes_csv", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    with args.changes_csv.open(newline="", encoding="utf-8") as file:
        rows = list(csv.DictReader(file))

    run_date = rows[0].get("run_date", "latest") if rows else "latest"
    output = args.output or Path("outputs") / f"stock_rank_flow_{run_date}.html"
    write_html(rows, output)
    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
