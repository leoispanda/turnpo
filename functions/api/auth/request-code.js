import {
  CODE_TTL_SECONDS,
  clientRateKey,
  codeKey,
  hashCode,
  incrementWindow,
  json,
  normalizeEmail,
  ownerProfileForEmail,
  randomCode,
  readJson,
  requestContentLengthTooLarge,
  requestKey,
  requireAuthConfig,
  sendLoginCode,
  validateJsonMutationRequest,
  userForEmail
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

  const { email: rawEmail } = await readJson(request);
  const email = normalizeEmail(rawEmail);
  if (!email || !email.includes("@")) return json({ error: "Enter a valid email address." }, { status: 400 });

  const attempts = await incrementWindow(env, requestKey(email), 2 * 60);
  if (attempts > 5) return json({ error: "Too many code requests. Please try again later." }, { status: 429 });
  const clientAttempts = await incrementWindow(env, clientRateKey(request, "auth-code", email), 2 * 60);
  if (clientAttempts > 10) return json({ error: "Too many code requests. Please try again later." }, { status: 429 });

  const user = await userForEmail(env, email);
  const profile = user?.profile || await ownerProfileForEmail(env, email);
  if (!profile) {
    return json({ ok: true, message: "If this email is approved, a login code will be sent." });
  }

  const code = randomCode();
  const codeHash = await hashCode(env, email, code);
  await env.AUTH_KV.put(codeKey(email), JSON.stringify({
    codeHash,
    email,
    profile,
    createdAt: new Date().toISOString()
  }), { expirationTtl: CODE_TTL_SECONDS });

  const sent = await sendLoginCode(env, email, code);
  if (!sent.ok) return json({ error: "Could not send login code." }, { status: 502 });

  return json({ ok: true, message: "If this email is approved, a login code will be sent." });
}
