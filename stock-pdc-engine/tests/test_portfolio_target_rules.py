from __future__ import annotations

import unittest

from stock_pdc.models import ScorerResult, StockEvaluation
from stock_pdc.portfolio import build_position_monitor_rows
from stock_pdc.quotes import LiveQuote


def _evaluation(ticker: str, rank: int, trend_score: float, technical_stop: float = 9.0) -> StockEvaluation:
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
    scores["trend"] = ScorerResult(trend_score, "test trend")
    return StockEvaluation(
        ticker=ticker,
        final_score=7.0,
        rank=rank,
        status="Watch",
        suggested_action="Watch",
        scores=scores,
        short_reason="test",
        main_risk="test",
        latest_date="2026-07-20",
        latest_close=10.0,
        technical_stop=technical_stop,
    )


def _position(ticker: str) -> dict[str, str]:
    return {"position_id": f"position-{ticker}", "ticker": ticker, "status": "OPEN"}


def _quote(ticker: str, price: float) -> LiveQuote:
    return LiveQuote(
        ticker=ticker,
        name=ticker,
        price=price,
        pct_change=0.0,
        price_change=0.0,
        high=price,
        low=price,
        open=price,
        previous_close=price,
        volume=None,
        amount=None,
        source="test",
        asof="2026-07-20T15:00:00+08:00",
        status="VERIFIED",
    )


class PortfolioTargetRulesTests(unittest.TestCase):
    def test_only_buy_targets_are_held_without_a_trend_exception(self) -> None:
        evaluations = [
            _evaluation("600001.SH", 1, 5.0),
            _evaluation("600002.SH", 21, 8.0),
            _evaluation("600003.SH", 5, 5.0),
        ]
        positions = [_position(evaluation.ticker) for evaluation in evaluations]
        quotes = {evaluation.ticker: _quote(evaluation.ticker, 10.0) for evaluation in evaluations}

        rows = build_position_monitor_rows(
            positions,
            evaluations,
            quotes,
            "2026-07-20",
            buy_target_tickers={"600001.SH"},
        )
        actions = {row["ticker"]: row["sell_instruction"] for row in rows}

        self.assertEqual(actions["600001.SH"], "HOLD_BUY_TARGET")
        self.assertEqual(actions["600002.SH"], "HOLD_DROPPED_UPTREND")
        self.assertEqual(actions["600003.SH"], "SELL_AT_NEXT_OPEN_NOT_BUY_TARGET")

    def test_broken_technical_stop_removes_the_uptrend_exception(self) -> None:
        evaluation = _evaluation("600001.SH", 21, 8.0, technical_stop=9.0)
        row = build_position_monitor_rows(
            [_position(evaluation.ticker)],
            [evaluation],
            {evaluation.ticker: _quote(evaluation.ticker, 8.9)},
            "2026-07-20",
            buy_target_tickers=set(),
        )[0]

        self.assertEqual(row["sell_instruction"], "SELL_AT_NEXT_OPEN_NOT_BUY_TARGET")


if __name__ == "__main__":
    unittest.main()
