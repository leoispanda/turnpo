import assert from "node:assert/strict";
import fs from "node:fs";

const server = fs.readFileSync(new URL("../scripts/local-stock-pdc-server.mjs", import.meta.url), "utf8");
const exampleEnv = fs.readFileSync(new URL("../.env.local.example", import.meta.url), "utf8");
const ignore = fs.readFileSync(new URL("../.gitignore", import.meta.url), "utf8");

assert.ok(server.includes("run_latest_pdc.py"));
assert.ok(server.includes("sync-stock-pdc-rank-flow.mjs"));
assert.ok(server.includes("LOCAL_COMPLETED"));
assert.ok(server.includes("delete values.STOCK_PDC_GITHUB_TOKEN"));
assert.ok(server.includes("authorizationProbe"));
assert.ok(exampleEnv.includes("OPENAI_API_KEY="));
assert.ok(exampleEnv.includes("ANTHROPIC_API_KEY="));
assert.ok(ignore.includes(".env.local"));
assert.ok(ignore.includes(".local-stock-pdc/"));

console.log("Local Stock PDC server static checks passed");
