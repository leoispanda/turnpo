from __future__ import annotations

import json
import ssl
import subprocess
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime
from typing import Any

EASTMONEY_QUOTE_URL = "https://push2.eastmoney.com/api/qt/ulist.np/get"
TENCENT_QUOTE_URL = "https://qt.gtimg.cn/q="


@dataclass(frozen=True)
class LiveQuote:
    ticker: str
    name: str
    price: float | None
    pct_change: float | None
    price_change: float | None
    high: float | None
    low: float | None
    open: float | None
    previous_close: float | None
    volume: float | None
    amount: float | None
    source: str
    asof: str
    status: str


def _number(value: Any) -> float | None:
    if value in (None, "-", ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _secid(ticker: str) -> str | None:
    code, _, exchange = ticker.partition(".")
    if not code or not exchange:
        return None
    market = "1" if exchange.upper() == "SH" else "0" if exchange.upper() == "SZ" else None
    if market is None:
        return None
    return f"{market}.{code}"


def _ticker(code: str) -> str:
    if code.startswith("6"):
        return f"{code}.SH"
    return f"{code}.SZ"


def _tencent_symbol(ticker: str) -> str | None:
    code, _, exchange = ticker.partition(".")
    if not code or not exchange:
        return None
    prefix = "sh" if exchange.upper() == "SH" else "sz" if exchange.upper() == "SZ" else None
    if prefix is None:
        return None
    return f"{prefix}{code}"


def _quote_asof(value: str) -> str:
    if len(value) == 14 and value.isdigit():
        return f"{value[:4]}-{value[4:6]}-{value[6:8]} {value[8:10]}:{value[10:12]}:{value[12:14]}"
    return datetime.now().astimezone().isoformat(timespec="seconds")


def _fetch_tencent_quotes(tickers: list[str], timeout: int) -> dict[str, LiveQuote]:
    symbols = [symbol for ticker in tickers if (symbol := _tencent_symbol(ticker)) is not None]
    if not symbols:
        return {}

    request_url = f"{TENCENT_QUOTE_URL}{','.join(symbols)}"
    request = urllib.request.Request(
        request_url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"
            )
        },
    )
    ssl_context = ssl._create_unverified_context()
    try:
        with urllib.request.urlopen(request, timeout=timeout, context=ssl_context) as response:
            text = response.read().decode("gbk", errors="replace")
    except Exception:
        curl = subprocess.run(
            ["curl", "-sSL", "--max-time", str(timeout), request_url],
            check=False,
            capture_output=True,
        )
        if curl.returncode != 0 or not curl.stdout:
            raise RuntimeError(f"tencent quote request failed: {curl.stderr.decode(errors='ignore').strip()}")
        text = curl.stdout.decode("gbk", errors="replace")

    quotes: dict[str, LiveQuote] = {}
    for line in text.splitlines():
        if '="' not in line:
            continue
        raw = line.split('="', 1)[1].rstrip('";')
        fields = raw.split("~")
        if len(fields) < 35:
            continue
        code = fields[2]
        ticker = _ticker(code)
        composite = fields[35].split("/") if len(fields) > 35 else []
        composite_volume = _number(composite[1]) if len(composite) > 1 else None
        composite_amount = _number(composite[2]) if len(composite) > 2 else None
        quotes[ticker] = LiveQuote(
            ticker=ticker,
            name=fields[1],
            price=_number(fields[3]),
            pct_change=_number(fields[32]),
            price_change=_number(fields[31]),
            volume=composite_volume,
            amount=composite_amount,
            high=_number(fields[33]),
            low=_number(fields[34]),
            open=_number(fields[5]),
            previous_close=_number(fields[4]),
            source="Tencent",
            asof=_quote_asof(fields[30]),
            status="VERIFIED",
        )
    return quotes


def fetch_eastmoney_quotes(tickers: list[str], timeout: int = 12) -> dict[str, LiveQuote]:
    secids = [secid for ticker in tickers if (secid := _secid(ticker)) is not None]
    if not secids:
        return {}

    asof = datetime.now().astimezone().isoformat(timespec="seconds")
    params = {
        "fltt": 2,
        "invt": 2,
        "fields": "f12,f14,f2,f3,f4,f5,f6,f15,f16,f17,f18",
        "secids": ",".join(secids),
    }
    request_url = f"{EASTMONEY_QUOTE_URL}?{urllib.parse.urlencode(params, safe=',')}"
    request = urllib.request.Request(
        request_url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"
            )
        },
    )
    ssl_context = ssl._create_unverified_context()
    try:
        with urllib.request.urlopen(request, timeout=timeout, context=ssl_context) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception:
        curl = subprocess.run(
            ["curl", "-sSL", "--max-time", str(timeout), request_url],
            check=False,
            capture_output=True,
            text=True,
        )
        if curl.returncode != 0 or not curl.stdout.strip().startswith("{"):
            return _fetch_tencent_quotes(tickers, timeout)
        payload = json.loads(curl.stdout)

    rows = ((payload.get("data") or {}).get("diff") or [])
    quotes: dict[str, LiveQuote] = {}
    if not rows:
        return _fetch_tencent_quotes(tickers, timeout)

    for row in rows:
        code = str(row.get("f12") or "").strip()
        if not code:
            continue
        ticker = _ticker(code)
        quotes[ticker] = LiveQuote(
            ticker=ticker,
            name=str(row.get("f14") or ""),
            price=_number(row.get("f2")),
            pct_change=_number(row.get("f3")),
            price_change=_number(row.get("f4")),
            volume=_number(row.get("f5")),
            amount=_number(row.get("f6")),
            high=_number(row.get("f15")),
            low=_number(row.get("f16")),
            open=_number(row.get("f17")),
            previous_close=_number(row.get("f18")),
            source="Eastmoney",
            asof=asof,
            status="VERIFIED",
        )
    return quotes
