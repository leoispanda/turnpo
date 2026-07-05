import assert from "node:assert/strict";
import fs from "node:fs";

const index = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

const aiPracticeLink = index.match(/<a[^>]+id="openAiPractice"[^>]*>/)?.[0] || "";
const embaLink = index.match(/<a[^>]+id="openEmbaLibrary"[^>]*>/)?.[0] || "";
const stockPdcLink = index.match(/<a[^>]+id="openStockPdc"[^>]*>/)?.[0] || "";

assert.ok(aiPracticeLink.includes("hidden"));
assert.ok(!embaLink.includes("hidden"));
assert.ok(!stockPdcLink.includes("hidden"));

console.log("top nav static checks passed");
