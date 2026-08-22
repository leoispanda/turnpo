import { cookieValue, hmacHex, isValidToken, timingSafeEqual } from "../_shared/security.js";

const ACCESS_COOKIE = "turnpo_ai_practice_access";
const UI_COOKIE = "turnpo_ai_practice_ui";
const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const PAGE_PATH = "/ai-practice";

function configuredAccessCode(env) {
  return String(env?.AI_PRACTICE_ACCESS_CODE || env?.EMBA_ACCESS_CODE || "").trim();
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

async function createToken(secret) {
  const expiresAt = Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE_SECONDS;
  const signature = await hmacHex(secret, String(expiresAt));
  return `${expiresAt}.${signature}`;
}

function accessCookie(token) {
  return `${ACCESS_COOKIE}=${token}; Path=${PAGE_PATH}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

function uiCookie() {
  return `${UI_COOKIE}=granted; Path=${PAGE_PATH}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Secure; SameSite=Lax`;
}

function clearAccessCookie() {
  return `${ACCESS_COOKIE}=; Path=${PAGE_PATH}; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function clearUiCookie() {
  return `${UI_COOKIE}=; Path=${PAGE_PATH}; Max-Age=0; Secure; SameSite=Lax`;
}

function accessPage(error = "") {
  return html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Practice Access | Turnpo</title>
    <meta name="robots" content="noindex, nofollow" />
    <link rel="shortcut icon" href="/favicon.ico" />
    <link rel="stylesheet" href="/styles.css" />
    <style>
      :root { color-scheme: light; }
      body { margin: 0; background: #f6f7f2; color: #1d1d1f; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, "Segoe UI", sans-serif; }
      body::before { display: none; }
      .topbar { grid-template-columns: auto 1fr auto; border-bottom: 1px solid rgba(28,35,31,.09); background: rgba(246,247,242,.82); backdrop-filter: blur(28px) saturate(1.35); }
      .brand { color: #1d1d1f; }
      .brand-mark { border-color: rgba(28,35,31,.08); background-color: #fff; box-shadow: 0 10px 24px rgba(28,35,31,.08); }
      .top-actions .ghost-btn { min-height: 36px; border-color: rgba(28,35,31,.12); border-radius: 999px; background: rgba(255,255,255,.68); color: #1d1d1f; font-size: 13px; font-weight: 650; box-shadow: 0 10px 28px rgba(28,35,31,.06); }
      .practice-gate { width: min(720px,100%); min-height: calc(100vh - 73px); display: grid; place-items: center; margin: 0 auto; padding: clamp(28px,5vw,56px) clamp(18px,5vw,72px); }
      .practice-card { width: min(480px,100%); display: grid; gap: 18px; padding: clamp(24px,4vw,36px); border: 1px solid rgba(28,35,31,.1); border-radius: 24px; background: rgba(255,255,255,.76); box-shadow: 0 34px 90px rgba(28,35,31,.12), inset 0 1px 0 rgba(255,255,255,.86); backdrop-filter: blur(24px) saturate(1.25); }
      .practice-card h1 { margin: 0; color: #1d1d1f; font-size: clamp(38px,7vw,64px); line-height: .96; letter-spacing: 0; }
      .practice-card p { margin: 14px 0 0; color: #65706a; line-height: 1.5; }
      .practice-card label { display: grid; gap: 8px; }
      .practice-card label span { color: #65706a; font-size: 12px; font-weight: 760; letter-spacing: .06em; text-transform: uppercase; }
      .practice-card input { min-height: 48px; width: 100%; border: 1px solid rgba(28,35,31,.12); border-radius: 14px; outline: none; background: rgba(255,255,255,.78); color: #1d1d1f; padding: 0 14px; }
      .practice-card input:focus { border-color: #2f7a60; box-shadow: 0 0 0 4px rgba(47,122,96,.14); }
      .practice-card button { min-height: 46px; border: 0; border-radius: 999px; background: #1d1d1f; color: #fff; font-weight: 760; }
      .practice-error { min-height: 22px; margin: 0 !important; color: #b42318 !important; font-size: 13px; }
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
    <main class="practice-gate">
      <form class="practice-card" method="post">
        <div>
          <h1>AI Practice</h1>
          <p>Enter the access code to open the practice workspace.</p>
        </div>
        <label>
          <span>Access code</span>
          <input name="accessCode" type="password" autocomplete="current-password" required autofocus />
        </label>
        <button type="submit">Enter</button>
        <p class="practice-error">${error}</p>
      </form>
    </main>
  </body>
</html>`);
}

async function isAuthorized(request, env) {
  const accessCode = configuredAccessCode(env);
  if (!accessCode) return false;
  return isValidToken(cookieValue(request, ACCESS_COOKIE), accessCode);
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (url.pathname === `${PAGE_PATH}/logout`) {
    const headers = new Headers({ location: `${PAGE_PATH}/`, "cache-control": "no-store" });
    headers.append("set-cookie", clearAccessCookie());
    headers.append("set-cookie", clearUiCookie());
    return new Response(null, { status: 303, headers });
  }

  if (!configuredAccessCode(env)) return accessPage("AI Practice access is not configured.");
  if (await isAuthorized(request, env)) return context.next();
  return accessPage();
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (url.pathname === `${PAGE_PATH}/logout`) {
    const headers = new Headers({ location: `${PAGE_PATH}/`, "cache-control": "no-store" });
    headers.append("set-cookie", clearAccessCookie());
    headers.append("set-cookie", clearUiCookie());
    return new Response(null, { status: 303, headers });
  }

  const formData = await request.formData();
  const accessCode = String(formData.get("accessCode") || "").trim();
  const expectedCode = configuredAccessCode(env);
  if (!expectedCode) return accessPage("AI Practice access is not configured.");
  if (!timingSafeEqual(accessCode, expectedCode)) {
    return accessPage("Access code is incorrect.");
  }

  const token = await createToken(expectedCode);
  const headers = new Headers({ location: `${PAGE_PATH}/`, "cache-control": "no-store" });
  headers.append("set-cookie", accessCookie(token));
  headers.append("set-cookie", uiCookie());
  return redirectWithHeaders(headers);
}
