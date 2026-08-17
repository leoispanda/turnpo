import {
  json,
  requestContentLengthTooLarge
} from "../../../auth/_utils.js";
import { ContractError } from "../_contract.js";
import {
  MAX_PUBLISH_BODY_BYTES,
  PUBLISH_SCHEMA_VERSION,
  canonicalJson,
  validatePublishRequest
} from "../_publish-contract.js";
import { authenticateBearer, requestId, sha256Hex } from "../_security.js";

function errorResponse(id, errorCode, message, status, issues = []) {
  return json({
    schema_version: PUBLISH_SCHEMA_VERSION,
    request_id: id,
    error_code: errorCode,
    message,
    ...(issues.length ? { issues } : {})
  }, { status, headers: { "x-request-id": id } });
}

async function parseBody(request) {
  if (requestContentLengthTooLarge(request, MAX_PUBLISH_BODY_BYTES)) {
    throw new ContractError("Publish request body is too large.");
  }
  const raw = await request.text();
  const bytes = new TextEncoder().encode(raw).byteLength;
  if (bytes > MAX_PUBLISH_BODY_BYTES) throw new ContractError("Publish request body is too large.");
  if (!raw.trim()) throw new ContractError("Publish request body must be a JSON object.");
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("not-object");
    return { value, bytes };
  } catch {
    throw new ContractError("Publish request body must be valid JSON.");
  }
}

function publishStore(env = {}) {
  const store = env.PDC_PUBLISH_KV || env.PDC_RESULT_KV;
  return store && typeof store.get === "function" && typeof store.put === "function" ? store : null;
}

function namespaceFor(mode) {
  return mode === "PRODUCTION" ? "production" : "shadow";
}

function publishKey(namespace, runId) {
  return `pdc:run-publish:v1:${namespace}:${runId}`;
}

function ttlOptions(env) {
  const ttl = Number(env.PDC_PUBLISH_TTL_SECONDS || 365 * 24 * 60 * 60);
  return Number.isInteger(ttl) && ttl > 0 ? { expirationTtl: ttl } : {};
}

async function readRecord(store, key) {
  const value = await store.get(key);
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error("invalid-publish-record");
  }
}

export async function onRequestPost({ request, env = {} }) {
  const id = requestId();
  const authentication = authenticateBearer(request, env, ["LOCAL_PDC_PUBLISH_TOKEN"]);
  if (authentication.status === "NOT_CONFIGURED") {
    return errorResponse(id, "PUBLISH_NOT_CONFIGURED", "Local PDC publish token is not configured.", 503);
  }
  if (authentication.status !== "OK") {
    return errorResponse(id, "UNAUTHORIZED", "A valid Local PDC publish token is required.", 401);
  }

  let parsed;
  try {
    parsed = await parseBody(request);
  } catch (error) {
    return errorResponse(id, "INVALID_REQUEST", error.message, 422, error.issues || []);
  }

  let run;
  try {
    run = validatePublishRequest(parsed.value, { bodyBytes: parsed.bytes });
  } catch (error) {
    return errorResponse(id, "INVALID_REQUEST", error.message, 422, error.issues || []);
  }

  const namespace = namespaceFor(run.mode);
  if (namespace === "production" && String(env.LOCAL_PDC_PUBLISH_PRODUCTION_ENABLED || "").toLowerCase() !== "true") {
    return errorResponse(id, "PRODUCTION_PUBLISH_DISABLED", "Production PDC publish is disabled until an explicit deployment gate is enabled.", 409);
  }
  const store = publishStore(env);
  if (!store) {
    return errorResponse(id, "PUBLISH_STORAGE_NOT_CONFIGURED", "A dedicated PDC_PUBLISH_KV or PDC_RESULT_KV binding is required.", 503);
  }

  const recordSha256 = await sha256Hex(canonicalJson(run));
  const key = publishKey(namespace, run.run_id);
  let existing;
  try {
    existing = await readRecord(store, key);
  } catch {
    return errorResponse(id, "PUBLISH_STORAGE_UNAVAILABLE", "Publish storage could not be read.", 503);
  }
  if (existing) {
    if (existing.record_sha256 === recordSha256) {
      return json({
        schema_version: PUBLISH_SCHEMA_VERSION,
        run_id: run.run_id,
        namespace,
        status: "IDEMPOTENT",
        record_sha256: recordSha256,
        published_at: existing.published_at
      }, { headers: { "x-request-id": id } });
    }
    return errorResponse(id, "RUN_ID_CONFLICT", "The run_id already has a different finalized package.", 409);
  }

  const publishedAt = new Date().toISOString();
  const record = {
    record_sha256: recordSha256,
    published_at: publishedAt,
    namespace,
    package: run
  };
  try {
    await store.put(key, JSON.stringify(record), ttlOptions(env));
  } catch {
    return errorResponse(id, "PUBLISH_STORAGE_UNAVAILABLE", "Publish storage could not be written.", 503);
  }
  console.log(JSON.stringify({
    event: "turnpo_pdc_run_published",
    request_id: id,
    run_id: run.run_id,
    namespace,
    record_sha256: recordSha256
  }));
  return json({
    schema_version: PUBLISH_SCHEMA_VERSION,
    run_id: run.run_id,
    namespace,
    status: "PUBLISHED",
    record_sha256: recordSha256,
    published_at: publishedAt
  }, { status: 201, headers: { "x-request-id": id } });
}

export async function onRequestGet() {
  return errorResponse(requestId(), "METHOD_NOT_ALLOWED", "Use POST to publish a finalized PDC run.", 405);
}
