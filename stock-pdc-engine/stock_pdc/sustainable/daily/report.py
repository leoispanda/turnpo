"""The one artifact a day: ten seats as CSV and as a page.

The daily run produces many audit files, but exactly one thing is meant to be
read: `daily_top10.csv` and its HTML twin. The column list is fixed, and every
column is either a fact from the run or a value the deterministic gate computed
— nothing here re-decides anything.

`previous_rank` and `rank_change` come from the history file, from the most
recent *earlier* trade date, so re-running the same day does not make a name
look like it moved.
"""

from __future__ import annotations

import csv
from pathlib import Path
from typing import Any
from xml.sax.saxutils import escape


DAILY_TOP10_HEADERS: tuple[str, ...] = (
    "rank",
    "ticker",
    "name",
    "action",
    "allocation_pct",
    "main_reason",
    "main_risk",
    "technical_stop_reference",
    "previous_rank",
    "rank_change",
    "as_of_trade_date",
    "data_freshness_status",
    "runtime_mode",
)

HISTORY_HEADERS: tuple[str, ...] = ("run_date", *DAILY_TOP10_HEADERS)

CASH = "CASH"


def load_previous(
    history_path: Path,
    latest_path: Path,
    as_of: str,
) -> tuple[dict[str, int], str]:
    """Yesterday's seats: ``({ticker: rank}, that_trade_date)``.

    Rows for the current trade date are skipped on purpose. A second run of the
    same session is a correction, not a new day, and treating it as one would
    report every name as unchanged and hide real movement.
    """
    rows: list[dict[str, str]] = []
    if history_path.is_file():
        with history_path.open("r", encoding="utf-8-sig", newline="") as handle:
            rows = list(csv.DictReader(handle))
    elif latest_path.is_file():
        with latest_path.open("r", encoding="utf-8-sig", newline="") as handle:
            rows = list(csv.DictReader(handle))

    earlier = [
        row
        for row in rows
        if str(row.get("as_of_trade_date") or "") and str(row.get("as_of_trade_date")) < as_of
    ]
    if not earlier:
        return {}, ""
    previous_date = max(str(row["as_of_trade_date"]) for row in earlier)
    seats: dict[str, int] = {}
    for row in earlier:
        if str(row.get("as_of_trade_date")) != previous_date:
            continue
        ticker = str(row.get("ticker") or "").strip().upper()
        if not ticker or ticker == CASH:
            continue
        try:
            seats[ticker] = int(row["rank"])
        except (KeyError, TypeError, ValueError):
            continue
    return seats, previous_date


def build_rows(
    seats: list[dict[str, Any]],
    context: dict[str, Any],
    names: dict[str, str],
    stops: dict[str, Any],
    reasons: dict[str, str],
    risks: dict[str, str],
    previous: dict[str, int],
) -> list[dict[str, Any]]:
    """Turn selected seats into the exact daily rows, one per seat."""
    rows: list[dict[str, Any]] = []
    for seat in seats:
        ticker = seat["ticker"]
        is_cash = seat["action"] == CASH
        previous_rank = previous.get(ticker)
        if is_cash:
            change = ""
        elif previous_rank is None:
            change = "NEW"
        else:
            change = f"{previous_rank - seat['rank']:+d}"
        stop = stops.get(ticker)
        rows.append({
            "rank": seat["rank"],
            "ticker": ticker,
            "name": "" if is_cash else names.get(ticker, ""),
            "action": seat["action"],
            "allocation_pct": seat.get("allocation_pct", ""),
            "main_reason": "" if is_cash else reasons.get(ticker, ""),
            "main_risk": "" if is_cash else risks.get(ticker, ""),
            "technical_stop_reference": "" if is_cash or stop is None else stop,
            "previous_rank": "" if previous_rank is None else previous_rank,
            "rank_change": change,
            "as_of_trade_date": context["asOfTradeDate"],
            "data_freshness_status": context["dataFreshnessStatus"],
            "runtime_mode": context["runtimeMode"],
        })
    return rows


def write_csv(path: Path, rows: list[dict[str, Any]]) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(DAILY_TOP10_HEADERS))
        writer.writeheader()
        for row in rows:
            writer.writerow({name: row.get(name, "") for name in DAILY_TOP10_HEADERS})
    return path


def append_history(path: Path, rows: list[dict[str, Any]], run_date: str) -> Path:
    """Append this run to the history, replacing any earlier run of the same day."""
    path.parent.mkdir(parents=True, exist_ok=True)
    existing: list[dict[str, str]] = []
    if path.is_file():
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            existing = [
                row
                for row in csv.DictReader(handle)
                if str(row.get("as_of_trade_date") or "") != str(rows[0]["as_of_trade_date"])
            ]
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(HISTORY_HEADERS))
        writer.writeheader()
        for row in existing:
            writer.writerow({name: row.get(name, "") for name in HISTORY_HEADERS})
        for row in rows:
            writer.writerow(
                {"run_date": run_date, **{name: row.get(name, "") for name in DAILY_TOP10_HEADERS}}
            )
    return path


def _cell(value: Any) -> str:
    return escape("" if value is None else str(value))


def write_html(
    path: Path,
    rows: list[dict[str, Any]],
    context: dict[str, Any],
    audit: dict[str, Any],
) -> Path:
    """The same ten seats, plus the audit a human needs to trust them."""
    path.parent.mkdir(parents=True, exist_ok=True)

    table_rows = "".join(
        "<tr class=\"action-{action}\">"
        "<td>{rank}</td><td>{ticker}</td><td>{name}</td>"
        "<td><span class=\"tag tag-{action_lower}\">{action}</span></td>"
        "<td>{allocation}</td><td>{reason}</td><td>{risk}</td>"
        "<td>{stop}</td><td>{previous}</td><td>{change}</td>"
        "</tr>".format(
            action=_cell(row["action"]),
            action_lower=_cell(str(row["action"]).lower()),
            rank=_cell(row["rank"]),
            ticker=_cell(row["ticker"]),
            name=_cell(row["name"]),
            allocation=_cell(row["allocation_pct"]),
            reason=_cell(row["main_reason"]),
            risk=_cell(row["main_risk"]),
            stop=_cell(row["technical_stop_reference"]),
            previous=_cell(row["previous_rank"]),
            change=_cell(row["rank_change"]),
        )
        for row in rows
    )

    quota_rows = "".join(
        f"<tr><td>{_cell(member)}</td><td>{_cell(stats['calls'])}</td>"
        f"<td>{_cell(stats['remaining'])}</td><td>{_cell(stats['promptChars'])}</td>"
        f"<td>{_cell(stats['outputChars'])}</td><td>{_cell(stats['seconds'])}</td></tr>"
        for member, stats in sorted((audit.get("quota", {}).get("byMember") or {}).items())
    )

    def bullet_list(items: list[str]) -> str:
        if not items:
            return "<p class=\"muted\">无</p>"
        return "<ul>" + "".join(f"<li>{_cell(item)}</li>" for item in items) + "</ul>"

    unresolved = bullet_list(audit.get("unresolvedTickers") or [])
    dropped = bullet_list(
        [f"{item['ticker']} — {item['reason']}" for item in audit.get("droppedHoldings") or []]
    )
    blocked_counts = audit.get("blockedReasonCounts") or {}
    blocked = bullet_list([f"{code}: {count}" for code, count in sorted(blocked_counts.items())])
    degradation = bullet_list(audit.get("degradation") or [])

    html = f"""<!doctype html>
<html lang="zh">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DAILY_TOP10 · {_cell(context['asOfTradeDate'])}</title>
  <style>
    body {{ margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif; color: #18212a; background: #f5f7f9; }}
    main {{ max-width: 1180px; margin: 0 auto; padding: 24px 20px 64px; }}
    h1 {{ font-size: 22px; margin: 0 0 4px; }}
    h2 {{ font-size: 15px; margin: 28px 0 8px; }}
    .meta, .muted {{ color: #5b6b7c; font-size: 13px; }}
    .cards {{ display: flex; flex-wrap: wrap; gap: 12px; margin: 16px 0 8px; }}
    .card {{ background: #fff; border: 1px solid #e2e8ee; border-radius: 8px; padding: 10px 14px; min-width: 150px; }}
    .card .label {{ font-size: 12px; color: #5b6b7c; }}
    .card .value {{ font-size: 18px; font-weight: 600; }}
    table {{ width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e8ee; border-radius: 8px; overflow: hidden; font-size: 13px; }}
    th, td {{ text-align: left; padding: 8px 10px; border-bottom: 1px solid #eef2f6; vertical-align: top; }}
    th {{ background: #f0f4f8; font-weight: 600; }}
    tr:last-child td {{ border-bottom: none; }}
    .tag {{ display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; }}
    .tag-buy {{ background: #e6f4ea; color: #14733c; }}
    .tag-hold {{ background: #e8f0fe; color: #1a4d8f; }}
    .tag-pause {{ background: #fdf1dc; color: #8a5a00; }}
    .tag-cash {{ background: #eceff2; color: #5b6b7c; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }}
    .panel {{ background: #fff; border: 1px solid #e2e8ee; border-radius: 8px; padding: 12px 16px; }}
    ul {{ margin: 6px 0 0; padding-left: 18px; font-size: 13px; }}
    footer {{ margin-top: 28px; font-size: 12px; color: #5b6b7c; }}
  </style>
</head>
<body>
<main>
  <h1>DAILY_TOP10 · {_cell(context['asOfTradeDate'])}</h1>
  <p class="meta">运行模式 {_cell(context['runtimeMode'])} · 数据新鲜度 {_cell(context['dataFreshnessStatus'])} · 降级状态 {_cell(context.get('degradationStatus', 'NONE'))} · 研究用途，非交易指令</p>

  <div class="cards">
    <div class="card"><div class="label">席位</div><div class="value">{_cell(context.get('seatCount', 10))}</div></div>
    <div class="card"><div class="label">CASH 席位</div><div class="value">{_cell(context.get('cashSeats', 0))}</div></div>
    <div class="card"><div class="label">投资比例</div><div class="value">{_cell(context.get('investedPct', ''))}%</div></div>
    <div class="card"><div class="label">现金储备</div><div class="value">{_cell(context.get('cashReservePct', ''))}%</div></div>
    <div class="card"><div class="label">敞口系数</div><div class="value">{_cell(context.get('exposureFactor', ''))}</div></div>
    <div class="card"><div class="label">候选池</div><div class="value">{_cell(context.get('eligibleCount', ''))}</div></div>
  </div>

  <table>
    <thead><tr>
      <th>#</th><th>代码</th><th>名称</th><th>动作</th><th>仓位%</th>
      <th>主要理由</th><th>主要风险</th><th>止损参考</th><th>昨日名次</th><th>变化</th>
    </tr></thead>
    <tbody>{table_rows}</tbody>
  </table>

  <h2>额度使用</h2>
  <table>
    <thead><tr><th>席位</th><th>调用</th><th>剩余</th><th>输入字符</th><th>输出字符</th><th>耗时(秒)</th></tr></thead>
    <tbody>{quota_rows}</tbody>
  </table>

  <h2>审计</h2>
  <div class="grid">
    <div class="panel"><strong>未解决分歧（不可买入）</strong>{unresolved}</div>
    <div class="panel"><strong>失去席位的持仓</strong>{dropped}</div>
    <div class="panel"><strong>硬资格拦截统计</strong>{blocked}</div>
    <div class="panel"><strong>降级说明</strong>{degradation}</div>
  </div>

  <footer>
    snapshot {_cell(context.get('snapshotId', ''))} · facts_hash {_cell(str(context.get('factsHash', ''))[:16])} ·
    生成于 {_cell(context.get('generatedAt', ''))} · 研究标签，不构成投资建议，系统不连接券商、不下单。
  </footer>
</main>
</body>
</html>
"""
    path.write_text(html, encoding="utf-8")
    return path
