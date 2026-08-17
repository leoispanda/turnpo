import {
  handleProviderRequest,
  methodNotAllowedResponse
} from "../_gateway-handler.js";

export async function onRequestPost({ request, env }) {
  // Legacy shadow route keeps accepting the original token name so the
  // earlier non-production skeleton remains backwards compatible.
  return handleProviderRequest({
    request,
    env,
    tokenEnvNames: ["LOCAL_PDC_AI_TOKEN", "TURNPO_PDC_SERVICE_TOKEN"]
  });
}

export async function onRequestGet() {
  return methodNotAllowedResponse();
}
