import assert from "node:assert/strict";
import fs from "node:fs";

const { onRequestPost: aiPracticePost } = await import("../functions/ai-practice/[[path]].js");

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
assert.ok(practiceHtml.includes('<form class="practice-access-card" id="practiceAccessForm" method="post">'));
assert.ok(practiceHtml.includes('name="accessCode"'));
assert.ok(practiceHtml.includes("/ai-practice/ai-practice.js"));

assert.equal(practiceJs.includes("PRACTICE_PASSWORD"), false);
assert.ok(practiceJs.includes('turnpo_ai_practice_ui=granted'));
assert.ok(practiceJs.includes('fetch("/ai-practice/logout"'));
assert.ok(practiceJs.includes("markdownForItems"));

assert.ok(practiceFunction.includes("AI_PRACTICE_ACCESS_CODE"));
assert.ok(practiceFunction.includes("AI Practice access is not configured."));
assert.ok(practiceFunction.includes('const PAGE_PATH = "/ai-practice";'));
assert.ok(practiceFunction.includes("turnpo_ai_practice_access"));

const missingConfig = await aiPracticePost({
  request: new Request("https://www.turnpo.com/ai-practice/", {
    method: "POST",
    body: new URLSearchParams({ accessCode: "anything" })
  }),
  env: {}
});
assert.equal(missingConfig.status, 200);
assert.ok((await missingConfig.text()).includes("AI Practice access is not configured."));

console.log("AI Practice static checks passed");
