from __future__ import annotations

import argparse
import csv
import json
import ssl
import subprocess
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from math import ceil
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
LIST_URL = "https://push2.eastmoney.com/api/qt/clist/get"
KLINE_URL = "https://push2his.eastmoney.com/api/qt/stock/kline/get"
TENCENT_KLINE_URL = "https://web.ifzq.gtimg.cn/appstock/app/fqkline/get"
@dataclass(frozen=True)
class Candidate:
    code: str
    name: str
    exchange: str
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
    def secid(self) -> str:
        market = "1" if self.exchange == "SH" else "0"
        return f"{market}.{self.code}"

    @property
    def tencent_symbol(self) -> str:
        prefix = {"SH": "sh", "SZ": "sz", "BJ": "bj"}[self.exchange]
        return f"{prefix}{self.code}"


def _project_path(value: str) -> Path:
    path = Path(value)
    if path.is_absolute():
        return path
    return PROJECT_ROOT / path


def _number(value: Any) -> float | None:
    if value in (None, "-", ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _fetch_json_from_curl(request_url: str) -> dict[str, Any]:
    curl = subprocess.run(
        ["curl", "-sSL", "--max-time", "30", request_url],
        check=False,
        capture_output=True,
        text=True,
    )
    if curl.returncode == 0 and curl.stdout.strip().startswith("{"):
        return json.loads(curl.stdout)
    raise RuntimeError(f"curl request failed: {curl.stderr.strip()}")


def _fetch_json(
    url: str,
    params: dict[str, object],
    retries: int = 3,
    curl_first: bool = False,
) -> dict[str, Any]:
    query = urllib.parse.urlencode(params, safe=",:+")
    request_url = f"{url}?{query}"
    if curl_first:
        return _fetch_json_from_curl(request_url)

    request = urllib.request.Request(
        request_url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"
            )
        },
    )
    last_error: Exception | None = None
    ssl_context = ssl._create_unverified_context()
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(request, timeout=25, context=ssl_context) as response:
                return json.loads(response.read().decode("utf-8"))
        except Exception as exc:  # pragma: no cover - network retry guard
            last_error = exc
            time.sleep(0.4 * (attempt + 1))

    try:
        return _fetch_json_from_curl(request_url)
    except RuntimeError as curl_error:
        raise RuntimeError(f"request failed after {retries} attempts: {last_error}; {curl_error}") from curl_error


def _exchange_for_code(code: str) -> str | None:
    if code.startswith("6"):
        return "SH"
    if code.startswith(("0", "2", "3")):
        return "SZ"
    if code.startswith(("4", "8", "9")):
        return "BJ"
    return None


def fetch_candidates() -> list[Candidate]:
    # Eastmoney can cap one list response well below the requested page size.
    # Read every page and fail the run if any page cannot be fetched; a
    # partial market list must never masquerade as a full daily snapshot.
    page_size = 100
    request_params: dict[str, object] = {
        "pz": page_size,
        "po": 1,
        "np": 1,
        "fltt": 2,
        "invt": 2,
        "fid": "f20",
        "fs": "m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048",
        "fields": "f12,f14,f2,f3,f6,f8,f9,f20,f21,f23",
    }
    first_payload = _fetch_json(LIST_URL, {**request_params, "pn": 1})
    first_data = first_payload.get("data") or {}
    total = int(first_data.get("total") or 0)
    first_rows = first_data.get("diff") or []
    if total <= 0 or not first_rows:
        raise RuntimeError("Market API returned no A-share list rows")

    pages = ceil(total / page_size)
    rows: list[dict[str, Any]] = list(first_rows)
    for page in range(2, pages + 1):
        payload = _fetch_json(LIST_URL, {**request_params, "pn": page})
        page_rows = ((payload.get("data") or {}).get("diff") or [])
        if not page_rows:
            raise RuntimeError(f"Market API returned an empty page {page} of {pages}")
        rows.extend(page_rows)
        time.sleep(0.04)

    if len(rows) < total:
        raise RuntimeError(f"Market API returned only {len(rows)} of {total} A-share rows")

    candidates: list[Candidate] = []
    seen: set[str] = set()
    for row in rows:
        code = str(row.get("f12") or "").strip()
        name = str(row.get("f14") or "").strip()
        exchange = _exchange_for_code(code)
        if not code or not name or exchange is None:
            continue
        ticker = f"{code}.{exchange}"
        if ticker in seen:
            continue
        seen.add(ticker)
        candidates.append(
            Candidate(
                code=code,
                name=name,
                exchange=exchange,
                latest_price=_number(row.get("f2")),
                pct_change=_number(row.get("f3")),
                turnover_amount=_number(row.get("f6")),
                total_mcap=_number(row.get("f20")),
                free_float_mcap=_number(row.get("f21")),
                pe=_number(row.get("f9")),
                pb=_number(row.get("f23")),
                turnover_rate=_number(row.get("f8")),
            )
        )
    return candidates


def fetch_kline(secid: str, begin: str, end: str) -> list[dict[str, str]]:
    payload = _fetch_json(
        KLINE_URL,
        {
            "secid": secid,
            "klt": 101,
            "fqt": 1,
            "beg": begin,
            "end": end,
            "fields1": "f1,f2,f3,f4,f5,f6",
            "fields2": "f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61",
        },
    )
    klines = ((payload.get("data") or {}).get("klines") or [])
    bars: list[dict[str, str]] = []
    for item in klines:
        fields = str(item).split(",")
        if len(fields) < 6:
            continue
        bars.append(
            {
                "Date": fields[0],
                "Open": fields[1],
                "High": fields[3],
                "Low": fields[4],
                "Close": fields[2],
                "Volume": fields[5],
            }
        )
    return bars


def fetch_tencent_kline(symbol: str, bars_count: int) -> list[dict[str, str]]:
    payload = _fetch_json(
        TENCENT_KLINE_URL,
        {
            "param": f"{symbol},day,,,{bars_count},qfq",
        },
        curl_first=True,
    )
    node = (payload.get("data") or {}).get(symbol) or {}
    rows = node.get("qfqday") or node.get("day") or []
    bars: list[dict[str, str]] = []
    for row in rows:
        if len(row) < 6:
            continue
        bars.append(
            {
                "Date": str(row[0]),
                "Open": str(row[1]),
                "High": str(row[3]),
                "Low": str(row[4]),
                "Close": str(row[2]),
                "Volume": str(row[5]),
            }
        )
    return bars


def write_bars(path: Path, bars: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=["Date", "Open", "High", "Low", "Close", "Volume"])
        writer.writeheader()
        writer.writerows(bars)


def read_bars(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


def write_market_snapshot(path: Path, rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    headers = [
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
        "universe_status",
        "history_status",
        "history_error",
        "history_rows",
        "last_date",
        "market_data_timestamp",
    ]
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fetch a liquid A-share universe from Eastmoney.")
    parser.add_argument("--data-dir", default="data_a_share", help="Output directory for OHLCV CSV files.")
    parser.add_argument(
        "--universe-csv",
        default="outputs_a_share/a_share_universe.csv",
        help="Output CSV containing only names whose history is ready for analysis.",
    )
    parser.add_argument(
        "--market-snapshot-csv",
        default="outputs_a_share/a_share_market_snapshot.csv",
        help="Output CSV containing every security returned by the market API and its data status.",
    )
    parser.add_argument(
        "--source",
        choices=["tencent", "eastmoney"],
        default="tencent",
        help="Historical daily data source.",
    )
    parser.add_argument("--bars", type=int, default=320, help="Daily bars to request from Tencent.")
    parser.add_argument(
        "--history-fetch-min-mcap",
        type=float,
        default=30_000_000_000,
        help="Fetch history only when a security can still pass Hawkeye's fixed market-cap rule.",
    )
    parser.add_argument("--min-bars", type=int, default=61, help="Minimum daily bars required to calculate a 60-session return.")
    parser.add_argument("--days", type=int, default=560, help="Calendar days of daily bars to request.")
    parser.add_argument("--continue-on-error", action="store_true", help="Skip tickers whose historical data request fails.")
    parser.add_argument("--reuse-existing", action="store_true", help="Reuse existing OHLCV CSV files before requesting data.")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    data_dir = _project_path(args.data_dir)
    universe_csv = _project_path(args.universe_csv)
    market_snapshot_csv = _project_path(args.market_snapshot_csv)
    begin = (date.today() - timedelta(days=args.days)).strftime("%Y%m%d")
    end = date.today().strftime("%Y%m%d")
    market_data_timestamp = datetime.now(timezone.utc).isoformat(timespec="seconds")

    # No preset, no static list and no synthetic recovery path.  A failed
    # market entrance means the daily run is FAILED rather than misleadingly
    # presenting an older or manually selected universe as current data.
    raw_candidates = fetch_candidates()
    if not raw_candidates:
        raise RuntimeError("Market API returned an empty A-share snapshot")

    if args.source == "tencent":
        benchmark_bars = fetch_tencent_kline("sh510300", args.bars)
    else:
        benchmark_bars = fetch_kline("1.000300", begin, end)
    if len(benchmark_bars) >= args.min_bars:
        benchmark_name = "CSI300ETF" if args.source == "tencent" else "CSI300"
        write_bars(data_dir / f"{benchmark_name}.csv", benchmark_bars)

    snapshot_rows: list[dict[str, object]] = []
    universe_rows: list[dict[str, object]] = []
    kept = 0
    failed = 0
    not_requested = 0
    for source_rank, candidate in enumerate(raw_candidates, start=1):
        row: dict[str, object] = {
            "source_rank": source_rank,
            "ticker": candidate.ticker,
            "code": candidate.code,
            "exchange": candidate.exchange,
            "name": candidate.name,
            "latest_price": candidate.latest_price,
            "pct_change": candidate.pct_change,
            "turnover_amount": candidate.turnover_amount,
            "total_mcap": candidate.total_mcap,
            "free_float_mcap": candidate.free_float_mcap,
            "pe": candidate.pe,
            "pb": candidate.pb,
            "turnover_rate": candidate.turnover_rate,
            "universe_status": "UNIVERSE_INCLUDED_A_SHARE",
            "history_status": "",
            "history_error": "",
            "history_rows": 0,
            "last_date": "",
            "market_data_timestamp": market_data_timestamp,
        }
        # This is not a candidate filter: the row remains in the immutable
        # market snapshot and Hawkeye later records the market-cap rejection.
        # It only avoids downloading history for names that cannot satisfy
        # Hawkeye's first fixed rule under any 60-day return.
        if candidate.total_mcap is None:
            row["history_status"] = "NOT_REQUESTED_MISSING_MARKET_CAP"
            row["history_error"] = "market cap unavailable from market API"
            snapshot_rows.append(row)
            not_requested += 1
            continue
        if candidate.total_mcap <= args.history_fetch_min_mcap:
            row["history_status"] = "NOT_REQUESTED_BELOW_HAWKEYE_MARKET_CAP"
            snapshot_rows.append(row)
            not_requested += 1
            continue
        bars_path = data_dir / f"{candidate.ticker}.csv"
        bars = read_bars(bars_path) if args.reuse_existing else []
        if not bars:
            try:
                if args.source == "tencent":
                    bars = fetch_tencent_kline(candidate.tencent_symbol, args.bars)
                else:
                    bars = fetch_kline(candidate.secid, begin, end)
            except Exception as exc:
                failed += 1
                if not args.continue_on_error:
                    raise
                row["history_status"] = "HISTORY_FETCH_FAILED"
                row["history_error"] = str(exc)
                snapshot_rows.append(row)
                print(f"History failed {candidate.ticker}: {exc}")
                continue
        if len(bars) < args.min_bars:
            row["history_status"] = "HISTORY_INSUFFICIENT_BARS"
            row["history_error"] = f"received {len(bars)} bars; need {args.min_bars}"
            row["history_rows"] = len(bars)
            row["last_date"] = bars[-1]["Date"] if bars else ""
            snapshot_rows.append(row)
            continue
        write_bars(bars_path, bars)
        row["history_status"] = "HISTORY_READY"
        row["history_rows"] = len(bars)
        row["last_date"] = bars[-1]["Date"]
        snapshot_rows.append(row)
        universe_rows.append(row)
        kept += 1
        time.sleep(0.04)

    write_market_snapshot(market_snapshot_csv, snapshot_rows)
    write_market_snapshot(universe_csv, universe_rows)
    print(f"Fetched candidates: {len(raw_candidates)}")
    print(f"Market snapshot: {len(snapshot_rows)}")
    print(f"History not requested: {not_requested}")
    print(f"Daily histories kept: {kept}")
    print(f"Failed history requests: {failed}")
    print(f"Benchmark rows: {len(benchmark_bars)}")
    print(f"Data directory: {data_dir}")
    print(f"Market snapshot CSV: {market_snapshot_csv}")
    print(f"Universe CSV: {universe_csv}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
