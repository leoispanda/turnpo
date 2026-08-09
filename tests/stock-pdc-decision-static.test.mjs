import assert from "node:assert/strict";
import fs from "node:fs";

const stockHtml = fs.readFileSync(new URL("../stock-pdc/index.html", import.meta.url), "utf8");
const decisionHtml = fs.readFileSync(new URL("../stock-pdc/decision/index.html", import.meta.url), "utf8");
const decisionJs = fs.readFileSync(new URL("../stock-pdc/decision/decision.js", import.meta.url), "utf8");
const stockFunction = fs.readFileSync(new URL("../functions/stock-pdc/[[path]].js", import.meta.url), "utf8");

assert.ok(stockHtml.includes('href="/stock-pdc/decision/"'));
assert.ok(stockHtml.includes("每日 Top 20"));
assert.ok(decisionHtml.includes("生成今日 Stock PDC 数据"));
assert.ok(decisionHtml.includes('id="startGeneration"'));
assert.ok(decisionHtml.includes('id="publishGeneration"'));
assert.ok(decisionHtml.includes('id="copyGenerationMarkdown"'));
assert.ok(decisionJs.includes('const API = "/stock-pdc/decision/api"'));
assert.ok(decisionJs.includes('api("/runs", { method: "POST", body: "{}" })'));
assert.ok(decisionJs.includes("function buildGenerationMarkdown"));
assert.ok(decisionJs.includes("navigator.clipboard?.writeText"));
assert.ok(!decisionJs.includes("decision-candidates.json"));
assert.ok(!stockFunction.includes("OPENAI_RESPONSES_URL"));
assert.ok(!stockFunction.includes("openAiReview"));
assert.ok(!decisionJs.includes("candidates:"));
assert.ok(stockFunction.includes("async function createGenerationRun"));
assert.ok(stockFunction.includes("The browser may not supply candidates"));
assert.ok(stockFunction.includes("async function completeGenerationRun"));
assert.ok(!stockFunction.includes('|| "emba2026"'));

console.log("Trusted Stock PDC generation static checks passed");
