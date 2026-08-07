import assert from "node:assert/strict";
import fs from "node:fs";

const stockHtml = fs.readFileSync(new URL("../stock-pdc/index.html", import.meta.url), "utf8");
const decisionHtml = fs.readFileSync(new URL("../stock-pdc/decision/index.html", import.meta.url), "utf8");
const decisionJs = fs.readFileSync(new URL("../stock-pdc/decision/decision.js", import.meta.url), "utf8");

assert.ok(stockHtml.includes('href="/stock-pdc/decision/"'));
assert.ok(decisionHtml.includes('id="generateDecision"'));
assert.ok(decisionHtml.includes('id="decisionSteps"'));
assert.ok(decisionHtml.includes('id="modelGrid"'));
assert.ok(decisionJs.includes('const DECISION_API_ENDPOINT = "/api/stock-pdc/decision-runs"'));
assert.ok(decisionJs.includes("async function createDecisionRun()"));
assert.ok(decisionJs.includes("async function runDemoFlow()"));
assert.ok(decisionJs.includes("第一轮独立盲评"));
assert.ok(decisionJs.includes("市场与风险闸门"));

console.log("Stock PDC decision static checks passed");
