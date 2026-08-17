import {
  json,
  requestContentLengthTooLarge,
  validateJsonMutationRequest
} from "../../auth/_utils.js";
import {
  ProviderContractError,
  PROVIDER_CONTRACT_VERSION,
  validateProviderRequest
} from "./_provider-contract.js";
import { enforceRateLimits } from "./_controls.js";
import { executeProviderRequest } from "./_provider-execution-service.js";
import { authenticateBearer, requestId } from "./_security.js";

const MAX_BODY_BYTES = 256 * 1024;

function unavailableEnvelope(id, errorCode, runId = "UNAVAILABLE", providerId = "UNAVAILABLE", modelId = "UNAVAILABLE", taskType = "UNAVAILABLE", issues = []) {
  return {
    contract_version: PROVIDER_CONTRACT_VERSION,
    request_id: id,
    run_id: runId,
    provider_id: providerId,
    model_id: modelId,
    task_type: taskType,
    status: "FAIL",
    output: "UNAVAILABLE",
    usage: {
      input_tokens: "UNAVAILABLE",
      output_tokens: "UNAVAILABLE",
      total_tokens: "UNAVAILABLE",
      retry_count: 0
    },
    cost: {
      currency: "USD",
      usd: "UNAVAILABLE",
      pricing_status: "UNAVAILABLE",
      tracking_status: "UNAVAILABLE"
    },
    latency_ms: "UNAVAILABLE",
    error_code: errorCode,
    ...(issues.length ? { issues } : {})
  };
}

function statusForError(errorCode) {
  if (errorCode === "TASK_NOT_ALLOWED" || errorCode === "INVALID_REQUEST") return 422;
  if (errorCode === "RATE_LIMITED") return 429;
  if (errorCode === "SERVICE_NOT_CONFIGURED") return 503;
  return 400;
}

export function invalidProviderResponse(id, errorCode, {
  status = statusForError(errorCode),
  runId,
  providerId,
  modelId,
  taskType,
  issues = []
} = {}) {
  return json(unavailableEnvelope(id, errorCode, runId, providerId, modelId, taskType, issues), {
    status,
    headers: { "x-request-id": id }
  });
}

export function providerMethodNotAllowedResponse() {
  return invalidProviderResponse(requestId(), "INVALID_REQUEST", { status: 405 });
}

async function parseBody(request) {
  if (requestContentLengthTooLarge(request, MAX_BODY_BYTES)) throw new ProviderContractError("Request body is too large.");
  const raw = await request.text();
  const bytes = new TextEncoder().encode(raw).byteLength;
  if (bytes > MAX_BODY_BYTES) throw new ProviderContractError("Request body is too large.");
  if (!raw.trim()) throw new ProviderContractError("Request body must be valid JSON.");
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("not-object");
    return { value, bytes };
  } catch {
    throw new ProviderContractError("Request body must be valid JSON.");
  }
}

function validationErrorCode(error) {
  return /task_type/i.test(error?.message || "") ? "TASK_NOT_ALLOWED" : "INVALID_REQUEST";
}

export async function handleProviderGatewayRequest({ request, env = {} }) {
  const generatedId = requestId();
  const requestError = validateJsonMutationRequest(request, { requireSameOrigin: false });
  if (requestError) return invalidProviderResponse(generatedId, "INVALID_REQUEST", { status: requestError.status });

  const authentication = authenticateBearer(request, env, ["LOCAL_PDC_AI_TOKEN"]);
  if (authentication.status === "NOT_CONFIGURED") {
    return invalidProviderResponse(generatedId, "SERVICE_NOT_CONFIGURED", { status: 503 });
  }
  if (authentication.status !== "OK") {
    return invalidProviderResponse(generatedId, "AUTH_FAILED", { status: 401 });
  }

  let parsed;
  try {
    parsed = await parseBody(request);
  } catch (error) {
    return invalidProviderResponse(generatedId, "INVALID_REQUEST", {
      status: 422,
      issues: error.issues || ["Request body must be valid JSON."]
    });
  }

  let input;
  try {
    input = validateProviderRequest(parsed.value, { bodyBytes: parsed.bytes });
  } catch (error) {
    const errorCode = validationErrorCode(error);
    return invalidProviderResponse(generatedId, errorCode, {
      status: statusForError(errorCode),
      issues: error.issues || ["Invalid provider execution request."]
    });
  }

  const rate = await enforceRateLimits({
    request,
    env,
    token: authentication.token,
    input
  });
  if (!rate.allowed) {
    return invalidProviderResponse(input.request_id, rate.errorCode === "RATE_LIMITED" ? "RATE_LIMITED" : "PROVIDER_ERROR", {
      status: rate.errorCode === "RATE_LIMITED" ? 429 : 503,
      runId: input.run_id,
      providerId: input.provider_id,
      modelId: input.model_id,
      taskType: input.task_type
    });
  }

  try {
    const result = await executeProviderRequest({ input, env });
    return json(result.body, {
      status: result.status,
      headers: { "x-request-id": input.request_id }
    });
  } catch {
    return invalidProviderResponse(input.request_id, "PROVIDER_ERROR", {
      status: 500,
      runId: input.run_id,
      providerId: input.provider_id,
      modelId: input.model_id,
      taskType: input.task_type
    });
  }
}
