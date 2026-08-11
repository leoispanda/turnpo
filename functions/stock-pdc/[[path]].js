const ACCESS_COOKIE = "turnpo_stock_pdc_access";
const UI_COOKIE = "turnpo_stock_pdc_ui";
const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const PAGE_PATH = "/stock-pdc";
const DECISION_PATH = `${PAGE_PATH}/decision`;
const DEMO_DECISION_PATH = `${PAGE_PATH}/decision-demo`;
const PORTFOLIO_PATH = `${PAGE_PATH}/portfolio`;
const OFFICIAL_DECISION_MODE = "official";
const DEMO_DECISION_MODE = "demo";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const DEEPSEEK_CHAT_URL = "https://api.deepseek.com/chat/completions";
const KIMI_CHAT_URL = "https://api.moonshot.cn/v1/chat/completions";
const DEFAULT_STOCK_MODEL = "gpt-5.6-sol";
const DEFAULT_SECRETARY_MODEL = "gpt-5.6-terra";
const DEFAULT_CLAUDE_STOCK_MODEL = "claude-fable-5";
const DEFAULT_DEEPSEEK_STOCK_MODEL = "deepseek-v4-pro";
const DEFAULT_KIMI_STOCK_MODEL = "kimi-k3";
const DEFAULT_GEMINI_STOCK_MODEL = "gemini-3.1-pro-preview";
const DEFAULT_DEMO_STOCK_MODEL = "gpt-5.6-luna";
const DEFAULT_CLAUDE_DEMO_STOCK_MODEL = "claude-haiku-4-5-20251001";
const DEFAULT_DEEPSEEK_DEMO_STOCK_MODEL = "deepseek-v4-flash";
const DEFAULT_GEMINI_DEMO_STOCK_MODEL = "gemini-3.5-flash-lite";
const DEFAULT_KIMI_DEMO_STOCK_MODEL = "kimi-k2.6";
const PDC_SCORING_SYSTEM = "short-term-forward-upside-v2";
const MAX_DECISION_BODY_BYTES = 512 * 1024;
const MAX_RUNS_PER_DAY = 8;
const MAX_SMOKE_TESTS_PER_DAY = 60;
const SMOKE_TEST_TIMEOUT_MS = 5 * 60 * 1000;
const RUN_TTL_SECONDS = 180 * 24 * 60 * 60;
const MODEL_VERIFICATION_TTL_SECONDS = 10 * 60;
const PDC_REVIEW_BATCH_SIZE = 30;
const PDC_MEMBER_STAGE_STORAGE = "PDC_MEMBER_STAGE_V1";
const MANUAL_MARKET_REFRESH_COOLDOWN_SECONDS = 15 * 60;
const MANUAL_MARKET_REFRESH_REPOSITORY = "leoispanda/turnpo";
const MANUAL_MARKET_REFRESH_WORKFLOW = "manual-stock-pdc-refresh.yml";
const MANUAL_MARKET_REFRESH_WORKFLOW_URL = `https://github.com/${MANUAL_MARKET_REFRESH_REPOSITORY}/actions/workflows/${MANUAL_MARKET_REFRESH_WORKFLOW}`;
const PORTFOLIO_DEFAULT_CONFIG = Object.freeze({
  maxPositions: 15,
  premarketRankLimit: 20,
  coreHoldRank: 15,
  rankExitThreshold: 20,
  rankExitDays: 2,
  buyMinVotes: 3,
  holdMinVotes: 2,
  buyMinForwardUpside: 65,
  buyMinProbability5dUp: 55,
  buyMinExpected5dReturn: 2,
  buyMinEntryTiming: 7,
  buyMinRelativeStrength: 6,
  buyMinTrendAcceleration: 6,
  buyMinBreakoutConfirmation: 6,
  buyMinVolumeConfirmation: 6,
  buyMinOverheatSafety: 6,
  buyMinDownsideSafety: 5,
  noonMaxChasePct: 5,
  hardStopPct: -5,
  timeWarningDays: 3,
  timeStopDays: 5,
  timeStopTargetPct: 2,
  cooldownTradingDays: 3,
  reentryMaxRank: 5,
  reentryMinVotes: 4,
  reentryMinEntryTiming: 8,
  replacementMargin: 12
});

const REVIEW_ROLES = [
  { id: "pdc", name: "PDC 综合评审", focus: "综合趋势、量价、现有因子与证据一致性" },
  { id: "trend", name: "趋势与量价评审", focus: "趋势延续、相对强弱、突破与成交量确认" },
  { id: "risk", name: "风险与过热审计", focus: "风险、过热、流动性、下行与不应参与的情形" },
  { id: "counter", name: "反方证伪评审", focus: "寻找论点漏洞、拥挤交易、证据不足和反例" }
];

const FULL_PDC_ROLE = {
  id: "full-pdc",
  name: "完整 PDC 决策委员",
  focus: "独立评估当前买入后未来 5 个交易日的上涨概率、买点时机、失败风险与证据一致性，并给出完整 Top 30 结论"
};

const PDC_DIMENSIONS = [
  { id: "marketRegime", label: "Market Regime", weight: 10 },
  { id: "relativeStrength", label: "Relative Strength", weight: 15 },
  { id: "trendAcceleration", label: "Trend Acceleration", weight: 15 },
  { id: "breakoutConfirmation", label: "Breakout Confirmation", weight: 15 },
  { id: "volumeFlowConfirmation", label: "Volume & Flow Confirmation", weight: 12 },
  { id: "catalystInformation", label: "Catalyst / Information", weight: 10 },
  { id: "entryTiming", label: "Entry Timing", weight: 10 },
  { id: "overheatReversalRisk", label: "Overheat / Reversal Risk", weight: 7 },
  { id: "downsideFailureRisk", label: "Downside / Failure Risk", weight: 6 }
];

const BACKGROUND_CHECKS = [
  "fundamentalRedFlag",
  "valuationExtremeFlag",
  "majorEventRisk",
  "financialDistressFlag",
  "stDelistingRisk"
];

function configuredAccessCode(env) {
  return String(env.STOCK_PDC_ACCESS_CODE || env.EMBA_ACCESS_CODE || "emba2026").trim();
}

function stockModel(env) {
  return String(env.OPENAI_STOCK_MODEL || DEFAULT_STOCK_MODEL).trim();
}

function demoStockModel(env) {
  return String(env.OPENAI_DEMO_STOCK_MODEL || DEFAULT_DEMO_STOCK_MODEL).trim();
}

function secretaryStockModel(env) {
  return String(env.OPENAI_SECRETARY_MODEL || env.STOCK_PDC_SECRETARY_MODEL || DEFAULT_SECRETARY_MODEL).trim();
}

function secretaryProfile(env) {
  return {
    id: "pdc_secretary",
    label: "Secretary · GPT-5.6 Terra",
    provider: "OpenAI",
    model: secretaryStockModel(env),
    tier: "secretary"
  };
}

function claudeApiKey(env) {
  return String(env.ANTHROPIC_API_KEY || env.CLAUDE_API_KEY || env.CLAUDE_API_PDC || env.CLAUDE_PDC_API_KEY || env.CLAUDE_API_KEY_PDC || env.claude_api_pdc || env["claude api pdc"] || "").trim();
}

function claudeStockModel(env) {
  return String(env.ANTHROPIC_STOCK_MODEL || env.CLAUDE_STOCK_MODEL || DEFAULT_CLAUDE_STOCK_MODEL).trim();
}

function claudeDemoStockModel(env) {
  return String(env.ANTHROPIC_DEMO_STOCK_MODEL || env.CLAUDE_DEMO_STOCK_MODEL || DEFAULT_CLAUDE_DEMO_STOCK_MODEL).trim();
}

function configuredModelProfiles(env, mode = OFFICIAL_DECISION_MODE, forceFullCommittee = false) {
  const demo = mode === DEMO_DECISION_MODE;
  const profiles = [{
    id: demo ? "gpt-5.6-luna" : "gpt-5.6-sol",
    label: demo ? "GPT-5.6 Luna · Mini Demo" : "GPT-5.6 Sol · Pro PDC",
    provider: "OpenAI",
    model: demo ? demoStockModel(env) : stockModel(env),
    tier: demo ? "mini-demo" : "flagship"
  }];
  if (forceFullCommittee || claudeApiKey(env)) {
    profiles.push({
      id: "claude_api_pdc",
      label: demo ? "Claude · Mini Demo" : "Claude Fable 5 PDC",
      provider: "Anthropic",
      model: demo ? claudeDemoStockModel(env) : claudeStockModel(env),
      tier: demo ? "mini-demo" : "flagship"
    });
  }
  if (forceFullCommittee || geminiApiKey(env)) {
    profiles.push({
      id: "gemini_api_pdc",
      label: demo ? "Gemini Flash · Mini Demo" : "Gemini 3.1 Pro PDC",
      provider: "Google",
      model: demo ? geminiDemoStockModel(env) : geminiStockModel(env),
      tier: demo ? "mini-demo" : "flagship"
    });
  }
  if (forceFullCommittee || deepseekApiKey(env)) {
    profiles.push({
      id: "deepseek_api_pdc",
      label: demo ? "DeepSeek Flash · Mini Demo" : "DeepSeek API PDC",
      provider: "DeepSeek",
      model: demo ? deepseekDemoStockModel(env) : deepseekStockModel(env),
      tier: demo ? "mini-demo" : "flagship"
    });
  }
  if (forceFullCommittee || kimiApiKey(env)) {
    profiles.push({
      id: "kimi_api_pdc",
      label: demo ? "Kimi · Mini Demo" : "Kimi API PDC",
      provider: "Moonshot",
      model: demo ? kimiDemoStockModel(env) : kimiStockModel(env),
      tier: demo ? "mini-demo" : "flagship"
    });
  }
  return profiles;
}

function publicModelProfile(profile) {
  return {
    id: profile.id,
    label: profile.label,
    provider: profile.provider,
    model: profile.model,
    tier: profile.tier || "flagship"
  };
}

function selectedModelProfile(env, profileId, mode = OFFICIAL_DECISION_MODE) {
  const requestedId = cleanText(profileId || "gpt-5.6-sol", 64);
  return configuredModelProfiles(env, mode).find((profile) => profile.id === requestedId) || null;
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
  if (value === null || value === undefined || typeof value === "boolean") return fallback;
  if (typeof value === "string" && !value.trim()) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function validDate(value) {
  const date = cleanText(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
}

function decisionPrefix(mode = OFFICIAL_DECISION_MODE) {
  return mode === DEMO_DECISION_MODE ? "stock-pdc:decision-demo" : "stock-pdc:decision";
}

function decisionRunKey(runId, mode = OFFICIAL_DECISION_MODE) {
  return `${decisionPrefix(mode)}:run:${runId}`;
}

// A committee member never shares a mutable scoring record with another
// member. This prevents a parallel OpenAI/Claude/Gemini/DeepSeek/Kimi write
// from overwriting another model's independently auditable result.
function decisionMemberStageKey(runId, stage, memberId, mode = OFFICIAL_DECISION_MODE) {
  const safeStage = stage === "round-two" ? "round-two" : "round-one";
  const safeMember = cleanText(memberId, 80).replace(/[^a-z0-9_.-]/gi, "_");
  return `${decisionPrefix(mode)}:run:${cleanText(runId, 80)}:member:${safeStage}:${safeMember}`;
}

function decisionDayKey(date, mode = OFFICIAL_DECISION_MODE) {
  return `${decisionPrefix(mode)}:day:${date}`;
}

function decisionHistoryKey(mode = OFFICIAL_DECISION_MODE) {
  return `${decisionPrefix(mode)}:history`;
}

function decisionCurrentKey(mode = OFFICIAL_DECISION_MODE) {
  return `${decisionPrefix(mode)}:current`;
}

function decisionRateKey(date, mode = OFFICIAL_DECISION_MODE) {
  return `${decisionPrefix(mode)}:run-count:${date}`;
}

function decisionVerificationKey(verificationId, mode = OFFICIAL_DECISION_MODE) {
  return `${decisionPrefix(mode)}:verification:${verificationId}`;
}

function decisionSmokeTestRateKey(date, mode = OFFICIAL_DECISION_MODE) {
  return `${decisionPrefix(mode)}:smoke-test-count:${date}`;
}

function manualMarketRefreshKey() {
  // The market snapshot is shared by Mini and formal PDC. One manual request
  // must therefore lock both pages, rather than queueing two identical jobs.
  return "stock-pdc:manual-market-refresh";
}

async function queueManualMarketRefresh(env) {
  const token = String(env.STOCK_PDC_GITHUB_TOKEN || "").trim();
  if (!token) {
    // A token is optional: without it, the owner can still start the exact
    // same workflow manually in GitHub. Return the link rather than implying
    // that market data or PDC itself is unavailable.
    return json({
      error: "This site is not connected to start the workflow directly.",
      code: "MANUAL_REFRESH_GITHUB_ONLY",
      workflowUrl: MANUAL_MARKET_REFRESH_WORKFLOW_URL
    }, { status: 503 });
  }
  const store = decisionStore(env);
  if (!store) return error("Missing STOCK_PDC_KV or AUTH_KV binding.", 500);

  const lockKey = manualMarketRefreshKey();
  const existing = await store.get(lockKey, "json");
  if (existing?.requestedAt) {
    return error("A manual market refresh is already queued. Wait for it to finish, then reload this page.", 409);
  }

  const response = await fetch(
    `https://api.github.com/repos/${MANUAL_MARKET_REFRESH_REPOSITORY}/actions/workflows/${MANUAL_MARKET_REFRESH_WORKFLOW}/dispatches`,
    {
      method: "POST",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        "x-github-api-version": "2026-03-10"
      },
      body: JSON.stringify({ ref: "main" })
    }
  );
  if (!response.ok) {
    const githubPayload = await response.json().catch(() => ({}));
    const githubMessage = cleanText(githubPayload?.message || "GitHub did not provide an error message.", 240);
    // Do not expose the token, but preserve the upstream status and message so
    // the owner can distinguish an expired token from a permission or workflow
    // problem. The GitHub workflow remains a safe manual fallback.
    return json({
      error: `GitHub rejected the manual market refresh (HTTP ${response.status}: ${githubMessage}).`,
      code: "MANUAL_REFRESH_GITHUB_REJECTED",
      githubStatus: response.status,
      workflowUrl: MANUAL_MARKET_REFRESH_WORKFLOW_URL
    }, { status: 502 });
  }

  const requestedAt = new Date().toISOString();
  await store.put(lockKey, JSON.stringify({ requestedAt }), { expirationTtl: MANUAL_MARKET_REFRESH_COOLDOWN_SECONDS });
  return json({
    ok: true,
    status: "QUEUED",
    requestedAt,
    workflowUrl: MANUAL_MARKET_REFRESH_WORKFLOW_URL,
    message: "Manual full-market refresh queued. It does not run PDC models or publish a decision."
  }, { status: 202 });
}

function extractOutputText(data) {
  if (typeof data.output_text === "string") return data.output_text;
  const content = data.output
    ?.flatMap((item) => item.content || [])
    ?.find((item) => item.type === "output_text" && typeof item.text === "string");
  return content?.text || "";
}

function normalizeScores(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .slice(0, 14)
    .map(([key, score]) => [cleanText(key, 60), finiteNumber(score)])
    .filter(([key, score]) => key && score !== null));
}

function normalizeFacts(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .slice(0, 20)
    .map(([key, fact]) => [cleanText(key, 60), finiteNumber(fact)])
    .filter(([key, fact]) => key && fact !== null));
}

function normalizeProvenance(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const snapshotId = cleanText(value.snapshotId, 120);
  const primarySourceId = cleanText(value.primarySourceId, 100);
  if (!snapshotId || !primarySourceId) return null;
  return {
    snapshotId,
    primarySourceId,
    primarySourceLabel: cleanText(value.primarySourceLabel, 160),
    sourceFile: cleanText(value.sourceFile, 320),
    priceDataRun: cleanText(value.priceDataRun, 320),
    marketDataProvider: cleanText(value.marketDataProvider, 80),
    backupPolicy: cleanText(value.backupPolicy, 240),
    featureContract: cleanText(value.featureContract, 240)
  };
}

function normalizeCandidate(value, index) {
  const ticker = cleanText(value?.ticker, 24).toUpperCase();
  if (!/^[A-Z0-9.]{4,24}$/.test(ticker)) return null;
  return {
    ticker,
    name: cleanText(value?.name || ticker, 80),
    rank: Math.max(1, Math.min(99, Math.round(finiteNumber(value?.rank, index + 1)))),
    score: finiteNumber(value?.score),
    status: cleanText(value?.status, 60),
    mainReason: cleanText(value?.mainReason, 800),
    mainRisk: cleanText(value?.mainRisk, 600),
    signalDayChangePct: finiteNumber(value?.signalDayChangePct),
    scores: normalizeScores(value?.scores),
    facts: normalizeFacts(value?.facts)
  };
}

function normalizeSnapshot(value) {
  const date = validDate(value?.date);
  const candidates = Array.isArray(value?.candidates)
    ? value.candidates.map(normalizeCandidate).filter(Boolean)
    : [];
  if (!date) return null;
  return {
    date,
    source: cleanText(value?.source || "stock-pdc/rank-flow.json", 160),
    provenance: normalizeProvenance(value?.provenance),
    candidates,
    capturedAt: new Date().toISOString()
  };
}

async function serverHawkeyeSnapshot(request) {
  const sourceUrl = new URL("/stock-pdc/hawkeye/latest.json", request.url);
  const response = await fetch(sourceUrl, {
    headers: { cookie: request.headers.get("cookie") || "" },
    cf: { cacheTtl: 0, cacheEverything: false }
  });
  if (!response.ok) throw new Error("Could not load the current Hawkeye Radar snapshot.");
  const packet = await response.json();
  const candidates = Array.isArray(packet?.candidates) ? packet.candidates : [];
  const rules = packet?.rules || {};
  const expectedMarketCap = 30_000_000_000;
  const expectedReturn60d = 5;
  const expectedSchema = "stock-pdc-hawkeye-v2";
  const marketDataProvider = cleanText(packet?.marketDataProvider, 80).toLowerCase();
  if (packet?.availability !== "ACTIVE") {
    throw new Error(`Hawkeye Radar is not ready: ${(packet?.validationErrors || []).join(" ") || "unknown validation failure"}`);
  }
  if (rules.minMarketCapCny !== expectedMarketCap || rules.minReturn60dPct !== expectedReturn60d) {
    throw new Error("Hawkeye Radar rules do not match the fixed market-cap and 60-day-return policy.");
  }
  if (packet?.schemaVersion !== expectedSchema) {
    throw new Error("Hawkeye Radar snapshot predates full-market accounting. Regenerate it from the API market snapshot.");
  }
  if (!["eastmoney", "sina"].includes(marketDataProvider)) {
    throw new Error("Hawkeye Radar does not identify one verified full-market data provider.");
  }
  const checkedCount = Number(packet?.checkedCount);
  const marketUniverseCount = Number(packet?.marketUniverseCount);
  const rejectedCount = Number(packet?.rejectedCount);
  const dataFailedCount = Number(packet?.dataFailedCount);
  const universeExcludedCount = Number(packet?.universeExcludedCount);
  const passedCount = Number(packet?.passedCount);
  const requiredCoverageRate = Number(packet?.dataIntegrity?.requiredCoverageRate);
  const coverageRate = Number(packet?.dataIntegrity?.coverageRate);
  if (!packet?.asOfDate || candidates.length !== passedCount || packet.dispatchedCount !== passedCount) {
    throw new Error("Hawkeye Radar did not provide every passed candidate.");
  }
  if (![checkedCount, marketUniverseCount, rejectedCount, dataFailedCount, universeExcludedCount, passedCount].every(Number.isInteger)
      || marketUniverseCount !== checkedCount
      || passedCount + rejectedCount + dataFailedCount + universeExcludedCount !== checkedCount) {
    throw new Error("Hawkeye Radar market-universe accounting is incomplete.");
  }
  if (Number.isFinite(requiredCoverageRate) && Number.isFinite(coverageRate) && coverageRate < requiredCoverageRate) {
    throw new Error("Hawkeye Radar market-data coverage is below its required completion threshold.");
  }
  if (candidates.some((row) => (
    row?.status !== "HAWKEYE_PASSED"
      || !Number.isFinite(row?.facts?.marketCapCny)
      || row.facts.marketCapCny <= expectedMarketCap
      || !Number.isFinite(row?.facts?.return60dPct)
      || row.facts.return60dPct <= expectedReturn60d
  ))) {
    throw new Error("Hawkeye Radar contains a candidate that violates the fixed eligibility rules.");
  }
  const snapshot = normalizeSnapshot({
    date: packet.asOfDate,
    source: packet.sourceFiles?.candidateUniverse || "outputs/candidate_universe.csv",
    provenance: {
      snapshotId: `hawkeye-${packet.asOfDate}-${packet.sourceGeneratedAt || packet.generatedAt || ""}`,
      primarySourceId: `stock-pdc-${marketDataProvider}-market-snapshot`,
      primarySourceLabel: `Stock PDC ${marketDataProvider} 全市场快照`,
      sourceFile: packet.sourceFiles?.candidateUniverse || "outputs/candidate_universe.csv",
      priceDataRun: packet.asOfDate,
      marketDataProvider,
      backupPolicy: "完整全市场备用源只在主源失败时整体接管；不同源的股票行永不混合。",
      featureContract: "Every Hawkeye-passed name enters the PDC. No browser-supplied candidate list is accepted."
    },
    candidates
  });
  if (!snapshot || snapshot.candidates.length !== candidates.length) throw new Error("Hawkeye Radar snapshot could not be normalized without dropping candidates.");
  return snapshot;
}

function serializableCandidates(candidates) {
  return candidates.map((candidate) => ({
    ticker: candidate.ticker,
    name: candidate.name,
    rank: candidate.rank,
    score: candidate.score,
    status: candidate.status,
    mainReason: candidate.mainReason,
    mainRisk: candidate.mainRisk,
    signalDayChangePct: candidate.signalDayChangePct,
    scores: candidate.scores,
    facts: candidate.facts
  }));
}

function dimensionScoreProperties() {
  return Object.fromEntries(PDC_DIMENSIONS.map((dimension) => [dimension.id, { type: "number", minimum: 0, maximum: 10 }]));
}

function backgroundCheckProperties() {
  return Object.fromEntries(BACKGROUND_CHECKS.map((id) => [id, { type: "boolean" }]));
}

function forwardPredictionProperties() {
  return {
    prob5dUpGt2Pct: { type: "number", minimum: 0, maximum: 100 },
    expected5dReturnPct: { type: "number", minimum: -100, maximum: 100 },
    prob5dDownLtMinus3Pct: { type: "number", minimum: 0, maximum: 100 },
    forwardUpsideScore: { type: "number", minimum: 0, maximum: 100 }
  };
}

function rankingSchemaProperties() {
  return {
    ticker: { type: "string" },
    dimensionScores: {
      type: "object",
      additionalProperties: false,
      required: PDC_DIMENSIONS.map((dimension) => dimension.id),
      properties: dimensionScoreProperties()
    },
    unavailableDimensions: { type: "array", items: { type: "string", enum: PDC_DIMENSIONS.map((dimension) => dimension.id) } },
    backgroundChecks: {
      type: "object",
      additionalProperties: false,
      required: BACKGROUND_CHECKS,
      properties: backgroundCheckProperties()
    },
    forwardPrediction: {
      type: "object",
      additionalProperties: false,
      required: ["prob5dUpGt2Pct", "expected5dReturnPct", "prob5dDownLtMinus3Pct", "forwardUpsideScore"],
      properties: forwardPredictionProperties()
    },
    decision: { type: "string", enum: ["BUY", "WATCH", "HOLD", "SELL"] },
    confidence: { type: "number", minimum: 0, maximum: 100 },
    exclude: { type: "boolean" }
  };
}

function reviewSchema(name, expectedCount) {
  return {
    type: "json_schema",
    name,
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["rankings"],
      properties: {
        rankings: {
          type: "array",
          minItems: expectedCount,
          maxItems: expectedCount,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["ticker", "dimensionScores", "unavailableDimensions", "backgroundChecks", "forwardPrediction", "decision", "confidence", "exclude"],
            properties: rankingSchemaProperties()
          }
        }
      }
    }
  };
}

function portableReviewSchema(expectedCount) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["rankings"],
    properties: {
      rankings: {
        type: "array",
        minItems: expectedCount,
        maxItems: expectedCount,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["ticker", "dimensionScores", "unavailableDimensions", "backgroundChecks", "forwardPrediction", "decision", "confidence", "exclude"],
          properties: rankingSchemaProperties()
        }
      }
    }
  };
}

function deterministicSecretaryMetrics(run) {
  const members = committeeMembers(run);
  const rows = consensusFromReviews(committeeReviewMap(run, "round-two"), run.pool || []);
  const requiredSupport = Math.max(1, Math.ceil(members.length / 2));
  return {
    format: "PDC_SCORECARD_V1",
    memberCount: members.length,
    candidateCount: rows.length,
    requiredSupport,
    unanimousBuyCount: rows.filter((row) => row.buyVotes === members.length).length,
    majorityBuyCount: rows.filter((row) => row.buyVotes >= requiredSupport).length,
    splitDecisionCount: rows.filter((row) => row.buyVotes > 0 && row.buyVotes < requiredSupport).length,
    riskFlaggedCount: rows.filter((row) => row.backgroundChecks.financialDistressFlag || row.backgroundChecks.stDelistingRisk).length
  };
}

function secretaryReview(run) {
  return {
    profile: { id: "secretary-scorecard", label: "Secretary · Program Scorecard", provider: "Program", model: "PDC_SCORECARD_V1", tier: "deterministic" },
    metrics: deterministicSecretaryMetrics(run)
  };
}

function reviewInstructions(role, phase) {
  return [
    "You are one role in an internal A-share research committee.",
    `Your role is ${role.name}; focus on ${role.focus}.`,
    "Use only the supplied factual candidate packet. Do not invent news, prices, financial results, or external facts.",
    "This is research support, not a trading instruction. Be conservative when evidence is weak.",
    "Your sole task is short-term forward upside: based only on the frozen fact package, determine whether buying at the current reference price is likely to produce a meaningful positive return in the next 5 trading days. Do not evaluate whether this is a good company or a good long-term investment.",
    "Penalize stocks likely to move sideways even when long-term quality or historical trend is high. A strong historical trend alone is insufficient: judge whether forward momentum remains from this specific entry point.",
    "Score every supplied ticker on the nine fixed short-term dimensions: marketRegime 10%, relativeStrength 15%, trendAcceleration 15%, breakoutConfirmation 15%, volumeFlowConfirmation 12%, catalystInformation 10%, entryTiming 10%, overheatReversalRisk 7%, downsideFailureRisk 6%.",
    "Every available dimension uses one direction: 10 is most favorable for buying now and seeing a continued short-term rise; 0 is least favorable. For overheatReversalRisk, 10 means not overheated and low reversal risk. For downsideFailureRisk, 10 means low downside and failure risk.",
    "CatalystInformation is only a dated or timely short-term price catalyst evidenced in the frozen packet. If it or any other dimension lacks factual support, put its id in unavailableDimensions and set that dimension score to 0. Never guess or invent news. The program ignores unavailable dimensions and calculates weighted scores.",
    "Fundamental and valuation are not scored. Return backgroundChecks only to flag clear, fact-supported red flags; false means no flag was evidenced in the supplied packet, not that the company has passed a full diligence review. Never use a low PE or long-term company quality to raise the short-term score.",
    "For every ticker return forwardPrediction: probability in percent that 5D return exceeds +2%, expected 5D return percent, probability in percent that 5D return is below -3%, and a 0-100 forwardUpsideScore. These are forecasts from the frozen facts, not known outcomes.",
    "Return exactly one fixed-format scorecard record for every supplied ticker, with no omissions, duplicates, extra tickers, Top-N truncation, thesis, risk, data-gap prose, explanation, or summary text. The program performs the ranking after it verifies full coverage. BUY means a favorable current entry with credible 5D forward upside; WATCH, HOLD, and SELL must be used when that threshold is not met. Use exclude=true when the supplied packet itself shows evidence is inadequate or risk is too high.",
    phase === "round-two"
      ? "This is the second review. Challenge the first-pass consensus and look for reasons a candidate should not advance."
      : "This is the first independent review. Do not assume any other reviewer agrees with you."
  ].join(" ");
}

function normalizeDimensionScores(value, unavailableDimensions) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const validDimensionIds = new Set(PDC_DIMENSIONS.map((dimension) => dimension.id));
  const unavailableSource = Array.isArray(unavailableDimensions) ? unavailableDimensions : null;
  const unavailable = new Set((unavailableSource || []).filter((id) => validDimensionIds.has(id)));
  const unavailableIsValid = unavailableSource !== null
    && unavailable.size === unavailableSource.length
    && unavailableSource.every((id, index) => typeof id === "string" && unavailableSource.indexOf(id) === index);
  const dimensionScores = {};
  let coveredWeight = 0;
  let weightedTotal = 0;
  let valid = unavailableIsValid;
  PDC_DIMENSIONS.forEach((dimension) => {
    const score = finiteNumber(input[dimension.id]);
    const isUnavailable = unavailable.has(dimension.id);
    const scoreIsValid = score !== null && score >= 0 && score <= 10;
    const available = !isUnavailable && scoreIsValid;
    if ((isUnavailable && score !== 0) || (!isUnavailable && !scoreIsValid)) valid = false;
    dimensionScores[dimension.id] = {
      available,
      score: available ? score : null
    };
    if (available) {
      coveredWeight += dimension.weight;
      weightedTotal += (dimensionScores[dimension.id].score / 10) * dimension.weight;
    }
  });
  return {
    valid,
    dimensionScores,
    coveragePct: coveredWeight,
    weightedScore: coveredWeight ? Number(((weightedTotal / coveredWeight) * 100).toFixed(2)) : 0
  };
}

function normalizeBackgroundChecks(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (!BACKGROUND_CHECKS.every((id) => typeof value[id] === "boolean")) return null;
  return Object.fromEntries(BACKGROUND_CHECKS.map((id) => [id, value[id]]));
}

function normalizeForwardPrediction(value) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : null;
  if (!input) return null;
  const percentage = (key) => {
    const number = finiteNumber(input[key]);
    return number === null || number < 0 || number > 100 ? null : Number(number.toFixed(2));
  };
  const returnPct = finiteNumber(input.expected5dReturnPct);
  if (percentage("prob5dUpGt2Pct") === null || returnPct === null || returnPct < -100 || returnPct > 100 || percentage("prob5dDownLtMinus3Pct") === null || percentage("forwardUpsideScore") === null) {
    return null;
  }
  return {
    prob5dUpGt2Pct: percentage("prob5dUpGt2Pct"),
    expected5dReturnPct: Number(returnPct.toFixed(2)),
    prob5dDownLtMinus3Pct: percentage("prob5dDownLtMinus3Pct"),
    forwardUpsideScore: percentage("forwardUpsideScore")
  };
}

function pendingForwardOutcome(referenceDate) {
  return {
    status: "PENDING_PRICE_DATA",
    referenceDate,
    referencePrice: null,
    returnsPct: { day1: null, day3: null, day5: null, day10: null },
    excursionsPct: {
      day5: { maxFavorable: null, maxAdverse: null },
      day10: { maxFavorable: null, maxAdverse: null }
    },
    labels: { success5dUpGt2Pct: null }
  };
}

function attachPendingForwardOutcomes(review, referenceDate) {
  if (!review?.rankings?.length) return review;
  review.rankings = review.rankings.map((row) => ({ ...row, forwardOutcome: pendingForwardOutcome(referenceDate) }));
  return review;
}

function normalizeReview(value, candidates) {
  const requiredFields = new Set(["ticker", "dimensionScores", "unavailableDimensions", "backgroundChecks", "forwardPrediction", "decision", "confidence", "exclude"]);
  const expectedTickers = candidates.map((candidate) => candidate.ticker);
  const allowed = new Set(expectedTickers);
  const byTicker = new Map(candidates.map((candidate) => [candidate.ticker, candidate]));
  const seen = new Set();
  const duplicateTickers = [];
  const unexpectedTickers = [];
  const invalidTickers = [];
  let malformedRowCount = 0;
  const rawRankings = Array.isArray(value?.rankings) ? value.rankings : [];
  const rankings = rawRankings
    .map((row) => {
      if (!row || typeof row !== "object" || Array.isArray(row) || Object.keys(row).some((key) => !requiredFields.has(key))) {
        malformedRowCount += 1;
        return null;
      }
      const ticker = cleanText(row?.ticker, 24).toUpperCase();
      if (!ticker) {
        malformedRowCount += 1;
        return null;
      }
      if (!allowed.has(ticker)) {
        unexpectedTickers.push(ticker);
        return null;
      }
      if (seen.has(ticker)) {
        duplicateTickers.push(ticker);
        return null;
      }
      seen.add(ticker);
      const dimensions = normalizeDimensionScores(row?.dimensionScores, row?.unavailableDimensions);
      const backgroundChecks = normalizeBackgroundChecks(row?.backgroundChecks);
      const forwardPrediction = normalizeForwardPrediction(row?.forwardPrediction);
      const decision = ["BUY", "WATCH", "HOLD", "SELL"].includes(row?.decision) ? row.decision : "";
      const confidence = finiteNumber(row?.confidence);
      if (!dimensions.valid || !backgroundChecks || !forwardPrediction || !decision || confidence === null || confidence < 0 || confidence > 100 || typeof row?.exclude !== "boolean") {
        invalidTickers.push(ticker);
        return null;
      }
      return {
        ticker,
        name: byTicker.get(ticker)?.name || ticker,
        score: dimensions.weightedScore,
        coveragePct: dimensions.coveragePct,
        dimensionScores: dimensions.dimensionScores,
        backgroundChecks,
        forwardPrediction,
        decision,
        confidence,
        exclude: Boolean(row?.exclude)
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score)
    .map((row, index) => ({ ...row, rank: index + 1 }));
  const missingTickers = expectedTickers.filter((ticker) => !rankings.some((row) => row.ticker === ticker));
  const structuralFailure = !value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some((key) => key !== "rankings") || !Array.isArray(value?.rankings) || malformedRowCount || duplicateTickers.length || unexpectedTickers.length || invalidTickers.length;
  const status = structuralFailure || !rankings.length
    ? "FAILED"
    : missingTickers.length
      ? "PARTIAL"
      : "COMPLETE";
  return {
    status,
    rankings,
    integrity: {
      status,
      expectedCount: expectedTickers.length,
      receivedCount: rawRankings.length,
      validCount: rankings.length,
      missingTickers,
      duplicateTickers,
      unexpectedTickers,
      invalidTickers,
      malformedRowCount
    }
  };
}

function reviewIsComplete(review, expectedCount = null) {
  if (!review || review.status !== "COMPLETE" || review.integrity?.status !== "COMPLETE") return false;
  if (!Array.isArray(review.rankings) || review.rankings.length !== review.integrity.expectedCount) return false;
  return expectedCount === null || review.rankings.length === expectedCount;
}

function modelOutputTokenLimit(candidateCount) {
  // A 30-name PDC batch must emit nine dimension scores, risk checks, and a
  // five-day forecast for every name. The old 8.6k floor together with maximum
  // reasoning could leave OpenAI with no final structured output at all.
  // 16k is the existing cross-provider ceiling, not a fabricated response.
  return 16_000;
}

function openAiPdcOutputTokenLimit(candidateCount) {
  // GPT completed batch one at 16k but batch two still failed the 30-record
  // completeness gate. Its Responses API is the failing path, so only this
  // provider receives the requested 32k ceiling; other providers retain their
  // known 16k contract.
  return 32_000;
}

function mergeCompletedReviewBatch(previousReview, completedBatch, candidates) {
  const expectedTickers = candidates.map((candidate) => candidate.ticker);
  const allowed = new Set(expectedTickers);
  const previousRankings = Array.isArray(previousReview?.rankings)
    ? previousReview.rankings.filter((row) => allowed.has(row?.ticker))
    : [];
  const byTicker = new Map(previousRankings.map((row) => [row.ticker, row]));
  completedBatch.rankings.forEach((row) => byTicker.set(row.ticker, row));
  const rankings = [...byTicker.values()]
    .sort((left, right) => right.score - left.score)
    .map((row, index) => ({ ...row, rank: index + 1 }));
  const missingTickers = expectedTickers.filter((ticker) => !byTicker.has(ticker));
  const completedBatches = Math.ceil(rankings.length / PDC_REVIEW_BATCH_SIZE);
  const totalBatches = Math.ceil(expectedTickers.length / PDC_REVIEW_BATCH_SIZE);
  const complete = !missingTickers.length;
  return {
    status: complete ? "COMPLETE" : "IN_PROGRESS",
    rankings,
    batch: { completed: completedBatches, total: totalBatches, size: PDC_REVIEW_BATCH_SIZE },
    integrity: {
      status: complete ? "COMPLETE" : "IN_PROGRESS",
      expectedCount: expectedTickers.length,
      receivedCount: rankings.length,
      validCount: rankings.length,
      missingTickers,
      duplicateTickers: [],
      unexpectedTickers: [],
      invalidTickers: [],
      malformedRowCount: 0
    }
  };
}

async function openAiReview(env, modelProfile, role, candidates, phase) {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY.");
  const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: modelProfile.model,
        instructions: reviewInstructions(role, phase),
        input: `Candidate packet:\n${JSON.stringify(serializableCandidates(candidates))}`,
        text: { format: reviewSchema(`stock_pdc_${phase}_${role.id}`, candidates.length) },
        max_output_tokens: openAiPdcOutputTokenLimit(candidates.length),
        // This is analysis, but an all-out reasoning mode can consume the
        // entire shared output budget before the required JSON is emitted.
        // Medium preserves model reasoning while reserving the fixed evidence
        // records that the integrity gate requires.
        reasoning: { effort: "medium" }
      })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || "OpenAI review request failed.");
  const outputText = extractOutputText(data);
  if (!outputText) {
    const detail = cleanText(data.incomplete_details?.reason || data.status || "empty response", 120);
    throw new Error(`OpenAI review returned no structured output (${detail}).`);
  }
  return normalizeReview(parseModelJson(outputText), candidates);
}

async function claudeReview(env, modelProfile, role, candidates, phase) {
  const apiKey = claudeApiKey(env);
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY or CLAUDE_API_KEY.");
  const response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: modelProfile.model,
        max_tokens: modelOutputTokenLimit(candidates.length),
        system: reviewInstructions(role, phase),
        messages: [{
          role: "user",
          content: `Candidate packet:\n${JSON.stringify(serializableCandidates(candidates))}`
        }],
        output_config: {
          ...(modelProfile.tier === "mini-demo" ? {} : { effort: "max" }),
          format: {
            type: "json_schema",
            schema: portableReviewSchema(candidates.length)
          }
        }
      })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || "Claude review request failed.");
  const outputText = data.content?.find((item) => item.type === "text" && typeof item.text === "string")?.text || "";
  if (!outputText) throw new Error("Claude review returned no structured output.");
  return normalizeReview(JSON.parse(outputText), candidates);
}

function geminiApiKey(env) {
  return String(env.GEMINI_API_KEY || env.GOOGLE_GEMINI_API_KEY || env.GEMINI_API_PDC || env.GEMINI_PDC_API_KEY || env.GEMINI_API_KEY_PDC || env.gemini_api_pdc || env["gemini api key pdc"] || env["Gemini API Key pdc"] || "").trim();
}

function geminiStockModel(env) {
  return String(env.GEMINI_STOCK_MODEL || env.GOOGLE_GEMINI_STOCK_MODEL || DEFAULT_GEMINI_STOCK_MODEL).trim();
}

function geminiDemoStockModel(env) {
  return String(env.GEMINI_DEMO_STOCK_MODEL || env.GOOGLE_GEMINI_DEMO_STOCK_MODEL || DEFAULT_GEMINI_DEMO_STOCK_MODEL).trim();
}

function geminiFinalText(data) {
  // Gemini may put a short non-thought preamble and the structured response in
  // separate parts. Keep every final text part; parseModelJson still requires a
  // real JSON object and never treats prose alone as a successful response.
  return data?.candidates?.flatMap((candidate) => candidate.content?.parts || [])
    ?.filter((part) => part?.thought !== true)
    .map((part) => part?.text)
    .filter((text) => typeof text === "string" && text.trim())
    .join("\n") || "";
}

function deepseekApiKey(env) {
  return String(env.DEEPSEEK_API_KEY || env.DEEPSEEK_PDC_API_KEY || env.DEEPSEEK_API_PDC || env.DEEPSEEK_API_KEY_PDC || env.DEEPSEEK_PDC || env.deepseek_api_pdc || env["deepseek api pdc"] || "").trim();
}

function deepseekStockModel(env) {
  return String(env.DEEPSEEK_STOCK_MODEL || DEFAULT_DEEPSEEK_STOCK_MODEL).trim();
}

function deepseekDemoStockModel(env) {
  return String(env.DEEPSEEK_DEMO_STOCK_MODEL || DEFAULT_DEEPSEEK_DEMO_STOCK_MODEL).trim();
}

function kimiApiKey(env) {
  return String(env.KIMI_API_KEY || env.MOONSHOT_API_KEY || env.KIMI_PDC_API_KEY || env.KIMI_API_PDC || env.KIMI_API_KEY_PDC || env.KIMI_PDC || env.kimi_pdc || env["kimi pdc"] || "").trim();
}

function kimiStockModel(env) {
  return String(env.KIMI_STOCK_MODEL || env.MOONSHOT_STOCK_MODEL || DEFAULT_KIMI_STOCK_MODEL).trim();
}

function kimiDemoStockModel(env) {
  return String(env.KIMI_DEMO_STOCK_MODEL || env.MOONSHOT_DEMO_STOCK_MODEL || DEFAULT_KIMI_DEMO_STOCK_MODEL).trim();
}

function kimiChatUrl(env) {
  const baseUrl = String(env.KIMI_API_BASE_URL || env.MOONSHOT_API_BASE_URL || "").trim().replace(/\/+$/, "");
  return baseUrl ? `${baseUrl}/chat/completions` : KIMI_CHAT_URL;
}

async function geminiReview(env, modelProfile, role, candidates, phase) {
  const apiKey = geminiApiKey(env);
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY or GOOGLE_GEMINI_API_KEY.");
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelProfile.model)}:generateContent`, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: reviewInstructions(role, phase) }] },
        contents: [{
          role: "user",
          parts: [{ text: `Candidate packet:\n${JSON.stringify(serializableCandidates(candidates))}` }]
        }],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: portableReviewSchema(candidates.length),
          maxOutputTokens: modelOutputTokenLimit(candidates.length)
        }
      })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || "Gemini review request failed.");
  const outputText = geminiFinalText(data);
  if (!outputText) throw new Error("Gemini review returned no structured output.");
  return normalizeReview(parseModelJson(outputText), candidates);
}

async function deepseekReview(env, modelProfile, role, candidates, phase) {
  const apiKey = deepseekApiKey(env);
  if (!apiKey) throw new Error("Missing DEEPSEEK_API_KEY or DEEPSEEK_PDC_API_KEY.");
  const response = await fetch(DEEPSEEK_CHAT_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: modelProfile.model,
        thinking: modelProfile.tier === "mini-demo" ? { type: "disabled" } : { type: "enabled" },
        ...(modelProfile.tier === "mini-demo" ? {} : { reasoning_effort: "max" }),
        messages: [
          { role: "system", content: `${reviewInstructions(role, phase)} Return only one valid JSON object with rankings.` },
          { role: "user", content: `Candidate packet:\n${JSON.stringify(serializableCandidates(candidates))}` }
        ],
        response_format: { type: "json_object" },
        max_tokens: modelOutputTokenLimit(candidates.length)
      })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || "DeepSeek review request failed.");
  const outputText = chatCompletionText(data);
  if (!outputText) throw new Error("DeepSeek review returned no structured output.");
  return normalizeReview(parseModelJson(outputText), candidates);
}

async function kimiReview(env, modelProfile, role, candidates, phase) {
  const apiKey = kimiApiKey(env);
  if (!apiKey) throw new Error("Missing KIMI_API_KEY, MOONSHOT_API_KEY, or KIMI_PDC_API_KEY.");
  const response = await fetch(kimiChatUrl(env), {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: modelProfile.model,
        ...(modelProfile.tier === "mini-demo" ? { thinking: { type: "disabled" } } : { reasoning_effort: "max" }),
        messages: [
          { role: "system", content: `${reviewInstructions(role, phase)} Return only one valid JSON object with rankings.` },
          { role: "user", content: `Candidate packet:\n${JSON.stringify(serializableCandidates(candidates))}` }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: modelOutputTokenLimit(candidates.length)
      })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(response.status === 401 ? "Kimi authentication was rejected. Check the Cloudflare secret ‘kimi pdc’ is a Kimi Open Platform API Key." : data.error?.message || "Kimi review request failed.");
  const outputText = chatCompletionText(data);
  if (!outputText) throw new Error("Kimi review returned no structured output.");
  return normalizeReview(parseModelJson(outputText), candidates);
}

async function modelReview(env, modelProfile, role, candidates, phase) {
  if (modelProfile.provider === "OpenAI") return openAiReview(env, modelProfile, role, candidates, phase);
  if (modelProfile.provider === "Anthropic") return claudeReview(env, modelProfile, role, candidates, phase);
  if (modelProfile.provider === "Google") return geminiReview(env, modelProfile, role, candidates, phase);
  if (modelProfile.provider === "DeepSeek") return deepseekReview(env, modelProfile, role, candidates, phase);
  if (modelProfile.provider === "Moonshot") return kimiReview(env, modelProfile, role, candidates, phase);
  throw new Error("Selected model provider is not supported.");
}

const SMOKE_TEST_PROMPT = "今天股票市场如何？这是连通性测试：你没有实时行情时，请用不超过两句话说明盘前最应检查的市场风险，并明确说明是否缺少实时数据。";

async function smokeChat(env, modelProfile) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SMOKE_TEST_TIMEOUT_MS);
  try {
    if (modelProfile.provider === "OpenAI") {
      const response = await fetch(OPENAI_RESPONSES_URL, { method: "POST", headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" }, signal: controller.signal, body: JSON.stringify({ model: modelProfile.model, instructions: "You are a concise Stock PDC connectivity test assistant. Do not make a trading decision.", input: SMOKE_TEST_PROMPT, max_output_tokens: 120, reasoning: { effort: "none" } }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error?.message || "OpenAI test request failed.");
      return cleanText(extractOutputText(data), 360);
    }
    if (modelProfile.provider === "Anthropic") {
      const response = await fetch(ANTHROPIC_MESSAGES_URL, { method: "POST", headers: { "x-api-key": claudeApiKey(env), "anthropic-version": "2023-06-01", "content-type": "application/json" }, signal: controller.signal, body: JSON.stringify({ model: modelProfile.model, max_tokens: 120, system: "You are a concise Stock PDC connectivity test assistant. Do not make a trading decision.", messages: [{ role: "user", content: SMOKE_TEST_PROMPT }] }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error?.message || "Claude test request failed.");
      return cleanText(data.content?.find((item) => item.type === "text")?.text, 360);
    }
    if (modelProfile.provider === "Google") {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelProfile.model)}:generateContent`, { method: "POST", headers: { "x-goog-api-key": geminiApiKey(env), "content-type": "application/json" }, signal: controller.signal, body: JSON.stringify({ systemInstruction: { parts: [{ text: "You are a concise Stock PDC connectivity test assistant. Do not make a trading decision." }] }, contents: [{ role: "user", parts: [{ text: SMOKE_TEST_PROMPT }] }], generationConfig: { maxOutputTokens: 256, thinkingConfig: { thinkingLevel: "low" } } }) });
        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          const reply = cleanText(geminiFinalText(data), 360);
          if (reply) return reply;
          const reason = cleanText(data.candidates?.[0]?.finishReason || data.promptFeedback?.blockReason || "Gemini returned no final text.", 160);
          if (attempt === 2) throw new Error(reason);
          await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
          continue;
        }
        const message = cleanText(data.error?.message || "Gemini test request failed.", 240);
        const transient = response.status === 429 || response.status >= 500 || /high demand|temporar/i.test(message);
        if (!transient || attempt === 2) throw new Error(message);
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
    const isKimi = modelProfile.provider === "Moonshot";
    const response = await fetch(isKimi ? kimiChatUrl(env) : DEEPSEEK_CHAT_URL, { method: "POST", headers: { authorization: `Bearer ${isKimi ? kimiApiKey(env) : deepseekApiKey(env)}`, "content-type": "application/json" }, signal: controller.signal, body: JSON.stringify({ model: modelProfile.model, thinking: { type: "disabled" }, messages: [{ role: "system", content: "You are a concise Stock PDC connectivity test assistant. Do not make a trading decision." }, { role: "user", content: SMOKE_TEST_PROMPT }], ...(isKimi ? { max_completion_tokens: 120 } : { max_tokens: 120 }) }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.message || `${modelProfile.provider} test request failed.`);
    return cleanText(chatCompletionText(data), 360);
  } finally {
    clearTimeout(timeout);
  }
}

function verificationSchema(name = "stock_pdc_model_verification") {
  return {
    type: "json_schema",
    name,
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        status: { type: "string", enum: ["ok"] }
      },
      required: ["status"]
    }
  };
}

function portableVerificationSchema() {
  return verificationSchema().schema;
}

function verificationInstructions() {
  return "This is a Stock PDC readiness check. Return only the required JSON object with status set to ok.";
}

function verifyStructuredOutput(outputText, provider) {
  let value;
  try {
    value = parseModelJson(outputText);
  } catch {
    const preview = cleanText(outputText, 160);
    throw new Error(`${provider} verification did not return valid JSON${preview ? ` (response: ${preview})` : " (empty response)"}.`);
  }
  if (value?.status !== "ok") throw new Error(`${provider} verification returned an unexpected result.`);
  return value;
}

function chatCompletionText(data) {
  const message = data?.choices?.[0]?.message || {};
  if (typeof message.content === "string") return message.content;
  if (Array.isArray(message.content)) return message.content.map((part) => typeof part?.text === "string" ? part.text : "").join("");
  return typeof message.reasoning_content === "string" ? message.reasoning_content : "";
}

function parseModelJson(outputText) {
  const raw = String(outputText || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try { return JSON.parse(raw); } catch { /* Some OpenAI-compatible APIs add a short prose prefix despite JSON mode. */ }
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("No JSON object found.");
  return JSON.parse(raw.slice(start, end + 1));
}

async function verifyOpenAiModel(env, profile) {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY.");
  const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: profile.model,
        instructions: verificationInstructions(),
        input: "Verify readiness now.",
        text: { format: verificationSchema() },
        max_output_tokens: 64,
        reasoning: { effort: "none" }
      })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || "OpenAI verification request failed.");
  return verifyStructuredOutput(extractOutputText(data), "OpenAI");
}

async function verifyClaudeModel(env, profile) {
  const apiKey = claudeApiKey(env);
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY or CLAUDE_API_KEY.");
  const response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: profile.model,
        max_tokens: 64,
        system: verificationInstructions(),
        messages: [{ role: "user", content: "Verify readiness now." }],
        output_config: { format: { type: "json_schema", schema: portableVerificationSchema() } }
      })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || "Claude verification request failed.");
  const outputText = data.content?.find((item) => item.type === "text" && typeof item.text === "string")?.text || "";
  return verifyStructuredOutput(outputText, "Claude");
}

async function verifyGeminiModel(env, profile) {
  const apiKey = geminiApiKey(env);
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY or GOOGLE_GEMINI_API_KEY.");
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(profile.model)}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: verificationInstructions() }] },
        contents: [{ role: "user", parts: [{ text: "Verify readiness now." }] }],
        // Gemini 3.1 Pro can consume a 64-token budget in hidden reasoning and
        // emit no final JSON. Keep reasoning shallow for this non-analytical
        // readiness probe and reserve enough output for the required object.
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: portableVerificationSchema(),
          maxOutputTokens: 256,
          thinkingConfig: { thinkingLevel: "low" }
        }
      })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || "Gemini verification request failed.");
  const outputText = geminiFinalText(data);
  return verifyStructuredOutput(outputText, "Gemini");
}

async function verifyDeepSeekModel(env, profile) {
  const apiKey = deepseekApiKey(env);
  if (!apiKey) throw new Error("Missing DEEPSEEK_API_KEY or DEEPSEEK_PDC_API_KEY.");
  const response = await fetch(DEEPSEEK_CHAT_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: profile.model,
        thinking: { type: "disabled" },
        messages: [
          { role: "system", content: verificationInstructions() },
          { role: "user", content: "Verify readiness now." }
        ],
        response_format: { type: "json_object" },
        max_tokens: 64
      })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || "DeepSeek verification request failed.");
  return verifyStructuredOutput(chatCompletionText(data), "DeepSeek");
}

async function verifyKimiModel(env, profile) {
  const apiKey = kimiApiKey(env);
  if (!apiKey) throw new Error("Missing KIMI_API_KEY, MOONSHOT_API_KEY, or KIMI_PDC_API_KEY.");
  const response = await fetch(kimiChatUrl(env), {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: profile.model,
        thinking: { type: "disabled" },
        messages: [
          { role: "system", content: verificationInstructions() },
          { role: "user", content: "Verify readiness now." }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 64
      })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(response.status === 401 ? "Kimi authentication was rejected. Check the Cloudflare secret ‘kimi pdc’ is a Kimi Open Platform API Key." : data.error?.message || "Kimi verification request failed.");
  return verifyStructuredOutput(chatCompletionText(data), "Kimi");
}

async function verifyModel(env, profile) {
  if (profile.provider === "OpenAI") return verifyOpenAiModel(env, profile);
  if (profile.provider === "Anthropic") return verifyClaudeModel(env, profile);
  if (profile.provider === "Google") return verifyGeminiModel(env, profile);
  if (profile.provider === "DeepSeek") return verifyDeepSeekModel(env, profile);
  if (profile.provider === "Moonshot") return verifyKimiModel(env, profile);
  throw new Error("Selected model provider is not supported.");
}

function consensusFromReviews(reviews, candidates) {
  const rows = new Map(candidates.map((candidate) => [candidate.ticker, {
    ticker: candidate.ticker,
    name: candidate.name,
    sourceRank: candidate.rank,
    sourceScore: candidate.score,
    support: 0,
    excludedBy: 0,
    scoreTotal: 0,
    scoreCount: 0,
    coverageTotal: 0,
    dimensionValues: Object.fromEntries(PDC_DIMENSIONS.map((dimension) => [dimension.id, []])),
    predictionValues: {
      prob5dUpGt2Pct: [],
      expected5dReturnPct: [],
      prob5dDownLtMinus3Pct: [],
      forwardUpsideScore: []
    },
    backgroundCheckVotes: Object.fromEntries(BACKGROUND_CHECKS.map((id) => [id, 0])),
    buyVotes: 0
  }]));
  Object.entries(reviews).forEach(([roleId, review]) => {
    review.rankings.forEach((ranking) => {
      const row = rows.get(ranking.ticker);
      if (!row) return;
      row.support += 1;
      row.excludedBy += ranking.exclude ? 1 : 0;
      row.scoreTotal += ranking.score;
      row.scoreCount += 1;
      row.coverageTotal += ranking.coveragePct || 0;
      if (ranking.decision === "BUY") row.buyVotes += 1;
      PDC_DIMENSIONS.forEach((dimension) => {
        const score = ranking.dimensionScores?.[dimension.id];
        if (score?.available && score.score !== null) row.dimensionValues[dimension.id].push(score.score);
      });
      Object.entries(ranking.forwardPrediction || {}).forEach(([key, value]) => {
        if (Array.isArray(row.predictionValues[key]) && Number.isFinite(value)) row.predictionValues[key].push(value);
      });
      BACKGROUND_CHECKS.forEach((id) => {
        if (ranking.backgroundChecks?.[id]) row.backgroundCheckVotes[id] += 1;
      });
    });
  });
  return [...rows.values()]
    .map((row) => ({
      ...row,
      consensusScore: row.scoreCount ? Number((row.scoreTotal / row.scoreCount).toFixed(2)) : 0,
      averageCoveragePct: row.scoreCount ? Number((row.coverageTotal / row.scoreCount).toFixed(2)) : 0,
      dimensionConsensus: Object.fromEntries(PDC_DIMENSIONS.map((dimension) => {
        const values = row.dimensionValues[dimension.id].sort((left, right) => left - right);
        const count = values.length;
        const mean = count ? Number((values.reduce((total, score) => total + score, 0) / count).toFixed(2)) : null;
        const median = !count ? null : Number((count % 2 ? values[(count - 1) / 2] : (values[count / 2 - 1] + values[count / 2]) / 2).toFixed(2));
        return [dimension.id, {
          count,
          mean,
          median,
          min: count ? values[0] : null,
          max: count ? values.at(-1) : null,
          range: count ? Number((values.at(-1) - values[0]).toFixed(2)) : null
        }];
      })),
      forwardPredictionConsensus: Object.fromEntries(Object.entries(row.predictionValues).map(([key, values]) => [key,
        values.length ? Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(2)) : null
      ])),
      backgroundChecks: Object.fromEntries(BACKGROUND_CHECKS.map((id) => [id, row.backgroundCheckVotes[id] > 0]))
    }))
    .sort((left, right) => right.consensusScore - left.consensusScore || right.support - left.support || left.sourceRank - right.sourceRank);
}

function decisionResult(run) {
  const committee = isCommitteeRun(run);
  const reviews = committee
    ? Object.keys(committeeReviewMap(run, "round-two")).length
      ? committeeReviewMap(run, "round-two")
      : committeeReviewMap(run, "round-one")
    : run.roundTwo || run.roundOne || {};
  const candidates = run.pool?.length ? run.pool : run.snapshot.candidates;
  const requiredSupport = committee ? Math.max(1, Math.ceil(committeeMembers(run).length / 2)) : 2;
  const consensus = consensusFromReviews(reviews, candidates);
  return consensus
    .filter((row) => row.support >= requiredSupport && row.excludedBy < requiredSupport)
    .filter((row) => row.buyVotes >= requiredSupport)
    .filter((row) => !row.backgroundChecks.financialDistressFlag && !row.backgroundChecks.stDelistingRisk)
    .slice(0, 10)
    .map((row, index) => ({
      rank: index + 1,
      ticker: row.ticker,
      name: row.name,
      consensusScore: row.consensusScore,
      averageCoveragePct: row.averageCoveragePct,
      dimensionConsensus: row.dimensionConsensus,
      forwardPrediction: row.forwardPredictionConsensus,
      backgroundChecks: row.backgroundChecks,
      support: row.support,
      requiredSupport,
      buyVotes: row.buyVotes,
      sourceRank: row.sourceRank,
      forwardOutcome: pendingForwardOutcome(run.date),
      action: "RESEARCH_REVIEW"
    }));
}

function reviewStageKey(stage) {
  return stage === "round-one" ? "roundOne" : stage === "round-two" ? "roundTwo" : "";
}

function reviewStageComplete(run, stage) {
  const reviewKey = reviewStageKey(stage);
  const expectedCount = stage === "round-one" ? run?.snapshot?.candidates?.length : run?.pool?.length;
  return Boolean(reviewKey && REVIEW_ROLES.every((role) => reviewIsComplete(run[reviewKey]?.[role.id], expectedCount)));
}

function isCommitteeRun(run) {
  return Boolean(run?.committee && typeof run.committee === "object" && !Array.isArray(run.committee));
}

function committeeMembers(run) {
  return Object.values(run?.committee || {}).filter((member) => member?.profile?.id && member?.profile?.provider);
}

function committeeReviewMap(run, stage) {
  const reviewKey = reviewStageKey(stage);
  return Object.fromEntries(committeeMembers(run)
    .map((member) => [member.profile.id, member[reviewKey]])
    .filter(([, review]) => review && Array.isArray(review.rankings)));
}

function committeeStageComplete(run, stage) {
  const reviewKey = reviewStageKey(stage);
  const members = committeeMembers(run);
  const expectedCount = stage === "round-one" ? run?.snapshot?.candidates?.length : run?.pool?.length;
  return Boolean(reviewKey && members.length && members.every((member) => reviewIsComplete(member[reviewKey], expectedCount)));
}

function publicReview(review) {
  if (!review?.rankings?.length) return null;
  return {
    status: cleanText(review.status, 16),
    integrity: review.integrity && typeof review.integrity === "object" ? {
      status: cleanText(review.integrity.status, 16),
      expectedCount: finiteNumber(review.integrity.expectedCount, null),
      receivedCount: finiteNumber(review.integrity.receivedCount, null),
      validCount: finiteNumber(review.integrity.validCount, null),
      missingTickers: Array.isArray(review.integrity.missingTickers) ? review.integrity.missingTickers.map((ticker) => cleanText(ticker, 24)).filter(Boolean) : [],
      duplicateTickers: Array.isArray(review.integrity.duplicateTickers) ? review.integrity.duplicateTickers.map((ticker) => cleanText(ticker, 24)).filter(Boolean) : [],
      unexpectedTickers: Array.isArray(review.integrity.unexpectedTickers) ? review.integrity.unexpectedTickers.map((ticker) => cleanText(ticker, 24)).filter(Boolean) : [],
      invalidTickers: Array.isArray(review.integrity.invalidTickers) ? review.integrity.invalidTickers.map((ticker) => cleanText(ticker, 24)).filter(Boolean) : [],
      malformedRowCount: finiteNumber(review.integrity.malformedRowCount, 0)
    } : null,
    batch: review.batch && typeof review.batch === "object" ? {
      completed: finiteNumber(review.batch.completed, 0),
      total: finiteNumber(review.batch.total, 0),
      size: finiteNumber(review.batch.size, PDC_REVIEW_BATCH_SIZE)
    } : null,
    rankings: review.rankings.slice(0, 30).map((row) => ({
      rank: row.rank,
      ticker: row.ticker,
      name: row.name,
      score: row.score,
      coveragePct: row.coveragePct,
      dimensionScores: row.dimensionScores,
      backgroundChecks: row.backgroundChecks,
      forwardPrediction: row.forwardPrediction,
      forwardOutcome: row.forwardOutcome || null,
      decision: row.decision,
      confidence: row.confidence,
      exclude: row.exclude
    }))
  };
}

function publicModelVerification(verification) {
  if (!verification || typeof verification !== "object" || !Array.isArray(verification.members)) return null;
  return {
    createdAt: cleanText(verification.createdAt, 40),
    members: verification.members.map((member) => ({
      id: cleanText(member?.id, 64),
      label: cleanText(member?.label, 100),
      provider: cleanText(member?.provider, 40),
      model: cleanText(member?.model, 100),
      ok: Boolean(member?.ok),
      checkedAt: cleanText(member?.checkedAt, 40),
      latencyMs: Math.max(0, finiteNumber(member?.latencyMs, 0)),
      response: cleanText(member?.response, 160),
      error: cleanText(member?.error, 240)
    }))
  };
}

function publicStageAudit(stage) {
  if (!stage || typeof stage !== "object") return null;
  const attempts = Array.isArray(stage.attempts) ? stage.attempts : [];
  return {
    status: cleanText(stage.status, 32),
    startedAt: cleanText(stage.startedAt, 40),
    completedAt: cleanText(stage.completedAt, 40),
    input: stage.input && typeof stage.input === "object" ? stage.input : {},
    output: stage.output && typeof stage.output === "object" ? stage.output : {},
    error: cleanText(stage.error, 320),
    attempts: attempts.slice(-8).map((attempt) => ({
      status: cleanText(attempt?.status, 32),
      startedAt: cleanText(attempt?.startedAt, 40),
      completedAt: cleanText(attempt?.completedAt, 40),
      output: attempt?.output && typeof attempt.output === "object" ? attempt.output : {},
      error: cleanText(attempt?.error, 320)
    }))
  };
}

function publicRun(run) {
  const committee = isCommitteeRun(run);
  const modelProfile = !committee && (run.modelProfile || {
    id: "gpt-5.6-sol",
    label: "GPT-5.6 Sol · Pro PDC",
    provider: "OpenAI",
    model: run.model || DEFAULT_STOCK_MODEL
  });
  return {
    id: run.id,
    mode: run.mode || OFFICIAL_DECISION_MODE,
    date: run.date,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    model: committee ? "MULTI_MODEL_PDC" : modelProfile.model,
    scoringSystem: run.scoringSystem || "legacy-nine-dimension-pdc",
    modelVerification: publicModelVerification(run.modelVerification),
    modelProfile: modelProfile ? publicModelProfile(modelProfile) : null,
    status: run.status,
    execution: run.execution && typeof run.execution === "object" ? {
      kind: cleanText(run.execution.kind, 64),
      memberStageStorage: cleanText(run.execution.memberStageStorage, 64),
      status: cleanText(run.execution.status, 40),
      workflowId: cleanText(run.execution.workflowId, 120),
      queuedAt: cleanText(run.execution.queuedAt, 40),
      startedAt: cleanText(run.execution.startedAt, 40),
      completedAt: cleanText(run.execution.completedAt, 40),
      error: cleanText(run.execution.error, 320)
    } : null,
    snapshot: {
      date: run.snapshot.date,
      source: run.snapshot.source,
      candidateCount: run.snapshot.candidates.length,
      provenance: run.snapshot.provenance || null,
      facts: serializableCandidates(run.snapshot.candidates)
    },
    committeeMode: committee,
    members: committee ? committeeMembers(run).map((member) => ({
      ...publicModelProfile(member.profile),
      state: reviewIsComplete(member.roundTwo, run.pool?.length)
        ? "round_two_complete"
        : member.roundTwo?.status === "PARTIAL"
          ? "round_two_partial"
          : member.roundTwo?.status === "FAILED"
            ? "round_two_failed"
            : reviewIsComplete(member.roundOne, run.snapshot?.candidates?.length)
              ? "round_one_complete"
              : member.roundOne?.status === "PARTIAL"
                ? "round_one_partial"
                : member.roundOne?.status === "FAILED"
                  ? "round_one_failed"
                  : "idle",
      roundOne: publicReview(member.roundOne),
      roundTwo: publicReview(member.roundTwo),
      audit: {
        roundOne: publicStageAudit(member.audit?.roundOne),
        roundTwo: publicStageAudit(member.audit?.roundTwo)
      }
    })) : [],
    roles: committee ? [] : REVIEW_ROLES.map(({ id, name }) => ({ id, name, state: run.roundOne?.[id] ? "complete" : "idle" })),
    roundOneComplete: committee ? committeeStageComplete(run, "round-one") : reviewStageComplete(run, "round-one"),
    roundTwoComplete: committee ? committeeStageComplete(run, "round-two") : reviewStageComplete(run, "round-two"),
    pool: run.pool || [],
    secretary: run.secretary || null,
    audit: {
      verification: publicStageAudit(run.audit?.verification),
      snapshot: publicStageAudit(run.audit?.snapshot),
      merge: publicStageAudit(run.audit?.merge),
      secretary: publicStageAudit(run.audit?.secretary),
      riskCheck: publicStageAudit(run.audit?.riskCheck)
    },
    final: run.final || [],
    publishedAt: run.publishedAt || ""
  };
}

async function readJson(request) {
  const length = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(length) && length > MAX_DECISION_BODY_BYTES) throw new Error("Decision request is too large.");
  const body = await request.text();
  if (body.length > MAX_DECISION_BODY_BYTES) throw new Error("Decision request is too large.");
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    throw new Error("Decision request must be valid JSON.");
  }
}

async function saveRun(store, run) {
  run.updatedAt = new Date().toISOString();
  await store.put(decisionRunKey(run.id, run.mode), JSON.stringify(run), { expirationTtl: RUN_TTL_SECONDS });
  return run;
}

async function loadRun(store, runId, mode = OFFICIAL_DECISION_MODE) {
  const run = await store.get(decisionRunKey(cleanText(runId, 80), mode), "json");
  return run && typeof run === "object" ? run : null;
}

function usesMemberStageStorage(run) {
  return run?.execution?.memberStageStorage === PDC_MEMBER_STAGE_STORAGE;
}

function stageCandidates(run, stage) {
  if (stage === "round-one") return Array.isArray(run?.snapshot?.candidates) ? run.snapshot.candidates : [];
  if (stage !== "round-two" || !Array.isArray(run?.pool)) return [];
  const byTicker = new Map((run.snapshot?.candidates || []).map((candidate) => [candidate.ticker, candidate]));
  return run.pool.map((row) => byTicker.get(row?.ticker)).filter(Boolean);
}

function memberStageAudit(previous, entry) {
  const attempts = Array.isArray(previous?.attempts) ? previous.attempts : [];
  return {
    ...entry,
    attempts: [...attempts, {
      status: entry.status,
      startedAt: entry.startedAt,
      completedAt: entry.completedAt,
      output: entry.output,
      error: entry.error
    }].slice(-32)
  };
}

function newMemberStageRecord(run, member, stage, candidates) {
  const now = new Date().toISOString();
  return {
    storage: PDC_MEMBER_STAGE_STORAGE,
    runId: run.id,
    mode: run.mode,
    stage,
    memberId: member.profile.id,
    profile: publicModelProfile(member.profile),
    status: "IDLE",
    createdAt: now,
    updatedAt: now,
    input: {
      snapshotId: cleanText(run.snapshot?.provenance?.snapshotId, 160),
      candidateCount: candidates.length,
      candidateTickers: candidates.map((candidate) => candidate.ticker)
    },
    review: null,
    audit: null
  };
}

async function loadMemberStageRecord(store, run, member, stage, candidates) {
  const key = decisionMemberStageKey(run.id, stage, member.profile.id, run.mode);
  const record = await store.get(key, "json");
  if (record && typeof record === "object" && record.storage === PDC_MEMBER_STAGE_STORAGE) return { key, record };
  return { key, record: newMemberStageRecord(run, member, stage, candidates) };
}

async function saveMemberStageRecord(store, key, record) {
  record.updatedAt = new Date().toISOString();
  await store.put(key, JSON.stringify(record), { expirationTtl: RUN_TTL_SECONDS });
  return record;
}

async function hydrateMemberStageReviews(store, run) {
  if (!usesMemberStageStorage(run) || !isCommitteeRun(run)) return run;
  const stages = ["round-one", "round-two"];
  await Promise.all(stages.flatMap((stage) => {
    const reviewKey = reviewStageKey(stage);
    const candidates = stageCandidates(run, stage);
    // Round two has no input until the consensus pool exists.
    if (!candidates.length) return [];
    return committeeMembers(run).map(async (member) => {
      const key = decisionMemberStageKey(run.id, stage, member.profile.id, run.mode);
      const record = await store.get(key, "json");
      if (!record || typeof record !== "object" || record.storage !== PDC_MEMBER_STAGE_STORAGE) return;
      if (record.review && typeof record.review === "object") member[reviewKey] = record.review;
      if (record.audit && typeof record.audit === "object") {
        member.audit ||= {};
        member.audit[reviewKey] = record.audit;
      }
    });
  }));
  return run;
}

async function loadHydratedRun(store, runId, mode = OFFICIAL_DECISION_MODE) {
  const run = await loadRun(store, runId, mode);
  return run ? hydrateMemberStageReviews(store, run) : null;
}

function verificationResult(profile, startedAt, caught = null, response = null) {
  return {
    id: profile.id,
    label: profile.label,
    provider: profile.provider,
    model: profile.model,
    ok: !caught,
    checkedAt: new Date().toISOString(),
    latencyMs: Date.now() - startedAt,
    response: response && typeof response === "object" ? JSON.stringify(response).slice(0, 160) : "",
    error: caught ? cleanText(caught?.message || "Model verification failed.", 240) : ""
  };
}

function requestedModelProfiles(body, env, mode = OFFICIAL_DECISION_MODE) {
  const availableProfiles = configuredModelProfiles(env, mode, backgroundWorkflowAvailable(env));
  const requestedIds = Array.isArray(body.modelProfileIds)
    ? body.modelProfileIds.map((id) => cleanText(id, 64)).filter(Boolean)
    : body.modelProfileId ? [cleanText(body.modelProfileId, 64)] : availableProfiles.map((profile) => profile.id);
  return {
    requestedIds: [...new Set(requestedIds)],
    modelProfiles: availableProfiles.filter((profile) => requestedIds.includes(profile.id))
  };
}

async function createModelVerification(request, env, mode = OFFICIAL_DECISION_MODE) {
  const store = decisionStore(env);
  if (!store) return error("Missing STOCK_PDC_KV or AUTH_KV binding.", 500);
  const body = await readJson(request);
  const { requestedIds, modelProfiles } = requestedModelProfiles(body, env, mode);
  if (!modelProfiles.length || modelProfiles.length !== requestedIds.length) return error("Every selected PDC model must be configured before verification.");
  const verificationProfiles = modelProfiles;
  const results = await Promise.all(verificationProfiles.map(async (profile) => {
    const startedAt = Date.now();
    try {
      const response = await verifyModel(env, profile);
      return verificationResult(profile, startedAt, null, response);
    } catch (caught) {
      return verificationResult(profile, startedAt, caught);
    }
  }));
  const verification = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    modelProfileIds: verificationProfiles.map((profile) => profile.id),
    members: results
  };
  await store.put(decisionVerificationKey(verification.id, mode), JSON.stringify(verification), { expirationTtl: MODEL_VERIFICATION_TTL_SECONDS });
  return json({ ok: results.every((result) => result.ok), verification });
}

async function consumeModelVerification(store, verificationId, modelProfiles, env, mode = OFFICIAL_DECISION_MODE) {
  const id = cleanText(verificationId, 80);
  if (!/^[a-f0-9-]{36}$/i.test(id)) return { error: "Run a fresh model verification before generating this PDC decision.", verification: null };
  const verification = await store.get(decisionVerificationKey(id, mode), "json");
  if (!verification || typeof verification !== "object") return { error: "The model verification has expired. Please verify the selected PDC models again.", verification: null };
  const requested = modelProfiles.map((profile) => `${profile.id}:${profile.model}`).sort();
  const verified = (Array.isArray(verification.members) ? verification.members : [])
    .filter((member) => member?.ok)
    .map((member) => `${member.id}:${member.model}`)
    .sort();
  if (requested.length !== verified.length || requested.some((member, index) => member !== verified[index])) {
    return { error: "Every selected PDC model must pass a fresh verification before generation.", verification: null };
  }
  await store.delete(decisionVerificationKey(id, mode));
  return { error: "", verification };
}

function backgroundWorkflowAvailable(env) {
  return Boolean(env?.STOCK_PDC_ORCHESTRATOR?.fetch && String(env?.ORCHESTRATOR_SHARED_SECRET || "").trim());
}

async function dispatchBackgroundWorkflow(env, runId, mode) {
  if (!backgroundWorkflowAvailable(env)) throw new Error("Cloudflare PDC background Workflow is not configured on this deployment.");
  const response = await env.STOCK_PDC_ORCHESTRATOR.fetch(new Request("https://stock-pdc-orchestrator/start", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-turnpo-orchestrator-key": String(env.ORCHESTRATOR_SHARED_SECRET).trim()
    },
    body: JSON.stringify({ runId, mode })
  }));
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.workflowId) throw new Error(cleanText(payload?.error || `Workflow dispatch failed (HTTP ${response.status}).`, 320));
  return cleanText(payload.workflowId, 120);
}

async function dispatchBackgroundSmokeTest(env, body, mode) {
  if (!backgroundWorkflowAvailable(env)) throw new Error("Cloudflare PDC background Workflow is not configured on this deployment.");
  const response = await env.STOCK_PDC_ORCHESTRATOR.fetch(new Request("https://stock-pdc-orchestrator/smoke-test", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-turnpo-orchestrator-key": String(env.ORCHESTRATOR_SHARED_SECRET).trim()
    },
    // The browser may request model IDs and a date only. Provider credentials
    // never pass through Pages or the browser.
    body: JSON.stringify({
      mode,
      modelProfileIds: Array.isArray(body?.modelProfileIds) ? body.modelProfileIds : [],
      modelProfileId: body?.modelProfileId || "",
      date: body?.date || ""
    })
  }));
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload || typeof payload !== "object") {
    throw new Error(cleanText(payload?.error || `Worker connectivity test failed (HTTP ${response.status}).`, 320));
  }
  return payload;
}

async function createRun(request, env, mode = OFFICIAL_DECISION_MODE) {
  const store = decisionStore(env);
  if (!store) return error("Missing STOCK_PDC_KV or AUTH_KV binding.", 500);
  const body = await readJson(request);
  if (body.snapshot !== undefined || body.candidates !== undefined) return error("The browser may not supply Hawkeye candidates, dates, scores, or screening inputs.", 400);
  let snapshot;
  try {
    snapshot = await serverHawkeyeSnapshot(request);
  } catch (caught) {
    return error(cleanText(caught?.message || "Hawkeye Radar is not ready.", 320), 409);
  }
  const now = new Date().toISOString();
  const noCandidates = snapshot.candidates.length === 0;
  const deferVerification = !noCandidates && body.deferVerification === true;
  if (deferVerification && !backgroundWorkflowAvailable(env)) {
    return error("Cloudflare PDC background Workflow is not configured on this deployment.", 503);
  }
  let modelProfiles = [];
  let verificationReceipt = { error: "", verification: null };
  if (!noCandidates) {
    const requested = requestedModelProfiles(body, env, mode);
    modelProfiles = requested.modelProfiles;
    if (!modelProfiles.length || modelProfiles.length !== requested.requestedIds.length) {
      return error("No selected PDC model is configured on this deployment.");
    }
    if (!deferVerification) {
      verificationReceipt = await consumeModelVerification(store, body.verificationId, modelProfiles, env, mode);
      if (verificationReceipt.error) return error(verificationReceipt.error, 409);
    }
  }
  const currentCount = Number(await store.get(decisionRateKey(snapshot.date, mode)) || "0");
  if (currentCount >= MAX_RUNS_PER_DAY) return error("Daily decision-run limit reached. Review an existing run instead.", 429);
  await store.put(decisionRateKey(snapshot.date, mode), String(currentCount + 1), { expirationTtl: 24 * 60 * 60 });
  const run = {
    id: crypto.randomUUID(),
    mode,
    date: snapshot.date,
    createdAt: now,
    updatedAt: now,
    model: "MULTI_MODEL_PDC",
    scoringSystem: PDC_SCORING_SYSTEM,
    modelVerification: verificationReceipt.verification,
    modelProfile: null,
    status: noCandidates ? "NO_CANDIDATES" : deferVerification ? "WORKFLOW_QUEUED" : "SNAPSHOT_LOCKED",
    execution: deferVerification ? {
      kind: "cloudflare-workflow",
      memberStageStorage: PDC_MEMBER_STAGE_STORAGE,
      status: "QUEUED",
      workflowId: "",
      queuedAt: now,
      startedAt: "",
      completedAt: "",
      error: ""
    } : null,
    snapshot,
    committee: Object.fromEntries(modelProfiles.map((profile) => [profile.id, {
      profile: publicModelProfile(profile),
      roundOne: null,
      roundTwo: null,
      audit: { roundOne: null, roundTwo: null }
    }])),
    roundOne: {},
    pool: [],
    roundTwo: {},
    secretary: null,
    audit: {
      verification: {
        status: noCandidates ? "skipped" : deferVerification ? "pending" : "complete",
        startedAt: noCandidates ? now : deferVerification ? "" : verificationReceipt.verification.createdAt,
        completedAt: noCandidates || deferVerification ? "" : now,
        input: { members: noCandidates ? [] : deferVerification ? modelProfiles.map((profile) => profile.id) : verificationReceipt.verification.modelProfileIds || [] },
        output: noCandidates
          ? { reason: "NO_CANDIDATES: Hawkeye completed successfully with zero passed stocks; models were not called." }
          : deferVerification ? {} : { members: publicModelVerification(verificationReceipt.verification)?.members || [] },
        error: ""
      },
      snapshot: {
        status: "complete",
        startedAt: now,
        completedAt: now,
        input: { source: snapshot.source },
        output: { date: snapshot.date, candidateCount: snapshot.candidates.length, provenance: snapshot.provenance || null },
        error: ""
      },
      merge: null,
      secretary: null,
      riskCheck: null
    },
    final: [],
    publishedAt: ""
  };
  await saveRun(store, run);
  if (deferVerification) {
    try {
      run.execution.workflowId = await dispatchBackgroundWorkflow(env, run.id, mode);
      await saveRun(store, run);
    } catch (caught) {
      const failureMessage = cleanText(caught?.message || "Cloudflare PDC background Workflow dispatch failed.", 320);
      run.status = "WORKFLOW_DISPATCH_FAILED";
      run.execution.status = "FAILED";
      run.execution.completedAt = new Date().toISOString();
      run.execution.error = failureMessage;
      await saveRun(store, run);
      return error(failureMessage, 502);
    }
  }
  return json({ ok: true, run: publicRun(run) });
}

export async function stockPdcWorkerSmokeTest(env, body = {}, mode = OFFICIAL_DECISION_MODE) {
  const store = decisionStore(env);
  if (!store) throw new Error("Missing STOCK_PDC_KV or AUTH_KV binding.");
  const { requestedIds, modelProfiles } = requestedModelProfiles(body, env, mode);
  if (!modelProfiles.length || modelProfiles.length !== requestedIds.length) throw new Error("No selected PDC model is configured on this deployment.");
  const date = validDate(body.date) || new Date().toISOString().slice(0, 10);
  const key = decisionSmokeTestRateKey(date, mode);
  const currentCount = Number(await store.get(key) || "0");
  if (currentCount >= MAX_SMOKE_TESTS_PER_DAY) {
    const error = new Error("Daily PDC test-run limit reached. Try again tomorrow.");
    error.status = 429;
    throw error;
  }
  await store.put(key, String(currentCount + 1), { expirationTtl: 24 * 60 * 60 });
  const members = await Promise.all(modelProfiles.map(async (profile) => {
    const startedAt = Date.now();
    try {
      const reply = await smokeChat(env, profile);
      return {
        id: profile.id,
        label: profile.label,
        provider: profile.provider,
        model: profile.model,
        ok: Boolean(reply),
        latencyMs: Date.now() - startedAt,
        reply,
        error: reply ? "" : "Model returned an empty test reply."
      };
    } catch (caught) {
      const timedOut = caught?.name === "AbortError" || /operation was aborted/i.test(caught?.message || "");
      return { id: profile.id, label: profile.label, provider: profile.provider, model: profile.model, ok: false, latencyMs: Date.now() - startedAt, reply: "", error: timedOut ? "模型在 5 分钟内未返回，可稍后重试。" : cleanText(caught?.message || "PDC test run failed.", 240) };
    }
  }));
  return { ok: members.every((member) => member.ok), test: { mode, date, kind: "CONNECTIVITY_CONVERSATION", members } };
}

async function smokeTestDecision(request, env, mode = OFFICIAL_DECISION_MODE) {
  const body = await readJson(request);
  if (backgroundWorkflowAvailable(env)) {
    try {
      return json(await dispatchBackgroundSmokeTest(env, body, mode));
    } catch (caught) {
      const status = Number(caught?.status) === 429 ? 429 : 502;
      return error(cleanText(caught?.message || "Worker PDC connectivity test failed.", 320), status);
    }
  }
  try {
    return json(await stockPdcWorkerSmokeTest(env, body, mode));
  } catch (caught) {
    const status = Number(caught?.status) === 429 ? 429 : 500;
    return error(cleanText(caught?.message || "PDC test run failed.", 320), status);
  }
}

function recordReviewAudit(member, reviewKey, entry) {
  member.audit ||= {};
  const previous = member.audit[reviewKey];
  const previousAttempts = Array.isArray(previous?.attempts)
    ? previous.attempts
    : previous
      ? [{
          status: previous.status,
          startedAt: previous.startedAt,
          completedAt: previous.completedAt,
          output: previous.output,
          error: previous.error
        }]
      : [];
  const attempt = {
    status: entry.status,
    startedAt: entry.startedAt,
    completedAt: entry.completedAt,
    output: entry.output,
    error: entry.error
  };
  member.audit[reviewKey] = {
    ...entry,
    // A full-market round can span more than eight independent batches. Keep the
    // complete within-run trail (including retries) so an audit never appears to
    // begin halfway through a committee member's work.
    attempts: [...previousAttempts, attempt].slice(-32)
  };
}

async function advanceCommitteeRun(env, run, stage, requestedModelId = "") {
  const store = decisionStore(env);
  if (stage === "round-one" || stage === "round-two") {
    const reviewKey = reviewStageKey(stage);
    const members = requestedModelId
      ? committeeMembers(run).filter((member) => member.profile.id === requestedModelId)
      : committeeMembers(run);
    if (requestedModelId && !members.length) return error("Unknown PDC model member.", 404);
    const candidates = stage === "round-one"
      ? run.snapshot.candidates
      : run.pool.map((row) => run.snapshot.candidates.find((candidate) => candidate.ticker === row.ticker)).filter(Boolean);
    if (stage === "round-two" && !candidates.length) return error("Build the candidate pool before second review.", 409);
    for (const member of members) {
      if (reviewIsComplete(member[reviewKey], candidates.length)) continue;
      run.status = `${stage === "round-one" ? "ROUND_ONE" : "ROUND_TWO"}_IN_PROGRESS`;
      const startedAt = new Date().toISOString();
      const completedTickers = new Set((member[reviewKey]?.rankings || []).map((row) => row?.ticker).filter(Boolean));
      const batchCandidates = candidates.filter((candidate) => !completedTickers.has(candidate.ticker)).slice(0, PDC_REVIEW_BATCH_SIZE);
      if (!batchCandidates.length) {
        member[reviewKey] = mergeCompletedReviewBatch(member[reviewKey], { rankings: [] }, candidates);
        await saveRun(store, run);
        continue;
      }
      try {
        const batchReview = attachPendingForwardOutcomes(
          await modelReview(env, member.profile, FULL_PDC_ROLE, batchCandidates, stage),
          run.date
        );
        if (!reviewIsComplete(batchReview, batchCandidates.length)) {
          const failureMessage = `${member.profile.label} returned ${batchReview.status} for batch ${Math.floor(completedTickers.size / PDC_REVIEW_BATCH_SIZE) + 1}; expected ${batchCandidates.length} valid ticker records.`;
          // Keep any valid individual conclusions for an explicit retry, but mark
          // the stage PARTIAL. It remains barred from the next stage until every
          // missing ticker has later produced a valid record.
          member[reviewKey] = mergeCompletedReviewBatch(member[reviewKey], batchReview, candidates);
          member[reviewKey].status = batchReview.status;
          member[reviewKey].integrity = {
            ...member[reviewKey].integrity,
            status: batchReview.status,
            duplicateTickers: batchReview.integrity.duplicateTickers,
            unexpectedTickers: batchReview.integrity.unexpectedTickers,
            invalidTickers: batchReview.integrity.invalidTickers,
            malformedRowCount: batchReview.integrity.malformedRowCount,
            error: failureMessage
          };
          member[reviewKey].batch = {
            ...member[reviewKey].batch,
            completed: Math.floor(completedTickers.size / PDC_REVIEW_BATCH_SIZE)
          };
          recordReviewAudit(member, reviewKey, {
            status: batchReview.status,
            startedAt,
            completedAt: new Date().toISOString(),
            input: { candidateCount: candidates.length, batch: { count: batchCandidates.length, tickers: batchCandidates.map((candidate) => candidate.ticker) } },
            output: { rankingCount: batchReview.rankings.length, integrity: batchReview.integrity },
            error: failureMessage
          });
          await saveRun(store, run);
          return json({ ok: false, integrityError: failureMessage, run: publicRun(run) });
        }
        member[reviewKey] = mergeCompletedReviewBatch(member[reviewKey], batchReview, candidates);
        const complete = reviewIsComplete(member[reviewKey], candidates.length);
        recordReviewAudit(member, reviewKey, {
          status: complete ? "COMPLETE" : "IN_PROGRESS",
          startedAt,
          completedAt: new Date().toISOString(),
          input: { candidateCount: candidates.length, batch: { count: batchCandidates.length, tickers: batchCandidates.map((candidate) => candidate.ticker) } },
          output: {
            rankingCount: member[reviewKey].rankings.length,
            integrity: member[reviewKey].integrity
          },
          error: ""
        });
        if (!complete) {
          run.status = `${stage === "round-one" ? "ROUND_ONE" : "ROUND_TWO"}_IN_PROGRESS`;
          await saveRun(store, run);
          return json({ ok: true, run: publicRun(run) });
        }
      } catch (caught) {
        const failureMessage = cleanText(caught?.message || "Model review failed.", 320);
        member[reviewKey] = {
          status: "FAILED",
          rankings: Array.isArray(member[reviewKey]?.rankings) ? member[reviewKey].rankings : [],
          batch: member[reviewKey]?.batch || null,
          integrity: {
            status: "FAILED",
            expectedCount: candidates.length,
            receivedCount: completedTickers.size,
            validCount: completedTickers.size,
            missingTickers: candidates.filter((candidate) => !completedTickers.has(candidate.ticker)).map((candidate) => candidate.ticker),
            duplicateTickers: [],
            unexpectedTickers: [],
            invalidTickers: [],
            malformedRowCount: 0,
            error: failureMessage
          }
        };
        recordReviewAudit(member, reviewKey, {
          status: "FAILED",
          startedAt,
          completedAt: new Date().toISOString(),
          input: { candidateCount: candidates.length, batch: { count: batchCandidates.length, tickers: batchCandidates.map((candidate) => candidate.ticker) } },
          output: {},
          error: failureMessage
        });
        await saveRun(store, run);
        throw caught;
      }
      // Persist one independent PDC conclusion at a time for safe resume after a timeout.
      await saveRun(store, run);
    }
    if (committeeStageComplete(run, stage)) run.status = stage === "round-one" ? "ROUND_ONE_COMPLETE" : "ROUND_TWO_COMPLETE";
  } else if (stage === "merge") {
    if (!committeeStageComplete(run, "round-one")) return error("Complete every PDC model before merging candidates.", 409);
    const startedAt = new Date().toISOString();
    if (!run.pool?.length) run.pool = consensusFromReviews(committeeReviewMap(run, "round-one"), run.snapshot.candidates).slice(0, 20);
    run.audit = run.audit || {};
    run.audit.merge = {
      status: "complete",
      startedAt,
      completedAt: new Date().toISOString(),
      input: { memberCount: committeeMembers(run).length, candidateCount: run.snapshot.candidates.length },
      output: { pool: run.pool },
      error: ""
    };
    run.status = "POOL_READY";
  } else if (stage === "secretary") {
    if (!committeeStageComplete(run, "round-two")) return error("Complete every PDC model before Secretary summary.", 409);
    if (!run.secretary) {
      const startedAt = new Date().toISOString();
      try {
        run.secretary = secretaryReview(run);
        run.audit = run.audit || {};
        run.audit.secretary = {
          status: "complete",
          startedAt,
          completedAt: new Date().toISOString(),
          input: { model: run.secretary.profile, poolCount: run.pool?.length || 0, memberCount: committeeMembers(run).length },
          output: run.secretary.metrics,
          error: ""
        };
      } catch (caught) {
        run.audit = run.audit || {};
        run.audit.secretary = {
          status: "failed",
          startedAt,
          completedAt: new Date().toISOString(),
          input: { model: { id: "secretary-scorecard", provider: "Program", model: "PDC_SCORECARD_V1" }, poolCount: run.pool?.length || 0, memberCount: committeeMembers(run).length },
          output: {},
          error: cleanText(caught?.message || "PDC Secretary failed.", 320)
        };
        await saveRun(store, run);
        throw caught;
      }
    }
    run.status = "SECRETARY_COMPLETE";
  } else if (stage === "risk-check") {
    if (!committeeStageComplete(run, "round-two")) return error("Complete every PDC model before risk review.", 409);
    if (!run.secretary) return error("Complete the Secretary summary before the final gate.", 409);
    const startedAt = new Date().toISOString();
    run.final = decisionResult(run);
    run.audit = run.audit || {};
    run.audit.riskCheck = {
      status: "complete",
      startedAt,
      completedAt: new Date().toISOString(),
      input: { poolCount: run.pool?.length || 0, memberCount: committeeMembers(run).length },
      output: { final: run.final },
      error: ""
    };
    run.status = "READY_TO_PUBLISH";
  } else {
    return error("Unknown decision stage.", 404);
  }
  await saveRun(store, run);
  return json({ ok: true, run: publicRun(run) });
}

async function advanceRun(env, runId, stage, requestedRoleId = "", mode = OFFICIAL_DECISION_MODE) {
  const store = decisionStore(env);
  if (!store) return error("Missing STOCK_PDC_KV or AUTH_KV binding.", 500);
  const run = await loadRun(store, runId, mode);
  if (!run) return error("Decision run was not found.", 404);
  if (run.publishedAt) return error("Published decision runs are immutable.", 409);
  if (usesMemberStageStorage(run) && ["round-one", "round-two"].includes(stage)) {
    return error("This workflow-backed committee scores through its independent model records. Do not advance a shared scoring stage directly.", 409);
  }
  if (isCommitteeRun(run)) {
    try {
      return await advanceCommitteeRun(env, run, stage, requestedRoleId);
    } catch (caught) {
      return error(cleanText(caught?.message || "Decision stage failed.", 320), 502);
    }
  }
  const modelProfile = run.modelProfile || selectedModelProfile(env, mode === DEMO_DECISION_MODE ? "gpt-5.6-luna" : "gpt-5.6-sol", mode);
  if (!modelProfile || !["OpenAI", "Anthropic", "Google", "DeepSeek", "Moonshot"].includes(modelProfile.provider)) return error("This run's selected model provider is not available.", 409);
  try {
    if (stage === "round-one" || stage === "round-two") {
      const reviewKey = reviewStageKey(stage);
      const roles = requestedRoleId
        ? REVIEW_ROLES.filter((role) => role.id === requestedRoleId)
        : REVIEW_ROLES;
      if (requestedRoleId && !roles.length) return error("Unknown decision reviewer.", 404);
      const candidates = stage === "round-one"
        ? run.snapshot.candidates
        : run.pool.map((row) => run.snapshot.candidates.find((candidate) => candidate.ticker === row.ticker)).filter(Boolean);
      if (stage === "round-two" && !candidates.length) return error("Build the candidate pool before second review.", 409);
      run[reviewKey] ||= {};
      for (const role of roles) {
        if (run[reviewKey][role.id]) continue;
        run.status = `${stage === "round-one" ? "ROUND_ONE" : "ROUND_TWO"}_IN_PROGRESS`;
        run[reviewKey][role.id] = attachPendingForwardOutcomes(await modelReview(env, modelProfile, role, candidates, stage), run.date);
        // Save after every individual reviewer so a timeout or refresh can resume safely.
        await saveRun(store, run);
      }
      if (reviewStageComplete(run, stage)) run.status = stage === "round-one" ? "ROUND_ONE_COMPLETE" : "ROUND_TWO_COMPLETE";
    } else if (stage === "merge") {
      if (!Object.keys(run.roundOne || {}).length) return error("Complete round one before merging candidates.", 409);
      if (!reviewStageComplete(run, "round-one")) return error("Complete every round-one reviewer before merging candidates.", 409);
      if (!run.pool?.length) run.pool = consensusFromReviews(run.roundOne, run.snapshot.candidates).slice(0, 20);
      run.status = "POOL_READY";
    } else if (stage === "risk-check") {
      if (!reviewStageComplete(run, "round-two")) return error("Complete every round-two reviewer before risk review.", 409);
      run.final = decisionResult(run);
      run.status = "READY_TO_PUBLISH";
    } else {
      return error("Unknown decision stage.", 404);
    }
    await saveRun(store, run);
    return json({ ok: true, run: publicRun(run) });
  } catch (caught) {
    return error(cleanText(caught?.message || "Decision stage failed.", 320), 502);
  }
}

// These narrowly-scoped exports are consumed only by the separate Cloudflare
// Workflow Worker. They deliberately reuse the same PDC functions as the Pages
// API, so background execution cannot bypass Hawkeye, model integrity, or audit
// rules that apply to an interactive run.
export async function stockPdcWorkflowScoreMemberBatch(env, runId, mode = OFFICIAL_DECISION_MODE, stage, memberId) {
  const store = decisionStore(env);
  if (!store) throw new Error("Missing STOCK_PDC_KV or AUTH_KV binding.");
  if (!["round-one", "round-two"].includes(stage)) throw new Error("Unknown PDC member stage.");
  const run = await loadRun(store, runId, mode);
  if (!run || !isCommitteeRun(run)) throw new Error("Committee decision run was not found.");
  if (!usesMemberStageStorage(run)) throw new Error("This legacy PDC run cannot use independent member storage. Start a new run.");
  const member = committeeMembers(run).find((item) => item.profile.id === memberId);
  if (!member) throw new Error("Unknown PDC model member.");
  const candidates = stageCandidates(run, stage);
  if (!candidates.length) throw new Error(stage === "round-two" ? "Build the candidate pool before second review." : "Hawkeye candidate snapshot is empty.");
  const reviewKey = reviewStageKey(stage);
  const { key, record } = await loadMemberStageRecord(store, run, member, stage, candidates);
  if (reviewIsComplete(record.review, candidates.length)) return { ok: true, complete: true, status: "COMPLETE", memberId, stage };
  if (["FAILED", "PARTIAL"].includes(record.status) || ["FAILED", "PARTIAL"].includes(record.review?.status)) {
    return { ok: false, complete: false, status: record.review?.status || record.status, memberId, stage, error: cleanText(record.audit?.error, 320) };
  }
  const completedTickers = new Set((record.review?.rankings || []).map((row) => row?.ticker).filter(Boolean));
  const batchCandidates = candidates.filter((candidate) => !completedTickers.has(candidate.ticker)).slice(0, PDC_REVIEW_BATCH_SIZE);
  if (!batchCandidates.length) {
    record.review = mergeCompletedReviewBatch(record.review, { rankings: [] }, candidates);
    record.status = record.review.status;
    await saveMemberStageRecord(store, key, record);
    return { ok: reviewIsComplete(record.review, candidates.length), complete: reviewIsComplete(record.review, candidates.length), status: record.status, memberId, stage };
  }
  const startedAt = new Date().toISOString();
  record.status = "IN_PROGRESS";
  await saveMemberStageRecord(store, key, record);
  try {
    const batchReview = attachPendingForwardOutcomes(
      await modelReview(env, member.profile, FULL_PDC_ROLE, batchCandidates, stage),
      run.date
    );
    if (!reviewIsComplete(batchReview, batchCandidates.length)) {
      const failureMessage = `${member.profile.label} returned ${batchReview.status} for batch ${Math.floor(completedTickers.size / PDC_REVIEW_BATCH_SIZE) + 1}; expected ${batchCandidates.length} valid ticker records.`;
      record.review = mergeCompletedReviewBatch(record.review, batchReview, candidates);
      record.review.status = batchReview.status;
      record.review.integrity = {
        ...record.review.integrity,
        status: batchReview.status,
        duplicateTickers: batchReview.integrity.duplicateTickers,
        unexpectedTickers: batchReview.integrity.unexpectedTickers,
        invalidTickers: batchReview.integrity.invalidTickers,
        malformedRowCount: batchReview.integrity.malformedRowCount,
        error: failureMessage
      };
      record.status = batchReview.status;
      record.audit = memberStageAudit(record.audit, {
        status: batchReview.status,
        startedAt,
        completedAt: new Date().toISOString(),
        input: { candidateCount: candidates.length, batch: { count: batchCandidates.length, tickers: batchCandidates.map((candidate) => candidate.ticker) } },
        output: { rankingCount: batchReview.rankings.length, integrity: batchReview.integrity },
        error: failureMessage
      });
      await saveMemberStageRecord(store, key, record);
      return { ok: false, complete: false, status: record.status, memberId, stage, error: failureMessage };
    }
    record.review = mergeCompletedReviewBatch(record.review, batchReview, candidates);
    const complete = reviewIsComplete(record.review, candidates.length);
    record.status = complete ? "COMPLETE" : "IN_PROGRESS";
    record.audit = memberStageAudit(record.audit, {
      status: record.status,
      startedAt,
      completedAt: new Date().toISOString(),
      input: { candidateCount: candidates.length, batch: { count: batchCandidates.length, tickers: batchCandidates.map((candidate) => candidate.ticker) } },
      output: { rankingCount: record.review.rankings.length, integrity: record.review.integrity },
      error: ""
    });
    await saveMemberStageRecord(store, key, record);
    return { ok: true, complete, status: record.status, memberId, stage };
  } catch (caught) {
    const failureMessage = cleanText(caught?.message || "Model review failed.", 320);
    record.review = {
      status: "FAILED",
      rankings: Array.isArray(record.review?.rankings) ? record.review.rankings : [],
      batch: record.review?.batch || null,
      integrity: {
        status: "FAILED",
        expectedCount: candidates.length,
        receivedCount: completedTickers.size,
        validCount: completedTickers.size,
        missingTickers: candidates.filter((candidate) => !completedTickers.has(candidate.ticker)).map((candidate) => candidate.ticker),
        duplicateTickers: [],
        unexpectedTickers: [],
        invalidTickers: [],
        malformedRowCount: 0,
        error: failureMessage
      }
    };
    record.status = "FAILED";
    record.audit = memberStageAudit(record.audit, {
      status: "FAILED",
      startedAt,
      completedAt: new Date().toISOString(),
      input: { candidateCount: candidates.length, batch: { count: batchCandidates.length, tickers: batchCandidates.map((candidate) => candidate.ticker) } },
      output: {},
      error: failureMessage
    });
    await saveMemberStageRecord(store, key, record);
    return { ok: false, complete: false, status: "FAILED", memberId, stage, error: failureMessage };
  }
}

export async function stockPdcWorkflowFinalizeMemberStage(env, runId, mode = OFFICIAL_DECISION_MODE, stage) {
  const store = decisionStore(env);
  if (!store) throw new Error("Missing STOCK_PDC_KV or AUTH_KV binding.");
  const run = await loadHydratedRun(store, runId, mode);
  if (!run || !isCommitteeRun(run)) throw new Error("Committee decision run was not found.");
  const reviewKey = reviewStageKey(stage);
  if (!reviewKey) throw new Error("Unknown PDC member stage.");
  const candidates = stageCandidates(run, stage);
  const members = committeeMembers(run);
  const incomplete = members
    .filter((member) => !reviewIsComplete(member[reviewKey], candidates.length))
    .map((member) => ({ label: member.profile.label, status: member[reviewKey]?.status || "NOT_STARTED", error: cleanText(member[reviewKey]?.integrity?.error || member.audit?.[reviewKey]?.error, 180) }));
  run.status = incomplete.length
    ? `${stage === "round-one" ? "ROUND_ONE" : "ROUND_TWO"}_BLOCKED`
    : stage === "round-one" ? "ROUND_ONE_COMPLETE" : "ROUND_TWO_COMPLETE";
  run.audit ||= {};
  run.audit[stage === "round-one" ? "roundOne" : "roundTwo"] = {
    status: incomplete.length ? "BLOCKED" : "complete",
    startedAt: cleanText(run.audit?.[stage === "round-one" ? "roundOne" : "roundTwo"]?.startedAt, 40) || new Date().toISOString(),
    completedAt: new Date().toISOString(),
    input: { memberCount: members.length, candidateCount: candidates.length, storage: PDC_MEMBER_STAGE_STORAGE },
    output: { completeMembers: members.length - incomplete.length, incompleteMembers: incomplete },
    error: incomplete.length ? incomplete.map((member) => `${member.label}: ${member.status}${member.error ? ` (${member.error})` : ""}`).join(" | ") : ""
  };
  await saveRun(store, run);
  return { ok: !incomplete.length, run: publicRun(run), error: run.audit[stage === "round-one" ? "roundOne" : "roundTwo"].error };
}

export async function stockPdcWorkflowRead(env, runId, mode = OFFICIAL_DECISION_MODE) {
  const store = decisionStore(env);
  if (!store) throw new Error("Missing STOCK_PDC_KV or AUTH_KV binding.");
  const run = await loadHydratedRun(store, runId, mode);
  if (!run) throw new Error("Decision run was not found.");
  return publicRun(run);
}

export async function stockPdcWorkflowMark(env, runId, mode = OFFICIAL_DECISION_MODE, patch = {}) {
  const store = decisionStore(env);
  if (!store) throw new Error("Missing STOCK_PDC_KV or AUTH_KV binding.");
  const run = await loadRun(store, runId, mode);
  if (!run) throw new Error("Decision run was not found.");
  const current = run.execution && typeof run.execution === "object" ? run.execution : {};
  run.execution = {
    kind: "cloudflare-workflow",
    memberStageStorage: cleanText(current.memberStageStorage, 64),
    status: cleanText(patch.status || current.status || "QUEUED", 40),
    workflowId: cleanText(patch.workflowId || current.workflowId, 120),
    queuedAt: cleanText(current.queuedAt || run.createdAt, 40),
    startedAt: cleanText(patch.startedAt ?? current.startedAt, 40),
    completedAt: cleanText(patch.completedAt ?? current.completedAt, 40),
    error: cleanText(patch.error ?? current.error, 320)
  };
  if (patch.runStatus) run.status = cleanText(patch.runStatus, 64);
  await saveRun(store, run);
  return publicRun(run);
}

export async function stockPdcWorkflowVerify(env, runId, mode = OFFICIAL_DECISION_MODE) {
  const store = decisionStore(env);
  if (!store) throw new Error("Missing STOCK_PDC_KV or AUTH_KV binding.");
  const run = await loadRun(store, runId, mode);
  if (!run) throw new Error("Decision run was not found.");
  if (run.status === "NO_CANDIDATES") return { ok: true, run: publicRun(run) };
  if (run.modelVerification?.members?.length) return { ok: run.modelVerification.members.every((member) => member?.ok), run: publicRun(run) };
  const profiles = committeeMembers(run).map((member) => member.profile);
  const startedAt = new Date().toISOString();
  const members = await Promise.all(profiles.map(async (profile) => {
    const started = Date.now();
    try {
      return verificationResult(profile, started, null, await verifyModel(env, profile));
    } catch (caught) {
      return verificationResult(profile, started, caught);
    }
  }));
  const verification = {
    id: crypto.randomUUID(),
    createdAt: startedAt,
    modelProfileIds: profiles.map((profile) => profile.id),
    members
  };
  const ok = members.length === profiles.length && members.every((member) => member.ok);
  run.modelVerification = verification;
  run.audit ||= {};
  run.audit.verification = {
    status: ok ? "complete" : "FAILED",
    startedAt,
    completedAt: new Date().toISOString(),
    input: { members: verification.modelProfileIds },
    output: { members: publicModelVerification(verification)?.members || [] },
    error: ok ? "" : cleanText(members.filter((member) => !member.ok).map((member) => `${member.label}: ${member.error}`).join(" | "), 320)
  };
  if (!ok) {
    run.status = "WORKFLOW_VERIFICATION_FAILED";
    run.execution = { ...(run.execution || {}), status: "FAILED", completedAt: new Date().toISOString(), error: run.audit.verification.error };
  } else if (run.status === "WORKFLOW_QUEUED" || run.status === "WORKFLOW_RUNNING") {
    run.status = "SNAPSHOT_LOCKED";
  }
  await saveRun(store, run);
  return { ok, run: publicRun(run), error: run.audit.verification.error };
}

export async function stockPdcWorkflowAdvance(env, runId, stage, requestedRoleId = "", mode = OFFICIAL_DECISION_MODE) {
  // Merge immutable per-member stage records into the parent only at a stage
  // barrier. Scoring itself never writes this shared run object.
  const store = decisionStore(env);
  if (!store) throw new Error("Missing STOCK_PDC_KV or AUTH_KV binding.");
  const hydrated = await loadHydratedRun(store, runId, mode);
  if (!hydrated) throw new Error("Decision run was not found.");
  if (usesMemberStageStorage(hydrated) && !["round-one", "round-two"].includes(stage)) await saveRun(store, hydrated);
  const response = await advanceRun(env, runId, stage, requestedRoleId, mode);
  const payload = await response.json().catch(() => ({}));
  return {
    ok: response.ok && payload.ok !== false,
    status: response.status,
    error: cleanText(payload.integrityError || payload.error || "", 320),
    run: payload.run || null
  };
}

async function publishRun(env, runId, mode = OFFICIAL_DECISION_MODE) {
  const store = decisionStore(env);
  if (!store) return error("Missing STOCK_PDC_KV or AUTH_KV binding.", 500);
  const run = await loadRun(store, runId, mode);
  if (!run) return error("Decision run was not found.", 404);
  if (mode === DEMO_DECISION_MODE || run.mode === DEMO_DECISION_MODE) {
    return error("Mini Demo runs are intentionally isolated and cannot be published to the formal PDC.", 409);
  }
  if (run.status === "NO_CANDIDATES") {
    return error("This Hawkeye run completed with NO_CANDIDATES and has no PDC decision to publish.", 409);
  }
  if (run.status !== "READY_TO_PUBLISH" || !Array.isArray(run.final) || !run.final.length) {
    return error("Finish all review stages before publishing.", 409);
  }
  const publishedAt = new Date().toISOString();
  const day = {
    date: run.date,
    runId: run.id,
    model: isCommitteeRun(run) ? "Multi-model PDC" : run.modelProfile?.label || run.model,
    scoringSystem: run.scoringSystem || "legacy-nine-dimension-pdc",
    dataSnapshot: run.snapshot.provenance || null,
    publishedAt,
    decisions: run.final,
    action: "RESEARCH_REVIEW"
  };
  const history = await store.get(decisionHistoryKey(), "json");
  const dates = Array.isArray(history?.dates) ? history.dates.filter(validDate) : [];
  const nextDates = [...new Set([...dates, run.date])].sort().slice(-365);
  run.status = "PUBLISHED";
  run.publishedAt = publishedAt;
  await Promise.all([
    store.put(decisionDayKey(run.date), JSON.stringify(day)),
    store.put(decisionCurrentKey(), JSON.stringify(day)),
    store.put(decisionHistoryKey(), JSON.stringify({ dates: nextDates })),
    saveRun(store, run)
  ]);
  return json({ ok: true, run: publicRun(run), current: day });
}

function portfolioKey(name) {
  return `stock-pdc:portfolio:${name}`;
}

function tradingDaysBetween(startDate, endDate) {
  const start = new Date(`${validDate(startDate)}T00:00:00Z`);
  const end = new Date(`${validDate(endDate)}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
  let days = 0;
  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const weekday = cursor.getUTCDay();
    if (weekday !== 0 && weekday !== 6) days += 1;
  }
  return Math.max(0, days - 1);
}

function safePortfolioConfig(value) {
  const source = value && typeof value === "object" ? value : {};
  const config = { ...PORTFOLIO_DEFAULT_CONFIG };
  Object.keys(PORTFOLIO_DEFAULT_CONFIG).forEach((key) => {
    const number = finiteNumber(source[key], null);
    if (number !== null && number >= 0 && number <= 10000) config[key] = number;
  });
  config.maxPositions = Math.max(1, Math.min(50, Math.round(config.maxPositions)));
  config.premarketRankLimit = Math.max(1, Math.min(30, Math.round(config.premarketRankLimit)));
  config.rankExitDays = Math.max(1, Math.min(10, Math.round(config.rankExitDays)));
  config.buyMinVotes = Math.max(1, Math.min(5, Math.round(config.buyMinVotes)));
  config.holdMinVotes = Math.max(0, Math.min(5, Math.round(config.holdMinVotes)));
  return config;
}

async function portfolioConfig(store) {
  return safePortfolioConfig(await store.get(portfolioKey("config"), "json"));
}

async function portfolioLedger(store) {
  const ledger = await store.get(portfolioKey("ledger"), "json");
  return ledger && typeof ledger === "object" ? {
    holdings: Array.isArray(ledger.holdings) ? ledger.holdings : [],
    closed: Array.isArray(ledger.closed) ? ledger.closed : []
  } : { holdings: [], closed: [] };
}

async function savePortfolioLedger(store, ledger) {
  await store.put(portfolioKey("ledger"), JSON.stringify(ledger));
  return ledger;
}

function portfolioDimension(row, id) {
  return finiteNumber(row?.dimensionConsensus?.[id]?.median, 0) || 0;
}

function hasSafetyFlag(row) {
  return Boolean(row?.backgroundChecks?.financialDistressFlag || row?.backgroundChecks?.stDelistingRisk || row?.backgroundChecks?.fundamentalRedFlag);
}

function portfolioScore(row) {
  const forward = finiteNumber(row?.forwardPrediction?.forwardUpsideScore, 0) || 0;
  const probability = finiteNumber(row?.forwardPrediction?.prob5dUpGt2Pct, 0) || 0;
  const consensus = finiteNumber(row?.consensusScore, 0) || 0;
  return Number((forward + probability * 0.35 + consensus * 2).toFixed(2));
}

function buyGate(row, config) {
  const forward = row?.forwardPrediction || {};
  const checks = [
    ["PDC_CONSENSUS", (row?.buyVotes || 0) >= config.buyMinVotes],
    ["FORWARD_UPSIDE", (forward.forwardUpsideScore || 0) >= config.buyMinForwardUpside && (forward.prob5dUpGt2Pct || 0) >= config.buyMinProbability5dUp && (forward.expected5dReturnPct || 0) >= config.buyMinExpected5dReturn],
    ["ENTRY_TIMING", portfolioDimension(row, "entryTiming") >= config.buyMinEntryTiming],
    ["RELATIVE_STRENGTH", portfolioDimension(row, "relativeStrength") >= config.buyMinRelativeStrength],
    ["TREND_ACCELERATION", portfolioDimension(row, "trendAcceleration") >= config.buyMinTrendAcceleration],
    ["BREAKOUT_VOLUME", portfolioDimension(row, "breakoutConfirmation") >= config.buyMinBreakoutConfirmation && portfolioDimension(row, "volumeFlowConfirmation") >= config.buyMinVolumeConfirmation],
    ["OVERHEAT_GATE", portfolioDimension(row, "overheatReversalRisk") >= config.buyMinOverheatSafety],
    ["DOWNSIDE_GATE", portfolioDimension(row, "downsideFailureRisk") >= config.buyMinDownsideSafety],
    ["BACKGROUND_SAFETY", !hasSafetyFlag(row)]
  ];
  return { pass: checks.every(([, pass]) => pass), failed: checks.filter(([, pass]) => !pass).map(([name]) => name) };
}

function candidateRowsFromRun(run, limit) {
  const reviews = Object.keys(committeeReviewMap(run, "round-two")).length
    ? committeeReviewMap(run, "round-two")
    : committeeReviewMap(run, "round-one");
  const candidates = run.pool?.length ? run.pool : run.snapshot?.candidates || [];
  return consensusFromReviews(reviews, candidates).slice(0, limit).map((row, index) => ({
    ...row,
    rank: index + 1,
    forwardPrediction: row.forwardPredictionConsensus,
    coreEvidence: row.theses?.[0]?.text || "PDC consensus evidence available.",
    coreRisk: row.risks?.[0]?.text || "Review full PDC evidence before execution."
  }));
}

function publicPortfolioRow(row) {
  return {
    ticker: cleanText(row?.ticker, 24),
    name: cleanText(row?.name, 80),
    rank: finiteNumber(row?.rank, null),
    previousRank: finiteNumber(row?.previousRank, null),
    action: cleanText(row?.action, 40),
    recheckAction: cleanText(row?.recheckAction, 40),
    trigger: cleanText(row?.trigger, 120),
    evidence: cleanText(row?.evidence, 500),
    reason: cleanText(row?.reason, 300),
    referencePrice: finiteNumber(row?.referencePrice, null),
    currentReturnPct: finiteNumber(row?.currentReturnPct, null),
    daysHeld: finiteNumber(row?.daysHeld, null),
    forwardUpsideScore: finiteNumber(row?.forwardPrediction?.forwardUpsideScore, null),
    probability5dUp: finiteNumber(row?.forwardPrediction?.prob5dUpGt2Pct, null),
    expected5dReturnPct: finiteNumber(row?.forwardPrediction?.expected5dReturnPct, null),
    consensus: finiteNumber(row?.buyVotes, null),
    entryTiming: portfolioDimension(row, "entryTiming"),
    relativeStrength: portfolioDimension(row, "relativeStrength"),
    trendAcceleration: portfolioDimension(row, "trendAcceleration"),
    breakoutConfirmation: portfolioDimension(row, "breakoutConfirmation"),
    volumeConfirmation: portfolioDimension(row, "volumeFlowConfirmation"),
    overheatSafety: portfolioDimension(row, "overheatReversalRisk"),
    downsideSafety: portfolioDimension(row, "downsideFailureRisk"),
    replacementCandidate: row?.replacementCandidate ? {
      ticker: cleanText(row.replacementCandidate.ticker, 24),
      name: cleanText(row.replacementCandidate.name, 80),
      rank: finiteNumber(row.replacementCandidate.rank, null)
    } : null
  };
}

function positionEvaluation(holding, row, date, config, referencePrice = null, updateRank = false) {
  const rank = row?.rank || 99;
  const priorRank = finiteNumber(holding.lastRank, null);
  const price = finiteNumber(referencePrice, null);
  const entryPrice = finiteNumber(holding.actualEntryPrice, null);
  const currentReturnPct = price && entryPrice ? Number((((price - entryPrice) / entryPrice) * 100).toFixed(2)) : null;
  const daysHeld = tradingDaysBetween(holding.actualEntryDate, date);
  const thesisFailure = !row || (row.buyVotes || 0) < config.holdMinVotes || portfolioDimension(row, "trendAcceleration") < Math.max(3, config.buyMinTrendAcceleration - 2) || portfolioDimension(row, "breakoutConfirmation") < Math.max(3, config.buyMinBreakoutConfirmation - 2) || hasSafetyFlag(row);
  const rankExitDays = updateRank && holding.lastRankDate !== date
    ? rank > config.rankExitThreshold ? (finiteNumber(holding.rankExitDays, 0) || 0) + 1 : 0
    : finiteNumber(holding.rankExitDays, 0) || 0;
  if (updateRank && holding.lastRankDate !== date) {
    holding.lastRank = rank;
    holding.lastRankDate = date;
    holding.rankExitDays = rankExitDays;
  }
  let trigger = "HOLD_CONDITIONS_PASSED";
  let action = "HOLD";
  if (currentReturnPct !== null && currentReturnPct <= config.hardStopPct) { trigger = "HARD_STOP"; action = "SELL"; }
  else if (thesisFailure) { trigger = "THESIS_FAILURE"; action = "SELL"; }
  else if (rank > config.rankExitThreshold && ((row?.buyVotes || 0) < config.holdMinVotes || rankExitDays >= config.rankExitDays)) { trigger = "PDC_RANK_EXIT"; action = "SELL"; }
  else if (daysHeld >= config.timeStopDays && currentReturnPct !== null && currentReturnPct < config.timeStopTargetPct) { trigger = "TIME_STOP"; action = "SELL"; }
  else if (daysHeld >= config.timeWarningDays && currentReturnPct !== null && currentReturnPct < config.timeStopTargetPct) trigger = "TIME_WARNING";
  return {
    ...row,
    ticker: holding.ticker,
    name: holding.name || row?.name || holding.ticker,
    rank,
    previousRank: priorRank,
    action,
    trigger,
    referencePrice: price,
    currentReturnPct,
    daysHeld,
    evidence: row ? `Rank #${rank} · ${row.buyVotes || 0}/5 PDC BUY · Trend ${portfolioDimension(row, "trendAcceleration")}/10 · Entry ${portfolioDimension(row, "entryTiming")}/10.` : "Not present in today's PDC eligible universe.",
    reason: trigger === "HOLD_CONDITIONS_PASSED" ? "Trend and PDC hold criteria remain intact; no exit trigger." : trigger
  };
}

function normalizeNoonRows(value) {
  const rows = Array.isArray(value?.rows) ? value.rows : [];
  const result = new Map();
  rows.forEach((row) => {
    const ticker = cleanText(row?.ticker, 24).toUpperCase();
    const referencePrice = finiteNumber(row?.referencePrice, null);
    if (!ticker || !referencePrice || referencePrice <= 0) return;
    result.set(ticker, {
      referencePrice,
      dayChangePct: finiteNumber(row?.dayChangePct, 0) || 0,
      entryTiming: finiteNumber(row?.entryTiming, null),
      overheatSafety: finiteNumber(row?.overheatSafety, null),
      downsideSafety: finiteNumber(row?.downsideSafety, null),
      relativeStrength: finiteNumber(row?.relativeStrength, null),
      trendAcceleration: finiteNumber(row?.trendAcceleration, null),
      breakoutConfirmation: finiteNumber(row?.breakoutConfirmation, null),
      volumeConfirmation: finiteNumber(row?.volumeConfirmation, null),
      breakoutValid: row?.breakoutValid !== false,
      pullback: Boolean(row?.pullback),
      volumeExpansion: Boolean(row?.volumeExpansion)
    });
  });
  return result;
}

function applyNoonRow(row, noon) {
  if (!noon) return row;
  const dimensions = { ...row.dimensionConsensus };
  const mapping = [
    ["entryTiming", noon.entryTiming], ["overheatReversalRisk", noon.overheatSafety], ["downsideFailureRisk", noon.downsideSafety],
    ["relativeStrength", noon.relativeStrength], ["trendAcceleration", noon.trendAcceleration], ["breakoutConfirmation", noon.breakoutConfirmation], ["volumeFlowConfirmation", noon.volumeConfirmation]
  ];
  mapping.forEach(([id, value]) => { if (value !== null) dimensions[id] = { ...(dimensions[id] || {}), median: value }; });
  return { ...row, dimensionConsensus: dimensions, referencePrice: noon.referencePrice };
}

function reentryAllowed(holding, row, date, config) {
  if (!holding?.cooldownUntil || validDate(holding.cooldownUntil) < date) return true;
  return row.rank <= config.reentryMaxRank && (row.buyVotes || 0) >= config.reentryMinVotes && portfolioDimension(row, "entryTiming") >= config.reentryMinEntryTiming && buyGate(row, config).pass;
}

async function portfolioApi(context) {
  const { request, env } = context;
  const store = decisionStore(env);
  if (!store) return error("Missing STOCK_PDC_KV or AUTH_KV binding.", 500);
  const url = new URL(request.url);
  const suffix = url.pathname.slice(`${PORTFOLIO_PATH}/api`.length).replace(/^\/+/, "");
  if (request.method === "GET") {
    if (suffix === "dashboard") return json({ ok: true, dashboard: await store.get(portfolioKey("current"), "json"), ledger: await portfolioLedger(store), config: await portfolioConfig(store) });
    if (suffix === "config") return json({ ok: true, config: await portfolioConfig(store) });
    return error("Unknown portfolio resource.", 404);
  }
  if (request.method !== "POST") return error("Method not allowed.", 405);
  const body = await readJson(request);
  if (suffix === "config") {
    const config = safePortfolioConfig(body.config);
    await store.put(portfolioKey("config"), JSON.stringify(config));
    return json({ ok: true, config });
  }
  const ledger = await portfolioLedger(store);
  if (suffix === "holdings/entry") {
    const ticker = cleanText(body.ticker, 24).toUpperCase();
    const actualEntryPrice = finiteNumber(body.actualEntryPrice, null);
    const actualEntryDate = validDate(body.actualEntryDate) || new Date().toISOString().slice(0, 10);
    if (!ticker || !actualEntryPrice || actualEntryPrice <= 0) return error("Ticker and actual entry price are required.");
    if (ledger.holdings.some((holding) => holding.ticker === ticker)) return error("This ticker is already recorded as held.", 409);
    ledger.holdings.push({ id: crypto.randomUUID(), ticker, name: cleanText(body.name || ticker, 80), actualEntryPrice, actualEntryDate, actualEntryTime: cleanText(body.actualEntryTime, 40), quantity: Math.max(0, finiteNumber(body.quantity, 0) || 0), state: "HELD", rankExitDays: 0, lastRank: null, lastRankDate: "", cooldownUntil: "" });
    await savePortfolioLedger(store, ledger);
    return json({ ok: true, ledger });
  }
  if (suffix === "holdings/exit") {
    const ticker = cleanText(body.ticker, 24).toUpperCase();
    const index = ledger.holdings.findIndex((holding) => holding.ticker === ticker);
    const actualExitPrice = finiteNumber(body.actualExitPrice, null);
    const actualExitDate = validDate(body.actualExitDate) || new Date().toISOString().slice(0, 10);
    if (index < 0 || !actualExitPrice || actualExitPrice <= 0) return error("A held ticker and actual exit price are required.");
    const holding = ledger.holdings.splice(index, 1)[0];
    const config = await portfolioConfig(store);
    const cooldownUntil = new Date(`${actualExitDate}T00:00:00Z`);
    cooldownUntil.setUTCDate(cooldownUntil.getUTCDate() + config.cooldownTradingDays + 2);
    ledger.closed.push({ ...holding, actualExitPrice, actualExitDate, actualExitTime: cleanText(body.actualExitTime, 40), exitReason: cleanText(body.exitReason || "MANUAL_CONFIRMATION", 80), lastExitRank: finiteNumber(body.lastExitRank, holding.lastRank), cooldownUntil: cooldownUntil.toISOString().slice(0, 10), state: "COOLDOWN" });
    await savePortfolioLedger(store, ledger);
    return json({ ok: true, ledger });
  }
  if (suffix === "pre-market") {
    const config = await portfolioConfig(store);
    const current = await store.get(decisionCurrentKey(), "json");
    const runId = cleanText(body.runId || current?.runId, 80);
    const run = runId ? await loadRun(store, runId) : null;
    if (!run || !committeeStageComplete(run, "round-two")) return error("A completed formal PDC run is required before generating the pre-market decision.", 409);
    const date = validDate(body.date || run.date) || run.date;
    const candidates = candidateRowsFromRun(run, config.premarketRankLimit).map((row) => {
      const gate = buyGate(row, config);
      return { ...row, action: gate.pass ? "PREMARKET_BUY_CANDIDATE" : "NO_ACTION", trigger: gate.pass ? "PREMARKET_BUY_GATE_PASSED" : gate.failed.join(" · "), evidence: `Rank #${row.rank} · ${row.buyVotes || 0}/5 PDC BUY · Forward ${row.forwardPrediction.forwardUpsideScore || 0}/100 · Entry ${portfolioDimension(row, "entryTiming")}/10.`, reason: row.coreEvidence };
    });
    const byTicker = new Map(candidates.map((row) => [row.ticker, row]));
    const holdingRows = ledger.holdings.map((holding) => positionEvaluation(holding, byTicker.get(holding.ticker), date, config, null, true));
    await savePortfolioLedger(store, ledger);
    const dashboard = { date, stage: "PRE_MARKET", generatedAt: new Date().toISOString(), runId, config, referencePrice: "PREVIOUS_CLOSE", noonSnapshot: null, candidates: candidates.map(publicPortfolioRow), actions: { buy: candidates.filter((row) => row.action === "PREMARKET_BUY_CANDIDATE").map(publicPortfolioRow), hold: holdingRows.filter((row) => row.action === "HOLD").map(publicPortfolioRow), sell: holdingRows.filter((row) => row.action === "SELL").map(publicPortfolioRow) } };
    await Promise.all([store.put(portfolioKey(`day:${date}`), JSON.stringify(dashboard)), store.put(portfolioKey("current"), JSON.stringify(dashboard))]);
    return json({ ok: true, dashboard });
  }
  if (suffix === "noon-recheck") {
    const current = await store.get(portfolioKey("current"), "json");
    const date = validDate(body.date || current?.date);
    if (!current || !date || current.date !== date || current.stage !== "PRE_MARKET") return error("Generate today's pre-market decision before noon recheck.", 409);
    const config = await portfolioConfig(store);
    const noonRows = normalizeNoonRows(body.noonSnapshot);
    if (!noonRows.size) return error("Noon recheck requires at least one 11:30 reference price.");
    const candidates = current.candidates.map((saved) => {
      const raw = { ...saved, dimensionConsensus: {
        entryTiming: { median: saved.entryTiming }, relativeStrength: { median: saved.relativeStrength }, trendAcceleration: { median: saved.trendAcceleration },
        breakoutConfirmation: { median: saved.breakoutConfirmation }, volumeFlowConfirmation: { median: saved.volumeConfirmation },
        overheatReversalRisk: { median: saved.overheatSafety }, downsideFailureRisk: { median: saved.downsideSafety }
      }, forwardPrediction: { forwardUpsideScore: saved.forwardUpsideScore, prob5dUpGt2Pct: saved.probability5dUp, expected5dReturnPct: saved.expected5dReturnPct }, buyVotes: saved.consensus, backgroundChecks: {} };
      const noon = noonRows.get(saved.ticker);
      const row = applyNoonRow(raw, noon);
      const gate = buyGate(row, config);
      const cancelled = !noon || !noon.breakoutValid || noon.pullback || noon.dayChangePct >= config.noonMaxChasePct || !gate.pass;
      return { ...row, name: saved.name, rank: saved.rank, coreEvidence: saved.reason, action: cancelled ? "NO_ACTION" : "BUY", recheckAction: cancelled ? (noon?.pullback || noon?.dayChangePct >= config.noonMaxChasePct ? "CANCEL_BUY" : "WAIT") : "BUY_NOW", trigger: cancelled ? "NOON_RECHECK_NOT_PASSED" : "BUY_CONDITIONS_PASSED", evidence: `11:30 reference ${noon?.referencePrice || "N/A"} · ${noon?.dayChangePct || 0}% · Entry ${portfolioDimension(row, "entryTiming")}/10 · Overheat safety ${portfolioDimension(row, "overheatReversalRisk")}/10.`, reason: cancelled ? "Afternoon entry was not confirmed by the frozen noon snapshot." : "Pre-market thesis remains valid at the 11:30 reference price." };
    });
    const byTicker = new Map(candidates.map((row) => [row.ticker, row]));
    const holdingRows = ledger.holdings.map((holding) => positionEvaluation(holding, byTicker.get(holding.ticker), date, config, noonRows.get(holding.ticker)?.referencePrice, false));
    const retained = holdingRows.filter((row) => row.action !== "SELL");
    const buyRows = candidates.filter((row) => row.action === "BUY").filter((row) => {
      const priorExit = ledger.closed.filter((closed) => closed.ticker === row.ticker).at(-1);
      return reentryAllowed(priorExit, row, date, config) && !ledger.holdings.some((holding) => holding.ticker === row.ticker);
    }).sort((left, right) => portfolioScore(right) - portfolioScore(left));
    const capacity = Math.max(0, config.maxPositions - retained.length);
    const approvedBuys = buyRows.slice(0, capacity);
    const replacements = capacity ? [] : approvedBuys;
    if (!capacity && buyRows.length) {
      const weakest = [...retained].sort((left, right) => portfolioScore(left) - portfolioScore(right))[0];
      if (weakest && portfolioScore(buyRows[0]) - portfolioScore(weakest) >= config.replacementMargin) {
        weakest.action = "SELL";
        weakest.trigger = "PORTFOLIO_REPLACEMENT";
        weakest.reason = "A materially stronger BUY NOW candidate exceeds the configured replacement margin.";
        weakest.replacementCandidate = buyRows[0];
        approvedBuys.push(buyRows[0]);
      }
    }
    const dashboard = { date, stage: "NOON_RECHECK", generatedAt: new Date().toISOString(), runId: current.runId, config, referencePrice: "11:30_LATEST_AVAILABLE_PRICE", noonSnapshot: { capturedAt: new Date().toISOString(), rows: [...noonRows.entries()].map(([ticker, row]) => ({ ticker, ...row })) }, candidates: candidates.map(publicPortfolioRow), actions: { buy: approvedBuys.map(publicPortfolioRow), hold: holdingRows.filter((row) => row.action === "HOLD").map(publicPortfolioRow), sell: holdingRows.filter((row) => row.action === "SELL").map(publicPortfolioRow) } };
    await Promise.all([store.put(portfolioKey(`day:${date}`), JSON.stringify(dashboard)), store.put(portfolioKey("current"), JSON.stringify(dashboard))]);
    return json({ ok: true, dashboard });
  }
  return error("Unknown portfolio action.", 404);
}

async function decisionApi(context, mode = OFFICIAL_DECISION_MODE) {
  const { request, env } = context;
  const url = new URL(request.url);
  const apiPath = mode === DEMO_DECISION_MODE ? DEMO_DECISION_PATH : DECISION_PATH;
  const suffix = url.pathname.slice(`${apiPath}/api`.length).replace(/^\/+/, "");
  if (request.method === "GET") {
    const store = decisionStore(env);
    if (!store) return error("Missing STOCK_PDC_KV or AUTH_KV binding.", 500);
    if (suffix === "models") return json({ ok: true, mode, models: configuredModelProfiles(env, mode, backgroundWorkflowAvailable(env)).map(publicModelProfile) });
    if (suffix === "orchestration") return json({ ok: true, available: backgroundWorkflowAvailable(env), kind: backgroundWorkflowAvailable(env) ? "cloudflare-workflow" : "" });
    if (suffix === "current") return json({ ok: true, current: await store.get(decisionCurrentKey(mode), "json") });
    if (suffix === "history") {
      const history = await store.get(decisionHistoryKey(mode), "json");
      const dates = Array.isArray(history?.dates) ? history.dates.filter(validDate).sort().reverse() : [];
      const days = await Promise.all(dates.map((date) => store.get(decisionDayKey(date, mode), "json")));
      return json({ ok: true, days: days.filter(Boolean) });
    }
    const runMatch = suffix.match(/^runs\/([a-f0-9-]{36})$/i);
    if (runMatch) {
      const run = await loadHydratedRun(store, runMatch[1], mode);
      return run ? json({ ok: true, run: publicRun(run) }) : error("Decision run was not found.", 404);
    }
    return error("Unknown decision resource.", 404);
  }
  if (request.method !== "POST") return error("Method not allowed.", 405);
  if (suffix === "data-refresh") return queueManualMarketRefresh(env);
  if (suffix === "verifications") return createModelVerification(request, env, mode);
  if (suffix === "smoke-test") return smokeTestDecision(request, env, mode);
  if (suffix === "runs") return createRun(request, env, mode);
  const stageMatch = suffix.match(/^runs\/([a-f0-9-]{36})\/(round-one|merge|round-two|secretary|risk-check)(?:\/([a-z0-9_.-]+))?$/i);
  if (stageMatch) return advanceRun(env, stageMatch[1], stageMatch[2], stageMatch[3] || "", mode);
  const publishMatch = suffix.match(/^runs\/([a-f0-9-]{36})\/publish$/i);
  if (publishMatch) return publishRun(env, publishMatch[1], mode);
  return error("Unknown decision action.", 404);
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
          <p>Enter the access code to open the Top 20 rank flow.</p>
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

  if (url.pathname === `${PAGE_PATH}/logout`) {
    const headers = new Headers({ location: `${PAGE_PATH}/`, "cache-control": "no-store" });
    headers.append("set-cookie", clearAccessCookie());
    headers.append("set-cookie", clearUiCookie());
    return new Response(null, { status: 303, headers });
  }

  if (url.pathname.startsWith(`${DECISION_PATH}/api`) || url.pathname.startsWith(`${DEMO_DECISION_PATH}/api`)) {
    const mode = url.pathname.startsWith(`${DEMO_DECISION_PATH}/api`) ? DEMO_DECISION_MODE : OFFICIAL_DECISION_MODE;
    if (await isAuthorized(request, env)) return decisionApi(context, mode);
    return error("Stock PDC access is required.", 401);
  }

  if (url.pathname.startsWith(`${PORTFOLIO_PATH}/api`)) {
    if (await isAuthorized(request, env)) return portfolioApi(context);
    return error("Stock PDC access is required.", 401);
  }

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

  if (url.pathname.startsWith(`${DECISION_PATH}/api`) || url.pathname.startsWith(`${DEMO_DECISION_PATH}/api`)) {
    const mode = url.pathname.startsWith(`${DEMO_DECISION_PATH}/api`) ? DEMO_DECISION_MODE : OFFICIAL_DECISION_MODE;
    if (await isAuthorized(request, env)) return decisionApi(context, mode);
    return error("Stock PDC access is required.", 401);
  }

  if (url.pathname.startsWith(`${PORTFOLIO_PATH}/api`)) {
    if (await isAuthorized(request, env)) return portfolioApi(context);
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
  headers.append("set-cookie", uiCookie());
  return redirectWithHeaders(headers);
}
