import {
  clientRateKey,
  incrementWindow,
  json,
  normalizeUsername,
  ownerSession,
  readJson,
  requestContentLengthTooLarge,
  requestKey,
  validateJsonMutationRequest
} from "../auth/_utils.js";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_SOURCE_CHARS = 12000;
const MAX_AI_IMPORT_BODY_BYTES = 64 * 1024;
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

function textDocumentFromDraft(draft) {
  return [
    `Title: ${draft.title}`,
    `Year: ${draft.year}`,
    `Month: ${draft.month}`,
    `Location: ${draft.location}`,
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

function extractMonth(value = "") {
  const englishMonth = MONTH_NAMES.find((month) => new RegExp(`\\b${month}\\b`, "i").test(value));
  if (englishMonth) return englishMonth;

  const numericMatch = String(value).match(/(?:^|[^\d])(1[0-2]|0?[1-9])\s*(?:月|月份|month\b)/i);
  if (numericMatch) return MONTH_NAMES[Number(numericMatch[1]) - 1];

  return "";
}

function normalizeMonth(value = "", sourceText = "") {
  return extractMonth(sourceText) || extractMonth(value) || MONTH_NAMES[new Date().getMonth()];
}

function normalizeDraft(value = {}, sourceText = "", profileLocation = "") {
  const tags = Array.isArray(value.tags) ? value.tags.map(String).filter(Boolean).slice(0, 8) : [];
  const draft = {
    title: String(value.title || "Personal turning point").trim().slice(0, 120),
    year: String(value.year || new Date().getFullYear()).trim().slice(0, 12),
    month: normalizeMonth(value.month, sourceText),
    location: String(value.location || profileLocation || "Unknown").trim().slice(0, 120),
    publicSummary: String(value.publicSummary || value.summary || "").trim().slice(0, 900),
    whyItMatters: String(value.whyItMatters || "").trim().slice(0, 700),
    tags: tags.length ? tags : ["AI draft"],
    analysis: String(value.analysis || "").trim().slice(0, 500)
  };
  draft.copyText = textDocumentFromDraft(draft);
  return draft;
}

export async function onRequestPost({ request, env }) {
  const requestError = validateJsonMutationRequest(request);
  if (requestError) return json({ error: requestError.error }, { status: requestError.status });
  if (requestContentLengthTooLarge(request, MAX_AI_IMPORT_BODY_BYTES)) {
    return json({ error: "AI import request is too large." }, { status: 413 });
  }

  const auth = await ownerSession(request, env);
  if (auth.error) return json({ error: auth.error }, { status: auth.status });

  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) return json({ error: "Missing OPENAI_API_KEY." }, { status: 500 });

  const {
    sourceText = "",
    profileName = "",
    profileLocation = "",
    username = ""
  } = await readJson(request);
  const sessionProfile = normalizeUsername(auth.session.profile || "");
  const submittedUsername = normalizeUsername(username || "");
  if (submittedUsername && submittedUsername !== sessionProfile) {
    return json({ error: "Not allowed for this profile." }, { status: 403 });
  }
  const rateIdentity = auth.session.email || sessionProfile || "owner";
  const attempts = await incrementWindow(env, requestKey(`ai-import:${rateIdentity}`), 60 * 60);
  if (attempts > 20) return json({ error: "Too many AI import requests. Please try again later." }, { status: 429 });
  const clientAttempts = await incrementWindow(env, clientRateKey(request, "ai-import", rateIdentity), 60 * 60);
  if (clientAttempts > 30) return json({ error: "Too many AI import requests. Please try again later." }, { status: 429 });

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
        "Write every generated field in natural English, regardless of the source language.",
        "Translate non-English source material into concise, natural English suitable for the Turnpo website.",
        "Identify every distinct life event, post, role, course, trip, achievement, or turning point in the source.",
        "Return each distinct item as a separate draft. Never merge unrelated items into one draft.",
        "Use changes in date, location, role, event, heading, URL, or topic as evidence that a new draft should begin.",
        "Preserve the source order. Return one draft only when the source genuinely describes one event.",
        "Return no more than 20 drafts.",
        "For each draft, include sourceExcerpt containing the exact short portion of source text used for that draft.",
        "Except for sourceExcerpt, do not copy the source text verbatim into generated fields.",
        "Transform the source into a polished Turnpo draft with clear structure, owner-reviewed wording, and cautious interpretation.",
        "For very short input, produce a concise but meaningfully rewritten draft and mention what the owner may want to add during review.",
        "Do not invent images, image URLs, employers, degrees, dates, awards, or private facts.",
        "Extract the month explicitly stated or requested in the source text. For example, 7月 or July must return month as July; never replace it with the current month.",
        "Return month as a full English month name from January through December.",
        "Only use the current month when the source text contains no month at all.",
        "Extract the location where the described event happened, not the profile owner's home location.",
        "Translate or romanize non-English place names into the standard English place name used internationally.",
        `If the source contains no event location, use this profile location as the fallback: ${String(profileLocation || "Unknown").slice(0, 120)}.`,
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
          name: "turnpo_text_import_drafts",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["drafts"],
            properties: {
              drafts: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["sourceExcerpt", "title", "year", "month", "location", "publicSummary", "whyItMatters", "tags", "analysis"],
                  properties: {
                    sourceExcerpt: { type: "string" },
                    title: { type: "string" },
                    year: { type: "string" },
                    month: {
                      type: "string",
                      enum: MONTH_NAMES
                    },
                    location: { type: "string" },
                    publicSummary: { type: "string" },
                    whyItMatters: { type: "string" },
                    tags: {
                      type: "array",
                      items: { type: "string" }
                    },
                    analysis: { type: "string" }
                  }
                }
              }
            }
          }
        }
      },
      max_output_tokens: 8000
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return json({ error: data.error?.message || "OpenAI import failed." }, { status: 502 });
  }

  const outputText = extractOutputText(data);
  if (!outputText) return json({ error: "OpenAI did not return a text draft." }, { status: 502 });

  try {
    const parsed = JSON.parse(outputText);
    const values = Array.isArray(parsed.drafts) ? parsed.drafts.slice(0, 20) : [];
    if (!values.length) throw new Error("No drafts");
    return json({
      ok: true,
      drafts: values.map((value) => normalizeDraft(
        value,
        String(value.sourceExcerpt || ""),
        profileLocation
      )),
      provider: "openai",
      model
    });
  } catch {
    return json({ error: "OpenAI returned invalid draft JSON." }, { status: 502 });
  }
}
