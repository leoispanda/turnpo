import { extractOpenAiOutputText, fetchOpenAiResponses } from "../../ai/_openai.js";
import { getProviderDefinition, configuredCredentialBinding } from "./_provider-registry.js";

const DEFAULT_MAX_OUTPUT_TOKENS = 2048;
const MAX_OUTPUT_TOKENS = 16000;

function integerOrNull(value) {
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function usageFrom(data) {
  const input = integerOrNull(
    data?.usage?.input_tokens
      ?? data?.usage?.prompt_tokens
      ?? data?.usageMetadata?.promptTokenCount
  );
  const output = integerOrNull(
    data?.usage?.output_tokens
      ?? data?.usage?.completion_tokens
      ?? data?.usageMetadata?.candidatesTokenCount
  );
  const explicitTotal = integerOrNull(data?.usage?.total_tokens ?? data?.usageMetadata?.totalTokenCount);
  return {
    input_tokens: input,
    output_tokens: output,
    total_tokens: explicitTotal ?? (input !== null && output !== null ? input + output : null)
  };
}

function maxOutputTokens(env, requested) {
  const value = Number(env.PDC_PROVIDER_MAX_OUTPUT_TOKENS || DEFAULT_MAX_OUTPUT_TOKENS);
  const serverLimit = Number.isInteger(value) && value >= 128
    ? Math.min(value, MAX_OUTPUT_TOKENS)
    : DEFAULT_MAX_OUTPUT_TOKENS;
  return Number.isInteger(requested) && requested >= 128
    ? Math.min(requested, serverLimit)
    : serverLimit;
}

function responseErrorCode(status) {
  if (status === 401 || status === 403) return "AUTH_FAILED";
  if (status === 408 || status === 504) return "TIMEOUT";
  if (status === 429) return "RATE_LIMITED";
  return "PROVIDER_ERROR";
}

function transientStatus(status) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

function baseResult(providerId, modelId, startedAt) {
  return {
    provider_id: providerId,
    model_id: modelId,
    status: "UPSTREAM_ERROR",
    output: null,
    usage: { input_tokens: null, output_tokens: null, total_tokens: null },
    cost: "UNAVAILABLE",
    latency_ms: Date.now() - startedAt,
    http_status: null,
    error_code: "PROVIDER_ERROR",
    retryable: false
  };
}

async function parseResponse(response) {
  return response.json().catch(() => null);
}

async function requestJson({ providerId, modelId, url, headers, body, timeoutMs }) {
  const startedAt = Date.now();
  let response;
  let data = null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });
      data = await parseResponse(response);
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const result = baseResult(providerId, modelId, startedAt);
    result.error_code = error?.name === "AbortError" ? "TIMEOUT" : "NETWORK_ERROR";
    result.retryable = result.error_code === "TIMEOUT" || result.error_code === "NETWORK_ERROR";
    return result;
  }

  const result = baseResult(providerId, modelId, startedAt);
  result.http_status = response.status;
  result.usage = usageFrom(data);
  result.latency_ms = Date.now() - startedAt;
  if (!response.ok) {
    result.error_code = responseErrorCode(response.status);
    result.retryable = transientStatus(response.status);
    return result;
  }
  result.status = "UPSTREAM_SUCCESS";
  result.output = data;
  result.error_code = "";
  return result;
}

function userPayloadText(payload) {
  return JSON.stringify(payload);
}

function openAiBody({ model, system_instruction, payload, response_schema, env, max_output_tokens }) {
  return {
    model,
    instructions: system_instruction,
    input: [{
      role: "user",
      content: [{ type: "input_text", text: userPayloadText(payload) }]
    }],
    text: {
      format: {
        type: "json_schema",
        name: "turnpo_provider_output_v1",
        strict: true,
        schema: response_schema
      }
    },
    max_output_tokens: maxOutputTokens(env, max_output_tokens)
  };
}

function chatBody({ model, system_instruction, payload, env, responseFormat, max_output_tokens }) {
  return {
    model,
    messages: [
      { role: "system", content: system_instruction },
      { role: "user", content: userPayloadText(payload) }
    ],
    response_format: responseFormat,
    max_tokens: maxOutputTokens(env, max_output_tokens)
  };
}

function extractAnthropicText(data) {
  return Array.isArray(data?.content)
    ? data.content.filter((item) => item?.type === "text" && typeof item.text === "string").map((item) => item.text).join("")
    : "";
}

function extractGeminiText(data) {
  return data?.candidates?.[0]?.content?.parts
    ?.filter((part) => typeof part?.text === "string")
    ?.map((part) => part.text)
    ?.join("") || "";
}

function extractChatText(data) {
  const content = data?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : "";
}

function withExtractedOutput(result, extractor) {
  if (result.status === "UPSTREAM_SUCCESS") {
    result.output = extractor(result.output);
    result.error_code = "";
  }
  return result;
}

async function executeOpenAi({ env, model, system_instruction, payload, response_schema, timeout_ms, max_output_tokens }) {
  const startedAt = Date.now();
  try {
    const response = await fetchOpenAiResponses({
      apiKey: env.OPENAI_API_KEY,
      body: openAiBody({ model, system_instruction, payload, response_schema, env, max_output_tokens }),
      timeoutMs: timeout_ms
    });
    const data = await parseResponse(response);
    const result = baseResult("openai", model, startedAt);
    result.http_status = response.status;
    result.usage = usageFrom(data);
    result.latency_ms = Date.now() - startedAt;
    if (!response.ok) {
      result.error_code = responseErrorCode(response.status);
      result.retryable = transientStatus(response.status);
      return result;
    }
    result.status = "UPSTREAM_SUCCESS";
    result.output = extractOpenAiOutputText(data);
    result.error_code = "";
    return result;
  } catch (error) {
    const result = baseResult("openai", model, startedAt);
    result.error_code = error?.name === "AbortError" ? "TIMEOUT" : "NETWORK_ERROR";
    result.retryable = true;
    return result;
  }
}

async function executeAnthropic({ env, model, system_instruction, payload, response_schema, timeout_ms, max_output_tokens }) {
  return withExtractedOutput(await requestJson({
    providerId: "anthropic",
    modelId: model,
    url: "https://api.anthropic.com/v1/messages",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.claude_api_pdc,
      "anthropic-version": "2023-06-01"
    },
    body: {
      model,
      max_tokens: maxOutputTokens(env, max_output_tokens),
      system: system_instruction,
      messages: [{ role: "user", content: userPayloadText(payload) }],
      output_config: {
        format: {
          type: "json_schema",
          schema: response_schema
        }
      }
    },
    timeoutMs: timeout_ms
  }), extractAnthropicText);
}

async function executeGemini({ env, model, system_instruction, payload, response_schema, timeout_ms, max_output_tokens }) {
  return withExtractedOutput(await requestJson({
    providerId: "gemini",
    modelId: model,
    url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": env["Gemini API Key pdc"]
    },
    body: {
      systemInstruction: { parts: [{ text: system_instruction }] },
      contents: [{ role: "user", parts: [{ text: userPayloadText(payload) }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: response_schema,
        maxOutputTokens: maxOutputTokens(env, max_output_tokens)
      }
    },
    timeoutMs: timeout_ms
  }), extractGeminiText);
}

async function executeDeepSeek({ env, model, system_instruction, payload, timeout_ms, max_output_tokens }) {
  return withExtractedOutput(await requestJson({
    providerId: "deepseek",
    modelId: model,
    url: "https://api.deepseek.com/chat/completions",
    headers: {
      authorization: `Bearer ${env["deepseek api pdc"]}`,
      "content-type": "application/json"
    },
    body: chatBody({
      model,
      system_instruction,
      payload,
      env,
      max_output_tokens,
      responseFormat: { type: "json_object" }
    }),
    timeoutMs: timeout_ms
  }), extractChatText);
}

async function executeKimi({ env, model, system_instruction, payload, timeout_ms, max_output_tokens }) {
  return withExtractedOutput(await requestJson({
    providerId: "kimi",
    modelId: model,
    url: "https://api.moonshot.ai/v1/chat/completions",
    headers: {
      authorization: `Bearer ${env["kimi pdc"]}`,
      "content-type": "application/json"
    },
    body: chatBody({
      model,
      system_instruction,
      payload,
      env,
      max_output_tokens,
      responseFormat: { type: "json_object" }
    }),
    timeoutMs: timeout_ms
  }), extractChatText);
}

export function createProviderAdapter(providerId, env = {}) {
  const definition = getProviderDefinition(providerId);
  if (!definition) return null;
  const credentialBinding = configuredCredentialBinding(env, definition);
  if (!credentialBinding) return null;
  const executors = {
    openai_responses: executeOpenAi,
    anthropic_messages: executeAnthropic,
    gemini_generate_content: executeGemini,
    deepseek_chat_completions: executeDeepSeek,
    kimi_chat_completions: executeKimi
  };
  const executor = executors[definition.adapter_key];
  if (!executor) return null;
  return {
    provider_id: definition.provider_id,
    adapter: definition.adapter,
    credential_reference: credentialBinding,
    async execute({ model, system_instruction, payload, response_schema, timeout_ms, max_output_tokens }) {
      return executor({ env, model, system_instruction, payload, response_schema, timeout_ms, max_output_tokens });
    }
  };
}
