import assert from "node:assert/strict";

import {
  cleanOwnerProfileForStorage,
  publicProfile,
  validateJsonMutationRequest
} from "../functions/api/auth/_utils.js";
import { onRequestPost as registerPost } from "../functions/api/auth/register.js";

class MemoryKv {
  constructor() {
    this.records = new Map();
  }

  async get(key, type) {
    const value = this.records.get(key);
    if (value === undefined) return null;
    return type === "json" ? JSON.parse(value) : value;
  }

  async put(key, value) {
    this.records.set(key, String(value));
  }

  async delete(key) {
    this.records.delete(key);
  }
}

function request(headers = {}) {
  return new Request("https://www.turnpo.com/api/profiles/alice/draft", {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      ...headers
    },
    body: JSON.stringify({ ok: true })
  });
}

assert.equal(validateJsonMutationRequest(request({ origin: "https://www.turnpo.com" })), null);
assert.deepEqual(validateJsonMutationRequest(request({ origin: "https://evil.example" })), {
  error: "Same-origin request required.",
  status: 403
});
assert.deepEqual(validateJsonMutationRequest(new Request("https://www.turnpo.com/api/auth/logout", {
  method: "POST",
  headers: { origin: "https://www.turnpo.com" },
  body: "{}"
})), {
  error: "Expected application/json request body.",
  status: 415
});
assert.deepEqual(validateJsonMutationRequest(new Request("https://www.turnpo.com/api/auth/logout", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: "{}"
})), {
  error: "Same-origin request required.",
  status: 403
});

const cleaned = cleanOwnerProfileForStorage({
  username: "alice",
  displayName: "Alice",
  oneLineIntro: "hello",
  currentChapter: "building",
  avatar: "https://tracker.example/avatar.png",
  links: [
    { label: "bad", url: "javascript:alert(1)" },
    { label: "good", url: "https://example.com/path" }
  ],
  values: ["one", "one", "two"],
  jobs: {
    markdown: "# Alice\n\nAI knowledge management and learning systems.",
    followUps: "This month: focus on Netherlands hybrid AI enablement roles around Eindhoven.",
    preferences: {
      targetLocations: ["Eindhoven", "Eindhoven", "Remote"],
      focusKeywords: ["AI", "knowledge"],
      riskKeywords: ["Dutch required"]
    },
    potentials: [
      {
        id: "arbeitnow-knowledge-ai-lead",
        kind: "job",
        title: "Knowledge AI Lead",
        company: "Example BV",
        location: "Eindhoven / Hybrid",
        lane: "Arbeitnow",
        source: "arbeitnow",
        summary: "Build AI knowledge workflows.",
        description: "Build AI knowledge workflows for teams.",
        query: "AI knowledge management",
        platform: "Arbeitnow",
        url: "https://example.com/jobs/knowledge-ai-lead",
        status: "opened",
        searchKeywords: ["AI knowledge management", "Netherlands"]
      }
    ],
    items: [
      {
        id: "job-1",
        title: "Knowledge AI Lead",
        company: "Example",
        location: "Eindhoven",
        sourceUrl: "javascript:alert(1)",
        description: "Build AI knowledge workflows.",
        notes: "Private note",
        status: "apply-ready",
        matchScore: 88,
        applicationMarkdown: "# Private application kit"
      }
    ]
  },
  lifeStories: [
    {
      id: "story-1",
      category: "life",
      title: "Story",
      status: "published",
      userApproved: true,
      image: "https://tracker.example/story.png",
      images: ["/assets/safe.jpg", "javascript:alert(1)"],
      link: "javascript:alert(1)",
      tags: ["tag"]
    }
  ],
  aiWorks: []
}, "alice", "alice@example.com");

assert.equal(cleaned.avatar, "/assets/turnpo-logo-512.png");
assert.deepEqual(cleaned.links, [{ label: "good", url: "https://example.com/path" }]);
assert.deepEqual(cleaned.values, ["one", "two"]);
assert.equal(cleaned.jobs.items.length, 1);
assert.equal(cleaned.jobs.items[0].sourceUrl, "");
assert.equal(cleaned.jobs.items[0].status, "apply-ready");
assert.equal(cleaned.jobs.items[0].applicationMarkdown, "# Private application kit");
assert.equal(cleaned.jobs.markdown, "# Alice\n\nAI knowledge management and learning systems.");
assert.equal(cleaned.jobs.followUps, "This month: focus on Netherlands hybrid AI enablement roles around Eindhoven.");
assert.equal(cleaned.jobs.potentials.length, 1);
assert.equal(cleaned.jobs.potentials[0].kind, "job");
assert.equal(cleaned.jobs.potentials[0].company, "Example BV");
assert.equal(cleaned.jobs.potentials[0].description, "Build AI knowledge workflows for teams.");
assert.equal(cleaned.jobs.potentials[0].status, "opened");
assert.equal(cleaned.jobs.potentials[0].url, "https://example.com/jobs/knowledge-ai-lead");
assert.deepEqual(cleaned.jobs.potentials[0].searchKeywords, ["AI knowledge management", "Netherlands"]);
assert.deepEqual(cleaned.jobs.preferences.targetLocations, ["Eindhoven", "Remote"]);
assert.equal(cleaned.lifeStories[0].image, "/assets/safe.jpg");
assert.deepEqual(cleaned.lifeStories[0].images, ["/assets/safe.jpg"]);
assert.equal(cleaned.lifeStories[0].link, "");
assert.equal(cleaned.ownerEmail, "alice@example.com");

const exposed = publicProfile({
  ...cleaned,
  avatar: "https://tracker.example/avatar.png",
  lifeStories: [
    {
      id: "story-1",
      category: "life",
      title: "Public",
      status: "published",
      userApproved: true,
      image: "https://tracker.example/story.png",
      images: ["/api/profiles/alice/media/abc123", "https://tracker.example/2.png"],
      link: "https://example.com"
    },
    {
      id: "story-2",
      category: "life",
      title: "Hidden",
      status: "hidden",
      userApproved: false
    }
  ]
});

assert.equal(exposed.avatar, "/assets/turnpo-logo-512.png");
assert.equal(exposed.lifeStories.length, 1);
assert.equal(exposed.lifeStories[0].image, "");
assert.deepEqual(exposed.lifeStories[0].images, ["/api/profiles/alice/media/abc123"]);
assert.equal(exposed.lifeStories[0].link, "https://example.com/");
assert.equal(exposed.jobs, undefined);

const originalFetch = globalThis.fetch;
const sentEmails = [];
globalThis.fetch = async (url, init = {}) => {
  sentEmails.push({ url: String(url), body: JSON.parse(init.body || "{}") });
  return new Response("{}", { status: 200 });
};

const acknowledgements = {
  publicProfile: true,
  thirdPartyRisk: true,
  contentResponsibility: true,
  sensitiveContent: true,
  aiReview: true,
  legalTerms: true
};
const env = {
  AUTH_KV: new MemoryKv(),
  PROFILE_KV: new MemoryKv(),
  TURNPO_AUTH_SECRET: "test-secret",
  RESEND_API_KEY: "test-resend",
  TURNPO_OWNER_EMAIL_PROFILES: "known@example.com:alice"
};
const existingRegisterResponse = await registerPost({
  env,
  request: new Request("https://www.turnpo.com/api/auth/register", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://www.turnpo.com",
      "cf-connecting-ip": "203.0.113.10"
    },
    body: JSON.stringify({
      name: "Alice",
      email: "known@example.com",
      acknowledgements
    })
  })
});
const existingRegisterBody = await existingRegisterResponse.json();

assert.equal(existingRegisterResponse.status, 200);
assert.equal(existingRegisterBody.verificationRequired, true);
assert.equal(existingRegisterBody.error, undefined);
assert.equal(await env.AUTH_KV.get("auth:registration:known@example.com"), null);
assert.ok(await env.AUTH_KV.get("auth:code:known@example.com"));
assert.equal(sentEmails.length, 1);

globalThis.fetch = originalFetch;

console.log("security helper checks passed");
