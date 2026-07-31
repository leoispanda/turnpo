import assert from "node:assert/strict";
import fs from "node:fs";

const indexHtml = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const redirects = fs.readFileSync(new URL("../_redirects", import.meta.url), "utf8");
const headers = fs.readFileSync(new URL("../_headers", import.meta.url), "utf8");
const stockHtml = fs.readFileSync(new URL("../stock-pdc/index.html", import.meta.url), "utf8");
const stockJs = fs.readFileSync(new URL("../stock-pdc/stock-pdc.js", import.meta.url), "utf8");
const syncScript = fs.readFileSync(new URL("../scripts/sync-stock-pdc-rank-flow.mjs", import.meta.url), "utf8");
const stockFunction = fs.readFileSync(new URL("../functions/stock-pdc/[[path]].js", import.meta.url), "utf8");
const rankFlow = JSON.parse(fs.readFileSync(new URL("../stock-pdc/rank-flow.json", import.meta.url), "utf8"));

assert.ok(indexHtml.includes('href="/stock-pdc/"'));
assert.ok(redirects.includes("/stock-pdc /stock-pdc/ 301"));
assert.ok(headers.includes("/stock-pdc/*"));

assert.ok(stockHtml.includes("<title>股票大作手行动清单 | Turnpo</title>"));
assert.ok(stockHtml.includes('id="stockRankList"'));
assert.ok(stockHtml.includes("stock-color-wall"));
assert.ok(stockHtml.includes("stock-color-panel"));
assert.ok(stockHtml.includes("stock-rank-matrix-wrap"));
assert.ok(stockHtml.includes("stock-bottom-home-btn"));
assert.ok(stockHtml.includes("回到主页"));
assert.ok(!stockHtml.includes('id="stockDateSelect"'));
assert.ok(!stockHtml.includes('id="stockMatrix"'));
assert.ok(!stockHtml.includes('id="stockFilterTabs"'));
assert.ok(!stockHtml.includes("stock-meta-strip"));
assert.ok(stockHtml.includes("/stock-pdc/stock-pdc.js"));

assert.ok(stockJs.includes('fetch("/stock-pdc/rank-flow.json"'));
assert.ok(stockJs.includes('const STOCK_PASSWORD = "emba2026";'));
assert.ok(stockJs.includes("actionRows"));
assert.ok(stockJs.includes('BUY: { title: "买入"'));
assert.ok(stockJs.includes('HOLD: { title: "保留"'));
assert.ok(stockJs.includes('SELL: { title: "卖出"'));
assert.ok(stockJs.includes("今日无需操作"));
assert.ok(stockJs.includes("其他研究候选和未确认成交计划均已隐藏"));
assert.ok(stockJs.includes("formatPct"));
assert.ok(stockJs.includes("renderActionCard"));
assert.ok(stockJs.includes("renderActionGroup"));
assert.ok(stockJs.includes("renderActionList"));
assert.ok(!stockJs.includes("renderRankList"));
assert.ok(!stockJs.includes("renderDroppedCell"));

assert.ok(syncScript.includes("daily_watchlists"));
assert.ok(syncScript.includes("daily_leaderboard_changes"));
assert.ok(syncScript.includes("BACKFILL_WATCHLIST_DIR"));
assert.ok(syncScript.includes("turnpo-backfill"));
assert.ok(syncScript.includes("priceMoveForTicker"));
assert.ok(syncScript.includes("dayChangePct"));
assert.ok(syncScript.includes("daily_purchase_instruction.csv"));
assert.ok(syncScript.includes("position_monitor.csv"));
assert.ok(syncScript.includes('clean(row.position_status) === "OPEN"'));
assert.ok(syncScript.includes("HOLD_DROPPED_UP_DAY / 上涨不卖"));
assert.ok(syncScript.includes("equal_weight_top20_next_trading_day_close_to_close"));
assert.ok(syncScript.includes("rank-flow.json"));

assert.ok(stockFunction.includes("env.STOCK_PDC_ACCESS_CODE || env.EMBA_ACCESS_CODE"));
assert.ok(stockFunction.includes('const PAGE_PATH = "/stock-pdc";'));
assert.ok(stockFunction.includes("turnpo_stock_pdc_access"));

assert.ok(Array.isArray(rankFlow.days));
assert.ok(rankFlow.days.length > 0);
assert.equal(rankFlow.latestDate, rankFlow.dates.at(-1));
assert.equal(rankFlow.actions.schemaVersion, "stock-pdc-actions-v1");
assert.equal(rankFlow.actions.latestDate, rankFlow.latestDate);
assert.ok(Array.isArray(rankFlow.actions.rows));
assert.ok(rankFlow.actions.rows.every((row) => ["BUY", "HOLD", "SELL"].includes(row.action)));
assert.equal(rankFlow.actions.counts.buy + rankFlow.actions.counts.hold + rankFlow.actions.counts.sell, rankFlow.actions.rows.length);
assert.ok(rankFlow.days.at(-1).rows.length <= 20);
assert.ok(rankFlow.days.at(-1).rows.length > 0);
assert.ok(rankFlow.priceDataDir);
assert.equal(rankFlow.portfolio.method, "equal_weight_top20_next_trading_day_close_to_close");
assert.equal(rankFlow.portfolio.initialValuePct, 100);
assert.ok(Number.isFinite(rankFlow.portfolio.latestReturnPct));
assert.ok(rankFlow.portfolio.daily.length > 0);
assert.ok(rankFlow.days.some((day) => day.rows.some((row) => Number.isFinite(row.dayChangePct))));
assert.ok(rankFlow.days.some((day) => day.rows.some((row) => Number.isFinite(row.signalDayChangePct))));
assert.ok(rankFlow.days.some((day) => Number.isFinite(day.portfolio?.cumulativeReturnPct)));

const backfilledWorkdays = ["2026-06-25", "2026-06-30", "2026-07-01", "2026-07-02"];
backfilledWorkdays.forEach((date) => {
  const day = rankFlow.days.find((entry) => entry.date === date);
  assert.ok(day, `missing backfilled workday ${date}`);
  assert.equal(day.rows.length, 20, `expected 20 rows for ${date}`);
  assert.ok(day.sourceFile.startsWith("stock-pdc/backfill/daily_watchlists/"), `expected backfill source for ${date}`);
});

console.log("Stock PDC rank flow static checks passed");
