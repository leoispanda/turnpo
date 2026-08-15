import {
  ProviderContractError,
  smokeOutputIsExact,
  validateOutputAgainstSchema
} from "./_provider-contract.js";
import {
  allowedModelsForProvider,
  configuredCredentialBinding,
  getProviderDefinition,
  pricingEnvironment,
  providerHealth
} from "./_provider-registry.js";
import { createProviderAdapter } from "./_provider-adapters.js";
import { admitBudget, recordBudget } from "./_controls.js";

const GATEWAY_MODES = Object.freeze(["OFFLINE_TEST", "REAL_SHADOW", "PRODUCTION"]);

function gatewayMode(env = {}) {
  const value = String(
    env.LOCAL_PDC_GATEWAY_MODE
      || env.TURNPO_PDC_EXECUTION_MODE
      || env.PDC_EXECUTION_MODE
      || "OFFLINE_TEST"
  ).trim().toUpperCase();
  return GATEWAY_MODES.includes(value) ? value : "INVALID";
}

function unavailableUsage(retryCount = 0) {
  return {
    input_tokens: "UNAVAILABLE",
    output_tokens: "UNAVAILABLE",
    total_tokens: "UNAVAILABLE",
    retry_count: retryCount
  };
}

function publicUsage(usage, retryCount) {
  return {
    input_tokens: Number.isInteger(usage?.input_tokens) ? usage.input_tokens : "UNAVAILABLE",
    output_tokens: Number.isInteger(usage?.output_tokens) ? usage.output_tokens : "UNAVAILABLE",
    total_tokens: Number.isInteger(usage?.total_tokens) ? usage.total_tokens : "UNAVAILABLE",
    retry_count: retryCount
  };
}

function pricingFor(env, providerId, usage) {
  const pricing = pricingEnvironment(providerId);
  const inputRate = pricing ? Number(env[pricing.input]) : NaN;
  const outputRate = pricing ? Number(env[pricing.output]) : NaN;
  const configured = Number.isFinite(inputRate) && inputRate >= 0 && Number.isFinite(outputRate) && outputRate >= 0;
  if (!configured || !Number.isInteger(usage?.input_tokens) || !Number.isInteger(usage?.output_tokens)) {
    return {
      estimated_usd: null,
      pricing_status: configured ? "USAGE_UNAVAILABLE" : "NOT_CONFIGURED"
    };
  }
  return {
    estimated_usd: Number(((usage.input_tokens / 1_000_000) * inputRate + (usage.output_tokens / 1_000_000) * outputRate).toFixed(8)),
    pricing_status: "CONFIGURED"
  };
}

function publicCost(cost, trackingStatus = "UNAVAILABLE") {
  return {
    currency: "USD",
    usd: cost?.estimated_usd === null || cost?.estimated_usd === undefined ? "UNAVAILABLE" : cost.estimated_usd,
    pricing_status: cost?.pricing_status || "NOT_CONFIGURED",
    tracking_status: trackingStatus
  };
}

function emptyResult({ input, errorCode, latencyMs = "UNAVAILABLE", usage, cost, retryCount = 0 }) {
  return {
    contract_version: input.contract_version,
    request_id: input.request_id,
    run_id: input.run_id,
    provider_id: input.provider_id,
    model_id: input.model_id,
    task_type: input.task_type,
    status: "FAIL",
    output: "UNAVAILABLE",
    usage: usage || unavailableUsage(retryCount),
    cost: publicCost(cost || { estimated_usd: null, pricing_status: "NOT_CONFIGURED" }),
    latency_ms: latencyMs,
    error_code: errorCode
  };
}

function failureStatus(errorCode) {
  if (errorCode === "MODEL_NOT_ALLOWED" || errorCode === "TASK_NOT_ALLOWED" || errorCode === "INVALID_REQUEST") return 422;
  if (errorCode === "PROVIDER_NOT_CONFIGURED" || errorCode === "PROVIDER_DISABLED") return 503;
  if (errorCode === "TIMEOUT") return 504;
  if (errorCode === "RATE_LIMITED" || errorCode === "BUDGET_BLOCKED") return 429;
  return 502;
}

function retryable(result) {
  return result?.error_code === "RATE_LIMITED"
    || result?.error_code === "NETWORK_ERROR"
    || (result?.error_code === "PROVIDER_ERROR" && (result.http_status === null || result.http_status >= 500));
}

function safeLog(event) {
  // Never log system_instruction, payload, response_schema, provider output or secrets.
  console.log(JSON.stringify({ event: "turnpo_provider_gateway_execution", ...event }));
}

function normalizeProviderFailure({ input, result, retryCount, startedAt, env }) {
  const usage = publicUsage(result?.usage, retryCount);
  const cost = pricingFor(env, input.provider_id, result?.usage);
  return emptyResult({
    input,
    errorCode: result?.error_code || "PROVIDER_ERROR",
    latencyMs: Number.isFinite(result?.latency_ms) ? Date.now() - startedAt : "UNAVAILABLE",
    usage,
    cost,
    retryCount
  });
}

export async function executeProviderRequest({ input, env = {} }) {
  const startedAt = Date.now();
  const definition = getProviderDefinition(input.provider_id);
  if (!definition) {
    return { status: 422, body: emptyResult({ input, errorCode: "INVALID_REQUEST" }) };
  }

  const health = providerHealth(env, input.provider_id);
  if (health?.health_status === "DISABLED") {
    return { status: failureStatus("PROVIDER_DISABLED"), body: emptyResult({ input, errorCode: "PROVIDER_DISABLED" }) };
  }
  if (!configuredCredentialBinding(env, definition)) {
    return { status: failureStatus("PROVIDER_NOT_CONFIGURED"), body: emptyResult({ input, errorCode: "PROVIDER_NOT_CONFIGURED" }) };
  }
  const allowedModels = allowedModelsForProvider(env, input.provider_id);
  if (!allowedModels.includes(input.model_id)) {
    return { status: failureStatus("MODEL_NOT_ALLOWED"), body: emptyResult({ input, errorCode: "MODEL_NOT_ALLOWED" }) };
  }
  if (!definition.adapter_key || !createProviderAdapter(input.provider_id, env)) {
    return { status: failureStatus("PROVIDER_NOT_CONFIGURED"), body: emptyResult({ input, errorCode: "PROVIDER_NOT_CONFIGURED" }) };
  }

  const mode = gatewayMode(env);
  if (mode !== "REAL_SHADOW") {
    return { status: mode === "INVALID" ? 500 : 409, body: emptyResult({ input, errorCode: "PROVIDER_DISABLED" }) };
  }

  if (input.budget.max_cost_usd !== undefined) {
    const pricing = pricingFor(env, input.provider_id, { input_tokens: 0, output_tokens: 0 });
    if (pricing.pricing_status !== "CONFIGURED") {
      return { status: failureStatus("BUDGET_BLOCKED"), body: emptyResult({ input, errorCode: "BUDGET_BLOCKED" }) };
    }
  }

  const budgetAdmission = await admitBudget({ env, input, provider: input.provider_id });
  if (!budgetAdmission.allowed) {
    return { status: failureStatus("BUDGET_BLOCKED"), body: emptyResult({ input, errorCode: "BUDGET_BLOCKED" }) };
  }

  const adapter = createProviderAdapter(input.provider_id, env);
  const attemptsAllowed = 1 + Math.min(input.max_retries, health?.max_retries || 1);
  let attempts = 0;
  let lastResult = null;
  let output = null;
  let validationError = "";

  while (attempts < attemptsAllowed) {
    attempts += 1;
    lastResult = await adapter.execute({
      model: input.model_id,
      system_instruction: input.system_instruction,
      payload: input.payload,
      response_schema: input.response_schema,
      timeout_ms: Math.min(input.timeout_ms, health?.timeout_ms || input.timeout_ms),
      max_output_tokens: input.budget.max_output_tokens
    });
    if (lastResult.status !== "UPSTREAM_SUCCESS") {
      if (retryable(lastResult) && attempts < attemptsAllowed) continue;
      break;
    }

    if (typeof lastResult.output !== "string" || !lastResult.output.trim()) {
      validationError = "INVALID_JSON";
      break;
    }
    try {
      output = JSON.parse(lastResult.output);
    } catch {
      validationError = "INVALID_JSON";
      output = null;
      break;
    }
    try {
      validateOutputAgainstSchema(output, input.response_schema);
      if (input.task_type === "SMOKE" && !smokeOutputIsExact(output)) {
        throw new ProviderContractError("SMOKE output must equal {provider_test:true,score:7}.");
      }
    } catch {
      validationError = "SCHEMA_FAILED";
      output = null;
    }
    break;
  }

  const retryCount = Math.max(0, attempts - 1);
  const usage = lastResult?.usage || { input_tokens: null, output_tokens: null, total_tokens: null };
  const cost = pricingFor(env, input.provider_id, usage);
  const latencyMs = Date.now() - startedAt;
  const budgetStatus = await recordBudget({ env, input, provider: input.provider_id, cost });
  const trackingStatus = budgetStatus === "PERSISTED" ? "PERSISTED" : budgetStatus === "LOGGED_ONLY" || budgetStatus === "NOT_CONFIGURED" ? "LOGGED_ONLY" : "UNAVAILABLE";

  if (
    !validationError
    && lastResult?.status === "UPSTREAM_SUCCESS"
    && input.budget.max_cost_usd !== undefined
    && (cost.estimated_usd === null || cost.estimated_usd > input.budget.max_cost_usd)
  ) {
    validationError = "BUDGET_BLOCKED";
    output = null;
  }

  if (validationError) {
    safeLog({
      request_id: input.request_id,
      run_id: input.run_id,
      provider_id: input.provider_id,
      model_id: input.model_id,
      task_type: input.task_type,
      timestamp: new Date().toISOString(),
      status: "FAIL",
      error_code: validationError,
      attempts,
      retry_count: retryCount,
      latency_ms: latencyMs,
      usage: publicUsage(usage, retryCount),
      cost: publicCost(cost, trackingStatus)
    });
    return {
      status: failureStatus(validationError),
      body: emptyResult({
        input,
        errorCode: validationError,
        latencyMs,
        usage: publicUsage(usage, retryCount),
        cost,
        retryCount
      })
    };
  }

  if (!lastResult || lastResult.status !== "UPSTREAM_SUCCESS") {
    const body = normalizeProviderFailure({ input, result: lastResult, retryCount, startedAt, env });
    body.cost = publicCost(cost, trackingStatus);
    safeLog({
      request_id: input.request_id,
      run_id: input.run_id,
      provider_id: input.provider_id,
      model_id: input.model_id,
      task_type: input.task_type,
      timestamp: new Date().toISOString(),
      status: "FAIL",
      error_code: body.error_code,
      attempts,
      retry_count: retryCount,
      latency_ms: latencyMs,
      usage: body.usage,
      cost: body.cost
    });
    return { status: failureStatus(body.error_code), body };
  }

  const body = {
    contract_version: input.contract_version,
    request_id: input.request_id,
    run_id: input.run_id,
    provider_id: input.provider_id,
    model_id: input.model_id,
    task_type: input.task_type,
    status: "SUCCESS",
    output,
    usage: publicUsage(usage, retryCount),
    cost: publicCost(cost, trackingStatus),
    latency_ms: latencyMs,
    error_code: "SUCCESS"
  };
  safeLog({
    request_id: input.request_id,
    run_id: input.run_id,
    provider_id: input.provider_id,
    model_id: input.model_id,
    task_type: input.task_type,
    timestamp: new Date().toISOString(),
    status: "SUCCESS",
    error_code: "SUCCESS",
    attempts,
    retry_count: retryCount,
    latency_ms: latencyMs,
    usage: body.usage,
    cost: body.cost
  });
  return { status: 200, body };
}

export { gatewayMode };
