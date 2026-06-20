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
const DEFAULT_RESULT_LIMIT = 30;
const MAX_RESULTS = 40;
const MAX_SEARCHES_PER_HOUR = 40;
const REQUEST_TIMEOUT_MS = 8000;
const OPENAI_REQUEST_TIMEOUT_MS = 7000;
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_JOBS_MODEL = "gpt-4o-mini";
const ARBEITNOW_URL = "https://www.arbeitnow.com/api/job-board-api";
const REMOTIVE_URL = "https://remotive.com/api/remote-jobs";
const JOBICY_URL = "https://jobicy.com/api/v2/remote-jobs";
const JOBICY_TAGS = ["product", "management", "training", "business", "operations"];

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

const LOCATION_PROFILES = [
  {
    key: "netherlands",
    label: "Netherlands",
    aliases: ["netherlands", "nederland", "eindhoven", "veldhoven", "amsterdam", "rotterdam", "utrecht", "asml"],
    targetLocations: ["Netherlands", "Eindhoven", "Veldhoven", "Amsterdam", "Hybrid Netherlands"],
    compatibleTerms: [
      "netherlands",
      "nederland",
      "eindhoven",
      "veldhoven",
      "amsterdam",
      "rotterdam",
      "utrecht",
      "the hague",
      "den haag",
      "europe",
      "european union",
      "emea",
      " eu ",
      "cet",
      "cest"
    ],
    rejectedTerms: [
      "brazil",
      "brasil",
      "latam",
      "latin america",
      "americas",
      "north america",
      "south america",
      "argentina",
      "chile",
      "colombia",
      "mexico",
      "peru",
      "uruguay",
      "united states",
      "usa",
      "us only",
      "canada",
      "united kingdom",
      "uk",
      "london",
      "poland",
      "portugal",
      "czechia",
      "germany",
      "spain",
      "france",
      "mena",
      "india",
      "philippines",
      "australia",
      "israel",
      "middle east",
      "apac",
      "asia pacific",
      "worldwide",
      "global remote",
      "anywhere"
    ]
  }
];

const ROLE_FAMILY_RULES = [
  {
    key: "ai-knowledge",
    label: "AI knowledge management",
    terms: ["ai knowledge", "knowledge management", "knowledge mapping", "knowledge strategy", "knowledge workflows", "mapkai"],
    queries: ["AI knowledge management", "Knowledge Management Specialist", "AI Knowledge Lead"]
  },
  {
    key: "learning-enablement",
    label: "learning and enablement",
    terms: ["learning", "training", "academy", "enablement", "l&km", "learning systems", "technical training"],
    queries: ["Learning and Development", "AI Enablement", "Technical Training"]
  },
  {
    key: "project-product-ops",
    label: "project/product operations",
    terms: ["project management", "product", "program", "stakeholder", "workflow", "process improvement", "solution designer"],
    queries: ["Project Manager", "Product Operations", "Business Process Improvement"]
  }
];

const INDUSTRY_RULES = [
  { key: "high-tech", label: "high-tech / semiconductor", terms: ["asml", "semiconductor", "high-tech", "eindhoven", "veldhoven"] },
  { key: "ai-product", label: "AI product tools", terms: ["ai", "mapkai", "turnpo", "product", "tools", "workflow"] },
  { key: "learning-knowledge", label: "learning / knowledge systems", terms: ["learning", "training", "academy", "knowledge", "l&km"] }
];

const COMPANY_SCALE_RULES = [
  { key: "enterprise", label: "enterprise / large company", terms: ["asml", "enterprise", "corporate", "stakeholder", "academy"] },
  { key: "product-startup", label: "product/startup builder", terms: ["co-creator", "mapkai", "turnpo", "startup", "builder"] }
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

const RISK_TERMS = [
  "fluent dutch",
  "native dutch",
  "dutch required",
  "senior software engineer",
  "backend engineer",
  "frontend engineer",
  "machine learning engineer",
  "ai engineer",
  "software architect",
  "developer",
  "kubernetes",
  "devops"
];

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

function includesAny(text = "", terms = []) {
  return terms.some((term) => text.includes(String(term || "").toLowerCase()));
}

function matchingRuleLabels(text = "", rules = []) {
  return rules
    .filter((rule) => includesAny(text, rule.terms))
    .map((rule) => rule.label);
}

function matchingRuleTerms(text = "", rules = []) {
  return uniqueStrings(rules
    .filter((rule) => includesAny(text, rule.terms))
    .flatMap((rule) => rule.terms), 30);
}

function seniorityFromMarkdown(text = "") {
  if (includesAny(text, ["director", "head of", "principal", "staff"])) return "senior";
  if (includesAny(text, ["senior", "lead", "manager", "project management", "solution designer", "co-creator", "stakeholder"])) return "mid-senior";
  if (includesAny(text, ["junior", "graduate", "intern", "trainee"])) return "entry";
  return "mid";
}

function locationProfileFromMarkdown(text = "") {
  return LOCATION_PROFILES.find((profile) => includesAny(text, profile.aliases)) || LOCATION_PROFILES[0];
}

function searchProfileFromMarkdown(markdown = "") {
  const text = String(markdown || "").toLowerCase();
  const locationProfile = locationProfileFromMarkdown(text);
  const roleFamilies = matchingRuleLabels(text, ROLE_FAMILY_RULES);
  const industries = matchingRuleLabels(text, INDUSTRY_RULES);
  const companyScale = matchingRuleLabels(text, COMPANY_SCALE_RULES);
  const roleTerms = matchingRuleTerms(text, ROLE_FAMILY_RULES);
  const industryTerms = matchingRuleTerms(text, INDUSTRY_RULES);
  const companyScaleTerms = matchingRuleTerms(text, COMPANY_SCALE_RULES);
  const phraseHits = SEARCH_PHRASES.filter((phrase) => text.includes(phrase.toLowerCase()));
  return {
    locationKey: locationProfile.key,
    locationLabel: locationProfile.label,
    targetLocations: locationProfile.targetLocations,
    compatibleLocationTerms: locationProfile.compatibleTerms,
    rejectedLocationTerms: locationProfile.rejectedTerms,
    seniority: seniorityFromMarkdown(text),
    roleFamilies: roleFamilies.length ? roleFamilies : ["knowledge / learning / AI enablement"],
    industries: industries.length ? industries : ["AI product tools", "learning / knowledge systems"],
    companyScale: companyScale.length ? companyScale : ["enterprise / product teams"],
    roleTerms: roleTerms.length ? roleTerms : ["knowledge", "learning", "ai", "enablement"],
    industryTerms,
    companyScaleTerms,
    phraseHits
  };
}

function extractOutputText(data) {
  if (typeof data.output_text === "string") return data.output_text;
  const content = data.output
    ?.flatMap((item) => item.content || [])
    ?.find((item) => item.type === "output_text" && typeof item.text === "string");
  return content?.text || "";
}

function arrayFromModel(value, maxItems = 12) {
  return uniqueStrings(Array.isArray(value) ? value : [], maxItems);
}

function mergeAiSearchProfile(aiProfile = {}, fallbackProfile = {}, markdown = "") {
  const locationProfile = locationProfileFromMarkdown([
    markdown,
    aiProfile.locationLabel,
    ...(Array.isArray(aiProfile.targetLocations) ? aiProfile.targetLocations : [])
  ].join("\n").toLowerCase());
  const roleTerms = arrayFromModel(aiProfile.roleTerms, 30);
  const industryTerms = arrayFromModel(aiProfile.industryTerms, 30);
  const companyScaleTerms = arrayFromModel(aiProfile.companyScaleTerms, 20);
  return {
    ...fallbackProfile,
    locationKey: locationProfile.key,
    locationLabel: locationProfile.label,
    targetLocations: arrayFromModel(aiProfile.targetLocations, 12).length
      ? arrayFromModel(aiProfile.targetLocations, 12)
      : fallbackProfile.targetLocations,
    compatibleLocationTerms: locationProfile.compatibleTerms,
    rejectedLocationTerms: locationProfile.rejectedTerms,
    seniority: cleanText(aiProfile.seniority || fallbackProfile.seniority || "mid", 40),
    roleFamilies: arrayFromModel(aiProfile.roleFamilies, 8).length
      ? arrayFromModel(aiProfile.roleFamilies, 8)
      : fallbackProfile.roleFamilies,
    industries: arrayFromModel(aiProfile.industries, 8).length
      ? arrayFromModel(aiProfile.industries, 8)
      : fallbackProfile.industries,
    companyScale: arrayFromModel(aiProfile.companyScale, 8).length
      ? arrayFromModel(aiProfile.companyScale, 8)
      : fallbackProfile.companyScale,
    roleTerms: roleTerms.length ? roleTerms : fallbackProfile.roleTerms,
    industryTerms: industryTerms.length ? industryTerms : fallbackProfile.industryTerms,
    companyScaleTerms: companyScaleTerms.length ? companyScaleTerms : fallbackProfile.companyScaleTerms,
    avoidTerms: arrayFromModel(aiProfile.avoidTerms, 20),
    phraseHits: fallbackProfile.phraseHits,
    queries: arrayFromModel(aiProfile.queries, 8)
  };
}

async function searchProfileFromOpenAi(markdown, fallbackProfile, env = {}, errors = []) {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) return { profile: fallbackProfile, ai: { used: false, reason: "missing-key" } };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_REQUEST_TIMEOUT_MS);
  const model = env.OPENAI_JOBS_MODEL || env.OPENAI_MODEL || DEFAULT_OPENAI_JOBS_MODEL;
  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        instructions: [
          "You analyze a Turnpo personal Markdown profile for job search.",
          "Return only JSON matching the schema.",
          "Extract concrete search preferences from the profile and recent follow-ups: location, seniority, role families, industries, company scale, search keywords, avoid terms, and search queries.",
          "Prefer the user's stated geography. If Eindhoven, Netherlands, ASML, Veldhoven, Dutch cities, or nearby wording appears, keep the search focused on Netherlands / Eindhoven / hybrid / Europe.",
          "Do not invent employers, degrees, languages, visa facts, private facts, or job postings.",
          "Queries should be short job-search phrases suitable for public job APIs, not long sentences.",
          "Avoid software-engineering-heavy queries unless the profile clearly asks for developer roles."
        ].join(" "),
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: markdown.slice(0, 12000)
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "turnpo_jobs_search_profile",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: [
                "locationLabel",
                "targetLocations",
                "seniority",
                "roleFamilies",
                "industries",
                "companyScale",
                "roleTerms",
                "industryTerms",
                "companyScaleTerms",
                "queries",
                "avoidTerms"
              ],
              properties: {
                locationLabel: { type: "string" },
                targetLocations: { type: "array", items: { type: "string" } },
                seniority: { type: "string" },
                roleFamilies: { type: "array", items: { type: "string" } },
                industries: { type: "array", items: { type: "string" } },
                companyScale: { type: "array", items: { type: "string" } },
                roleTerms: { type: "array", items: { type: "string" } },
                industryTerms: { type: "array", items: { type: "string" } },
                companyScaleTerms: { type: "array", items: { type: "string" } },
                queries: { type: "array", items: { type: "string" } },
                avoidTerms: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      })
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`.trim());
    const data = await response.json();
    const text = extractOutputText(data);
    const aiProfile = JSON.parse(text);
    return {
      profile: mergeAiSearchProfile(aiProfile, fallbackProfile, markdown),
      ai: { used: true, model }
    };
  } catch (error) {
    errors.push(`OpenAI mini profile: ${error.message || "unavailable"}`);
    return { profile: fallbackProfile, ai: { used: false, reason: "fallback", model } };
  } finally {
    clearTimeout(timeoutId);
  }
}

function queryWithLocation(query = "", locationLabel = "") {
  const cleanQuery = cleanText(query, 120);
  const cleanLocation = cleanText(locationLabel, 80);
  if (!cleanQuery) return "";
  if (!cleanLocation || cleanQuery.toLowerCase().includes(cleanLocation.toLowerCase())) return cleanQuery;
  return `${cleanQuery} ${cleanLocation}`;
}

function queriesFromProfile(profile) {
  if (Array.isArray(profile.queries) && profile.queries.length) {
    return uniqueStrings(profile.queries.map((query) => queryWithLocation(query, profile.locationLabel)), 8);
  }
  const matchedQueries = ROLE_FAMILY_RULES
    .filter((rule) => profile.roleFamilies.includes(rule.label))
    .flatMap((rule) => rule.queries);
  const baseQueries = uniqueStrings([...profile.phraseHits, ...matchedQueries], 8);
  const queries = baseQueries.length ? baseQueries : ["knowledge management", "learning and development", "AI enablement"];
  return uniqueStrings(queries.map((query) => queryWithLocation(query, profile.locationLabel)), 8);
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

function normalizeJobicyJob(job = {}) {
  const url = safeUrl(job.url || job.jobUrl || "");
  const title = cleanText(job.jobTitle || "", 220);
  const company = cleanText(job.companyName || "", 160);
  const tags = uniqueStrings([
    job.jobIndustry,
    job.jobType,
    job.jobLevel,
    ...(Array.isArray(job.jobTags) ? job.jobTags : [])
  ], 10);
  return {
    kind: "job",
    id: normalizeId(`jobicy-${job.id || url || company}-${title}`),
    title,
    company,
    location: cleanText(job.jobGeo || "Europe / Remote", 180),
    source: "jobicy",
    platform: "Jobicy",
    url,
    description: cleanText(job.jobDescription || "", 5000),
    summary: summarize(job.jobExcerpt || job.jobDescription || ""),
    searchKeywords: tags,
    status: "queued",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function jobSearchText(job = {}) {
  return [
    job.title,
    job.company,
    job.location,
    job.description,
    job.summary,
    ...(job.searchKeywords || [])
  ].join(" ").toLowerCase();
}

function locationCompatible(job, profile) {
  const text = ` ${jobSearchText(job)} `;
  if (includesAny(text, profile.rejectedLocationTerms)) return false;
  return includesAny(text, profile.compatibleLocationTerms);
}

function roleSignalScore(text, terms = []) {
  return uniqueStrings(terms, 40).reduce((total, term) => total + (text.includes(term.toLowerCase()) ? 1 : 0), 0);
}

function scoreJob(job, profile) {
  const queries = profile.queries || [];
  const text = [
    job.title,
    job.company,
    job.location,
    job.description,
    job.summary,
    ...(job.searchKeywords || [])
  ].join(" ").toLowerCase();
  let score = locationCompatible(job, profile) ? 22 : -80;
  for (const query of queries) {
    const normalized = query.toLowerCase();
    if (text.includes(normalized)) score += normalized.includes(" ") ? 16 : 8;
  }
  score += Math.min(36, roleSignalScore(text, [...profile.roleTerms, ...FOCUS_TERMS]) * 6);
  score += Math.min(18, roleSignalScore(text, profile.industryTerms) * 4);
  score += Math.min(12, roleSignalScore(text, profile.companyScaleTerms) * 3);
  if (text.includes("hybrid")) score += 5;
  if (text.includes("remote") && locationCompatible(job, profile)) score += 2;
  if (profile.seniority === "mid-senior" && includesAny(text, ["senior", "lead", "manager", "specialist", "consultant"])) score += 6;
  if (profile.seniority === "entry" && includesAny(text, ["junior", "graduate", "trainee"])) score += 6;
  if (profile.seniority !== "entry" && includesAny(text, ["junior", "graduate", "intern", "trainee"])) score -= 25;
  if (job.url) score += 2;
  for (const term of [...RISK_TERMS, ...(profile.avoidTerms || [])]) {
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

async function fetchRemotive(profile, errors) {
  const topQueries = profile.queries.slice(0, 3);
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

async function fetchJobicy(errors) {
  const batches = await Promise.all(JOBICY_TAGS.map(async (tag) => {
    try {
      const data = await fetchJsonWithTimeout(`${JOBICY_URL}?geo=europe&tag=${encodeURIComponent(tag)}&count=20`);
      return Array.isArray(data?.jobs) ? data.jobs.map(normalizeJobicyJob) : [];
    } catch (error) {
      errors.push(`Jobicy ${tag}: ${error.message || "unavailable"}`);
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

  const limit = Math.max(1, Math.min(MAX_RESULTS, Math.round(Number(body.limit) || DEFAULT_RESULT_LIMIT)));
  const errors = [];
  const fallbackProfile = searchProfileFromMarkdown(markdown);
  const { profile: searchProfile, ai } = await searchProfileFromOpenAi(markdown, fallbackProfile, env, errors);
  const queries = queriesFromProfile(searchProfile);
  searchProfile.queries = queries;
  const [arbeitnowJobs, remotiveJobs, jobicyJobs] = await Promise.all([
    fetchArbeitnow(errors),
    fetchRemotive(searchProfile, errors),
    fetchJobicy(errors)
  ]);
  const scoredJobs = dedupeJobs([...arbeitnowJobs, ...remotiveJobs, ...jobicyJobs])
    .map((job) => ({
      ...job,
      score: scoreJob(job, searchProfile),
      confidence: `${searchProfile.locationLabel} profile match`
    }))
    .filter((job) => locationCompatible(job, searchProfile) && job.score >= 18)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);

  return json({
    jobs: scoredJobs,
    queries,
    searchProfile: {
      locationLabel: searchProfile.locationLabel,
      targetLocations: searchProfile.targetLocations,
      seniority: searchProfile.seniority,
      roleFamilies: searchProfile.roleFamilies,
      industries: searchProfile.industries,
      companyScale: searchProfile.companyScale
    },
    ai,
    sources: [...(ai.used ? [`OpenAI ${ai.model}`] : []), "Arbeitnow", "Remotive", "Jobicy"],
    fetchedAt: new Date().toISOString(),
    errors
  });
}
