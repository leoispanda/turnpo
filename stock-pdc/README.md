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
