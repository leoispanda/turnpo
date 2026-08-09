from __future__ import annotations

import unittest
from unittest.mock import patch

from scripts.fetch_a_share_eastmoney import fetch_candidates


class EastmoneyUniverseTests(unittest.TestCase):
    def test_fetches_every_reported_page_and_keeps_bse(self) -> None:
        pages = [
            {
                "data": {
                    "total": 3,
                    "diff": [
                        {"f12": "600001", "f14": "上海样本", "f2": "10", "f20": "50000000000"},
                        {"f12": "000001", "f14": "深圳样本", "f2": "11", "f20": "40000000000"},
                    ],
                }
            },
            {
                "data": {
                    "total": 3,
                    "diff": [{"f12": "800001", "f14": "北交所样本", "f2": "12", "f20": "3000000000"}],
                }
            },
        ]
        with patch("scripts.fetch_a_share_eastmoney._fetch_json", side_effect=pages) as fetch:
            candidates = fetch_candidates()

        self.assertEqual(fetch.call_count, 2)
        self.assertEqual([candidate.ticker for candidate in candidates], ["600001.SH", "000001.SZ", "800001.BJ"])

    def test_fails_closed_when_a_page_is_missing(self) -> None:
        page = {"data": {"total": 2, "diff": [{"f12": "600001", "f14": "上海样本"}]}}
        empty_page = {"data": {"total": 2, "diff": []}}
        with patch("scripts.fetch_a_share_eastmoney._fetch_json", side_effect=[page, empty_page]):
            with self.assertRaisesRegex(RuntimeError, "empty page"):
                fetch_candidates()


if __name__ == "__main__":
    unittest.main()
