import {
  assertOwnerProfile,
  cleanOwnerProfileForStorage,
  json,
  normalizeUsername,
  ownerSession,
  publicProfile,
  profileDraftKey,
  profilePublishedKey,
  profileStore,
  readJson,
  requestContentLengthTooLarge,
  requireProfileStoreConfig,
  validateJsonMutationRequest
} from "../../auth/_utils.js";

const MAX_PROFILE_BYTES = 10 * 1024 * 1024;

export async function onRequestPost({ request, env, params }) {
  const configError = requireProfileStoreConfig(env);
  if (configError) return json({ error: "Profile storage is not configured." }, { status: 500 });
  const requestError = validateJsonMutationRequest(request);
  if (requestError) return json({ error: requestError.error }, { status: requestError.status });
  if (requestContentLengthTooLarge(request, MAX_PROFILE_BYTES)) {
    return json({ error: "Profile is too large for online publishing." }, { status: 413 });
  }

  const username = normalizeUsername(params.username);
  const auth = await ownerSession(request, env);
  if (auth.error) return json({ error: auth.error }, { status: auth.status });
  if (!assertOwnerProfile(auth.session, username)) return json({ error: "Not allowed for this profile." }, { status: 403 });

  const { profile } = await readJson(request);
  if (!profile || normalizeUsername(profile.username) !== username) {
    return json({ error: "Profile payload does not match this owner." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const cleanProfile = {
    ...cleanOwnerProfileForStorage(profile, username, auth.session.email || ""),
    status: "published",
    updatedAt: now
  };
  const draftPayload = JSON.stringify({
    profile: cleanProfile,
    publishedAt: now,
    updatedAt: now,
    updatedBy: auth.session.email || ""
  });
  const publishedPayload = JSON.stringify({
    profile: publicProfile(cleanProfile),
    publishedAt: now,
    updatedAt: now
  });
  if (new TextEncoder().encode(draftPayload).length > MAX_PROFILE_BYTES) {
    return json({ error: "Profile is too large for online publishing." }, { status: 413 });
  }

  const store = profileStore(env);
  await store.put(profileDraftKey(username), draftPayload);
  await store.put(profilePublishedKey(username), publishedPayload);

  return json({ ok: true, publishedAt: now });
}
