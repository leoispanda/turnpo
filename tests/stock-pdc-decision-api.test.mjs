import assert from "node:assert/strict";
import { onRequestGet, onRequestPost } from "../functions/stock-pdc/[[path]].js";

class MemoryKv {
  constructor() { this.values = new Map(); }
  async get(key, type) {
    const value = this.values.get(key);
    return type === "json" && value ? JSON.parse(value) : value || null;
  }
  async put(key, value) { this.values.set(key, String(value)); }
}

async function accessCookie(secret) {
  const expiry = Math.floor(Date.now() / 1000) + 3600;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(String(expiry)));
  const hex = [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `turnpo_stock_pdc_access=${expiry}.${hex}`;
}

const originalFetch = globalThis.fetch;
globalThis.fetch = async () => new Response("accepted", { status: 202 });

try {
  const secret = "generation-test-secret";
  const callback = "generation-callback-secret";
  const cookie = await accessCookie(secret);
  const env = {
    AUTH_KV: new MemoryKv(),
    STOCK_PDC_ACCESS_CODE: secret,
    STOCK_PDC_GENERATOR_URL: "https://generator.test/runs",
    STOCK_PDC_GENERATOR_CALLBACK_TOKEN: callback
  };
  const context = (request) => ({ request, env, next: async () => new Response("next") });
  const requestFor = (path, body = null, headers = {}) => new Request(`https://turnpo.test${path}`, {
    method: body === null ? "GET" : "POST",
    headers: { cookie, ...(body === null ? {} : { "content-type": "application/json" }), ...headers },
    body: body === null ? undefined : JSON.stringify(body)
  });

  let response = await onRequestPost(context(requestFor("/stock-pdc/decision/api/runs", {})));
  assert.equal(response.status, 200);
  let payload = await response.json();
  const runId = payload.run.id;
  assert.equal(payload.run.status, "FETCHING");
  assert.equal(payload.run.summary, null);

  response = await onRequestPost(context(requestFor("/stock-pdc/decision/api/runs", { candidates: [{ ticker: "600519.SH" }] })));
  assert.equal(response.status, 400);

  const manifest = {
    runId,
    sourceScope: "full_a_share_market",
    marketCount: 5000,
    candidateCount: 212,
    pdcCount: 212,
    rulesVersion: "hawkeye-fixed-v1",
    manifestHash: "a".repeat(64),
    displayUrl: `/stock-pdc/runs/${runId}/display.json`,
    displaySha256: "b".repeat(64)
  };
  response = await onRequestPost(context(requestFor(`/stock-pdc/decision/api/runs/${runId}/complete`, { manifest }, { "x-stock-pdc-callback-token": callback })));
  assert.equal(response.status, 200);
  payload = await response.json();
  assert.equal(payload.run.status, "READY");
  assert.equal(payload.run.integrity.valid, true);

  response = await onRequestPost(context(requestFor(`/stock-pdc/decision/api/runs/${runId}/publish`, {})));
  assert.equal(response.status, 200);
  payload = await response.json();
  assert.equal(payload.run.status, "PUBLISHED");

  response = await onRequestGet(context(requestFor(`/stock-pdc/decision/api/runs/${runId}`)));
  payload = await response.json();
  assert.equal(payload.run.summary.pdcCount, 212);

  response = await onRequestGet(context(requestFor("/stock-pdc/decision/api/runs/current")));
  payload = await response.json();
  assert.equal(payload.run.id, runId);
  assert.equal(payload.run.displayUrl, `/stock-pdc/runs/${runId}/display.json`);
} finally {
  globalThis.fetch = originalFetch;
}

console.log("Trusted Stock PDC generation API checks passed");
