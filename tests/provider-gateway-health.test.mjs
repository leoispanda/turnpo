import assert from "node:assert/strict";
import { onRequestPost as gatewayPost } from "../functions/api/v1/pdc/gateway.js";
import { onRequestGet as healthGet } from "../functions/api/v1/provider/health.js";

const token = "local-pdc-ai-test-token";
const payload = {
  contract_version: "pdc-provider-v1",
  request_id: "11111111-1111-4111-8111-111111111111",
  run_id: "22222222-2222-4222-8222-222222222222",
  provider_id: "openai",
  model_id: "gpt-4o-mini",
  task_type: "SCORE",
  system_instruction: "Return strict JSON.",
  payload: { candidate: "example" },
  response_schema: {
    type: "object",
    additionalProperties: false,
    required: ["score"],
    properties: { score: { type: "number", minimum: 0, maximum: 10 } }
  }
};

function request(body, bearer = token) {
  return new Request("https://turnpo.test/api/v1/pdc/gateway", {
    method: "POST",
    headers: {
      authorization: `Bearer ${bearer}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

let response = await gatewayPost({
  request: request(payload),
  env: { LOCAL_PDC_AI_TOKEN: token, LOCAL_PDC_GATEWAY_MODE: "OFFLINE_TEST", OPENAI_API_KEY: "test-only-key", PDC_OPENAI_ALLOWED_MODELS: "gpt-4o-mini" }
});
assert.equal(response.status, 409);
assert.equal((await response.json()).error_code, "PROVIDER_DISABLED");

response = await gatewayPost({
  request: request(payload, "legacy-token"),
  env: { TURNPO_PDC_SERVICE_TOKEN: "legacy-token", LOCAL_PDC_GATEWAY_MODE: "OFFLINE_TEST" }
});
assert.equal(response.status, 503);

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
let body = await response.json();
const openai = body.provider_health.find((item) => item.provider_id === "openai");
const anthropic = body.provider_health.find((item) => item.provider_id === "anthropic");
assert.equal(openai.health_status, "READY");
assert.equal(openai.credential_status, "PRESENT");
assert.deepEqual(openai.allowed_models, ["gpt-4o-mini"]);
assert.equal(anthropic.health_status, "NOT_CONFIGURED");
assert.equal(JSON.stringify(body).includes("test-only-key"), false);

response = await healthGet({
  request: new Request("https://turnpo.test/api/v1/provider/health", {
    headers: { authorization: "Bearer wrong-token" }
  }),
  env: { LOCAL_PDC_AI_TOKEN: token }
});
assert.equal(response.status, 401);

console.log("Provider Gateway and health checks passed");
