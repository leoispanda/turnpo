import {
  MAX_UPLOAD_BYTES,
  cleanMonthKey,
  contentDispositionFor,
  fileUrlFromKey,
  json,
  requireEmbaAccess,
  safeUploadName,
  validateUploadMutation
} from "./_utils.js";

function missingBucketResponse() {
  return json({
    error: "EMBA file bucket is not configured.",
    configured: false,
    binding: "EMBA_BUCKET"
  }, { status: 503 });
}

function validKind(value = "") {
  return value === "memory" || value === "material" ? value : "material";
}

function cleanContentType(value = "") {
  const contentType = String(value || "application/octet-stream").trim().toLowerCase();
  if (
    contentType === "text/html"
    || contentType === "image/svg+xml"
    || contentType.includes("javascript")
  ) {
    return "";
  }
  return contentType || "application/octet-stream";
}

export async function onRequestPost({ request, env }) {
  const denied = await requireEmbaAccess(request, env);
  if (denied) return denied;

  const mutationError = validateUploadMutation(request);
  if (mutationError) return json({ error: mutationError.error }, { status: mutationError.status });
  if (!env.EMBA_BUCKET) return missingBucketResponse();

  const formData = await request.formData();
  const file = formData.get("file") || formData.get("image");
  if (!file || typeof file.arrayBuffer !== "function") {
    return json({ error: "Upload file is required." }, { status: 400 });
  }
  if (Number(file.size || 0) > MAX_UPLOAD_BYTES) {
    return json({ error: "EMBA upload is too large." }, { status: 413 });
  }

  const contentType = cleanContentType(file.type);
  if (!contentType) return json({ error: "This file type is not allowed." }, { status: 415 });

  const month = cleanMonthKey(formData.get("month"), "2026-07");
  const kind = validKind(String(formData.get("kind") || ""));
  const safeName = safeUploadName(file.name || "upload");
  const key = `emba/${month}/${kind}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const data = await file.arrayBuffer();
  if (data.byteLength > MAX_UPLOAD_BYTES) {
    return json({ error: "EMBA upload is too large." }, { status: 413 });
  }

  await env.EMBA_BUCKET.put(key, data, {
    httpMetadata: {
      contentType,
      contentDisposition: contentDispositionFor(contentType, safeName),
      cacheControl: "private, no-store"
    },
    customMetadata: {
      month,
      kind,
      originalName: safeName,
      uploadedAt: new Date().toISOString()
    }
  });

  return json({
    ok: true,
    key,
    url: fileUrlFromKey(key),
    name: file.name || safeName,
    type: contentType,
    size: data.byteLength
  });
}
