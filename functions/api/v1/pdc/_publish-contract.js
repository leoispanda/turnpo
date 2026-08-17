import {
  ContractError,
  DECISIONS,
  EXECUTION_MODES,
  PROVIDER_IDS,
  RISK_FLAGS
} from "./_contract.js";

export const PUBLISH_SCHEMA_VERSION = "pdc-run-publish-v1";
export const MAX_PUBLISH_BODY_BYTES = 512 * 1024;

const SHA256_PATTERN = /^[a-f0-9]{64}$/i;
const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$/;
const SNAPSHOT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{2,127}$/;
const TICKER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,31}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

function stringValue(value, path, { min = 1, max = 240 } = {}) {
  if (typeof value !== "string") throw new ContractError(`${path} must be a string.`);
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    throw new ContractError(`${path} must contain ${min}-${max} characters.`);
  }
  return normalized;
}

function integerValue(value, path, { min, max }) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new ContractError(`${path} must be an integer between ${min} and ${max}.`);
  }
  return value;
}

function numberValue(value, path, { min, max }) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new ContractError(`${path} must be a number between ${min} and ${max}.`);
  }
  return Number(value.toFixed(4));
}

function enumValue(value, path, values) {
  if (!values.includes(value)) throw new ContractError(`${path} must be one of: ${values.join(", ")}.`);
  return value;
}

function shaValue(value, path) {
  const sha = stringValue(value, path, { max: 64 }).toLowerCase();
  if (!SHA256_PATTERN.test(sha)) throw new ContractError(`${path} must be a SHA-256 digest.`);
  return sha;
}

function tickerValue(value, path) {
  const ticker = stringValue(value, path, { max: 32 }).toUpperCase();
  if (!TICKER_PATTERN.test(ticker)) throw new ContractError(`${path} has an invalid format.`);
  return ticker;
}

function normalizeFlags(value, path) {
  if (!Array.isArray(value) || value.length > 12) throw new ContractError(`${path} must contain at most 12 flags.`);
  return [...new Set(value.map((flag, index) => enumValue(flag, `${path}[${index}]`, RISK_FLAGS)))];
}

function normalizeUsage(value, path) {
  exactKeys(value, ["input_tokens", "output_tokens", "total_tokens", "retry_count"], ["input_tokens", "output_tokens", "total_tokens", "retry_count"], path);
  const normalizeTokenCount = (item, itemPath) => item === null
    ? null
    : integerValue(item, itemPath, { min: 0, max: 100000000 });
  return {
    input_tokens: normalizeTokenCount(value.input_tokens, `${path}.input_tokens`),
    output_tokens: normalizeTokenCount(value.output_tokens, `${path}.output_tokens`),
    total_tokens: normalizeTokenCount(value.total_tokens, `${path}.total_tokens`),
    retry_count: integerValue(value.retry_count, `${path}.retry_count`, { min: 0, max: 3 })
  };
}

function normalizeProviderResults(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 5) {
    throw new ContractError("provider_results must contain 1-5 items.");
  }
  const seen = new Set();
  return value.map((item, index) => {
    const path = `provider_results[${index}]`;
    exactKeys(item, ["provider", "model", "status", "validation_status", "usage", "estimated_cost_usd"], ["provider", "model", "status", "validation_status", "usage", "estimated_cost_usd"], path);
    const provider = enumValue(item.provider, `${path}.provider`, PROVIDER_IDS);
    if (seen.has(provider)) throw new ContractError(`provider_results contains duplicate provider ${provider}.`);
    seen.add(provider);
    const status = enumValue(item.status, `${path}.status`, ["COMPLETED", "FAILED", "NOT_RUN"]);
    const validationStatus = enumValue(item.validation_status, `${path}.validation_status`, ["VALID", "INVALID", "NOT_RUN"]);
    if (status === "COMPLETED" && validationStatus !== "VALID") {
      throw new ContractError(`${path} cannot mark a completed provider result as invalid.`);
    }
    return {
      provider,
      model: stringValue(item.model, `${path}.model`, { max: 160 }),
      status,
      validation_status: validationStatus,
      usage: normalizeUsage(item.usage, `${path}.usage`),
      estimated_cost_usd: item.estimated_cost_usd === null
        ? null
        : numberValue(item.estimated_cost_usd, `${path}.estimated_cost_usd`, { min: 0, max: 100000 })
    };
  });
}

function normalizeRankings(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 100) {
    throw new ContractError("final_rankings must contain 1-100 items.");
  }
  const seenTickers = new Set();
  const seenRanks = new Set();
  return value.map((item, index) => {
    const path = `final_rankings[${index}]`;
    exactKeys(item, ["ticker", "rank", "score", "decision", "risk_flags"], ["ticker", "rank", "score", "decision", "risk_flags"], path);
    const ticker = tickerValue(item.ticker, `${path}.ticker`);
    if (seenTickers.has(ticker)) throw new ContractError(`${path}.ticker is duplicated.`);
    seenTickers.add(ticker);
    const rank = integerValue(item.rank, `${path}.rank`, { min: 1, max: 100000 });
    if (seenRanks.has(rank)) throw new ContractError(`${path}.rank is duplicated.`);
    seenRanks.add(rank);
    return {
      ticker,
      rank,
      score: numberValue(item.score, `${path}.score`, { min: 0, max: 10 }),
      decision: enumValue(item.decision, `${path}.decision`, DECISIONS),
      risk_flags: normalizeFlags(item.risk_flags, `${path}.risk_flags`)
    };
  });
}

function normalizeDecisions(value, rankingTickers) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 100) {
    throw new ContractError("decisions must contain 1-100 items.");
  }
  const seen = new Set();
  const normalized = value.map((item, index) => {
    const path = `decisions[${index}]`;
    exactKeys(item, ["ticker", "decision", "risk_flags"], ["ticker", "decision", "risk_flags"], path);
    const ticker = tickerValue(item.ticker, `${path}.ticker`);
    if (seen.has(ticker)) throw new ContractError(`${path}.ticker is duplicated.`);
    seen.add(ticker);
    return {
      ticker,
      decision: enumValue(item.decision, `${path}.decision`, DECISIONS),
      risk_flags: normalizeFlags(item.risk_flags, `${path}.risk_flags`)
    };
  });
  const expected = new Set(rankingTickers);
  if (seen.size !== expected.size || [...expected].some((ticker) => !seen.has(ticker))) {
    throw new ContractError("decisions must cover exactly the final ranking tickers.");
  }
  return normalized;
}

function normalizeArtifacts(value) {
  if (!Array.isArray(value) || value.length > 50) throw new ContractError("artifacts must contain at most 50 items.");
  return value.map((item, index) => {
    const path = `artifacts[${index}]`;
    exactKeys(item, ["name", "sha256", "size_bytes", "content_type", "ref"], ["name", "sha256", "size_bytes", "content_type", "ref"], path);
    return {
      name: stringValue(item.name, `${path}.name`, { max: 160 }),
      sha256: shaValue(item.sha256, `${path}.sha256`),
      size_bytes: integerValue(item.size_bytes, `${path}.size_bytes`, { min: 0, max: 50 * 1024 * 1024 }),
      content_type: stringValue(item.content_type, `${path}.content_type`, { max: 120 }),
      ref: stringValue(item.ref, `${path}.ref`, { max: 512 })
    };
  });
}

function normalizeCreatedAt(value) {
  const createdAt = stringValue(value, "created_at", { max: 80 });
  if (!createdAt.includes("T") || !createdAt.endsWith("Z") || !Number.isFinite(Date.parse(createdAt))) {
    throw new ContractError("created_at must be an ISO-8601 UTC timestamp.");
  }
  return createdAt;
}

export function validatePublishRequest(value, { bodyBytes = 0 } = {}) {
  if (bodyBytes > MAX_PUBLISH_BODY_BYTES) throw new ContractError("Publish request body is too large.");
  exactKeys(
    value,
    [
      "schema_version", "run_id", "run_date", "snapshot_id", "pdc_version", "config_hash", "code_hash",
      "mode", "status", "validation_status", "candidate_count", "provider_results", "final_rankings",
      "decisions", "risk_flags", "cost_summary", "execution_summary", "artifacts", "created_at"
    ],
    [
      "schema_version", "run_id", "run_date", "snapshot_id", "pdc_version", "config_hash", "code_hash",
      "mode", "status", "validation_status", "candidate_count", "provider_results", "final_rankings",
      "decisions", "risk_flags", "cost_summary", "execution_summary", "artifacts", "created_at"
    ],
    "publish_request"
  );
  if (value.schema_version !== PUBLISH_SCHEMA_VERSION) throw new ContractError("schema_version must be pdc-run-publish-v1.");
  const runId = stringValue(value.run_id, "run_id", { max: 80 });
  if (!RUN_ID_PATTERN.test(runId)) throw new ContractError("run_id has an invalid format.");
  const runDate = stringValue(value.run_date, "run_date", { max: 10 });
  if (!DATE_PATTERN.test(runDate) || !Number.isFinite(Date.parse(`${runDate}T00:00:00Z`))) throw new ContractError("run_date must use YYYY-MM-DD.");
  const snapshotId = stringValue(value.snapshot_id, "snapshot_id", { max: 128 });
  if (!SNAPSHOT_ID_PATTERN.test(snapshotId)) throw new ContractError("snapshot_id has an invalid format.");
  const mode = enumValue(value.mode, "mode", EXECUTION_MODES);
  if (value.status !== "FINALIZED") throw new ContractError("Only FINALIZED runs may be published.");
  if (value.validation_status !== "PASS") throw new ContractError("Only validation_status PASS may be published.");
  const finalRankings = normalizeRankings(value.final_rankings);
  const decisions = normalizeDecisions(value.decisions, finalRankings.map((item) => item.ticker));

  exactKeys(value.cost_summary, ["currency", "total_estimated_usd", "pricing_status", "tracking_status"], ["currency", "total_estimated_usd", "pricing_status", "tracking_status"], "cost_summary");
  if (value.cost_summary.currency !== "USD") throw new ContractError("cost_summary.currency must be USD.");
  const costSummary = {
    currency: "USD",
    total_estimated_usd: value.cost_summary.total_estimated_usd === null
      ? null
      : numberValue(value.cost_summary.total_estimated_usd, "cost_summary.total_estimated_usd", { min: 0, max: 100000 }),
    pricing_status: enumValue(value.cost_summary.pricing_status, "cost_summary.pricing_status", ["CONFIGURED", "NOT_CONFIGURED", "USAGE_UNAVAILABLE"]),
    tracking_status: enumValue(value.cost_summary.tracking_status, "cost_summary.tracking_status", ["PERSISTED", "LOGGED_ONLY", "NOT_CONFIGURED"])
  };

  exactKeys(value.execution_summary, ["stage_count", "completed_stage_count", "checkpoint_status", "research_only", "live_trading"], ["stage_count", "completed_stage_count", "checkpoint_status", "research_only", "live_trading"], "execution_summary");
  const stageCount = integerValue(value.execution_summary.stage_count, "execution_summary.stage_count", { min: 1, max: 100 });
  const completedStageCount = integerValue(value.execution_summary.completed_stage_count, "execution_summary.completed_stage_count", { min: 1, max: 100 });
  if (completedStageCount > stageCount) throw new ContractError("completed_stage_count cannot exceed stage_count.");
  if (value.execution_summary.research_only !== true) throw new ContractError("execution_summary.research_only must be true.");
  if (value.execution_summary.live_trading !== false) throw new ContractError("execution_summary.live_trading must be false.");

  return {
    schema_version: PUBLISH_SCHEMA_VERSION,
    run_id: runId,
    run_date: runDate,
    snapshot_id: snapshotId,
    pdc_version: stringValue(value.pdc_version, "pdc_version", { max: 160 }),
    config_hash: shaValue(value.config_hash, "config_hash"),
    code_hash: shaValue(value.code_hash, "code_hash"),
    mode,
    status: "FINALIZED",
    validation_status: "PASS",
    candidate_count: integerValue(value.candidate_count, "candidate_count", { min: 1, max: 100000 }),
    provider_results: normalizeProviderResults(value.provider_results),
    final_rankings: finalRankings,
    decisions,
    risk_flags: normalizeFlags(value.risk_flags, "risk_flags"),
    cost_summary: costSummary,
    execution_summary: {
      stage_count: stageCount,
      completed_stage_count: completedStageCount,
      checkpoint_status: enumValue(value.execution_summary.checkpoint_status, "execution_summary.checkpoint_status", ["COMPLETE", "PARTIAL", "NOT_APPLICABLE"]),
      research_only: true,
      live_trading: false
    },
    artifacts: normalizeArtifacts(value.artifacts),
    created_at: normalizeCreatedAt(value.created_at)
  };
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isObject(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
