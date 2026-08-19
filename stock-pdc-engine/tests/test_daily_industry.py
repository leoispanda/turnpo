"""Industry-map parsing stays deterministic and refuses ambiguous membership."""

from __future__ import annotations

import unittest

from stock_pdc.sustainable.daily.industry import (
    IndustrySourceError,
    build_mapping,
    extract_category_nodes,
    ticker_from_symbol,
)


class NodeTreeTest(unittest.TestCase):
    def test_the_live_tree_shape_is_found_without_a_fixed_position(self) -> None:
        tree = ["root", [["A股", [["申万一级", [["银行", "", "sw1_bank"]]]]]]]
        self.assertEqual(extract_category_nodes(tree), [("银行", "sw1_bank")])

    def test_sina_symbols_use_the_repository_ticker_shape(self) -> None:
        self.assertEqual(ticker_from_symbol("sh600000"), "600000.SH")
        self.assertEqual(ticker_from_symbol("sz000001"), "000001.SZ")
        self.assertEqual(ticker_from_symbol("bj920001"), "920001.BJ")
        self.assertEqual(ticker_from_symbol("nonsense"), "")


class MappingTest(unittest.TestCase):
    def test_mapping_is_limited_to_the_a_share_universe(self) -> None:
        universe = [{"symbol": "sh600000"}, {"symbol": "sz000001"}]
        mapping, missing = build_mapping(
            universe,
            {
                "银行": [{"symbol": "sh600000"}, {"symbol": "hk00005"}],
                "非银金融": [],
            },
        )
        self.assertEqual(mapping, {"600000.SH": "银行"})
        self.assertEqual(missing, ["000001.SZ"])

    def test_cross_industry_duplicates_are_rejected(self) -> None:
        universe = [{"symbol": "sh600000"}]
        with self.assertRaises(IndustrySourceError):
            build_mapping(
                universe,
                {"银行": [{"symbol": "sh600000"}], "综合": [{"symbol": "sh600000"}]},
            )


if __name__ == "__main__":
    unittest.main()
