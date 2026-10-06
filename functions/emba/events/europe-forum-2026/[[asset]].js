import { onRequestGet as embaAccessGet, onRequestPost as embaAccessPost } from "../../[[path]].js";

const EVENT_PATH = "/emba/events/europe-forum-2026/";
const R2_PREFIX = "emba/2026-09/events/europe-forum-2026/20261006/";
const FILE_TYPES = {
  "index.html": "text/html; charset=utf-8",
  "leo-forum-route.pdf": "application/pdf",
  "leo-forum-route-mobile.png": "image/png",
  "leo-forum-route-pack.zip": "application/zip"
};

export async function onRequestGet(context) {
  return embaAccessGet({
    ...context,
    next: async () => {
      const pathname = new URL(context.request.url).pathname;
      if (pathname === EVENT_PATH.slice(0, -1)) {
        return new Response(null, { status: 308, headers: { location: EVENT_PATH, "cache-control": "private, no-store" } });
      }
      const filename = pathname.startsWith(EVENT_PATH) ? pathname.slice(EVENT_PATH.length) || "index.html" : "";
      if (!Object.hasOwn(FILE_TYPES, filename)) return new Response("Event file not found.", { status: 404 });
      if (!context.env.EMBA_BUCKET) return new Response("Event storage is unavailable.", { status: 503 });
      const object = await context.env.EMBA_BUCKET.get(R2_PREFIX + filename);
      if (!object) return new Response("Event file not found.", { status: 404 });
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("content-type", FILE_TYPES[filename]);
      headers.set("cache-control", "private, no-store");
      headers.set("x-content-type-options", "nosniff");
      headers.set("x-robots-tag", "noindex, nofollow");
      headers.set("content-length", String(object.size));
      headers.set("etag", object.httpEtag);
      return new Response(object.body, { headers });
    }
  });
}

export async function onRequestPost(context) {
  const response = await embaAccessPost(context);
  if (response.status !== 303) return response;
  const headers = new Headers(response.headers);
  headers.set("location", EVENT_PATH);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
