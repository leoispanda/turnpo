import assert from "node:assert/strict";

import { onRequestPost as searchJobs } from "../functions/api/jobs/search.js";
import { sessionKey, userKey } from "../functions/api/auth/_utils.js";

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
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" }
  });
}

const originalFetch = globalThis.fetch;
const fetchCalls = [];

globalThis.fetch = async (url) => {
  const href = String(url);
  fetchCalls.push(href);
  if (href.includes("api.openai.com/v1/responses")) {
    return jsonResponse({
      output_text: JSON.stringify({
        locationLabel: "Netherlands",
        targetLocations: ["Eindhoven", "Veldhoven", "Hybrid Netherlands"],
        seniority: "mid-senior",
        roleFamilies: ["AI knowledge management", "learning and enablement"],
        industries: ["learning / knowledge systems", "AI product tools"],
        companyScale: ["enterprise / product teams"],
        roleTerms: ["ai", "knowledge management", "learning enablement", "technical training"],
        industryTerms: ["knowledge", "learning", "ai"],
        companyScaleTerms: ["enterprise", "product"],
        queries: ["AI learning enablement", "Knowledge management specialist"],
        avoidTerms: ["native dutch"]
      })
    });
  }
  if (href.includes("arbeitnow.com")) {
    return jsonResponse({
      data: [
        {
          slug: "knowledge-ai-lead",
          company_name: "Example BV",
          title: "Knowledge AI Lead",
          location: "Eindhoven / Hybrid",
          remote: false,
          url: "https://example.com/jobs/knowledge-ai-lead",
          tags: ["AI", "Knowledge management"],
          job_types: ["Full-time"],
          description: "<p>Build AI knowledge management workflows for learning teams in Eindhoven.</p>"
        },
        {
          slug: "warehouse-operator",
          company_name: "Other",
          title: "Warehouse Operator",
          location: "Berlin",
          remote: false,
          url: "https://example.com/jobs/warehouse",
          tags: ["Logistics"],
          description: "<p>Pack boxes.</p>"
        },
        {
          slug: "latam-ai-manager",
          company_name: "Wrong Region",
          title: "AI Enablement Manager",
          location: "Brazil / Remote",
          remote: true,
          url: "https://example.com/jobs/brazil-ai",
          tags: ["AI", "Enablement"],
          description: "<p>Run AI enablement programs for LATAM teams.</p>"
        }
      ]
    });
  }
  if (href.includes("remotive.com")) {
    return jsonResponse({
      jobs: [
        {
          id: 42,
          company_name: "Remote Tools",
          title: "AI Enablement Program Manager",
          candidate_required_location: "Europe / Remote",
          url: "https://remote.example/jobs/ai-enablement",
          category: "Product",
          tags: ["AI", "Learning and Development"],
          job_type: "full_time",
          description: "<p>Run AI enablement and learning programs for distributed teams.</p>"
        },
        {
          id: 43,
          company_name: "Global Remote",
          title: "Knowledge Management Lead",
          candidate_required_location: "Brazil",
          url: "https://remote.example/jobs/brazil-knowledge",
          category: "Product",
          tags: ["AI", "Knowledge Management"],
          job_type: "full_time",
          description: "<p>Lead knowledge management for Brazil-based teams.</p>"
        },
        {
          id: 44,
          company_name: "Too Broad",
          title: "Senior Independent AI Engineer / Architect",
          candidate_required_location: "Americas, Europe, Israel",
          url: "https://remote.example/jobs/too-broad-ai-engineer",
          category: "Software Development",
          tags: ["AI", "Architecture"],
          job_type: "contract",
          description: "<p>Build AI engineering systems for clients across global remote regions.</p>"
        }
      ]
    });
  }
  if (href.includes("jobicy.com")) {
    return jsonResponse({
      jobCount: 2,
      jobs: [
        {
          id: 501,
          jobTitle: "Training Delivery Manager",
          companyName: "Skill Platform",
          jobGeo: "Europe",
          url: "https://jobicy.example/jobs/training-delivery-manager",
          jobIndustry: "Education",
          jobType: "Full-time",
          jobLevel: "Senior",
          jobExcerpt: "Manage learning delivery and enablement programs for European teams.",
          jobDescription: "<p>Manage learning delivery, stakeholder enablement, and training operations for European teams.</p>"
        },
        {
          id: 502,
          jobTitle: "AI Product Developer",
          companyName: "Wrong Fit",
          jobGeo: "Worldwide",
          url: "https://jobicy.example/jobs/worldwide-developer",
          jobIndustry: "Software",
          jobType: "Contract",
          jobLevel: "Senior",
          jobExcerpt: "Build developer tooling anywhere in the world.",
          jobDescription: "<p>Senior software developer role, worldwide remote.</p>"
        }
      ]
    });
  }
  throw new Error(`Unexpected URL ${href}`);
};

const authEnv = {
  AUTH_KV: new MemoryKv(),
  TURNPO_AUTH_SECRET: "test-secret"
};
await authEnv.AUTH_KV.put(sessionKey("test-session"), JSON.stringify({
  userId: "test-user",
  email: "test@example.com",
  profile: "leo"
}));
await authEnv.AUTH_KV.put(userKey("test-user"), JSON.stringify({
  id: "test-user",
  email: "test@example.com",
  profile: "leo",
  status: "active"
}));

try {
  const unauthenticated = await searchJobs({
    request: new Request("https://www.turnpo.com/api/jobs/search", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://www.turnpo.com"
      },
      body: JSON.stringify({
        markdown: "# Leo\n\nLocation: Eindhoven, Netherlands\n\nAI knowledge management and learning systems.",
        limit: 6
      })
    }),
    env: authEnv
  });
  assert.equal(unauthenticated.status, 401);
  assert.equal(fetchCalls.length, 0);

  const response = await searchJobs({
    request: new Request("https://www.turnpo.com/api/jobs/search", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://www.turnpo.com",
        cookie: "turnpo_owner_session=test-session"
      },
      body: JSON.stringify({
        markdown: "# Leo\n\nLocation: Eindhoven, Netherlands\n\nL&KM Solution Designer at ASML. AI knowledge management, learning systems, project management, stakeholder work, and Eindhoven hybrid work.",
        limit: 6
      })
    }),
    env: authEnv
  });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.ok(fetchCalls.some((url) => url.includes("arbeitnow.com")));
  assert.ok(fetchCalls.some((url) => url.includes("remotive.com")));
  assert.ok(fetchCalls.some((url) => url.includes("jobicy.com")));
  assert.equal(fetchCalls.some((url) => url.includes("api.openai.com")), false);
  assert.equal(data.searchProfile.locationLabel, "Netherlands");
  assert.equal(data.searchProfile.seniority, "mid-senior");
  assert.ok(data.searchProfile.targetLocations.includes("Eindhoven"));
  assert.ok(data.queries.includes("AI knowledge management Netherlands"));
  assert.ok(data.jobs.length >= 2);
  assert.equal(data.jobs[0].kind, "job");
  assert.ok(data.jobs[0].score >= data.jobs[data.jobs.length - 1].score);
  assert.equal(data.jobs.some((job) => /brazil|latam|berlin|americas|israel|global remote/i.test(`${job.location} ${job.summary}`)), false);
  const knowledgeRole = data.jobs.find((job) => job.url === "https://example.com/jobs/knowledge-ai-lead");
  assert.equal(knowledgeRole.company, "Example BV");
  assert.equal(knowledgeRole.location, "Eindhoven / Hybrid");
  assert.equal(knowledgeRole.description.includes("<p>"), false);
  assert.deepEqual(knowledgeRole.searchKeywords.slice(0, 2), ["AI", "Knowledge management"]);
  assert.ok(data.jobs.some((job) => job.url === "https://jobicy.example/jobs/training-delivery-manager"));

  const blocked = await searchJobs({
    request: new Request("https://www.turnpo.com/api/jobs/search", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://evil.example"
      },
      body: JSON.stringify({ markdown: "# Leo\n\nAI knowledge management." })
    })
  });
  assert.equal(blocked.status, 403);

  fetchCalls.length = 0;
  const aiResponse = await searchJobs({
    request: new Request("https://www.turnpo.com/api/jobs/search", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://www.turnpo.com",
        cookie: "turnpo_owner_session=test-session"
      },
      body: JSON.stringify({
        markdown: "# Leo\n\nLocation: Eindhoven, Netherlands\n\nRecent follow-ups absorbed into personal Markdown\n- Eindhoven nearby roles\n- AI learning enablement and knowledge management roles",
        limit: 6
      })
    }),
    env: {
      ...authEnv,
      OPENAI_API_KEY: "test-key",
      OPENAI_JOBS_MODEL: "gpt-4o-mini"
    }
  });
  assert.equal(aiResponse.status, 200);
  const aiData = await aiResponse.json();
  assert.ok(fetchCalls.some((url) => url.includes("api.openai.com/v1/responses")));
  assert.ok(fetchCalls.some((url) => url.includes("remotive.com/api/remote-jobs?search=AI%20learning%20enablement%20Netherlands")));
  assert.equal(aiData.ai.used, true);
  assert.equal(aiData.ai.model, "gpt-4o-mini");
  assert.equal(aiData.sources[0], "OpenAI gpt-4o-mini");
  assert.ok(aiData.queries.includes("AI learning enablement Netherlands"));
  assert.equal(aiData.searchProfile.roleFamilies.includes("learning and enablement"), true);
} finally {
  globalThis.fetch = originalFetch;
}
