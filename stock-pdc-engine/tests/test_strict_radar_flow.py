from __future__ import annotations

import csv
import tempfile
import unittest
from datetime import date, timedelta
from pathlib import Path

from stock_pdc.cli import _selection_gate, main
from stock_pdc.models import ScorerResult, StockEvaluation
from stock_pdc.pdc_orchestrator import daily_instruction_rows


def _write_bars(path: Path, daily_growth: float, count: int = 220) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    start = date(2025, 12, 13)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["Date", "Open", "High", "Low", "Close", "Volume"],
        )
        writer.writeheader()
        close = 100.0
        for index in range(count):
            close *= 1.0 + daily_growth
            writer.writerow(
                {
                    "Date": (start + timedelta(days=index)).isoformat(),
                    "Open": close * 0.999,
                    "High": close * 1.01,
                    "Low": close * 0.99,
                    "Close": close,
                    "Volume": 1_000_000 + index,
                }
            )


def _write_metadata(path: Path, tickers: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["ticker", "name", "total_mcap"])
        writer.writeheader()
        for ticker in tickers:
            writer.writerow(
                {
                    "ticker": ticker,
                    "name": ticker,
                    "total_mcap": 100_000_000_000,
                }
            )


def _read_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def _evaluation(ticker: str, rank: int, status: str) -> StockEvaluation:
    scores = {
        key: ScorerResult(6.0, "test")
        for key in [
            "market_regime",
            "trend",
            "livermore",
            "volume_price",
            "candlestick",
            "overheat",
            "risk",
            "zhuge_orion",
            "chair",
        ]
    }
    return StockEvaluation(
        ticker=ticker,
        final_score=8.0 - rank / 10,
        rank=rank,
        status=status,
        suggested_action=status,
        scores=scores,
        short_reason="test",
        main_risk="test",
        latest_date="2026-07-20",
        latest_close=10.0,
        technical_stop=9.0,
    )


class StrictRadarFlowTests(unittest.TestCase):
    def _run(self, stock_growth_rates: list[float]) -> tuple[int, Path]:
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        root = Path(temporary.name)
        data_dir = root / "data"
        outputs_dir = root / "outputs"
        metadata_path = root / "universe.csv"
        _write_bars(data_dir / "CSI300ETF.csv", 0.0001)
        tickers: list[str] = []
        for index, growth in enumerate(stock_growth_rates, start=1):
            ticker = f"600{index:03d}.SH"
            tickers.append(ticker)
            _write_bars(data_dir / f"{ticker}.csv", growth)
        _write_metadata(metadata_path, tickers)
        return (
            main(
                [
                    "--pdc-loop",
                    "--use-radar",
                    "--data-dir",
                    str(data_dir),
                    "--metadata-csv",
                    str(metadata_path),
                    "--outputs-dir",
                    str(outputs_dir),
                    "--logs-dir",
                    str(root / "logs"),
                    "--performance-db",
                    str(root / "performance" / "pdc_performance.sqlite"),
                    "--performance-report",
                    str(root / "performance" / "pdc_performance_report.md"),
                    "--benchmark",
                    "CSI300ETF",
                    "--as-of",
                    "2026-07-20",
                ]
            ),
            outputs_dir,
        )

    def test_fewer_than_twenty_candidates_are_scored_without_forcing_a_buy(self) -> None:
        exit_code, outputs_dir = self._run([0.002, 0.0021])

        self.assertEqual(exit_code, 0)
        self.assertEqual(len(_read_rows(outputs_dir / "candidate_universe.csv")), 2)
        self.assertEqual(len(_read_rows(outputs_dir / "full_pdc_scores.csv")), 2)
        self.assertEqual(
            len(_read_rows(outputs_dir / "daily_watchlists" / "watchlist_2026-07-20.csv")),
            2,
        )
        # The daily list is allowed to contain fewer than 20 names.  This
        # particular synthetic trend is overextended, so it produces no
        # immediate-buy status rather than being padded with weaker names.
        self.assertLessEqual(len(_read_rows(outputs_dir / "daily_purchase_instruction.csv")), 2)

    def test_zero_candidates_write_an_empty_daily_list(self) -> None:
        exit_code, outputs_dir = self._run([0.0])

        self.assertEqual(exit_code, 0)
        self.assertEqual(len(_read_rows(outputs_dir / "candidate_universe.csv")), 0)
        self.assertEqual(len(_read_rows(outputs_dir / "full_pdc_scores.csv")), 0)
        self.assertEqual(
            len(_read_rows(outputs_dir / "daily_watchlists" / "watchlist_2026-07-20.csv")),
            0,
        )
        self.assertEqual(len(_read_rows(outputs_dir / "daily_purchase_instruction.csv")), 0)

    def test_daily_buy_list_is_status_based_and_can_be_shorter_than_twenty(self) -> None:
        evaluations = [
            _evaluation("600001.SH", 1, "Watch"),
            _evaluation("600002.SH", 2, "Trial Position"),
            _evaluation("600003.SH", 3, "Breakout Pending"),
            _evaluation("600004.SH", 4, "Strong Watch"),
        ]

        instructions = daily_instruction_rows(evaluations, {}, "2026-07-20")

        self.assertEqual([row["ticker"] for row in instructions], ["600002.SH", "600004.SH"])
        self.assertTrue(all(row["instruction"] == "BUY_PDC_APPROVED_MANUAL" for row in instructions))

    def test_short_candidate_list_does_not_close_daily_buy_gate(self) -> None:
        gate = _selection_gate(2, 20, 20, False)

        self.assertEqual(gate["trade_gate_open"], "YES")


if __name__ == "__main__":
    unittest.main()
