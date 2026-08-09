from __future__ import annotations

import csv
from pathlib import Path

from .models import Bar

COLUMN_ALIASES = {
    "date": {"date", "datetime", "time"},
    "open": {"open", "o"},
    "high": {"high", "h"},
    "low": {"low", "l"},
    "close": {"close", "adj close", "adj_close", "adjusted close", "c"},
    "volume": {"volume", "vol", "v"},
    "ticker": {"ticker", "symbol"},
}


def _normalize_header(value: str) -> str:
    return value.strip().lower().replace("_", " ")


def _float(value: str | None) -> float:
    if value is None:
        raise ValueError("missing numeric value")
    clean = value.strip().replace(",", "")
    if clean == "":
        raise ValueError("empty numeric value")
    return float(clean)


def _column_map(fieldnames: list[str]) -> dict[str, str]:
    normalized = {_normalize_header(name): name for name in fieldnames}
    mapping: dict[str, str] = {}
    for canonical, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in normalized:
                mapping[canonical] = normalized[alias]
                break
    return mapping


def load_bars_from_csv(path: Path) -> tuple[str, list[Bar]]:
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)
        if not reader.fieldnames:
            raise ValueError(f"{path} has no header row")
        columns = _column_map(reader.fieldnames)
        required = ["date", "open", "high", "low", "close", "volume"]
        missing = [name for name in required if name not in columns]
        if missing:
            joined = ", ".join(missing)
            raise ValueError(f"{path} is missing required columns: {joined}")

        ticker = path.stem.upper()
        bars: list[Bar] = []
        for row_number, row in enumerate(reader, start=2):
            try:
                if "ticker" in columns and row.get(columns["ticker"]):
                    ticker = row[columns["ticker"]].strip().upper()
                bars.append(
                    Bar(
                        date=row[columns["date"]].strip(),
                        open=_float(row.get(columns["open"])),
                        high=_float(row.get(columns["high"])),
                        low=_float(row.get(columns["low"])),
                        close=_float(row.get(columns["close"])),
                        volume=_float(row.get(columns["volume"])),
                    )
                )
            except ValueError as exc:
                raise ValueError(f"{path}:{row_number}: {exc}") from exc

    bars.sort(key=lambda bar: bar.date)
    return ticker, bars


def load_universe(data_dir: Path) -> dict[str, list[Bar]]:
    if not data_dir.exists():
        raise FileNotFoundError(f"Data directory does not exist: {data_dir}")

    universe: dict[str, list[Bar]] = {}
    for path in sorted(data_dir.glob("*.csv")):
        if path.name.lower() == "scoring_history.csv":
            continue
        ticker, bars = load_bars_from_csv(path)
        if bars:
            universe[ticker] = bars

    if not universe:
        raise ValueError(f"No CSV files found in {data_dir}")
    return universe
