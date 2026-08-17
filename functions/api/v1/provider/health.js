import { json } from "../../auth/_utils.js";
import { PROVIDER_CONTRACT_VERSION } from "../pdc/_provider-contract.js";
import { providerRegistrySnapshot } from "../pdc/_provider-registry.js";
import { authenticateBearer, requestId } from "../pdc/_security.js";

function errorResponse(id, errorCode, message, status) {
  return json({
    contract_version: PROVIDER_CONTRACT_VERSION,
    request_id: id,
    error_code: errorCode,
    message
  }, { status });
}

export async function onRequestGet({ request, env }) {
  const id = requestId();
  const authentication = authenticateBearer(request, env, ["LOCAL_PDC_AI_TOKEN"]);
  if (authentication.status === "NOT_CONFIGURED") {
    return errorResponse(id, "SERVICE_NOT_CONFIGURED", "Local PDC AI token is not configured.", 503);
  }
  if (authentication.status !== "OK") {
    return errorResponse(id, "UNAUTHORIZED", "A valid Local PDC AI token is required.", 401);
  }

  return json({
    contract_version: PROVIDER_CONTRACT_VERSION,
    request_id: id,
    service: "turnpo-provider-gateway",
    health_mode: "CONFIGURATION_AND_OPERATOR_ATTESTATION",
    provider_health: providerRegistrySnapshot(env)
  });
}

export async function onRequestPost() {
  return errorResponse(requestId(), "METHOD_NOT_ALLOWED", "Use GET for configuration health checks.", 405);
}
