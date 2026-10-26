import { wrapR2Bucket, costResponse } from "../../../_shared/cost-guard.js";
import { json, requireEmbaAccess } from "../_utils.js";
import factsManifest from "../../../_shared/november-facts-videos.js";

// Immutable, verified NotebookLM exports; arbitrary bucket keys are never accepted.
const VIDEOS = Object.freeze({
  "2026-11-02": "emba/2026-11/video/2026-11-02-15b331397161.mp4",
  "2026-11-03": "emba/2026-11/video/2026-11-03-c62bf17dfd4e.mp4",
  "2026-11-04": "emba/2026-11/video/2026-11-04-e09526d5ca89.mp4",
  "2026-11-05": "emba/2026-11/video/2026-11-05-c214cf26e719.mp4",
  "2026-11-06": "emba/2026-11/video/2026-11-06-56ce85628ac5.mp4"
});

// A facts edition becomes available only after all five immutable exports are verified.
export function factsVideoKey(date, manifest = factsManifest) {
  if (manifest?.edition !== "facts" || manifest.published !== true
      || !Array.isArray(manifest.videos) || manifest.videos.length !== 5) return "";
  for (let index = 0; index < 5; index++) {
    const video = manifest.videos[index];
    const expectedDate = `2026-11-0${index + 2}`;
    if (!video || video.date !== expectedDate || typeof video.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(video.sha256)
        || video.r2Key !== `emba/2026-11/video/facts/${expectedDate}-${video.sha256.slice(0, 12)}.mp4`
        || typeof video.title !== "string" || !video.title.trim()
        || typeof video.duration !== "string" || !/^\d{1,2}:[0-5]\d$/.test(video.duration) || video.duration === "0:00" || video.duration === "00:00"
        || typeof video.notebookUrl !== "string" || !/^https:\/\/notebook(?:lm)?\.google\.com\/notebook\/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(video.notebookUrl)
        || !Number.isSafeInteger(video.bytes) || video.bytes <= 0 || video.bytes > 64 * 1024 * 1024) return "";
  }
  return manifest.videos.find(video => video.date === date)?.r2Key || "";
}

function byteRange(value, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2])) return null;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return null;
    const length = Math.min(suffix, size);
    return { offset: size - length, length };
  }
  const offset = Number(match[1]);
  const last = match[2] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(last)
      || offset >= size || last < offset) return null;
  return { offset, length: Math.min(last, size - 1) - offset + 1 };
}

async function serve({ request, env, params }) {
  const denied = await requireEmbaAccess(request, env);
  if (denied) return denied;
  const date = String(params?.date || "");
  if (!Object.hasOwn(VIDEOS, date)) return json({ error: "Video not found." }, { status: 404 });
  const editions = new URL(request.url).searchParams.getAll("edition");
  if (editions.length > 1 || (editions.length === 1 && editions[0] !== "facts")) {
    return json({ error: "Video not found." }, { status: 404 });
  }
  const facts = editions.length === 1;
  const key = facts ? factsVideoKey(date) : VIDEOS[date];
  if (!key) return json({ error: "Video not found." }, { status: 404 });
  if (!env.EMBA_BUCKET) return json({ error: "Video storage unavailable." }, { status: 503 });

  try {
    const bucket = wrapR2Bucket(env.EMBA_BUCKET, env);
    const meta = await bucket.head(key);
    if (!meta) return json({ error: "Video not found." }, { status: 404 });
    const headers = new Headers({
      "content-type": "video/mp4",
      "content-disposition": `inline; filename="${date}${facts ? "-facts" : ""}-study-video.mp4"`,
      "cache-control": "private, no-store",
      "accept-ranges": "bytes",
      "content-length": String(meta.size),
      "etag": meta.httpEtag,
      "x-content-type-options": "nosniff",
      "x-robots-tag": "noindex, nofollow"
    });
    if (meta.uploaded) headers.set("last-modified", meta.uploaded.toUTCString());
    if (request.method === "HEAD") return new Response(null, { headers });

    const ifRange = request.headers.get("if-range");
    const dateMatches = meta.uploaded && Number.isFinite(Date.parse(ifRange))
      && Date.parse(ifRange) >= Math.floor(meta.uploaded.getTime() / 1000) * 1000;
    const rangeHeader = (!ifRange || ifRange === meta.httpEtag || dateMatches)
      ? request.headers.get("range") : null;
    const range = rangeHeader ? byteRange(rangeHeader, meta.size) : undefined;
    if (range === null) {
      headers.set("content-range", `bytes */${meta.size}`);
      headers.set("content-length", "0");
      return new Response(null, { status: 416, headers });
    }
    const object = await bucket.get(key, range ? { range } : undefined);
    if (!object) return json({ error: "Video not found." }, { status: 404 });
    if (range) {
      headers.set("content-length", String(range.length));
      headers.set("content-range", `bytes ${range.offset}-${range.offset + range.length - 1}/${meta.size}`);
    }
    return new Response(object.body, { status: range ? 206 : 200, headers });
  } catch (error) {
    const limited = costResponse(error);
    if (limited) return limited;
    throw error;
  }
}

export const onRequestGet = serve;
export const onRequestHead = serve;
