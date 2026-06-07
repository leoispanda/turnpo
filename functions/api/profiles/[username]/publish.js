import {
  assertOwnerProfile,
  json,
  normalizeUsername,
  ownerSession,
  profileDraftKey,
  profilePublishedKey,
  profileStore,
  readJson,
  requireProfileStoreConfig
} from "../../auth/_utils.js";

const MAX_PROFILE_BYTES = 10 * 1024 * 1024;

export async function onRequestPost({ request, env, params }) {
  const configError = requireProfileStoreConfig(env);
  if (configError) return json({ error: "Profile storage is not configured." }, { status: 500 });

  const username = normalizeUsername(params.username);
  const auth = await ownerSession(request, env);
  if (auth.error) return json({ error: auth.error }, { status: auth.status });
  if (!assertOwnerProfile(auth.session, username)) return json({ error: "Not allowed for this profile." }, { status: 403 });

  const { profile } = await readJson(request);
  if (!profile || normalizeUsername(profile.username) !== username) {
    return json({ error: "Profile payload does not match this owner." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const payload = JSON.stringify({
    profile: {
      ...profile,
      status: "published"
    },
    publishedAt: now,
    updatedAt: now,
    updatedBy: auth.session.email || ""
  });
  if (new TextEncoder().encode(payload).length > MAX_PROFILE_BYTES) {
    return json({ error: "Profile is too large for online publishing." }, { status: 413 });
  }

  const store = profileStore(env);
  await store.put(profileDraftKey(username), payload);
  await store.put(profilePublishedKey(username), payload);

  return json({ ok: true, publishedAt: now });
}
