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
const MAX_DECISION_BODY_BYTES = 96 * 1024;
const MAX_CANDIDATES = 30;
const MAX_RUNS_PER_DAY = 8;
const MAX_SMOKE_TESTS_PER_DAY = 60;
const SMOKE_TEST_TIMEOUT_MS = 5 * 60 * 1000;
const RUN_TTL_SECONDS = 180 * 24 * 60 * 60;
const MODEL_VERIFICATION_TTL_SECONDS = 10 * 60;
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

function configuredModelProfiles(env, mode = OFFICIAL_DECISION_MODE) {
  const demo = mode === DEMO_DECISION_MODE;
  const profiles = [{
    id: demo ? "gpt-5.6-luna" : "gpt-5.6-sol",
    label: demo ? "GPT-5.6 Luna · Mini Demo" : "GPT-5.6 Sol · Pro PDC",
    provider: "OpenAI",
    model: demo ? demoStockModel(env) : stockModel(env),
    tier: demo ? "mini-demo" : "flagship"
  }];
  if (claudeApiKey(env)) {
    profiles.push({
      id: "claude_api_pdc",
      label: demo ? "Claude · Mini Demo" : "Claude Fable 5 PDC",
      provider: "Anthropic",
      model: demo ? claudeDemoStockModel(env) : claudeStockModel(env),
      tier: demo ? "mini-demo" : "flagship"
    });
  }
  if (geminiApiKey(env)) {
    profiles.push({
      id: "gemini_api_pdc",
      label: demo ? "Gemini Flash · Mini Demo" : "Gemini 3.1 Pro PDC",
      provider: "Google",
      model: demo ? geminiDemoStockModel(env) : geminiStockModel(env),
      tier: demo ? "mini-demo" : "flagship"
    });
  }
  if (deepseekApiKey(env)) {
    profiles.push({
      id: "deepseek_api_pdc",
      label: demo ? "DeepSeek Flash · Mini Demo" : "DeepSeek API PDC",
      provider: "DeepSeek",
      model: demo ? deepseekDemoStockModel(env) : deepseekStockModel(env),
      tier: demo ? "mini-demo" : "flagship"
    });
  }
  if (kimiApiKey(env)) {
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
    ? value.candidates.map(normalizeCandidate).filter(Boolean).slice(0, MAX_CANDIDATES)
    : [];
  if (!date || candidates.length < 5) return null;
  return {
    date,
    source: cleanText(value?.source || "stock-pdc/rank-flow.json", 160),
    provenance: normalizeProvenance(value?.provenance),
    candidates,
    capturedAt: new Date().toISOString()
  };
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
    dataGaps: { type: "string" },
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
    thesis: { type: "string" },
    risk: { type: "string" },
    exclude: { type: "boolean" }
  };
}

function reviewSchema(name) {
  return {
    type: "json_schema",
    name,
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["rankings", "summary"],
      properties: {
        rankings: {
          type: "array",
          minItems: 1,
          maxItems: 30,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["ticker", "dimensionScores", "unavailableDimensions", "dataGaps", "backgroundChecks", "forwardPrediction", "decision", "confidence", "thesis", "risk", "exclude"],
            properties: rankingSchemaProperties()
          }
        },
        summary: { type: "string" }
      }
    }
  };
}

function portableReviewSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["rankings", "summary"],
    properties: {
      rankings: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["ticker", "dimensionScores", "unavailableDimensions", "dataGaps", "backgroundChecks", "forwardPrediction", "decision", "confidence", "thesis", "risk", "exclude"],
          properties: rankingSchemaProperties()
        }
      },
      summary: { type: "string" }
    }
  };
}

function secretarySchema() {
  return {
    type: "json_schema",
    name: "stock_pdc_secretary_summary",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "agreements", "disagreements", "priorityRisks", "reviewQuestions"],
      properties: {
        summary: { type: "string" },
        agreements: { type: "array", items: { type: "string" }, maxItems: 12 },
        disagreements: { type: "array", items: { type: "string" }, maxItems: 12 },
        priorityRisks: { type: "array", items: { type: "string" }, maxItems: 12 },
        reviewQuestions: { type: "array", items: { type: "string" }, maxItems: 12 }
      }
    }
  };
}

function normalizeSecretarySummary(value) {
  const cleanList = (items) => (Array.isArray(items) ? items : []).map((item) => cleanText(item, 360)).filter(Boolean).slice(0, 12);
  return {
    summary: cleanText(value?.summary, 1200),
    agreements: cleanList(value?.agreements),
    disagreements: cleanList(value?.disagreements),
    priorityRisks: cleanList(value?.priorityRisks),
    reviewQuestions: cleanList(value?.reviewQuestions)
  };
}

function secretaryPacket(run) {
  return {
    date: run.date,
    candidatePool: run.pool || [],
    secondRound: committeeMembers(run).map((member) => ({
      model: publicModelProfile(member.profile),
      review: publicReview(member.roundTwo)
    }))
  };
}

async function secretaryReview(env, run) {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY for PDC Secretary.");
  const profile = secretaryProfile(env);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: profile.model,
        instructions: "You are the secretary of an internal A-share research committee. Summarize only the supplied second-round PDC records. Do not rank stocks, change scores, make trading instructions, invent facts, or override the deterministic final gate. Produce a concise audit brief that preserves agreements, disagreements, priority risks, and questions for human review.",
        input: `Second-round committee packet:\n${JSON.stringify(secretaryPacket(run))}`,
        text: { format: secretarySchema() },
        max_output_tokens: 1800,
        reasoning: { effort: "medium" }
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.message || "PDC Secretary request failed.");
    const outputText = extractOutputText(data);
    if (!outputText) throw new Error("PDC Secretary returned no structured output.");
    return { profile: publicModelProfile(profile), summary: normalizeSecretarySummary(parseModelJson(outputText)) };
  } finally {
    clearTimeout(timeout);
  }
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
    "CatalystInformation is only a dated or timely short-term price catalyst evidenced in the frozen packet. If it or any other dimension lacks factual support, put its id in unavailableDimensions, set that dimension score to 0, and explain the missing data once in dataGaps. Never guess or invent news. The program ignores unavailable dimensions and calculates weighted scores.",
    "Fundamental and valuation are not scored. Return backgroundChecks only to flag clear, fact-supported red flags; false means no flag was evidenced in the supplied packet, not that the company has passed a full diligence review. Never use a low PE or long-term company quality to raise the short-term score.",
    "For every ticker return forwardPrediction: probability in percent that 5D return exceeds +2%, expected 5D return percent, probability in percent that 5D return is below -3%, and a 0-100 forwardUpsideScore. These are forecasts from the frozen facts, not known outcomes.",
    "Rank only supplied tickers. BUY means a favorable current entry with credible 5D forward upside; WATCH, HOLD, and SELL must be used when that threshold is not met. Use exclude=true when the supplied packet itself shows evidence is inadequate or risk is too high.",
    phase === "round-two"
      ? "This is the second review. Challenge the first-pass consensus and look for reasons a candidate should not advance."
      : "This is the first independent review. Do not assume any other reviewer agrees with you."
  ].join(" ");
}

function normalizeDimensionScores(value, unavailableDimensions, dataGaps) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const unavailable = new Set((Array.isArray(unavailableDimensions) ? unavailableDimensions : []).filter((id) => PDC_DIMENSIONS.some((dimension) => dimension.id === id)));
  const dimensionScores = {};
  let coveredWeight = 0;
  let weightedTotal = 0;
  PDC_DIMENSIONS.forEach((dimension) => {
    const score = finiteNumber(input[dimension.id]);
    const available = !unavailable.has(dimension.id) && score !== null;
    dimensionScores[dimension.id] = {
      available,
      score: available ? Math.max(0, Math.min(10, score)) : null,
      evidence: available ? "Scored from the supplied fact packet." : cleanText(dataGaps || "N/A — supporting data was not supplied.", 220)
    };
    if (available) {
      coveredWeight += dimension.weight;
      weightedTotal += (dimensionScores[dimension.id].score / 10) * dimension.weight;
    }
  });
  return {
    dimensionScores,
    coveragePct: coveredWeight,
    weightedScore: coveredWeight ? Number(((weightedTotal / coveredWeight) * 100).toFixed(2)) : 0
  };
}

function normalizeBackgroundChecks(value) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return Object.fromEntries(BACKGROUND_CHECKS.map((id) => [id, Boolean(input[id])]));
}

function normalizeForwardPrediction(value) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const percentage = (key) => {
    const number = finiteNumber(input[key]);
    return number === null ? null : Number(Math.max(0, Math.min(100, number)).toFixed(2));
  };
  const returnPct = finiteNumber(input.expected5dReturnPct);
  return {
    prob5dUpGt2Pct: percentage("prob5dUpGt2Pct"),
    expected5dReturnPct: returnPct === null ? null : Number(Math.max(-100, Math.min(100, returnPct)).toFixed(2)),
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
  const allowed = new Set(candidates.map((candidate) => candidate.ticker));
  const byTicker = new Map(candidates.map((candidate) => [candidate.ticker, candidate]));
  const seen = new Set();
  const rankings = (Array.isArray(value?.rankings) ? value.rankings : [])
    .map((row) => {
      const ticker = cleanText(row?.ticker, 24).toUpperCase();
      if (!allowed.has(ticker) || seen.has(ticker)) return null;
      seen.add(ticker);
      const dimensions = normalizeDimensionScores(row?.dimensionScores, row?.unavailableDimensions, row?.dataGaps);
      return {
        ticker,
        name: byTicker.get(ticker)?.name || ticker,
        score: dimensions.weightedScore,
        coveragePct: dimensions.coveragePct,
        dimensionScores: dimensions.dimensionScores,
        dataGaps: cleanText(row?.dataGaps, 240),
        backgroundChecks: normalizeBackgroundChecks(row?.backgroundChecks),
        forwardPrediction: normalizeForwardPrediction(row?.forwardPrediction),
        decision: ["BUY", "WATCH", "HOLD", "SELL"].includes(row?.decision) ? row.decision : "WATCH",
        confidence: Math.max(0, Math.min(100, finiteNumber(row?.confidence, 0))),
        thesis: cleanText(row?.thesis, 260),
        risk: cleanText(row?.risk, 220),
        exclude: Boolean(row?.exclude)
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score)
    .map((row, index) => ({ ...row, rank: index + 1 }));
  if (!rankings.length) throw new Error("Model returned no valid candidate rankings.");
  return { rankings, summary: cleanText(value?.summary, 360) };
}

async function openAiReview(env, modelProfile, role, candidates, phase) {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: modelProfile.model,
        instructions: reviewInstructions(role, phase),
        input: `Candidate packet:\n${JSON.stringify(serializableCandidates(candidates))}`,
        text: { format: reviewSchema(`stock_pdc_${phase}_${role.id}`) },
        max_output_tokens: 8000,
        reasoning: modelProfile.tier === "mini-demo" ? { effort: "medium" } : { mode: "pro", effort: "max" }
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.message || "OpenAI review request failed.");
    const outputText = extractOutputText(data);
    if (!outputText) throw new Error("OpenAI review returned no structured output.");
    return normalizeReview(parseModelJson(outputText), candidates);
  } finally {
    clearTimeout(timeout);
  }
}

async function claudeReview(env, modelProfile, role, candidates, phase) {
  const apiKey = claudeApiKey(env);
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY or CLAUDE_API_KEY.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: modelProfile.model,
        max_tokens: 8000,
        system: reviewInstructions(role, phase),
        messages: [{
          role: "user",
          content: `Candidate packet:\n${JSON.stringify(serializableCandidates(candidates))}`
        }],
        output_config: {
          ...(modelProfile.tier === "mini-demo" ? {} : { effort: "max" }),
          format: {
            type: "json_schema",
            schema: portableReviewSchema()
          }
        }
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.message || "Claude review request failed.");
    const outputText = data.content?.find((item) => item.type === "text" && typeof item.text === "string")?.text || "";
    if (!outputText) throw new Error("Claude review returned no structured output.");
    return normalizeReview(JSON.parse(outputText), candidates);
  } finally {
    clearTimeout(timeout);
  }
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelProfile.model)}:generateContent`, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "content-type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: reviewInstructions(role, phase) }] },
        contents: [{
          role: "user",
          parts: [{ text: `Candidate packet:\n${JSON.stringify(serializableCandidates(candidates))}` }]
        }],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: portableReviewSchema()
        }
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.message || "Gemini review request failed.");
    const outputText = data.candidates?.flatMap((candidate) => candidate.content?.parts || [])
      ?.find((part) => typeof part.text === "string")?.text || "";
    if (!outputText) throw new Error("Gemini review returned no structured output.");
    return normalizeReview(JSON.parse(outputText), candidates);
  } finally {
    clearTimeout(timeout);
  }
}

async function deepseekReview(env, modelProfile, role, candidates, phase) {
  const apiKey = deepseekApiKey(env);
  if (!apiKey) throw new Error("Missing DEEPSEEK_API_KEY or DEEPSEEK_PDC_API_KEY.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(DEEPSEEK_CHAT_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: modelProfile.model,
        thinking: modelProfile.tier === "mini-demo" ? { type: "disabled" } : { type: "enabled" },
        ...(modelProfile.tier === "mini-demo" ? {} : { reasoning_effort: "max" }),
        messages: [
          { role: "system", content: `${reviewInstructions(role, phase)} Return only one valid JSON object with rankings and summary.` },
          { role: "user", content: `Candidate packet:\n${JSON.stringify(serializableCandidates(candidates))}` }
        ],
        response_format: { type: "json_object" },
        max_tokens: 8000
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.message || "DeepSeek review request failed.");
    const outputText = chatCompletionText(data);
    if (!outputText) throw new Error("DeepSeek review returned no structured output.");
    return normalizeReview(parseModelJson(outputText), candidates);
  } finally {
    clearTimeout(timeout);
  }
}

async function kimiReview(env, modelProfile, role, candidates, phase) {
  const apiKey = kimiApiKey(env);
  if (!apiKey) throw new Error("Missing KIMI_API_KEY, MOONSHOT_API_KEY, or KIMI_PDC_API_KEY.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(kimiChatUrl(env), {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: modelProfile.model,
        ...(modelProfile.tier === "mini-demo" ? { thinking: { type: "disabled" } } : { reasoning_effort: "max" }),
        messages: [
          { role: "system", content: `${reviewInstructions(role, phase)} Return only one valid JSON object with rankings and summary.` },
          { role: "user", content: `Candidate packet:\n${JSON.stringify(serializableCandidates(candidates))}` }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 8000
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(response.status === 401 ? "Kimi authentication was rejected. Check the Cloudflare secret ‘kimi pdc’ is a Kimi Open Platform API Key." : data.error?.message || "Kimi review request failed.");
    const outputText = chatCompletionText(data);
    if (!outputText) throw new Error("Kimi review returned no structured output.");
    return normalizeReview(parseModelJson(outputText), candidates);
  } finally {
    clearTimeout(timeout);
  }
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
          const reply = cleanText(data.candidates?.flatMap((candidate) => candidate.content?.parts || [])
            .filter((part) => part?.thought !== true)
            .map((part) => part?.text)
            .filter((text) => typeof text === "string" && text.trim())
            .join("\n"), 360);
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      signal: controller.signal,
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
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyClaudeModel(env, profile) {
  const apiKey = claudeApiKey(env);
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY or CLAUDE_API_KEY.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      signal: controller.signal,
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
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyGeminiModel(env, profile) {
  const apiKey = geminiApiKey(env);
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY or GOOGLE_GEMINI_API_KEY.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(profile.model)}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: verificationInstructions() }] },
        contents: [{ role: "user", parts: [{ text: "Verify readiness now." }] }],
        generationConfig: { responseMimeType: "application/json", responseJsonSchema: portableVerificationSchema(), maxOutputTokens: 64 }
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.message || "Gemini verification request failed.");
    const outputText = data.candidates?.flatMap((candidate) => candidate.content?.parts || [])
      ?.find((part) => typeof part.text === "string")?.text || "";
    return verifyStructuredOutput(outputText, "Gemini");
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyDeepSeekModel(env, profile) {
  const apiKey = deepseekApiKey(env);
  if (!apiKey) throw new Error("Missing DEEPSEEK_API_KEY or DEEPSEEK_PDC_API_KEY.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(DEEPSEEK_CHAT_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      signal: controller.signal,
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
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyKimiModel(env, profile) {
  const apiKey = kimiApiKey(env);
  if (!apiKey) throw new Error("Missing KIMI_API_KEY, MOONSHOT_API_KEY, or KIMI_PDC_API_KEY.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(kimiChatUrl(env), {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      signal: controller.signal,
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
  } finally {
    clearTimeout(timeout);
  }
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
    buyVotes: 0,
    theses: [],
    risks: []
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
      if (ranking.thesis) row.theses.push({ roleId, text: ranking.thesis });
      if (ranking.risk) row.risks.push({ roleId, text: ranking.risk });
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
      thesis: row.theses[0]?.text || "Evidence review completed.",
      risk: row.risks[0]?.text || "Review the full run before any action.",
      forwardOutcome: pendingForwardOutcome(run.date),
      action: "RESEARCH_REVIEW"
    }));
}

function reviewStageKey(stage) {
  return stage === "round-one" ? "roundOne" : stage === "round-two" ? "roundTwo" : "";
}

function reviewStageComplete(run, stage) {
  const reviewKey = reviewStageKey(stage);
  return Boolean(reviewKey && REVIEW_ROLES.every((role) => run[reviewKey]?.[role.id]));
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
  return Boolean(reviewKey && members.length && members.every((member) => member[reviewKey]?.rankings?.length));
}

function publicReview(review) {
  if (!review?.rankings?.length) return null;
  return {
    summary: cleanText(review.summary, 360),
    rankings: review.rankings.slice(0, 30).map((row) => ({
      rank: row.rank,
      ticker: row.ticker,
      name: row.name,
      score: row.score,
      coveragePct: row.coveragePct,
      dimensionScores: row.dimensionScores,
      dataGaps: row.dataGaps,
      backgroundChecks: row.backgroundChecks,
      forwardPrediction: row.forwardPrediction,
      forwardOutcome: row.forwardOutcome || null,
      decision: row.decision,
      confidence: row.confidence,
      thesis: row.thesis,
      risk: row.risk,
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
  return {
    status: cleanText(stage.status, 32),
    startedAt: cleanText(stage.startedAt, 40),
    completedAt: cleanText(stage.completedAt, 40),
    input: stage.input && typeof stage.input === "object" ? stage.input : {},
    output: stage.output && typeof stage.output === "object" ? stage.output : {},
    error: cleanText(stage.error, 320)
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
      state: member.roundTwo?.rankings?.length ? "round_two_complete" : member.roundOne?.rankings?.length ? "round_one_complete" : "idle",
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
  const requestedIds = Array.isArray(body.modelProfileIds)
    ? body.modelProfileIds.map((id) => cleanText(id, 64)).filter(Boolean)
    : body.modelProfileId ? [cleanText(body.modelProfileId, 64)] : configuredModelProfiles(env, mode).map((profile) => profile.id);
  const availableProfiles = configuredModelProfiles(env, mode);
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
  const verificationProfiles = [...modelProfiles, secretaryProfile(env)];
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
  const requested = [...modelProfiles, secretaryProfile(env)].map((profile) => `${profile.id}:${profile.model}`).sort();
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

async function createRun(request, env, mode = OFFICIAL_DECISION_MODE) {
  const store = decisionStore(env);
  if (!store) return error("Missing STOCK_PDC_KV or AUTH_KV binding.", 500);
  const body = await readJson(request);
  const snapshot = normalizeSnapshot(body.snapshot);
  if (!snapshot) return error("A valid daily PDC snapshot with at least five candidates is required.");
  if (snapshot.provenance?.primarySourceId !== "stock-pdc-local-hawkeye-radar") {
    return error("PDC generation only accepts an active Hawkeye Radar fact packet.", 409);
  }
  const { requestedIds, modelProfiles } = requestedModelProfiles(body, env, mode);
  if (!modelProfiles.length || modelProfiles.length !== requestedIds.length) return error("No selected PDC model is configured on this deployment.");
  const verificationReceipt = await consumeModelVerification(store, body.verificationId, modelProfiles, env, mode);
  if (verificationReceipt.error) return error(verificationReceipt.error, 409);
  const currentCount = Number(await store.get(decisionRateKey(snapshot.date, mode)) || "0");
  if (currentCount >= MAX_RUNS_PER_DAY) return error("Daily decision-run limit reached. Review an existing run instead.", 429);
  await store.put(decisionRateKey(snapshot.date, mode), String(currentCount + 1), { expirationTtl: 24 * 60 * 60 });
  const now = new Date().toISOString();
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
    status: "SNAPSHOT_LOCKED",
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
        status: "complete",
        startedAt: verificationReceipt.verification.createdAt,
        completedAt: now,
        input: { members: verificationReceipt.verification.modelProfileIds || [] },
        output: { members: publicModelVerification(verificationReceipt.verification)?.members || [] },
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
  return json({ ok: true, run: publicRun(run) });
}

async function smokeTestDecision(request, env, mode = OFFICIAL_DECISION_MODE) {
  const store = decisionStore(env);
  if (!store) return error("Missing STOCK_PDC_KV or AUTH_KV binding.", 500);
  const body = await readJson(request);
  const { requestedIds, modelProfiles } = requestedModelProfiles(body, env, mode);
  if (!modelProfiles.length || modelProfiles.length !== requestedIds.length) return error("No selected PDC model is configured on this deployment.");
  const date = validDate(body.date) || new Date().toISOString().slice(0, 10);
  const key = decisionSmokeTestRateKey(date, mode);
  const currentCount = Number(await store.get(key) || "0");
  if (currentCount >= MAX_SMOKE_TESTS_PER_DAY) return error("Daily PDC test-run limit reached. Try again tomorrow.", 429);
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
  return json({ ok: members.every((member) => member.ok), test: { mode, date, kind: "CONNECTIVITY_CONVERSATION", members } });
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
      if (member[reviewKey]?.rankings?.length) continue;
      run.status = `${stage === "round-one" ? "ROUND_ONE" : "ROUND_TWO"}_IN_PROGRESS`;
      const startedAt = new Date().toISOString();
      try {
        member[reviewKey] = attachPendingForwardOutcomes(await modelReview(env, member.profile, FULL_PDC_ROLE, candidates, stage), run.date);
        member.audit = member.audit || {};
        member.audit[reviewKey] = {
          status: "complete",
          startedAt,
          completedAt: new Date().toISOString(),
          input: { candidateCount: candidates.length, tickers: candidates.map((candidate) => candidate.ticker) },
          output: { summary: member[reviewKey].summary, rankingCount: member[reviewKey].rankings.length },
          error: ""
        };
      } catch (caught) {
        member.audit = member.audit || {};
        member.audit[reviewKey] = {
          status: "failed",
          startedAt,
          completedAt: new Date().toISOString(),
          input: { candidateCount: candidates.length, tickers: candidates.map((candidate) => candidate.ticker) },
          output: {},
          error: cleanText(caught?.message || "Model review failed.", 320)
        };
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
        run.secretary = await secretaryReview(env, run);
        run.audit = run.audit || {};
        run.audit.secretary = {
          status: "complete",
          startedAt,
          completedAt: new Date().toISOString(),
          input: { model: run.secretary.profile, poolCount: run.pool?.length || 0, memberCount: committeeMembers(run).length },
          output: run.secretary.summary,
          error: ""
        };
      } catch (caught) {
        run.audit = run.audit || {};
        run.audit.secretary = {
          status: "failed",
          startedAt,
          completedAt: new Date().toISOString(),
          input: { model: publicModelProfile(secretaryProfile(env)), poolCount: run.pool?.length || 0, memberCount: committeeMembers(run).length },
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

async function publishRun(env, runId, mode = OFFICIAL_DECISION_MODE) {
  const store = decisionStore(env);
  if (!store) return error("Missing STOCK_PDC_KV or AUTH_KV binding.", 500);
  const run = await loadRun(store, runId, mode);
  if (!run) return error("Decision run was not found.", 404);
  if (mode === DEMO_DECISION_MODE || run.mode === DEMO_DECISION_MODE) {
    return error("Mini Demo runs are intentionally isolated and cannot be published to the formal PDC.", 409);
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
    if (suffix === "models") return json({ ok: true, mode, models: configuredModelProfiles(env, mode).map(publicModelProfile) });
    if (suffix === "current") return json({ ok: true, current: await store.get(decisionCurrentKey(mode), "json") });
    if (suffix === "history") {
      const history = await store.get(decisionHistoryKey(mode), "json");
      const dates = Array.isArray(history?.dates) ? history.dates.filter(validDate).sort().reverse() : [];
      const days = await Promise.all(dates.map((date) => store.get(decisionDayKey(date, mode), "json")));
      return json({ ok: true, days: days.filter(Boolean) });
    }
    const runMatch = suffix.match(/^runs\/([a-f0-9-]{36})$/i);
    if (runMatch) {
      const run = await loadRun(store, runMatch[1], mode);
      return run ? json({ ok: true, run: publicRun(run) }) : error("Decision run was not found.", 404);
    }
    return error("Unknown decision resource.", 404);
  }
  if (request.method !== "POST") return error("Method not allowed.", 405);
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
