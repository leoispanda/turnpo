import { CANONICAL_PROVIDER_IDS } from "./_provider-contract.js";

const DEFAULT_TIMEOUT_MS = 12000;
const MAX_RETRIES = 1;

/**
 * The registry contains references and adapter metadata only. Secret values
 * are read from the runtime env at execution time and are never returned by
 * any health or handoff response.
 */
export const PROVIDER_REGISTRY = Object.freeze({
  openai: Object.freeze({
    provider_id: "openai",
    display_name: "OpenAI",
    credential_reference: "OPENAI_API_KEY",
    credential_bindings: Object.freeze(["OPENAI_API_KEY"]),
    model_allowlist_env: "PDC_OPENAI_ALLOWED_MODELS",
    adapter: "openai_responses",
    adapter_key: "openai_responses",
    native_cloudflare_slug: "openai",
    upstream_route: "https://api.openai.com/v1/responses",
    pricing_env: Object.freeze({
      input: "PDC_OPENAI_INPUT_USD_PER_1M",
      output: "PDC_OPENAI_OUTPUT_USD_PER_1M"
    }),
    implementation_status: "IMPLEMENTED_IN_REPOSITORY"
  }),
  anthropic: Object.freeze({
    provider_id: "anthropic",
    display_name: "Claude / Anthropic",
    credential_reference: "claude_api_pdc",
    credential_bindings: Object.freeze(["claude_api_pdc"]),
    model_allowlist_env: "PDC_ANTHROPIC_ALLOWED_MODELS",
    adapter: "anthropic_messages",
    adapter_key: "anthropic_messages",
    native_cloudflare_slug: "anthropic",
    upstream_route: "https://api.anthropic.com/v1/messages",
    pricing_env: Object.freeze({
      input: "PDC_ANTHROPIC_INPUT_USD_PER_1M",
      output: "PDC_ANTHROPIC_OUTPUT_USD_PER_1M"
    }),
    implementation_status: "IMPLEMENTED_IN_REPOSITORY"
  }),
  gemini: Object.freeze({
    provider_id: "gemini",
    display_name: "Gemini / Google AI Studio",
    credential_reference: "Gemini API Key pdc",
    credential_bindings: Object.freeze(["Gemini API Key pdc"]),
    model_allowlist_env: "PDC_GEMINI_ALLOWED_MODELS",
    adapter: "gemini_generate_content",
    adapter_key: "gemini_generate_content",
    native_cloudflare_slug: "google-ai-studio",
    upstream_route: "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
    pricing_env: Object.freeze({
      input: "PDC_GEMINI_INPUT_USD_PER_1M",
      output: "PDC_GEMINI_OUTPUT_USD_PER_1M"
    }),
    implementation_status: "IMPLEMENTED_IN_REPOSITORY"
  }),
  deepseek: Object.freeze({
    provider_id: "deepseek",
    display_name: "DeepSeek",
    credential_reference: "deepseek api pdc",
    credential_bindings: Object.freeze(["deepseek api pdc"]),
    model_allowlist_env: "PDC_DEEPSEEK_ALLOWED_MODELS",
    adapter: "deepseek_chat_completions",
    adapter_key: "deepseek_chat_completions",
    native_cloudflare_slug: "deepseek",
    upstream_route: "https://api.deepseek.com/chat/completions",
    pricing_env: Object.freeze({
      input: "PDC_DEEPSEEK_INPUT_USD_PER_1M",
      output: "PDC_DEEPSEEK_OUTPUT_USD_PER_1M"
    }),
    implementation_status: "IMPLEMENTED_IN_REPOSITORY"
  }),
  kimi: Object.freeze({
    provider_id: "kimi",
    display_name: "Kimi / Moonshot",
    credential_reference: "kimi pdc",
    credential_bindings: Object.freeze(["kimi pdc"]),
    model_allowlist_env: "PDC_KIMI_ALLOWED_MODELS",
    adapter: "kimi_chat_completions",
    adapter_key: "kimi_chat_completions",
    native_cloudflare_slug: "moonshot",
    upstream_route: "https://api.moonshot.ai/v1/chat/completions",
    pricing_env: Object.freeze({
      input: "PDC_KIMI_INPUT_USD_PER_1M",
      output: "PDC_KIMI_OUTPUT_USD_PER_1M"
    }),
    implementation_status: "IMPLEMENTED_IN_REPOSITORY"
  })
});

const LEGACY_PROVIDER_ALIASES = Object.freeze({ claude: "anthropic" });

function canonicalProviderId(providerId) {
  const value = String(providerId || "").trim().toLowerCase();
  return LEGACY_PROVIDER_ALIASES[value] || value;
}

export function getProviderDefinition(providerId) {
  return PROVIDER_REGISTRY[canonicalProviderId(providerId)] || null;
}

export function configuredCredentialBinding(env = {}, definition) {
  if (!definition) return null;
  return definition.credential_bindings.find((binding) => Boolean(String(env[binding] || "").trim())) || null;
}

export function credentialStatus(env = {}, definition) {
  return configuredCredentialBinding(env, definition) ? "PRESENT" : "MISSING";
}

export function allowedModelsForProvider(env = {}, providerId) {
  const definition = getProviderDefinition(providerId);
  if (!definition || !definition.model_allowlist_env) return [];
  return String(env[definition.model_allowlist_env] || "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
}

function configuredTimeout(env, providerId) {
  const definition = getProviderDefinition(providerId);
  const key = definition ? `PDC_${definition.provider_id.toUpperCase()}_TIMEOUT_MS` : "";
  const value = Number(key ? env[key] : NaN);
  return Number.isInteger(value) && value >= 1000 ? Math.min(value, 30000) : DEFAULT_TIMEOUT_MS;
}

function operatorHealth(env, providerId) {
  const value = String(env[`PDC_PROVIDER_HEALTH_${providerId.toUpperCase()}`] || "")
    .trim()
    .toUpperCase();
  return value === "READY" || value === "DISABLED" ? value : "UNVERIFIED";
}

export function providerHealth(env = {}, providerId) {
  const definition = getProviderDefinition(providerId);
  if (!definition) return null;
  const credential = credentialStatus(env, definition);
  const allowedModels = allowedModelsForProvider(env, definition.provider_id);
  const operatorStatus = operatorHealth(env, definition.provider_id);
  const hasAdapter = Boolean(definition.adapter_key);
  const configured = credential === "PRESENT" && allowedModels.length > 0 && hasAdapter;
  let healthStatus = "UNVERIFIED";
  if (operatorStatus === "DISABLED") healthStatus = "DISABLED";
  else if (!hasAdapter) healthStatus = "ADAPTER_NOT_REGISTERED";
  else if (credential === "MISSING") healthStatus = "NOT_CONFIGURED";
  else if (!allowedModels.length) healthStatus = "MODEL_ALLOWLIST_MISSING";
  else if (operatorStatus === "READY") healthStatus = "READY";

  return {
    provider_id: definition.provider_id,
    display_name: definition.display_name,
    enabled: configured && operatorStatus !== "DISABLED",
    credential_reference: definition.credential_reference,
    credential_status: credential,
    allowed_models: allowedModels,
    adapter: definition.adapter,
    adapter_registered: hasAdapter,
    implementation_status: definition.implementation_status,
    timeout_ms: configuredTimeout(env, definition.provider_id),
    max_retries: MAX_RETRIES,
    health_status: healthStatus,
    status: healthStatus,
    health_attestation: operatorStatus === "READY" ? "OPERATOR_ATTESTED" : "UNVERIFIED"
  };
}

export function providerRegistrySnapshot(env = {}) {
  return CANONICAL_PROVIDER_IDS.map((providerId) => providerHealth(env, providerId));
}

export function providerIsEnabled(env = {}, providerId) {
  return Boolean(providerHealth(env, providerId)?.enabled);
}

export function pricingEnvironment(providerId) {
  return getProviderDefinition(providerId)?.pricing_env || null;
}

export const PROVIDER_IDS = CANONICAL_PROVIDER_IDS;
