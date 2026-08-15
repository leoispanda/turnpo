export const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

function sanitizedText(value) {
  return String(value || "")
    .replace(/Bearer\s+[^\s]+/gi, "Bearer [REDACTED]")
    .replace(/\b(?:sk|sess|key|token)[-_][A-Za-z0-9._-]+\b/gi, "[REDACTED]")
    .replace(/https?:\/\/[^\s]+/gi, "[REDACTED_URL]")
    .slice(0, 300) || "UNAVAILABLE";
}

function sanitizedCause(cause) {
  if (!cause) return "NONE";
  if (typeof cause !== "object") return sanitizedText(cause);
  return {
    name: sanitizedText(cause.name || "Error"),
    message: sanitizedText(cause.message),
    ...(cause.code ? { code: sanitizedText(cause.code) } : {})
  };
}

function transportDiagnostic(error, { fetchStarted, responseReceived, timeoutMs }) {
  return {
    fetch_started: fetchStarted ? "YES" : "NO",
    response_received: responseReceived ? "YES" : "NO",
    http_method: "POST",
    upstream_host: "api.openai.com",
    upstream_path: "/v1/responses",
    timeout_state: timeoutMs > 0 ? "ARMED" : "DISABLED",
    timeout_triggered: error?.name === "AbortError" ? "YES" : "NO",
    error_name: sanitizedText(error?.name || "Error"),
    error_message: sanitizedText(error?.message),
    error_cause: sanitizedCause(error?.cause),
    request_context: "Pages Function request handler"
  };
}

/**
 * Shared transport for the OpenAI Responses API.
 *
 * Provider selection, prompts and response validation belong to the caller;
 * this module only owns the existing Turnpo transport details so a new
 * internal execution boundary does not create a second OpenAI client.
 */
export async function fetchOpenAiResponses({ apiKey, body, timeoutMs = 0 }) {
  if (!apiKey) throw new Error("Missing OpenAI API key.");

  const controller = timeoutMs > 0 ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  let fetchStarted = false;
  let responseReceived = false;
  try {
    fetchStarted = true;
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      ...(controller ? { signal: controller.signal } : {}),
      body: JSON.stringify(body)
    });
    responseReceived = true;
    return response;
  } catch (error) {
    Object.defineProperty(error, "__openaiTransportDiagnostic", {
      value: transportDiagnostic(error, { fetchStarted, responseReceived, timeoutMs }),
      enumerable: false,
      configurable: true
    });
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function extractOpenAiOutputText(data) {
  if (typeof data?.output_text === "string") return data.output_text;
  const content = data?.output
    ?.flatMap((item) => item.content || [])
    ?.find((item) => item.type === "output_text" && typeof item.text === "string");
  return content?.text || "";
}
