import assert from "node:assert/strict";
import { onRequestPost as publishPost } from "../functions/api/v1/pdc/runs/publish.js";
import { onRequestGet as runGet } from "../functions/api/v1/pdc/runs/[runId].js";

class MemoryKv {
  constructor() { this.values = new Map(); }
  async get(key) { return this.values.get(key) || null; }
  async put(key, value) { this.values.set(key, String(value)); }
}

const token = "local-pdc-publish-test-token";
const store = new MemoryKv();
const env = { LOCAL_PDC_PUBLISH_TOKEN: token, PDC_PUBLISH_KV: store };
const packageBase = {
  schema_version: "pdc-run-publish-v1",
  run_id: "publish-test-001",
  run_date: "2026-08-13",
  snapshot_id: "snapshot-2026-08-13",
  pdc_version: "local-pdc-v1",
  config_hash: "c".repeat(64),
  code_hash: "d".repeat(64),
  mode: "REAL_SHADOW",
  status: "FINALIZED",
  validation_status: "PASS",
  candidate_count: 1,
  provider_results: [{
    provider: "openai",
    model: "gpt-4o-mini",
    status: "COMPLETED",
    validation_status: "VALID",
    usage: { input_tokens: 100, output_tokens: 40, total_tokens: 140, retry_count: 0 },
    estimated_cost_usd: null
  }],
  final_rankings: [{ ticker: "600519.SH", rank: 1, score: 6.5, decision: "WATCH", risk_flags: [] }],
  decisions: [{ ticker: "600519.SH", decision: "WATCH", risk_flags: [] }],
  risk_flags: [],
  cost_summary: {
    currency: "USD",
    total_estimated_usd: null,
    pricing_status: "NOT_CONFIGURED",
    tracking_status: "NOT_CONFIGURED"
  },
  execution_summary: {
    stage_count: 9,
    completed_stage_count: 9,
    checkpoint_status: "COMPLETE",
    research_only: true,
    live_trading: false
  },
  artifacts: [],
  created_at: "2026-08-13T10:00:00.000Z"
};

function request(body, bearer = token) {
  return new Request("https://turnpo.test/api/v1/pdc/runs/publish", {
    method: "POST",
    headers: {
      authorization: `Bearer ${bearer}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

let response = await publishPost({ request: request(packageBase), env });
assert.equal(response.status, 201);
let body = await response.json();
assert.equal(body.status, "PUBLISHED");
assert.equal(body.namespace, "shadow");

response = await publishPost({ request: request(packageBase), env });
assert.equal(response.status, 200);
body = await response.json();
assert.equal(body.status, "IDEMPOTENT");

response = await publishPost({
  request: request({ ...packageBase, final_rankings: [{ ...packageBase.final_rankings[0], score: 7 }] }),
  env
});
assert.equal(response.status, 409);
body = await response.json();
assert.equal(body.error_code, "RUN_ID_CONFLICT");

response = await publishPost({
  request: request({ ...packageBase, mode: "PRODUCTION" }),
  env
});
assert.equal(response.status, 409);
body = await response.json();
assert.equal(body.error_code, "PRODUCTION_PUBLISH_DISABLED");

response = await publishPost({
  request: request({ ...packageBase, uncontrolled: true }),
  env
});
assert.equal(response.status, 422);

response = await runGet({
  request: new Request("https://turnpo.test/api/v1/pdc/runs/publish-test-001?namespace=shadow", {
    headers: { authorization: `Bearer ${token}` }
  }),
  env,
  params: { runId: "publish-test-001" }
});
assert.equal(response.status, 200);
body = await response.json();
assert.equal(body.package.run_id, "publish-test-001");
assert.equal(body.package.execution_summary.live_trading, false);

console.log("PDC publish API checks passed");
