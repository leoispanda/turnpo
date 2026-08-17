export const API_VERSION = "provider-execution-v1";
export const EVALUATION_SCHEMA_VERSION = "pdc-ai-contract-v1";

export const EXECUTION_MODES = Object.freeze(["OFFLINE_TEST", "REAL_SHADOW", "PRODUCTION"]);
export const PROVIDER_IDS = Object.freeze(["openai", "claude", "gemini", "deepseek", "kimi"]);
export const TASK_TYPES = Object.freeze([
  "stock_evaluation",
  "ranking_scorecard",
  "round_1_member",
  "round_2_member"
]);
export const DECISIONS = Object.freeze(["BUY", "WATCH", "HOLD", "SELL"]);
export const RISK_FLAGS = Object.freeze([
  "MISSING_DATA",
  "DATA_STALE",
  "HIGH_VOLATILITY",
  "OVERHEATED",
  "WEAK_TREND",
  "LIQUIDITY_RISK",
  "MARKET_REGIME_RISK",
  "BREAKOUT_UNCONFIRMED",
  "MODEL_DISAGREEMENT"
]);
export const DIMENSION_KEYS = Object.freeze([
  "market_regime",
  "trend",
  "livermore_breakout",
  "volume_price",
  "candlestick",
  "overheat",
  "risk",
  "zhuge_orion",
  "final_chair"
]);

const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$/;
const SNAPSHOT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{2,127}$/;
const TICKER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,31}$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SENSITIVE_KEY_PATTERN = /(api[-_]?key|access[-_]?token|auth[-_]?token|password|secret|credential|private[-_]?key)/i;
const MAX_BODY_BYTES = 256 * 1024;
const MAX_FACTS_BYTES = 220 * 1024;
const MAX_CANDIDATES = 100;
const MAX_FACT_DEPTH = 8;

export class ContractError extends Error {
  constructor(message, issues = []) {
    super(message);
    this.name = "ContractError";
    this.issues = issues.length ? issues : [message];
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, allowed, required, path) {
  if (!isObject(value)) throw new ContractError(`${path} must be an object.`);
  const allowedSet = new Set(allowed);
  const unknown = Object.keys(value).filter((key) => !allowedSet.has(key));
  if (unknown.length) throw new ContractError(`${path} contains unsupported field(s): ${unknown.join(", ")}.`);
  const missing = required.filter((key) => value[key] === undefined);
  if (missing.length) throw new ContractError(`${path} is missing required field(s): ${missing.join(", ")}.`);
}

function boundedString(value, path, { min = 1, max = 200 } = {}) {
  if (typeof value !== "string") throw new ContractError(`${path} must be a string.`);
  const text = value.trim();
  if (text.length < min || text.length > max) {
    throw new ContractError(`${path} must contain ${min}-${max} characters.`);
  }
  return text;
}

function boundedInteger(value, path, { min, max }) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new ContractError(`${path} must be an integer between ${min} and ${max}.`);
  }
  return value;
}

function boundedNumber(value, path, { min, max }) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new ContractError(`${path} must be a number between ${min} and ${max}.`);
  }
  return value;
}

function enumValue(value, path, values) {
  if (!values.includes(value)) throw new ContractError(`${path} must be one of: ${values.join(", ")}.`);
  return value;
}

function scanFacts(value, path, depth = 0) {
  if (depth > MAX_FACT_DEPTH) throw new ContractError(`${path} is nested too deeply.`);
  if (Array.isArray(value)) {
    if (value.length > 5000) throw new ContractError(`${path} contains too many items.`);
    value.forEach((item, index) => scanFacts(item, `${path}[${index}]`, depth + 1));
    return;
  }
  if (isObject(value)) {
    Object.entries(value).forEach(([key, item]) => {
      if (SENSITIVE_KEY_PATTERN.test(key)) throw new ContractError(`${path}.${key} is not allowed in frozen facts.`);
      if (key.length > 100) throw new ContractError(`${path} contains an invalid field name.`);
      scanFacts(item, `${path}.${key}`, depth + 1);
    });
    return;
  }
  if (value !== null && typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
    throw new ContractError(`${path} contains an unsupported JSON value.`);
  }
  if (typeof value === "string" && value.length > 20000) {
    throw new ContractError(`${path} contains an oversized text value.`);
  }
}

function normalizeCandidates(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_CANDIDATES) {
    throw new ContractError(`candidates must contain 1-${MAX_CANDIDATES} items.`);
  }
  const seen = new Set();
  return value.map((candidate, index) => {
    const path = `candidates[${index}]`;
    exactKeys(candidate, ["ticker", "name", "rank", "fact_ids"], ["ticker"], path);
    const ticker = boundedString(candidate.ticker, `${path}.ticker`, { max: 32 }).toUpperCase();
    if (!TICKER_PATTERN.test(ticker)) throw new ContractError(`${path}.ticker has an invalid format.`);
    if (seen.has(ticker)) throw new ContractError(`candidates contains duplicate ticker ${ticker}.`);
    seen.add(ticker);
    const normalized = { ticker };
    if (candidate.name !== undefined) normalized.name = boundedString(candidate.name, `${path}.name`, { min: 0, max: 160 });
    if (candidate.rank !== undefined) normalized.rank = boundedInteger(candidate.rank, `${path}.rank`, { min: 1, max: 100000 });
    if (candidate.fact_ids !== undefined) {
      if (!Array.isArray(candidate.fact_ids) || candidate.fact_ids.length > 50) {
        throw new ContractError(`${path}.fact_ids must contain at most 50 strings.`);
      }
      normalized.fact_ids = candidate.fact_ids.map((item, itemIndex) => boundedString(item, `${path}.fact_ids[${itemIndex}]`, { max: 160 }));
    }
    return normalized;
  });
}

function normalizeFrozenFacts(value) {
  exactKeys(
    value,
    ["package_sha256", "market_data_date", "rules_version", "source_scope", "data"],
    ["package_sha256", "market_data_date", "rules_version", "source_scope", "data"],
    "frozen_facts"
  );
  const packageSha = boundedString(value.package_sha256, "frozen_facts.package_sha256", { max: 64 }).toLowerCase();
  if (!SHA256_PATTERN.test(packageSha)) throw new ContractError("frozen_facts.package_sha256 must be a SHA-256 digest.");
  const marketDataDate = boundedString(value.market_data_date, "frozen_facts.market_data_date", { max: 32 });
  if (!DATE_PATTERN.test(marketDataDate)) throw new ContractError("frozen_facts.market_data_date must use YYYY-MM-DD.");
  const rulesVersion = boundedString(value.rules_version, "frozen_facts.rules_version", { max: 120 });
  const sourceScope = boundedString(value.source_scope, "frozen_facts.source_scope", { max: 120 });
  if (!isObject(value.data)) throw new ContractError("frozen_facts.data must be a JSON object.");
  scanFacts(value.data, "frozen_facts.data");
  const dataBytes = new TextEncoder().encode(JSON.stringify(value.data)).byteLength;
  if (dataBytes > MAX_FACTS_BYTES) throw new ContractError("frozen_facts.data is too large.");
  return {
    package_sha256: packageSha,
    market_data_date: marketDataDate,
    rules_version: rulesVersion,
    source_scope: sourceScope,
    data: value.data
  };
}

function normalizeModelSelection(value) {
  if (value === undefined) return { provider: "openai", model: "" };
  exactKeys(value, ["provider", "model"], ["provider"], "model_selection");
  const provider = enumValue(String(value.provider || "").trim().toLowerCase(), "model_selection.provider", PROVIDER_IDS);
  const model = value.model === undefined ? "" : boundedString(value.model, "model_selection.model", { max: 160 });
  return { provider, model };
}

function normalizeBudget(value) {
  if (value === undefined) return {};
  exactKeys(value, ["max_output_tokens", "max_total_tokens", "max_cost_usd"], [], "budget");
  const normalized = {};
  if (value.max_output_tokens !== undefined) {
    normalized.max_output_tokens = boundedInteger(value.max_output_tokens, "budget.max_output_tokens", { min: 256, max: 16000 });
  }
  if (value.max_total_tokens !== undefined) {
    normalized.max_total_tokens = boundedInteger(value.max_total_tokens, "budget.max_total_tokens", { min: 256, max: 20000 });
  }
  if (value.max_cost_usd !== undefined) {
    normalized.max_cost_usd = boundedNumber(value.max_cost_usd, "budget.max_cost_usd", { min: 0, max: 100 });
  }
  return normalized;
}

function normalizeRetry(value) {
  if (value === undefined) return { max_attempts: 1 };
  exactKeys(value, ["max_attempts"], [], "retry");
  return {
    max_attempts: value.max_attempts === undefined
      ? 1
      : boundedInteger(value.max_attempts, "retry.max_attempts", { min: 1, max: 3 })
  };
}

export function validateEvaluationRequest(value, { bodyBytes = 0 } = {}) {
  if (bodyBytes > MAX_BODY_BYTES) throw new ContractError("Request body is too large.");
  exactKeys(
    value,
    [
      "run_id",
      "snapshot_id",
      "task_type",
      "candidates",
      "frozen_facts",
      "evaluation_schema_version",
      "model_selection",
      "budget",
      "timeout_ms",
      "retry"
    ],
    ["run_id", "snapshot_id", "task_type", "candidates", "frozen_facts", "evaluation_schema_version"],
    "request"
  );
  const runId = boundedString(value.run_id, "run_id", { max: 80 });
  if (!RUN_ID_PATTERN.test(runId)) throw new ContractError("run_id has an invalid format.");
  const snapshotId = boundedString(value.snapshot_id, "snapshot_id", { max: 128 });
  if (!SNAPSHOT_ID_PATTERN.test(snapshotId)) throw new ContractError("snapshot_id has an invalid format.");
  const taskType = enumValue(value.task_type, "task_type", TASK_TYPES);
  const schemaVersion = enumValue(value.evaluation_schema_version, "evaluation_schema_version", [EVALUATION_SCHEMA_VERSION]);
  const candidates = normalizeCandidates(value.candidates);
  const frozenFacts = normalizeFrozenFacts(value.frozen_facts);
  const modelSelection = normalizeModelSelection(value.model_selection);
  const budget = normalizeBudget(value.budget);
  const timeoutMs = value.timeout_ms === undefined
    ? 12000
    : boundedInteger(value.timeout_ms, "timeout_ms", { min: 1000, max: 30000 });
  const retry = normalizeRetry(value.retry);
  return {
    run_id: runId,
    snapshot_id: snapshotId,
    task_type: taskType,
    candidates,
    frozen_facts: frozenFacts,
    evaluation_schema_version: schemaVersion,
    model_selection: modelSelection,
    budget,
    timeout_ms: timeoutMs,
    retry
  };
}

function normalizeDimensions(value, path) {
  exactKeys(value, DIMENSION_KEYS, DIMENSION_KEYS, path);
  return Object.fromEntries(DIMENSION_KEYS.map((key) => [
    key,
    Number(boundedNumber(value[key], `${path}.${key}`, { min: 0, max: 10 }).toFixed(4))
  ]));
}

export function validateScorecards(value, candidates) {
  if (!Array.isArray(value) || value.length !== candidates.length) {
    throw new ContractError("provider output must contain exactly one scorecard per candidate.");
  }
  const expected = new Set(candidates.map((candidate) => candidate.ticker));
  const seen = new Set();
  const normalized = value.map((item, index) => {
    const path = `scorecards[${index}]`;
    exactKeys(item, ["ticker", "dimensions", "score", "confidence", "risk_flags", "decision"], ["ticker", "dimensions", "score", "confidence", "risk_flags", "decision"], path);
    const ticker = boundedString(item.ticker, `${path}.ticker`, { max: 32 }).toUpperCase();
    if (!expected.has(ticker) || seen.has(ticker)) throw new ContractError(`${path}.ticker does not match the candidate set.`);
    seen.add(ticker);
    if (!Array.isArray(item.risk_flags) || item.risk_flags.length > 12) throw new ContractError(`${path}.risk_flags must contain at most 12 items.`);
    const riskFlags = item.risk_flags.map((flag, flagIndex) => enumValue(flag, `${path}.risk_flags[${flagIndex}]`, RISK_FLAGS));
    return {
      ticker,
      dimensions: normalizeDimensions(item.dimensions, `${path}.dimensions`),
      score: Number(boundedNumber(item.score, `${path}.score`, { min: 0, max: 10 }).toFixed(4)),
      confidence: Number(boundedNumber(item.confidence, `${path}.confidence`, { min: 0, max: 1 }).toFixed(4)),
      risk_flags: [...new Set(riskFlags)],
      decision: enumValue(item.decision, `${path}.decision`, DECISIONS)
    };
  });
  if (seen.size !== expected.size) throw new ContractError("provider output is missing one or more candidate scorecards.");
  return normalized;
}

export function openAiScorecardSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["scorecards"],
    properties: {
      scorecards: {
        type: "array",
        minItems: 1,
        maxItems: MAX_CANDIDATES,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["ticker", "dimensions", "score", "confidence", "risk_flags", "decision"],
          properties: {
            ticker: { type: "string", minLength: 1, maxLength: 32 },
            dimensions: {
              type: "object",
              additionalProperties: false,
              required: [...DIMENSION_KEYS],
              properties: Object.fromEntries(DIMENSION_KEYS.map((key) => [key, { type: "number", minimum: 0, maximum: 10 }]))
            },
            score: { type: "number", minimum: 0, maximum: 10 },
            confidence: { type: "number", minimum: 0, maximum: 1 },
            risk_flags: { type: "array", maxItems: 12, items: { type: "string", enum: [...RISK_FLAGS] } },
            decision: { type: "string", enum: [...DECISIONS] }
          }
        }
      }
    }
  };
}
