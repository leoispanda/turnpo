export const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

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
  try {
    return await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      ...(controller ? { signal: controller.signal } : {}),
      body: JSON.stringify(body)
    });
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
