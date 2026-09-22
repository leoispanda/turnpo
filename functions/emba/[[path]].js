import { cookieValue, hmacHex, isValidToken, timingSafeEqual } from "../_shared/security.js";

const ACCESS_COOKIE = "turnpo_emba_access";
const UI_COOKIE = "turnpo_emba_ui";
const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
function configuredAccessCode(env) {
  return String(env?.EMBA_ACCESS_CODE || "").trim();
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

function accessCookie(token, path = "/") {
  return `${ACCESS_COOKIE}=${token}; Path=${path}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

function uiCookie() {
  return `${UI_COOKIE}=granted; Path=/emba; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Secure; SameSite=Lax`;
}

function clearAccessCookie(path = "/") {
  return `${ACCESS_COOKIE}=; Path=${path}; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function clearUiCookie() {
  return `${UI_COOKIE}=; Path=/emba; Max-Age=0; Secure; SameSite=Lax`;
}

function accessPage(error = "") {
  return html(`<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>进入学习空间 | EMBA · Turnpo</title>
    <meta name="robots" content="noindex, nofollow" />
    <meta name="theme-color" content="#f6f5f0" />
    <link rel="shortcut icon" href="/favicon.ico" />
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body { min-height: 100vh; min-height: 100svh; display: flex; flex-direction: column; margin: 0; background: #f6f5f0; color: #283c34; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; -webkit-font-smoothing: antialiased; }
      a, button, input { -webkit-tap-highlight-color: transparent; }
      a:focus-visible, button:focus-visible, input:focus-visible { outline: 3px solid #304f43; outline-offset: 4px; }
      .topbar { display: flex; align-items: center; justify-content: space-between; gap: 20px; min-height: 76px; padding: 12px clamp(20px, 5vw, 64px); border-bottom: 1px solid #e6e6dd; }
      .brand { min-height: 44px; display: inline-flex; align-items: center; gap: 11px; color: #283c34; font-size: 16px; font-weight: 650; text-decoration: none; }
      .brand-mark { width: 32px; height: 32px; border-radius: 8px; background: #252520 url("/assets/icons/favicon-48.png") center / cover no-repeat; }
      .top-actions .ghost-btn { min-height: 44px; display: inline-flex; align-items: center; gap: 8px; padding: 8px 4px; border-radius: 4px; color: #536359; font-size: 14px; text-decoration: none; }
      .top-actions .ghost-btn:hover { color: #283c34; text-decoration: underline; text-underline-offset: 5px; }
      .emba-gate { width: 100%; flex: 1; display: grid; place-items: center; margin: 0 auto; padding: 48px 20px 72px; }
      .emba-card { width: min(460px, 100%); min-width: 0; display: grid; gap: 26px; margin: 0; padding: clamp(28px, 5vw, 44px); border: 1px solid #e5e7df; border-radius: 24px; background: #fff; box-shadow: 0 12px 44px -20px rgba(40, 60, 52, .2), 0 2px 5px rgba(40, 60, 52, .025); }
      .emba-eyebrow { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 23px; color: #5d6d62; font-size: 10px; font-weight: 600; letter-spacing: .14em; line-height: 1.5; }
      .emba-eyebrow span { color: #8a958c; }
      .emba-card h1 { margin: 0; color: #283c34; font-size: clamp(28px, 6vw, 34px); font-weight: 600; line-height: 1.35; letter-spacing: -.04em; }
      .emba-card p { margin: 12px 0 0; color: #647269; font-size: 14px; line-height: 1.8; }
      .emba-card label { min-width: 0; display: grid; gap: 10px; }
      .emba-card label span { color: #465a4f; font-size: 13px; font-weight: 550; }
      .emba-card input { min-width: 0; min-height: 52px; width: 100%; border: 1px solid #d7ded6; border-radius: 10px; background: #fafbf8; color: #283c34; padding: 12px 14px; font: inherit; font-size: 16px; }
      .emba-card input::placeholder { color: #747e76; }
      .emba-card input:focus { border-color: #304f43; background: #fff; }
      .emba-card button { min-height: 50px; width: 100%; border: 1px solid #304f43; border-radius: 10px; background: #304f43; color: #fff; font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
      .emba-card button:hover { background: #263f35; border-color: #263f35; }
      .emba-card button:active { background: #20372e; }
      .emba-error { min-height: 20px; margin: -12px 0 0 !important; color: #a43c31 !important; font-size: 13px !important; overflow-wrap: anywhere; }
      @media (max-width: 480px) { .topbar { min-height: 68px; } .emba-gate { padding: 32px 18px 52px; } .emba-card { gap: 24px; border-radius: 20px; } }
    </style>
  </head>
  <body>
    <header class="topbar">
      <a class="brand" href="/" aria-label="Turnpo 首页">
        <span class="brand-mark" aria-hidden="true"></span>
        <span>Turnpo</span>
      </a>
      <div class="top-actions">
        <a class="ghost-btn" href="/"><span aria-hidden="true">←</span> 返回首页</a>
      </div>
    </header>
    <main class="emba-gate">
      <form class="emba-card" method="post">
        <div>
          <div class="emba-eyebrow">PRIVATE LEARNING <span aria-hidden="true">/</span> EMBA</div>
          <h1>进入学习空间</h1>
          <p>输入访问密码，继续你的预习、复习与思考。</p>
        </div>
        <label>
          <span>访问密码</span>
          <input name="accessCode" type="password" autocomplete="current-password" placeholder="请输入密码" aria-describedby="embaAccessError" required autofocus />
        </label>
        <button type="submit">进入学习空间 <span aria-hidden="true">→</span></button>
        <p class="emba-error" id="embaAccessError" role="status">${error}</p>
      </form>
    </main>
  </body>
</html>`);
}

async function authorizedToken(request, env) {
  const accessCode = configuredAccessCode(env);
  if (!accessCode) return "";
  const token = cookieValue(request, ACCESS_COOKIE);
  return await isValidToken(token, accessCode) ? token : "";
}

function appendClearCookies(headers) {
  headers.append("set-cookie", clearAccessCookie("/"));
  headers.append("set-cookie", clearAccessCookie("/emba"));
  headers.append("set-cookie", clearUiCookie());
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (url.pathname === "/emba/logout") {
    const headers = new Headers({ location: "/emba/", "cache-control": "no-store" });
    appendClearCookies(headers);
    return new Response(null, { status: 303, headers });
  }

  if (!configuredAccessCode(env)) return accessPage("EMBA access is not configured.");
  const token = await authorizedToken(request, env);
  if (token) {
    const response = await context.next();
    const headers = new Headers(response.headers);
    headers.append("set-cookie", accessCookie(token));
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
  return accessPage();
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (url.pathname === "/emba/logout") {
    const headers = new Headers({ location: "/emba/", "cache-control": "no-store" });
    appendClearCookies(headers);
    return new Response(null, { status: 303, headers });
  }

  const formData = await request.formData();
  const accessCode = String(formData.get("accessCode") || "").trim();
  const expectedCode = configuredAccessCode(env);
  if (!expectedCode) return accessPage("EMBA access is not configured.");
  if (!timingSafeEqual(accessCode, expectedCode)) {
    return accessPage("Access code is incorrect.");
  }

  const token = await createToken(expectedCode);
  const headers = new Headers({ location: "/emba/", "cache-control": "no-store" });
  headers.append("set-cookie", accessCookie(token));
  headers.append("set-cookie", uiCookie());
  return redirectWithHeaders(headers);
}
