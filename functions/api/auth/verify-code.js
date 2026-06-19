import {
  SESSION_TTL_SECONDS,
  accessForRole,
  clientRateKey,
  codeKey,
  ensureUserForEmail,
  hashCode,
  incrementWindow,
  json,
  normalizeEmail,
  randomId,
  readJson,
  recordUserLogin,
  requestContentLengthTooLarge,
  requireAuthConfig,
  sessionCookie,
  sessionKey,
  validateJsonMutationRequest,
  verifyKey
} from "./_utils.js";

const MAX_AUTH_BODY_BYTES = 16 * 1024;

export async function onRequestPost({ request, env }) {
  const configError = requireAuthConfig(env);
  if (configError) return json({ error: "Auth is not configured." }, { status: 500 });
  const requestError = validateJsonMutationRequest(request);
  if (requestError) return json({ error: requestError.error }, { status: requestError.status });
  if (requestContentLengthTooLarge(request, MAX_AUTH_BODY_BYTES)) {
    return json({ error: "Auth request is too large." }, { status: 413 });
  }

  const { email: rawEmail, code: rawCode } = await readJson(request);
  const email = normalizeEmail(rawEmail);
  const code = String(rawCode || "").trim();
  if (!email || !code) return json({ error: "Email and code are required." }, { status: 400 });

  const attempts = await incrementWindow(env, verifyKey(email), 2 * 60);
  if (attempts > 8) return json({ error: "Too many verification attempts. Please request a new code later." }, { status: 429 });
  const clientAttempts = await incrementWindow(env, clientRateKey(request, "auth-verify", email), 2 * 60);
  if (clientAttempts > 16) return json({ error: "Too many verification attempts. Please request a new code later." }, { status: 429 });

  const stored = await env.AUTH_KV.get(codeKey(email), "json");
  if (!stored) return json({ error: "Code is expired or incorrect." }, { status: 401 });

  const submittedHash = await hashCode(env, email, code);
  if (submittedHash !== stored.codeHash) return json({ error: "Code is expired or incorrect." }, { status: 401 });

  await env.AUTH_KV.delete(codeKey(email));

  const user = await recordLoginUser(env, email, stored.profile);
  const sessionId = randomId();
  await env.AUTH_KV.put(sessionKey(sessionId), JSON.stringify({
    userId: user.id,
    email,
    profile: stored.profile,
    role: user.role,
    createdAt: new Date().toISOString()
  }), { expirationTtl: SESSION_TTL_SECONDS });

  const access = accessForRole(user.role);
  return json({
    ok: true,
    profile: stored.profile,
    role: access.role,
    roleLabel: access.label,
    scopes: access.scopes,
    managementAreas: access.managementAreas,
    readOnly: access.readOnly
  }, {
    headers: {
      "set-cookie": sessionCookie(sessionId)
    }
  });
}

async function recordLoginUser(env, email, profile) {
  const user = await ensureUserForEmail(env, {
    email,
    profile,
    username: profile,
    displayName: profile
  });
  return await recordUserLogin(env, user);
}
