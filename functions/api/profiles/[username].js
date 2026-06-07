import {
  json,
  normalizeUsername,
  profilePublishedKey,
  profileStore,
  requireProfileStoreConfig
} from "../auth/_utils.js";

export async function onRequestGet({ env, params }) {
  const configError = requireProfileStoreConfig(env);
  if (configError) return json({ error: "Profile storage is not configured." }, { status: 500 });

  const username = normalizeUsername(params.username);
  if (!username) return json({ error: "Profile is required." }, { status: 400 });

  const stored = await profileStore(env).get(profilePublishedKey(username), "json");
  if (!stored?.profile) return json({ error: "No published online profile." }, { status: 404 });

  return json({
    profile: stored.profile,
    publishedAt: stored.publishedAt || "",
    updatedAt: stored.updatedAt || ""
  });
}
