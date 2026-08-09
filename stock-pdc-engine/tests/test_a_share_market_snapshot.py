from __future__ import annotations

import unittest
from unittest.mock import patch

from scripts import fetch_a_share_eastmoney as fetcher


def _row(code: str, name: str) -> dict[str, object]:
    return {
        "f12": code,
        "f14": name,
        "f2": 10,
        "f3": 1,
        "f6": 1000,
        "f8": 2,
        "f9": 10,
        "f20": 40_000_000_000,
        "f21": 20_000_000_000,
        "f23": 1,
    }


class AShareMarketSnapshotTests(unittest.TestCase):
    def test_market_list_fetches_every_page_without_a_static_fallback(self) -> None:
        calls: list[dict[str, object]] = []
        first_page = [_row(f"60{index:04d}", f"沪股{index}") for index in range(100)]
        payloads = {
            1: {"data": {"total": 101, "diff": first_page}},
            2: {"data": {"total": 101, "diff": [_row("830001", "北交所")]}},
        }

        def fake_fetch(_url: str, params: dict[str, object], **_kwargs: object) -> dict[str, object]:
            calls.append(params)
            return payloads[int(params["pn"])]

        with patch.object(fetcher, "_fetch_json", side_effect=fake_fetch), patch.object(fetcher.time, "sleep"):
            candidates = fetcher.fetch_candidates()

        self.assertEqual(len(candidates), 101)
        self.assertEqual(candidates[-1].ticker, "830001.BJ")
        self.assertEqual([call["pn"] for call in calls], [1, 2])
        self.assertIn("m:0+t:81+s:2048", str(calls[0]["fs"]))
        parser = fetcher.build_parser()
        self.assertFalse(hasattr(parser.parse_args([]), "preset_only"))
        self.assertFalse(hasattr(parser.parse_args([]), "min_mcap"))

    def test_missing_list_page_fails_instead_of_returning_a_partial_universe(self) -> None:
        payloads = {
            1: {"data": {"total": 101, "diff": [_row("600001", "沪股")] }},
            2: {"data": {"total": 101, "diff": []}},
        }

        with patch.object(fetcher, "_fetch_json", side_effect=lambda _url, params, **_kwargs: payloads[params["pn"]]):
            with self.assertRaisesRegex(RuntimeError, "empty page"):
                fetcher.fetch_candidates()


if __name__ == "__main__":
    unittest.main()
