import {
  clientRateKey,
  incrementWindow,
  json,
  readJson,
  requestContentLengthTooLarge,
  validateJsonMutationRequest
} from "../auth/_utils.js";

const MAX_JOB_SEARCH_BODY_BYTES = 32 * 1024;
const MAX_MARKDOWN_CHARS = 24000;
const MAX_RESULTS = 24;
const MAX_SEARCHES_PER_HOUR = 40;
const REQUEST_TIMEOUT_MS = 8000;
const ARBEITNOW_URL = "https://www.arbeitnow.com/api/job-board-api";
const REMOTIVE_URL = "https://remotive.com/api/remote-jobs";

const SEARCH_PHRASES = [
  "AI knowledge management",
  "knowledge management",
  "learning solution design",
  "technical training",
  "AI enablement",
  "workflow transformation",
  "business process improvement",
  "product operations",
  "project management",
  "stakeholder management",
  "technical enablement",
  "learning and development",
  "knowledge strategy",
  "internal AI tools"
];

const FOCUS_TERMS = [
  "ai",
  "artificial intelligence",
  "knowledge",
  "learning",
  "training",
  "enablement",
  "workflow",
  "transformation",
  "product",
  "project",
  "program",
  "stakeholder",
  "solution",
  "systems"
];

const LOCATION_TERMS = ["eindhoven", "veldhoven", "netherlands", "amsterdam", "remote", "hybrid"];
const RISK_TERMS = ["fluent dutch", "native dutch", "dutch required", "senior software engineer", "backend engineer", "frontend engineer"];

function cleanText(value = "", maxLength = 1200) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function safeUrl(value = "") {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function normalizeId(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function uniqueStrings(values = [], maxItems = 12) {
  const seen = new Set();
  return values
    .map((value) => cleanText(value, 80))
    .filter((value) => {
      const key = value.toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, maxItems);
}

function queriesFromMarkdown(markdown = "") {
  const text = String(markdown || "").toLowerCase();
  const phraseHits = SEARCH_PHRASES.filter((phrase) => text.includes(phrase.toLowerCase()));
  const focusHits = FOCUS_TERMS.filter((term) => text.includes(term));
  const queries = uniqueStrings([...phraseHits, ...focusHits], 8);
  return queries.length ? queries : ["knowledge management", "learning and development", "AI enablement"];
}

async function fetchJsonWithTimeout(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`.trim());
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

function summarize(description = "") {
  const text = cleanText(description, 5000);
  return text.length > 320 ? `${text.slice(0, 317).trim()}...` : text;
}

function normalizeArbeitnowJob(job = {}) {
  const url = safeUrl(job.url || "");
  const tags = uniqueStrings([...(job.tags || []), ...(job.job_types || [])], 10);
  const title = cleanText(job.title || "", 220);
  const company = cleanText(job.company_name || "", 160);
  return {
    kind: "job",
    id: normalizeId(`arbeitnow-${job.slug || url || company}-${title}`),
    title,
    company,
    location: cleanText(job.location || (job.remote ? "Remote" : ""), 180),
    source: "arbeitnow",
    platform: "Arbeitnow",
    url,
    description: cleanText(job.description || "", 5000),
    summary: summarize(job.description || ""),
    searchKeywords: tags,
    status: "queued",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function normalizeRemotiveJob(job = {}) {
  const url = safeUrl(job.url || "");
  const title = cleanText(job.title || "", 220);
  const company = cleanText(job.company_name || "", 160);
  const tags = uniqueStrings([job.category, ...(job.tags || []), job.job_type], 10);
  return {
    kind: "job",
    id: normalizeId(`remotive-${job.id || url || company}-${title}`),
    title,
    company,
    location: cleanText(job.candidate_required_location || "Remote", 180),
    source: "remotive",
    platform: "Remotive",
    url,
    description: cleanText(job.description || "", 5000),
    summary: summarize(job.description || ""),
    searchKeywords: tags,
    status: "queued",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function scoreJob(job, queries) {
  const text = [
    job.title,
    job.company,
    job.location,
    job.description,
    job.summary,
    ...(job.searchKeywords || [])
  ].join(" ").toLowerCase();
  let score = 0;
  for (const query of queries) {
    const normalized = query.toLowerCase();
    if (text.includes(normalized)) score += normalized.includes(" ") ? 16 : 8;
  }
  for (const term of FOCUS_TERMS) {
    if (text.includes(term)) score += 4;
  }
  for (const term of LOCATION_TERMS) {
    if (text.includes(term)) score += 6;
  }
  if (text.includes("hybrid")) score += 5;
  if (text.includes("remote")) score += 4;
  if (job.url) score += 2;
  for (const term of RISK_TERMS) {
    if (text.includes(term)) score -= 7;
  }
  return Math.max(0, Math.min(100, score));
}

function dedupeJobs(jobs = []) {
  const seen = new Set();
  return jobs.filter((job) => {
    const key = (job.url || `${job.company}-${job.title}-${job.location}`).toLowerCase();
    if (!job.title || !key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchArbeitnow(errors) {
  try {
    const data = await fetchJsonWithTimeout(ARBEITNOW_URL);
    return Array.isArray(data?.data) ? data.data.map(normalizeArbeitnowJob) : [];
  } catch (error) {
    errors.push(`Arbeitnow: ${error.message || "unavailable"}`);
    return [];
  }
}

async function fetchRemotive(queries, errors) {
  const topQueries = queries.slice(0, 3);
  const batches = await Promise.all(topQueries.map(async (query) => {
    try {
      const data = await fetchJsonWithTimeout(`${REMOTIVE_URL}?search=${encodeURIComponent(query)}`);
      return Array.isArray(data?.jobs) ? data.jobs.map(normalizeRemotiveJob) : [];
    } catch (error) {
      errors.push(`Remotive ${query}: ${error.message || "unavailable"}`);
      return [];
    }
  }));
  return batches.flat();
}

export async function onRequestPost({ request, env = {} }) {
  const requestError = validateJsonMutationRequest(request);
  if (requestError) return json({ error: requestError.error }, { status: requestError.status });
  if (requestContentLengthTooLarge(request, MAX_JOB_SEARCH_BODY_BYTES)) {
    return json({ error: "Job search request is too large." }, { status: 413 });
  }
  if (env.AUTH_KV) {
    const clientAttempts = await incrementWindow(env, clientRateKey(request, "jobs-search"), 60 * 60);
    if (clientAttempts > MAX_SEARCHES_PER_HOUR) {
      return json({ error: "Too many job searches. Please try again later." }, { status: 429 });
    }
  }

  const body = await readJson(request);
  const markdown = String(body.markdown || "").trim().slice(0, MAX_MARKDOWN_CHARS);
  if (markdown.length < 20) return json({ error: "Save more Turnpo Markdown before starting search." }, { status: 400 });

  const limit = Math.max(1, Math.min(MAX_RESULTS, Math.round(Number(body.limit) || 18)));
  const queries = queriesFromMarkdown(markdown);
  const errors = [];
  const [arbeitnowJobs, remotiveJobs] = await Promise.all([
    fetchArbeitnow(errors),
    fetchRemotive(queries, errors)
  ]);
  const scoredJobs = dedupeJobs([...arbeitnowJobs, ...remotiveJobs])
    .map((job) => ({
      ...job,
      score: scoreJob(job, queries),
      confidence: "API collected"
    }))
    .filter((job) => job.score >= 8 || LOCATION_TERMS.some((term) => `${job.location} ${job.summary}`.toLowerCase().includes(term)))
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);

  return json({
    jobs: scoredJobs,
    queries,
    sources: ["Arbeitnow", "Remotive"],
    fetchedAt: new Date().toISOString(),
    errors
  });
}
