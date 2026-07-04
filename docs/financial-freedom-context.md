# Financial Freedom Context

This document is the Turnpo-side bridge to Leo's local Financial Freedom / Stock PDC project.

Use this file when the user says things like:

- "financial freedom"
- "股票大作手"
- "Stock PDC"
- "鹰眼雷达"
- "Top 20 watchlist"
- "financial freedom 的文档"

## Source Project

Canonical local root:

```text
/Users/leoyang/Documents/financial freedom
```

Main project:

```text
/Users/leoyang/Documents/financial freedom/stock-pdc-local
```

Primary README:

```text
/Users/leoyang/Documents/financial freedom/stock-pdc-local/README.md
```

The source project contains code, market data, outputs, reports, and portfolio-monitoring CSVs. Do not copy all data files into Turnpo by default. Treat this document as an index and bridge.

## What It Is

`stock-pdc-local` is a local stock research and tracking system.

It is designed for:

- Local analysis
- Watchlist generation
- Paper records
- Portfolio monitoring
- Historical replay and review
- Manual human review before any decision

It is explicitly not designed to place live trades. The source README states that live orders are disabled and the system does not connect to a real brokerage account.

## Core Architecture

Main orchestrator:

```text
stock_pdc/pdc_orchestrator.py
```

CLI entrypoints:

```text
run.py
main.py
scripts/run_pdc.py
scripts/run_latest_pdc.py
scripts/run_historical_replay.py
```

Pre-PDC candidate scout:

```text
stock_pdc/hawkeye_radar.py
```

PDC member scorers:

```text
stock_pdc/scorers/market_regime_judge.py
stock_pdc/scorers/trend_follower.py
stock_pdc/scorers/livermore_breakout_trader.py
stock_pdc/scorers/volume_price_analyst.py
stock_pdc/scorers/candlestick_pattern_analyst.py
stock_pdc/scorers/overheat_auditor.py
stock_pdc/scorers/risk_manager.py
stock_pdc/scorers/zhuge_orion.py
stock_pdc/scorers/final_portfolio_chair.py
```

The PDC committee members are:

- Market Regime Judge
- Trend Follower
- Livermore Breakout Trader
- Volume-Price Analyst
- Candlestick Pattern Analyst
- Overheat Auditor
- Risk Manager
- Zhuge Orion
- Final Portfolio Chair

## Important Data And Output Directories

Sample / US ticker data:

```text
/Users/leoyang/Documents/financial freedom/stock-pdc-local/data
```

A-share data:

```text
/Users/leoyang/Documents/financial freedom/stock-pdc-local/data_a_share
/Users/leoyang/Documents/financial freedom/stock-pdc-local/data_a_share_latest_2026_07_03
```

Main outputs:

```text
/Users/leoyang/Documents/financial freedom/stock-pdc-local/outputs
```

Portfolio monitor:

```text
/Users/leoyang/Documents/financial freedom/stock-pdc-local/portfolio
```

Universe metadata:

```text
/Users/leoyang/Documents/financial freedom/stock-pdc-local/outputs_a_share/a_share_universe.csv
/Users/leoyang/Documents/financial freedom/stock-pdc-local/outputs_a_share_live_mcap/a_share_universe.csv
```

Common output files:

```text
outputs/a_share_top20.xlsx
outputs/candidate_universe.csv
outputs/full_pdc_scores.csv
outputs/hawkeye_radar_audit.csv
outputs/scoring_history.csv
outputs/pdc_report.html
outputs/leaderboard.html
outputs/daily_watchlists/watchlist_YYYY-MM-DD.csv
outputs/daily_leaderboard_changes/leaderboard_changes_YYYY-MM-DD.csv
outputs/leaderboard_changes_history.csv
outputs/daily_purchase_instruction.csv
portfolio/positions.csv
portfolio/position_monitor.csv
portfolio/position_monitor_history.csv
```

## Common Commands

Run the full PDC loop with Hawkeye Radar:

```bash
cd "/Users/leoyang/Documents/financial freedom/stock-pdc-local"
python scripts/run_pdc.py --top 20 --use-radar
```

Run latest A-share data refresh and PDC:

```bash
cd "/Users/leoyang/Documents/financial freedom/stock-pdc-local"
python scripts/run_latest_pdc.py --top 20
```

Run PDC against an existing data directory:

```bash
cd "/Users/leoyang/Documents/financial freedom/stock-pdc-local"
python scripts/run_latest_pdc.py --skip-fetch --run-dir data_a_share_latest_2026_07_03 --top 20
```

Run only Hawkeye Radar:

```bash
cd "/Users/leoyang/Documents/financial freedom/stock-pdc-local"
python main.py --radar-only
```

Analyze one ticker with one skill:

```bash
cd "/Users/leoyang/Documents/financial freedom/stock-pdc-local"
python main.py --ticker 600519.SH --skill trend
python main.py --ticker 600519.SH --skill risk
python main.py --ticker 600519.SH --skill zhuge
```

Analyze one ticker with all PDC members:

```bash
cd "/Users/leoyang/Documents/financial freedom/stock-pdc-local"
python main.py --ticker 600519.SH --all-skills
```

Run historical replay:

```bash
cd "/Users/leoyang/Documents/financial freedom/stock-pdc-local"
python scripts/run_historical_replay.py --start 2025-08-01 --end 2026-06-26 --top 20 --hold-days 1,5,10,20 --trailing-stop-pct 10
```

## Key CLI Options

`scripts/run_pdc.py` / `main.py` supports:

```text
--data-dir / --universe
--outputs-dir
--top
--ticker
--skill
--all-skills
--pdc-loop
--use-radar
--radar-only
--metadata-csv
--radar-min-mcap
--radar-min-return-60d
--radar-max-daily-move
--radar-daily-lookback
--radar-min-bars
--min-candidate-count
--min-pdc-pool-size
--disable-selection-gate
--benchmark
--include-benchmark
--as-of
--list-skills
--zhuge-bazi
--zhuge-fortune
--zhuge-posture
```

`scripts/run_latest_pdc.py` supports:

```text
--top
--candidate-count
--source tencent|eastmoney
--bars
--min-amount
--min-mcap
--min-bars
--benchmark
--outputs-dir
--run-dir
--as-of
--skip-fetch
```

`scripts/run_historical_replay.py` supports:

```text
--start
--end
--top
--hold-days
--data-dir
--benchmark
--min-bars
--metadata-csv
--outputs-dir
--trailing-stop-pct
--min-candidate-count
--min-pdc-pool-size
--pdc-pool-size
--radar-min-mcap
--radar-min-return-60d
--radar-max-daily-move
--radar-daily-lookback
--radar-min-bars
--entry-instructions
--entry-min-overheat-score
--allocation-mode cash_split|slot_equal
--limit-trade-model none|conservative
--limit-tolerance-pct
--ignore-market-cap-filter
```

## Safety Notes

Keep these constraints in mind:

- This project is research-only unless Leo explicitly changes that policy.
- Do not ask for or store broker passwords, trading passwords, SMS codes, UKey credentials, cookies, certificates, or API tokens.
- Do not use GUI automation for real brokerage actions.
- Do not represent PDC output as financial advice.
- Treat recommendations as watchlist / research / manual-review material.
- If current market data is needed, verify the data date and source before interpreting results.

## Turnpo Usage Convention

When working from the Turnpo workspace and the user asks to use Financial Freedom:

1. Read this file first.
2. Use `/Users/leoyang/Documents/financial freedom/stock-pdc-local` as the project root.
3. Read the relevant source README or script before running anything.
4. Prefer read-only inspection and reporting unless the user explicitly asks to run/update outputs.
5. If a command writes inside the Financial Freedom directory, request/confirm the needed filesystem permission if the sandbox blocks it.
6. For web/current-market claims, verify dates carefully. The local data may be stale.

## Turnpo Rank Flow Page

Private Turnpo page:

```text
/stock-pdc/
```

Turnpo-side files:

```text
stock-pdc/index.html
stock-pdc/stock-pdc.css
stock-pdc/stock-pdc.js
stock-pdc/rank-flow.json
scripts/sync-stock-pdc-rank-flow.mjs
functions/stock-pdc/[[path]].js
```

To refresh the page snapshot after Stock PDC generates daily Top 20 outputs:

```bash
node scripts/sync-stock-pdc-rank-flow.mjs
```

The sync script reads:

```text
outputs/daily_watchlists/watchlist_YYYY-MM-DD.csv
outputs/daily_leaderboard_changes/leaderboard_changes_YYYY-MM-DD.csv
```

It writes:

```text
stock-pdc/rank-flow.json
```

## Quick Phrases

User phrase mapping:

- "跑一下股票大作手" -> run or inspect the Stock PDC loop.
- "鹰眼雷达" -> inspect/run `stock_pdc/hawkeye_radar.py` or `--radar-only`.
- "Top 20" -> inspect latest `outputs/a_share_top20.xlsx`, `outputs/daily_watchlists/`, or run `scripts/run_pdc.py --top 20`.
- "leaderboard" -> inspect `outputs/leaderboard.html` and leaderboard change CSVs.
- "持仓监控" -> inspect `portfolio/position_monitor.csv` and `portfolio/positions.csv`.
- "回测/历史回推" -> use `scripts/run_historical_replay.py`.
