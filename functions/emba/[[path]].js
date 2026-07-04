const ACCESS_COOKIE = "turnpo_emba_access";
const UI_COOKIE = "turnpo_emba_ui";
const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function configuredAccessCode(env) {
  return String(env.EMBA_ACCESS_CODE || "emba2026").trim();
}

function html(body, init = {}) {
  return new Response(body, {
    ...init,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {})
    }
  });
}

function redirectWithHeaders(headers) {
  return new Response(null, { status: 303, headers });
}

function cookieValue(request, name) {
  const cookie = request.headers.get("cookie") || "";
  return cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1) || "";
}

function timingSafeEqual(left, right) {
  const a = String(left);
  const b = String(right);
  let mismatch = a.length === b.length ? 0 : 1;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return mismatch === 0;
}

async function hmacHex(secret, value) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function createToken(secret) {
  const expiresAt = Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE_SECONDS;
  const signature = await hmacHex(secret, String(expiresAt));
  return `${expiresAt}.${signature}`;
}

async function isValidToken(token, secret) {
  const [expiresAt, signature] = String(token || "").split(".");
  const expiry = Number(expiresAt);
  if (!Number.isFinite(expiry) || expiry < Math.floor(Date.now() / 1000) || !signature) return false;
  const expected = await hmacHex(secret, String(expiresAt));
  return timingSafeEqual(signature, expected);
}

function accessCookie(token) {
  return `${ACCESS_COOKIE}=${token}; Path=/emba; Max-Age=${COOKIE_MAX_AGE_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

function uiCookie() {
  return `${UI_COOKIE}=granted; Path=/emba; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Secure; SameSite=Lax`;
}

function clearAccessCookie() {
  return `${ACCESS_COOKIE}=; Path=/emba; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function clearUiCookie() {
  return `${UI_COOKIE}=; Path=/emba; Max-Age=0; Secure; SameSite=Lax`;
}

function accessPage(error = "") {
  return html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EMBA Access | Turnpo</title>
    <meta name="robots" content="noindex, nofollow" />
    <link rel="shortcut icon" href="/favicon.ico" />
    <link rel="stylesheet" href="/styles.css" />
    <style>
      :root { color-scheme: light; }
      body { margin: 0; background: #f5f5f7; color: #1d1d1f; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, "Segoe UI", sans-serif; }
      body::before { display: none; }
      .topbar { grid-template-columns: auto 1fr auto; border-bottom: 1px solid rgba(0,0,0,.08); background: rgba(245,245,247,.78); backdrop-filter: blur(28px) saturate(1.6); }
      .brand { color: #1d1d1f; }
      .brand-mark { border-color: rgba(0,0,0,.08); background-color: #fff; box-shadow: 0 10px 24px rgba(0,0,0,.08); }
      .top-actions .ghost-btn { min-height: 36px; border-color: rgba(0,0,0,.1); border-radius: 999px; background: rgba(255,255,255,.62); color: #1d1d1f; font-size: 13px; font-weight: 600; box-shadow: 0 10px 28px rgba(0,0,0,.06); }
      .emba-gate { width: min(720px,100%); min-height: calc(100vh - 73px); display: grid; place-items: center; margin: 0 auto; padding: clamp(28px,5vw,56px) clamp(18px,5vw,72px); }
      .emba-card { width: min(480px,100%); display: grid; gap: 18px; padding: clamp(24px,4vw,36px); border: 1px solid rgba(0,0,0,.08); border-radius: 28px; background: rgba(255,255,255,.72); box-shadow: 0 34px 90px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.82); backdrop-filter: blur(24px) saturate(1.35); }
      .emba-card h1 { margin: 0; color: #1d1d1f; font-size: clamp(38px,7vw,64px); line-height: .96; letter-spacing: 0; }
      .emba-card p { margin: 14px 0 0; color: #6e6e73; line-height: 1.5; }
      .emba-card label { display: grid; gap: 8px; }
      .emba-card label span { color: #6e6e73; font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
      .emba-card input { min-height: 48px; width: 100%; border: 1px solid rgba(0,0,0,.12); border-radius: 14px; outline: none; background: rgba(255,255,255,.72); color: #1d1d1f; padding: 0 14px; }
      .emba-card input:focus { border-color: #0071e3; box-shadow: 0 0 0 4px rgba(0,113,227,.14); }
      .emba-card button { min-height: 46px; border: 0; border-radius: 999px; background: #0071e3; color: #fff; font-weight: 700; }
      .emba-error { min-height: 22px; margin: 0 !important; color: #b42318 !important; font-size: 13px; }
    </style>
  </head>
  <body>
    <header class="topbar">
      <a class="brand" href="/" aria-label="Turnpo home">
        <span class="brand-mark" aria-hidden="true"></span>
        <span>Turnpo</span>
      </a>
      <div></div>
      <div class="top-actions">
        <a class="ghost-btn" href="/">Turnpo home</a>
      </div>
    </header>
    <main class="emba-gate">
      <form class="emba-card" method="post">
        <div>
          <h1>EMBA Timeline</h1>
          <p>Enter the access code to open the learning timeline.</p>
        </div>
        <label>
          <span>Access code</span>
          <input name="accessCode" type="password" autocomplete="current-password" required autofocus />
        </label>
        <button type="submit">Enter</button>
        <p class="emba-error">${error}</p>
      </form>
    </main>
  </body>
</html>`);
}

async function isAuthorized(request, env) {
  return isValidToken(cookieValue(request, ACCESS_COOKIE), configuredAccessCode(env));
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (url.pathname === "/emba/logout") {
    const headers = new Headers({ location: "/emba/", "cache-control": "no-store" });
    headers.append("set-cookie", clearAccessCookie());
    headers.append("set-cookie", clearUiCookie());
    return new Response(null, { status: 303, headers });
  }

  if (await isAuthorized(request, env)) return context.next();
  return accessPage();
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (url.pathname === "/emba/logout") {
    const headers = new Headers({ location: "/emba/", "cache-control": "no-store" });
    headers.append("set-cookie", clearAccessCookie());
    headers.append("set-cookie", clearUiCookie());
    return new Response(null, { status: 303, headers });
  }

  const formData = await request.formData();
  const accessCode = String(formData.get("accessCode") || "").trim();
  const expectedCode = configuredAccessCode(env);
  if (!timingSafeEqual(accessCode, expectedCode)) {
    return accessPage("Access code is incorrect.");
  }

  const token = await createToken(expectedCode);
  const headers = new Headers({ location: "/emba/", "cache-control": "no-store" });
  headers.append("set-cookie", accessCookie(token));
  headers.append("set-cookie", uiCookie());
  return redirectWithHeaders(headers);
}
