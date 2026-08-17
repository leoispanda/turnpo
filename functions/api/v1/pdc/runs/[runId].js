import { json } from "../../../auth/_utils.js";
import { PUBLISH_SCHEMA_VERSION } from "../_publish-contract.js";
import { authenticateBearer, requestId, safeRunId } from "../_security.js";

function errorResponse(id, errorCode, message, status) {
  return json({
    schema_version: PUBLISH_SCHEMA_VERSION,
    request_id: id,
    error_code: errorCode,
    message
  }, { status, headers: { "x-request-id": id } });
}

function publishStore(env = {}) {
  const store = env.PDC_PUBLISH_KV || env.PDC_RESULT_KV;
  return store && typeof store.get === "function" ? store : null;
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

export async function onRequestGet({ request, env = {}, params = {} }) {
  const id = requestId();
  const authentication = authenticateBearer(request, env, ["LOCAL_PDC_PUBLISH_TOKEN"]);
  if (authentication.status === "NOT_CONFIGURED") return errorResponse(id, "PUBLISH_NOT_CONFIGURED", "Local PDC publish token is not configured.", 503);
  if (authentication.status !== "OK") return errorResponse(id, "UNAUTHORIZED", "A valid Local PDC publish token is required.", 401);

  const runId = safeRunId(params.runId);
  if (!runId) return errorResponse(id, "INVALID_REQUEST", "runId has an invalid format.", 422);
  const namespace = new URL(request.url).searchParams.get("namespace") === "production" ? "production" : "shadow";
  if (namespace === "production" && String(env.LOCAL_PDC_PUBLISH_PRODUCTION_ENABLED || "").toLowerCase() !== "true") {
    return errorResponse(id, "PRODUCTION_READ_DISABLED", "Production PDC read is disabled.", 403);
  }
  const store = publishStore(env);
  if (!store) return errorResponse(id, "PUBLISH_STORAGE_NOT_CONFIGURED", "A dedicated PDC_PUBLISH_KV or PDC_RESULT_KV binding is required.", 503);

  let record;
  try {
    record = await readRecord(store, `pdc:run-publish:v1:${namespace}:${runId}`);
  } catch {
    return errorResponse(id, "PUBLISH_STORAGE_UNAVAILABLE", "Publish storage could not be read.", 503);
  }
  if (!record) return errorResponse(id, "RUN_NOT_FOUND", "The requested PDC run was not found.", 404);
  return json({
    schema_version: PUBLISH_SCHEMA_VERSION,
    run_id: runId,
    namespace,
    status: "PUBLISHED",
    record_sha256: record.record_sha256,
    published_at: record.published_at,
    package: record.package
  }, { headers: { "x-request-id": id } });
}

export async function onRequestPost() {
  return errorResponse(requestId(), "METHOD_NOT_ALLOWED", "Use POST to publish a finalized PDC run.", 405);
}
