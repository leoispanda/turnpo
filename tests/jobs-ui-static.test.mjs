import assert from "node:assert/strict";
import fs from "node:fs";

const indexHtml = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const scriptJs = fs.readFileSync(new URL("../script.js", import.meta.url), "utf8");
const version = JSON.parse(fs.readFileSync(new URL("../version.json", import.meta.url), "utf8")).version;

assert.ok(indexHtml.includes("Collected jobs"));
assert.ok(indexHtml.includes("Start search"));
assert.ok(indexHtml.includes("Complete info"));
assert.ok(indexHtml.includes("General information incomplete"));
assert.ok(indexHtml.includes("Recent follow-ups / search notes"));
assert.ok(indexHtml.includes("Generate modified resume"));
assert.ok(indexHtml.includes("Print / Save PDF"));
assert.equal(indexHtml.includes("Job filter"), false);
assert.ok(indexHtml.includes(`/script.js?v=${version}`));
assert.ok(indexHtml.includes(`/styles.css?v=${version}`));

assert.ok(scriptJs.includes('const JOB_SEARCH_API = "/api/jobs/search";'));
assert.ok(scriptJs.includes("async function startJobWebSearch()"));
assert.ok(scriptJs.includes("collectJobsFromApi(sourceText)"));
assert.ok(scriptJs.includes("function completeJobGeneralInfo("));
assert.ok(scriptJs.includes("General information completed"));
assert.ok(scriptJs.includes("General information changed"));
assert.ok(scriptJs.includes("Proceed to Step 3"));
assert.ok(scriptJs.includes('dataset.potentialAction === "select"'));
assert.ok(scriptJs.includes("function usePotentialForJob(potentialId)"));
assert.ok(scriptJs.includes("function printJobResumePdf()"));
assert.ok(scriptJs.includes("function generateTailoredResumeHtml(job"));
assert.ok(scriptJs.includes("What it does"));
assert.equal(scriptJs.includes("Save job"), false);
assert.equal(scriptJs.includes("window.open(jobs.potentials[0]"), false);

console.log("jobs UI static checks passed");
