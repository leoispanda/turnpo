# Stock PDC display

The main `/stock-pdc/` page displays the published SUS PDC research artifact
`daily-top10.json`, merged with historical `rank-flow.json`. The website does
not score securities, approve decisions, or place trades. Current production
research is run in the separate `stock-pdc-local` project through
`scripts/run_sus_pdc.py` with the SUSTAINABLE profile.

## Latest portfolio advice

The action panel reads `portfolioAdvice` for `latestDate`:

- Buy: a new candidate explicitly marked `BUY`, with `entryReadiness=REVIEWED`
  and `scenarioStatus=SCENARIO_PASS`. Ranking alone never creates a buy.
- Continue holding: `hold` plus `sellWatch`. Watch positions remain held and
  are visibly marked as awaiting an exit signal.
- Sell: only the `sell` group, shown as requiring manual confirmation.
- Candidate watch: new candidates that have not met the buy conditions.
- Data review: holdings whose information still needs verification.

Counts are derived from these groups. Legacy `actions.counts.sell` can include
watch positions and must not be used to infer confirmed exits. Missing advice
for the latest date is shown as unavailable; older advice is not substituted.

## Ranking badges

`NEW` means `changeType=NEW`: absent from the preceding published list. It is
independent of the holding badge, which represents `isHeld=true` in that
date's frozen snapshot. A row may display both badges. Historical badges do
not assert the user's current holdings.

The page displays existing research decisions. It does not change holding
periods, signal confirmation rules, fees, frozen rankings, or manual gates.

## Verification

Run the delivery and rank-flow checks after display changes:

```bash
node tests/stock-pdc-daily-delivery.test.mjs
node tests/stock-pdc-rank-flow-static.test.mjs
```

Inspect the rendered page, then verify the Cloudflare Pages deployment for
the exact published Git commit. Legacy local-server and Top 20 flows in this
repository are not the current SUS production entrypoint.

## Selection follow-up

The price colors and percentages show the next market session after selection.
New lists show pending. `signalDayChangePct` is never used as a performance
fallback. The canonical `selectionFollowUp` feed joins the frozen list by
signal date, ticker and original rank; it keeps losses and missing prices.
The previous-list panel shows the equal-weight price change, frozen benchmark,
excess percentage points and rising-name count. Its main measure is signal
close to next-session close; next open to close is shown separately. These
observations exclude fees and are not account returns or trade approvals.
Completed cohorts are immutable. Missing prices or a changed price basis stay
explicitly unavailable; an incomplete cohort has no whole-list mean.

Legacy rank-flow values are shown only when their declared forward method and
outcome date establish a next-session observation. The old cumulative series
is not presented as the current SUS performance summary.

Also run `node tests/stock-pdc-forward-observations.test.mjs`.

Historical backfill is carried in the separate `selectionHistoryFollowUp`
version (`same_frozen_snapshot_signal_close_to_next_market_session_close_v1`).
Both price endpoints come from one verified frozen observation snapshot; the
original signal facts and `selectionFollowUp` version remain unchanged. The
renderer joins original dates/tickers/ranks and prefers this paired-price feed.
The history panel calculates complete daily list means, benchmark-paired excess,
coverage and rising-stock counts separately for SUS and legacy records. It never
pools incomplete lists or presents sampled dates as a continuous account return.
Historical publication timing and rule changes remain explicit limitations.
