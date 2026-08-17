import assert from "node:assert/strict";
import { onRequestPost } from "../functions/api/v1/provider/smoke.js";

class MemoryKv {
  constructor() { this.values = new Map(); }
  async get(key) { return this.values.get(key) || null; }
  async put(key, value) { this.values.set(key, String(value)); }
}

const token = "local-pdc-ai-smoke-test-token";
const providerKey = "openai-smoke-test-only-key";
const payload = { provider_test: true };
const baseEnv = {
  LOCAL_PDC_AI_TOKEN: token,
  LOCAL_PDC_GATEWAY_MODE: "REAL_SHADOW",
  PDC_OPENAI_SMOKE_ENABLED: "true",
  OPENAI_API_KEY: providerKey,
  PDC_OPENAI_ALLOWED_MODELS: "gpt-4o-mini",
  PDC_OPENAI_INPUT_USD_PER_1M: "1",
  PDC_OPENAI_OUTPUT_USD_PER_1M: "2",
  PDC_OPENAI_SMOKE_REQUEST_BUDGET_USD: "0.01",
  PDC_OPENAI_SMOKE_TIMEOUT_MS: "3000",
  PDC_OPENAI_SMOKE_MAX_OUTPUT_TOKENS: "256",
  PDC_OPENAI_SMOKE_MAX_ATTEMPTS: "2"
};

function makeRequest(body = payload, bearer = token) {
  const headers = { "content-type": "application/json" };
  if (bearer !== null) headers.authorization = `Bearer ${bearer}`;
  return new Request("https://turnpo.test/api/v1/provider/smoke", {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
}

function successResponse() {
  return new Response(JSON.stringify({
    output_text: JSON.stringify({ provider_test: true, score: 7 }),
    usage: { input_tokens: 30, output_tokens: 12, total_tokens: 42 }
  }), { status: 200, headers: { "content-type": "application/json" } });
}

const originalFetch = globalThis.fetch;
const originalLog = console.log;
const calls = [];
let responses = [successResponse()];
const logs = [];
try {
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), body: JSON.parse(init.body || "{}") });
    return responses.shift() || successResponse();
  };
  console.log = (value) => logs.push(String(value));

  let response = await onRequestPost({ request: makeRequest(), env: baseEnv });
  assert.equal(response.status, 200);
  let body = await response.json();
  assert.equal(body.status, "PASS");
  assert.deepEqual(body.provider_output, { provider_test: true, score: 7 });
  assert.equal(body.validation_status, "VALID");
  assert.equal(body.usage.total_tokens, 42);
  assert.equal(body.cost.pricing_status, "CONFIGURED");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].body.text.format.strict, true);
  assert.equal(calls[0].body.text.format.name, "openai_provider_smoke_v1");
  assert.equal(JSON.stringify(calls[0].body).includes("stock"), false);

  responses = [new Response(JSON.stringify({
    output_text: "```json\\n{\\\"provider_test\\\":true,\\\"score\\\":7}\\n```",
    usage: { input_tokens: 30, output_tokens: 12, total_tokens: 42 }
  }), { status: 200 })];
  response = await onRequestPost({ request: makeRequest(), env: baseEnv });
  assert.equal(response.status, 502);
  body = await response.json();
  assert.equal(body.error_code, "INVALID_JSON");

  responses = [new Response("upstream failure", { status: 503 }), successResponse()];
  response = await onRequestPost({ request: makeRequest(), env: baseEnv });
  assert.equal(response.status, 200);
  body = await response.json();
  assert.equal(body.retry_count, 1);
  assert.equal(calls.length, 4);

  response = await onRequestPost({ request: makeRequest(payload, null), env: baseEnv });
  assert.equal(response.status, 401);
  assert.equal(calls.length, 4);

  response = await onRequestPost({ request: makeRequest(payload, "wrong-token"), env: baseEnv });
  assert.equal(response.status, 401);
  assert.equal(calls.length, 4);

  response = await onRequestPost({
    request: makeRequest(),
    env: { ...baseEnv, PDC_OPENAI_ALLOWED_MODELS: "different-model", PDC_OPENAI_SMOKE_MODEL: "gpt-4o-mini" }
  });
  assert.equal(response.status, 503);
  body = await response.json();
  assert.equal(body.error_code, "MODEL_NOT_ALLOWED");
  assert.equal(calls.length, 4);

  response = await onRequestPost({
    request: makeRequest(),
    env: { ...baseEnv, PDC_OPENAI_SMOKE_REQUEST_BUDGET_USD: "0.000001" }
  });
  assert.equal(response.status, 429);
  body = await response.json();
  assert.equal(body.error_code, "BUDGET_BLOCKED");
  assert.equal(calls.length, 4);

  response = await onRequestPost({
    request: makeRequest(),
    env: { ...baseEnv, PDC_BUDGET_KV: new MemoryKv(), PDC_RUN_BUDGET_USD: "0.001" }
  });
  assert.equal(response.status, 429);
  body = await response.json();
  assert.equal(body.error_code, "BUDGET_BLOCKED");
  assert.equal(calls.length, 4);

  const rateKv = new MemoryKv();
  response = await onRequestPost({
    request: makeRequest(),
    env: { ...baseEnv, PDC_RATE_KV: rateKv, PDC_RATE_LIMIT_PER_MINUTE: "1" }
  });
  assert.equal(response.status, 200);
  response = await onRequestPost({
    request: makeRequest(),
    env: { ...baseEnv, PDC_RATE_KV: rateKv, PDC_RATE_LIMIT_PER_MINUTE: "1" }
  });
  assert.equal(response.status, 429);
  body = await response.json();
  assert.equal(body.error_code, "RATE_LIMITED");
  assert.equal(calls.length, 5);

  const combinedLogs = logs.join("\n");
  assert.equal(combinedLogs.includes(providerKey), false);
  assert.equal(combinedLogs.includes(token), false);
  assert.equal(JSON.stringify(body).includes(providerKey), false);
  assert.equal(JSON.stringify(body).includes(token), false);
} finally {
  globalThis.fetch = originalFetch;
  console.log = originalLog;
}

console.log("OpenAI provider smoke checks passed");
