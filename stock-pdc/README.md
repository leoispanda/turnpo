# Stock PDC v2

## Rule

Stock PDC now follows a strict three-step flow:

1. `Hawkeye Radar` filters the A-share universe down to a candidate pool.
2. `PDC` scores and ranks only those radar-selected candidates.
3. `Top 20` is the target portfolio.

The system does not use `final_status` to decide whether to buy. Status and action-style labels are retained only as research metadata.

## Portfolio Decision

- Buy: names that enter today's Top 20.
- Hold: names that remain in today's Top 20.
- Review for exit: names that drop out of today's Top 20.
- Exception: if a dropped name is up on the signal day, mark `HOLD_DROPPED_UP_DAY / 上涨不卖`.

The intended portfolio behavior is to stay aligned with the highest-ranked 20 names.

## Research Retention

Even though Top 20 is the only decision output, all factor information is preserved for later analysis:

- market regime
- trend
- Livermore breakout
- volume-price
- candlestick
- overheat
- risk
- Zhuge Orion
- final chair

Reasons, warnings, main risk, and historical rank changes remain in the exported data so the model can be reweighted later based on actual outcomes.
