import {
  assertOwnerProfile,
  json,
  mediaStore,
  normalizeUsername,
  ownerSession,
  randomId,
  readJson,
  requireMediaStoreConfig
} from "../../auth/_utils.js";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function onRequestPost({ request, env, params }) {
  const configError = requireMediaStoreConfig(env);
  if (configError) return json({ error: configError }, { status: 500 });

  const username = normalizeUsername(params.username);
  const auth = await ownerSession(request, env);
  if (auth.error) return json({ error: auth.error }, { status: auth.status });
  if (!assertOwnerProfile(auth.session, username)) return json({ error: "Not allowed for this profile." }, { status: 403 });

  const body = await readJson(request);
  const parsed = parseDataUrl(body.dataUrl || "");
  if (!parsed) return json({ error: "Expected an image data URL." }, { status: 400 });
  if (!IMAGE_TYPES.has(parsed.contentType)) return json({ error: "Unsupported image type." }, { status: 400 });
  if (parsed.bytes.byteLength > MAX_UPLOAD_BYTES) return json({ error: "Image is too large after compression." }, { status: 413 });

  const mediaId = randomId();
  const key = `profiles/${username}/${mediaId}`;
  await mediaStore(env).put(key, parsed.bytes, {
    httpMetadata: {
      contentType: parsed.contentType,
      cacheControl: "public, max-age=31536000, immutable"
    },
    customMetadata: {
      profile: username,
      originalFilename: safeFilename(body.filename || "")
    }
  });

  return json({
    url: `/api/profiles/${encodeURIComponent(username)}/media/${mediaId}`,
    key,
    mediaId,
    contentType: parsed.contentType,
    uploadedAt: new Date().toISOString()
  });
}

function parseDataUrl(value) {
  const match = String(value).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=]+)$/);
  if (!match) return null;
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return { contentType: match[1].toLowerCase(), bytes };
}

function safeFilename(value) {
  return String(value).replace(/[^\w.\- ]+/g, "").trim().slice(0, 120);
}
