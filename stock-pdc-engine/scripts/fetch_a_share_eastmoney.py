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
PRESET_CANDIDATES = [
    ("600519", "贵州茅台"),
    ("601398", "工商银行"),
    ("601288", "农业银行"),
    ("601939", "建设银行"),
    ("601988", "中国银行"),
    ("600036", "招商银行"),
    ("601318", "中国平安"),
    ("601328", "交通银行"),
    ("601166", "兴业银行"),
    ("600000", "浦发银行"),
    ("601668", "中国建筑"),
    ("601857", "中国石油"),
    ("600028", "中国石化"),
    ("601088", "中国神华"),
    ("600900", "长江电力"),
    ("600941", "中国移动"),
    ("601728", "中国电信"),
    ("600050", "中国联通"),
    ("600030", "中信证券"),
    ("601688", "华泰证券"),
    ("300059", "东方财富"),
    ("000858", "五粮液"),
    ("000568", "泸州老窖"),
    ("002304", "洋河股份"),
    ("600809", "山西汾酒"),
    ("000333", "美的集团"),
    ("000651", "格力电器"),
    ("600690", "海尔智家"),
    ("600887", "伊利股份"),
    ("603288", "海天味业"),
    ("601888", "中国中免"),
    ("300750", "宁德时代"),
    ("002594", "比亚迪"),
    ("300124", "汇川技术"),
    ("002050", "三花智控"),
    ("300274", "阳光电源"),
    ("601012", "隆基绿能"),
    ("600438", "通威股份"),
    ("002460", "赣锋锂业"),
    ("002466", "天齐锂业"),
    ("300014", "亿纬锂能"),
    ("600276", "恒瑞医药"),
    ("300760", "迈瑞医疗"),
    ("603259", "药明康德"),
    ("300015", "爱尔眼科"),
    ("000661", "长春高新"),
    ("688271", "联影医疗"),
    ("000963", "华东医药"),
    ("600309", "万华化学"),
    ("601899", "紫金矿业"),
    ("600019", "宝钢股份"),
    ("600547", "山东黄金"),
    ("601600", "中国铝业"),
    ("000807", "云铝股份"),
    ("600489", "中金黄金"),
    ("603993", "洛阳钼业"),
    ("002415", "海康威视"),
    ("000725", "京东方A"),
    ("002475", "立讯精密"),
    ("002371", "北方华创"),
    ("688981", "中芯国际"),
    ("688041", "海光信息"),
    ("688256", "寒武纪"),
    ("688012", "中微公司"),
    ("603501", "韦尔股份"),
    ("600584", "长电科技"),
    ("000063", "中兴通讯"),
    ("000938", "紫光股份"),
    ("002230", "科大讯飞"),
    ("300308", "中际旭创"),
    ("300394", "天孚通信"),
    ("300502", "新易盛"),
    ("300433", "蓝思科技"),
    ("002241", "歌尔股份"),
    ("600570", "恒生电子"),
    ("300033", "同花顺"),
    ("002236", "大华股份"),
    ("002049", "紫光国微"),
    ("601138", "工业富联"),
    ("600760", "中航沈飞"),
    ("000768", "中航西飞"),
    ("002179", "中航光电"),
    ("600031", "三一重工"),
    ("000425", "徐工机械"),
    ("601766", "中国中车"),
    ("600406", "国电南瑞"),
    ("601390", "中国中铁"),
    ("601186", "中国铁建"),
    ("601669", "中国电建"),
    ("601919", "中远海控"),
    ("600009", "上海机场"),
    ("600018", "上港集团"),
    ("601006", "大秦铁路"),
    ("601816", "京沪高铁"),
    ("000002", "万科A"),
    ("600048", "保利发展"),
    ("002352", "顺丰控股"),
    ("002714", "牧原股份"),
    ("300498", "温氏股份"),
    ("000895", "双汇发展"),
    ("002027", "分众传媒"),
    ("601211", "国泰君安"),
    ("600150", "中国船舶"),
    ("601989", "中国重工"),
    ("601985", "中国核电"),
    ("600011", "华能国际"),
    ("600905", "三峡能源"),
]


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
        prefix = "sh" if self.exchange == "SH" else "sz"
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
    return None


def fetch_candidates() -> list[Candidate]:
    payload = _fetch_json(
        LIST_URL,
        {
            "pn": 1,
            "pz": 6000,
            "po": 1,
            "np": 1,
            "fltt": 2,
            "invt": 2,
            "fid": "f20",
            "fs": "m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23",
            "fields": "f12,f14,f2,f3,f6,f8,f9,f20,f21,f23",
        },
    )
    rows = ((payload.get("data") or {}).get("diff") or [])
    candidates: list[Candidate] = []
    for row in rows:
        code = str(row.get("f12") or "").strip()
        name = str(row.get("f14") or "").strip()
        exchange = _exchange_for_code(code)
        if not code or not name or exchange is None:
            continue
        if "ST" in name.upper() or "退" in name:
            continue
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


def preset_candidates() -> list[Candidate]:
    candidates: list[Candidate] = []
    for code, name in PRESET_CANDIDATES:
        exchange = _exchange_for_code(code)
        if exchange is None:
            continue
        candidates.append(
            Candidate(
                code=code,
                name=name,
                exchange=exchange,
                latest_price=None,
                pct_change=None,
                turnover_amount=None,
                total_mcap=None,
                free_float_mcap=None,
                pe=None,
                pb=None,
                turnover_rate=None,
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
    parser = argparse.ArgumentParser(description="Fetch a liquid A-share universe from Eastmoney.")
    parser.add_argument("--data-dir", default="data_a_share", help="Output directory for OHLCV CSV files.")
    parser.add_argument(
        "--universe-csv",
        default="outputs_a_share/a_share_universe.csv",
        help="Output CSV containing ticker-name metadata for fetched names.",
    )
    parser.add_argument("--preset-only", action="store_true", help="Use the built-in liquid A-share preset universe.")
    parser.add_argument(
        "--source",
        choices=["tencent", "eastmoney"],
        default="tencent",
        help="Historical daily data source.",
    )
    parser.add_argument("--bars", type=int, default=320, help="Daily bars to request from Tencent.")
    parser.add_argument("--min-mcap", type=float, default=30_000_000_000, help="Minimum total market cap in CNY.")
    parser.add_argument("--min-bars", type=int, default=200, help="Minimum daily bars required to keep a candidate.")
    parser.add_argument("--days", type=int, default=560, help="Calendar days of daily bars to request.")
    parser.add_argument("--continue-on-error", action="store_true", help="Skip tickers whose historical data request fails.")
    parser.add_argument("--reuse-existing", action="store_true", help="Reuse existing OHLCV CSV files before requesting data.")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    data_dir = _project_path(args.data_dir)
    universe_csv = _project_path(args.universe_csv)
    begin = (date.today() - timedelta(days=args.days)).strftime("%Y%m%d")
    end = date.today().strftime("%Y%m%d")

    used_preset = args.preset_only
    if args.preset_only:
        raw_candidates = preset_candidates()
    else:
        try:
            raw_candidates = fetch_candidates()
        except Exception as exc:
            print(f"Candidate list fetch failed; falling back to preset universe: {exc}")
            raw_candidates = preset_candidates()
            used_preset = True

    if used_preset:
        filtered = raw_candidates
    else:
        filtered = [
            candidate
            for candidate in raw_candidates
            if (candidate.total_mcap or 0) >= args.min_mcap
        ]
        filtered.sort(key=lambda candidate: candidate.total_mcap or 0, reverse=True)
    # Download every stock that meets the explicitly configured upstream
    # constraints. Never silently truncate the market universe by rank.
    selected = filtered

    if args.source == "tencent":
        benchmark_bars = fetch_tencent_kline("sh510300", args.bars)
    else:
        benchmark_bars = fetch_kline("1.000300", begin, end)
    if len(benchmark_bars) >= args.min_bars:
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
                if not args.continue_on_error:
                    raise
                print(f"Skipped {candidate.ticker}: {exc}")
                continue
        if len(bars) < args.min_bars:
            continue
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
    print(f"Used preset universe: {used_preset}")
    print(f"Filtered liquid large-cap candidates: {len(filtered)}")
    print(f"Daily histories kept: {kept}")
    print(f"Failed history requests: {failed}")
    print(f"Benchmark rows: {len(benchmark_bars)}")
    print(f"Data directory: {data_dir}")
    print(f"Universe CSV: {universe_csv}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
