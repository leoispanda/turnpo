import assert from "node:assert/strict";
import { onRequestPost as gatewayPost } from "../functions/api/v1/pdc/gateway.js";
import { onRequestGet as healthGet } from "../functions/api/v1/provider/health.js";

const token = "provider-gateway-test-token";
const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["provider_test", "score"],
  properties: {
    provider_test: { type: "boolean", const: true },
    score: { type: "number", minimum: 0, maximum: 10 }
  }
};

function baseRequest(overrides = {}) {
  return {
    contract_version: "pdc-provider-v1",
    request_id: "11111111-1111-4111-8111-111111111111",
    run_id: "22222222-2222-4222-8222-222222222222",
    provider_id: "openai",
    model_id: "gpt-4o-mini",
    task_type: "SMOKE",
    system_instruction: "Return only strict JSON.",
    payload: { provider_test: true },
    response_schema: responseSchema,
    timeout_ms: 3000,
    max_retries: 1,
    ...overrides
  };
}

function makeRequest(body, bearer = token) {
  return new Request("https://turnpo.test/api/v1/pdc/gateway", {
    method: "POST",
    headers: {
      authorization: `Bearer ${bearer}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

const env = {
  LOCAL_PDC_AI_TOKEN: token,
  LOCAL_PDC_GATEWAY_MODE: "REAL_SHADOW",
  OPENAI_API_KEY: "test-only-key",
  PDC_OPENAI_ALLOWED_MODELS: "gpt-4o-mini",
  PDC_OPENAI_INPUT_USD_PER_1M: "1",
  PDC_OPENAI_OUTPUT_USD_PER_1M: "2"
};

const originalFetch = globalThis.fetch;
let calls = [];
let upstreamResponses = [];
try {
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), body: JSON.parse(init.body || "{}") });
    return upstreamResponses.shift() || new Response(JSON.stringify({
      output_text: JSON.stringify({ provider_test: true, score: 7 }),
      usage: { input_tokens: 10, output_tokens: 4, total_tokens: 14 }
    }), { status: 200, headers: { "content-type": "application/json" } });
  };

  let response = await gatewayPost({ request: makeRequest(baseRequest()), env });
  assert.equal(response.status, 200);
  let body = await response.json();
  assert.equal(body.contract_version, "pdc-provider-v1");
  assert.equal(body.status, "SUCCESS");
  assert.deepEqual(body.output, { provider_test: true, score: 7 });
  assert.equal(body.usage.total_tokens, 14);
  assert.equal(body.cost.usd, 0.000018);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].body.instructions, "Return only strict JSON.");
  assert.equal(calls[0].body.input[0].content[0].text, JSON.stringify({ provider_test: true }));

  response = await gatewayPost({ request: makeRequest(baseRequest(), "wrong-token"), env });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error_code, "AUTH_FAILED");
  assert.equal(calls.length, 1);

  response = await gatewayPost({ request: makeRequest({ ...baseRequest(), task_type: "RANKING" }), env });
  assert.equal(response.status, 422);
  assert.equal((await response.json()).error_code, "TASK_NOT_ALLOWED");
  assert.equal(calls.length, 1);

  response = await gatewayPost({ request: makeRequest({ ...baseRequest(), model_id: "not-allowlisted" }), env });
  assert.equal(response.status, 422);
  assert.equal((await response.json()).error_code, "MODEL_NOT_ALLOWED");
  assert.equal(calls.length, 1);

  upstreamResponses = [new Response(JSON.stringify({
    output_text: "Here is the answer: {\"provider_test\":true,\"score\":7}",
    usage: { input_tokens: 10, output_tokens: 4, total_tokens: 14 }
  }), { status: 200 })];
  response = await gatewayPost({ request: makeRequest(baseRequest()), env });
  assert.equal(response.status, 502);
  assert.equal((await response.json()).error_code, "INVALID_JSON");

  upstreamResponses = [new Response(JSON.stringify({
    output_text: JSON.stringify({ provider_test: true }),
    usage: { input_tokens: 10, output_tokens: 4, total_tokens: 14 }
  }), { status: 200 })];
  response = await gatewayPost({ request: makeRequest(baseRequest()), env });
  assert.equal(response.status, 502);
  assert.equal((await response.json()).error_code, "SCHEMA_FAILED");

  upstreamResponses = [
    new Response(JSON.stringify({ error: { message: "busy" } }), { status: 429 }),
    new Response(JSON.stringify({
      output_text: JSON.stringify({ provider_test: true, score: 7 }),
      usage: { input_tokens: 10, output_tokens: 4, total_tokens: 14 }
    }), { status: 200 })
  ];
  response = await gatewayPost({ request: makeRequest(baseRequest()), env });
  assert.equal(response.status, 200);
  body = await response.json();
  assert.equal(body.usage.retry_count, 1);
  assert.equal(calls.length, 5);

  response = await healthGet({
    request: new Request("https://turnpo.test/api/v1/provider/health", {
      headers: { authorization: `Bearer ${token}` }
    }),
    env: {
      LOCAL_PDC_AI_TOKEN: token,
      OPENAI_API_KEY: "test-only-key",
      PDC_OPENAI_ALLOWED_MODELS: "gpt-4o-mini",
      PDC_PROVIDER_HEALTH_OPENAI: "READY"
    }
  });
  assert.equal(response.status, 200);
  body = await response.json();
  assert.deepEqual(body.provider_health.map((item) => item.provider_id), ["openai", "anthropic", "gemini", "deepseek", "kimi"]);
  assert.equal(body.provider_health[0].health_status, "READY");
  assert.equal(body.provider_health[0].credential_status, "PRESENT");
  assert.equal(JSON.stringify(body).includes("test-only-key"), false);
} finally {
  globalThis.fetch = originalFetch;
}

console.log("Generic Provider Gateway contract checks passed");
