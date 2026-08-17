import assert from "node:assert/strict";
import fs from "node:fs";

const stockHtml = fs.readFileSync(new URL("../stock-pdc/index.html", import.meta.url), "utf8");
const stockJs = fs.readFileSync(new URL("../stock-pdc/stock-pdc.js", import.meta.url), "utf8");
const rankFlow = JSON.parse(fs.readFileSync(new URL("../stock-pdc/rank-flow.json", import.meta.url), "utf8"));
const syncScript = fs.readFileSync(new URL("../scripts/sync-stock-pdc-rank-flow.mjs", import.meta.url), "utf8");

assert.ok(stockHtml.includes("每日 Top 20"));
assert.ok(stockHtml.includes('id="stockRankList"'));
assert.ok(stockHtml.includes('id="copyTodayMarkdown"'));
assert.ok(stockHtml.includes('href="/stock-pdc/decision/"'));
assert.ok(stockJs.includes('fetch("/stock-pdc/rank-flow.json"'));
assert.ok(stockJs.includes('fetch("/stock-pdc/decision/api/runs/current"'));
assert.ok(stockJs.includes("crypto.subtle.digest"));
assert.ok(stockJs.includes("function actionLabel"));
assert.ok(stockJs.includes("function buildTodayMarkdown"));
assert.ok(stockJs.includes("navigator.clipboard?.writeText"));
assert.ok(stockJs.includes("function renderDroppedCell"));
assert.ok(stockJs.includes("function renderPortfolioCell"));
assert.ok(stockJs.includes("function renderBenchmarkCell"));
assert.ok(stockJs.includes("function mergePublishedRun"));
assert.ok(stockJs.includes("Math.max(10"));
assert.ok(stockJs.includes('fetch("/stock-pdc/decision/api/history"'));
assert.ok(stockJs.includes("鹰眼雷达先筛候选，PDC 只做排序。最终决策只看当日 Top 20，全部委员分数仅保留用于未来调权和复盘。"));
assert.ok(!stockJs.includes("stock-strategy-meta"));
assert.ok(!stockJs.includes("ENTER_TOP20"));
assert.equal(rankFlow.days.length, 31);
assert.equal(rankFlow.days.reduce((total, day) => total + day.rows.length, 0), 458);
assert.equal(rankFlow.days.reduce((total, day) => total + (day.dropped || []).length, 0), 173);
assert.ok(rankFlow.days.some((day) => day.portfolio?.cumulativeReturnPct !== undefined));
assert.ok(rankFlow.days.some((day) => day.benchmark?.cumulativeReturnPct !== undefined));
assert.ok(syncScript.includes('policy: "TOP20_RESEARCH_RANK"'));
assert.ok(syncScript.includes("PDC research rank; action comes from the PDC instruction/status"));
assert.ok(syncScript.includes("buildSnapshot(sourceRoot, priceDataDir)"));

console.log("Stock PDC rank-flow display checks passed");
