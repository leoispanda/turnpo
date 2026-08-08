const ACCESS_COOKIE = "turnpo_stock_pdc_access";
const UI_COOKIE = "turnpo_stock_pdc_ui";
const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const PAGE_PATH = "/stock-pdc";
const DECISION_PATH = `${PAGE_PATH}/decision`;
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const DEEPSEEK_CHAT_URL = "https://api.deepseek.com/chat/completions";
const KIMI_CHAT_URL = "https://api.moonshot.ai/v1/chat/completions";
const DEFAULT_STOCK_MODEL = "gpt-5.6-sol";
const DEFAULT_CLAUDE_STOCK_MODEL = "claude-fable-5";
const DEFAULT_DEEPSEEK_STOCK_MODEL = "deepseek-v4-pro";
const DEFAULT_KIMI_STOCK_MODEL = "kimi-k3";
const DEFAULT_GEMINI_STOCK_MODEL = "gemini-3.1-pro-preview";
const MAX_DECISION_BODY_BYTES = 96 * 1024;
const MAX_CANDIDATES = 30;
const MAX_RUNS_PER_DAY = 8;
const RUN_TTL_SECONDS = 180 * 24 * 60 * 60;

const REVIEW_ROLES = [
  { id: "pdc", name: "PDC 综合评审", focus: "综合趋势、量价、现有因子与证据一致性" },
  { id: "trend", name: "趋势与量价评审", focus: "趋势延续、相对强弱、突破与成交量确认" },
  { id: "risk", name: "风险与过热审计", focus: "风险、过热、流动性、下行与不应参与的情形" },
  { id: "counter", name: "反方证伪评审", focus: "寻找论点漏洞、拥挤交易、证据不足和反例" }
];

const FULL_PDC_ROLE = {
  id: "full-pdc",
  name: "完整 PDC 决策委员",
  focus: "独立完成趋势、量价、风险、过热、反方证伪与证据一致性的全维度评分，并给出完整 Top 30 结论"
};

function configuredAccessCode(env) {
  return String(env.STOCK_PDC_ACCESS_CODE || env.EMBA_ACCESS_CODE || "emba2026").trim();
}

function stockModel(env) {
  return String(env.OPENAI_STOCK_MODEL || DEFAULT_STOCK_MODEL).trim();
}

function claudeApiKey(env) {
  return String(env.ANTHROPIC_API_KEY || env.CLAUDE_API_KEY || "").trim();
}

function claudeStockModel(env) {
  return String(env.ANTHROPIC_STOCK_MODEL || env.CLAUDE_STOCK_MODEL || DEFAULT_CLAUDE_STOCK_MODEL).trim();
}

function configuredModelProfiles(env) {
  const profiles = [{
    id: "gpt-5.6-sol",
    label: "GPT-5.6 Sol · Pro PDC",
    provider: "OpenAI",
    model: stockModel(env)
  }];
  if (claudeApiKey(env)) {
    profiles.push({
      id: "claude_api_pdc",
      label: "Claude Fable 5 PDC",
      provider: "Anthropic",
      model: claudeStockModel(env)
    });
  }
  if (geminiApiKey(env)) {
    profiles.push({
      id: "gemini_api_pdc",
      label: "Gemini 3.1 Pro PDC",
      provider: "Google",
      model: geminiStockModel(env)
    });
  }
  if (deepseekApiKey(env)) {
    profiles.push({
      id: "deepseek_api_pdc",
      label: "DeepSeek API PDC",
      provider: "DeepSeek",
      model: deepseekStockModel(env)
    });
  }
  if (kimiApiKey(env)) {
    profiles.push({
      id: "kimi_api_pdc",
      label: "Kimi API PDC",
      provider: "Moonshot",
      model: kimiStockModel(env)
    });
  }
  return profiles;
}

function publicModelProfile(profile) {
  return {
    id: profile.id,
    label: profile.label,
    provider: profile.provider,
    model: profile.model
  };
}

function selectedModelProfile(env, profileId) {
  const requestedId = cleanText(profileId || "gpt-5.6-sol", 64);
  return configuredModelProfiles(env).find((profile) => profile.id === requestedId) || null;
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

function decisionRunKey(runId) {
  return `stock-pdc:decision:run:${runId}`;
}

function decisionDayKey(date) {
  return `stock-pdc:decision:day:${date}`;
}

function decisionHistoryKey() {
  return "stock-pdc:decision:history";
}

function decisionCurrentKey() {
  return "stock-pdc:decision:current";
}

function decisionRateKey(date) {
  return `stock-pdc:decision:run-count:${date}`;
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
    scores: normalizeScores(value?.scores)
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
    scores: candidate.scores
  }));
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
            required: ["ticker", "score", "thesis", "risk", "exclude"],
            properties: {
              ticker: { type: "string" },
              score: { type: "number" },
              thesis: { type: "string" },
              risk: { type: "string" },
              exclude: { type: "boolean" }
            }
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
          required: ["ticker", "score", "thesis", "risk", "exclude"],
          properties: {
            ticker: { type: "string" },
            score: { type: "number" },
            thesis: { type: "string" },
            risk: { type: "string" },
            exclude: { type: "boolean" }
          }
        }
      },
      summary: { type: "string" }
    }
  };
}

function reviewInstructions(role, phase) {
  return [
    "You are one role in an internal A-share research committee.",
    `Your role is ${role.name}; focus on ${role.focus}.`,
    "Use only the supplied factual candidate packet. Do not invent news, prices, financial results, or external facts.",
    "This is research support, not a trading instruction. Be conservative when evidence is weak.",
    "Rank only supplied tickers. A high score means stronger research priority for the stated horizon, not a buy instruction.",
    "Use exclude=true when the supplied packet itself shows evidence is inadequate or risk is too high.",
    phase === "round-two"
      ? "This is the second review. Challenge the first-pass consensus and look for reasons a candidate should not advance."
      : "This is the first independent review. Do not assume any other reviewer agrees with you."
  ].join(" ");
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
      return {
        ticker,
        name: byTicker.get(ticker)?.name || ticker,
        score: Math.max(0, Math.min(100, finiteNumber(row?.score, 0))),
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
        max_output_tokens: 5000,
        reasoning: { mode: "pro", effort: "max" }
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.message || "OpenAI review request failed.");
    const outputText = extractOutputText(data);
    if (!outputText) throw new Error("OpenAI review returned no structured output.");
    return normalizeReview(JSON.parse(outputText), candidates);
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
        max_tokens: 5000,
        system: reviewInstructions(role, phase),
        messages: [{
          role: "user",
          content: `Candidate packet:\n${JSON.stringify(serializableCandidates(candidates))}`
        }],
        output_config: {
          effort: "max",
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
  return String(env.GEMINI_API_KEY || env.GOOGLE_GEMINI_API_KEY || "").trim();
}

function geminiStockModel(env) {
  return String(env.GEMINI_STOCK_MODEL || env.GOOGLE_GEMINI_STOCK_MODEL || DEFAULT_GEMINI_STOCK_MODEL).trim();
}

function deepseekApiKey(env) {
  return String(env.DEEPSEEK_API_KEY || env.DEEPSEEK_PDC_API_KEY || "").trim();
}

function deepseekStockModel(env) {
  return String(env.DEEPSEEK_STOCK_MODEL || DEFAULT_DEEPSEEK_STOCK_MODEL).trim();
}

function kimiApiKey(env) {
  return String(env.KIMI_API_KEY || env.MOONSHOT_API_KEY || env.KIMI_PDC_API_KEY || "").trim();
}

function kimiStockModel(env) {
  return String(env.KIMI_STOCK_MODEL || env.MOONSHOT_STOCK_MODEL || DEFAULT_KIMI_STOCK_MODEL).trim();
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
          responseSchema: portableReviewSchema()
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
        thinking: { type: "enabled" },
        reasoning_effort: "max",
        messages: [
          { role: "system", content: `${reviewInstructions(role, phase)} Return only one valid JSON object with rankings and summary.` },
          { role: "user", content: `Candidate packet:\n${JSON.stringify(serializableCandidates(candidates))}` }
        ],
        response_format: { type: "json_object" },
        max_tokens: 5000
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.message || "DeepSeek review request failed.");
    const outputText = data.choices?.[0]?.message?.content || "";
    if (!outputText) throw new Error("DeepSeek review returned no structured output.");
    return normalizeReview(JSON.parse(outputText), candidates);
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
        reasoning_effort: "max",
        messages: [
          { role: "system", content: `${reviewInstructions(role, phase)} Return only one valid JSON object with rankings and summary.` },
          { role: "user", content: `Candidate packet:\n${JSON.stringify(serializableCandidates(candidates))}` }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 5000
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.message || "Kimi review request failed.");
    const outputText = data.choices?.[0]?.message?.content || "";
    if (!outputText) throw new Error("Kimi review returned no structured output.");
    return normalizeReview(JSON.parse(outputText), candidates);
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
      if (ranking.thesis) row.theses.push({ roleId, text: ranking.thesis });
      if (ranking.risk) row.risks.push({ roleId, text: ranking.risk });
    });
  });
  return [...rows.values()]
    .map((row) => ({
      ...row,
      consensusScore: row.scoreCount ? Number((row.scoreTotal / row.scoreCount).toFixed(2)) : 0
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
    .slice(0, 10)
    .map((row, index) => ({
      rank: index + 1,
      ticker: row.ticker,
      name: row.name,
      consensusScore: row.consensusScore,
      support: row.support,
      requiredSupport,
      sourceRank: row.sourceRank,
      thesis: row.theses[0]?.text || "Evidence review completed.",
      risk: row.risks[0]?.text || "Review the full run before any action.",
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
      thesis: row.thesis,
      risk: row.risk,
      exclude: row.exclude
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
    date: run.date,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    model: committee ? "MULTI_MODEL_PDC" : modelProfile.model,
    modelProfile: modelProfile ? publicModelProfile(modelProfile) : null,
    status: run.status,
    snapshot: {
      date: run.snapshot.date,
      source: run.snapshot.source,
      candidateCount: run.snapshot.candidates.length,
      provenance: run.snapshot.provenance || null
    },
    committeeMode: committee,
    members: committee ? committeeMembers(run).map((member) => ({
      ...publicModelProfile(member.profile),
      state: member.roundTwo?.rankings?.length ? "round_two_complete" : member.roundOne?.rankings?.length ? "round_one_complete" : "idle",
      roundOne: publicReview(member.roundOne),
      roundTwo: publicReview(member.roundTwo)
    })) : [],
    roles: committee ? [] : REVIEW_ROLES.map(({ id, name }) => ({ id, name, state: run.roundOne?.[id] ? "complete" : "idle" })),
    roundOneComplete: committee ? committeeStageComplete(run, "round-one") : reviewStageComplete(run, "round-one"),
    roundTwoComplete: committee ? committeeStageComplete(run, "round-two") : reviewStageComplete(run, "round-two"),
    pool: run.pool || [],
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
  await store.put(decisionRunKey(run.id), JSON.stringify(run), { expirationTtl: RUN_TTL_SECONDS });
  return run;
}

async function loadRun(store, runId) {
  const run = await store.get(decisionRunKey(cleanText(runId, 80)), "json");
  return run && typeof run === "object" ? run : null;
}

async function createRun(request, env) {
  const store = decisionStore(env);
  if (!store) return error("Missing STOCK_PDC_KV or AUTH_KV binding.", 500);
  const body = await readJson(request);
  const snapshot = normalizeSnapshot(body.snapshot);
  if (!snapshot) return error("A valid daily PDC snapshot with at least five candidates is required.");
  const requestedIds = Array.isArray(body.modelProfileIds)
    ? body.modelProfileIds.map((id) => cleanText(id, 64)).filter(Boolean)
    : body.modelProfileId ? [cleanText(body.modelProfileId, 64)] : configuredModelProfiles(env).map((profile) => profile.id);
  const availableProfiles = configuredModelProfiles(env);
  const modelProfiles = availableProfiles.filter((profile) => requestedIds.includes(profile.id));
  if (!modelProfiles.length) return error("No selected PDC model is configured on this deployment.");
  const currentCount = Number(await store.get(decisionRateKey(snapshot.date)) || "0");
  if (currentCount >= MAX_RUNS_PER_DAY) return error("Daily decision-run limit reached. Review an existing run instead.", 429);
  await store.put(decisionRateKey(snapshot.date), String(currentCount + 1), { expirationTtl: 24 * 60 * 60 });
  const now = new Date().toISOString();
  const run = {
    id: crypto.randomUUID(),
    date: snapshot.date,
    createdAt: now,
    updatedAt: now,
    model: "MULTI_MODEL_PDC",
    modelProfile: null,
    status: "SNAPSHOT_LOCKED",
    snapshot,
    committee: Object.fromEntries(modelProfiles.map((profile) => [profile.id, {
      profile: publicModelProfile(profile),
      roundOne: null,
      roundTwo: null
    }])),
    roundOne: {},
    pool: [],
    roundTwo: {},
    final: [],
    publishedAt: ""
  };
  await saveRun(store, run);
  return json({ ok: true, run: publicRun(run) });
}

async function advanceCommitteeRun(env, run, stage, requestedModelId = "") {
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
      member[reviewKey] = await modelReview(env, member.profile, FULL_PDC_ROLE, candidates, stage);
      // Persist one independent PDC conclusion at a time for safe resume after a timeout.
      await saveRun(decisionStore(env), run);
    }
    if (committeeStageComplete(run, stage)) run.status = stage === "round-one" ? "ROUND_ONE_COMPLETE" : "ROUND_TWO_COMPLETE";
  } else if (stage === "merge") {
    if (!committeeStageComplete(run, "round-one")) return error("Complete every PDC model before merging candidates.", 409);
    if (!run.pool?.length) run.pool = consensusFromReviews(committeeReviewMap(run, "round-one"), run.snapshot.candidates).slice(0, 20);
    run.status = "POOL_READY";
  } else if (stage === "risk-check") {
    if (!committeeStageComplete(run, "round-two")) return error("Complete every PDC model before risk review.", 409);
    run.final = decisionResult(run);
    run.status = "READY_TO_PUBLISH";
  } else {
    return error("Unknown decision stage.", 404);
  }
  await saveRun(decisionStore(env), run);
  return json({ ok: true, run: publicRun(run) });
}

async function advanceRun(env, runId, stage, requestedRoleId = "") {
  const store = decisionStore(env);
  if (!store) return error("Missing STOCK_PDC_KV or AUTH_KV binding.", 500);
  const run = await loadRun(store, runId);
  if (!run) return error("Decision run was not found.", 404);
  if (run.publishedAt) return error("Published decision runs are immutable.", 409);
  if (isCommitteeRun(run)) {
    try {
      return await advanceCommitteeRun(env, run, stage, requestedRoleId);
    } catch (caught) {
      return error(cleanText(caught?.message || "Decision stage failed.", 320), 502);
    }
  }
  const modelProfile = run.modelProfile || selectedModelProfile(env, "gpt-5.6-sol");
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
        run[reviewKey][role.id] = await modelReview(env, modelProfile, role, candidates, stage);
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

async function publishRun(env, runId) {
  const store = decisionStore(env);
  if (!store) return error("Missing STOCK_PDC_KV or AUTH_KV binding.", 500);
  const run = await loadRun(store, runId);
  if (!run) return error("Decision run was not found.", 404);
  if (run.status !== "READY_TO_PUBLISH" || !Array.isArray(run.final) || !run.final.length) {
    return error("Finish all review stages before publishing.", 409);
  }
  const publishedAt = new Date().toISOString();
  const day = {
    date: run.date,
    runId: run.id,
    model: isCommitteeRun(run) ? "Multi-model PDC" : run.modelProfile?.label || run.model,
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

async function decisionApi(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const suffix = url.pathname.slice(`${DECISION_PATH}/api`.length).replace(/^\/+/, "");
  if (request.method === "GET") {
    const store = decisionStore(env);
    if (!store) return error("Missing STOCK_PDC_KV or AUTH_KV binding.", 500);
    if (suffix === "models") return json({ ok: true, models: configuredModelProfiles(env).map(publicModelProfile) });
    if (suffix === "current") return json({ ok: true, current: await store.get(decisionCurrentKey(), "json") });
    if (suffix === "history") {
      const history = await store.get(decisionHistoryKey(), "json");
      const dates = Array.isArray(history?.dates) ? history.dates.filter(validDate).sort().reverse() : [];
      const days = await Promise.all(dates.map((date) => store.get(decisionDayKey(date), "json")));
      return json({ ok: true, days: days.filter(Boolean) });
    }
    const runMatch = suffix.match(/^runs\/([a-f0-9-]{36})$/i);
    if (runMatch) {
      const run = await loadRun(store, runMatch[1]);
      return run ? json({ ok: true, run: publicRun(run) }) : error("Decision run was not found.", 404);
    }
    return error("Unknown decision resource.", 404);
  }
  if (request.method !== "POST") return error("Method not allowed.", 405);
  if (suffix === "runs") return createRun(request, env);
  const stageMatch = suffix.match(/^runs\/([a-f0-9-]{36})\/(round-one|merge|round-two|risk-check)(?:\/([a-z0-9_.-]+))?$/i);
  if (stageMatch) return advanceRun(env, stageMatch[1], stageMatch[2], stageMatch[3] || "");
  const publishMatch = suffix.match(/^runs\/([a-f0-9-]{36})\/publish$/i);
  if (publishMatch) return publishRun(env, publishMatch[1]);
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

  if (url.pathname.startsWith(`${DECISION_PATH}/api`)) {
    if (await isAuthorized(request, env)) return decisionApi(context);
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

  if (url.pathname.startsWith(`${DECISION_PATH}/api`)) {
    if (await isAuthorized(request, env)) return decisionApi(context);
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
