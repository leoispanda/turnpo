const ACCESS_COOKIE = "turnpo_stock_pdc_access";
const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const PAGE_PATH = "/stock-pdc";
const DECISION_PATH = `${PAGE_PATH}/decision`;
const MAX_DECISION_BODY_BYTES = 512 * 1024;
const RUN_TTL_SECONDS = 180 * 24 * 60 * 60;

function configuredAccessCode(env) {
  return String(env.STOCK_PDC_ACCESS_CODE || "").trim();
}

function decisionStore(env) {
  return env.STOCK_PDC_KV || env.AUTH_KV || null;
}

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {})
    }
  });
}

function error(message, status = 400) {
  return json({ error: message }, { status });
}

function cleanText(value, maxLength = 900) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function finiteNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function generationRunKey(runId) {
  return `stock-pdc:generation:run:${runId}`;
}

function generationCurrentKey() {
  return "stock-pdc:generation:current";
}

function generationCallbackToken(env) {
  return String(env.STOCK_PDC_GENERATOR_CALLBACK_TOKEN || "").trim();
}

function generationEndpoint(env) {
  return String(env.STOCK_PDC_GENERATOR_URL || "").trim();
}

function publicGenerationRun(run) {
  return {
    id: run.id,
    status: run.status,
    requestedAt: run.requestedAt,
    updatedAt: run.updatedAt,
    computeConfigured: Boolean(run.computeConfigured),
    message: run.message || "",
    summary: run.summary || null,
    integrity: run.integrity || null,
    displayUrl: run.status === "PUBLISHED" ? run.displayUrl || "" : "",
    displaySha256: run.status === "PUBLISHED" ? run.displaySha256 || "" : "",
    publishedAt: run.publishedAt || ""
  };
}

function validGenerationManifest(value, runId) {
  const marketCount = finiteNumber(value?.marketCount);
  const candidateCount = finiteNumber(value?.candidateCount);
  const pdcCount = finiteNumber(value?.pdcCount);
  const rulesVersion = cleanText(value?.rulesVersion, 80);
  const manifestHash = cleanText(value?.manifestHash, 128);
  const displayUrl = cleanText(value?.displayUrl, 240);
  const displaySha256 = cleanText(value?.displaySha256, 128);
  const errors = [];
  if (cleanText(value?.runId, 80) !== runId) errors.push("callback run id does not match");
  if (!Number.isInteger(marketCount) || marketCount <= 0) errors.push("marketCount must be a positive integer");
  if (!Number.isInteger(candidateCount) || candidateCount < 0) errors.push("candidateCount must be a non-negative integer");
  if (!Number.isInteger(pdcCount) || pdcCount !== candidateCount) errors.push("pdcCount must equal candidateCount");
  if (rulesVersion !== "hawkeye-fixed-v1") errors.push("unexpected Hawkeye rules version");
  if (!/^[a-f0-9]{64}$/i.test(manifestHash)) errors.push("manifestHash must be a SHA-256 digest");
  if (displayUrl !== `/stock-pdc/runs/${runId}/display.json`) errors.push("displayUrl must be this run's immutable same-origin display artifact");
  if (!/^[a-f0-9]{64}$/i.test(displaySha256)) errors.push("displaySha256 must be a SHA-256 digest");
  if (value?.sourceScope !== "full_a_share_market") errors.push("run was not sourced from the full A-share market");
  return {
    valid: errors.length === 0,
    errors,
    rulesVersion,
    manifestHash,
    marketCount,
    candidateCount,
    pdcCount,
    displayUrl,
    displaySha256
  };
}

async function readJson(request) {
  const length = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(length) && length > MAX_DECISION_BODY_BYTES) throw new Error("Generation request is too large.");
  const body = await request.text();
  if (body.length > MAX_DECISION_BODY_BYTES) throw new Error("Generation request is too large.");
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    throw new Error("Generation request must be valid JSON.");
  }
}

async function saveGenerationRun(store, run) {
  run.updatedAt = new Date().toISOString();
  await store.put(generationRunKey(run.id), JSON.stringify(run), { expirationTtl: RUN_TTL_SECONDS });
  return run;
}

async function loadGenerationRun(store, runId) {
  const run = await store.get(generationRunKey(cleanText(runId, 80)), "json");
  return run && typeof run === "object" ? run : null;
}

async function createGenerationRun(request, env) {
  const store = decisionStore(env);
  if (!store) return error("Missing STOCK_PDC_KV or AUTH_KV binding.", 500);
  const body = await readJson(request);
  if (Object.keys(body).length) return error("The browser may not supply candidates, dates, scores, or screening inputs.", 400);
  const endpoint = generationEndpoint(env);
  const callbackToken = generationCallbackToken(env);
  if (!endpoint || !callbackToken) {
    return error("The protected Stock PDC compute service is not configured. No run was created.", 503);
  }
  const now = new Date().toISOString();
  const run = {
    id: crypto.randomUUID(),
    status: "QUEUED",
    requestedAt: now,
    updatedAt: now,
    computeConfigured: true,
    message: "Run queued. The compute service will fetch the market independently.",
    summary: null,
    integrity: null,
    displayUrl: "",
    displaySha256: "",
    publishedAt: ""
  };
  await saveGenerationRun(store, run);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", "x-stock-pdc-callback-token": callbackToken },
      body: JSON.stringify({ runId: run.id, requestedAt: now })
    });
    if (!response.ok) throw new Error(`compute service returned ${response.status}`);
    run.status = "FETCHING";
    run.message = "Compute service accepted the run and is fetching the full market.";
  } catch (caught) {
    run.status = "FAILED";
    run.message = cleanText(caught?.message || "Unable to start the compute service.", 280);
  }
  await saveGenerationRun(store, run);
  return json({ ok: true, run: publicGenerationRun(run) });
}

async function completeGenerationRun(request, env, runId) {
  const expectedToken = generationCallbackToken(env);
  if (!expectedToken || !timingSafeEqual(request.headers.get("x-stock-pdc-callback-token") || "", expectedToken)) {
    return error("Invalid Stock PDC compute callback.", 401);
  }
  const store = decisionStore(env);
  if (!store) return error("Missing STOCK_PDC_KV or AUTH_KV binding.", 500);
  const run = await loadGenerationRun(store, runId);
  if (!run) return error("Generation run was not found.", 404);
  if (["PUBLISHED", "READY"].includes(run.status)) return error("Generation run is immutable after completion.", 409);
  const body = await readJson(request);
  const integrity = validGenerationManifest(body?.manifest, run.id);
  run.summary = integrity.valid ? {
    marketCount: integrity.marketCount,
    candidateCount: integrity.candidateCount,
    pdcCount: integrity.pdcCount
  } : null;
  run.integrity = integrity;
  run.displayUrl = integrity.valid ? integrity.displayUrl : "";
  run.displaySha256 = integrity.valid ? integrity.displaySha256 : "";
  run.status = integrity.valid ? "READY" : "FAILED";
  run.message = integrity.valid ? "Full-market run completed and passed integrity checks." : "Compute callback failed integrity checks.";
  await saveGenerationRun(store, run);
  return json({ ok: true, run: publicGenerationRun(run) });
}

async function generationApi(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const suffix = url.pathname.slice(`${DECISION_PATH}/api`.length).replace(/^\/+/, "");
  const store = decisionStore(env);
  if (!store) return error("Missing STOCK_PDC_KV or AUTH_KV binding.", 500);
  if (request.method === "POST" && suffix === "runs") return createGenerationRun(request, env);
  if (request.method === "GET" && suffix === "runs/current") {
    const pointer = await store.get(generationCurrentKey(), "json");
    const run = pointer?.runId ? await loadGenerationRun(store, pointer.runId) : null;
    if (!run || run.status !== "PUBLISHED" || !run.integrity?.valid) return error("No verified Stock PDC run has been published.", 404);
    return json({ ok: true, run: publicGenerationRun(run) });
  }
  const runMatch = suffix.match(/^runs\/([a-f0-9-]{36})$/i);
  if (request.method === "GET" && runMatch) {
    const run = await loadGenerationRun(store, runMatch[1]);
    return run ? json({ ok: true, run: publicGenerationRun(run) }) : error("Generation run was not found.", 404);
  }
  const publishMatch = suffix.match(/^runs\/([a-f0-9-]{36})\/publish$/i);
  if (request.method === "POST" && publishMatch) {
    const run = await loadGenerationRun(store, publishMatch[1]);
    if (!run) return error("Generation run was not found.", 404);
    if (run.status !== "READY" || !run.integrity?.valid) return error("Only a fully verified run can be published.", 409);
    run.status = "PUBLISHED";
    run.publishedAt = new Date().toISOString();
    run.message = "Run published. The daily Top 20 display may now use this run.";
    await Promise.all([
      saveGenerationRun(store, run),
      store.put(generationCurrentKey(), JSON.stringify({ runId: run.id, publishedAt: run.publishedAt }))
    ]);
    return json({ ok: true, run: publicGenerationRun(run) });
  }
  return error("Unknown trusted generation resource.", 404);
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
  return `${ACCESS_COOKIE}=${token}; Path=${PAGE_PATH}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

function clearAccessCookie() {
  return `${ACCESS_COOKIE}=; Path=${PAGE_PATH}; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function accessPage(error = "") {
  return html(`<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>股票大作手 Access | Turnpo</title>
    <meta name="robots" content="noindex, nofollow" />
    <link rel="shortcut icon" href="/favicon.ico" />
    <link rel="stylesheet" href="/styles.css" />
    <style>
      :root { color-scheme: light; }
      body { margin: 0; background: #f5f6f8; color: #15191f; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif; }
      body::before { display: none; }
      .topbar { grid-template-columns: auto 1fr auto; border-bottom: 1px solid rgba(21,25,31,.08); background: rgba(245,246,248,.84); backdrop-filter: blur(28px) saturate(1.35); }
      .brand { color: #15191f; }
      .brand-mark { border-color: rgba(21,25,31,.09); background-color: #fff; box-shadow: 0 10px 24px rgba(21,25,31,.08); }
      .top-actions .ghost-btn { min-height: 36px; border-color: rgba(21,25,31,.12); border-radius: 999px; background: rgba(255,255,255,.72); color: #15191f; font-size: 13px; font-weight: 680; box-shadow: 0 10px 28px rgba(21,25,31,.06); }
      .stock-gate { width: min(720px,100%); min-height: calc(100vh - 73px); display: grid; place-items: center; margin: 0 auto; padding: clamp(28px,5vw,56px) clamp(18px,5vw,72px); }
      .stock-card { width: min(480px,100%); display: grid; gap: 18px; padding: clamp(24px,4vw,36px); border: 1px solid rgba(21,25,31,.1); border-radius: 22px; background: rgba(255,255,255,.78); box-shadow: 0 34px 90px rgba(21,25,31,.12), inset 0 1px 0 rgba(255,255,255,.88); backdrop-filter: blur(24px) saturate(1.25); }
      .stock-card h1 { margin: 0; color: #15191f; font-size: clamp(38px,7vw,64px); line-height: .96; letter-spacing: 0; }
      .stock-card p { margin: 14px 0 0; color: #65707a; line-height: 1.5; }
      .stock-card label { display: grid; gap: 8px; }
      .stock-card label span { color: #65707a; font-size: 12px; font-weight: 780; letter-spacing: .06em; text-transform: uppercase; }
      .stock-card input { min-height: 48px; width: 100%; border: 1px solid rgba(21,25,31,.12); border-radius: 14px; outline: none; background: rgba(255,255,255,.8); color: #15191f; padding: 0 14px; }
      .stock-card input:focus { border-color: #22577a; box-shadow: 0 0 0 4px rgba(34,87,122,.14); }
      .stock-card button { min-height: 46px; border: 0; border-radius: 999px; background: #15191f; color: #fff; font-weight: 780; }
      .stock-error { min-height: 22px; margin: 0 !important; color: #b42318 !important; font-size: 13px; }
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
    <main class="stock-gate">
      <form class="stock-card" method="post">
        <div>
          <h1>股票大作手</h1>
          <p>Enter the access code to open the up-to-20 rank flow.</p>
        </div>
        <label>
          <span>Access code</span>
          <input name="accessCode" type="password" autocomplete="current-password" required autofocus />
        </label>
        <button type="submit">Enter</button>
        <p class="stock-error">${error}</p>
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

  if (!configuredAccessCode(env)) return error("Stock PDC access is not configured.", 503);

  if (url.pathname === `${PAGE_PATH}/logout`) {
    const headers = new Headers({ location: `${PAGE_PATH}/`, "cache-control": "no-store" });
    headers.append("set-cookie", clearAccessCookie());
    return new Response(null, { status: 303, headers });
  }

  if (url.pathname.startsWith(`${DECISION_PATH}/api`)) {
    if (await isAuthorized(request, env)) return generationApi(context);
    return error("Stock PDC access is required.", 401);
  }

  if (await isAuthorized(request, env)) return context.next();
  return accessPage();
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const callbackMatch = url.pathname.match(new RegExp(`^${DECISION_PATH}/api/runs/([a-f0-9-]{36})/complete$`, "i"));
  if (callbackMatch) return completeGenerationRun(request, env, callbackMatch[1]);

  if (!configuredAccessCode(env)) return error("Stock PDC access is not configured.", 503);

  if (url.pathname === `${PAGE_PATH}/logout`) {
    const headers = new Headers({ location: `${PAGE_PATH}/`, "cache-control": "no-store" });
    headers.append("set-cookie", clearAccessCookie());
    return new Response(null, { status: 303, headers });
  }

  if (url.pathname.startsWith(`${DECISION_PATH}/api`)) {
    if (await isAuthorized(request, env)) return generationApi(context);
    return error("Stock PDC access is required.", 401);
  }

  const formData = await request.formData();
  const accessCode = String(formData.get("accessCode") || "").trim();
  const expectedCode = configuredAccessCode(env);
  if (!timingSafeEqual(accessCode, expectedCode)) {
    return accessPage("Access code is incorrect.");
  }

  const token = await createToken(expectedCode);
  const headers = new Headers({ location: `${PAGE_PATH}/`, "cache-control": "no-store" });
  headers.append("set-cookie", accessCookie(token));
  return redirectWithHeaders(headers);
}
