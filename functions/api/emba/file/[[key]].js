import {
  json,
  requireEmbaAccess,
  validR2Key
} from "../_utils.js";

function keyFromParams(params = {}) {
  const value = params.key;
  const parts = Array.isArray(value) ? value : [value];
  return parts.map((part) => String(part || "")).filter(Boolean).join("/");
}

export async function onRequestGet({ request, env, params }) {
  const denied = await requireEmbaAccess(request, env);
  if (denied) return denied;

  if (!env.EMBA_BUCKET) {
    return json({
      error: "EMBA file bucket is not configured.",
      configured: false,
      binding: "EMBA_BUCKET"
    }, { status: 503 });
  }

  const key = keyFromParams(params);
  if (!validR2Key(key)) return json({ error: "Invalid EMBA file key." }, { status: 400 });

  const object = await env.EMBA_BUCKET.get(key);
  if (!object) return json({ error: "EMBA file not found." }, { status: 404 });

  const headers = new Headers({
    "cache-control": "private, no-store",
    "x-content-type-options": "nosniff",
    "content-length": String(object.size)
  });
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);

  return new Response(object.body, { headers });
}
