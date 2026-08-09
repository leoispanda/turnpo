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
from datetime import date, timedelta
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
    if code.startswith(("4", "8")):
        return "BJ"
    return None


def fetch_candidates() -> list[Candidate]:
    page_size = 500
    page = 1
    expected_total: int | None = None
    raw_rows: list[dict[str, Any]] = []
    while expected_total is None or len(raw_rows) < expected_total:
        payload = _fetch_json(
            LIST_URL,
            {
                "pn": page,
                "pz": page_size,
                "po": 1,
                "np": 1,
                "fltt": 2,
                "invt": 2,
                "fid": "f20",
                # Shenzhen main board, ChiNext, Shanghai main board, STAR Market,
                # and Beijing Stock Exchange. No board is omitted for liquidity.
                "fs": "m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048",
                "fields": "f12,f14,f2,f3,f6,f8,f9,f20,f21,f23",
            },
        )
        data = payload.get("data") or {}
        rows = data.get("diff") or []
        total = _number(data.get("total"))
        if total is None or total < 1:
            raise RuntimeError("Eastmoney did not report a valid full-market total")
        if expected_total is None:
            expected_total = int(total)
        elif expected_total != int(total):
            raise RuntimeError("Eastmoney full-market total changed while paging")
        if not rows:
            raise RuntimeError(f"Eastmoney returned an empty page before all {expected_total} stocks were received")
        raw_rows.extend(rows)
        page += 1
    if expected_total is None or len(raw_rows) != expected_total:
        raise RuntimeError("Eastmoney full-market pagination did not return the reported stock count")

    candidates: list[Candidate] = []
    seen_tickers: set[str] = set()
    for row in raw_rows:
        code = str(row.get("f12") or "").strip()
        name = str(row.get("f14") or "").strip()
        exchange = _exchange_for_code(code)
        if not code or not name or exchange is None:
            continue
        ticker = f"{code}.{exchange}"
        if ticker in seen_tickers:
            raise RuntimeError(f"Eastmoney returned duplicate ticker {ticker}")
        seen_tickers.add(ticker)
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


def write_universe(path: Path, rows: list[dict[str, object]]) -> None:
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
        "history_rows",
        "last_date",
    ]
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fetch the full A-share universe from Eastmoney.")
    parser.add_argument("--data-dir", default="data_a_share", help="Output directory for OHLCV CSV files.")
    parser.add_argument(
        "--universe-csv",
        default="outputs_a_share/a_share_universe.csv",
        help="Output CSV containing ticker-name metadata for fetched names.",
    )
    parser.add_argument(
        "--source",
        choices=["tencent", "eastmoney"],
        default="tencent",
        help="Historical daily data source.",
    )
    parser.add_argument("--bars", type=int, default=320, help="Daily bars to request from Tencent.")
    parser.add_argument("--days", type=int, default=560, help="Calendar days of daily bars to request.")
    parser.add_argument("--reuse-existing", action="store_true", help="Reuse existing OHLCV CSV files before requesting data.")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    data_dir = _project_path(args.data_dir)
    universe_csv = _project_path(args.universe_csv)
    begin = (date.today() - timedelta(days=args.days)).strftime("%Y%m%d")
    end = date.today().strftime("%Y%m%d")

    # The upstream list is the entire A-share market. Market cap belongs to
    # Hawkeye, so this fetch step never applies a market-cap, turnover, rank,
    # trend, or liquidity screen; nor may it fall back to a static universe.
    raw_candidates = fetch_candidates()
    selected = raw_candidates

    if args.source == "tencent":
        benchmark_bars = fetch_tencent_kline("sh510300", args.bars)
    else:
        benchmark_bars = fetch_kline("1.000300", begin, end)
    if benchmark_bars:
        benchmark_name = "CSI300ETF" if args.source == "tencent" else "CSI300"
        write_bars(data_dir / f"{benchmark_name}.csv", benchmark_bars)

    universe_rows: list[dict[str, object]] = []
    kept = 0
    failed = 0
    for source_rank, candidate in enumerate(selected, start=1):
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
                raise RuntimeError(f"Historical data request failed for {candidate.ticker}: {exc}") from exc
        if not bars:
            failed += 1
            raise RuntimeError(f"Historical data request returned no bars for {candidate.ticker}")
        write_bars(bars_path, bars)
        universe_rows.append(
            {
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
                "history_rows": len(bars),
                "last_date": bars[-1]["Date"],
            }
        )
        kept += 1
        time.sleep(0.04)

    write_universe(universe_csv, universe_rows)
    print(f"Fetched candidates: {len(raw_candidates)}")
    print("Used preset universe: False")
    print(f"Full A-share market candidates: {len(selected)}")
    print(f"Daily histories kept: {kept}")
    print(f"Failed history requests: {failed}")
    print(f"Benchmark rows: {len(benchmark_bars)}")
    print(f"Data directory: {data_dir}")
    print(f"Universe CSV: {universe_csv}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
