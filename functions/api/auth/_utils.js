const SESSION_COOKIE = "turnpo_owner_session";
const DEFAULT_OWNER_EMAIL_PROFILES = {
  "cxin7699nl23@gmail.com": "cindy"
};
const RESERVED_USERNAMES = new Set(["admin", "api", "auth", "cindy", "founder", "home", "leo", "login", "profiles", "register", "settings", "turnpo", "u"]);
const CODE_TTL_SECONDS = 10 * 60;
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const REGISTRATION_TTL_SECONDS = 20 * 60;
const MAX_TEXT_FIELD_LENGTH = 1200;
const MAX_LONG_TEXT_FIELD_LENGTH = 5000;
const MAX_PROFILE_ITEMS = 250;
const MAX_PROFILE_JOBS = 300;
const MAX_PROFILE_JOB_POTENTIALS = 80;
const MAX_PROFILE_TAGS = 20;
const MAX_PROFILE_LINKS = 24;
const MAX_PUBLIC_STATE_IDS = 1000;
const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const ROLE_DEFINITIONS = {
  admin: {
    label: "Admin",
    scopes: [
      "admin:read",
      "accounts:read",
      "profiles:read",
      "moderation:read",
      "roles:read",
      "platform:owner"
    ],
    areas: [
      "Full read-only account overview",
      "Public profile and visibility review",
      "Moderation and status monitoring",
      "Role and access audit",
      "Platform owner configuration"
    ]
  },
  user: {
    label: "User",
    scopes: ["profile:own"],
    areas: ["Own profile management"]
  }
};
const PUBLIC_PROFILE_FIELDS = [
  "id",
  "seedVersion",
  "username",
  "displayName",
  "oneLineIntro",
  "currentChapter",
  "location",
  "avatar",
  "avatarPositionY",
  "links",
  "values",
  "themes",
  "status"
];
const PUBLIC_CONTENT_FIELDS = [
  "id",
  "category",
  "title",
  "type",
  "year",
  "date",
  "location",
  "image",
  "images",
  "link",
  "publicSummary",
  "whyMade",
  "whyItMatters",
  "toolsUsed",
  "humanRole",
  "aiRole",
  "result",
  "tags",
  "status",
  "userApproved",
  "publishedAt"
];
const JOB_STATUSES = new Set(["collected", "interesting", "apply-ready", "applied", "rejected", "archived"]);
const JOB_POTENTIAL_STATUSES = new Set(["queued", "opened", "saved"]);

export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {})
    }
  });
}

export function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function normalizeIdList(value) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function safePublicUrl(value = "") {
  const url = String(value || "").trim();
  if (!url) return "";
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
}

function safePublicMediaUrl(value = "") {
  const url = String(value || "").trim();
  if (!url) return "";
  if (
    (url.startsWith("/assets/") || url.startsWith("/api/profiles/"))
    && !url.startsWith("//")
    && !url.includes("\\")
  ) {
    return url;
  }
  return "";
}

function cleanPublicLinks(links = []) {
  return Array.isArray(links)
    ? links
      .map((link) => ({
        label: String(link?.label || "").trim().slice(0, 120),
        url: safePublicUrl(link?.url || "")
      }))
      .filter((link) => link.label && link.url)
    : [];
}

function cleanText(value = "", maxLength = MAX_TEXT_FIELD_LENGTH) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanLongText(value = "", maxLength = MAX_LONG_TEXT_FIELD_LENGTH) {
  return String(value || "").trim().slice(0, maxLength);
}

function cleanStringArray(value = [], maxItems = 40, maxLength = 120) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value
    .map((item) => cleanText(item, maxLength))
    .filter((item) => {
      if (!item || seen.has(item)) return false;
      seen.add(item);
      return true;
    })
    .slice(0, maxItems);
}

function cleanLinkList(links = []) {
  return Array.isArray(links)
    ? links
      .map((link) => ({
        label: cleanText(link?.label || "", 120),
        url: safePublicUrl(link?.url || "")
      }))
      .filter((link) => link.label && link.url)
      .slice(0, MAX_PROFILE_LINKS)
    : [];
}

function cleanMediaList(values = []) {
  if (!Array.isArray(values)) return [];
  const seen = new Set();
  return values
    .map(safePublicMediaUrl)
    .filter((url) => {
      if (!url || seen.has(url)) return false;
      seen.add(url);
      return true;
    })
    .slice(0, 20);
}

function cleanStatus(value = "") {
  return ["published", "hidden", "deleted"].includes(value) ? value : "hidden";
}

function cleanPublicState(value = {}) {
  return {
    hiddenStoryIds: normalizeIdList(value.hiddenStoryIds).slice(0, MAX_PUBLIC_STATE_IDS),
    deletedStoryIds: normalizeIdList(value.deletedStoryIds).slice(0, MAX_PUBLIC_STATE_IDS),
    hiddenWorkIds: normalizeIdList(value.hiddenWorkIds).slice(0, MAX_PUBLIC_STATE_IDS),
    deletedWorkIds: normalizeIdList(value.deletedWorkIds).slice(0, MAX_PUBLIC_STATE_IDS),
    collapsedYears: normalizeIdList(value.collapsedYears).slice(0, MAX_PUBLIC_STATE_IDS)
  };
}

function cleanTravelPlacesForStorage(value = []) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.map((entry) => {
    if (typeof entry === "string") return cleanText(entry, 120);
    if (!entry || typeof entry !== "object") return null;
    const lat = Number(entry.lat);
    const lng = Number(entry.lng);
    const clean = {
      id: cleanText(entry.id || "", 120),
      label: cleanText(entry.label || "", 120),
      country: cleanText(entry.country || "", 120),
      type: entry.type === "city" ? "city" : "",
      category: entry.category === "major" || entry.atlasCategory === "major" ? "major" : "visited",
      manual: entry.manual === true
    };
    if (Number.isFinite(lat)) clean.lat = Math.min(90, Math.max(-90, lat));
    if (Number.isFinite(lng)) clean.lng = Math.min(180, Math.max(-180, lng));
    return clean.id ? clean : null;
  }).filter((entry) => {
    const id = typeof entry === "string" ? entry : entry?.id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  }).slice(0, MAX_PROFILE_ITEMS);
}

function cleanContentItem(item = {}, fallbackCategory = "life") {
  const category = item.category === "work" || fallbackCategory === "work" ? "work" : "life";
  const images = cleanMediaList([...(Array.isArray(item.images) ? item.images : []), item.image].filter(Boolean));
  const status = cleanStatus(item.status);
  const clean = {
    id: cleanText(item.id || `${category}-${Date.now()}`, 160),
    category,
    title: cleanText(item.title || "", 180),
    type: cleanText(item.type || "", 120),
    year: cleanText(item.year || "", 32),
    date: cleanText(item.date || "", 80),
    location: cleanText(item.location || "", 180),
    image: images[0] || "",
    images,
    link: safePublicUrl(item.link || ""),
    sourceUrl: safePublicUrl(item.sourceUrl || ""),
    publicSummary: cleanLongText(item.publicSummary || "", 2000),
    fullText: cleanLongText(item.fullText || "", 5000),
    whyMade: cleanLongText(item.whyMade || "", 2000),
    whyItMatters: cleanLongText(item.whyItMatters || "", 2000),
    toolsUsed: cleanStringArray(item.toolsUsed, 30, 80),
    humanRole: cleanLongText(item.humanRole || "", 2000),
    aiRole: cleanLongText(item.aiRole || "", 2000),
    result: cleanLongText(item.result || "", 2000),
    tags: cleanStringArray(item.tags, MAX_PROFILE_TAGS, 80),
    status,
    userApproved: status === "published" && item.userApproved === true,
    createdAt: cleanText(item.createdAt || "", 80),
    updatedAt: cleanText(item.updatedAt || "", 80),
    publishedAt: cleanText(item.publishedAt || "", 80),
    unpublishedAt: cleanText(item.unpublishedAt || "", 80),
    deletedAt: cleanText(item.deletedAt || "", 80),
    previousStatus: cleanStatus(item.previousStatus),
    ownerEdited: item.ownerEdited === true,
    ownerReviewed: item.ownerReviewed === true,
    ownerEditedAt: cleanText(item.ownerEditedAt || "", 80),
    ownerReviewedAt: cleanText(item.ownerReviewedAt || "", 80)
  };
  if (!clean.previousStatus || clean.previousStatus === "hidden") delete clean.previousStatus;
  return clean;
}

function cleanJobsForStorage(value = {}) {
  const preferences = value?.preferences && typeof value.preferences === "object" ? value.preferences : {};
  const cleanPreferenceList = (items, maxItems = 40) => cleanStringArray(items, maxItems, 120);
  const cleanPotential = (potential = {}) => {
    const status = JOB_POTENTIAL_STATUSES.has(potential.status) ? potential.status : "queued";
    const score = Math.round(Number(potential.score) || 0);
    return {
      id: cleanText(potential.id || `potential-${Date.now()}`, 160),
      kind: potential.kind === "job" || potential.company || potential.description ? "job" : "search",
      title: cleanText(potential.title || "", 220),
      company: cleanText(potential.company || "", 160),
      location: cleanText(potential.location || "", 180),
      lane: cleanText(potential.lane || "", 120),
      source: cleanText(potential.source || "", 80),
      summary: cleanLongText(potential.summary || "", 1200),
      description: cleanLongText(potential.description || "", 8000),
      query: cleanText(potential.query || "", 220),
      platform: cleanText(potential.platform || "", 120),
      url: safePublicUrl(potential.url || ""),
      status,
      score: Math.min(100, Math.max(0, score)),
      confidence: cleanText(potential.confidence || "", 80),
      targetTitles: cleanStringArray(potential.targetTitles, 12, 160),
      searchKeywords: cleanStringArray(potential.searchKeywords, 30, 120),
      evidence: cleanStringArray(potential.evidence, 12, 220),
      gaps: cleanStringArray(potential.gaps, 12, 220),
      createdAt: cleanText(potential.createdAt || "", 80),
      updatedAt: cleanText(potential.updatedAt || "", 80),
      lastAnalyzedAt: cleanText(potential.lastAnalyzedAt || "", 80)
    };
  };
  const cleanJob = (job = {}) => {
    const status = JOB_STATUSES.has(job.status) ? job.status : "collected";
    const score = Math.round(Number(job.matchScore) || 0);
    return {
      id: cleanText(job.id || `job-${Date.now()}`, 160),
      title: cleanText(job.title || "", 220),
      company: cleanText(job.company || "", 160),
      location: cleanText(job.location || "", 180),
      source: cleanText(job.source || "manual", 80),
      sourceUrl: safePublicUrl(job.sourceUrl || job.url || ""),
      description: cleanLongText(job.description || "", 12000),
      notes: cleanLongText(job.notes || "", 5000),
      status,
      summary: cleanLongText(job.summary || "", 1200),
      recommendation: cleanText(job.recommendation || "", 80),
      matchScore: Math.min(100, Math.max(0, score)),
      potentialId: cleanText(job.potentialId || "", 160),
      potentialTitle: cleanText(job.potentialTitle || "", 220),
      fitReasons: cleanStringArray(job.fitReasons, 12, 220),
      riskFlags: cleanStringArray(job.riskFlags, 12, 220),
      keywords: cleanStringArray(job.keywords, 30, 80),
      applicationMarkdown: cleanLongText(job.applicationMarkdown || "", 18000),
      createdAt: cleanText(job.createdAt || "", 80),
      updatedAt: cleanText(job.updatedAt || "", 80),
      lastAnalyzedAt: cleanText(job.lastAnalyzedAt || "", 80)
    };
  };
  return {
    markdown: cleanLongText(value?.markdown || "", 24000),
    preferences: {
      targetLocations: cleanPreferenceList(preferences.targetLocations, 20),
      focusKeywords: cleanPreferenceList(preferences.focusKeywords, 60),
      riskKeywords: cleanPreferenceList(preferences.riskKeywords, 60)
    },
    items: Array.isArray(value?.items)
      ? value.items.map(cleanJob).filter((job) => job.title || job.company || job.description || job.sourceUrl).slice(0, MAX_PROFILE_JOBS)
      : [],
    potentials: Array.isArray(value?.potentials)
      ? value.potentials.map(cleanPotential).filter((potential) => potential.title || potential.summary).slice(0, MAX_PROFILE_JOB_POTENTIALS)
      : []
  };
}

function cleanAcknowledgement(value = {}) {
  if (!value || typeof value !== "object") return undefined;
  const clean = {
    version: cleanText(value.version || "", 40),
    acceptedAt: cleanText(value.acceptedAt || "", 80)
  };
  if (value.acknowledgements && typeof value.acknowledgements === "object") {
    clean.acknowledgements = Object.fromEntries(
      Object.entries(value.acknowledgements)
        .map(([key, accepted]) => [cleanText(key, 80), accepted === true])
        .filter(([key]) => key)
        .slice(0, 40)
    );
  }
  return clean.version || clean.acceptedAt || clean.acknowledgements ? clean : undefined;
}

export function approvedProfileForEmail(env, email) {
  const mapped = {
    ...DEFAULT_OWNER_EMAIL_PROFILES,
    ...parseEmailProfileMap(env.TURNPO_OWNER_EMAIL_PROFILES || env.OWNER_EMAIL_PROFILES || "")
  };
  if (mapped[email]) return mapped[email];

  const approved = parseList(env.TURNPO_APPROVED_OWNER_EMAILS || env.APPROVED_OWNER_EMAILS || "");
  if (!approved.includes(email)) return "";
  return env.TURNPO_DEFAULT_OWNER_PROFILE || env.OWNER_DEFAULT_PROFILE || "leo";
}

export async function ownerProfileForEmail(env, email) {
  const stored = env.AUTH_KV ? await env.AUTH_KV.get(ownerProfileKey(email)) : "";
  return stored || approvedProfileForEmail(env, email);
}

export function requireAuthConfig(env) {
  if (!env.AUTH_KV) return "Missing AUTH_KV binding.";
  if (!env.TURNPO_AUTH_SECRET) return "Missing TURNPO_AUTH_SECRET.";
  return "";
}

export function profileStore(env) {
  return env.PROFILE_KV || env.AUTH_KV;
}

export function requireProfileStoreConfig(env) {
  if (!profileStore(env)) return "Missing PROFILE_KV or AUTH_KV binding.";
  return "";
}

export function mediaStore(env) {
  return env.PROFILE_MEDIA_R2 || env.MEDIA_R2 || env.TURNPO_MEDIA_R2;
}

export function requireMediaStoreConfig(env) {
  if (!mediaStore(env)) return "Missing PROFILE_MEDIA_R2, MEDIA_R2, or TURNPO_MEDIA_R2 binding.";
  return "";
}

export async function sha256(input) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashCode(env, email, code) {
  return sha256(`${env.TURNPO_AUTH_SECRET}:${email}:${code}`);
}

export function randomCode() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String(values[0] % 1000000).padStart(6, "0");
}

export function randomId() {
  const values = new Uint8Array(32);
  crypto.getRandomValues(values);
  return [...values].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function codeKey(email) {
  return `auth:code:${email}`;
}

export function sessionKey(sessionId) {
  return `auth:session:${sessionId}`;
}

export function profileDraftKey(username) {
  return `profile:draft:${username}`;
}

export function profilePublishedKey(username) {
  return `profile:published:${username}`;
}

export function ownerProfileKey(email) {
  return `auth:owner:${normalizeEmail(email)}`;
}

export function userEmailKey(email) {
  return `user:email:${normalizeEmail(email)}`;
}

export function userKey(userId) {
  return `user:id:${userId}`;
}

export function registeredUsernameKey(username) {
  return `profile:username:${normalizeUsername(username)}`;
}

export function requestKey(email) {
  return `auth:request:${email}`;
}

export function verifyKey(email) {
  return `auth:verify:${email}`;
}

export function registrationKey(email) {
  return `auth:registration:${normalizeEmail(email)}`;
}

export async function incrementWindow(env, key, ttlSeconds) {
  const current = Number(await env.AUTH_KV.get(key) || "0");
  const next = current + 1;
  await env.AUTH_KV.put(key, String(next), { expirationTtl: ttlSeconds });
  return next;
}

export function clientRateKey(request, scope, identifier = "") {
  const ip = request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim()
    || "unknown";
  return `rate:${scope}:${ip}:${normalizeEmail(identifier) || "anon"}`;
}

export function validateJsonMutationRequest(request, { requireSameOrigin = true } = {}) {
  if (!MUTATION_METHODS.has(request.method)) return null;

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return { error: "Expected application/json request body.", status: 415 };
  }

  if (!requireSameOrigin) return null;

  const expectedOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin) {
    return origin === expectedOrigin ? null : { error: "Same-origin request required.", status: 403 };
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin === expectedOrigin ? null : { error: "Same-origin request required.", status: 403 };
    } catch {
      return { error: "Same-origin request required.", status: 403 };
    }
  }

  return { error: "Same-origin request required.", status: 403 };
}

export function validateSameOriginRequest(request) {
  if (!MUTATION_METHODS.has(request.method)) return null;

  const expectedOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin) return origin === expectedOrigin ? null : { error: "Same-origin request required.", status: 403 };

  const referer = request.headers.get("referer");
  if (!referer) return { error: "Same-origin request required.", status: 403 };
  try {
    return new URL(referer).origin === expectedOrigin ? null : { error: "Same-origin request required.", status: 403 };
  } catch {
    return { error: "Same-origin request required.", status: 403 };
  }
}

export function requestContentLengthTooLarge(request, maxBytes) {
  const length = Number(request.headers.get("content-length") || "0");
  return Number.isFinite(length) && length > maxBytes;
}

export function getSessionId(request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export function sessionCookie(sessionId) {
  return `${SESSION_COOKIE}=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export function cleanOwnerProfileForStorage(profile = {}, username = "", ownerEmail = "") {
  const normalizedUsername = normalizeUsername(username || profile.username);
  const now = new Date().toISOString();
  const lifeStories = Array.isArray(profile.lifeStories)
    ? profile.lifeStories.map((item) => cleanContentItem(item, item?.category === "work" ? "work" : "life"))
    : [];
  const aiWorks = Array.isArray(profile.aiWorks)
    ? profile.aiWorks.map((item) => cleanContentItem(item, "work"))
    : [];
  const legalAcknowledgement = cleanAcknowledgement(profile.legalAcknowledgement);
  const publicationAcknowledgement = cleanAcknowledgement(profile.publicationAcknowledgement);
  const clean = {
    id: cleanText(profile.id || `profile-${normalizedUsername}`, 120),
    status: profile.status === "published" ? "published" : "hidden",
    seedVersion: cleanText(profile.seedVersion || "", 80),
    username: normalizedUsername,
    displayName: cleanText(profile.displayName || normalizedUsername, 120),
    ownerEmail: normalizeEmail(ownerEmail || profile.ownerEmail || ""),
    oneLineIntro: cleanText(profile.oneLineIntro || "", 280),
    currentChapter: cleanLongText(profile.currentChapter || "", 1500),
    location: cleanText(profile.location || "", 160),
    avatar: safePublicMediaUrl(profile.avatar || "") || "/assets/turnpo-logo-512.png",
    avatarPositionY: Number.isFinite(Number(profile.avatarPositionY))
      ? Math.min(100, Math.max(0, Number(profile.avatarPositionY)))
      : 24,
    links: cleanLinkList(profile.links),
    values: cleanStringArray(profile.values, 40, 120),
    themes: cleanStringArray(profile.themes, 40, 120),
    travelPlaces: cleanTravelPlacesForStorage(profile.travelPlaces),
    jobs: cleanJobsForStorage(profile.jobs),
    lifeStories: lifeStories.slice(0, MAX_PROFILE_ITEMS),
    aiWorks: aiWorks.slice(0, MAX_PROFILE_ITEMS),
    publicState: cleanPublicState(profile.publicState),
    createdAt: cleanText(profile.createdAt || now, 80),
    updatedAt: now
  };
  if (legalAcknowledgement) clean.legalAcknowledgement = legalAcknowledgement;
  if (publicationAcknowledgement) clean.publicationAcknowledgement = publicationAcknowledgement;
  return clean;
}

export async function ownerSession(request, env) {
  const configError = requireAuthConfig(env);
  if (configError) return { error: configError, status: 500 };

  const sessionId = getSessionId(request);
  if (!sessionId) return { error: "Owner login required.", status: 401 };

  const session = await env.AUTH_KV.get(sessionKey(sessionId), "json");
  if (!session) return { error: "Owner login required.", status: 401 };

  const user = session.userId
    ? await userForId(env, session.userId)
    : session.email
      ? await userForEmail(env, session.email)
      : null;
  if (user?.status && user.status !== "active") return { error: "Account is not active.", status: 403 };
  if (user?.profile && session.profile && normalizeUsername(user.profile) !== normalizeUsername(session.profile)) {
    return { error: "Owner login required.", status: 401 };
  }

  return {
    session: {
      ...session,
      userId: user?.id || session.userId || "",
      role: user ? roleForEmail(env, user.email) : session.role
    }
  };
}

export function roleForEmail(env, email) {
  const normalizedEmail = normalizeEmail(email);
  const admins = parseList(env.TURNPO_ADMIN_EMAILS || env.ADMIN_EMAILS || "");
  if (admins.includes(normalizedEmail)) return "admin";
  return "user";
}

export function accessForRole(role = "user") {
  const definition = ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS.user;
  return {
    role: ROLE_DEFINITIONS[role] ? role : "user",
    label: definition.label,
    scopes: [...definition.scopes],
    managementAreas: [...definition.areas],
    readOnly: true
  };
}

export function accessForEmail(env, email) {
  return accessForRole(roleForEmail(env, email));
}

export function hasScope(user, scope) {
  return accessForRole(user?.role).scopes.includes(scope);
}

export async function userForEmail(env, email) {
  if (!env.AUTH_KV) return null;
  const userId = await env.AUTH_KV.get(userEmailKey(email));
  return userId ? await env.AUTH_KV.get(userKey(userId), "json") : null;
}

export async function userForId(env, userId) {
  if (!env.AUTH_KV || !userId) return null;
  return await env.AUTH_KV.get(userKey(userId), "json");
}

export async function ensureUserForEmail(env, {
  email,
  profile = "",
  username = "",
  displayName = "",
  status = "active",
  now = new Date().toISOString()
}) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;
  const existing = await userForEmail(env, normalizedEmail);
  const role = roleForEmail(env, normalizedEmail);
  const next = existing ? {
    ...existing,
    role,
    profile: profile || existing.profile || "",
    username: username || existing.username || existing.profile || profile || "",
    displayName: displayName || existing.displayName || username || existing.username || "",
    status: existing.status || status,
    updatedAt: now
  } : {
    id: randomId(),
    email: normalizedEmail,
    username: username || profile || "",
    displayName: displayName || username || profile || normalizedEmail,
    profile: profile || username || "",
    role,
    status,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: ""
  };
  await env.AUTH_KV.put(userKey(next.id), JSON.stringify(next));
  await env.AUTH_KV.put(userEmailKey(normalizedEmail), next.id);
  return next;
}

export async function recordUserLogin(env, user) {
  if (!user?.id) return user;
  const now = new Date().toISOString();
  const next = {
    ...user,
    role: roleForEmail(env, user.email),
    lastLoginAt: now,
    updatedAt: now
  };
  await env.AUTH_KV.put(userKey(next.id), JSON.stringify(next));
  await env.AUTH_KV.put(userEmailKey(next.email), next.id);
  return next;
}

export async function requireUserSession(request, env) {
  const auth = await ownerSession(request, env);
  if (auth.error) return auth;
  let user = auth.session.userId ? await userForId(env, auth.session.userId) : null;
  if (!user && auth.session.email) {
    user = await ensureUserForEmail(env, {
      email: auth.session.email,
      profile: auth.session.profile || "",
      username: auth.session.profile || ""
    });
  }
  if (!user) return { error: "Login required.", status: 401 };
  if (user.status && user.status !== "active") return { error: "Account is not active.", status: 403 };
  user = {
    ...user,
    role: roleForEmail(env, user.email)
  };
  return { session: auth.session, user, access: accessForRole(user.role) };
}

export async function requireAdminSession(request, env, requiredScope = "admin:read") {
  const auth = await requireUserSession(request, env);
  if (auth.error) return auth;
  if (!hasScope(auth.user, requiredScope)) return { error: "Admin access required.", status: 403 };
  return auth;
}

export function normalizeUsername(value = "") {
  return String(value)
    .trim()
    .replace(/^@/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export function usernameFromName(name = "") {
  return normalizeUsername(name) || `turnpo-${Math.floor(Date.now() / 1000)}`;
}

export function validUsername(username = "") {
  return /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/.test(username) && !RESERVED_USERNAMES.has(username);
}

export function assertOwnerProfile(session, username) {
  return session?.profile && normalizeUsername(session.profile) === normalizeUsername(username);
}

export function publicProfile(profile = {}) {
  const publicState = profile.publicState || {};
  const hiddenStoryIds = new Set(normalizeIdList(publicState.hiddenStoryIds));
  const deletedStoryIds = new Set(normalizeIdList(publicState.deletedStoryIds));
  const hiddenWorkIds = new Set(normalizeIdList(publicState.hiddenWorkIds));
  const deletedWorkIds = new Set(normalizeIdList(publicState.deletedWorkIds));
  const isPublicItem = (item, hiddenIds, deletedIds) => (
    item?.status === "published"
    && item.userApproved === true
    && !hiddenIds.has(item.id)
    && !deletedIds.has(item.id)
  );
  const pick = (source, fields) => fields.reduce((next, field) => {
    if (source[field] !== undefined) next[field] = source[field];
    return next;
  }, {});
  const cleanTravelPlaces = (value) => {
    if (!Array.isArray(value)) return [];
    const seen = new Set();
    const cleanCategory = (entry) => {
      const category = entry?.category || entry?.atlasCategory;
      return category === "major" ? "major" : category === "visited" ? "visited" : "";
    };
    return value.map((entry) => {
      if (typeof entry === "string") return entry;
      if (!entry || typeof entry !== "object") return null;
      const id = String(entry.id || "").trim();
      const category = cleanCategory(entry);
      if (id && !entry.label && !entry.country && entry.lat === undefined && entry.lng === undefined) {
        return category ? { id, category } : id;
      }
      const lat = Number(entry.lat);
      const lng = Number(entry.lng);
      const clean = pick(entry, ["id", "label", "country", "type", "manual"]);
      if (!clean.id || !clean.label || !clean.country || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      clean.lat = Math.min(90, Math.max(-90, lat));
      clean.lng = Math.min(180, Math.max(-180, lng));
      clean.type = "city";
      if (category) clean.category = category;
      return clean;
    }).filter((entry) => {
      const id = typeof entry === "string" ? entry : entry?.id;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  };
  const cleanContent = (item) => {
    const clean = pick(item, PUBLIC_CONTENT_FIELDS);
    clean.link = safePublicUrl(clean.link);
    clean.image = safePublicMediaUrl(clean.image);
    clean.images = Array.isArray(clean.images) ? clean.images.map(safePublicMediaUrl).filter(Boolean) : [];
    clean.tags = cleanStringArray(clean.tags, MAX_PROFILE_TAGS, 80);
    return clean;
  };
  const cleanProfile = pick(profile, PUBLIC_PROFILE_FIELDS);
  cleanProfile.avatar = safePublicMediaUrl(cleanProfile.avatar) || "/assets/turnpo-logo-512.png";

  return {
    ...cleanProfile,
    status: "published",
    links: cleanPublicLinks(profile.links),
    values: cleanStringArray(profile.values, 40, 120),
    themes: cleanStringArray(profile.themes, 40, 120),
    travelPlaces: cleanTravelPlaces(profile.travelPlaces),
    lifeStories: (Array.isArray(profile.lifeStories) ? profile.lifeStories : [])
      .filter((item) => item?.category === "work"
        ? isPublicItem(item, hiddenWorkIds, deletedWorkIds)
        : isPublicItem(item, hiddenStoryIds, deletedStoryIds))
      .map(cleanContent),
    aiWorks: (Array.isArray(profile.aiWorks) ? profile.aiWorks : [])
      .filter((item) => isPublicItem(item, hiddenWorkIds, deletedWorkIds))
      .map(cleanContent),
    publicState: {
      collapsedYears: normalizeIdList(publicState.collapsedYears)
    }
  };
}

export async function sendLoginCode(env, email, code) {
  const apiKey = env.RESEND_API_KEY;
  const from = env.TURNPO_AUTH_FROM_EMAIL || "Turnpo <login@turnpo.com>";
  if (!apiKey) return { ok: false, error: "Missing RESEND_API_KEY." };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Your Turnpo login code",
      text: `Your Turnpo login code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your Turnpo login code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`
    })
  });

  if (response.ok) return { ok: true };
  return { ok: false, error: await response.text() };
}

function parseList(value) {
  return value.split(",").map((item) => normalizeEmail(item)).filter(Boolean);
}

function parseEmailProfileMap(value) {
  return value.split(",").reduce((map, pair) => {
    const [email, profile] = pair.split(":").map((item) => item && item.trim());
    if (email && profile) map[normalizeEmail(email)] = profile;
    return map;
  }, {});
}

export { CODE_TTL_SECONDS, SESSION_TTL_SECONDS, REGISTRATION_TTL_SECONDS };
