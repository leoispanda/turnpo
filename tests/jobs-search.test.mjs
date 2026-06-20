import assert from "node:assert/strict";

import { onRequestPost as searchJobs } from "../functions/api/jobs/search.js";

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
  throw new Error(`Unexpected URL ${href}`);
};

try {
  const response = await searchJobs({
    request: new Request("https://www.turnpo.com/api/jobs/search", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://www.turnpo.com"
      },
      body: JSON.stringify({
        markdown: "# Leo\n\nLocation: Eindhoven, Netherlands\n\nL&KM Solution Designer at ASML. AI knowledge management, learning systems, project management, stakeholder work, and Eindhoven hybrid work.",
        limit: 6
      })
    })
  });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.ok(fetchCalls.some((url) => url.includes("arbeitnow.com")));
  assert.ok(fetchCalls.some((url) => url.includes("remotive.com")));
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
} finally {
  globalThis.fetch = originalFetch;
}
