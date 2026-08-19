"""Free A-share industry mapping from Sina's public market-centre nodes.

Sina exposes the current market node tree and the constituents of each node
through the same endpoint already used by this repository for the A-share
universe.  The mapping uses the 31 Shenwan level-one (申万一级) nodes: broad
enough for a ten-seat concentration cap, mutually exclusive, and much less
fragile than hard-coding today's node list.
"""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


SINA_NODE_TREE_URL = (
    "https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/"
    "Market_Center.getHQNodes"
)
SINA_NODE_DATA_URL = (
    "https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/"
    "Market_Center.getHQNodeData"
)
SINA_UNIVERSE_NODE = "hs_a"
SINA_INDUSTRY_GROUP = "申万一级"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    "Referer": "https://vip.stock.finance.sina.com.cn/",
}


class IndustrySourceError(RuntimeError):
    """Sina did not return a complete, internally consistent classification."""


def ticker_from_symbol(symbol: object) -> str:
    """Convert Sina's ``sh600000`` shape to the repository's ``600000.SH``."""
    text = str(symbol or "").strip().lower()
    exchange = {"sh": "SH", "sz": "SZ", "bj": "BJ"}.get(text[:2])
    code = text[2:]
    if exchange is None or len(code) != 6 or not code.isdigit():
        return ""
    return f"{code}.{exchange}"


def extract_category_nodes(tree: object, label: str = SINA_INDUSTRY_GROUP) -> list[tuple[str, str]]:
    """Find ``(industry name, node id)`` pairs without assuming tree position."""
    if not isinstance(tree, list):
        return []
    if len(tree) >= 2 and tree[0] == label and isinstance(tree[1], list):
        nodes: list[tuple[str, str]] = []
        for item in tree[1]:
            if not isinstance(item, list) or len(item) < 3:
                continue
            name = str(item[0] or "").strip()
            node_id = str(item[2] or "").strip()
            if name and node_id:
                nodes.append((name, node_id))
        return nodes
    for item in tree:
        found = extract_category_nodes(item, label)
        if found:
            return found
    return []


def _get_json(url: str, params: dict[str, Any] | None = None, attempts: int = 4) -> Any:
    query = urllib.parse.urlencode(params or {})
    address = f"{url}?{query}" if query else url
    last: Exception | None = None
    for attempt in range(attempts):
        try:
            request = urllib.request.Request(address, headers=HEADERS)
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.loads(response.read().decode("utf-8", errors="replace"))
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
            last = exc
            time.sleep(1.5 * (attempt + 1))
    raise IndustrySourceError(f"新浪行业请求失败（{address}）：{last}")


def fetch_node_rows(node_id: str, page_size: int = 100, pause: float = 0.08) -> list[dict[str, Any]]:
    """Fetch every constituent of one Sina market-centre node."""
    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    for page in range(1, 201):
        payload = _get_json(
            SINA_NODE_DATA_URL,
            {"page": page, "num": page_size, "sort": "symbol", "asc": 1, "node": node_id},
        )
        if not isinstance(payload, list) or not payload:
            break
        for row in payload:
            if not isinstance(row, dict):
                continue
            ticker = ticker_from_symbol(row.get("symbol"))
            if ticker and ticker not in seen:
                seen.add(ticker)
                rows.append(row)
        if len(payload) < page_size:
            break
        time.sleep(max(pause, 0.0))
    else:
        raise IndustrySourceError(f"新浪节点 {node_id} 分页没有终止")
    return rows


def build_mapping(
    universe_rows: list[dict[str, Any]],
    industry_rows: dict[str, list[dict[str, Any]]],
) -> tuple[dict[str, str], list[str]]:
    """Build a one-industry-per-ticker map and report uncovered A shares."""
    universe = {
        ticker_from_symbol(row.get("symbol"))
        for row in universe_rows
        if isinstance(row, dict)
    }
    universe.discard("")
    if not universe:
        raise IndustrySourceError("新浪全 A 股节点为空")

    mapping: dict[str, str] = {}
    for industry, rows in industry_rows.items():
        for row in rows:
            ticker = ticker_from_symbol(row.get("symbol"))
            if not ticker or ticker not in universe:
                continue
            previous = mapping.get(ticker)
            if previous and previous != industry:
                raise IndustrySourceError(
                    f"{ticker} 同时属于两个申万一级行业：{previous} / {industry}"
                )
            mapping[ticker] = industry
    return dict(sorted(mapping.items())), sorted(universe - set(mapping))


def fetch_sina_sw1(
    page_size: int = 100,
    pause: float = 0.08,
) -> tuple[dict[str, str], dict[str, Any]]:
    """Fetch the live node tree, all A shares, and all Shenwan L1 members."""
    tree = _get_json(SINA_NODE_TREE_URL)
    nodes = extract_category_nodes(tree)
    if len(nodes) < 31:
        raise IndustrySourceError(f"新浪申万一级节点只有 {len(nodes)} 个，拒绝生成残缺映射")

    universe_rows = fetch_node_rows(SINA_UNIVERSE_NODE, page_size, pause)
    rows_by_industry = {
        name: fetch_node_rows(node_id, page_size, pause) for name, node_id in nodes
    }
    mapping, missing = build_mapping(universe_rows, rows_by_industry)
    universe_count = len({ticker_from_symbol(row.get("symbol")) for row in universe_rows} - {""})
    report = {
        "source": "Sina Market_Center.getHQNodes/getHQNodeData",
        "taxonomy": SINA_INDUSTRY_GROUP,
        "industryCount": len(nodes),
        "universeCount": universe_count,
        "mappedCount": len(mapping),
        "missingCount": len(missing),
        "coveragePct": round(100.0 * len(mapping) / max(universe_count, 1), 4),
        "missingTickers": missing,
    }
    return mapping, report


def write_mapping(path: Path, mapping: dict[str, str]) -> Path:
    """Write the exact ``{ticker: industry}`` contract consumed by DAILY_TOP10."""
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(
        json.dumps(mapping, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    temporary.replace(path)
    return path
