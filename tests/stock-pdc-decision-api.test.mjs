import assert from "node:assert/strict";
import { onRequestGet, onRequestPost } from "../functions/stock-pdc/[[path]].js";

class MemoryKv {
  constructor() {
    this.values = new Map();
  }

  async get(key, type) {
    const value = this.values.get(key);
    return type === "json" && value ? JSON.parse(value) : value || null;
  }

  async put(key, value) {
    this.values.set(key, String(value));
  }
}

async function accessCookie(secret) {
  const expiry = Math.floor(Date.now() / 1000) + 3600;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(String(expiry)));
  const hex = [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `turnpo_stock_pdc_access=${expiry}.${hex}`;
}

const candidates = Array.from({ length: 8 }, (_, index) => ({
  ticker: `00000${index + 1}.SZ`,
  name: `候选 ${index + 1}`,
  rank: index + 1,
  score: 10 - index / 2,
  status: "Watch",
  mainReason: "Trend and volume facts supplied.",
  mainRisk: "Review downside risk.",
  signalDayChangePct: 0.5,
  scores: { trend_score: 8, risk_score: 7 }
}));

const originalFetch = globalThis.fetch;
let claudeRequest = null;
let geminiRequest = null;
globalThis.fetch = async (_url, options) => {
  const request = JSON.parse(options.body);
  const provider = String(_url).includes("api.anthropic.com") ? "claude" : String(_url).includes("generativelanguage.googleapis.com") ? "gemini" : "openai";
  const packetInput = provider === "claude"
    ? request.messages?.[0]?.content
    : provider === "gemini"
      ? request.contents?.[0]?.parts?.[0]?.text
      : request.input;
  const packet = JSON.parse(String(packetInput).replace("Candidate packet:\n", ""));
  const review = {
    rankings: packet.map((candidate, index) => ({
      ticker: candidate.ticker,
      score: 95 - index,
      thesis: `${candidate.name} has supplied evidence.`,
      risk: `${candidate.name} requires risk review.`,
      exclude: false
    })),
    summary: "Mock committee review completed."
  };
  if (provider === "claude") {
    claudeRequest = { request, headers: options.headers };
    return new Response(JSON.stringify({ content: [{ type: "text", text: JSON.stringify(review) }] }), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (provider === "gemini") {
    geminiRequest = { request, headers: options.headers };
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(review) }] } }] }), { status: 200, headers: { "content-type": "application/json" } });
  }
  return new Response(JSON.stringify({ output_text: JSON.stringify(review) }), { status: 200, headers: { "content-type": "application/json" } });
};

try {
  const secret = "decision-test-secret";
  const cookie = await accessCookie(secret);
  const env = {
    AUTH_KV: new MemoryKv(),
    OPENAI_API_KEY: "test-key",
    ANTHROPIC_API_KEY: "claude-test-key",
    ANTHROPIC_STOCK_MODEL: "claude-test-model",
    GEMINI_API_KEY: "gemini-test-key",
    GEMINI_STOCK_MODEL: "gemini-test-model",
    STOCK_PDC_ACCESS_CODE: secret
  };
  const context = (request) => ({ request, env, next: async () => new Response("next") });
  const requestFor = (path, body = null) => new Request(`https://turnpo.test${path}`, {
    method: body === null ? "GET" : "POST",
    headers: {
      cookie,
      ...(body === null ? {} : { "content-type": "application/json" })
    },
    body: body === null ? undefined : JSON.stringify(body)
  });

  let response = await onRequestGet(context(requestFor("/stock-pdc/decision/api/models")));
  assert.equal(response.status, 200);
  let payload = await response.json();
  assert.deepEqual(payload.models, [
    { id: "gpt-5.6-luna", label: "GPT-5.6 Luna", provider: "OpenAI", model: "gpt-5.6-luna" },
    { id: "claude_api_pdc", label: "Claude API PDC", provider: "Anthropic", model: "claude-test-model" },
    { id: "gemini_api_pdc", label: "Gemini API PDC", provider: "Google", model: "gemini-test-model" }
  ]);

  response = await onRequestPost(context(requestFor("/stock-pdc/decision/api/runs", {
    snapshot: {
      date: "2026-08-07",
      candidates,
      provenance: {
        snapshotId: "pdc-2026-08-07-test",
        primarySourceId: "stock-pdc-local-frozen-watchlist",
        primarySourceLabel: "Stock PDC 本地日度数据集",
        sourceFile: "outputs/daily_watchlists/watchlist_2026-08-07.csv",
        priceDataRun: "data_a_share_latest_runs/run_20260807",
        backupPolicy: "Validation only.",
        featureContract: "Deterministic facts, diversified reasoning."
      }
    },
    modelProfileId: "gpt-5.6-luna"
  })));
  assert.equal(response.status, 200);
  payload = await response.json();
  const runId = payload.run.id;
  assert.equal(payload.run.model, "gpt-5.6-luna");
  assert.equal(payload.run.modelProfile.id, "gpt-5.6-luna");
  assert.equal(payload.run.snapshot.provenance.snapshotId, "pdc-2026-08-07-test");

  response = await onRequestPost(context(requestFor(`/stock-pdc/decision/api/runs/${runId}/round-one/pdc`, {})));
  assert.equal(response.status, 200, "single reviewer should succeed");
  payload = await response.json();
  assert.equal(payload.run.roundOneComplete, false);

  for (const roleId of ["trend", "risk", "counter"]) {
    response = await onRequestPost(context(requestFor(`/stock-pdc/decision/api/runs/${runId}/round-one/${roleId}`, {})));
    assert.equal(response.status, 200, `${roleId} should succeed`);
    payload = await response.json();
  }
  assert.equal(payload.run.roundOneComplete, true);

  for (const stage of ["merge"]) {
    response = await onRequestPost(context(requestFor(`/stock-pdc/decision/api/runs/${runId}/${stage}`, {})));
    assert.equal(response.status, 200, `${stage} should succeed`);
    payload = await response.json();
  }
  for (const roleId of ["pdc", "trend", "risk", "counter"]) {
    response = await onRequestPost(context(requestFor(`/stock-pdc/decision/api/runs/${runId}/round-two/${roleId}`, {})));
    assert.equal(response.status, 200, `${roleId} should succeed`);
    payload = await response.json();
  }
  assert.equal(payload.run.roundTwoComplete, true);
  response = await onRequestPost(context(requestFor(`/stock-pdc/decision/api/runs/${runId}/risk-check`, {})));
  assert.equal(response.status, 200, "risk-check should succeed");
  payload = await response.json();
  assert.equal(payload.run.status, "READY_TO_PUBLISH");
  assert.equal(payload.run.final.length, 8);

  response = await onRequestPost(context(requestFor(`/stock-pdc/decision/api/runs/${runId}/publish`, {})));
  assert.equal(response.status, 200);
  payload = await response.json();
  assert.equal(payload.run.status, "PUBLISHED");
  assert.equal(payload.current.decisions.length, 8);
  assert.equal(payload.current.dataSnapshot.snapshotId, "pdc-2026-08-07-test");

  response = await onRequestGet(context(requestFor("/stock-pdc/decision/api/history")));
  payload = await response.json();
  assert.equal(payload.days.length, 1);
  assert.equal(payload.days[0].date, "2026-08-07");

  response = await onRequestPost(context(requestFor("/stock-pdc/decision/api/runs", {
    snapshot: { date: "2026-08-08", candidates },
    modelProfileId: "claude_api_pdc"
  })));
  assert.equal(response.status, 200);
  payload = await response.json();
  const claudeRunId = payload.run.id;
  assert.equal(payload.run.modelProfile.provider, "Anthropic");
  response = await onRequestPost(context(requestFor(`/stock-pdc/decision/api/runs/${claudeRunId}/round-one/pdc`, {})));
  assert.equal(response.status, 200, "Claude reviewer should succeed");
  assert.equal(claudeRequest.request.model, "claude-test-model");
  assert.equal(claudeRequest.headers["x-api-key"], "claude-test-key");
  assert.equal(claudeRequest.headers["anthropic-version"], "2023-06-01");

  response = await onRequestPost(context(requestFor("/stock-pdc/decision/api/runs", {
    snapshot: { date: "2026-08-08", candidates },
    modelProfileId: "gemini_api_pdc"
  })));
  assert.equal(response.status, 200);
  payload = await response.json();
  const geminiRunId = payload.run.id;
  assert.equal(payload.run.modelProfile.provider, "Google");
  response = await onRequestPost(context(requestFor(`/stock-pdc/decision/api/runs/${geminiRunId}/round-one/pdc`, {})));
  assert.equal(response.status, 200, "Gemini reviewer should succeed");
  assert.equal(geminiRequest.headers["x-goog-api-key"], "gemini-test-key");
  assert.equal(geminiRequest.request.generationConfig.responseMimeType, "application/json");
} finally {
  globalThis.fetch = originalFetch;
}

console.log("Stock PDC decision API checks passed");
