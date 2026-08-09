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
const hawkeye = JSON.parse(fs.readFileSync(new URL("../stock-pdc/hawkeye/latest.json", import.meta.url), "utf8"));

assert.ok(indexHtml.includes('href="/stock-pdc/"'));
assert.ok(redirects.includes("/stock-pdc /stock-pdc/ 301"));
assert.ok(headers.includes("/stock-pdc/*"));

assert.ok(stockHtml.includes("<title>股票大作手 Top 20 | Turnpo</title>"));
assert.ok(stockHtml.includes('id="stockRankList"'));
assert.ok(stockHtml.includes('id="stockActionPanel"'));
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
assert.ok(stockJs.includes("visibleDays"));
assert.ok(stockJs.includes(".filter((day) => Array.isArray(day.rows) && day.rows.length)"));
assert.ok(stockJs.includes("isTradingWeekday"));
assert.ok(stockJs.includes("weekday !== 0 && weekday !== 6"));
assert.ok(stockJs.includes("weekdayLabel"));
assert.ok(stockJs.includes("rowByRank"));
assert.ok(stockJs.includes("droppedRankDelta"));
assert.ok(stockJs.includes("21 - previousRank"));
assert.ok(stockJs.includes("至少下滑"));
assert.ok(stockJs.includes("formatPct"));
assert.ok(stockJs.includes("formatValuePct"));
assert.ok(stockJs.includes("stock-day-change"));
assert.ok(stockJs.includes("stock-price-"));
assert.ok(stockJs.includes("stock-rank-move"));
assert.ok(stockJs.includes("signalDayChangeValue"));
assert.ok(!stockJs.includes("function changeLabel"));
assert.ok(stockJs.includes("renderPortfolioCell"));
assert.ok(stockJs.includes("stock-portfolio-summary"));
assert.ok(stockJs.includes("renderDroppedCell"));
assert.ok(stockJs.includes("droppedSlots"));
assert.ok(stockJs.includes("stock-rank-axis-return"));
assert.ok(stockJs.includes("stock-rank-axis-dropped"));
assert.ok(stockJs.includes("stock-rank-matrix"));
assert.ok(stockJs.includes("stock-date-head"));
assert.ok(stockJs.includes("stock-rank-axis"));
assert.ok(stockJs.includes("星期五"));
assert.ok(stockJs.includes("renderRankList"));
assert.ok(stockJs.includes("renderActionPanel"));
assert.ok(stockJs.includes("actionDetail"));
assert.ok(stockJs.includes("即使结果与昨天相同"));
assert.ok(stockJs.includes("完整 PDC 买入闸门"));
assert.ok(stockJs.includes("sourceInstruction"));
assert.ok(!stockJs.includes("<strong>Out</strong>"));
assert.ok(!stockJs.includes("renderMatrix"));
assert.ok(!stockJs.includes("function renderDropped("));

assert.ok(syncScript.includes("daily_watchlists"));
assert.ok(syncScript.includes("daily_leaderboard_changes"));
assert.ok(syncScript.includes("BACKFILL_WATCHLIST_DIR"));
assert.ok(syncScript.includes("turnpo-backfill"));
assert.ok(syncScript.includes("priceMoveForTicker"));
assert.ok(syncScript.includes("DATA_GOVERNANCE"));
assert.ok(syncScript.includes("function snapshotId("));
assert.ok(syncScript.includes("Never fill a missing ticker"));
assert.ok(syncScript.includes("dayChangePct"));
assert.ok(syncScript.includes("equal_weight_top20_next_trading_day_close_to_close"));
assert.ok(syncScript.includes("rank-flow.json"));
assert.ok(syncScript.includes("candidate_universe.csv"));
assert.ok(syncScript.includes("hawkeye_radar_audit.csv"));
assert.ok(syncScript.includes("stock-pdc-hawkeye-v2"));
assert.ok(syncScript.includes("Every passed Hawkeye name enters the PDC fact packet"));
assert.ok(syncScript.includes("fixedRuleViolations"));

assert.ok(stockFunction.includes("env.STOCK_PDC_ACCESS_CODE || env.EMBA_ACCESS_CODE"));
assert.ok(stockFunction.includes('const PAGE_PATH = "/stock-pdc";'));
assert.ok(stockFunction.includes("turnpo_stock_pdc_access"));

assert.ok(Array.isArray(rankFlow.days));
assert.ok(rankFlow.days.length > 0);
assert.equal(rankFlow.latestDate, rankFlow.dates.at(-1));
assert.ok(rankFlow.days.at(-1).rows.length <= 20);
assert.ok(rankFlow.days.at(-1).rows.length > 0);
assert.ok(rankFlow.priceDataDir);
assert.equal(rankFlow.dataGovernance.schemaVersion, "stock-pdc-market-data-v1");
assert.equal(rankFlow.dataGovernance.primary.id, "stock-pdc-local-frozen-watchlist");
assert.equal(rankFlow.portfolio.method, "equal_weight_top20_next_trading_day_close_to_close");
assert.equal(rankFlow.portfolio.initialValuePct, 100);
assert.ok(Number.isFinite(rankFlow.portfolio.latestReturnPct));
assert.ok(rankFlow.portfolio.daily.length > 0);
assert.ok(rankFlow.days.some((day) => day.rows.some((row) => Number.isFinite(row.dayChangePct))));
assert.ok(rankFlow.days.some((day) => day.rows.some((row) => Number.isFinite(row.signalDayChangePct))));
assert.ok(rankFlow.days.some((day) => Number.isFinite(day.portfolio?.cumulativeReturnPct)));
assert.equal(rankFlow.actions.schemaVersion, "stock-pdc-actions-v1");
assert.equal(rankFlow.actions.latestDate, rankFlow.latestDate);
assert.ok(Array.isArray(rankFlow.actions.rows));

assert.ok(["stock-pdc-hawkeye-v1", "stock-pdc-hawkeye-v2"].includes(hawkeye.schemaVersion));
assert.ok(["ACTIVE", "STALE"].includes(hawkeye.availability));
assert.ok(hawkeye.asOfDate);
assert.ok(hawkeye.checkedCount >= hawkeye.passedCount);
if (hawkeye.schemaVersion === "stock-pdc-hawkeye-v2") {
  assert.equal(hawkeye.marketUniverseCount, hawkeye.checkedCount);
  assert.equal(
    hawkeye.passedCount + hawkeye.rejectedCount + hawkeye.dataFailedCount + hawkeye.universeExcludedCount,
    hawkeye.checkedCount
  );
}
assert.ok(hawkeye.dispatchedCount >= 5);
assert.equal(hawkeye.dispatchedCount, hawkeye.passedCount);
assert.equal(hawkeye.candidates.length, hawkeye.dispatchedCount);
assert.ok(hawkeye.candidates.every((row) => row.status === "HAWKEYE_PASSED"));
assert.ok(hawkeye.candidates.every((row) => Number.isFinite(row.facts?.return60dPct)));
assert.equal(hawkeye.rules.minMarketCapCny, 30_000_000_000);
assert.equal(hawkeye.rules.minReturn60dPct, 0);
assert.ok(hawkeye.candidates.every((row) => row.facts.marketCapCny > hawkeye.rules.minMarketCapCny));
assert.ok(hawkeye.candidates.every((row) => row.facts.return60dPct > hawkeye.rules.minReturn60dPct));
assert.ok(!Object.hasOwn(hawkeye.rules, "requireClearUptrend"));
assert.ok(hawkeye.audit.some((row) => row.passed));

const backfilledWorkdays = ["2026-06-25", "2026-06-30", "2026-07-01", "2026-07-02"];
backfilledWorkdays.forEach((date) => {
  const day = rankFlow.days.find((entry) => entry.date === date);
  assert.ok(day, `missing backfilled workday ${date}`);
  assert.equal(day.rows.length, 20, `expected 20 rows for ${date}`);
  assert.ok(day.sourceFile.startsWith("stock-pdc/backfill/daily_watchlists/"), `expected backfill source for ${date}`);
});

console.log("Stock PDC rank flow static checks passed");
