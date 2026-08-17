import { extractOpenAiOutputText, fetchOpenAiResponses } from "../../ai/_openai.js";
import {
  API_VERSION,
  ContractError,
  EVALUATION_SCHEMA_VERSION,
  EXECUTION_MODES,
  validateScorecards,
  openAiScorecardSchema
} from "./_contract.js";
import {
  allowedModelsForProvider,
  getProviderDefinition
} from "./_provider-registry.js";
import { admitBudget, recordBudget } from "./_controls.js";

const DEFAULT_MAX_OUTPUT_TOKENS = 4000;
const MAX_SERVER_OUTPUT_TOKENS = 16000;
const COST_RECORD_TTL_SECONDS = 90 * 24 * 60 * 60;

function integerOrNull(value) {
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function envNumber(env, key) {
  const value = Number(env[key]);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function configuredModel(env) {
  return String(
    env.PDC_OPENAI_MODEL
      || env.OPENAI_PDC_MODEL
      || env.OPENAI_MODEL
      || ""
  ).trim();
}

function allowedOpenAiModels(env) {
  return new Set(allowedModelsForProvider(env, "openai"));
}

export function executionMode(env = {}) {
  const mode = String(
    env.LOCAL_PDC_GATEWAY_MODE
      || env.TURNPO_PDC_EXECUTION_MODE
      || env.PDC_EXECUTION_MODE
      || "OFFLINE_TEST"
  ).trim().toUpperCase();
  return EXECUTION_MODES.includes(mode) ? mode : "INVALID";
}

function usageFromResponse(data) {
  const input = integerOrNull(data?.usage?.input_tokens);
  const output = integerOrNull(data?.usage?.output_tokens);
  const explicitTotal = integerOrNull(data?.usage?.total_tokens);
  const total = explicitTotal ?? (input !== null && output !== null ? input + output : null);
  return {
    input_tokens: input,
    output_tokens: output,
    total_tokens: total
  };
}

function emptyUsage(retryCount = 0) {
  return {
    input_tokens: null,
    output_tokens: null,
    total_tokens: null,
    retry_count: retryCount
  };
}

function pricingFor(env, usage) {
  const inputRate = envNumber(env, "PDC_OPENAI_INPUT_USD_PER_1M");
  const outputRate = envNumber(env, "PDC_OPENAI_OUTPUT_USD_PER_1M");
  const input = usage.input_tokens;
  const output = usage.output_tokens;
  let pricingStatus = "NOT_CONFIGURED";
  let estimated = null;
  if (inputRate !== null && outputRate !== null) {
    pricingStatus = input !== null && output !== null ? "CONFIGURED" : "USAGE_UNAVAILABLE";
    if (pricingStatus === "CONFIGURED") {
      estimated = Number(((input / 1_000_000) * inputRate + (output / 1_000_000) * outputRate).toFixed(8));
    }
  }
  return {
    currency: "USD",
    estimated_usd: estimated,
    pricing_status: pricingStatus,
    tracking_status: "PENDING"
  };
}

async function persistCost(env, event) {
  const store = env.PDC_COST_KV;
  if (!store || typeof store.put !== "function") return "LOGGED_ONLY";
  try {
    await store.put(
      `pdc:provider-cost:${event.run_id}:${event.request_id}`,
      JSON.stringify(event),
      { expirationTtl: COST_RECORD_TTL_SECONDS }
    );
    return "PERSISTED";
  } catch {
    return "LOGGED_ONLY";
  }
}

function safeLog(event) {
  // Deliberately excludes prompts, frozen facts, model output and secrets.
  console.log(JSON.stringify({ event: "turnpo_pdc_provider_execution", ...event }));
}

function buildPrompt(input) {
  return [
    "You are the Turnpo Provider Execution Service for research-only stock PDC evaluation.",
    `Evaluation task: ${input.task_type}.`,
    "Use only the supplied frozen facts. Do not browse, infer missing market facts, or invent evidence.",
    "Return only JSON matching the supplied schema. Do not return Markdown, prose, explanations, summaries, or additional fields.",
    "Return exactly one scorecard for every candidate ticker and no other ticker.",
    "Every dimension, score, and confidence value is required. Use risk flags for missing or stale data.",
    "BUY, WATCH, HOLD and SELL are research labels only; do not produce orders, trade execution instructions, price targets, or portfolio actions.",
    "If the frozen facts are insufficient, still return a complete schema-valid scorecard with conservative numeric scores, the appropriate risk flags, and lower confidence. Never fabricate completion outside the schema.",
    "Candidates:",
    JSON.stringify(input.candidates),
    "Frozen facts:",
    JSON.stringify(input.frozen_facts)
  ].join("\n");
}

function transientStatus(status) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

function providerResult({ provider, model, status, attempts, validationStatus, usage, cost, errorCode = "" }) {
  return {
    provider,
    model,
    status,
    attempts,
    validation_status: validationStatus,
    error_code: errorCode,
    usage,
    cost
  };
}

function failureStatus(errorCode) {
  if (
    errorCode === "PROVIDER_NOT_CONFIGURED"
    || errorCode === "MODEL_NOT_ALLOWED"
    || errorCode === "BUDGET_PRICING_UNCONFIGURED"
    || errorCode === "BUDGET_STORE_NOT_CONFIGURED"
    || errorCode === "BUDGET_STORE_UNAVAILABLE"
    || errorCode === "BUDGET_MAX_COST_REQUIRED"
    || errorCode === "BUDGET_USAGE_UNAVAILABLE"
  ) return 503;
  if (errorCode === "UPSTREAM_TIMEOUT") return 504;
  if (errorCode === "BUDGET_BLOCKED" || errorCode === "BUDGET_EXCEEDED") return 429;
  if (errorCode === "INVALID_PROVIDER_OUTPUT") return 502;
  return 502;
}

function maxOutputTokens(input, env) {
  const serverDefault = Number(env.PDC_MAX_OUTPUT_TOKENS || DEFAULT_MAX_OUTPUT_TOKENS);
  const safeDefault = Number.isInteger(serverDefault) && serverDefault >= 256
    ? Math.min(serverDefault, MAX_SERVER_OUTPUT_TOKENS)
    : DEFAULT_MAX_OUTPUT_TOKENS;
  return Math.min(input.budget.max_output_tokens || safeDefault, safeDefault, MAX_SERVER_OUTPUT_TOKENS);
}

function buildResponse({ input, requestId, mode, providerResults, scorecards, usage, cost, validationStatus }) {
  return {
    api_version: API_VERSION,
    evaluation_schema_version: EVALUATION_SCHEMA_VERSION,
    request_id: requestId,
    mode,
    run_id: input.run_id,
    provider_results: providerResults,
    scorecards,
    usage,
    cost,
    validation_status: validationStatus
  };
}

async function executeOpenAi({ input, env }) {
  const provider = "openai";
  const allowedModels = allowedOpenAiModels(env);
  const model = input.model_selection.model
    || configuredModel(env)
    || (allowedModels.size === 1 ? [...allowedModels][0] : "");
  if (!env.OPENAI_API_KEY) {
    const usage = emptyUsage();
    const cost = pricingFor(env, usage);
    return {
      status: 503,
      scorecards: [],
      usage,
      cost,
      providerResult: providerResult({
        provider,
        model,
        status: "FAILED",
        attempts: 0,
        validationStatus: "NOT_RUN",
        usage,
        cost,
        errorCode: "PROVIDER_NOT_CONFIGURED"
      })
    };
  }
  if (!allowedModels.has(model)) {
    const usage = emptyUsage();
    const cost = pricingFor(env, usage);
    return {
      status: 503,
      scorecards: [],
      usage,
      cost,
      providerResult: providerResult({
        provider,
        model,
        status: "FAILED",
        attempts: 0,
        validationStatus: "NOT_RUN",
        usage,
        cost,
        errorCode: "MODEL_NOT_ALLOWED"
      })
    };
  }

  const inputRatesConfigured = envNumber(env, "PDC_OPENAI_INPUT_USD_PER_1M") !== null
    && envNumber(env, "PDC_OPENAI_OUTPUT_USD_PER_1M") !== null;
  if (input.budget.max_cost_usd !== undefined && !inputRatesConfigured) {
    const usage = emptyUsage();
    const cost = pricingFor(env, usage);
    return {
      status: 503,
      scorecards: [],
      usage,
      cost,
      providerResult: providerResult({
        provider,
        model,
        status: "FAILED",
        attempts: 0,
        validationStatus: "NOT_RUN",
        usage,
        cost,
        errorCode: "BUDGET_PRICING_UNCONFIGURED"
      })
    };
  }

  const body = {
    model,
    instructions: "Return only the strict PDC AI Contract v1 JSON object. No narrative text and no uncontrolled fields.",
    input: [
      {
        role: "user",
        content: [{ type: "input_text", text: buildPrompt(input) }]
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "pdc_ai_contract_v1",
        strict: true,
        schema: openAiScorecardSchema()
      }
    },
    max_output_tokens: maxOutputTokens(input, env)
  };

  let attempts = 0;
  let retryCount = 0;
  let lastErrorCode = "UPSTREAM_ERROR";
  let lastUsage = emptyUsage();
  while (attempts < input.retry.max_attempts) {
    attempts += 1;
    try {
      const response = await fetchOpenAiResponses({
        apiKey: env.OPENAI_API_KEY,
        body,
        timeoutMs: input.timeout_ms
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        lastErrorCode = response.status === 408 || response.status === 504 ? "UPSTREAM_TIMEOUT" : "UPSTREAM_ERROR";
        if (transientStatus(response.status) && attempts < input.retry.max_attempts) {
          retryCount += 1;
          continue;
        }
        break;
      }
      const usage = usageFromResponse(data);
      lastUsage = { ...usage, retry_count: retryCount };
      const outputText = extractOpenAiOutputText(data);
      if (!outputText) {
        lastErrorCode = "INVALID_PROVIDER_OUTPUT";
        break;
      }
      let parsed;
      try {
        parsed = JSON.parse(outputText);
      } catch {
        lastErrorCode = "INVALID_PROVIDER_OUTPUT";
        break;
      }
      let scorecards;
      try {
        scorecards = validateScorecards(parsed?.scorecards, input.candidates);
      } catch {
        lastErrorCode = "INVALID_PROVIDER_OUTPUT";
        break;
      }
      if (input.budget.max_total_tokens !== undefined
        && (usage.total_tokens === null || usage.total_tokens > input.budget.max_total_tokens)) {
        lastErrorCode = "BUDGET_BLOCKED";
        break;
      }
      const cost = pricingFor(env, lastUsage);
      if (input.budget.max_cost_usd !== undefined
        && (cost.estimated_usd === null || cost.estimated_usd > input.budget.max_cost_usd)) {
        lastErrorCode = cost.estimated_usd === null ? "BUDGET_USAGE_UNAVAILABLE" : "BUDGET_BLOCKED";
        break;
      }
      return {
        status: 200,
        scorecards,
        usage: lastUsage,
        cost,
        providerResult: providerResult({
          provider,
          model,
          status: "COMPLETED",
          attempts,
          validationStatus: "VALID",
          usage: lastUsage,
          cost
        })
      };
    } catch (error) {
      lastErrorCode = error?.name === "AbortError" ? "UPSTREAM_TIMEOUT" : "UPSTREAM_ERROR";
      if (attempts < input.retry.max_attempts) {
        retryCount += 1;
        continue;
      }
    }
  }

  lastUsage.retry_count = retryCount;
  const cost = pricingFor(env, lastUsage);
  return {
    status: failureStatus(lastErrorCode),
    scorecards: [],
    usage: lastUsage,
    cost,
    providerResult: providerResult({
      provider,
      model,
      status: "FAILED",
      attempts,
      validationStatus: "INVALID",
      usage: lastUsage,
      cost,
      errorCode: lastErrorCode
    })
  };
}

// The registry is metadata-first. Only an entry with a registered adapter is
// callable; protocol-only providers never fall through to a guessed transport.
const ADAPTERS = Object.freeze({ openai_responses: executeOpenAi });

export async function executeEvaluation({ input, env = {}, requestId, mode }) {
  if (!EXECUTION_MODES.includes(mode)) {
    throw new ContractError("Invalid provider execution mode.");
  }
  if (mode === "PRODUCTION") {
    return {
      status: 409,
      body: {
        api_version: API_VERSION,
        evaluation_schema_version: EVALUATION_SCHEMA_VERSION,
        request_id: requestId,
        mode,
        error_code: "PRODUCTION_MODE_NOT_AVAILABLE",
        message: "The shadow endpoint cannot execute in PRODUCTION mode."
      }
    };
  }

  const provider = input.model_selection.provider;
  const requestedModel = input.model_selection.model || "";
  if (mode === "OFFLINE_TEST") {
    const usage = emptyUsage();
    const cost = pricingFor(env, usage);
    const result = providerResult({
      provider,
      model: requestedModel,
      status: "NOT_RUN",
      attempts: 0,
      validationStatus: "NOT_RUN",
      usage,
      cost,
      errorCode: "OFFLINE_TEST_NO_PROVIDER_CALL"
    });
    safeLog({
      request_id: requestId,
      run_id: input.run_id,
      snapshot_id: input.snapshot_id,
      task_type: input.task_type,
      mode,
      provider,
      model: requestedModel,
      status: result.status,
      validation_status: result.validation_status,
      error_code: result.error_code
    });
    return {
      status: 200,
      body: buildResponse({
        input,
        requestId,
        mode,
        providerResults: [result],
        scorecards: [],
        usage,
        cost,
        validationStatus: "NOT_RUN"
      })
    };
  }

  const definition = getProviderDefinition(provider);
  const adapter = definition ? ADAPTERS[definition.adapter_key] : null;
  if (!adapter) {
    const usage = emptyUsage();
    const cost = pricingFor(env, usage);
    const result = providerResult({
      provider,
      model: requestedModel,
      status: "FAILED",
      attempts: 0,
      validationStatus: "NOT_RUN",
      usage,
      cost,
      errorCode: "PROVIDER_NOT_CONFIGURED"
    });
    safeLog({
      request_id: requestId,
      run_id: input.run_id,
      snapshot_id: input.snapshot_id,
      task_type: input.task_type,
      mode,
      provider,
      model: requestedModel,
      status: result.status,
      validation_status: result.validation_status,
      error_code: result.error_code
    });
    return {
      status: 503,
      body: buildResponse({
        input,
        requestId,
        mode,
        providerResults: [result],
        scorecards: [],
        usage,
        cost,
        validationStatus: "NOT_RUN"
      })
    };
  }

  const budgetAdmission = await admitBudget({ input, env, provider });
  if (!budgetAdmission.allowed) {
    const usage = emptyUsage();
    const cost = pricingFor(env, usage);
    const result = providerResult({
      provider,
      model: requestedModel,
      status: "FAILED",
      attempts: 0,
      validationStatus: "NOT_RUN",
      usage,
      cost,
      errorCode: budgetAdmission.errorCode
    });
    safeLog({
      request_id: requestId,
      run_id: input.run_id,
      snapshot_id: input.snapshot_id,
      task_type: input.task_type,
      mode,
      provider,
      model: requestedModel,
      status: result.status,
      validation_status: result.validation_status,
      error_code: result.error_code,
      budget_status: budgetAdmission.status
    });
    return {
      status: failureStatus(budgetAdmission.errorCode),
      body: buildResponse({
        input,
        requestId,
        mode,
        providerResults: [result],
        scorecards: [],
        usage,
        cost,
        validationStatus: "NOT_RUN"
      })
    };
  }

  const execution = await adapter({ input, env });
  const trackingStatus = await persistCost(env, {
    request_id: requestId,
    run_id: input.run_id,
    snapshot_id: input.snapshot_id,
    task_type: input.task_type,
    mode,
    provider: execution.providerResult.provider,
    model: execution.providerResult.model,
    status: execution.providerResult.status,
    validation_status: execution.providerResult.validation_status,
    error_code: execution.providerResult.error_code,
    usage: execution.usage,
    estimated_usd: execution.cost.estimated_usd,
    pricing_status: execution.cost.pricing_status
  });
  execution.cost.tracking_status = trackingStatus;
  execution.providerResult.cost.tracking_status = trackingStatus;
  const budgetStatus = await recordBudget({
    env,
    input,
    provider: execution.providerResult.provider,
    cost: execution.cost
  });
  safeLog({
    request_id: requestId,
    run_id: input.run_id,
    snapshot_id: input.snapshot_id,
    task_type: input.task_type,
    mode,
    provider: execution.providerResult.provider,
    model: execution.providerResult.model,
    status: execution.providerResult.status,
    validation_status: execution.providerResult.validation_status,
    attempts: execution.providerResult.attempts,
    error_code: execution.providerResult.error_code,
    usage: execution.usage,
    estimated_usd: execution.cost.estimated_usd,
    pricing_status: execution.cost.pricing_status,
    tracking_status: trackingStatus,
    budget_status: budgetStatus
  });
  const validationStatus = execution.providerResult.status === "COMPLETED"
    ? "VALID"
    : execution.providerResult.validation_status;
  return {
    status: execution.status,
    body: buildResponse({
      input,
      requestId,
      mode,
      providerResults: [execution.providerResult],
      scorecards: execution.scorecards,
      usage: execution.usage,
      cost: execution.cost,
      validationStatus
    })
  };
}
