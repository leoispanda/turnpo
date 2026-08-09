from __future__ import annotations

from dataclasses import dataclass

from ..config import ENABLE_LIVE_ORDERS


class LiveOrdersDisabledError(RuntimeError):
    pass


@dataclass(frozen=True)
class BrokerOrder:
    ticker: str
    side: str
    quantity: float
    order_type: str = "market"
    limit_price: float | None = None


def block_live_order() -> None:
    if not ENABLE_LIVE_ORDERS:
        raise LiveOrdersDisabledError("Live trading is disabled: ENABLE_LIVE_ORDERS=false.")
