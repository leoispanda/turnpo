import { wrapR2Bucket, costResponse } from "../../../../_shared/cost-guard.js";
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

  let object;
  try {
    object = await wrapR2Bucket(mediaStore(env), env).get(`profiles/${username}/${mediaId}`);
  } catch (error) {
    const limited = costResponse(error);
    if (limited) return limited;
    throw error;
  }
  if (!object) return json({ error: "Image not found." }, { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", headers.get("cache-control") || "public, max-age=31536000, immutable");
  headers.set("x-content-type-options", "nosniff");
  return new Response(object.body, { headers });
}
