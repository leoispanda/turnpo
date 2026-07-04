import assert from "node:assert/strict";
import fs from "node:fs";

const indexHtml = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const redirects = fs.readFileSync(new URL("../_redirects", import.meta.url), "utf8");
const headers = fs.readFileSync(new URL("../_headers", import.meta.url), "utf8");
const practiceHtml = fs.readFileSync(new URL("../ai-practice/index.html", import.meta.url), "utf8");
const practiceJs = fs.readFileSync(new URL("../ai-practice/ai-practice.js", import.meta.url), "utf8");
const practiceFunction = fs.readFileSync(new URL("../functions/ai-practice/[[path]].js", import.meta.url), "utf8");

assert.ok(indexHtml.includes('href="/ai-practice/"'));
assert.ok(redirects.includes("/ai-practice /ai-practice/ 301"));
assert.ok(headers.includes("/ai-practice/*"));

assert.ok(practiceHtml.includes("<title>AI Practice | Turnpo</title>"));
assert.ok(practiceHtml.includes('id="practiceAccessForm"'));
assert.ok(practiceHtml.includes('id="practiceForm"'));
assert.ok(practiceHtml.includes("/ai-practice/ai-practice.js"));

assert.ok(practiceJs.includes('const PRACTICE_PASSWORD = "emba2026";'));
assert.ok(practiceJs.includes('turnpo_ai_practice_ui=granted'));
assert.ok(practiceJs.includes('fetch("/ai-practice/logout"'));
assert.ok(practiceJs.includes("markdownForItems"));

assert.ok(practiceFunction.includes("env.AI_PRACTICE_ACCESS_CODE || env.EMBA_ACCESS_CODE"));
assert.ok(practiceFunction.includes('const PAGE_PATH = "/ai-practice";'));
assert.ok(practiceFunction.includes("turnpo_ai_practice_access"));

console.log("AI Practice static checks passed");
