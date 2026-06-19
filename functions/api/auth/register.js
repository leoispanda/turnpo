import {
  CODE_TTL_SECONDS,
  REGISTRATION_TTL_SECONDS,
  SESSION_TTL_SECONDS,
  accessForRole,
  cleanOwnerProfileForStorage,
  clientRateKey,
  codeKey,
  ensureUserForEmail,
  hashCode,
  incrementWindow,
  json,
  normalizeEmail,
  ownerProfileForEmail,
  ownerProfileKey,
  publicProfile,
  profileDraftKey,
  profilePublishedKey,
  profileStore,
  randomCode,
  randomId,
  readJson,
  recordUserLogin,
  requestContentLengthTooLarge,
  registrationKey,
  registeredUsernameKey,
  requestKey,
  requireAuthConfig,
  requireProfileStoreConfig,
  sendLoginCode,
  sessionCookie,
  sessionKey,
  userForEmail,
  validateJsonMutationRequest,
  verifyKey,
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
    travelPlaces: [],
    lifeStories: [],
    aiWorks: [],
    publicState: publicState(),
    createdAt: now,
    updatedAt: now
  };
}

const REQUIRED_ACKNOWLEDGEMENTS = [
  "publicProfile",
  "thirdPartyRisk",
  "contentResponsibility",
  "sensitiveContent",
  "aiReview",
  "legalTerms"
];
const REGISTRATION_MESSAGE = "Check your email for a 6-digit verification code if this address can continue.";
const MAX_REGISTRATION_BODY_BYTES = 32 * 1024;

function usernameBase(name) {
  const base = usernameFromName(name);
  const suffix = randomId().slice(0, 6);
  const stem = base
    .slice(0, Math.max(1, 31 - suffix.length))
    .replace(/-+$/g, "");
  const candidate = `${stem || "turnpo"}-${suffix}`;
  return validUsername(candidate) ? candidate : `turnpo-${randomId().slice(0, 8)}`;
}

async function createLoginSession(env, email, profile, { displayName = "" } = {}) {
  const user = await recordUserLogin(env, await ensureUserForEmail(env, {
    email,
    profile,
    username: profile,
    displayName: displayName || profile
  }));
  const sessionId = randomId();
  const now = new Date().toISOString();
  await env.AUTH_KV.put(sessionKey(sessionId), JSON.stringify({
    userId: user.id,
    email,
    profile,
    role: user.role,
    createdAt: now
  }), { expirationTtl: SESSION_TTL_SECONDS });
  return { user, sessionId };
}

export async function onRequestPost({ request, env }) {
  const authError = requireAuthConfig(env);
  if (authError) return json({ error: "Auth is not configured." }, { status: 500 });
  const profileError = requireProfileStoreConfig(env);
  if (profileError) return json({ error: "Profile storage is not configured." }, { status: 500 });
  const requestError = validateJsonMutationRequest(request);
  if (requestError) return json({ error: requestError.error }, { status: requestError.status });
  if (requestContentLengthTooLarge(request, MAX_REGISTRATION_BODY_BYTES)) {
    return json({ error: "Registration request is too large." }, { status: 413 });
  }

  const {
    name: rawName,
    email: rawEmail,
    code: rawCode,
    acknowledgements = {}
  } = await readJson(request);
  const name = String(rawName || "").trim().replace(/\s+/g, " ");
  const email = normalizeEmail(rawEmail);
  const code = String(rawCode || "").trim();
  if (name.length < 2) return json({ error: "Enter your name." }, { status: 400 });
  if (!email || !email.includes("@")) return json({ error: "Enter a valid email address." }, { status: 400 });
  if (!REQUIRED_ACKNOWLEDGEMENTS.every((key) => acknowledgements[key] === true)) {
    return json({ error: "Accept every required public-profile acknowledgement before registering." }, { status: 400 });
  }

  const existingUser = await userForEmail(env, email);
  const existingProfile = existingUser?.profile || await ownerProfileForEmail(env, email);

  if (!code) {
    const attempts = await incrementWindow(env, requestKey(`register:${email}`), 2 * 60);
    if (attempts > 5) return json({ error: "Too many registration code requests. Please try again later." }, { status: 429 });
    const clientAttempts = await incrementWindow(env, clientRateKey(request, "register", email), 2 * 60);
    if (clientAttempts > 10) return json({ error: "Too many registration code requests. Please try again later." }, { status: 429 });

    const verificationCode = randomCode();
    const codeHash = await hashCode(env, email, verificationCode);
    const createdAt = new Date().toISOString();
    if (existingProfile) {
      await env.AUTH_KV.delete(registrationKey(email));
      await env.AUTH_KV.put(codeKey(email), JSON.stringify({
        codeHash,
        email,
        profile: existingProfile,
        createdAt
      }), { expirationTtl: CODE_TTL_SECONDS });
    } else {
      const pending = {
        codeHash,
        name,
        email,
        acknowledgements: Object.fromEntries(REQUIRED_ACKNOWLEDGEMENTS.map((key) => [key, true])),
        createdAt
      };
      await env.AUTH_KV.put(registrationKey(email), JSON.stringify(pending), { expirationTtl: REGISTRATION_TTL_SECONDS });
      await env.AUTH_KV.put(codeKey(`register:${email}`), JSON.stringify({
        codeHash,
        email,
        profile: "",
        createdAt
      }), { expirationTtl: CODE_TTL_SECONDS });
    }

    const sent = await sendLoginCode(env, email, verificationCode);
    if (!sent.ok) return json({ error: "Could not send registration code." }, { status: 502 });

    return json({
      ok: true,
      verificationRequired: true,
      message: REGISTRATION_MESSAGE
    });
  }

  const verifyAttempts = await incrementWindow(env, verifyKey(`register:${email}`), 2 * 60);
  if (verifyAttempts > 8) return json({ error: "Too many verification attempts. Please request a new code later." }, { status: 429 });
  const clientVerifyAttempts = await incrementWindow(env, clientRateKey(request, "register-verify", email), 2 * 60);
  if (clientVerifyAttempts > 16) return json({ error: "Too many verification attempts. Please request a new code later." }, { status: 429 });

  if (existingProfile) {
    const storedLoginCode = await env.AUTH_KV.get(codeKey(email), "json");
    const submittedLoginHash = await hashCode(env, email, code);
    if (!storedLoginCode?.codeHash || storedLoginCode.email !== email || submittedLoginHash !== storedLoginCode.codeHash) {
      return json({ error: "Registration code is expired or incorrect." }, { status: 401 });
    }
    await env.AUTH_KV.delete(codeKey(email));
    const { user, sessionId } = await createLoginSession(env, email, existingProfile, {
      displayName: existingUser?.displayName || name
    });
    const access = accessForRole(user.role);
    return json({
      ok: true,
      profile: existingProfile,
      role: access.role,
      roleLabel: access.label,
      scopes: access.scopes,
      managementAreas: access.managementAreas,
      readOnly: access.readOnly
    }, {
      headers: {
        "set-cookie": sessionCookie(sessionId)
      }
    });
  }

  const pending = await env.AUTH_KV.get(registrationKey(email), "json");
  if (!pending?.codeHash || pending.email !== email) {
    return json({ error: "Registration code is expired or incorrect." }, { status: 401 });
  }

  const submittedHash = await hashCode(env, email, code);
  if (submittedHash !== pending.codeHash) {
    return json({ error: "Registration code is expired or incorrect." }, { status: 401 });
  }

  let username = usernameBase(name);

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
  let profile = profileFromRegistration({ name, username, email });
  profile.legalAcknowledgement = {
    version: "0.2",
    acceptedAt: now,
    acknowledgements: Object.fromEntries(REQUIRED_ACKNOWLEDGEMENTS.map((key) => [key, true]))
  };
  profile = cleanOwnerProfileForStorage(profile, username, email);
  const lateClaimed = await env.AUTH_KV.get(registeredUsernameKey(username));
  if (lateClaimed) return json({ error: "Could not create a unique username. Please try again." }, { status: 409 });
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
    profile: publicProfile(profile),
    publishedAt: now,
    updatedAt: now
  }));
  await env.AUTH_KV.delete(registrationKey(email));
  await env.AUTH_KV.delete(codeKey(`register:${email}`));

  const user = await recordUserLogin(env, await ensureUserForEmail(env, {
    email,
    profile: username,
    username,
    displayName: name,
    now
  }));
  const sessionId = randomId();
  await env.AUTH_KV.put(sessionKey(sessionId), JSON.stringify({
    userId: user.id,
    email,
    profile: username,
    role: user.role,
    createdAt: now
  }), { expirationTtl: SESSION_TTL_SECONDS });

  const access = accessForRole(user.role);
  return json({
    ok: true,
    profile: username,
    profileData: profile,
    role: access.role,
    roleLabel: access.label,
    scopes: access.scopes,
    managementAreas: access.managementAreas,
    readOnly: access.readOnly
  }, {
    headers: {
      "set-cookie": sessionCookie(sessionId)
    }
  });
}
