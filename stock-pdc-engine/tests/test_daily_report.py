"""The one artifact of the day: fixed columns, honest movement, safe HTML."""

from __future__ import annotations

import csv
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from stock_pdc.sustainable.daily.report import (
    DAILY_TOP10_HEADERS,
    append_history,
    build_rows,
    load_previous,
    write_csv,
    write_html,
)


CONTEXT = {
    "asOfTradeDate": "2026-08-18",
    "dataFreshnessStatus": "FRESH",
    "runtimeMode": "DAILY_TOP10",
    "degradationStatus": "NONE",
    "seatCount": 10,
    "cashSeats": 8,
    "investedPct": 20.0,
    "cashReservePct": 80.0,
    "exposureFactor": 1.0,
    "eligibleCount": 297,
    "snapshotId": "snap-2026-08-18-abc",
    "factsHash": "f" * 64,
    "generatedAt": "2026-08-18T12:00:00+00:00",
}


def seats() -> list[dict]:
    made = [
        {"rank": 1, "ticker": "600000.SH", "action": "BUY", "allocation_pct": 10.0},
        {"rank": 2, "ticker": "000001.SZ", "action": "HOLD", "allocation_pct": 10.0},
    ]
    for index in range(3, 11):
        made.append({"rank": index, "ticker": "CASH", "action": "CASH", "allocation_pct": 10.0})
    return made


def rows(previous: dict[str, int] | None = None) -> list[dict]:
    return build_rows(
        seats(),
        CONTEXT,
        {"600000.SH": "浦发银行", "000001.SZ": "平安银行"},
        {"600000.SH": 9.51, "000001.SZ": 11.2},
        {"600000.SH": "trend intact"},
        {"600000.SH": "RSI warming"},
        previous or {},
    )


class ColumnTest(unittest.TestCase):
    def test_the_column_list_is_the_agreed_one_in_order(self) -> None:
        self.assertEqual(
            list(DAILY_TOP10_HEADERS),
            [
                "rank", "ticker", "name", "action", "allocation_pct",
                "main_reason", "main_risk", "technical_stop_reference",
                "previous_rank", "rank_change", "as_of_trade_date",
                "data_freshness_status", "runtime_mode",
            ],
        )

    def test_every_row_carries_the_trade_date_and_the_runtime_mode(self) -> None:
        for row in rows():
            self.assertEqual(row["as_of_trade_date"], "2026-08-18")
            self.assertEqual(row["runtime_mode"], "DAILY_TOP10")
            self.assertEqual(row["data_freshness_status"], "FRESH")

    def test_a_cash_seat_carries_no_company_fields(self) -> None:
        cash = rows()[-1]
        self.assertEqual(cash["name"], "")
        self.assertEqual(cash["main_reason"], "")
        self.assertEqual(cash["technical_stop_reference"], "")

    def test_the_written_file_has_exactly_the_agreed_header(self) -> None:
        with TemporaryDirectory() as tmp:
            path = write_csv(Path(tmp) / "daily_top10.csv", rows())
            with path.open(encoding="utf-8-sig", newline="") as handle:
                reader = csv.DictReader(handle)
                self.assertEqual(reader.fieldnames, list(DAILY_TOP10_HEADERS))
                self.assertEqual(len(list(reader)), 10)


class MovementTest(unittest.TestCase):
    def test_a_name_without_a_yesterday_is_new(self) -> None:
        self.assertEqual(rows()[0]["rank_change"], "NEW")
        self.assertEqual(rows()[0]["previous_rank"], "")

    def test_a_name_that_moved_up_shows_a_positive_change(self) -> None:
        row = rows({"600000.SH": 4})[0]
        self.assertEqual(row["previous_rank"], 4)
        self.assertEqual(row["rank_change"], "+3")

    def test_a_name_that_moved_down_shows_a_negative_change(self) -> None:
        row = rows({"000001.SZ": 1})[1]
        self.assertEqual(row["rank_change"], "-1")


class PreviousDayTest(unittest.TestCase):
    def _history(self, tmp: Path) -> Path:
        history = tmp / "daily_top10_history.csv"
        append_history(history, rows(), "2026-08-18")
        earlier = [
            {**row, "as_of_trade_date": "2026-08-15", "ticker": "600519.SH", "rank": 1}
            for row in rows()[:1]
        ]
        append_history(history, earlier, "2026-08-15")
        return history

    def test_yesterday_comes_from_the_most_recent_earlier_trade_date(self) -> None:
        with TemporaryDirectory() as tmp:
            history = self._history(Path(tmp))
            previous, previous_date = load_previous(history, Path(tmp) / "x.csv", "2026-08-19")
            self.assertEqual(previous_date, "2026-08-18")
            self.assertEqual(previous["600000.SH"], 1)

    def test_rerunning_the_same_session_is_not_treated_as_a_new_day(self) -> None:
        """A correction run must not report every name as unchanged."""
        with TemporaryDirectory() as tmp:
            history = self._history(Path(tmp))
            previous, previous_date = load_previous(history, Path(tmp) / "x.csv", "2026-08-18")
            self.assertEqual(previous_date, "2026-08-15")
            self.assertEqual(previous, {"600519.SH": 1})

    def test_cash_seats_are_not_carried_as_holdings(self) -> None:
        with TemporaryDirectory() as tmp:
            history = self._history(Path(tmp))
            previous, _ = load_previous(history, Path(tmp) / "x.csv", "2026-08-19")
            self.assertNotIn("CASH", previous)
            self.assertEqual(len(previous), 2)

    def test_the_first_ever_run_has_no_yesterday(self) -> None:
        with TemporaryDirectory() as tmp:
            previous, previous_date = load_previous(
                Path(tmp) / "none.csv", Path(tmp) / "none2.csv", "2026-08-19"
            )
            self.assertEqual((previous, previous_date), ({}, ""))

    def test_a_repeated_run_replaces_that_day_rather_than_appending_twice(self) -> None:
        with TemporaryDirectory() as tmp:
            history = Path(tmp) / "daily_top10_history.csv"
            append_history(history, rows(), "2026-08-18")
            append_history(history, rows(), "2026-08-18")
            with history.open(encoding="utf-8-sig", newline="") as handle:
                self.assertEqual(len(list(csv.DictReader(handle))), 10)


class PageTest(unittest.TestCase):
    def test_the_page_renders_every_seat_and_the_quota(self) -> None:
        audit = {
            "quota": {"byMember": {"sol": {"calls": 3, "remaining": 1, "promptChars": 10, "outputChars": 20, "seconds": 1.0}}},
            "unresolvedTickers": ["600519.SH"],
            "droppedHoldings": [{"ticker": "000002.SZ", "reason": "OUTSIDE_BUFFER"}],
            "blockedReasonCounts": {"ST_FLAG": 2},
            "degradation": [],
        }
        with TemporaryDirectory() as tmp:
            path = write_html(Path(tmp) / "daily_top10.html", rows(), CONTEXT, audit)
            html = path.read_text(encoding="utf-8")
        self.assertIn("600000.SH", html)
        self.assertIn("DAILY_TOP10", html)
        self.assertIn("600519.SH", html)
        self.assertEqual(html.count("<tr class="), 10)

    def test_text_from_the_run_is_escaped_rather_than_injected(self) -> None:
        hostile = build_rows(
            seats()[:1], CONTEXT, {"600000.SH": "<script>alert(1)</script>"},
            {}, {}, {}, {},
        )
        with TemporaryDirectory() as tmp:
            path = write_html(Path(tmp) / "daily_top10.html", hostile, CONTEXT, {})
            html = path.read_text(encoding="utf-8")
        self.assertNotIn("<script>alert(1)</script>", html)
        self.assertIn("&lt;script&gt;", html)


if __name__ == "__main__":
    unittest.main()
