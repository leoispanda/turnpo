import {
  json,
  profilePublishedKey,
  profileStore,
  requireAdminSession,
  requireProfileStoreConfig
} from "../auth/_utils.js";

const SITE_URL = "https://www.turnpo.com";

export async function onRequestGet({ request, env }) {
  const auth = await requireAdminSession(request, env);
  if (auth.error) return json({ error: auth.error }, { status: auth.status });
  const profileError = requireProfileStoreConfig(env);
  if (profileError) return json({ error: "Profile storage is not configured." }, { status: 500 });

  const users = await listUsers(env);
  const store = profileStore(env);
  const rows = await Promise.all(users.map(async (user) => {
    const username = user.username || user.profile || "";
    const published = username ? await store.get(profilePublishedKey(username), "json") : null;
    return {
      id: user.id,
      email: user.email,
      username,
      displayName: user.displayName || username || "",
      createdAt: user.createdAt || "",
      lastLoginAt: user.lastLoginAt || "",
      publicProfileUrl: username ? `${SITE_URL}/u/${encodeURIComponent(username)}` : "",
      profileVisibility: published?.profile?.status || "draft/private",
      role: user.role || "user",
      status: user.status || "active"
    };
  }));

  return json({
    users: rows.sort((a, b) => dateValue(b.createdAt) - dateValue(a.createdAt))
  });
}

async function listUsers(env) {
  if (typeof env.AUTH_KV.list !== "function") return [];
  const records = [];
  let cursor;
  do {
    const page = await env.AUTH_KV.list({ prefix: "user:id:", cursor });
    cursor = page.cursor;
    for (const key of page.keys || []) {
      const user = await env.AUTH_KV.get(key.name, "json");
      if (user) records.push(user);
    }
  } while (cursor);
  return records;
}

function dateValue(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}
