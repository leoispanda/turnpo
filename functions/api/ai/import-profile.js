import {
  json,
  ownerSession,
  readJson
} from "../auth/_utils.js";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_SOURCE_CHARS = 12000;

function textDocumentFromDraft(draft) {
  return [
    `Title: ${draft.title}`,
    `Year: ${draft.year}`,
    "Type: Life",
    `Summary: ${draft.publicSummary}`,
    `Why it matters: ${draft.whyItMatters}`,
    `Tags: ${(draft.tags || []).join(", ")}`,
    "Images: User updates images manually after reviewing this text draft.",
    "",
    "Review note: This is a text-only draft. Keep it hidden until the profile owner edits, adds any images manually, approves, and chooses to publish it."
  ].join("\n");
}

function extractOutputText(data) {
  if (typeof data.output_text === "string") return data.output_text;
  const content = data.output
    ?.flatMap((item) => item.content || [])
    ?.find((item) => item.type === "output_text" && typeof item.text === "string");
  return content?.text || "";
}

function normalizeDraft(value = {}) {
  const tags = Array.isArray(value.tags) ? value.tags.map(String).filter(Boolean).slice(0, 8) : [];
  const draft = {
    title: String(value.title || "Personal turning point").trim().slice(0, 120),
    year: String(value.year || new Date().getFullYear()).trim().slice(0, 12),
    publicSummary: String(value.publicSummary || value.summary || "").trim().slice(0, 900),
    whyItMatters: String(value.whyItMatters || "").trim().slice(0, 700),
    tags: tags.length ? tags : ["AI draft"],
    analysis: String(value.analysis || "").trim().slice(0, 500)
  };
  draft.copyText = String(value.copyText || value.profileDocument || textDocumentFromDraft(draft)).trim();
  return draft;
}

export async function onRequestPost({ request, env }) {
  const auth = await ownerSession(request, env);
  if (auth.error) return json({ error: auth.error }, { status: auth.status });

  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) return json({ error: "Missing OPENAI_API_KEY." }, { status: 500 });

  const { sourceText = "", profileName = "", username = "" } = await readJson(request);
  const text = String(sourceText || "").trim();
  if (text.length < 20) return json({ error: "Please provide more source text." }, { status: 400 });

  const sourceTextForModel = text.slice(0, MAX_SOURCE_CHARS);
  const model = env.OPENAI_MODEL || DEFAULT_MODEL;

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      instructions: [
        "You generate Turnpo text-only profile drafts from user-provided personal material.",
        "Return only valid JSON matching the schema.",
        "Do not invent images, image URLs, employers, degrees, dates, awards, or private facts.",
        "If details are unclear, keep the wording cautious.",
        "The result must be hidden draft content for owner review, not a published final profile.",
        "Always remind that images must be updated manually by the user."
      ].join(" "),
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                `Profile name: ${profileName || "unknown"}`,
                `Username: ${username || "unknown"}`,
                "",
                "Source text:",
                sourceTextForModel
              ].join("\n")
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "turnpo_text_import_draft",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["title", "year", "publicSummary", "whyItMatters", "tags", "analysis", "copyText"],
            properties: {
              title: { type: "string" },
              year: { type: "string" },
              publicSummary: { type: "string" },
              whyItMatters: { type: "string" },
              tags: {
                type: "array",
                items: { type: "string" }
              },
              analysis: { type: "string" },
              copyText: { type: "string" }
            }
          }
        }
      },
      max_output_tokens: 1400
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return json({ error: data.error?.message || "OpenAI import failed." }, { status: 502 });
  }

  const outputText = extractOutputText(data);
  if (!outputText) return json({ error: "OpenAI did not return a text draft." }, { status: 502 });

  try {
    return json({
      ok: true,
      draft: normalizeDraft(JSON.parse(outputText)),
      provider: "openai",
      model
    });
  } catch {
    return json({ error: "OpenAI returned invalid draft JSON." }, { status: 502 });
  }
}
