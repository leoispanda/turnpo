import assert from "node:assert/strict";
import fs from "node:fs";

const indexHtml = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const scriptJs = fs.readFileSync(new URL("../script.js", import.meta.url), "utf8");
const version = JSON.parse(fs.readFileSync(new URL("../version.json", import.meta.url), "utf8")).version;

assert.ok(indexHtml.includes("Collected jobs"));
assert.ok(indexHtml.includes("Start search"));
assert.equal(indexHtml.includes("Job filter"), false);
assert.ok(indexHtml.includes(`/script.js?v=${version}`));
assert.ok(indexHtml.includes(`/styles.css?v=${version}`));

assert.ok(scriptJs.includes('const JOB_SEARCH_API = "/api/jobs/search";'));
assert.ok(scriptJs.includes("async function startJobWebSearch()"));
assert.ok(scriptJs.includes("collectJobsFromApi(jobs.markdown)"));
assert.ok(scriptJs.includes('data-potential-action="select"'));
assert.ok(scriptJs.includes("function usePotentialForJob(potentialId)"));
assert.ok(scriptJs.includes("What it does"));
assert.equal(scriptJs.includes("Save job"), false);
assert.equal(scriptJs.includes("window.open(jobs.potentials[0]"), false);

console.log("jobs UI static checks passed");
