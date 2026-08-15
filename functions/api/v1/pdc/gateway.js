import {
  handleProviderGatewayRequest,
  providerMethodNotAllowedResponse
} from "./_provider-gateway-handler.js";

/**
 * The single canonical Local PDC Provider Gateway endpoint. It accepts the
 * generic pdc-provider-v1 contract and never owns PDC orchestration, ranking,
 * persistence or UI behavior.
 */
export async function onRequestPost({ request, env }) {
  return handleProviderGatewayRequest({ request, env });
}

export async function onRequestGet() {
  return providerMethodNotAllowedResponse();
}
