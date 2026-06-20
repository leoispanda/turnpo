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
          candidate_required_location: "Remote",
          url: "https://remote.example/jobs/ai-enablement",
          category: "Product",
          tags: ["AI", "Learning and Development"],
          job_type: "full_time",
          description: "<p>Run AI enablement and learning programs for distributed teams.</p>"
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
        markdown: "# Leo\n\nAI knowledge management, learning systems, and Eindhoven hybrid work.",
        limit: 6
      })
    })
  });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.ok(fetchCalls.some((url) => url.includes("arbeitnow.com")));
  assert.ok(fetchCalls.some((url) => url.includes("remotive.com")));
  assert.ok(data.queries.includes("AI knowledge management"));
  assert.ok(data.jobs.length >= 2);
  assert.equal(data.jobs[0].kind, "job");
  assert.ok(data.jobs[0].score >= data.jobs[data.jobs.length - 1].score);
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
