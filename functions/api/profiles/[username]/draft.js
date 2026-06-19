import {
  assertOwnerProfile,
  cleanOwnerProfileForStorage,
  json,
  normalizeUsername,
  ownerSession,
  profileDraftKey,
  profileStore,
  readJson,
  requestContentLengthTooLarge,
  requireProfileStoreConfig,
  validateJsonMutationRequest
} from "../../auth/_utils.js";

const MAX_PROFILE_BYTES = 10 * 1024 * 1024;

export async function onRequestGet({ request, env, params }) {
  const configError = requireProfileStoreConfig(env);
  if (configError) return json({ error: "Profile storage is not configured." }, { status: 500 });

  const username = normalizeUsername(params.username);
  const auth = await ownerSession(request, env);
  if (auth.error) return json({ error: auth.error }, { status: auth.status });
  if (!assertOwnerProfile(auth.session, username)) return json({ error: "Not allowed for this profile." }, { status: 403 });

  const stored = await profileStore(env).get(profileDraftKey(username), "json");
  if (!stored?.profile) return json({ error: "No online draft." }, { status: 404 });

  return json({
    profile: stored.profile,
    savedAt: stored.savedAt || "",
    updatedAt: stored.updatedAt || ""
  });
}

export async function onRequestPut({ request, env, params }) {
  const configError = requireProfileStoreConfig(env);
  if (configError) return json({ error: "Profile storage is not configured." }, { status: 500 });
  const requestError = validateJsonMutationRequest(request);
  if (requestError) return json({ error: requestError.error }, { status: requestError.status });
  if (requestContentLengthTooLarge(request, MAX_PROFILE_BYTES)) {
    return json({ error: "Profile draft is too large for online storage." }, { status: 413 });
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
  const cleanProfile = cleanOwnerProfileForStorage(profile, username, auth.session.email || "");
  const payload = JSON.stringify({
    profile: cleanProfile,
    savedAt: now,
    updatedAt: now,
    updatedBy: auth.session.email || ""
  });
  if (new TextEncoder().encode(payload).length > MAX_PROFILE_BYTES) {
    return json({ error: "Profile draft is too large for online storage." }, { status: 413 });
  }

  await profileStore(env).put(profileDraftKey(username), payload);
  return json({ ok: true, savedAt: now });
}
