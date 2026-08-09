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

  async delete(key) {
    this.values.delete(key);
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
let openAiRequest = null;
let claudeRequest = null;
let geminiRequest = null;
let deepseekRequest = null;
let kimiRequest = null;
const mockDimensionScores = (index) => ({
  marketRegime: 7,
  relativeStrength: 8,
  trendAcceleration: Math.max(5, 9 - index / 4),
  breakoutConfirmation: 8,
  volumeFlowConfirmation: 7,
  catalystInformation: 0,
  entryTiming: 8,
  overheatReversalRisk: 6,
  downsideFailureRisk: 7
});
globalThis.fetch = async (_url, options) => {
  const request = JSON.parse(options.body);
  const provider = String(_url).includes("api.anthropic.com") ? "claude" : String(_url).includes("generativelanguage.googleapis.com") ? "gemini" : String(_url).includes("api.deepseek.com") ? "deepseek" : String(_url).includes("api.moonshot.cn") ? "kimi" : "openai";
  const isVerification = request.input === "Verify readiness now."
    || request.messages?.some((message) => message.content === "Verify readiness now.")
    || request.contents?.[0]?.parts?.[0]?.text === "Verify readiness now.";
  if (isVerification) {
    const result = JSON.stringify({ status: "ok" });
    if (provider === "claude") return new Response(JSON.stringify({ content: [{ type: "text", text: result }] }), { status: 200, headers: { "content-type": "application/json" } });
    if (provider === "gemini") return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: result }] } }] }), { status: 200, headers: { "content-type": "application/json" } });
    if (provider === "deepseek" || provider === "kimi") return new Response(JSON.stringify({ choices: [{ message: { content: result } }] }), { status: 200, headers: { "content-type": "application/json" } });
    return new Response(JSON.stringify({ output_text: result }), { status: 200, headers: { "content-type": "application/json" } });
  }
  const isSmokeTest = request.input?.includes("今天股票市场如何")
    || request.messages?.some((message) => String(message.content).includes("今天股票市场如何"))
    || request.contents?.[0]?.parts?.[0]?.text?.includes("今天股票市场如何");
  if (isSmokeTest) {
    const reply = "我没有实时行情；盘前应先检查指数风险偏好。";
    if (provider === "claude") return new Response(JSON.stringify({ content: [{ type: "text", text: reply }] }), { status: 200, headers: { "content-type": "application/json" } });
    if (provider === "gemini") return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: reply }] } }] }), { status: 200, headers: { "content-type": "application/json" } });
    if (provider === "deepseek" || provider === "kimi") return new Response(JSON.stringify({ choices: [{ message: { content: reply } }] }), { status: 200, headers: { "content-type": "application/json" } });
    return new Response(JSON.stringify({ output_text: reply }), { status: 200, headers: { "content-type": "application/json" } });
  }
  const packetInput = provider === "claude"
    ? request.messages?.[0]?.content
    : provider === "gemini"
      ? request.contents?.[0]?.parts?.[0]?.text
      : provider === "deepseek"
        ? request.messages?.[1]?.content
        : provider === "kimi"
          ? request.messages?.[1]?.content
      : request.input;
  const packet = JSON.parse(String(packetInput).replace("Candidate packet:\n", ""));
  const review = {
    rankings: packet.map((candidate, index) => ({
      ticker: candidate.ticker,
      dimensionScores: mockDimensionScores(index),
      unavailableDimensions: ["catalystInformation"],
      dataGaps: "N/A — no short-term catalyst data supplied.",
      backgroundChecks: {
        fundamentalRedFlag: false,
        valuationExtremeFlag: false,
        majorEventRisk: false,
        financialDistressFlag: index === 7,
        stDelistingRisk: false
      },
      forwardPrediction: {
        prob5dUpGt2Pct: 68,
        expected5dReturnPct: 3.2,
        prob5dDownLtMinus3Pct: 12,
        forwardUpsideScore: 76
      },
      decision: "BUY",
      confidence: 72,
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
  if (provider === "deepseek") {
    deepseekRequest = { request, headers: options.headers };
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(review) } }] }), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (provider === "kimi") {
    kimiRequest = { request, headers: options.headers };
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(review) } }] }), { status: 200, headers: { "content-type": "application/json" } });
  }
  openAiRequest = { request, headers: options.headers };
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
    ANTHROPIC_DEMO_STOCK_MODEL: "claude-mini-test-model",
    GEMINI_API_KEY: "gemini-test-key",
    GEMINI_STOCK_MODEL: "gemini-test-model",
    DEEPSEEK_API_KEY: "deepseek-test-key",
    DEEPSEEK_STOCK_MODEL: "deepseek-test-model",
    DEEPSEEK_DEMO_STOCK_MODEL: "deepseek-mini-test-model",
    KIMI_API_KEY: "kimi-test-key",
    KIMI_STOCK_MODEL: "kimi-test-model",
    KIMI_DEMO_STOCK_MODEL: "kimi-mini-test-model",
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
  const verifiedRunBody = async (snapshot, modelProfileIds) => {
    const verificationResponse = await onRequestPost(context(requestFor("/stock-pdc/decision/api/verifications", { modelProfileIds })));
    assert.equal(verificationResponse.status, 200, "selected PDC models should be verified before a run");
    const verification = await verificationResponse.json();
    assert.equal(verification.ok, true, "every selected PDC model should return valid JSON during verification");
    return { snapshot, modelProfileIds, verificationId: verification.verification.id };
  };

  let response = await onRequestGet(context(requestFor("/stock-pdc/decision/api/models")));
  assert.equal(response.status, 200);
  let payload = await response.json();
  assert.deepEqual(payload.models, [
    { id: "gpt-5.6-sol", label: "GPT-5.6 Sol · Pro PDC", provider: "OpenAI", model: "gpt-5.6-sol", tier: "flagship" },
    { id: "claude_api_pdc", label: "Claude Fable 5 PDC", provider: "Anthropic", model: "claude-test-model", tier: "flagship" },
    { id: "gemini_api_pdc", label: "Gemini 3.1 Pro PDC", provider: "Google", model: "gemini-test-model", tier: "flagship" },
    { id: "deepseek_api_pdc", label: "DeepSeek API PDC", provider: "DeepSeek", model: "deepseek-test-model", tier: "flagship" },
    { id: "kimi_api_pdc", label: "Kimi API PDC", provider: "Moonshot", model: "kimi-test-model", tier: "flagship" }
  ]);

  response = await onRequestGet(context(requestFor("/stock-pdc/decision-demo/api/models")));
  assert.equal(response.status, 200);
  payload = await response.json();
  assert.equal(payload.mode, "demo");
  assert.deepEqual(payload.models.map((model) => model.model), [
    "gpt-5.6-luna", "claude-mini-test-model", "gemini-3.5-flash-lite", "deepseek-mini-test-model", "kimi-mini-test-model"
  ], "Mini Demo must select the low-cost model group, never the flagship fallback");

  response = await onRequestPost(context(requestFor("/stock-pdc/decision-demo/api/verifications", { modelProfileIds: ["gpt-5.6-luna"] })));
  assert.equal(response.status, 200);
  let demoVerification = await response.json();
  response = await onRequestPost(context(requestFor("/stock-pdc/decision-demo/api/runs", {
    snapshot: { date: "2026-08-07", candidates },
    modelProfileIds: ["gpt-5.6-luna"],
    verificationId: demoVerification.verification.id
  })));
  assert.equal(response.status, 200);
  const demoRun = await response.json();
  assert.equal(demoRun.run.mode, "demo");
  response = await onRequestGet(context(requestFor(`/stock-pdc/decision/api/runs/${demoRun.run.id}`)));
  assert.equal(response.status, 404, "formal PDC cannot read a Mini Demo run");
  response = await onRequestPost(context(requestFor(`/stock-pdc/decision-demo/api/runs/${demoRun.run.id}/publish`, {})));
  assert.equal(response.status, 409, "Mini Demo cannot publish to formal PDC");

  response = await onRequestPost(context(requestFor("/stock-pdc/decision/api/smoke-test", { modelProfileIds: ["gpt-5.6-sol"] })));
  assert.equal(response.status, 200, "a non-persistent conversation test should only verify that the selected model can reply");
  payload = await response.json();
  assert.equal(payload.test.members.length, 1);
  assert.equal(payload.test.members[0].ok, true);
  assert.ok(payload.test.members[0].reply.includes("实时行情"));

  const pdcNamedEnv = {
    ...env,
    ANTHROPIC_API_KEY: "",
    GEMINI_API_KEY: "",
    DEEPSEEK_API_KEY: "",
    KIMI_API_KEY: "",
    CLAUDE_API_PDC: "claude-pdc-key",
    "Gemini API Key pdc": "gemini-pdc-key",
    "deepseek api pdc": "deepseek-pdc-key",
    "kimi pdc": "kimi-pdc-key"
  };
  const pdcNamedContext = (request) => ({ request, env: pdcNamedEnv, next: async () => new Response("next") });
  response = await onRequestGet(pdcNamedContext(requestFor("/stock-pdc/decision/api/models")));
  assert.equal(response.status, 200);
  payload = await response.json();
  assert.equal(payload.models.length, 5, "PDC-suffixed Cloudflare secrets should enable every model member");

  response = await onRequestPost(context(requestFor("/stock-pdc/decision/api/runs", {
    snapshot: { date: "2026-08-07", candidates },
    modelProfileIds: ["gpt-5.6-sol"]
  })));
  assert.equal(response.status, 409, "a run must consume a fresh verification");

  const initialSnapshot = {
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
  };
  response = await onRequestPost(context(requestFor("/stock-pdc/decision/api/runs", await verifiedRunBody(initialSnapshot, ["gpt-5.6-sol", "claude_api_pdc", "gemini_api_pdc", "deepseek_api_pdc", "kimi_api_pdc"]))));
  assert.equal(response.status, 200);
  payload = await response.json();
  const runId = payload.run.id;
  assert.equal(payload.run.model, "MULTI_MODEL_PDC");
  assert.equal(payload.run.scoringSystem, "short-term-forward-upside-v2");
  assert.equal(payload.run.committeeMode, true);
  assert.equal(payload.run.members.length, 5);
  assert.equal(payload.run.modelVerification.members.length, 5);
  assert.equal(payload.run.modelVerification.members[0].response, '{"status":"ok"}');
  assert.equal(payload.run.members[0].id, "gpt-5.6-sol");
  assert.equal(payload.run.snapshot.provenance.snapshotId, "pdc-2026-08-07-test");
  assert.equal(payload.run.snapshot.facts.length, 8, "saved fact packet should be available for user copy-out");

  for (const memberId of ["gpt-5.6-sol", "claude_api_pdc", "gemini_api_pdc", "deepseek_api_pdc", "kimi_api_pdc"]) {
    response = await onRequestPost(context(requestFor(`/stock-pdc/decision/api/runs/${runId}/round-one/${memberId}`, {})));
    assert.equal(response.status, 200, `${memberId} first PDC conclusion should succeed`);
    payload = await response.json();
  }
  assert.equal(payload.run.roundOneComplete, true);
  assert.equal(payload.run.members[0].roundOne.rankings.length, 8);
  assert.equal(payload.run.members[0].roundOne.rankings[0].dimensionScores.trendAcceleration.score, 9);
  assert.equal(payload.run.members[0].roundOne.rankings[0].dimensionScores.catalystInformation.available, false);
  assert.equal(payload.run.members[0].roundOne.rankings[0].forwardPrediction.prob5dUpGt2Pct, 68);
  assert.equal(payload.run.members[0].roundOne.rankings[0].forwardOutcome.returnsPct.day1, null);
  assert.ok(openAiRequest.request.instructions.includes("next 5 trading days"));
  assert.ok(openAiRequest.request.text.format.schema.properties.rankings.items.properties.forwardPrediction);

  for (const stage of ["merge"]) {
    response = await onRequestPost(context(requestFor(`/stock-pdc/decision/api/runs/${runId}/${stage}`, {})));
    assert.equal(response.status, 200, `${stage} should succeed`);
    payload = await response.json();
  }
  for (const memberId of ["gpt-5.6-sol", "claude_api_pdc", "gemini_api_pdc", "deepseek_api_pdc", "kimi_api_pdc"]) {
    response = await onRequestPost(context(requestFor(`/stock-pdc/decision/api/runs/${runId}/round-two/${memberId}`, {})));
    assert.equal(response.status, 200, `${memberId} second PDC conclusion should succeed`);
    payload = await response.json();
  }
  assert.equal(payload.run.roundTwoComplete, true);
  response = await onRequestPost(context(requestFor(`/stock-pdc/decision/api/runs/${runId}/risk-check`, {})));
  assert.equal(response.status, 200, "risk-check should succeed");
  payload = await response.json();
  assert.equal(payload.run.status, "READY_TO_PUBLISH");
  assert.equal(payload.run.final.length, 7, "a fact-supported financial-distress flag must keep a ticker out of short-term BUY results");
  assert.equal(payload.run.final[0].dimensionConsensus.trendAcceleration.count, 5);
  assert.equal(payload.run.final[0].forwardPrediction.prob5dUpGt2Pct, 68);
  assert.equal(payload.run.final[0].forwardOutcome.returnsPct.day5, null);

  response = await onRequestPost(context(requestFor(`/stock-pdc/decision/api/runs/${runId}/publish`, {})));
  assert.equal(response.status, 200);
  payload = await response.json();
  assert.equal(payload.run.status, "PUBLISHED");
  assert.equal(payload.current.decisions.length, 7);
  assert.equal(payload.current.dataSnapshot.snapshotId, "pdc-2026-08-07-test");

  response = await onRequestGet(context(requestFor("/stock-pdc/decision/api/history")));
  payload = await response.json();
  assert.equal(payload.days.length, 1);
  assert.equal(payload.days[0].date, "2026-08-07");

  response = await onRequestPost(context(requestFor("/stock-pdc/portfolio/api/holdings/entry", {
    ticker: "000001.SZ", name: "候选 1", actualEntryPrice: 10, actualEntryDate: "2026-08-06", quantity: 100
  })));
  assert.equal(response.status, 200, "manual actual entry should create a portfolio holding");
  response = await onRequestPost(context(requestFor("/stock-pdc/portfolio/api/pre-market", {})));
  assert.equal(response.status, 200, "a published PDC run should generate the pre-market portfolio decision");
  let portfolioPayload = await response.json();
  assert.equal(portfolioPayload.dashboard.stage, "PRE_MARKET");
  assert.equal(portfolioPayload.dashboard.referencePrice, "PREVIOUS_CLOSE");
  assert.ok(portfolioPayload.dashboard.candidates.length <= 20);
  const noonRows = portfolioPayload.dashboard.candidates.map((row) => ({
    ticker: row.ticker, referencePrice: 10.2, dayChangePct: 2, entryTiming: 8, overheatSafety: 7, downsideSafety: 7,
    relativeStrength: 8, trendAcceleration: 8, breakoutConfirmation: 8, volumeConfirmation: 8, breakoutValid: true, pullback: false
  }));
  response = await onRequestPost(context(requestFor("/stock-pdc/portfolio/api/noon-recheck", {
    date: "2026-08-07", noonSnapshot: { rows: noonRows }
  })));
  assert.equal(response.status, 200, "noon recheck should freeze a new 11:30 reference-price snapshot");
  portfolioPayload = await response.json();
  assert.equal(portfolioPayload.dashboard.stage, "NOON_RECHECK");
  assert.equal(portfolioPayload.dashboard.referencePrice, "11:30_LATEST_AVAILABLE_PRICE");
  assert.ok(portfolioPayload.dashboard.noonSnapshot.rows.every((row) => row.referencePrice === 10.2));

  response = await onRequestPost(context(requestFor("/stock-pdc/decision/api/runs", await verifiedRunBody({ date: "2026-08-08", candidates }, ["claude_api_pdc"]))));
  assert.equal(response.status, 200);
  payload = await response.json();
  const claudeRunId = payload.run.id;
  assert.equal(payload.run.members[0].provider, "Anthropic");
  response = await onRequestPost(context(requestFor(`/stock-pdc/decision/api/runs/${claudeRunId}/round-one/claude_api_pdc`, {})));
  assert.equal(response.status, 200, "Claude reviewer should succeed");
  assert.equal(claudeRequest.request.model, "claude-test-model");
  assert.equal(claudeRequest.headers["x-api-key"], "claude-test-key");
  assert.equal(claudeRequest.headers["anthropic-version"], "2023-06-01");
  assert.ok(claudeRequest.request.system.includes("short-term forward upside"));
  assert.ok(claudeRequest.request.output_config.format.schema.properties.rankings.items.properties.backgroundChecks);

  response = await onRequestPost(context(requestFor("/stock-pdc/decision/api/runs", await verifiedRunBody({ date: "2026-08-08", candidates }, ["gemini_api_pdc"]))));
  assert.equal(response.status, 200);
  payload = await response.json();
  const geminiRunId = payload.run.id;
  assert.equal(payload.run.members[0].provider, "Google");
  response = await onRequestPost(context(requestFor(`/stock-pdc/decision/api/runs/${geminiRunId}/round-one/gemini_api_pdc`, {})));
  assert.equal(response.status, 200, "Gemini reviewer should succeed");
  assert.equal(geminiRequest.headers["x-goog-api-key"], "gemini-test-key");
  assert.equal(geminiRequest.request.generationConfig.responseMimeType, "application/json");
  assert.ok(geminiRequest.request.generationConfig.responseJsonSchema.properties.rankings.items.properties.forwardPrediction);

  response = await onRequestPost(context(requestFor("/stock-pdc/decision/api/runs", await verifiedRunBody({ date: "2026-08-08", candidates }, ["deepseek_api_pdc"]))));
  assert.equal(response.status, 200);
  payload = await response.json();
  const deepseekRunId = payload.run.id;
  assert.equal(payload.run.members[0].provider, "DeepSeek");
  response = await onRequestPost(context(requestFor(`/stock-pdc/decision/api/runs/${deepseekRunId}/round-one/deepseek_api_pdc`, {})));
  assert.equal(response.status, 200, "DeepSeek reviewer should succeed");
  assert.equal(deepseekRequest.headers.authorization, "Bearer deepseek-test-key");
  assert.equal(deepseekRequest.request.response_format.type, "json_object");

  response = await onRequestPost(context(requestFor("/stock-pdc/decision/api/runs", await verifiedRunBody({ date: "2026-08-08", candidates }, ["kimi_api_pdc"]))));
  assert.equal(response.status, 200);
  payload = await response.json();
  const kimiRunId = payload.run.id;
  assert.equal(payload.run.members[0].provider, "Moonshot");
  response = await onRequestPost(context(requestFor(`/stock-pdc/decision/api/runs/${kimiRunId}/round-one/kimi_api_pdc`, {})));
  assert.equal(response.status, 200, "Kimi reviewer should succeed");
  assert.equal(kimiRequest.headers.authorization, "Bearer kimi-test-key");
  assert.equal(kimiRequest.request.response_format.type, "json_object");
  assert.equal(kimiRequest.request.max_completion_tokens, 8000);
} finally {
  globalThis.fetch = originalFetch;
}

console.log("Stock PDC decision API checks passed");
