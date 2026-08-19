"""The final gate: ten seats, cash when they cannot be earned, and no reordering."""

from __future__ import annotations

import unittest

from stock_pdc.sustainable.daily.selection import (
    ACTION_BUY,
    ACTION_CASH,
    ACTION_HOLD,
    ACTION_PAUSE,
    GATE_SECTOR_CAP,
    SECTOR_CAP_INACTIVE,
    SelectionConfig,
    allocate,
    carry_forward,
    exposure_factor,
    select,
)


def row(ticker: str, rank: int, total: float = 8.0, **overrides) -> dict:
    base = {
        "ticker": ticker,
        "rank": rank,
        "consensusTotal": total,
        "meanConfidence": 0.7,
        "seatTotals": {"claude": total, "sol": total},
        "totalDisagreement": 0.1,
        "highDisagreement": False,
        "unresolvedDisagreement": False,
        "riskScore": 7.0,
        "overheatScore": 7.0,
        "finalStatus": "Watch",
    }
    base.update(overrides)
    return base


def ranking(count: int = 20, **per_ticker) -> dict:
    rows = []
    for index in range(count):
        ticker = f"T{index + 1:02d}"
        rows.append(row(ticker, index + 1, 9.0 - index * 0.1, **per_ticker.get(ticker, {})))
    return {"rows": rows}


def records(count: int = 20, stop_distance: float = 5.0) -> dict:
    return {
        f"T{index + 1:02d}": {
            "ticker": f"T{index + 1:02d}",
            "values": {"stop": 9.0, "stop_dist_pct": stop_distance},
        }
        for index in range(count)
    }


class SeatCountTest(unittest.TestCase):
    def test_a_full_day_fills_exactly_ten_seats(self) -> None:
        result = select(ranking(), records(), {}, {})
        self.assertEqual(len(result["seats"]), 10)
        self.assertEqual({seat["action"] for seat in result["seats"]}, {ACTION_BUY})

    def test_an_empty_seat_is_cash_not_the_next_name_down(self) -> None:
        thin = ranking(20, **{f"T{index:02d}": {"consensusTotal": 4.0} for index in range(3, 21)})
        result = select(thin, records(), {}, {})
        self.assertEqual(len(result["seats"]), 10)
        self.assertEqual(sum(seat["action"] == ACTION_BUY for seat in result["seats"]), 2)
        self.assertEqual(result["cashSeats"], 8)

    def test_a_blocked_candidate_can_never_take_a_seat(self) -> None:
        result = select(ranking(), records(), {"T01": ["ST_FLAG"]}, {})
        self.assertNotIn("T01", [seat["ticker"] for seat in result["seats"]])
        self.assertEqual(len(result["seats"]), 10)

    def test_nothing_below_the_gate_is_promoted_to_reach_ten(self) -> None:
        thin = ranking(12, **{f"T{index:02d}": {"riskScore": 2.0} for index in range(2, 13)})
        result = select(thin, records(12), {}, {})
        seated = [seat for seat in result["seats"] if seat["action"] != ACTION_CASH]
        self.assertEqual(len(seated), 1)
        self.assertEqual(result["cashSeats"], 9)


class UnresolvedDisagreementTest(unittest.TestCase):
    def test_an_unresolved_split_cannot_be_bought(self) -> None:
        result = select(
            ranking(20, T01={"unresolvedDisagreement": True}), records(), {}, {}
        )
        self.assertNotIn("T01", [seat["ticker"] for seat in result["seats"]])
        self.assertEqual(result["unresolvedTickers"], ["T01"])

    def test_the_next_name_takes_the_seat(self) -> None:
        result = select(
            ranking(20, T01={"unresolvedDisagreement": True}), records(), {}, {}
        )
        self.assertEqual(len(result["seats"]), 10)
        self.assertEqual(result["seats"][0]["ticker"], "T02")
        self.assertIn("T11", [seat["ticker"] for seat in result["seats"]])


class TurnoverBufferTest(unittest.TestCase):
    def test_a_holding_that_slipped_inside_the_buffer_keeps_its_seat(self) -> None:
        result = select(ranking(20), records(), {}, {"T13": 5}, SelectionConfig(turnover_buffer=3))
        seat = next(item for item in result["seats"] if item["ticker"] == "T13")
        self.assertEqual(seat["action"], ACTION_HOLD)

    def test_a_holding_that_slipped_past_the_buffer_loses_it(self) -> None:
        result = select(ranking(20), records(), {}, {"T14": 5}, SelectionConfig(turnover_buffer=3))
        self.assertNotIn("T14", [seat["ticker"] for seat in result["seats"]])
        self.assertIn({"ticker": "T14", "reason": "OUTSIDE_BUFFER"}, result["droppedHoldings"])

    def test_a_holding_that_no_longer_qualifies_for_entry_is_paused_not_bought(self) -> None:
        result = select(
            ranking(20, T05={"overheatScore": 1.0}), records(), {}, {"T05": 3}
        )
        seat = next(item for item in result["seats"] if item["ticker"] == "T05")
        self.assertEqual(seat["action"], ACTION_PAUSE)

    def test_a_holding_that_became_untradeable_loses_its_seat(self) -> None:
        result = select(ranking(20), records(), {"T05": ["SUSPENDED"]}, {"T05": 3})
        self.assertNotIn("T05", [seat["ticker"] for seat in result["seats"]])


class StopDistanceTest(unittest.TestCase):
    def test_a_stop_too_far_below_the_close_blocks_a_new_entry(self) -> None:
        result = select(ranking(20), records(20, stop_distance=25.0), {}, {})
        self.assertEqual(result["cashSeats"], 10)

    def test_a_missing_stop_blocks_a_new_entry(self) -> None:
        blank = {ticker: {"ticker": ticker, "values": {}} for ticker in records()}
        result = select(ranking(20), blank, {}, {})
        self.assertEqual(result["cashSeats"], 10)


class SectorCapTest(unittest.TestCase):
    def test_without_a_sector_map_the_cap_reports_itself_inactive(self) -> None:
        result = select(ranking(), records(), {}, {})
        self.assertEqual(result["sectorCapStatus"], SECTOR_CAP_INACTIVE)

    def test_a_sector_cannot_take_more_than_its_cap(self) -> None:
        sectors = {f"T{index + 1:02d}": "银行" for index in range(20)}
        result = select(
            ranking(), records(), {}, {}, SelectionConfig(max_per_sector=3, sectors=sectors)
        )
        seated = [seat for seat in result["seats"] if seat["action"] != ACTION_CASH]
        self.assertEqual(len(seated), 3)
        self.assertEqual(result["cashSeats"], 7)

    def test_the_cap_is_recorded_on_the_candidate_it_stopped(self) -> None:
        sectors = {f"T{index + 1:02d}": "银行" for index in range(20)}
        result = select(
            ranking(), records(), {}, {}, SelectionConfig(max_per_sector=1, sectors=sectors)
        )
        blocked = [gate for gate in result["gates"] if GATE_SECTOR_CAP in gate["softReasons"]]
        self.assertTrue(blocked)


class ExposureTest(unittest.TestCase):
    def test_a_neutral_market_deploys_the_whole_book(self) -> None:
        self.assertEqual(exposure_factor(8.0), 1.0)

    def test_a_weak_market_deploys_less(self) -> None:
        self.assertLess(exposure_factor(2.0), exposure_factor(8.0))

    def test_a_defensive_posture_deploys_less(self) -> None:
        self.assertLess(exposure_factor(8.0, "defensive"), exposure_factor(8.0))

    def test_an_unset_posture_changes_nothing(self) -> None:
        self.assertEqual(exposure_factor(8.0, ""), 1.0)

    def test_exposure_never_reorders_the_cross_section(self) -> None:
        """A global dial changes how much is deployed, never which names rank."""
        full = allocate(select(ranking(), records(), {}, {}), 1.0)
        half = allocate(select(ranking(), records(), {}, {}), 0.5)
        self.assertEqual(
            [seat["ticker"] for seat in full["seats"]],
            [seat["ticker"] for seat in half["seats"]],
        )

    def test_allocations_add_up_with_the_rest_held_as_cash(self) -> None:
        result = allocate(select(ranking(), records(), {}, {}), 0.8)
        self.assertEqual(result["investedPct"], 80.0)
        self.assertEqual(result["cashReservePct"], 20.0)

    def test_a_cash_seat_is_a_full_seat_of_cash(self) -> None:
        thin = ranking(20, **{f"T{index:02d}": {"consensusTotal": 4.0} for index in range(2, 21)})
        result = allocate(select(thin, records(), {}, {}), 1.0)
        cash = [seat for seat in result["seats"] if seat["action"] == ACTION_CASH]
        self.assertEqual(cash[0]["allocation_pct"], 10.0)
        self.assertEqual(result["investedPct"], 10.0)


class CarryForwardTest(unittest.TestCase):
    def test_nothing_new_is_bought_when_the_committee_could_not_run(self) -> None:
        result = carry_forward({"T01": 1, "T02": 2}, {})
        self.assertFalse(result["allowNewBuys"])
        self.assertEqual(
            [seat["action"] for seat in result["seats"][:2]], [ACTION_PAUSE, ACTION_PAUSE]
        )
        self.assertEqual(result["cashSeats"], 8)

    def test_an_untradeable_holding_becomes_cash_rather_than_a_recommendation(self) -> None:
        result = carry_forward({"T01": 1, "T02": 2}, {"T01": ["SUSPENDED"]})
        self.assertEqual([seat["ticker"] for seat in result["seats"]][0], "T02")
        self.assertEqual(result["cashSeats"], 9)
        self.assertEqual(result["droppedHoldings"][0]["ticker"], "T01")

    def test_with_no_history_the_whole_book_is_cash(self) -> None:
        result = carry_forward({}, {})
        self.assertEqual(result["cashSeats"], 10)


if __name__ == "__main__":
    unittest.main()
