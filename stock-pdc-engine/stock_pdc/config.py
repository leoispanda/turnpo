DEFAULT_WEIGHTS = {
    "market_regime": 0.09,
    "trend": 0.18,
    "livermore": 0.17,
    "volume_price": 0.14,
    "candlestick": 0.08,
    "overheat": 0.11,
    "risk": 0.18,
    "zhuge_orion": 0.02,
    "chair": 0.03,
}

ZHUGE_CHAIR_WEIGHT_BUDGET = 0.05


def pdc_weights_with_zhuge(zhuge_weight: float | None = None) -> dict[str, float]:
    """Return normalized experiment weights funded from the Chair budget."""
    weights = dict(DEFAULT_WEIGHTS)
    if zhuge_weight is None:
        return weights
    if not 0.0 <= zhuge_weight <= ZHUGE_CHAIR_WEIGHT_BUDGET:
        raise ValueError(
            f"Zhuge weight must be between 0 and {ZHUGE_CHAIR_WEIGHT_BUDGET:.2f}."
        )
    weights["zhuge_orion"] = round(zhuge_weight, 10)
    weights["chair"] = round(ZHUGE_CHAIR_WEIGHT_BUDGET - zhuge_weight, 10)
    return weights

SCORER_LABELS = {
    "market_regime": "Market Regime Judge",
    "trend": "Trend Follower",
    "livermore": "Livermore Breakout Trader",
    "volume_price": "Volume-Price Analyst",
    "candlestick": "Candlestick Pattern Analyst",
    "overheat": "Mean Reversion / Overheat Auditor",
    "risk": "Risk Manager",
    "zhuge_orion": "Zhuge Orion",
    "chair": "Final Portfolio Chair",
}

ACTION_STATUSES = [
    "Strong Watch",
    "Watch",
    "Breakout Pending",
    "Wait for Pullback",
    "Trial Position",
    "High Risk Watch",
    "Remove",
]

BENCHMARK_PRIORITY = ["CSI300ETF", "CSI300", "SPY", "QQQ", "DIA", "IWM", "VOO", "^GSPC", "SPX"]

ENABLE_LIVE_ORDERS = False

DEFAULT_DATA_DIR = "data/prices"
DEFAULT_OUTPUTS_DIR = "outputs"
DEFAULT_METADATA_CSV = "outputs_a_share/a_share_universe.csv"

# Hawkeye is a broad pre-PDC universe filter. Trend, volume, overheat, and
# risk are evaluated by PDC members after this step.
HAWKEYE_MIN_MARKET_CAP_CNY = 30_000_000_000
HAWKEYE_MIN_RETURN_60D_PCT = 5.0
HAWKEYE_MAX_DAILY_MOVE_PCT = 8.0
HAWKEYE_DAILY_MOVE_LOOKBACK = 1
HAWKEYE_MIN_BARS = 200

DEFAULT_SELECTION_GATE_MIN_CANDIDATES = 20
DEFAULT_SELECTION_GATE_MIN_PDC_POOL = 20
DEFAULT_SELECTION_GATE_PDC_POOL_SIZE = 30

DEFAULT_ZHUGE_ORION_PROFILE = {
    "birth_bazi": "",
    "fortune_note": "",
    "posture": "",
    "mode": "manual",
    "tail_decimals": 3,
}

SKILL_ALIASES = {
    "market": "market_regime",
    "market_regime": "market_regime",
    "market-regime": "market_regime",
    "market_regime_judge": "market_regime",
    "trend": "trend",
    "trend_follower": "trend",
    "livermore": "livermore",
    "breakout": "livermore",
    "livermore_breakout": "livermore",
    "livermore_breakout_trader": "livermore",
    "volume": "volume_price",
    "volume_price": "volume_price",
    "volume-price": "volume_price",
    "volume_price_analyst": "volume_price",
    "candle": "candlestick",
    "candlestick": "candlestick",
    "candlestick_pattern": "candlestick",
    "candlestick_pattern_analyst": "candlestick",
    "kline": "candlestick",
    "overheat": "overheat",
    "overheat_auditor": "overheat",
    "risk": "risk",
    "risk_manager": "risk",
    "zhuge": "zhuge_orion",
    "orion": "zhuge_orion",
    "zhuge_orion": "zhuge_orion",
    "zhuge-orion": "zhuge_orion",
    "personal": "zhuge_orion",
    "personal_posture": "zhuge_orion",
    "chair": "chair",
    "final": "chair",
    "final_portfolio_chair": "chair",
}
