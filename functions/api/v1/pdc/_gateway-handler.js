import {
  json,
  requestContentLengthTooLarge,
  validateJsonMutationRequest
} from "../../auth/_utils.js";
import {
  API_VERSION,
  ContractError,
  EVALUATION_SCHEMA_VERSION,
  validateEvaluationRequest
} from "./_contract.js";
import { enforceRateLimits } from "./_controls.js";
import { authenticateBearer, requestId } from "./_security.js";
import { executeEvaluation, executionMode } from "./_provider-service.js";

const MAX_BODY_BYTES = 256 * 1024;

export function invalidResponse(id, errorCode, message, status, issues = []) {
  return json({
    api_version: API_VERSION,
    evaluation_schema_version: EVALUATION_SCHEMA_VERSION,
    request_id: id,
    error_code: errorCode,
    message,
    ...(issues.length ? { issues } : {})
  }, { status });
}

export function methodNotAllowedResponse() {
  return invalidResponse(
    requestId(),
    "METHOD_NOT_ALLOWED",
    "Use POST for Provider Execution Service requests.",
    405
  );
}

async function parseBody(request) {
  if (requestContentLengthTooLarge(request, MAX_BODY_BYTES)) {
    throw new ContractError("Request body is too large.");
  }
  const raw = await request.text();
  const bytes = new TextEncoder().encode(raw).byteLength;
  if (bytes > MAX_BODY_BYTES) throw new ContractError("Request body is too large.");
  if (!raw.trim()) throw new ContractError("Request body must be a JSON object.");
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("not-object");
    return { value, bytes };
  } catch {
    throw new ContractError("Request body must be valid JSON.");
  }
}

export async function handleProviderRequest({
  request,
  env = {},
  tokenEnvNames = ["LOCAL_PDC_AI_TOKEN"]
}) {
  const id = requestId();
  const requestError = validateJsonMutationRequest(request, { requireSameOrigin: false });
  if (requestError) return invalidResponse(id, "INVALID_REQUEST", requestError.error, requestError.status);

  const authentication = authenticateBearer(request, env, tokenEnvNames);
  if (authentication.status === "NOT_CONFIGURED") {
    return invalidResponse(id, "SERVICE_NOT_CONFIGURED", "Provider Gateway authentication is not configured.", 503);
  }
  if (authentication.status !== "OK") {
    return invalidResponse(id, "UNAUTHORIZED", "A valid Provider Gateway bearer token is required.", 401);
  }

  let parsed;
  try {
    parsed = await parseBody(request);
  } catch (error) {
    return invalidResponse(id, "INVALID_REQUEST", error.message, error instanceof ContractError ? 422 : 400, error.issues || []);
  }

  let input;
  try {
    input = validateEvaluationRequest(parsed.value, { bodyBytes: parsed.bytes });
  } catch (error) {
    return invalidResponse(id, "INVALID_REQUEST", error.message, 422, error.issues || []);
  }

  const rate = await enforceRateLimits({
    request,
    env,
    token: authentication.token,
    input
  });
  if (!rate.allowed) {
    const status = rate.errorCode === "RATE_LIMITED" ? 429 : 503;
    return invalidResponse(id, rate.errorCode, "Provider Gateway request limit is not available for this request.", status);
  }

  const mode = executionMode(env);
  if (mode === "INVALID") return invalidResponse(id, "INVALID_EXECUTION_MODE", "Provider execution mode is invalid.", 500);

  try {
    const result = await executeEvaluation({ input, env, requestId: id, mode });
    return json(result.body, { status: result.status });
  } catch (error) {
    if (error instanceof ContractError) {
      return invalidResponse(id, "INVALID_REQUEST", error.message, 422, error.issues || []);
    }
    console.log(JSON.stringify({
      event: "turnpo_pdc_provider_execution_error",
      request_id: id,
      error_code: "INTERNAL_ERROR"
    }));
    return invalidResponse(id, "INTERNAL_ERROR", "Provider execution failed before a scorecard was produced.", 500);
  }
}
