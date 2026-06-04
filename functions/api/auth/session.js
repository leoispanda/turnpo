import { getSessionId, json, requireAuthConfig, sessionKey } from "./_utils.js";

export async function onRequestGet({ request, env }) {
  const configError = requireAuthConfig(env);
  if (configError) return json({ authenticated: false });

  const sessionId = getSessionId(request);
  if (!sessionId) return json({ authenticated: false });

  const session = await env.AUTH_KV.get(sessionKey(sessionId), "json");
  if (!session) return json({ authenticated: false });

  return json({
    authenticated: true,
    profile: session.profile,
    email: session.email
  });
}
