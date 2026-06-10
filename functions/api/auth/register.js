import {
  SESSION_TTL_SECONDS,
  json,
  normalizeEmail,
  ownerProfileForEmail,
  ownerProfileKey,
  profileDraftKey,
  profilePublishedKey,
  profileStore,
  randomId,
  readJson,
  registeredUsernameKey,
  requireAuthConfig,
  requireProfileStoreConfig,
  sessionCookie,
  sessionKey,
  usernameFromName,
  validUsername
} from "./_utils.js";

function publicState() {
  return {
    hiddenStoryIds: [],
    deletedStoryIds: [],
    hiddenWorkIds: [],
    deletedWorkIds: [],
    collapsedYears: []
  };
}

function profileFromRegistration({ name, username, email }) {
  const now = new Date().toISOString();
  return {
    id: `profile-${username}`,
    status: "published",
    seedVersion: "registered-user-2026-06-10",
    username,
    displayName: name,
    ownerEmail: email,
    oneLineIntro: `${name} is building a Turnpo profile in the AI era.`,
    currentChapter: "Shaping a public profile through turning points, meaningful work, and owner-approved stories.",
    location: "",
    avatar: "/assets/turnpo-logo-full.png",
    avatarPositionY: 24,
    links: [],
    values: [],
    themes: [],
    lifeStories: [],
    aiWorks: [],
    publicState: publicState(),
    createdAt: now,
    updatedAt: now
  };
}

export async function onRequestPost({ request, env }) {
  const authError = requireAuthConfig(env);
  if (authError) return json({ error: "Auth is not configured." }, { status: 500 });
  const profileError = requireProfileStoreConfig(env);
  if (profileError) return json({ error: "Profile storage is not configured." }, { status: 500 });

  const { name: rawName, email: rawEmail } = await readJson(request);
  const name = String(rawName || "").trim().replace(/\s+/g, " ");
  const email = normalizeEmail(rawEmail);
  if (name.length < 2) return json({ error: "Enter your name." }, { status: 400 });
  if (!email || !email.includes("@")) return json({ error: "Enter a valid email address." }, { status: 400 });

  const existingProfile = await ownerProfileForEmail(env, email);
  if (existingProfile) return json({ error: "This email already has a Turnpo profile. Please use email code login." }, { status: 409 });

  let username = usernameFromName(name);
  if (!validUsername(username)) username = `turnpo-${randomId().slice(0, 8)}`;

  const store = profileStore(env);
  let availableUsername = "";
  for (let index = 0; index < 12; index += 1) {
    const candidate = index ? `${username}-${index + 1}` : username;
    if (!validUsername(candidate)) continue;
    const claimed = await env.AUTH_KV.get(registeredUsernameKey(candidate));
    const published = await store.get(profilePublishedKey(candidate));
    const draft = await store.get(profileDraftKey(candidate));
    if (!claimed && !published && !draft) {
      availableUsername = candidate;
      break;
    }
  }

  if (!availableUsername) return json({ error: "Could not create a unique username. Please try a more specific name." }, { status: 409 });
  username = availableUsername;

  const now = new Date().toISOString();
  const profile = profileFromRegistration({ name, username, email });
  const record = JSON.stringify({
    profile,
    createdAt: now,
    updatedAt: now,
    updatedBy: email
  });

  await env.AUTH_KV.put(ownerProfileKey(email), username);
  await env.AUTH_KV.put(registeredUsernameKey(username), email);
  await store.put(profileDraftKey(username), record);
  await store.put(profilePublishedKey(username), JSON.stringify({
    profile,
    publishedAt: now,
    updatedAt: now,
    updatedBy: email
  }));

  const sessionId = randomId();
  await env.AUTH_KV.put(sessionKey(sessionId), JSON.stringify({
    email,
    profile: username,
    createdAt: now
  }), { expirationTtl: SESSION_TTL_SECONDS });

  return json({
    ok: true,
    profile: username,
    profileData: profile
  }, {
    headers: {
      "set-cookie": sessionCookie(sessionId)
    }
  });
}
