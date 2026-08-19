#!/usr/bin/env python3
"""Fetch the full A-share universe from Sina, then daily bars from Tencent.

This is a drop-in replacement for the Eastmoney universe listing, which now
answers 502 for bulk enumeration while its single-quote endpoint still works.
Output layout, column names and file naming are identical to
`fetch_a_share_eastmoney.py`, so the rest of the pipeline is unaffected.

Two-phase by design: the whole market is enumerated first, then bars are
requested only for names that clear Hawkeye's market-cap rule. That rule does
not depend on price history, so the surviving candidate pool is byte-identical
to fetching every stock and screening afterwards — it just skips several
thousand pointless requests. The 60-day return rule still runs later, in
Hawkeye, on real bars.
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from stock_pdc.config import HAWKEYE_MIN_MARKET_CAP_CNY

SINA_LIST_URL = (
    "https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/"
    "Market_Center.getHQNodeData"
)
TENCENT_KLINE_URL = "https://web.ifzq.gtimg.cn/appstock/app/fqkline/get"
BENCHMARK_SYMBOL = "sh510300"
BENCHMARK_NAME = "CSI300ETF"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    "Referer": "https://finance.sina.com.cn/",
}
BAR_FIELDS = ["Date", "Open", "High", "Low", "Close", "Volume"]
UNIVERSE_FIELDS = [
    "source_rank",
    "ticker",
    "code",
    "exchange",
    "name",
    "latest_price",
    "pct_change",
    "turnover_amount",
    "total_mcap",
    "free_float_mcap",
    "pe",
    "pb",
    "turnover_rate",
    "history_rows",
    "last_date",
]

# Sina reports both capitalisations in 万元.
WAN = 10_000.0


@dataclass(frozen=True)
class Candidate:
    code: str
    exchange: str
    name: str
    latest_price: float | None
    pct_change: float | None
    turnover_amount: float | None
    total_mcap: float | None
    free_float_mcap: float | None
    pe: float | None
    pb: float | None
    turnover_rate: float | None

    @property
    def ticker(self) -> str:
        return f"{self.code}.{self.exchange}"

    @property
    def tencent_symbol(self) -> str:
        return f"{ {'SH': 'sh', 'SZ': 'sz', 'BJ': 'bj'}[self.exchange] }{self.code}"


def _number(value: Any) -> float | None:
    if value in (None, "", "-", "null"):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _get_json(url: str, params: dict[str, Any], attempts: int = 4) -> Any:
    query = urllib.parse.urlencode(params)
    last: Exception | None = None
    for attempt in range(attempts):
        try:
            request = urllib.request.Request(f"{url}?{query}", headers=HEADERS)
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.loads(response.read().decode("utf-8", errors="replace"))
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
            last = exc
            # Back off rather than hammering a source that is already unhappy.
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"request failed after {attempts} attempts: {last}")


def fetch_universe(page_size: int = 100, pause: float = 0.25) -> list[Candidate]:
    """Enumerate every A-share listing, with no screen applied."""
    candidates: list[Candidate] = []
    seen: set[str] = set()
    page = 1
    while True:
        rows = _get_json(
            SINA_LIST_URL,
            {"page": page, "num": page_size, "sort": "symbol", "asc": 1, "node": "hs_a"},
        )
        if not isinstance(rows, list) or not rows:
            break
        for row in rows:
            symbol = str(row.get("symbol") or "").strip().lower()
            code = str(row.get("code") or "").strip()
            if len(symbol) < 3 or not code or symbol in seen:
                continue
            exchange = {"sh": "SH", "sz": "SZ", "bj": "BJ"}.get(symbol[:2])
            if exchange is None:
                continue
            seen.add(symbol)
            total_mcap = _number(row.get("mktcap"))
            free_float = _number(row.get("nmc"))
            candidates.append(
                Candidate(
                    code=code,
                    exchange=exchange,
                    name=str(row.get("name") or "").strip(),
                    latest_price=_number(row.get("trade")),
                    pct_change=_number(row.get("changepercent")),
                    turnover_amount=_number(row.get("amount")),
                    total_mcap=total_mcap * WAN if total_mcap is not None else None,
                    free_float_mcap=free_float * WAN if free_float is not None else None,
                    pe=_number(row.get("per")),
                    pb=_number(row.get("pb")),
                    turnover_rate=_number(row.get("turnoverratio")),
                )
            )
        page += 1
        time.sleep(pause)
        if page > 200:
            raise RuntimeError("Sina pagination did not terminate")
    if not candidates:
        raise RuntimeError("Sina returned no A-share listings")
    return candidates


def fetch_tencent_kline(symbol: str, bars_count: int) -> list[dict[str, str]]:
    """Daily forward-adjusted bars, in the column order the pipeline expects."""
    payload = _get_json(TENCENT_KLINE_URL, {"param": f"{symbol},day,,,{bars_count},qfq"})
    node = (payload.get("data") or {}).get(symbol) or {}
    rows = node.get("qfqday") or node.get("day") or []
    bars: list[dict[str, str]] = []
    for row in rows:
        if len(row) < 6:
            continue
        # Tencent order is date, open, close, high, low, volume.
        bars.append({
            "Date": str(row[0]),
            "Open": str(row[1]),
            "High": str(row[3]),
            "Low": str(row[4]),
            "Close": str(row[2]),
            "Volume": str(row[5]),
        })
    return bars


def write_bars(path: Path, bars: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=BAR_FIELDS)
        writer.writeheader()
        writer.writerows(bars)


def write_universe(path: Path, rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=UNIVERSE_FIELDS)
        writer.writeheader()
        writer.writerows(rows)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fetch A-share data via Sina and Tencent.")
    parser.add_argument("--data-dir", default="data_a_share")
    parser.add_argument("--universe-csv", default="outputs_a_share/a_share_universe.csv")
    parser.add_argument("--bars", type=int, default=360)
    parser.add_argument("--pause", type=float, default=0.12, help="seconds between bar requests")
    parser.add_argument(
        "--min-market-cap",
        type=float,
        default=float(HAWKEYE_MIN_MARKET_CAP_CNY),
        help="skip bars for names Hawkeye would reject on capitalisation alone",
    )
    parser.add_argument("--reuse-existing", action="store_true")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    data_dir = Path(args.data_dir)
    data_dir = data_dir if data_dir.is_absolute() else PROJECT_ROOT / data_dir
    universe_csv = Path(args.universe_csv)
    universe_csv = universe_csv if universe_csv.is_absolute() else PROJECT_ROOT / universe_csv

    print("正在从新浪拉取全市场名单……", flush=True)
    everything = fetch_universe()
    print(f"全市场：{len(everything)} 支", flush=True)

    selected = [
        item for item in everything
        if item.total_mcap is not None and item.total_mcap > args.min_market_cap
    ]
    selected.sort(key=lambda item: -(item.total_mcap or 0.0))
    skipped = len(everything) - len(selected)
    print(
        f"市值 > {args.min_market_cap / 1e8:.0f} 亿：{len(selected)} 支"
        f"（跳过 {skipped} 支的K线请求；鹰眼的 60 日收益规则稍后在真实K线上运行）",
        flush=True,
    )

    print("基准 CSI300ETF……", flush=True)
    benchmark_bars = fetch_tencent_kline(BENCHMARK_SYMBOL, args.bars)
    if not benchmark_bars:
        raise SystemExit("benchmark bars unavailable; refusing to write an unusable run")
    write_bars(data_dir / f"{BENCHMARK_NAME}.csv", benchmark_bars)
    print(f"  {len(benchmark_bars)} 根，最新 {benchmark_bars[-1]['Date']}", flush=True)

    rows: list[dict[str, object]] = []
    failed: list[str] = []
    for index, candidate in enumerate(selected, start=1):
        path = data_dir / f"{candidate.ticker}.csv"
        bars: list[dict[str, str]] = []
        if args.reuse_existing and path.is_file():
            with path.open("r", encoding="utf-8-sig", newline="") as file:
                bars = list(csv.DictReader(file))
        if not bars:
            try:
                bars = fetch_tencent_kline(candidate.tencent_symbol, args.bars)
            except RuntimeError as exc:
                # One unreachable name must not abort a whole market run; it is
                # recorded and excluded instead.
                failed.append(f"{candidate.ticker}: {exc}")
                continue
            time.sleep(args.pause)
        if not bars:
            failed.append(f"{candidate.ticker}: no bars returned")
            continue
        write_bars(path, bars)
        rows.append({
            "source_rank": index,
            "ticker": candidate.ticker,
            "code": candidate.code,
            "exchange": candidate.exchange,
            "name": candidate.name,
            "latest_price": candidate.latest_price if candidate.latest_price is not None else "",
            "pct_change": candidate.pct_change if candidate.pct_change is not None else "",
            "turnover_amount": candidate.turnover_amount if candidate.turnover_amount is not None else "",
            "total_mcap": candidate.total_mcap if candidate.total_mcap is not None else "",
            "free_float_mcap": candidate.free_float_mcap if candidate.free_float_mcap is not None else "",
            "pe": candidate.pe if candidate.pe is not None else "",
            "pb": candidate.pb if candidate.pb is not None else "",
            "turnover_rate": candidate.turnover_rate if candidate.turnover_rate is not None else "",
            "history_rows": len(bars),
            "last_date": bars[-1].get("Date", ""),
        })
        if index % 50 == 0:
            print(f"  {index}/{len(selected)} …", flush=True)

    if not rows:
        raise SystemExit("no candidate produced usable bars")
    write_universe(universe_csv, rows)

    latest = max(str(row["last_date"]) for row in rows)
    print(f"\n完成：{len(rows)} 支写入 {data_dir}", flush=True)
    print(f"名单：{universe_csv}", flush=True)
    print(f"最新交易日：{latest}", flush=True)
    if failed:
        print(f"失败 {len(failed)} 支（已排除）：{', '.join(failed[:8])}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
