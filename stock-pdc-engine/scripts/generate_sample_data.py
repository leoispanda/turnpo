from __future__ import annotations

import argparse
import csv
import math
import random
from datetime import date, timedelta
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]

PROFILES = {
    "SPY": (540.0, 0.00035, 0.008, 72_000_000, "steady"),
    "AAPL": (195.0, 0.00045, 0.014, 61_000_000, "steady"),
    "MSFT": (435.0, 0.00055, 0.013, 24_000_000, "steady"),
    "NVDA": (910.0, 0.00120, 0.026, 42_000_000, "breakout"),
    "AMZN": (185.0, 0.00060, 0.017, 36_000_000, "steady"),
    "META": (505.0, 0.00080, 0.018, 15_000_000, "breakout"),
    "GOOGL": (175.0, 0.00050, 0.015, 28_000_000, "steady"),
    "TSLA": (185.0, 0.00010, 0.033, 96_000_000, "volatile"),
    "AVGO": (1600.0, 0.00100, 0.020, 4_000_000, "breakout"),
    "COST": (840.0, 0.00045, 0.010, 2_000_000, "steady"),
    "JPM": (205.0, 0.00035, 0.012, 9_000_000, "steady"),
    "LLY": (880.0, 0.00075, 0.018, 3_000_000, "breakout"),
    "NFLX": (645.0, 0.00065, 0.020, 4_000_000, "steady"),
    "AMD": (160.0, 0.00065, 0.028, 55_000_000, "volatile"),
    "CRM": (250.0, 0.00020, 0.019, 7_000_000, "fade"),
    "ORCL": (125.0, 0.00050, 0.014, 10_000_000, "steady"),
    "IBM": (185.0, 0.00025, 0.010, 5_000_000, "steady"),
    "GE": (165.0, 0.00070, 0.017, 8_000_000, "breakout"),
    "CAT": (350.0, 0.00035, 0.015, 3_000_000, "steady"),
    "XOM": (116.0, 0.00015, 0.012, 16_000_000, "fade"),
    "UNH": (505.0, 0.00010, 0.017, 4_000_000, "fade"),
    "V": (275.0, 0.00035, 0.011, 6_000_000, "steady"),
    "MA": (455.0, 0.00038, 0.012, 3_000_000, "steady"),
    "ADBE": (475.0, 0.00010, 0.022, 4_000_000, "fade"),
    "NOW": (760.0, 0.00075, 0.021, 2_000_000, "breakout"),
    "PANW": (315.0, 0.00070, 0.023, 5_000_000, "breakout"),
}


def _business_days(end_date: date, count: int) -> list[date]:
    days: list[date] = []
    current = end_date
    while len(days) < count:
        if current.weekday() < 5:
            days.append(current)
        current -= timedelta(days=1)
    return list(reversed(days))


def _stable_seed(ticker: str) -> int:
    return 1000 + sum((index + 1) * ord(char) for index, char in enumerate(ticker))


def _generate_rows(ticker: str, end_date: date, count: int) -> list[dict[str, object]]:
    start_price, drift, volatility, base_volume, style = PROFILES[ticker]
    rng = random.Random(_stable_seed(ticker))
    days = _business_days(end_date, count)
    close = start_price
    rows: list[dict[str, object]] = []

    for index, day in enumerate(days):
        phase = index / max(count - 1, 1)
        style_drift = drift
        if style == "breakout" and phase > 0.78:
            style_drift += 0.0038
        elif style == "volatile":
            style_drift += math.sin(index / 9.0) * 0.0025
        elif style == "fade" and phase > 0.68:
            style_drift -= 0.0022

        overnight = rng.gauss(0, volatility / 3.0)
        intraday = rng.gauss(style_drift, volatility)
        open_price = max(1.0, close * (1.0 + overnight))
        close = max(1.0, open_price * (1.0 + intraday))
        high = max(open_price, close) * (1.0 + abs(rng.gauss(volatility / 2.0, volatility / 4.0)))
        low = min(open_price, close) * (1.0 - abs(rng.gauss(volatility / 2.0, volatility / 4.0)))
        volume_multiplier = 1.0 + abs(intraday) * 18.0 + rng.random() * 0.35
        if style == "breakout" and phase > 0.84 and close > open_price:
            volume_multiplier *= 1.45
        if style == "fade" and phase > 0.74 and close < open_price:
            volume_multiplier *= 1.35

        rows.append(
            {
                "date": day.isoformat(),
                "open": round(open_price, 2),
                "high": round(high, 2),
                "low": round(low, 2),
                "close": round(close, 2),
                "volume": int(base_volume * volume_multiplier),
            }
        )

    return rows


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate deterministic sample OHLCV CSV files.")
    parser.add_argument("--data-dir", default=str(PROJECT_ROOT / "data"))
    parser.add_argument("--end-date", default=date.today().isoformat())
    parser.add_argument("--bars", type=int, default=260)
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    data_dir.mkdir(parents=True, exist_ok=True)
    end_date = date.fromisoformat(args.end_date)

    for ticker in PROFILES:
        path = data_dir / f"{ticker}.csv"
        rows = _generate_rows(ticker, end_date, args.bars)
        with path.open("w", encoding="utf-8", newline="") as file:
            writer = csv.DictWriter(file, fieldnames=["date", "open", "high", "low", "close", "volume"])
            writer.writeheader()
            writer.writerows(rows)

    print(f"Wrote {len(PROFILES)} CSV files to {data_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
