import assert from "node:assert/strict";
import fs from "node:fs";

const stockHtml = fs.readFileSync(new URL("../stock-pdc/index.html", import.meta.url), "utf8");
const stockJs = fs.readFileSync(new URL("../stock-pdc/stock-pdc.js", import.meta.url), "utf8");
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
assert.ok(stockJs.includes("PDC 研究优先级"));
assert.ok(!stockJs.includes("ENTER_TOP20"));
assert.ok(syncScript.includes('policy: "TOP20_RESEARCH_RANK"'));
assert.ok(syncScript.includes("PDC research rank; action comes from the PDC instruction/status"));
assert.ok(syncScript.includes("buildSnapshot(sourceRoot, priceDataDir)"));

console.log("Stock PDC rank-flow display checks passed");
