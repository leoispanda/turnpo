import {
  json,
  mediaStore,
  normalizeUsername,
  requireMediaStoreConfig
} from "../../../auth/_utils.js";

export async function onRequestGet({ env, params }) {
  const configError = requireMediaStoreConfig(env);
  if (configError) return json({ error: configError }, { status: 500 });

  const username = normalizeUsername(params.username);
  const mediaId = String(params.mediaId || "").trim();
  if (!mediaId || /[^a-f0-9]/.test(mediaId)) return json({ error: "Invalid media id." }, { status: 400 });

  const object = await mediaStore(env).get(`profiles/${username}/${mediaId}`);
  if (!object) return json({ error: "Image not found." }, { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", headers.get("cache-control") || "public, max-age=31536000, immutable");
  headers.set("x-content-type-options", "nosniff");
  return new Response(object.body, { headers });
}
