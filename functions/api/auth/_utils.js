const SESSION_COOKIE = "turnpo_owner_session";
const DEFAULT_OWNER_EMAIL_PROFILES = {
  "cxin7699nl23@gmail.com": "cindy"
};
const RESERVED_USERNAMES = new Set(["admin", "api", "auth", "cindy", "founder", "home", "leo", "login", "profiles", "register", "settings", "turnpo", "u"]);
const CODE_TTL_SECONDS = 10 * 60;
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const REGISTRATION_TTL_SECONDS = 20 * 60;
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

export async function ownerSession(request, env) {
  const configError = requireAuthConfig(env);
  if (configError) return { error: configError, status: 500 };

  const sessionId = getSessionId(request);
  if (!sessionId) return { error: "Owner login required.", status: 401 };

  const session = await env.AUTH_KV.get(sessionKey(sessionId), "json");
  if (!session) return { error: "Owner login required.", status: 401 };

  return { session };
}

export function roleForEmail(env, email) {
  const admins = parseList(env.TURNPO_ADMIN_EMAILS || env.ADMIN_EMAILS || "");
  return admins.includes(normalizeEmail(email)) ? "admin" : "user";
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
  return { session: auth.session, user };
}

export async function requireAdminSession(request, env) {
  const auth = await requireUserSession(request, env);
  if (auth.error) return auth;
  if (auth.user.role !== "admin") return { error: "Admin access required.", status: 403 };
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
  const cleanContent = (item) => {
    const clean = pick(item, PUBLIC_CONTENT_FIELDS);
    clean.link = safePublicUrl(clean.link);
    clean.image = safePublicUrl(clean.image);
    clean.images = Array.isArray(clean.images) ? clean.images.map(safePublicUrl).filter(Boolean) : [];
    return clean;
  };
  const cleanProfile = pick(profile, PUBLIC_PROFILE_FIELDS);
  cleanProfile.avatar = safePublicUrl(cleanProfile.avatar);

  return {
    ...cleanProfile,
    status: "published",
    links: cleanPublicLinks(profile.links),
    values: Array.isArray(profile.values) ? profile.values : [],
    themes: Array.isArray(profile.themes) ? profile.themes : [],
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
