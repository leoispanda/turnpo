import {
  json,
  readJson,
  requestContentLengthTooLarge,
  validateJsonMutationRequest,
  validateSameOriginRequest
} from "../auth/_utils.js";

const ACCESS_COOKIE = "turnpo_emba_access";
const DEFAULT_START_MONTH = "2026-07";
const DEFAULT_END_MONTH = "2028-12";
const MAX_LIBRARY_BODY_BYTES = 900 * 1024;
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_MONTHS = 60;
const MAX_MATERIALS_PER_MONTH = 100;
const MAX_MEMORIES_PER_MONTH = 100;
const MAX_THINKING_ITEMS_PER_MONTH = 12;

export { json, MAX_UPLOAD_BYTES };

function configuredAccessCode(env) {
  return String(env.EMBA_ACCESS_CODE || "emba2026").trim();
}

function cookieValue(request, name) {
  const cookie = request.headers.get("cookie") || "";
  return cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1) || "";
}

function timingSafeEqual(left, right) {
  const a = String(left);
  const b = String(right);
  let mismatch = a.length === b.length ? 0 : 1;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return mismatch === 0;
}

async function hmacHex(secret, value) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function isValidToken(token, secret) {
  const [expiresAt, signature] = String(token || "").split(".");
  const expiry = Number(expiresAt);
  if (!Number.isFinite(expiry) || expiry < Math.floor(Date.now() / 1000) || !signature) return false;
  const expected = await hmacHex(secret, String(expiresAt));
  return timingSafeEqual(signature, expected);
}

export async function requireEmbaAccess(request, env) {
  const token = cookieValue(request, ACCESS_COOKIE);
  if (await isValidToken(token, configuredAccessCode(env))) return null;
  return json({ error: "EMBA access required." }, { status: 401 });
}

export function validateLibraryMutation(request) {
  if (requestContentLengthTooLarge(request, MAX_LIBRARY_BODY_BYTES)) {
    return { error: "EMBA library update is too large.", status: 413 };
  }
  return validateJsonMutationRequest(request);
}

export function validateUploadMutation(request) {
  if (requestContentLengthTooLarge(request, MAX_UPLOAD_BYTES)) {
    return { error: "EMBA upload is too large.", status: 413 };
  }
  return validateSameOriginRequest(request);
}

function cleanText(value = "", maxLength = 1200) {
  return String(value || "").trim().slice(0, maxLength);
}

export function cleanMonthKey(value = "", fallback = "") {
  const month = cleanText(value, 7);
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : fallback;
}

function safePrivateUrl(value = "") {
  const url = cleanText(value, 2000);
  if (!url || /^data:/i.test(url) || url.includes("\\")) return "";
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("..")) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : "";
  } catch {
    return "";
  }
}

function normalizeMaterial(item = {}) {
  return {
    title: cleanText(item.title || item.name || "Material", 180),
    type: cleanText(item.type || "", 80),
    file: safePrivateUrl(item.file || item.href || ""),
    notes: cleanText(item.notes || item.summary || "", 5000)
  };
}

function normalizeMemory(item = {}, monthKey = "") {
  return {
    title: cleanText(item.title || "Memory", 180),
    image: safePrivateUrl(item.image || item.photo || item.file || ""),
    caption: cleanText(item.caption || item.notes || "", 5000),
    month: cleanMonthKey(item.month || monthKey, monthKey)
  };
}

function normalizeThinkingQuestion(item = "") {
  const text = typeof item === "string" ? item : item?.body || item?.title || "";
  return cleanText(text, 400);
}

export function normalizeLibraryPayload(payload = {}) {
  const timeline = {
    startMonth: cleanMonthKey(payload?.timeline?.startMonth, DEFAULT_START_MONTH),
    endMonth: cleanMonthKey(payload?.timeline?.endMonth, DEFAULT_END_MONTH)
  };
  const months = Array.isArray(payload?.months) ? payload.months : [];
  return {
    timeline,
    months: months.slice(0, MAX_MONTHS).map((month) => {
      const monthKey = cleanMonthKey(month?.month || month?.id, DEFAULT_START_MONTH);
      return {
        id: cleanText(month?.id || monthKey, 80),
        month: monthKey,
        title: cleanText(month?.title || monthKey, 180),
        materials: (Array.isArray(month?.materials) ? month.materials : [])
          .slice(0, MAX_MATERIALS_PER_MONTH)
          .map(normalizeMaterial),
        reflection: cleanText(month?.reflection || month?.notes || "", 120000),
        thinkingQuestions: (Array.isArray(month?.thinkingQuestions) ? month.thinkingQuestions : [])
          .slice(0, MAX_THINKING_ITEMS_PER_MONTH)
          .map(normalizeThinkingQuestion)
          .filter(Boolean),
        markdown: cleanText(month?.markdown || month?.md || month?.searchNotes || "", 180000),
        memoryMoment: (Array.isArray(month?.memoryMoment) ? month.memoryMoment : [])
          .slice(0, MAX_MEMORIES_PER_MONTH)
          .map((item) => normalizeMemory(item, monthKey))
      };
    }).sort((a, b) => a.month.localeCompare(b.month))
  };
}

export async function readLibraryRequest(request) {
  const payload = await readJson(request);
  return normalizeLibraryPayload(payload?.library || payload);
}

export function libraryJsonTooLarge(library) {
  return JSON.stringify(library).length > MAX_LIBRARY_BODY_BYTES;
}

export function safeUploadName(value = "") {
  const base = String(value || "upload")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return base || "upload";
}

export function fileUrlFromKey(key = "") {
  return `/api/emba/file/${String(key).split("/").map(encodeURIComponent).join("/")}`;
}

export function validR2Key(value = "") {
  const key = String(value || "");
  return key.startsWith("emba/")
    && key.length <= 1024
    && !key.startsWith("/")
    && !key.includes("..")
    && !key.includes("\\");
}

export function contentDispositionFor(contentType = "", fileName = "upload") {
  const safeName = safeUploadName(fileName).replaceAll('"', "");
  const inline = /^(image\/(jpeg|png|gif|webp)|application\/pdf)$/i.test(contentType);
  return `${inline ? "inline" : "attachment"}; filename="${safeName}"`;
}
