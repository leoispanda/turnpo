from __future__ import annotations

from dataclasses import dataclass, field

from .broker_base import BrokerOrder


@dataclass
class PaperBroker:
    orders: list[BrokerOrder] = field(default_factory=list)

    def place_order(self, order: BrokerOrder) -> BrokerOrder:
        self.orders.append(order)
        return order
