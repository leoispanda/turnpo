import { sha256Hex } from "./_security.js";

const DEFAULT_RATE_LIMIT_PER_MINUTE = 30;
const RATE_TTL_SECONDS = 60;
const DAILY_TTL_SECONDS = 2 * 24 * 60 * 60;
const RUN_TTL_SECONDS = 24 * 60 * 60;

function integerLimit(env, key) {
  const value = Number(env[key]);
  return Number.isInteger(value) && value > 0 ? value : null;
}

function usdLimit(env, key) {
  const value = Number(env[key]);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function rateStore(env) {
  const store = env.PDC_RATE_KV || env.AUTH_KV;
  return store && typeof store.get === "function" && typeof store.put === "function" ? store : null;
}

function budgetStore(env) {
  const store = env.PDC_BUDGET_KV || env.PDC_COST_KV;
  return store && typeof store.get === "function" && typeof store.put === "function" ? store : null;
}

function clientIdentity(request) {
  return request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

function isoDate() {
  return new Date().toISOString().slice(0, 10);
}

async function readCounter(store, key) {
  const value = Number(await store.get(key) || "0");
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

async function incrementCounter(store, key, amount, expirationTtl) {
  const current = await readCounter(store, key);
  await store.put(key, String(current + amount), { expirationTtl });
  return current + amount;
}

/**
 * KV counters are deliberately treated as best-effort controls. They fail
 * closed when a configured store cannot be reached, but are not advertised as
 * atomic quota enforcement; Cloudflare edge rate limiting or a Durable Object
 * is required for a hard global limit.
 */
export async function enforceRateLimits({ request, env = {}, token, input }) {
  const store = rateStore(env);
  if (!store) return { allowed: true, status: "NOT_CONFIGURED" };

  const perMinute = integerLimit(env, "PDC_RATE_LIMIT_PER_MINUTE") || DEFAULT_RATE_LIMIT_PER_MINUTE;
  const perRun = integerLimit(env, "PDC_RATE_LIMIT_PER_RUN");
  const perDay = integerLimit(env, "PDC_RATE_LIMIT_PER_DAY");
  const identityHash = await sha256Hex(`${token}|${clientIdentity(request)}`);
  const minuteKey = `pdc:rate:v2:minute:${identityHash}:${Math.floor(Date.now() / 60000)}`;
  const checks = [{ key: minuteKey, limit: perMinute, ttl: RATE_TTL_SECONDS }];
  if (perRun && input?.run_id) {
    checks.push({
      key: `pdc:rate:v2:run:${identityHash}:${input.run_id}`,
      limit: perRun,
      ttl: RUN_TTL_SECONDS
    });
  }
  if (perDay) {
    checks.push({
      key: `pdc:rate:v2:day:${identityHash}:${isoDate()}`,
      limit: perDay,
      ttl: DAILY_TTL_SECONDS
    });
  }

  try {
    for (const check of checks) {
      if (await readCounter(store, check.key) >= check.limit) {
        return { allowed: false, status: "LIMIT_EXCEEDED", errorCode: "RATE_LIMITED" };
      }
    }
    for (const check of checks) await incrementCounter(store, check.key, 1, check.ttl);
    return { allowed: true, status: "ENFORCED" };
  } catch {
    return { allowed: false, status: "STORE_UNAVAILABLE", errorCode: "RATE_LIMIT_STORE_UNAVAILABLE" };
  }
}

function configuredBudgetLimits(env) {
  return {
    totalDaily: usdLimit(env, "PDC_DAILY_TOTAL_BUDGET_USD"),
    providerDaily: usdLimit(env, "PDC_DAILY_PROVIDER_BUDGET_USD"),
    run: usdLimit(env, "PDC_RUN_BUDGET_USD")
  };
}

function budgetKeys({ provider, runId }) {
  const date = isoDate();
  return {
    totalDaily: `pdc:budget:v1:total:${date}`,
    providerDaily: `pdc:budget:v1:provider:${provider}:${date}`,
    run: `pdc:budget:v1:run:${runId}`
  };
}

export async function admitBudget({ env = {}, input, provider }) {
  const limits = configuredBudgetLimits(env);
  const configured = Object.values(limits).some((value) => value !== null);
  if (!configured) return { allowed: true, status: "NOT_CONFIGURED", reservedUsd: 0 };
  const store = budgetStore(env);
  if (!store) return { allowed: false, status: "STORE_NOT_CONFIGURED", errorCode: "BUDGET_STORE_NOT_CONFIGURED" };
  if (input.budget.max_cost_usd === undefined) {
    return { allowed: false, status: "MAX_COST_REQUIRED", errorCode: "BUDGET_MAX_COST_REQUIRED" };
  }

  const reservation = input.budget.max_cost_usd;
  const keys = budgetKeys({ provider, runId: input.run_id });
  const checks = [
    { key: keys.totalDaily, limit: limits.totalDaily },
    { key: keys.providerDaily, limit: limits.providerDaily },
    { key: keys.run, limit: limits.run }
  ].filter((check) => check.limit !== null);
  try {
    for (const check of checks) {
      if ((await readCounter(store, check.key)) + reservation > check.limit) {
        return { allowed: false, status: "LIMIT_EXCEEDED", errorCode: "BUDGET_BLOCKED" };
      }
    }
    return { allowed: true, status: "ADMITTED", reservedUsd: reservation };
  } catch {
    return { allowed: false, status: "STORE_UNAVAILABLE", errorCode: "BUDGET_STORE_UNAVAILABLE" };
  }
}

export async function recordBudget({ env = {}, input, provider, cost }) {
  const limits = configuredBudgetLimits(env);
  const configured = Object.values(limits).some((value) => value !== null);
  if (!configured) return "NOT_CONFIGURED";
  const store = budgetStore(env);
  if (!store) return "STORE_NOT_CONFIGURED";
  const amount = cost?.estimated_usd ?? input.budget.max_cost_usd ?? 0;
  const keys = budgetKeys({ provider, runId: input.run_id });
  const targets = [
    { key: keys.totalDaily, enabled: limits.totalDaily !== null, ttl: DAILY_TTL_SECONDS },
    { key: keys.providerDaily, enabled: limits.providerDaily !== null, ttl: DAILY_TTL_SECONDS },
    { key: keys.run, enabled: limits.run !== null, ttl: RUN_TTL_SECONDS }
  ].filter((target) => target.enabled);
  try {
    for (const target of targets) await incrementCounter(store, target.key, amount, target.ttl);
    return "RECORDED";
  } catch {
    return "RECORD_FAILED";
  }
}
