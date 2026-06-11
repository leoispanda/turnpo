import {
  json,
  profileDraftKey,
  profilePublishedKey,
  profileStore,
  requireAdminSession,
  requireProfileStoreConfig
} from "../auth/_utils.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireAdminSession(request, env);
  if (auth.error) return json({ error: auth.error }, { status: auth.status });
  const profileError = requireProfileStoreConfig(env);
  if (profileError) return json({ error: "Profile storage is not configured." }, { status: 500 });

  const users = await listUsers(env);
  const profiles = await profileStats(env, users);
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  return json({
    viewer: auth.access,
    totalAccounts: users.length,
    newAccountsToday: users.filter((user) => dateValue(user.createdAt) >= startOfToday.getTime()).length,
    newAccountsThisWeek: users.filter((user) => dateValue(user.createdAt) >= startOfWeek.getTime()).length,
    publishedProfilesCount: profiles.publishedProfilesCount,
    draftPrivateProfilesCount: profiles.draftPrivateProfilesCount,
    disabledDeletedAccounts: users.filter((user) => user.status && user.status !== "active").length,
    storagePublishedRecords: profiles.storagePublishedRecords,
    storageDraftRecords: profiles.storageDraftRecords
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

async function profileStats(env, users) {
  const store = profileStore(env);
  const usernames = [...new Set(users
    .map((user) => user.username || user.profile || "")
    .filter(Boolean))];
  let publishedProfilesCount = 0;
  let draftPrivateProfilesCount = 0;

  await Promise.all(usernames.map(async (username) => {
    const [published, draft] = await Promise.all([
      store.get(profilePublishedKey(username), "json"),
      store.get(profileDraftKey(username), "json")
    ]);
    if (published?.profile?.status === "published" || published) {
      publishedProfilesCount += 1;
      return;
    }
    if (draft) draftPrivateProfilesCount += 1;
  }));

  return {
    publishedProfilesCount,
    draftPrivateProfilesCount,
    storagePublishedRecords: await countKeys(store, "profile:published:"),
    storageDraftRecords: await countKeys(store, "profile:draft:")
  };
}

async function countKeys(store, prefix) {
  if (typeof store.list !== "function") return 0;
  let count = 0;
  let cursor;
  do {
    const page = await store.list({ prefix, cursor });
    cursor = page.cursor;
    count += (page.keys || []).length;
  } while (cursor);
  return count;
}

function dateValue(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}
