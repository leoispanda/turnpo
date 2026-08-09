from __future__ import annotations

import csv
from pathlib import Path
from xml.sax.saxutils import escape
from zipfile import ZIP_DEFLATED, ZipFile

REPORT_HEADERS = [
    "ticker",
    "rank",
    "final_score",
    "final_status",
    "market_regime_score",
    "trend_score",
    "livermore_breakout_score",
    "volume_price_score",
    "candlestick_score",
    "overheat_score",
    "risk_score",
    "zhuge_orion_score",
    "final_chair_score",
    "main_reason",
    "main_risk",
    "suggested_action_status",
    "analysis_date",
]

PDC_MEMBER_SCORE_HEADERS = [
    "market_regime_score",
    "trend_score",
    "livermore_breakout_score",
    "volume_price_score",
    "candlestick_score",
    "overheat_score",
    "risk_score",
    "zhuge_orion_score",
    "final_chair_score",
]

FULL_SCORE_HEADERS = [
    *REPORT_HEADERS,
    "market_regime_reason",
    "market_regime_warning",
    "market_regime_signal",
    "trend_reason",
    "trend_warning",
    "trend_signal",
    "livermore_breakout_reason",
    "livermore_breakout_warning",
    "livermore_breakout_signal",
    "volume_price_reason",
    "volume_price_warning",
    "volume_price_signal",
    "candlestick_reason",
    "candlestick_warning",
    "candlestick_signal",
    "overheat_reason",
    "overheat_warning",
    "overheat_signal",
    "risk_reason",
    "risk_warning",
    "risk_signal",
    "zhuge_orion_reason",
    "zhuge_orion_warning",
    "zhuge_orion_signal",
    "final_chair_reason",
    "final_chair_warning",
    "final_chair_signal",
]

HISTORY_HEADERS = ["run_date", *REPORT_HEADERS]

DAILY_WATCHLIST_HEADERS = [*REPORT_HEADERS, "front_desk_instruction"]
WATCHLIST_HISTORY_HEADERS = ["run_date", *DAILY_WATCHLIST_HEADERS]

LEADERBOARD_CHANGE_HEADERS = [
    "run_date",
    "analysis_date",
    "change_type",
    "ticker",
    "name",
    "current_rank",
    "previous_rank",
    "rank_delta",
    "current_score",
    "previous_score",
    "current_status",
    "previous_status",
    *PDC_MEMBER_SCORE_HEADERS,
    "front_desk_instruction",
    "main_risk",
]

DAILY_INSTRUCTION_HEADERS = [
    "run_date",
    "analysis_date",
    "recommendation_rank",
    "instruction",
    "ticker",
    "rank",
    "final_score",
    "final_status",
    *PDC_MEMBER_SCORE_HEADERS,
    "latest_date",
    "latest_close",
    "current_price",
    "current_pct_change",
    "current_price_change",
    "current_open",
    "current_high",
    "current_low",
    "previous_close",
    "quote_source",
    "quote_asof",
    "quote_status",
    "breakout_trigger",
    "technical_stop",
    "market_context",
    "monitor_status",
    "trigger",
    "main_risk",
]

CANDIDATE_UNIVERSE_HEADERS = [
    "ticker",
    "status",
    "passed",
    "name",
    "total_mcap",
    "return_60d",
    "latest_daily_return",
    "max_single_day_gain",
    "max_single_day_loss",
    "latest_close",
    "sma20",
    "sma50",
    "sma200",
    "reason",
    "rejection_reason",
]

POSITION_HEADERS = [
    "position_id",
    "created_at",
    "status",
    "ticker",
    "planned_action",
    "planned_trade_date",
    "planned_session",
    "source_analysis_date",
    "recommendation_rank",
    "pdc_rank_at_plan",
    "pdc_instruction_at_plan",
    "pdc_status_at_plan",
    "final_score_at_plan",
    "reference_price",
    "reference_price_source",
    "reference_price_asof",
    "breakout_trigger_at_plan",
    "technical_stop_at_plan",
    "user_plan_note",
    "entry_date",
    "entry_price",
    "shares",
    "exit_date",
    "exit_price",
    "exit_reason",
    "last_monitor_date",
    "last_sell_instruction",
    "last_monitor_price",
]

POSITION_MONITOR_HEADERS = [
    "analysis_date",
    "position_id",
    "ticker",
    "position_status",
    "planned_trade_date",
    "entry_date",
    "entry_price",
    "shares",
    "current_price",
    "current_pct_change",
    "quote_source",
    "quote_asof",
    "quote_status",
    "final_score",
    "pdc_rank",
    "top20_status",
    "buy_target_status",
    "final_status",
    "trend_score",
    "risk_score",
    "overheat_score",
    "pdc_instruction",
    "sell_instruction",
    "sell_trigger",
    "current_technical_stop",
    "plan_technical_stop",
    "main_risk",
    "latest_date",
    "latest_close",
]


def _column_letter(index: int) -> str:
    letters = ""
    while index:
        index, remainder = divmod(index - 1, 26)
        letters = chr(65 + remainder) + letters
    return letters


def _cell_xml(row_index: int, column_index: int, value: object) -> str:
    cell_ref = f"{_column_letter(column_index)}{row_index}"
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return f'<c r="{cell_ref}"><v>{value}</v></c>'
    text = escape("" if value is None else str(value))
    return f'<c r="{cell_ref}" t="inlineStr"><is><t>{text}</t></is></c>'


def _worksheet_xml(headers: list[str], rows: list[dict[str, object]]) -> str:
    table = [headers]
    table.extend([[row.get(header, "") for header in headers] for row in rows])
    last_cell = f"{_column_letter(len(headers))}{len(table)}"

    row_xml: list[str] = []
    for row_index, values in enumerate(table, start=1):
        cells = "".join(_cell_xml(row_index, column_index, value) for column_index, value in enumerate(values, start=1))
        row_xml.append(f'<row r="{row_index}">{cells}</row>')

    widths = {
        "A": 8,
        "B": 12,
        "C": 12,
        "D": 20,
        "M": 72,
        "N": 48,
        "O": 24,
    }
    cols = "".join(
        f'<col min="{index}" max="{index}" width="{width}" customWidth="1"/>'
        for index, width in ((_letter_to_index(letter), width) for letter, width in widths.items())
    )

    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="A1:{last_cell}"/>
  <sheetViews>
    <sheetView workbookViewId="0">
      <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>{cols}</cols>
  <sheetData>{''.join(row_xml)}</sheetData>
</worksheet>'''


def _letter_to_index(letter: str) -> int:
    index = 0
    for char in letter:
        index = index * 26 + (ord(char.upper()) - 64)
    return index


def write_xlsx(path: Path, rows: list[dict[str, object]], headers: list[str] | None = None) -> None:
    headers = headers or REPORT_HEADERS
    path.parent.mkdir(parents=True, exist_ok=True)
    worksheet = _worksheet_xml(headers, rows)

    files = {
        "[Content_Types].xml": '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>''',
        "_rels/.rels": '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>''',
        "xl/workbook.xml": '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Top 20" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>''',
        "xl/_rels/workbook.xml.rels": '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>''',
        "xl/styles.xml": '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>''',
        "xl/worksheets/sheet1.xml": worksheet,
    }

    with ZipFile(path, "w", ZIP_DEFLATED) as archive:
        for archive_path, content in files.items():
            archive.writestr(archive_path, content)


def write_csv(path: Path, rows: list[dict[str, object]], headers: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)


def append_history_csv(path: Path, rows: list[dict[str, object]], run_date: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and path.stat().st_size > 0:
        with path.open("r", encoding="utf-8", newline="") as existing_file:
            reader = csv.DictReader(existing_file)
            existing_headers = reader.fieldnames or []
            if existing_headers != HISTORY_HEADERS:
                existing_rows = list(reader)
        if "existing_rows" in locals():
            with path.open("w", encoding="utf-8", newline="") as migrated_file:
                writer = csv.DictWriter(migrated_file, fieldnames=HISTORY_HEADERS, extrasaction="ignore")
                writer.writeheader()
                for existing_row in existing_rows:
                    writer.writerow(existing_row)
    file_exists = path.exists() and path.stat().st_size > 0
    with path.open("a", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=HISTORY_HEADERS, extrasaction="ignore")
        if not file_exists:
            writer.writeheader()
        for row in rows:
            writer.writerow({"run_date": run_date, **row})


def append_csv_rows(path: Path, rows: list[dict[str, object]], headers: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    file_exists = path.exists() and path.stat().st_size > 0
    with path.open("a", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=headers, extrasaction="ignore")
        if not file_exists:
            writer.writeheader()
        writer.writerows(rows)


def replace_daily_csv_rows(
    path: Path,
    rows: list[dict[str, object]],
    headers: list[str],
    run_date: str,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    existing_rows: list[dict[str, object]] = []
    if path.exists() and path.stat().st_size > 0:
        with path.open("r", encoding="utf-8", newline="") as file:
            reader = csv.DictReader(file)
            existing_rows = [
                row for row in reader
                if (row.get("run_date") or row.get("analysis_date")) != run_date
            ]

    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=headers, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(existing_rows)
        writer.writerows(rows)


def load_previous_daily_rows(path: Path, run_date: str) -> tuple[str, list[dict[str, object]]]:
    if not path.exists() or path.stat().st_size == 0:
        return "", []

    with path.open("r", encoding="utf-8", newline="") as file:
        rows = [
            row for row in csv.DictReader(file)
            if row.get("run_date") and row.get("run_date") != run_date
        ]

    if not rows:
        return "", []

    previous_run_date = max(str(row.get("run_date", "")) for row in rows)
    return previous_run_date, [row for row in rows if row.get("run_date") == previous_run_date]


def _int_or_blank(value: object) -> int | str:
    if value in (None, ""):
        return ""
    try:
        return int(str(value))
    except ValueError:
        return ""


def _float_or_blank(value: object) -> float | str:
    if value in (None, ""):
        return ""
    try:
        return float(str(value))
    except ValueError:
        return ""


def _member_score_fields(row: dict[str, object]) -> dict[str, object]:
    return {header: row.get(header, "") for header in PDC_MEMBER_SCORE_HEADERS}


def build_leaderboard_change_rows(
    current_rows: list[dict[str, object]],
    previous_rows: list[dict[str, object]],
    run_date: str,
    ticker_names: dict[str, str] | None = None,
) -> list[dict[str, object]]:
    names = ticker_names or {}
    current_by_ticker = {str(row.get("ticker", "")): row for row in current_rows if row.get("ticker")}
    previous_by_ticker = {str(row.get("ticker", "")): row for row in previous_rows if row.get("ticker")}
    rows: list[dict[str, object]] = []

    def name_for(ticker: str) -> str:
        return names.get(ticker, "")

    for current_row in current_rows:
        ticker = str(current_row.get("ticker", ""))
        previous_row = previous_by_ticker.get(ticker)
        current_rank = _int_or_blank(current_row.get("rank"))
        current_score = _float_or_blank(current_row.get("final_score"))
        if previous_row is None:
            change_type = "NEW" if previous_rows else "INITIAL"
            previous_rank: int | str = ""
            previous_score: float | str = ""
            previous_status = ""
            rank_delta: int | str = ""
        else:
            previous_rank = _int_or_blank(previous_row.get("rank"))
            previous_score = _float_or_blank(previous_row.get("final_score"))
            previous_status = str(previous_row.get("final_status", ""))
            if isinstance(current_rank, int) and isinstance(previous_rank, int):
                delta = previous_rank - current_rank
                rank_delta = delta
                if delta > 0:
                    change_type = "UP"
                elif delta < 0:
                    change_type = "DOWN"
                else:
                    change_type = "UNCHANGED"
            else:
                rank_delta = ""
                change_type = "UNCHANGED"

        rows.append(
            {
                "run_date": run_date,
                "analysis_date": current_row.get("analysis_date", run_date),
                "change_type": change_type,
                "ticker": ticker,
                "name": name_for(ticker),
                "current_rank": current_rank,
                "previous_rank": previous_rank,
                "rank_delta": rank_delta,
                "current_score": current_score,
                "previous_score": previous_score,
                "current_status": current_row.get("final_status", ""),
                "previous_status": previous_status,
                **_member_score_fields(current_row),
                "front_desk_instruction": current_row.get("front_desk_instruction", ""),
                "main_risk": current_row.get("main_risk", ""),
            }
        )

    for previous_row in previous_rows:
        ticker = str(previous_row.get("ticker", ""))
        if ticker in current_by_ticker:
            continue
        rows.append(
            {
                "run_date": run_date,
                "analysis_date": run_date,
                "change_type": "DROPPED",
                "ticker": ticker,
                "name": name_for(ticker),
                "current_rank": "",
                "previous_rank": _int_or_blank(previous_row.get("rank")),
                "rank_delta": "",
                "current_score": "",
                "previous_score": _float_or_blank(previous_row.get("final_score")),
                "current_status": "",
                "previous_status": previous_row.get("final_status", ""),
                **{header: "" for header in PDC_MEMBER_SCORE_HEADERS},
                "front_desk_instruction": "",
                "main_risk": previous_row.get("main_risk", ""),
            }
        )

    order = {"NEW": 0, "UP": 1, "UNCHANGED": 2, "DOWN": 3, "DROPPED": 4, "INITIAL": 5}
    return sorted(rows, key=lambda row: (order.get(str(row.get("change_type")), 9), row.get("current_rank") or 999))


def write_leaderboard_html(
    path: Path,
    current_rows: list[dict[str, object]],
    change_rows: list[dict[str, object]],
    market_context: dict[str, object],
    analysis_date: str,
    ticker_names: dict[str, str] | None = None,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    names = ticker_names or {}
    benchmark = market_context.get("benchmark") or "breadth"
    mode = market_context.get("mode") or "unknown"
    summary_counts = {
        "NEW": 0,
        "DROPPED": 0,
        "UP": 0,
        "DOWN": 0,
        "UNCHANGED": 0,
        "INITIAL": 0,
    }
    for row in change_rows:
        change_type = str(row.get("change_type", ""))
        if change_type in summary_counts:
            summary_counts[change_type] += 1

    change_by_ticker = {
        str(row.get("ticker", "")): row for row in change_rows
        if row.get("ticker") and row.get("change_type") != "DROPPED"
    }

    table_rows: list[str] = []
    for row in current_rows:
        ticker = str(row.get("ticker", ""))
        change = change_by_ticker.get(ticker, {})
        change_type = str(change.get("change_type", ""))
        rank_delta = change.get("rank_delta", "")
        if isinstance(rank_delta, int) and rank_delta > 0:
            movement = f"+{rank_delta}"
        else:
            movement = "" if rank_delta == "" else str(rank_delta)
        member_scores = (
            f"Mkt {row.get('market_regime_score', '')} | "
            f"Trend {row.get('trend_score', '')} | "
            f"Break {row.get('livermore_breakout_score', '')} | "
            f"Vol {row.get('volume_price_score', '')} | "
            f"Candle {row.get('candlestick_score', '')} | "
            f"Heat {row.get('overheat_score', '')} | "
            f"Risk {row.get('risk_score', '')} | "
            f"Zhuge {row.get('zhuge_orion_score', '')} | "
            f"Chair {row.get('final_chair_score', '')}"
        )
        table_rows.append(
            "<tr>"
            f"<td>{escape(str(row.get('rank', '')))}</td>"
            f"<td>{escape(ticker)}</td>"
            f"<td>{escape(names.get(ticker, ''))}</td>"
            f"<td><span class=\"tag tag-{escape(change_type.lower())}\">{escape(change_type)}</span></td>"
            f"<td>{escape(movement)}</td>"
            f"<td>{escape(str(row.get('final_score', '')))}</td>"
            f"<td>{escape(str(row.get('final_status', '')))}</td>"
            f"<td>{escape(member_scores)}</td>"
            f"<td>{escape(str(row.get('front_desk_instruction', '')))}</td>"
            f"<td>{escape(str(row.get('main_risk', '')))}</td>"
            "</tr>"
        )

    dropped_rows: list[str] = []
    for row in change_rows:
        if row.get("change_type") != "DROPPED":
            continue
        dropped_rows.append(
            "<tr>"
            f"<td>{escape(str(row.get('previous_rank', '')))}</td>"
            f"<td>{escape(str(row.get('ticker', '')))}</td>"
            f"<td>{escape(str(row.get('name', '')))}</td>"
            f"<td>{escape(str(row.get('previous_score', '')))}</td>"
            f"<td>{escape(str(row.get('previous_status', '')))}</td>"
            "</tr>"
        )

    html = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Stock PDC Leaderboard</title>
  <style>
    body {{
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #18212a;
      background: #f5f7f9;
    }}
    main {{
      max-width: 1180px;
      margin: 0 auto;
      padding: 28px 20px 48px;
    }}
    h1 {{
      margin: 0 0 8px;
      font-size: 28px;
      letter-spacing: 0;
    }}
    h2 {{
      margin: 28px 0 12px;
      font-size: 18px;
      letter-spacing: 0;
    }}
    .meta, .summary {{
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 0 0 18px;
      color: #52616f;
      font-size: 14px;
    }}
    .summary span {{
      border: 1px solid #d7dee6;
      background: #ffffff;
      padding: 6px 8px;
      border-radius: 6px;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      background: #ffffff;
      border: 1px solid #d9e0e7;
      font-size: 13px;
    }}
    th, td {{
      padding: 10px 12px;
      border-bottom: 1px solid #e4e9ee;
      text-align: left;
      vertical-align: top;
    }}
    th {{
      position: sticky;
      top: 0;
      background: #edf2f6;
      color: #25323d;
      font-weight: 650;
    }}
    .tag {{
      display: inline-block;
      min-width: 78px;
      padding: 3px 7px;
      border-radius: 5px;
      font-size: 12px;
      font-weight: 650;
      text-align: center;
      border: 1px solid #cfd8e2;
      background: #f6f8fa;
    }}
    .tag-new, .tag-up {{
      color: #075e3f;
      background: #e6f5ed;
      border-color: #b7dfc7;
    }}
    .tag-down, .tag-dropped {{
      color: #8f2f21;
      background: #faebe7;
      border-color: #efc6bc;
    }}
    .tag-unchanged, .tag-initial {{
      color: #43515f;
      background: #eef2f5;
      border-color: #d5dde5;
    }}
    td:nth-child(10) {{
      min-width: 260px;
    }}
  </style>
</head>
<body>
  <main>
    <h1>Stock PDC Leaderboard</h1>
    <div class="meta">
      <span>Analysis date: {escape(analysis_date)}</span>
      <span>Market context: {escape(str(benchmark))}</span>
      <span>Mode: {escape(str(mode))}</span>
      <span>Live trading: disabled</span>
    </div>
    <div class="summary">
      <span>New: {summary_counts["NEW"]}</span>
      <span>Dropped: {summary_counts["DROPPED"]}</span>
      <span>Up: {summary_counts["UP"]}</span>
      <span>Down: {summary_counts["DOWN"]}</span>
      <span>Unchanged: {summary_counts["UNCHANGED"]}</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Ticker</th>
          <th>Name</th>
          <th>Change</th>
          <th>Move</th>
          <th>Score</th>
          <th>Status</th>
          <th>Member Scores</th>
          <th>Instruction</th>
          <th>Main Risk</th>
        </tr>
      </thead>
      <tbody>
        {''.join(table_rows)}
      </tbody>
    </table>

    <h2>Dropped From Top 20</h2>
    <table>
      <thead>
        <tr>
          <th>Previous Rank</th>
          <th>Ticker</th>
          <th>Name</th>
          <th>Previous Score</th>
          <th>Previous Status</th>
        </tr>
      </thead>
      <tbody>
        {''.join(dropped_rows) if dropped_rows else '<tr><td colspan="5">None</td></tr>'}
      </tbody>
    </table>
  </main>
</body>
</html>
"""
    path.write_text(html, encoding="utf-8")


def write_html_report(
    path: Path,
    top_rows: list[dict[str, object]],
    market_context: dict[str, object],
    analysis_date: str,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    benchmark = market_context.get("benchmark") or "breadth"
    mode = market_context.get("mode") or "unknown"

    table_rows: list[str] = []
    for row in top_rows:
        table_rows.append(
            "<tr>"
            f"<td>{escape(str(row.get('rank', '')))}</td>"
            f"<td>{escape(str(row.get('ticker', '')))}</td>"
            f"<td>{escape(str(row.get('final_score', '')))}</td>"
            f"<td>{escape(str(row.get('final_status', '')))}</td>"
            f"<td>{escape(str(row.get('market_regime_score', '')))}</td>"
            f"<td>{escape(str(row.get('trend_score', '')))}</td>"
            f"<td>{escape(str(row.get('livermore_breakout_score', '')))}</td>"
            f"<td>{escape(str(row.get('volume_price_score', '')))}</td>"
            f"<td>{escape(str(row.get('candlestick_score', '')))}</td>"
            f"<td>{escape(str(row.get('overheat_score', '')))}</td>"
            f"<td>{escape(str(row.get('risk_score', '')))}</td>"
            f"<td>{escape(str(row.get('zhuge_orion_score', '')))}</td>"
            f"<td>{escape(str(row.get('final_chair_score', '')))}</td>"
            f"<td>{escape(str(row.get('main_reason', '')))}</td>"
            f"<td>{escape(str(row.get('main_risk', '')))}</td>"
            "</tr>"
        )

    html = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Stock PDC Report</title>
  <style>
    body {{
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #17202a;
      background: #f7f8fa;
    }}
    main {{
      max-width: 1180px;
      margin: 0 auto;
      padding: 32px 20px 48px;
    }}
    h1 {{
      margin: 0 0 8px;
      font-size: 28px;
      letter-spacing: 0;
    }}
    .meta {{
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin: 0 0 24px;
      color: #52616f;
      font-size: 14px;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      background: #ffffff;
      border: 1px solid #d9e0e7;
      font-size: 13px;
    }}
    th, td {{
      padding: 10px 12px;
      border-bottom: 1px solid #e4e9ee;
      text-align: left;
      vertical-align: top;
    }}
    th {{
      position: sticky;
      top: 0;
      background: #edf2f6;
      color: #25323d;
      font-weight: 650;
    }}
    td:nth-child(14), td:nth-child(15) {{
      min-width: 240px;
    }}
  </style>
</head>
<body>
  <main>
    <h1>Stock PDC Top 20</h1>
    <div class="meta">
      <span>Analysis date: {escape(analysis_date)}</span>
      <span>Market context: {escape(str(benchmark))}</span>
      <span>Mode: {escape(str(mode))}</span>
      <span>Live trading: disabled</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Ticker</th>
          <th>Final</th>
          <th>Status</th>
          <th>Market</th>
          <th>Trend</th>
          <th>Breakout</th>
          <th>Volume</th>
          <th>Candle</th>
          <th>Overheat</th>
          <th>Risk</th>
          <th>Zhuge</th>
          <th>Chair</th>
          <th>Main Reason</th>
          <th>Main Risk</th>
        </tr>
      </thead>
      <tbody>
        {''.join(table_rows)}
      </tbody>
    </table>
  </main>
</body>
</html>
"""
    path.write_text(html, encoding="utf-8")
