import {
  json,
  libraryJsonTooLarge,
  normalizeLibraryPayload,
  readLibraryRequest,
  requireEmbaAccess,
  validateLibraryMutation
} from "./_utils.js";

const STATE_KEY = "library";

async function embaDb(env) {
  if (!env.EMBA_DB) return null;
  await env.EMBA_DB.prepare(`
    CREATE TABLE IF NOT EXISTS emba_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();
  return env.EMBA_DB;
}

function missingDatabaseResponse() {
  return json({
    error: "EMBA cloud database is not configured.",
    configured: false,
    binding: "EMBA_DB"
  }, { status: 503 });
}

export async function onRequestGet({ request, env }) {
  const denied = await requireEmbaAccess(request, env);
  if (denied) return denied;

  const db = await embaDb(env);
  if (!db) return missingDatabaseResponse();

  const row = await db.prepare("SELECT value, updated_at FROM emba_state WHERE key = ?")
    .bind(STATE_KEY)
    .first();
  if (!row) {
    return json({
      configured: true,
      updated: "",
      timeline: {},
      months: []
    });
  }

  try {
    const library = normalizeLibraryPayload(JSON.parse(row.value));
    return json({
      configured: true,
      updated: row.updated_at,
      ...library
    });
  } catch {
    return json({ error: "Stored EMBA library data is invalid." }, { status: 500 });
  }
}

export async function onRequestPut({ request, env }) {
  const denied = await requireEmbaAccess(request, env);
  if (denied) return denied;

  const mutationError = validateLibraryMutation(request);
  if (mutationError) return json({ error: mutationError.error }, { status: mutationError.status });

  const db = await embaDb(env);
  if (!db) return missingDatabaseResponse();

  const library = await readLibraryRequest(request);
  if (libraryJsonTooLarge(library)) {
    return json({ error: "EMBA library update is too large." }, { status: 413 });
  }

  const now = new Date().toISOString();
  await db.prepare(`
    INSERT INTO emba_state (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `).bind(STATE_KEY, JSON.stringify(library), now).run();

  return json({
    ok: true,
    updated: now,
    ...library
  });
}

export async function onRequestPost(context) {
  return onRequestPut(context);
}
