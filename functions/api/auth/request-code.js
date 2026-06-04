import {
  CODE_TTL_SECONDS,
  approvedProfileForEmail,
  codeKey,
  hashCode,
  incrementWindow,
  json,
  normalizeEmail,
  randomCode,
  readJson,
  requestKey,
  requireAuthConfig,
  sendLoginCode
} from "./_utils.js";

export async function onRequestPost({ request, env }) {
  const configError = requireAuthConfig(env);
  if (configError) return json({ error: "Auth is not configured." }, { status: 500 });

  const { email: rawEmail } = await readJson(request);
  const email = normalizeEmail(rawEmail);
  if (!email || !email.includes("@")) return json({ error: "Enter a valid email address." }, { status: 400 });

  const attempts = await incrementWindow(env, requestKey(email), 15 * 60);
  if (attempts > 5) return json({ error: "Too many code requests. Please try again later." }, { status: 429 });

  const profile = approvedProfileForEmail(env, email);
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
