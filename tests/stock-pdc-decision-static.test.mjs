import assert from "node:assert/strict";
import fs from "node:fs";

const stockHtml = fs.readFileSync(new URL("../stock-pdc/index.html", import.meta.url), "utf8");
const decisionHtml = fs.readFileSync(new URL("../stock-pdc/decision/index.html", import.meta.url), "utf8");
const decisionJs = fs.readFileSync(new URL("../stock-pdc/decision/decision.js", import.meta.url), "utf8");
const stockFunction = fs.readFileSync(new URL("../functions/stock-pdc/[[path]].js", import.meta.url), "utf8");
const stockJs = fs.readFileSync(new URL("../stock-pdc/stock-pdc.js", import.meta.url), "utf8");

assert.ok(stockHtml.includes('href="/stock-pdc/decision/"'));
assert.ok(decisionHtml.includes('id="generateDecision"'));
assert.ok(decisionHtml.includes('id="decisionSteps"'));
assert.ok(decisionHtml.includes('id="modelGrid"'));
assert.ok(decisionHtml.includes('id="publishDecision"'));
assert.ok(decisionHtml.includes('id="decisionModelSelect"'));
assert.ok(decisionHtml.includes('id="decisionModelNote"'));
assert.ok(decisionJs.includes('const DECISION_API_ENDPOINT = "/stock-pdc/decision/api"'));
assert.ok(decisionJs.includes("async function runDecisionFlow()"));
assert.ok(decisionJs.includes("async function runReviewers(stage)"));
assert.ok(decisionJs.includes('点击“继续生成”会从已保存的评审继续'));
assert.ok(decisionJs.includes("async function publishDecision()"));
assert.ok(decisionJs.includes("async function loadModelProfiles()"));
assert.ok(decisionJs.includes("modelProfileId: state.selectedModelProfileId"));
assert.ok(decisionJs.includes("第一轮独立盲评"));
assert.ok(decisionJs.includes("市场与风险闸门"));
assert.ok(decisionJs.includes('const modelLabel = selectedModelProfile()?.label || "GPT mini"'));
assert.ok(stockFunction.includes('const DECISION_PATH = `${PAGE_PATH}/decision`;'));
assert.ok(stockFunction.includes("async function decisionApi(context)"));
assert.ok(stockFunction.includes("Save after every individual reviewer"));
assert.ok(stockFunction.includes('if (suffix === "models")'));
assert.ok(stockFunction.includes("OPENAI_STOCK_MODEL || env.OPENAI_MODEL || DEFAULT_STOCK_MODEL"));
assert.ok(stockFunction.includes("stock-pdc:decision:day:"));
assert.ok(stockJs.includes('fetch("/stock-pdc/decision/api/history"'));
assert.ok(stockJs.includes("function renderPublishedDecisionHistory()"));

console.log("Stock PDC decision static checks passed");
