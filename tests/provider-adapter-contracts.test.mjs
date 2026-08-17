import assert from "node:assert/strict";
import { onRequestPost } from "../functions/api/v1/pdc/gateway.js";

const token = "adapter-contract-token";
const schema = {
  type: "object",
  additionalProperties: false,
  required: ["ok"],
  properties: { ok: { type: "boolean", const: true } }
};

const providers = [
  {
    provider_id: "anthropic",
    model_id: "claude-test-model",
    env: { claude_api_pdc: "test-anthropic-key", PDC_ANTHROPIC_ALLOWED_MODELS: "claude-test-model" },
    response: { content: [{ type: "text", text: JSON.stringify({ ok: true }) }], usage: { input_tokens: 2, output_tokens: 3 } },
    url: "https://api.anthropic.com/v1/messages"
  },
  {
    provider_id: "gemini",
    model_id: "gemini-test-model",
    env: { "Gemini API Key pdc": "test-gemini-key", PDC_GEMINI_ALLOWED_MODELS: "gemini-test-model" },
    response: { candidates: [{ content: { parts: [{ text: JSON.stringify({ ok: true }) }] } }] },
    url: "generativelanguage.googleapis.com"
  },
  {
    provider_id: "deepseek",
    model_id: "deepseek-test-model",
    env: { "deepseek api pdc": "test-deepseek-key", PDC_DEEPSEEK_ALLOWED_MODELS: "deepseek-test-model" },
    response: { choices: [{ message: { content: JSON.stringify({ ok: true }) } }], usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 } },
    url: "api.deepseek.com/chat/completions"
  },
  {
    provider_id: "kimi",
    model_id: "kimi-test-model",
    env: { "kimi pdc": "test-kimi-key", PDC_KIMI_ALLOWED_MODELS: "kimi-test-model" },
    response: { choices: [{ message: { content: JSON.stringify({ ok: true }) } }], usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 } },
    url: "api.moonshot.ai/v1/chat/completions"
  }
];

const originalFetch = globalThis.fetch;
try {
  for (const provider of providers) {
    let calledUrl = "";
    let calledBody = null;
    globalThis.fetch = async (url, init = {}) => {
      calledUrl = String(url);
      calledBody = JSON.parse(init.body || "{}");
      return new Response(JSON.stringify(provider.response), { status: 200 });
    };
    const response = await onRequestPost({
      request: new Request("https://turnpo.test/api/v1/pdc/gateway", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          contract_version: "pdc-provider-v1",
          request_id: "11111111-1111-4111-8111-111111111111",
          run_id: "22222222-2222-4222-8222-222222222222",
          provider_id: provider.provider_id,
          model_id: provider.model_id,
          task_type: "SCORE",
          system_instruction: "Return only strict JSON.",
          payload: { check: provider.provider_id },
          response_schema: schema
        })
      }),
      env: { LOCAL_PDC_AI_TOKEN: token, LOCAL_PDC_GATEWAY_MODE: "REAL_SHADOW", ...provider.env }
    });
    assert.equal(response.status, 200, provider.provider_id);
    const body = await response.json();
    assert.equal(body.status, "SUCCESS", provider.provider_id);
    assert.deepEqual(body.output, { ok: true }, provider.provider_id);
    assert.match(calledUrl, new RegExp(provider.url.replace(/[./]/g, "\\$&")), provider.provider_id);
    assert.equal(typeof calledBody, "object");
  }
} finally {
  globalThis.fetch = originalFetch;
}

console.log("Provider adapter contract checks passed");
