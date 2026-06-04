const SESSION_COOKIE = "turnpo_owner_session";
const CODE_TTL_SECONDS = 10 * 60;
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {})
    }
  });
}

export function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

export function approvedProfileForEmail(env, email) {
  const mapped = parseEmailProfileMap(env.TURNPO_OWNER_EMAIL_PROFILES || env.OWNER_EMAIL_PROFILES || "");
  if (mapped[email]) return mapped[email];

  const approved = parseList(env.TURNPO_APPROVED_OWNER_EMAILS || env.APPROVED_OWNER_EMAILS || "");
  if (!approved.includes(email)) return "";
  return env.TURNPO_DEFAULT_OWNER_PROFILE || env.OWNER_DEFAULT_PROFILE || "leo";
}

export function requireAuthConfig(env) {
  if (!env.AUTH_KV) return "Missing AUTH_KV binding.";
  if (!env.TURNPO_AUTH_SECRET) return "Missing TURNPO_AUTH_SECRET.";
  return "";
}

export async function sha256(input) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashCode(env, email, code) {
  return sha256(`${env.TURNPO_AUTH_SECRET}:${email}:${code}`);
}

export function randomCode() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String(values[0] % 1000000).padStart(6, "0");
}

export function randomId() {
  const values = new Uint8Array(32);
  crypto.getRandomValues(values);
  return [...values].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function codeKey(email) {
  return `auth:code:${email}`;
}

export function sessionKey(sessionId) {
  return `auth:session:${sessionId}`;
}

export function requestKey(email) {
  return `auth:request:${email}`;
}

export function verifyKey(email) {
  return `auth:verify:${email}`;
}

export async function incrementWindow(env, key, ttlSeconds) {
  const current = Number(await env.AUTH_KV.get(key) || "0");
  const next = current + 1;
  await env.AUTH_KV.put(key, String(next), { expirationTtl: ttlSeconds });
  return next;
}

export function getSessionId(request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export function sessionCookie(sessionId) {
  return `${SESSION_COOKIE}=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function sendLoginCode(env, email, code) {
  const apiKey = env.RESEND_API_KEY;
  const from = env.TURNPO_AUTH_FROM_EMAIL || "Turnpo <login@turnpo.com>";
  if (!apiKey) return { ok: false, error: "Missing RESEND_API_KEY." };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Your Turnpo login code",
      text: `Your Turnpo login code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your Turnpo login code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`
    })
  });

  if (response.ok) return { ok: true };
  return { ok: false, error: await response.text() };
}

function parseList(value) {
  return value.split(",").map((item) => normalizeEmail(item)).filter(Boolean);
}

function parseEmailProfileMap(value) {
  return value.split(",").reduce((map, pair) => {
    const [email, profile] = pair.split(":").map((item) => item && item.trim());
    if (email && profile) map[normalizeEmail(email)] = profile;
    return map;
  }, {});
}

export { CODE_TTL_SECONDS, SESSION_TTL_SECONDS };
