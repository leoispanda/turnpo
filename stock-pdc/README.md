# Stock PDC Rank Flow

This folder powers the private Turnpo page at `/stock-pdc/`.

It renders a private color-only matrix view of the local Stock PDC Top 20 outputs:

- The vertical axis is rank `#1` through `#20`, followed by ten dropped-out reserve slots.
- The horizontal axis is refresh date plus weekday, newest to oldest from left to right.
- Each cell shows the stock that held that rank on that date.
- Each stock cell also shows the stock's same-day close-to-close percentage move from the local OHLCV data.
- Empty refresh days and weekend refresh files are skipped.
- Cell colors encode movement: red for new/up, green for down, blue for unchanged, gray for dropped out of the Top 20.
- The bottom return row starts from 100% and compounds each trading day's equal-weight Top 20 average return.
- The page intentionally hides summary cards, filters, explanatory panels, and exit tables.

The page reads:

```text
stock-pdc/rank-flow.json
```

Refresh the JSON snapshot from the local Financial Freedom project with:

```bash
node scripts/sync-stock-pdc-rank-flow.mjs
```

Default source project:

```text
/Users/leoyang/Documents/financial freedom/stock-pdc-local
```

Historical PDC replay backfills are stored in:

```text
stock-pdc/backfill/daily_watchlists
```

The sync script merges those backfills with the Financial Freedom daily watchlists by date. Backfill rows are generated from `scripts/run_historical_replay.py`; the June/July 2026 gap uses a wider `--radar-max-daily-move 15` replay so each missing workday has a full Top 20.

The Cloudflare Pages Function at `functions/stock-pdc/[[path]].js` protects `/stock-pdc/*`. It uses:

```text
STOCK_PDC_ACCESS_CODE
```

If `STOCK_PDC_ACCESS_CODE` is not set, it falls back to:

```text
EMBA_ACCESS_CODE=emba2026
```
