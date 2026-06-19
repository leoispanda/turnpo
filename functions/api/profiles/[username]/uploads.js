import {
  assertOwnerProfile,
  json,
  mediaStore,
  normalizeUsername,
  ownerSession,
  randomId,
  readJson,
  requestContentLengthTooLarge,
  requireMediaStoreConfig,
  validateJsonMutationRequest
} from "../../auth/_utils.js";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_UPLOAD_BODY_BYTES = 7 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function onRequestPost({ request, env, params }) {
  const configError = requireMediaStoreConfig(env);
  if (configError) return json({ error: configError }, { status: 500 });
  const requestError = validateJsonMutationRequest(request);
  if (requestError) return json({ error: requestError.error }, { status: requestError.status });
  if (requestContentLengthTooLarge(request, MAX_UPLOAD_BODY_BYTES)) {
    return json({ error: "Image upload request is too large." }, { status: 413 });
  }

  const username = normalizeUsername(params.username);
  const auth = await ownerSession(request, env);
  if (auth.error) return json({ error: auth.error }, { status: auth.status });
  if (!assertOwnerProfile(auth.session, username)) return json({ error: "Not allowed for this profile." }, { status: 403 });

  const body = await readJson(request);
  const parsed = parseDataUrl(body.dataUrl || "");
  if (!parsed) return json({ error: "Expected an image data URL." }, { status: 400 });
  if (parsed.tooLarge) return json({ error: "Image is too large after compression." }, { status: 413 });
  if (parsed.invalidImage) return json({ error: "Image file signature does not match its declared type." }, { status: 400 });
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
  const contentType = match[1].toLowerCase();
  const base64 = match[2];
  const estimatedBytes = Math.floor(base64.replace(/=+$/g, "").length * 3 / 4);
  if (estimatedBytes > MAX_UPLOAD_BYTES) return { contentType, tooLarge: true };
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  if (!hasImageSignature(contentType, bytes)) return { contentType, invalidImage: true };
  return { contentType, bytes };
}

function hasImageSignature(contentType, bytes) {
  if (contentType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (contentType === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (contentType === "image/gif") {
    return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38;
  }
  if (contentType === "image/webp") {
    return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
      && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  }
  return false;
}

function safeFilename(value) {
  return String(value).replace(/[^\w.\- ]+/g, "").trim().slice(0, 120);
}
