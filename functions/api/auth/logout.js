import { clearSessionCookie, getSessionId, json, requireAuthConfig, sessionKey, validateSameOriginRequest } from "./_utils.js";

export async function onRequestPost({ request, env }) {
  const requestError = validateSameOriginRequest(request);
  if (requestError) return json({ error: requestError.error }, { status: requestError.status });

  const configError = requireAuthConfig(env);
  if (!configError) {
    const sessionId = getSessionId(request);
    if (sessionId) await env.AUTH_KV.delete(sessionKey(sessionId));
  }

  return json({ ok: true }, {
    headers: {
      "set-cookie": clearSessionCookie()
    }
  });
}
