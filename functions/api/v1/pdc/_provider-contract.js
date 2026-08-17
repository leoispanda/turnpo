export const PROVIDER_CONTRACT_VERSION = "pdc-provider-v1";

export const CANONICAL_PROVIDER_IDS = Object.freeze([
  "openai",
  "anthropic",
  "gemini",
  "deepseek",
  "kimi"
]);

export const PROVIDER_TASK_TYPES = Object.freeze(["SCORE", "CHALLENGE", "SMOKE"]);

export const PROVIDER_FAILURE_CODES = Object.freeze([
  "SUCCESS",
  "AUTH_FAILED",
  "PROVIDER_NOT_CONFIGURED",
  "PROVIDER_DISABLED",
  "MODEL_NOT_ALLOWED",
  "TIMEOUT",
  "RATE_LIMITED",
  "BUDGET_BLOCKED",
  "NETWORK_ERROR",
  "PROVIDER_ERROR",
  "INVALID_JSON",
  "SCHEMA_FAILED",
  "TASK_NOT_ALLOWED",
  "INVALID_REQUEST"
]);

const MAX_BODY_BYTES = 256 * 1024;
const MAX_PAYLOAD_DEPTH = 12;
const MAX_SCHEMA_DEPTH = 12;
const MAX_STRING_BYTES = 64 * 1024;
const MAX_SYSTEM_INSTRUCTION_BYTES = 64 * 1024;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MODEL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,159}$/;
const SENSITIVE_KEY_PATTERN = /(api[-_]?key|access[-_]?token|auth[-_]?token|password|secret|credential|private[-_]?key)/i;

export class ProviderContractError extends Error {
  constructor(message, issues = []) {
    super(message);
    this.name = "ProviderContractError";
    this.issues = issues.length ? issues : [message];
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, allowed, required, path) {
  if (!isObject(value)) throw new ProviderContractError(`${path} must be an object.`);
  const allowedSet = new Set(allowed);
  const unknown = Object.keys(value).filter((key) => !allowedSet.has(key));
  if (unknown.length) {
    throw new ProviderContractError(`${path} contains unsupported field(s): ${unknown.join(", ")}.`);
  }
  const missing = required.filter((key) => value[key] === undefined);
  if (missing.length) {
    throw new ProviderContractError(`${path} is missing required field(s): ${missing.join(", ")}.`);
  }
}

function stringValue(value, path, { min = 1, max = 200, bytes = MAX_STRING_BYTES } = {}) {
  if (typeof value !== "string") throw new ProviderContractError(`${path} must be a string.`);
  const text = value.trim();
  const size = new TextEncoder().encode(text).byteLength;
  if (text.length < min || text.length > max || size > bytes) {
    throw new ProviderContractError(`${path} must contain ${min}-${max} characters and fit the size limit.`);
  }
  return text;
}

function integerValue(value, path, { min, max }) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new ProviderContractError(`${path} must be an integer between ${min} and ${max}.`);
  }
  return value;
}

function numberValue(value, path, { min, max }) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new ProviderContractError(`${path} must be a number between ${min} and ${max}.`);
  }
  return value;
}

function enumValue(value, path, values) {
  if (!values.includes(value)) {
    throw new ProviderContractError(`${path} must be one of: ${values.join(", ")}.`);
  }
  return value;
}

function scanPayload(value, path, depth = 0) {
  if (depth > MAX_PAYLOAD_DEPTH) throw new ProviderContractError(`${path} is nested too deeply.`);
  if (Array.isArray(value)) {
    if (value.length > 5000) throw new ProviderContractError(`${path} contains too many items.`);
    value.forEach((item, index) => scanPayload(item, `${path}[${index}]`, depth + 1));
    return;
  }
  if (isObject(value)) {
    Object.entries(value).forEach(([key, item]) => {
      if (key.length > 100) throw new ProviderContractError(`${path} contains an invalid field name.`);
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        throw new ProviderContractError(`${path}.${key} is not allowed in provider payload.`);
      }
      scanPayload(item, `${path}.${key}`, depth + 1);
    });
    return;
  }
  if (value !== null && typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
    throw new ProviderContractError(`${path} contains an unsupported JSON value.`);
  }
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new ProviderContractError(`${path} contains a non-finite number.`);
  }
  if (typeof value === "string" && new TextEncoder().encode(value).byteLength > MAX_STRING_BYTES) {
    throw new ProviderContractError(`${path} contains an oversized text value.`);
  }
}

const SCHEMA_KEYS = [
  "$schema",
  "$id",
  "type",
  "title",
  "description",
  "properties",
  "required",
  "items",
  "additionalProperties",
  "enum",
  "const",
  "minimum",
  "maximum",
  "minItems",
  "maxItems",
  "minLength",
  "maxLength"
];
const SCHEMA_TYPES = ["object", "array", "string", "number", "integer", "boolean", "null"];

function validateSchemaNode(schema, path, depth = 0) {
  if (depth > MAX_SCHEMA_DEPTH) throw new ProviderContractError(`${path} is nested too deeply.`);
  if (!isObject(schema)) throw new ProviderContractError(`${path} must be a JSON Schema object.`);
  exactKeys(schema, SCHEMA_KEYS, ["type"], path);
  if (schema.$schema !== undefined) stringValue(schema.$schema, `${path}.$schema`, { max: 300 });
  if (schema.$id !== undefined) stringValue(schema.$id, `${path}.$id`, { max: 300 });
  const type = enumValue(schema.type, `${path}.type`, SCHEMA_TYPES);

  if (schema.enum !== undefined) {
    if (!Array.isArray(schema.enum) || schema.enum.length < 1 || schema.enum.length > 100) {
      throw new ProviderContractError(`${path}.enum must contain 1-100 values.`);
    }
    schema.enum.forEach((value, index) => scanPayload(value, `${path}.enum[${index}]`));
  }
  if (schema.const !== undefined) scanPayload(schema.const, `${path}.const`);
  if (schema.minimum !== undefined) numberValue(schema.minimum, `${path}.minimum`, { min: -1e15, max: 1e15 });
  if (schema.maximum !== undefined) numberValue(schema.maximum, `${path}.maximum`, { min: -1e15, max: 1e15 });

  if (type === "object") {
    if (!isObject(schema.properties)) throw new ProviderContractError(`${path}.properties must be an object.`);
    if (schema.additionalProperties !== false) {
      throw new ProviderContractError(`${path}.additionalProperties must be false.`);
    }
    const propertyNames = Object.keys(schema.properties);
    if (propertyNames.length > 100) throw new ProviderContractError(`${path}.properties contains too many fields.`);
    if (!Array.isArray(schema.required)) throw new ProviderContractError(`${path}.required must be an array.`);
    const propertySet = new Set(propertyNames);
    schema.required.forEach((key, index) => {
      const name = stringValue(key, `${path}.required[${index}]`, { max: 100 });
      if (!propertySet.has(name)) throw new ProviderContractError(`${path}.required contains unknown field ${name}.`);
    });
    propertyNames.forEach((key) => validateSchemaNode(schema.properties[key], `${path}.properties.${key}`, depth + 1));
  }
  if (type === "array") {
    if (schema.items === undefined) throw new ProviderContractError(`${path}.items is required for array schemas.`);
    validateSchemaNode(schema.items, `${path}.items`, depth + 1);
    if (schema.minItems !== undefined) integerValue(schema.minItems, `${path}.minItems`, { min: 0, max: 5000 });
    if (schema.maxItems !== undefined) integerValue(schema.maxItems, `${path}.maxItems`, { min: 0, max: 5000 });
  }
  if (type === "string") {
    if (schema.minLength !== undefined) integerValue(schema.minLength, `${path}.minLength`, { min: 0, max: 100000 });
    if (schema.maxLength !== undefined) integerValue(schema.maxLength, `${path}.maxLength`, { min: 0, max: 100000 });
  }
  return schema;
}

export function validateOutputAgainstSchema(value, schema, path = "output") {
  if (!isObject(schema)) throw new ProviderContractError("response_schema must be a JSON Schema object.");
  const type = schema.type;
  if (schema.enum !== undefined && !schema.enum.some((item) => Object.is(item, value))) {
    throw new ProviderContractError(`${path} does not match enum.`);
  }
  if (schema.const !== undefined && !Object.is(schema.const, value)) {
    throw new ProviderContractError(`${path} does not match const.`);
  }
  if (type === "object") {
    if (!isObject(value)) throw new ProviderContractError(`${path} must be an object.`);
    const properties = schema.properties || {};
    const unknown = Object.keys(value).filter((key) => !Object.prototype.hasOwnProperty.call(properties, key));
    if (schema.additionalProperties === false && unknown.length) {
      throw new ProviderContractError(`${path} contains unsupported field(s): ${unknown.join(", ")}.`);
    }
    for (const key of schema.required || []) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) throw new ProviderContractError(`${path}.${key} is required.`);
    }
    for (const [key, child] of Object.entries(value)) {
      if (Object.prototype.hasOwnProperty.call(properties, key)) {
        validateOutputAgainstSchema(child, properties[key], `${path}.${key}`);
      }
    }
    return value;
  }
  if (type === "array") {
    if (!Array.isArray(value)) throw new ProviderContractError(`${path} must be an array.`);
    if (schema.minItems !== undefined && value.length < schema.minItems) throw new ProviderContractError(`${path} has too few items.`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) throw new ProviderContractError(`${path} has too many items.`);
    value.forEach((item, index) => validateOutputAgainstSchema(item, schema.items, `${path}[${index}]`));
    return value;
  }
  if (type === "string") {
    if (typeof value !== "string") throw new ProviderContractError(`${path} must be a string.`);
    if (schema.minLength !== undefined && value.length < schema.minLength) throw new ProviderContractError(`${path} is too short.`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) throw new ProviderContractError(`${path} is too long.`);
    return value;
  }
  if (type === "number" && (typeof value !== "number" || !Number.isFinite(value))) {
    throw new ProviderContractError(`${path} must be a finite number.`);
  }
  if (type === "integer" && (!Number.isInteger(value) || !Number.isFinite(value))) {
    throw new ProviderContractError(`${path} must be an integer.`);
  }
  if (type === "boolean" && typeof value !== "boolean") throw new ProviderContractError(`${path} must be a boolean.`);
  if (type === "null" && value !== null) throw new ProviderContractError(`${path} must be null.`);
  if ((type === "number" || type === "integer") && schema.minimum !== undefined && value < schema.minimum) {
    throw new ProviderContractError(`${path} is below minimum.`);
  }
  if ((type === "number" || type === "integer") && schema.maximum !== undefined && value > schema.maximum) {
    throw new ProviderContractError(`${path} is above maximum.`);
  }
  return value;
}

export function validateProviderRequest(value, { bodyBytes = 0 } = {}) {
  if (bodyBytes > MAX_BODY_BYTES) throw new ProviderContractError("Request body is too large.");
  exactKeys(
    value,
    [
      "contract_version",
      "request_id",
      "run_id",
      "provider_id",
      "model_id",
      "task_type",
      "system_instruction",
      "payload",
      "response_schema",
      "timeout_ms",
      "max_retries",
      "budget"
    ],
    [
      "contract_version",
      "request_id",
      "run_id",
      "provider_id",
      "model_id",
      "task_type",
      "system_instruction",
      "payload",
      "response_schema"
    ],
    "request"
  );

  const contractVersion = enumValue(value.contract_version, "contract_version", [PROVIDER_CONTRACT_VERSION]);
  const requestId = stringValue(value.request_id, "request_id", { max: 80 });
  if (!UUID_PATTERN.test(requestId)) throw new ProviderContractError("request_id must be a UUID.");
  const runId = stringValue(value.run_id, "run_id", { max: 80 });
  if (!UUID_PATTERN.test(runId)) throw new ProviderContractError("run_id must be a UUID.");
  const providerId = enumValue(value.provider_id, "provider_id", CANONICAL_PROVIDER_IDS);
  const modelId = stringValue(value.model_id, "model_id", { max: 160 });
  if (!MODEL_PATTERN.test(modelId) || modelId.includes("*")) throw new ProviderContractError("model_id has an invalid format.");
  const taskType = enumValue(value.task_type, "task_type", PROVIDER_TASK_TYPES);
  const systemInstruction = stringValue(value.system_instruction, "system_instruction", {
    max: 60000,
    bytes: MAX_SYSTEM_INSTRUCTION_BYTES
  });
  if (!isObject(value.payload)) throw new ProviderContractError("payload must be a JSON object.");
  scanPayload(value.payload, "payload");
  const payloadBytes = new TextEncoder().encode(JSON.stringify(value.payload)).byteLength;
  if (payloadBytes > MAX_BODY_BYTES) throw new ProviderContractError("payload is too large.");

  const responseSchema = validateSchemaNode(value.response_schema, "response_schema");
  if (responseSchema.type !== "object" || responseSchema.additionalProperties !== false) {
    throw new ProviderContractError("response_schema must be a strict object schema with additionalProperties=false.");
  }
  if (taskType === "SMOKE") {
    const payloadKeys = Object.keys(value.payload);
    if (payloadKeys.length !== 1 || value.payload.provider_test !== true) {
      throw new ProviderContractError("SMOKE payload must be exactly {provider_test:true}.");
    }
    const properties = responseSchema.properties || {};
    if (!properties.provider_test || !properties.score || !responseSchema.required.includes("provider_test") || !responseSchema.required.includes("score")) {
      throw new ProviderContractError("SMOKE response_schema must require provider_test and score.");
    }
  }

  const timeoutMs = value.timeout_ms === undefined
    ? 12000
    : integerValue(value.timeout_ms, "timeout_ms", { min: 1000, max: 30000 });
  const maxRetries = value.max_retries === undefined
    ? 1
    : integerValue(value.max_retries, "max_retries", { min: 0, max: 1 });
  let budget = {};
  if (value.budget !== undefined) {
    exactKeys(value.budget, ["max_cost_usd", "max_output_tokens"], [], "budget");
    if (value.budget.max_cost_usd !== undefined) {
      budget.max_cost_usd = numberValue(value.budget.max_cost_usd, "budget.max_cost_usd", { min: 0, max: 1000 });
    }
    if (value.budget.max_output_tokens !== undefined) {
      budget.max_output_tokens = integerValue(value.budget.max_output_tokens, "budget.max_output_tokens", { min: 128, max: 16000 });
    }
  }

  return {
    contract_version: contractVersion,
    request_id: requestId,
    run_id: runId,
    provider_id: providerId,
    model_id: modelId,
    task_type: taskType,
    system_instruction: systemInstruction,
    payload: value.payload,
    response_schema: responseSchema,
    timeout_ms: timeoutMs,
    max_retries: maxRetries,
    budget
  };
}

export function smokeOutputIsExact(output) {
  return isObject(output)
    && Object.keys(output).length === 2
    && output.provider_test === true
    && output.score === 7;
}

export const PROVIDER_CONTRACT_LIMITS = Object.freeze({
  max_body_bytes: MAX_BODY_BYTES,
  max_payload_depth: MAX_PAYLOAD_DEPTH,
  max_schema_depth: MAX_SCHEMA_DEPTH
});
