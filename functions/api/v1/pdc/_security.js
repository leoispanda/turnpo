export function requestId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `pdc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function constantTimeEqual(left, right) {
  const a = String(left || "");
  const b = String(right || "");
  let mismatch = a.length === b.length ? 0 : 1;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    mismatch |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  }
  return mismatch === 0;
}

export function bearerToken(request) {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

export function configuredToken(env = {}, names = []) {
  for (const name of names) {
    const value = String(env[name] || "").trim();
    if (value) return { name, value };
  }
  return { name: "", value: "" };
}

export function authenticateBearer(request, env = {}, names = []) {
  const configured = configuredToken(env, names);
  if (!configured.value) return { status: "NOT_CONFIGURED", token: "" };
  return constantTimeEqual(bearerToken(request), configured.value)
    ? { status: "OK", token: configured.value, token_name: configured.name }
    : { status: "UNAUTHORIZED", token: "" };
}

export async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function safeRunId(value) {
  const runId = String(value || "").trim();
  return /^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$/.test(runId) ? runId : "";
}
