from __future__ import annotations

from .broker_base import BrokerOrder, block_live_order


class QmtAdapter:
    def place_order(self, order: BrokerOrder) -> BrokerOrder:
        block_live_order()
        raise RuntimeError("QMT live order routing is not implemented in this version.")
