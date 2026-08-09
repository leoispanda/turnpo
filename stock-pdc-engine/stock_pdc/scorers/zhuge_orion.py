from __future__ import annotations

from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from ..models import Bar, ScorerResult

POSTURE_SCORES = {
    "aggressive": (
        7.6,
        "personal cycle posture allows measured offense",
        "do not override market, risk, or overheat vetoes",
    ),
    "balanced": (
        6.3,
        "personal cycle posture supports balanced risk-taking",
        "",
    ),
    "neutral": (
        5.5,
        "personal cycle posture is neutral",
        "",
    ),
    "conservative": (
        4.2,
        "personal cycle posture favors caution and slower execution",
        "avoid aggressive sizing and wait for cleaner confirmation",
    ),
    "defensive": (
        3.4,
        "personal cycle posture favors capital protection",
        "cap offensive statuses until personal risk posture improves",
    ),
}

AGGRESSIVE_WORDS = {
    "aggressive",
    "attack",
    "offense",
    "strong",
    "advance",
    "risk-on",
    "upcycle",
    "smooth",
}

CONSERVATIVE_WORDS = {
    "conservative",
    "defensive",
    "caution",
    "weak",
    "risk-off",
    "drawdown",
    "volatile",
    "protect",
}

TAIL_DIGIT_ELEMENTS = {
    1: "water",
    6: "water",
    2: "fire",
    7: "fire",
    3: "wood",
    8: "wood",
    4: "metal",
    9: "metal",
    0: "earth",
    5: "earth",
}

ELEMENT_POSTURES = {
    "fire": "aggressive",
    "wood": "balanced",
    "earth": "neutral",
    "metal": "conservative",
    "water": "defensive",
}

ALLOWED_MODES = {"manual", "close_tail_five_elements"}


def _normalize_posture(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    normalized = value.strip().lower().replace(" ", "_").replace("-", "_")
    aliases = {
        "offensive": "aggressive",
        "risk_on": "aggressive",
        "steady": "balanced",
        "middle": "balanced",
        "normal": "neutral",
        "careful": "conservative",
        "stable": "conservative",
        "protective": "defensive",
        "risk_off": "defensive",
    }
    normalized = aliases.get(normalized, normalized)
    if normalized in POSTURE_SCORES:
        return normalized
    return None


def _derive_posture_from_note(note: str) -> str | None:
    normalized = note.lower()
    aggressive_hits = sum(1 for word in AGGRESSIVE_WORDS if word in normalized)
    conservative_hits = sum(1 for word in CONSERVATIVE_WORDS if word in normalized)
    if aggressive_hits > conservative_hits:
        return "aggressive"
    if conservative_hits > aggressive_hits:
        return "conservative"
    return None


def _normalize_mode(value: object) -> str:
    if not isinstance(value, str):
        return "manual"
    normalized = value.strip().lower().replace("-", "_").replace(" ", "_")
    return normalized if normalized in ALLOWED_MODES else "manual"


def _close_tail_signal(
    market_context: dict[str, object],
    decimals: int,
) -> tuple[str | None, dict[str, object]]:
    latest_close = market_context.get("latest_close")
    benchmark = market_context.get("benchmark")
    if latest_close is None or not benchmark:
        return None, {"error": "benchmark close is unavailable"}
    if not 0 <= decimals <= 6:
        return None, {"error": f"tail decimals {decimals} is outside 0..6"}
    try:
        quantum = Decimal(1).scaleb(-decimals)
        normalized_close = Decimal(str(latest_close)).quantize(quantum, rounding=ROUND_HALF_UP)
    except (InvalidOperation, ValueError):
        return None, {"error": f"invalid benchmark close {latest_close}"}
    scaled = int((abs(normalized_close) * (Decimal(10) ** decimals)).to_integral_value())
    tail_digit = scaled % 10
    element = TAIL_DIGIT_ELEMENTS[tail_digit]
    posture = ELEMENT_POSTURES[element]
    return posture, {
        "benchmark": str(benchmark),
        "latest_close": format(normalized_close, f".{decimals}f"),
        "tail_digit": tail_digit,
        "element": element,
        "decimals": decimals,
    }


def score(
    ticker: str,
    bars: list[Bar],
    market_context: dict[str, object],
    previous_scores: dict[str, ScorerResult] | None = None,
) -> ScorerResult:
    profile = market_context.get("zhuge_orion")
    if not isinstance(profile, dict):
        profile = {}

    birth_bazi = str(profile.get("birth_bazi") or "").strip()
    fortune_note = str(profile.get("fortune_note") or "").strip()
    posture = _normalize_posture(profile.get("posture"))
    mode = _normalize_mode(profile.get("mode"))
    try:
        tail_decimals = int(profile.get("tail_decimals", 3))
    except (TypeError, ValueError):
        tail_decimals = 3
    derived_from_note = False
    derived_from_close_tail = False
    tail_details: dict[str, object] = {}

    if posture is None and mode == "close_tail_five_elements":
        posture, tail_details = _close_tail_signal(market_context, tail_decimals)
        derived_from_close_tail = posture is not None

    if posture is None and fortune_note:
        posture = _derive_posture_from_note(fortune_note)
        derived_from_note = posture is not None

    if posture is None:
        posture = "neutral"

    score_value, reason, warning = POSTURE_SCORES[posture]
    details: list[str] = [reason]
    warnings: list[str] = []
    if warning:
        warnings.append(warning)

    if mode == "close_tail_five_elements":
        if derived_from_close_tail:
            details.append(
                "close-tail five-elements experiment: "
                f"{tail_details['benchmark']} close {tail_details['latest_close']} -> "
                f"tail {tail_details['tail_digit']} -> {tail_details['element']}"
            )
            warnings.append(
                "symbolic close-tail experiment inspired by five-elements numerology; not a traditional Ziwei chart"
            )
        elif tail_details.get("error"):
            warnings.append(f"close-tail posture fallback to neutral: {tail_details['error']}")

    if not birth_bazi and not fortune_note and posture == "neutral":
        details.append("no birth or fortune profile configured")
    elif birth_bazi:
        details.append("birth profile is configured")

    if derived_from_note:
        details.append("posture inferred from fortune note keywords")
    elif derived_from_close_tail:
        details.append("posture derived after the benchmark close for the next research session")
    elif fortune_note:
        details.append("fortune note is recorded but posture is manually set")

    return ScorerResult(score_value, "; ".join(details), "; ".join(dict.fromkeys(warnings)))
