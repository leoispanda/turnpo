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

const candidates = Array.from({ length: 120 }, (_, index) => ({
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
globalThis.fetch = async (_url, options) => {
  const request = JSON.parse(options.body);
  const packet = JSON.parse(String(request.input).replace("Candidate packet:\n", ""));
  const roleIndex = ["PDC 综合评审", "趋势与量价评审", "风险与过热审计", "反方证伪评审"]
    .findIndex((name) => String(request.instructions).includes(name));
  const selected = request.text.format.name.includes("round-two")
    ? packet.slice(0, 20)
    : packet.slice(Math.max(0, roleIndex) * 20, Math.max(0, roleIndex + 1) * 20);
  return new Response(JSON.stringify({
    output_text: JSON.stringify({
      rankings: selected.map((candidate, index) => ({
        ticker: candidate.ticker,
        score: 95 - index,
        thesis: `${candidate.name} has supplied evidence.`,
        risk: `${candidate.name} requires risk review.`,
        exclude: false
      })),
      summary: "Mock committee review completed."
    })
  }), { status: 200, headers: { "content-type": "application/json" } });
};

try {
  const secret = "decision-test-secret";
  const cookie = await accessCookie(secret);
  const env = { AUTH_KV: new MemoryKv(), OPENAI_API_KEY: "test-key", OPENAI_STOCK_MODEL: "gpt-mini-test", STOCK_PDC_ACCESS_CODE: secret };
  const context = (request) => ({ request, env, next: async () => new Response("next") });
  const requestFor = (path, body = null) => new Request(`https://turnpo.test${path}`, {
    method: body === null ? "GET" : "POST",
    headers: {
      cookie,
      ...(body === null ? {} : { "content-type": "application/json" })
    },
    body: body === null ? undefined : JSON.stringify(body)
  });

  let response = await onRequestPost(context(requestFor("/stock-pdc/decision/api/runs", {
    snapshot: { date: "2026-08-07", candidates }
  })));
  assert.equal(response.status, 200);
  let payload = await response.json();
  const runId = payload.run.id;
  assert.equal(payload.run.model, "gpt-mini-test");
  assert.equal(payload.run.snapshot.candidates.length, 120);

  for (const stage of ["round-one", "merge", "round-two", "risk-check"]) {
    response = await onRequestPost(context(requestFor(`/stock-pdc/decision/api/runs/${runId}/${stage}`, {})));
    assert.equal(response.status, 200, `${stage} should succeed`);
    payload = await response.json();
    if (stage === "round-one") assert.equal(payload.run.roundOne.pdc.rankings.length, 20);
    if (stage === "merge") assert.equal(payload.run.pool.length, 80);
    if (stage === "round-two") assert.equal(payload.run.roundTwo.risk.rankings.length, 20);
  }
  assert.equal(payload.run.status, "READY_TO_PUBLISH");
  assert.equal(payload.run.snapshot.candidateCount, 120);
  assert.equal(payload.run.final.length, 10);

  response = await onRequestPost(context(requestFor(`/stock-pdc/decision/api/runs/${runId}/publish`, {})));
  assert.equal(response.status, 200);
  payload = await response.json();
  assert.equal(payload.run.status, "PUBLISHED");
  assert.equal(payload.current.decisions.length, 10);

  response = await onRequestGet(context(requestFor("/stock-pdc/decision/api/history")));
  payload = await response.json();
  assert.equal(payload.days.length, 1);
  assert.equal(payload.days[0].date, "2026-08-07");
} finally {
  globalThis.fetch = originalFetch;
}

console.log("Stock PDC decision API checks passed");
