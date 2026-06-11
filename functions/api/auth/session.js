import { accessForRole, getSessionId, json, requireAuthConfig, requireUserSession, sessionKey } from "./_utils.js";

export async function onRequestGet({ request, env }) {
  const configError = requireAuthConfig(env);
  if (configError) return json({ authenticated: false });

  const sessionId = getSessionId(request);
  if (!sessionId) return json({ authenticated: false });

  let session = await env.AUTH_KV.get(sessionKey(sessionId), "json");
  if (!session) return json({ authenticated: false });
  const auth = await requireUserSession(request, env);
  if (auth.error) return json({ authenticated: false });
  session = { ...session, userId: auth.user.id, role: auth.user.role };
  const access = auth.access || accessForRole(session.role || "user");

  return json({
    authenticated: true,
    userId: session.userId || "",
    profile: session.profile,
    email: session.email,
    role: access.role,
    roleLabel: access.label,
    scopes: access.scopes,
    managementAreas: access.managementAreas,
    readOnly: access.readOnly
  });
}
