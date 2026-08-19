"""DAILY_TOP10: the two-seat daily path that ends in exactly ten seats.

The full-pool committee in :mod:`stock_pdc.sustainable` scores every Hawkeye
survivor on nine dimensions twice and then re-examines every disputed dimension.
That run is worth having as an audit, but it costs thirteen calls per seat for
Round 1 alone and roughly an hour of Round 2, which no daily job can afford.

This package is the daily shape instead:

    hard eligibility → two independent Top 30s → union (30–60)
    → nine-dimension detail on that union → preliminary Top 20
    → anonymised cross review → deterministic consensus → exactly 10 seats

Every seat call is budgeted: at most four per model per day, recorded in a
ledger. Nothing here places an order, logs in anywhere, or reads a credential.
"""

RUNTIME_MODE = "DAILY_TOP10"

# The offline audit path keeps its own name so an artifact can never be mistaken
# for the other one's output.
FULL_COMMITTEE_MODE = "FULL_COMMITTEE"
