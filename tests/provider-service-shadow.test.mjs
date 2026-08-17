import assert from "node:assert/strict";
import { onRequestPost } from "../functions/api/v1/pdc/evaluate/shadow.js";

class MemoryKv {
  constructor() { this.values = new Map(); }
  async get(key) { return this.values.get(key) || null; }
  async put(key, value) { this.values.set(key, String(value)); }
}

const token = "provider-service-test-token";
const basePayload = {
  run_id: "local-shadow-001",
  snapshot_id: "snapshot-2026-08-13",
  task_type: "ranking_scorecard",
  candidates: [
    { ticker: "600519.SH", name: "Example", rank: 1, fact_ids: ["fact-1"] }
  ],
  frozen_facts: {
    package_sha256: "a".repeat(64),
    market_data_date: "2026-08-13",
    rules_version: "hawkeye-fixed-v1",
    source_scope: "full_a_share_market",
    data: { candidate_universe: [{ ticker: "600519.SH", latest_close: 100 }] }
  },
  evaluation_schema_version: "pdc-ai-contract-v1",
  model_selection: { provider: "openai" },
  budget: { max_output_tokens: 1200 },
  timeout_ms: 3000,
  retry: { max_attempts: 2 }
};

function makeRequest(payload, headers = {}) {
  return new Request("https://turnpo.test/api/v1/pdc/evaluate/shadow", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...headers
    },
    body: JSON.stringify(payload)
  });
}

function responseScorecard() {
  return {
    ticker: "600519.SH",
    dimensions: {
      market_regime: 6,
      trend: 7,
      livermore_breakout: 5,
      volume_price: 6,
      candlestick: 5,
      overheat: 6,
      risk: 7,
      zhuge_orion: 5,
      final_chair: 6
    },
    score: 6,
    confidence: 0.72,
    risk_flags: [],
    decision: "WATCH"
  };
}

const originalFetch = globalThis.fetch;
const calls = [];
let mockScorecards = [responseScorecard()];
try {
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), body: JSON.parse(init.body || "{}") });
    return new Response(JSON.stringify({
      output_text: JSON.stringify({ scorecards: mockScorecards }),
      usage: { input_tokens: 100, output_tokens: 40, total_tokens: 140 }
    }), { status: 200, headers: { "content-type": "application/json" } });
  };

  let response = await onRequestPost({
    request: makeRequest(basePayload),
    env: { TURNPO_PDC_SERVICE_TOKEN: token, TURNPO_PDC_EXECUTION_MODE: "OFFLINE_TEST" }
  });
  assert.equal(response.status, 200);
  let body = await response.json();
  assert.equal(body.mode, "OFFLINE_TEST");
  assert.equal(body.validation_status, "NOT_RUN");
  assert.deepEqual(body.scorecards, []);
  assert.equal(calls.length, 0);

  response = await onRequestPost({
    request: makeRequest(basePayload),
    env: {
      TURNPO_PDC_SERVICE_TOKEN: token,
      TURNPO_PDC_EXECUTION_MODE: "REAL_SHADOW",
      OPENAI_API_KEY: "test-only-key",
      PDC_OPENAI_ALLOWED_MODELS: "gpt-4o-mini",
      PDC_COST_KV: new MemoryKv(),
      PDC_OPENAI_INPUT_USD_PER_1M: "1",
      PDC_OPENAI_OUTPUT_USD_PER_1M: "2"
    }
  });
  assert.equal(response.status, 200);
  body = await response.json();
  assert.equal(body.validation_status, "VALID");
  assert.equal(body.provider_results[0].status, "COMPLETED");
  assert.equal(body.scorecards[0].ticker, "600519.SH");
  assert.equal(body.usage.total_tokens, 140);
  assert.equal(body.cost.pricing_status, "CONFIGURED");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].body.text.format.strict, true);
  assert.equal(calls[0].body.text.format.name, "pdc_ai_contract_v1");

  mockScorecards = [{ ...responseScorecard(), score: undefined }];
  response = await onRequestPost({
    request: makeRequest(basePayload),
    env: {
      TURNPO_PDC_SERVICE_TOKEN: token,
      TURNPO_PDC_EXECUTION_MODE: "REAL_SHADOW",
      OPENAI_API_KEY: "test-only-key",
      PDC_OPENAI_ALLOWED_MODELS: "gpt-4o-mini"
    }
  });
  assert.equal(response.status, 502);
  body = await response.json();
  assert.equal(body.validation_status, "INVALID");
  assert.deepEqual(body.scorecards, []);
  mockScorecards = [responseScorecard()];

  response = await onRequestPost({
    request: makeRequest({ ...basePayload, budget: { max_output_tokens: 1200, max_cost_usd: 0.01 } }),
    env: {
      TURNPO_PDC_SERVICE_TOKEN: token,
      TURNPO_PDC_EXECUTION_MODE: "REAL_SHADOW",
      OPENAI_API_KEY: "test-only-key",
      PDC_OPENAI_ALLOWED_MODELS: "gpt-4o-mini",
      PDC_BUDGET_KV: new MemoryKv(),
      PDC_RUN_BUDGET_USD: "0.001",
      PDC_OPENAI_INPUT_USD_PER_1M: "1",
      PDC_OPENAI_OUTPUT_USD_PER_1M: "2"
    }
  });
  assert.equal(response.status, 429);
  body = await response.json();
  assert.equal(body.provider_results[0].error_code, "BUDGET_BLOCKED");
  assert.equal(calls.length, 2);

  response = await onRequestPost({
    request: makeRequest({ ...basePayload, model_selection: { provider: "claude" } }),
    env: { TURNPO_PDC_SERVICE_TOKEN: token, TURNPO_PDC_EXECUTION_MODE: "REAL_SHADOW", OPENAI_API_KEY: "test-only-key", PDC_OPENAI_ALLOWED_MODELS: "gpt-4o-mini" }
  });
  assert.equal(response.status, 503);
  body = await response.json();
  assert.equal(body.provider_results[0].error_code, "PROVIDER_NOT_CONFIGURED");
  assert.equal(calls.length, 2);

  response = await onRequestPost({
    request: makeRequest(basePayload),
    env: { TURNPO_PDC_SERVICE_TOKEN: token, TURNPO_PDC_EXECUTION_MODE: "PRODUCTION", OPENAI_API_KEY: "test-only-key", PDC_OPENAI_ALLOWED_MODELS: "gpt-4o-mini" }
  });
  assert.equal(response.status, 409);
  body = await response.json();
  assert.equal(body.error_code, "PRODUCTION_MODE_NOT_AVAILABLE");
  assert.equal(calls.length, 2);

  response = await onRequestPost({
    request: makeRequest({ ...basePayload, unexpected: true }),
    env: { TURNPO_PDC_SERVICE_TOKEN: token, TURNPO_PDC_EXECUTION_MODE: "OFFLINE_TEST" }
  });
  assert.equal(response.status, 422);
  body = await response.json();
  assert.equal(body.error_code, "INVALID_REQUEST");

  response = await onRequestPost({
    request: makeRequest({
      ...basePayload,
      frozen_facts: { ...basePayload.frozen_facts, data: { api_key: "must-never-be-sent" } }
    }),
    env: { TURNPO_PDC_SERVICE_TOKEN: token, TURNPO_PDC_EXECUTION_MODE: "OFFLINE_TEST" }
  });
  assert.equal(response.status, 422);
  body = await response.json();
  assert.equal(body.error_code, "INVALID_REQUEST");

  response = await onRequestPost({
    request: makeRequest(basePayload, { authorization: "Bearer wrong-token" }),
    env: { TURNPO_PDC_SERVICE_TOKEN: token, TURNPO_PDC_EXECUTION_MODE: "OFFLINE_TEST" }
  });
  assert.equal(response.status, 401);
} finally {
  globalThis.fetch = originalFetch;
}

console.log("Provider Execution Service shadow checks passed");
