import { json, requestContentLengthTooLarge } from "../../auth/_utils.js";
import { enforceRateLimits, admitBudget, recordBudget } from "../pdc/_controls.js";
import { allowedModelsForProvider } from "../pdc/_provider-registry.js";
import { authenticateBearer, requestId } from "../pdc/_security.js";
import { executionMode } from "../pdc/_provider-service.js";
import { extractOpenAiOutputText, fetchOpenAiResponses } from "../../ai/_openai.js";

const MAX_BODY_BYTES = 2048;
const DEFAULT_PROVIDER_TIMEOUT_MS = 8000;
const MAX_PROVIDER_TIMEOUT_MS = 12000;
const DEFAULT_MAX_OUTPUT_TOKENS = 256;
const MAX_OUTPUT_TOKENS = 512;
const DEFAULT_MAX_ATTEMPTS = 2;

function errorResponse(id, errorCode, message, status) {
  return json({
    api_version: "provider-execution-v1",
    request_id: id,
    mode: "REAL_SHADOW",
    provider: "openai",
    status: "FAIL",
    validation_status: "NOT_RUN",
    provider_output: null,
    error_code: errorCode,
    message
  }, { status, headers: { "x-request-id": id } });
}

function integerOrNull(value) {
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function usageFromResponse(data) {
  const input = integerOrNull(data?.usage?.input_tokens);
  const output = integerOrNull(data?.usage?.output_tokens);
  const explicitTotal = integerOrNull(data?.usage?.total_tokens);
  return {
    input_tokens: input,
    output_tokens: output,
    total_tokens: explicitTotal ?? (input !== null && output !== null ? input + output : null)
  };
}

function pricingFor(env, usage) {
  const inputRate = Number(env.PDC_OPENAI_INPUT_USD_PER_1M);
  const outputRate = Number(env.PDC_OPENAI_OUTPUT_USD_PER_1M);
  if (!Number.isFinite(inputRate) || inputRate < 0 || !Number.isFinite(outputRate) || outputRate < 0) {
    return { currency: "USD", estimated_usd: null, pricing_status: "NOT_CONFIGURED" };
  }
  if (usage.input_tokens === null || usage.output_tokens === null) {
    return { currency: "USD", estimated_usd: null, pricing_status: "USAGE_UNAVAILABLE" };
  }
  return {
    currency: "USD",
    estimated_usd: Number(((usage.input_tokens / 1_000_000) * inputRate + (usage.output_tokens / 1_000_000) * outputRate).toFixed(8)),
    pricing_status: "CONFIGURED"
  };
}

function smokeModel(env) {
  const allowed = allowedModelsForProvider(env, "openai");
  const requested = String(env.PDC_OPENAI_SMOKE_MODEL || "").trim();
  if (requested) return allowed.includes(requested) ? { model: requested, errorCode: "" } : { model: requested, errorCode: "MODEL_NOT_ALLOWED" };
  if (allowed.length === 1) return { model: allowed[0], errorCode: "" };
  return { model: "", errorCode: "MODEL_NOT_ALLOWED" };
}

function providerTimeoutMs(env) {
  const value = Number(env.PDC_OPENAI_SMOKE_TIMEOUT_MS || DEFAULT_PROVIDER_TIMEOUT_MS);
  return Number.isInteger(value) && value >= 1000 ? Math.min(value, MAX_PROVIDER_TIMEOUT_MS) : DEFAULT_PROVIDER_TIMEOUT_MS;
}

function maxOutputTokens(env) {
  const value = Number(env.PDC_OPENAI_SMOKE_MAX_OUTPUT_TOKENS || DEFAULT_MAX_OUTPUT_TOKENS);
  return Number.isInteger(value) && value >= 128 ? Math.min(value, MAX_OUTPUT_TOKENS) : DEFAULT_MAX_OUTPUT_TOKENS;
}

function maxAttempts(env) {
  const value = Number(env.PDC_OPENAI_SMOKE_MAX_ATTEMPTS || DEFAULT_MAX_ATTEMPTS);
  return Number.isInteger(value) && value >= 1 ? Math.min(value, DEFAULT_MAX_ATTEMPTS) : DEFAULT_MAX_ATTEMPTS;
}

function requestBudgetUsd(env) {
  const value = Number(env.PDC_OPENAI_SMOKE_REQUEST_BUDGET_USD);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function preflightEstimatedCost(env, outputTokens) {
  const inputRate = Number(env.PDC_OPENAI_INPUT_USD_PER_1M);
  const outputRate = Number(env.PDC_OPENAI_OUTPUT_USD_PER_1M);
  if (!Number.isFinite(inputRate) || inputRate < 0 || !Number.isFinite(outputRate) || outputRate < 0) return null;
  // The smoke prompt is fixed and intentionally small. Use a conservative
  // fixed input allowance before making the provider call.
  const estimatedInputTokens = 256;
  return Number(((estimatedInputTokens / 1_000_000) * inputRate + (outputTokens / 1_000_000) * outputRate).toFixed(8));
}

function transientStatus(status) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

function providerErrorCode(status) {
  if (status === 401 || status === 403) return "AUTH_FAILED";
  if (status === 404) return "MODEL_NOT_FOUND";
  if (status === 408 || status === 504) return "TIMEOUT";
  if (status === 429) return "RATE_LIMITED";
  return "PROVIDER_ERROR";
}

function smokeSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["provider_test", "score"],
    properties: {
      provider_test: { type: "boolean" },
      score: { type: "number", minimum: 0, maximum: 10 }
    }
  };
}

function smokeRequestBody(model, outputTokens) {
  return {
    model,
    instructions: "Return only the exact JSON object {\"provider_test\":true,\"score\":7}. No Markdown, prose, or additional fields.",
    input: [{
      role: "user",
      content: [{ type: "input_text", text: "Return strict JSON only: {\"provider_test\":true,\"score\":7}" }]
    }],
    text: {
      format: {
        type: "json_schema",
        name: "openai_provider_smoke_v1",
        strict: true,
        schema: smokeSchema()
      }
    },
    max_output_tokens: outputTokens
  };
}

async function parseSmokeRequest(request) {
  if (requestContentLengthTooLarge(request, MAX_BODY_BYTES)) throw new Error("body-too-large");
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) throw new Error("body-too-large");
  if (!raw.trim()) throw new Error("body-required");
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("invalid-json");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid-body");
  const keys = Object.keys(value);
  if (keys.length !== 1 || keys[0] !== "provider_test" || value.provider_test !== true) throw new Error("invalid-body");
}

function safeLog(event) {
  console.log(JSON.stringify({ event: "turnpo_openai_provider_smoke", ...event }));
}

export async function onRequestPost({ request, env = {} }) {
  const id = requestId();
  const authentication = authenticateBearer(request, env, ["LOCAL_PDC_AI_TOKEN"]);
  if (authentication.status === "NOT_CONFIGURED") return errorResponse(id, "SERVICE_NOT_CONFIGURED", "Local PDC AI token is not configured.", 503);
  if (authentication.status !== "OK") return errorResponse(id, "UNAUTHORIZED", "A valid Local PDC AI token is required.", 401);

  const mode = executionMode(env);
  if (mode !== "REAL_SHADOW") {
    const code = mode === "PRODUCTION" ? "PRODUCTION_MODE_NOT_AVAILABLE" : "SMOKE_REQUIRES_REAL_SHADOW";
    return errorResponse(id, code, "The OpenAI smoke endpoint only runs in explicit REAL_SHADOW mode.", 409);
  }
  if (String(env.PDC_OPENAI_SMOKE_ENABLED || "").toLowerCase() !== "true") {
    return errorResponse(id, "SMOKE_DISABLED", "OpenAI provider smoke test is disabled on this deployment.", 409);
  }

  try {
    await parseSmokeRequest(request);
  } catch (error) {
    return errorResponse(id, "INVALID_REQUEST", "Smoke request must be exactly {provider_test:true}.", 422);
  }

  const modelSelection = smokeModel(env);
  if (modelSelection.errorCode) return errorResponse(id, modelSelection.errorCode, "The smoke model is not in the server-side OpenAI allowlist.", 503);
  if (!env.OPENAI_API_KEY) return errorResponse(id, "SECRET_MISSING", "OpenAI credential binding is not configured.", 503);

  const outputTokens = maxOutputTokens(env);
  const budgetUsd = requestBudgetUsd(env);
  const preflightCost = preflightEstimatedCost(env, outputTokens);
  if (budgetUsd !== null && preflightCost !== null && preflightCost > budgetUsd) {
    return errorResponse(id, "BUDGET_BLOCKED", "The smoke request maximum is above the configured request budget.", 429);
  }
  const budgetInput = {
    run_id: id,
    budget: { max_cost_usd: budgetUsd ?? 0.01 }
  };
  const budgetAdmission = await admitBudget({ input: budgetInput, env, provider: "openai" });
  if (!budgetAdmission.allowed) return errorResponse(id, "BUDGET_BLOCKED", "OpenAI smoke request was blocked by the configured budget gate.", 429);

  const rate = await enforceRateLimits({ request, env, token: authentication.token, input: { run_id: id } });
  if (!rate.allowed) return errorResponse(id, rate.errorCode === "RATE_LIMITED" ? "RATE_LIMITED" : "RATE_LIMIT_STORE_UNAVAILABLE", "OpenAI smoke request was blocked by the configured rate limit.", rate.errorCode === "RATE_LIMITED" ? 429 : 503);

  const attemptsAllowed = maxAttempts(env);
  const body = smokeRequestBody(modelSelection.model, outputTokens);
  const startedAt = Date.now();
  let attempts = 0;
  let retryCount = 0;
  let usage = { input_tokens: null, output_tokens: null, total_tokens: null };
  let cost = pricingFor(env, usage);
  let errorCode = "PROVIDER_ERROR";
  let output = null;

  while (attempts < attemptsAllowed) {
    attempts += 1;
    try {
      const response = await fetchOpenAiResponses({
        apiKey: env.OPENAI_API_KEY,
        body,
        timeoutMs: providerTimeoutMs(env)
      });
      const data = await response.json().catch(() => ({}));
      usage = usageFromResponse(data);
      cost = pricingFor(env, usage);
      if (!response.ok) {
        errorCode = providerErrorCode(response.status);
        if (transientStatus(response.status) && attempts < attemptsAllowed) {
          retryCount += 1;
          continue;
        }
        break;
      }
      const outputText = extractOpenAiOutputText(data);
      if (!outputText) {
        errorCode = "INVALID_JSON";
        break;
      }
      try {
        output = JSON.parse(outputText);
      } catch {
        errorCode = "INVALID_JSON";
        break;
      }
      if (
        !output
        || typeof output !== "object"
        || Array.isArray(output)
        || Object.keys(output).length !== 2
        || output.provider_test !== true
        || typeof output.score !== "number"
        || output.score !== 7
      ) {
        errorCode = "SCHEMA_FAILED";
        output = null;
        break;
      }
      if (budgetUsd !== null && (cost.estimated_usd === null || cost.estimated_usd > budgetUsd)) {
        errorCode = "BUDGET_BLOCKED";
        output = null;
        break;
      }
      break;
    } catch (error) {
      errorCode = error?.name === "AbortError" ? "TIMEOUT" : "NETWORK_FAILED";
      if (errorCode === "NETWORK_FAILED" && attempts < attemptsAllowed) {
        retryCount += 1;
        continue;
      }
      break;
    }
  }

  const latencyMs = Date.now() - startedAt;
  const budgetStatus = await recordBudget({ env, input: budgetInput, provider: "openai", cost });
  const passed = output !== null && errorCode !== "BUDGET_BLOCKED";
  safeLog({
    request_id: id,
    provider: "openai",
    model: modelSelection.model,
    timestamp: new Date().toISOString(),
    mode,
    status: passed ? "PASS" : "FAIL",
    validation_status: passed ? "VALID" : "INVALID",
    attempts,
    retry_count: retryCount,
    latency_ms: latencyMs,
    usage,
    estimated_usd: cost.estimated_usd,
    pricing_status: cost.pricing_status,
    budget_status: budgetStatus,
    error_code: passed ? "" : errorCode
  });
  return json({
    api_version: "provider-execution-v1",
    request_id: id,
    mode,
    provider: "openai",
    model: modelSelection.model,
    status: passed ? "PASS" : "FAIL",
    validation_status: passed ? "VALID" : "INVALID",
    provider_output: passed ? { provider_test: true, score: 7 } : null,
    attempts,
    retry_count: retryCount,
    latency_ms: latencyMs,
    usage,
    cost: { ...cost, tracking_status: budgetStatus === "NOT_CONFIGURED" ? "LOGGED_ONLY" : "PENDING" },
    error_code: passed ? "" : errorCode
  }, { status: passed ? 200 : (errorCode === "TIMEOUT" ? 504 : errorCode === "RATE_LIMITED" ? 429 : errorCode === "BUDGET_BLOCKED" ? 429 : 502), headers: { "x-request-id": id } });
}

export async function onRequestGet({ request }) {
  return errorResponse(requestId(), "METHOD_NOT_ALLOWED", "Use POST for the OpenAI provider smoke test.", 405);
}
