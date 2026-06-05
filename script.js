const ACTIVE_PROFILE_KEY = "turnpo:active-profile";
const LOCAL_PREFIX = "turnpo:profile:";
const SOURCE_PREFIX = "turnpo:source:";
const STATUSES = ["published", "draft", "deleted"];

const seedProfiles = {
  leo: {
    id: "profile-leo",
    username: "leo",
    displayName: "Leo Yang",
    oneLineIntro: "L&KM Solution Designer @ ASML | Co-creator of MapKAI | Exploring knowledge, systems, and reflection in the AI era",
    currentChapter: "Turning learning-system practice and MapKAI experiments into AI-readable knowledge maps, decision councils, and practical workflows people can actually use.",
    location: "Eindhoven, Netherlands",
    avatar: "/assets/leo-profile.png",
    links: [
      { label: "Turnpo", url: "https://www.turnpo.com/u/leo" },
      { label: "MapKAI", url: "https://www.mapkai.com" },
      { label: "MapKAI PDC", url: "https://www.mapkai.com/pdc" }
    ],
    values: ["clarity", "learning by doing", "human agency", "reflection", "knowledge into performance"],
    themes: ["AI agents", "knowledge mapping", "learning systems", "technical training", "project leadership", "personal growth"],
    lifeStories: [
      {
        id: "story-mapkai-2026",
        year: "2026",
        date: "May 2026",
        title: "Co-creating MapKAI",
        location: "Eindhoven",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
        publicSummary: "Started MapKAI with Li (Cindy) Xin as an early-stage exploration of knowledge mapping, AI-assisted reflection, and AI-native decision systems.",
        whyItMatters: "It became a personal experiment in what people with ideas, domain experience, and curiosity can build with AI assistance.",
        tags: ["MapKAI", "AI", "knowledge mapping"],
        status: "published",
        userApproved: true
      },
      {
        id: "story-mapkai-pdc-2026",
        year: "2026",
        date: "May 2026",
        title: "Opening the MapKAI PDC demo",
        location: "Eindhoven",
        image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80",
        publicSummary: "Shared a public demo of a structured AI council discussion where multiple AI partners challenge, support, and refine a question.",
        whyItMatters: "It helped turn AI agents from an abstract idea into something people could experience as thinking partners.",
        tags: ["AI agents", "PDC", "decision systems"],
        status: "published",
        userApproved: true
      },
      {
        id: "story-asml-stage-2025",
        year: "2025",
        date: "December 2025",
        title: "Presenting achievements on stage",
        location: "ASML Academy",
        image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=900&q=80",
        publicSummary: "Had the chance to stand on stage in the studio and present achievements and success with colleagues and leaders.",
        whyItMatters: "It marked a moment where nervousness turned into energy and confidence.",
        tags: ["presentation", "career achievement", "growth"],
        status: "published",
        userApproved: true
      },
      {
        id: "story-tedx-eindhoven-2025",
        year: "2025",
        date: "November 2025",
        title: "Learning from TEDx Eindhoven",
        location: "Eindhoven",
        image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80",
        publicSummary: "Reflected on how people from different ages and backgrounds understand happiness, expectation, and hidden bias.",
        whyItMatters: "It widened the personal side of learning beyond work performance and technical systems.",
        tags: ["reflection", "bias", "happiness"],
        status: "published",
        userApproved: true
      },
      {
        id: "story-project-management-2024",
        year: "2024",
        date: "November 2024",
        title: "Completing PM Foundation training",
        location: "ASML Academy",
        image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
        publicSummary: "Celebrated graduation from PM Foundation Training and began carrying project management skills into daily work.",
        whyItMatters: "It strengthened the bridge between learning design, execution, and cross-team impact.",
        tags: ["project management", "ASML", "learning"],
        status: "published",
        userApproved: true
      },
      {
        id: "story-quarter-marathon-2024",
        year: "2024",
        date: "October 2024",
        title: "Running the ASML Marathon Eindhoven quarter marathon",
        location: "Eindhoven",
        image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=80",
        publicSummary: "Completed a first quarter marathon by learning how to manage heart rate, pace, preparation, and persistence.",
        whyItMatters: "It became a practical lesson in process, discipline, and personal challenge.",
        tags: ["marathon", "discipline", "personal growth"],
        status: "published",
        userApproved: true
      },
      {
        id: "story-asml-solution-designer-2023",
        year: "2023",
        date: "July 2023",
        title: "Designing learning and knowledge solutions at ASML",
        location: "ASML Academy",
        image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
        publicSummary: "Moved into an L&KM Solution Designer role focused on scalable learning, knowledge sharing, and capability-building solutions.",
        whyItMatters: "The role connected technical training, knowledge management, project leadership, and product thinking.",
        tags: ["ASML", "knowledge management", "learning design"],
        status: "published",
        userApproved: true
      },
      {
        id: "story-asml-global-deployment-2023",
        year: "2023",
        date: "2023-2025",
        title: "Leading learning deployment across countries",
        location: "Eindhoven",
        image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80",
        publicSummary: "Led learning deployment across 6 countries and 13 locations, enabling 200+ trainees and local trainers.",
        whyItMatters: "It showed how learning systems become real only when they work across locations, cultures, and operational constraints.",
        tags: ["deployment", "global training", "performance"],
        status: "published",
        userApproved: true
      },
      {
        id: "story-technical-instructor-2018",
        year: "2018",
        date: "August 2018",
        title: "Started at ASML as Technical Instructor/Developer",
        location: "Shanghai",
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80",
        publicSummary: "Delivered 10 different technical courses across 110 sessions for more than 500 trainees, while leading projects and contributing to service communities.",
        whyItMatters: "It was the bridge from engineering work into technical learning systems.",
        tags: ["technical training", "China", "ASML"],
        status: "published",
        userApproved: true
      },
      {
        id: "story-aecc-2012",
        year: "2012",
        date: "August 2012",
        title: "Starting as an electrical engineer",
        location: "Harbin, China",
        image: "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&w=900&q=80",
        publicSummary: "Worked on international equipment move-in projects, installation, commissioning, maintenance, and internal technical training transfer.",
        whyItMatters: "It created the engineering foundation behind later work in technical training and knowledge transfer.",
        tags: ["engineering", "equipment", "training transfer"],
        status: "published",
        userApproved: true
      },
      {
        id: "story-yanshan-2008",
        year: "2008",
        date: "2008-2012",
        title: "Studying at Yanshan University",
        location: "Qinhuangdao, China",
        image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80",
        publicSummary: "Completed a bachelor's degree and graduated as an outstanding graduate.",
        whyItMatters: "It was the formal starting point for a path through engineering, technical learning, and knowledge systems.",
        tags: ["education", "engineering", "foundation"],
        status: "published",
        userApproved: true
      }
    ],
    aiWorks: [
      {
        id: "work-turnpo",
        title: "Turnpo",
        type: "Personal story profile platform",
        publicSummary: "A shareable personal story and AI work profile for the AI era.",
        whyMade: "To help people explain what shaped them beyond job titles.",
        toolsUsed: ["HTML/CSS/JS", "Cloudflare Pages", "AI-assisted product design"],
        humanRole: "Product direction, story curation, privacy rules, taste.",
        aiRole: "Drafting, structure, code assistance, scenario exploration.",
        result: "A searchable founder prototype with published-only AI profile generation.",
        link: "https://www.turnpo.com",
        tags: ["identity", "AI profile", "privacy"],
        status: "published",
        userApproved: true
      },
      {
        id: "work-mapkai",
        title: "MapKAI",
        type: "AI knowledge mapping concept",
        publicSummary: "An AI project exploring how people and small teams can move from scattered ideas toward clearer knowledge structures and more intentional decisions.",
        whyMade: "To test what becomes possible when curiosity, learning, product thinking, and AI-assisted exploration come together.",
        toolsUsed: ["AI prototyping", "knowledge mapping", "product thinking", "learning path design"],
        humanRole: "Co-creation, problem framing, product direction, learning perspective, and public storytelling.",
        aiRole: "Idea expansion, interface exploration, reflection generation, and structured discussion support.",
        result: "A live early-stage product direction around AI-assisted reflection, knowledge mapping, and decision systems.",
        link: "https://www.mapkai.com",
        tags: ["knowledge", "reflection", "AI agents"],
        status: "published",
        userApproved: true
      },
      {
        id: "work-mapkai-pdc",
        title: "MapKAI PDC",
        type: "AI partner discussion council demo",
        publicSummary: "A public demo where 9 AI partners explore a question through opening, challenging, narrowing, and summarizing a structured discussion.",
        whyMade: "To help people experience AI agents as thinking partners instead of single-answer tools.",
        toolsUsed: ["LLMs", "AI agents", "structured discussion design", "MapKAI"],
        humanRole: "Designed the interaction flow, chose the demo topic, framed the experience, and wrote the public explanation.",
        aiRole: "Simulates multiple perspectives that challenge, support, and refine the discussion.",
        result: "A clearer public demonstration of how AI agents can support reflection and decision-making.",
        link: "https://www.mapkai.com/pdc",
        tags: ["AI agents", "decision support", "reflection"],
        status: "published",
        userApproved: true
      }
    ]
  },
  cindy: {
    id: "profile-cindy",
    username: "cindy",
    displayName: "Cindy Chen",
    oneLineIntro: "Example invited profile for a designer shaping humane AI products.",
    currentChapter: "Designing thoughtful interfaces for AI-assisted creative work.",
    location: "Amsterdam",
    avatar: "/assets/turnpo-logo-full.png",
    links: [{ label: "Profile", url: "https://www.turnpo.com/u/cindy" }],
    values: ["craft", "care", "agency"],
    themes: ["design", "AI tools", "creative systems"],
    lifeStories: [
      {
        id: "story-cindy-2025",
        year: "2025",
        date: "2025",
        title: "Started designing AI-native creative workflows",
        location: "Amsterdam",
        image: "https://images.unsplash.com/photo-1497366672149-e5e4b4d34eb3?auto=format&fit=crop&w=900&q=80",
        publicSummary: "An example public story showing how Turnpo can support invited profiles.",
        whyItMatters: "It demonstrates that search and routing are profile-data driven.",
        tags: ["design", "AI", "workflow"],
        status: "published",
        userApproved: true
      }
    ],
    aiWorks: [
      {
        id: "work-cindy-studio",
        title: "AI Studio Notes",
        type: "Creative workflow archive",
        publicSummary: "A sample AI work entry for the private beta profile model.",
        whyMade: "To test AI work search and public profile structure.",
        toolsUsed: ["Figma", "AI writing tools"],
        humanRole: "Design judgment and curation.",
        aiRole: "Drafting and variation.",
        result: "A concise example work page section.",
        link: "",
        tags: ["design", "prototype"],
        status: "published",
        userApproved: true
      }
    ]
  },
  "demo-friend": {
    id: "profile-demo-friend",
    username: "demo-friend",
    displayName: "Demo Friend",
    oneLineIntro: "Invite-based creation placeholder for future Turnpo profiles.",
    currentChapter: "Waiting for a founder invite to create a real profile.",
    location: "Private beta",
    avatar: "/assets/turnpo-logo-full.png",
    links: [{ label: "Invite coming soon", url: "#invite" }],
    values: ["ownership", "consent", "curation"],
    themes: ["private beta", "future profile"],
    lifeStories: [],
    aiWorks: []
  }
};

let profiles = loadProfiles();
let activeUsername = "leo";
let ownerMode = false;
let editingRef = null;
let activeEditorType = "story";
let pendingOwnerEmail = "";
let authCodeRequested = false;

const $ = (selector) => document.querySelector(selector);
const body = document.body;

function clone(value) {
  return structuredClone(value);
}

function localKey(username) {
  return `${LOCAL_PREFIX}${username}`;
}

function sourceKey(username) {
  return `${SOURCE_PREFIX}${username}`;
}

function loadProfiles() {
  const next = clone(seedProfiles);
  Object.keys(next).forEach((username) => {
    next[username] = normalizeProfile(next[username]);
  });
  return next;
}

function loadOwnerProfile(username) {
  try {
    const saved = JSON.parse(localStorage.getItem(localKey(username)));
    profiles[username] = normalizeProfile(saved || seedProfiles[username]);
  } catch {
    profiles[username] = normalizeProfile(clone(seedProfiles[username]));
  }
}

function unloadOwnerProfile(username) {
  profiles[username] = normalizeProfile(clone(seedProfiles[username]));
}

function normalizeProfile(profile) {
  return {
    ...profile,
    lifeStories: (profile.lifeStories || []).map((item) => normalizeContent(item, "story")),
    aiWorks: (profile.aiWorks || []).map((item) => normalizeContent(item, "work")),
    values: profile.values || [],
    themes: profile.themes || [],
    links: profile.links || []
  };
}

function normalizeContent(item, type) {
  const now = new Date().toISOString();
  return {
    id: item.id || `${type}-${crypto.randomUUID()}`,
    status: STATUSES.includes(item.status) ? item.status : "draft",
    userApproved: Boolean(item.userApproved),
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || now,
    publishedAt: item.publishedAt || (item.status === "published" ? now : ""),
    unpublishedAt: item.unpublishedAt || "",
    deletedAt: item.deletedAt || "",
    ...item
  };
}

function saveActiveProfile() {
  localStorage.setItem(localKey(activeUsername), JSON.stringify(profiles[activeUsername]));
}

function currentProfile() {
  return profiles[activeUsername] || profiles.leo;
}

function isPublished(item) {
  return item.status === "published" && item.userApproved !== false;
}

function publicStories(profile = currentProfile()) {
  return profile.lifeStories.filter(isPublished).sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
}

function publicWorks(profile = currentProfile()) {
  return profile.aiWorks.filter(isPublished);
}

function ownerItems(collection) {
  return ownerMode ? collection.filter((item) => item.status !== "deleted") : collection.filter(isPublished);
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function parseList(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function setRoute(route) {
  if (route === "home") {
    body.classList.remove("profile-open");
    $("#entryView").hidden = false;
    document.querySelectorAll(".profile-content").forEach((node) => { node.hidden = true; });
    history.pushState(null, "", "/");
    renderHome();
    window.scrollTo({ top: 0, behavior: "auto" });
    return;
  }

  activeUsername = profiles[route] ? route : "leo";
  localStorage.setItem(ACTIVE_PROFILE_KEY, activeUsername);
  body.classList.add("profile-open");
  $("#entryView").hidden = true;
  document.querySelectorAll(".profile-content").forEach((node) => { node.hidden = false; });
  history.pushState(null, "", `/u/${activeUsername}`);
  renderProfile();
  window.scrollTo({ top: 0, behavior: "auto" });
}

function routeFromLocation() {
  const pathMatch = location.pathname.match(/^\/u\/([^/]+)/);
  if (pathMatch) return decodeURIComponent(pathMatch[1]);
  const hashMatch = location.hash.match(/^#\/u\/([^/]+)/);
  if (hashMatch) return decodeURIComponent(hashMatch[1]);
  if (location.hash === "#leo") return "leo";
  return "home";
}

function profileSearchText(profile) {
  return [
    profile.displayName,
    profile.username,
    profile.oneLineIntro,
    profile.currentChapter,
    profile.location,
    ...profile.values,
    ...profile.themes,
    ...publicStories(profile).flatMap((story) => [story.title, story.location, story.publicSummary, ...(story.tags || [])]),
    ...publicWorks(profile).flatMap((work) => [work.title, work.type, work.publicSummary, ...(work.tags || []), ...(work.toolsUsed || [])])
  ].join(" ").toLowerCase();
}

function searchProfiles(query = "") {
  const normalized = query.trim().toLowerCase();
  const all = Object.values(profiles);
  if (!normalized) return all;
  return all.filter((profile) => profileSearchText(profile).includes(normalized));
}

function renderHome(query = "") {
  const normalizedQuery = query.trim();
  const results = normalizedQuery ? searchProfiles(normalizedQuery) : [];
  $("#searchResults").innerHTML = !normalizedQuery ? "" : results.length ? results.map((profile) => `
    <button class="person-result" type="button" data-profile="${profile.username}">
      <img src="${escapeHtml(profile.avatar)}" alt="${escapeHtml(profile.displayName)}" />
      <span>
        <strong>${escapeHtml(profile.displayName)}</strong>
        <small>@${escapeHtml(profile.username)} · ${escapeHtml(profile.location)} · ${escapeHtml(profile.themes.slice(0, 3).join(", "))}</small>
      </span>
    </button>
  `).join("") : `<p class="empty-result">No published Turnpo profile matched that search</p>`;

  $("#exampleProfiles").innerHTML = [
    ["Real story", "Meet someone through the moments that changed their direction"],
    ["AI-readable context", "A structured profile designed for AI tools to read, copy, and understand"],
    ["Beyond the resume", "The story behind the title, career path, and work"]
  ].map(([title, summary]) => `
    <article class="mini-profile-card">
      <span class="mini-profile-icon" aria-hidden="true"></span>
      <h3>${title}</h3>
      <p>${summary}</p>
    </article>
  `).join("");
}

function renderProfile() {
  const profile = currentProfile();
  document.title = `${profile.displayName} - Turnpo`;
  $("#metaDescription").setAttribute("content", `${profile.displayName} on Turnpo: ${profile.oneLineIntro}`);
  $("#ogTitle").setAttribute("content", `${profile.displayName} - Turnpo`);
  $("#ogDescription").setAttribute("content", profile.oneLineIntro);
  $("#profileName").textContent = profile.displayName;
  $("#profileUsername").textContent = `@${profile.username}`;
  $("#profileIntro").textContent = profile.oneLineIntro;
  $("#profileChapter").textContent = profile.currentChapter;
  $("#profileLocation").textContent = profile.location;
  $("#profileAvatar").src = profile.avatar;
  $("#profileAvatar").alt = `${profile.displayName} portrait`;
  $("#profileLinks").innerHTML = profile.links.map((link) => `<a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a>`).join("");
  $("#aiMarkdown").value = generateAiProfile(profile);
  renderTimeline();
  renderAiWorks();
  renderOwnerWorkspace();
  renderJsonLd(profile);
}

function groupedStories(profile = currentProfile()) {
  return ownerItems(profile.lifeStories).reduce((groups, story) => {
    const year = story.year || "Undated";
    if (!groups[year]) groups[year] = [];
    groups[year].push(story);
    return groups;
  }, {});
}

function statusPill(item) {
  return ownerMode ? `<span class="visibility-pill">${escapeHtml(item.status)}</span>` : "";
}

function renderTimeline() {
  const groups = groupedStories();
  const years = Object.keys(groups).sort((a, b) => Number(b) - Number(a));
  $("#yearFilters").innerHTML = years.map((year) => `<button type="button" data-year="${year}">${year}</button>`).join("");
  $("#timelineList").innerHTML = years.length ? years.map((year) => `
    <article class="year-block" id="timeline-year-${escapeHtml(year)}" tabindex="-1">
      <div class="year-label">${escapeHtml(year)}</div>
      <div class="year-title">${escapeHtml(year)}<span>${groups[year].filter(isPublished).length} published highlight${groups[year].filter(isPublished).length === 1 ? "" : "s"}</span></div>
      <div class="event-stack">
        ${groups[year].map((story) => `
          <article class="event-card ${story.status !== "published" ? "private-card" : ""}" data-story-id="${escapeHtml(story.id)}">
            <div class="event-media">${story.image ? `<img class="event-main-image" src="${escapeHtml(story.image)}" alt="${escapeHtml(story.title)}" />` : `<div class="empty-media" aria-label="No image yet"></div>`}</div>
            <div>
              <div class="event-card-head">
                <div class="event-date">${escapeHtml([story.date, story.location].filter(Boolean).join(" - "))}</div>
                <div class="event-actions owner-only">${statusPill(story)}<button class="small-action" type="button" data-edit-type="story" data-edit-id="${story.id}">Edit</button></div>
              </div>
              <h3>${escapeHtml(story.title)}</h3>
              <p>${escapeHtml(story.publicSummary)}</p>
              <div class="tag-row">${(story.tags || []).slice(0, 3).map((tag) => `<span class="timeline-tag">${escapeHtml(tag)}</span>`).join("")}</div>
            </div>
          </article>
        `).join("")}
      </div>
    </article>
  `).join("") : `<p class="empty-result">No published stories yet</p>`;
}

function renderAiWorks() {
  const works = ownerItems(currentProfile().aiWorks);
  $("#aiWorksList").innerHTML = works.length ? works.map((work) => `
    <${work.link ? "a" : "article"} class="work-card ${work.status !== "published" ? "private-card" : ""}" ${work.link ? `href="${escapeHtml(work.link)}" target="_blank" rel="noopener"` : ""}>
      <div class="work-card-head">
        <div><h3>${escapeHtml(work.title)}</h3></div>
        <div class="event-actions owner-only">${statusPill(work)}<button class="small-action" type="button" data-edit-type="work" data-edit-id="${work.id}">Edit</button></div>
      </div>
      <p>${escapeHtml(work.publicSummary)}</p>
    </${work.link ? "a" : "article"}>
  `).join("") : `<p class="empty-result">No published AI works yet</p>`;
}

function generateAiProfile(profile) {
  const stories = publicStories(profile);
  const works = publicWorks(profile);
  return `# ${profile.displayName}

Username: @${profile.username}
Location: ${profile.location}

## One-line summary
${profile.oneLineIntro}

## Current chapter
${profile.currentChapter}

## Values and themes
${[...profile.values, ...profile.themes].map((item) => `- ${item}`).join("\n")}

## Public timeline highlights
${stories.length ? stories.map((story) => `- ${story.year}: ${story.title} (${story.location || "location not specified"}) - ${story.publicSummary}${story.whyItMatters ? ` Why it matters: ${story.whyItMatters}` : ""}`).join("\n") : "- No published stories yet"}

## Public AI works
${works.length ? works.map((work) => `- ${work.title} (${work.type}) - ${work.publicSummary} Human role: ${work.humanRole} AI role: ${work.aiRole} Result: ${work.result}`).join("\n") : "- No published AI works yet"}

## Public links
${profile.links.length ? profile.links.map((link) => `- [${link.label}](${link.url})`).join("\n") : "- No public links yet"}

## Suggested questions for AI-assisted review
- What shaped this person beyond their job title?
- What are they building in the AI era?
- Which values and themes appear across their public stories?

Only published and user-approved Turnpo content is included in this AI-readable profile.`;
}

function renderOwnerWorkspace() {
  const profile = currentProfile();
  $("#sourceWorkspace").value = ownerMode ? localStorage.getItem(sourceKey(activeUsername)) || "" : "";
  $("#previewSummary").innerHTML = `
    <h3>${escapeHtml(profile.displayName)}</h3>
    <p>${escapeHtml(profile.oneLineIntro)}</p>
    <p>${publicStories(profile).length} published stories · ${publicWorks(profile).length} published AI works</p>
  `;
}

function renderJsonLd(profile) {
  const graph = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.displayName,
    url: `https://www.turnpo.com/u/${profile.username}`,
    description: profile.oneLineIntro,
    knowsAbout: [...profile.values, ...profile.themes],
    sameAs: profile.links.map((link) => link.url),
    subjectOf: [
      ...publicStories(profile).map((story) => ({ "@type": "CreativeWork", name: story.title, dateCreated: String(story.year), description: story.publicSummary })),
      ...publicWorks(profile).map((work) => ({ "@type": "CreativeWork", name: work.title, description: work.publicSummary }))
    ]
  };
  $("#jsonLd").textContent = JSON.stringify(graph, null, 2);
}

function setOwnerMode(enabled) {
  ownerMode = enabled;
  if (enabled) {
    loadOwnerProfile(activeUsername);
  } else {
    unloadOwnerProfile(activeUsername);
  }
  body.classList.toggle("owner-mode", enabled);
  if (body.classList.contains("profile-open")) renderProfile();
  else renderHome($("#personSearch").value);
}

function openEditor(type, id = "") {
  if (!ownerMode) {
    setAuthDrawer(true);
    return;
  }
  activeEditorType = type;
  editingRef = id ? { type, id } : null;
  const item = id ? findContent(type, id) : null;
  $("#contentModeLabel").textContent = item ? `Edit ${type}` : `New ${type}`;
  $("#contentFormTitle").textContent = item ? "Update content" : type === "story" ? "Add life story" : "Add AI work";
  $("#contentType").value = type;
  $("#contentTitle").value = item?.title || "";
  $("#contentYear").value = item?.year || "";
  $("#contentDate").value = item?.date || "";
  $("#contentLocation").value = item?.location || "";
  $("#contentImage").value = item?.image || "";
  $("#contentStatus").value = item?.status || "draft";
  $("#contentSummary").value = item?.publicSummary || "";
  $("#contentWhy").value = item?.whyItMatters || item?.whyMade || "";
  $("#contentTags").value = (item?.tags || []).join(", ");
  $("#workType").value = item?.type || "";
  $("#workTools").value = (item?.toolsUsed || []).join(", ");
  $("#humanRole").value = item?.humanRole || "";
  $("#aiRole").value = item?.aiRole || "";
  $("#workResult").value = item?.result || "";
  $("#workLink").value = item?.link || "";
  $("#consentUpload").checked = false;
  $("#consentPublish").checked = false;
  $("#consentAiProfile").checked = false;
  $("#deleteContent").hidden = !item;
  $("#contentStatusNote").textContent = "Draft content is owner-only in this local prototype. Published content appears in the public page and AI profile.";
  $("#contentDrawer").classList.add("open");
  $("#contentDrawer").setAttribute("aria-hidden", "false");
  toggleWorkFields(type);
}

function closeEditor() {
  $("#contentDrawer").classList.remove("open");
  $("#contentDrawer").setAttribute("aria-hidden", "true");
  editingRef = null;
}

function toggleWorkFields(type) {
  document.querySelectorAll(".work-only").forEach((node) => { node.hidden = type !== "work"; });
  document.querySelectorAll(".story-only").forEach((node) => { node.hidden = type !== "story"; });
}

function findContent(type, id) {
  const collection = type === "work" ? currentProfile().aiWorks : currentProfile().lifeStories;
  return collection.find((item) => item.id === id);
}

function upsertContent(event) {
  event.preventDefault();
  const type = $("#contentType").value;
  const status = $("#contentStatus").value;
  const wantsPublish = status === "published";
  if (!$("#consentUpload").checked) {
    $("#contentStatusNote").textContent = "Please confirm upload rights before saving.";
    return;
  }
  if (wantsPublish && (!$("#consentPublish").checked || !$("#consentAiProfile").checked)) {
    $("#contentStatusNote").textContent = "Publishing requires public and AI profile consent.";
    return;
  }
  const now = new Date().toISOString();
  const base = normalizeContent({
    id: editingRef?.id || `${type}-${crypto.randomUUID()}`,
    title: $("#contentTitle").value.trim(),
    year: $("#contentYear").value.trim(),
    date: $("#contentDate").value.trim(),
    location: $("#contentLocation").value.trim(),
    image: $("#contentImage").value.trim(),
    publicSummary: $("#contentSummary").value.trim(),
    tags: parseList($("#contentTags").value),
    status,
    userApproved: wantsPublish,
    updatedAt: now,
    publishedAt: wantsPublish ? now : "",
    unpublishedAt: status === "draft" ? now : "",
    deletedAt: status === "deleted" ? now : ""
  }, type);
  if (!base.title || !base.publicSummary) {
    $("#contentStatusNote").textContent = "Title and public summary are required.";
    return;
  }
  const collection = type === "work" ? currentProfile().aiWorks : currentProfile().lifeStories;
  const existingIndex = collection.findIndex((item) => item.id === base.id);
  const nextItem = type === "work" ? {
    ...base,
    type: $("#workType").value.trim(),
    whyMade: $("#contentWhy").value.trim(),
    toolsUsed: parseList($("#workTools").value),
    humanRole: $("#humanRole").value.trim(),
    aiRole: $("#aiRole").value.trim(),
    result: $("#workResult").value.trim(),
    link: $("#workLink").value.trim()
  } : {
    ...base,
    whyItMatters: $("#contentWhy").value.trim()
  };
  if (existingIndex >= 0) collection[existingIndex] = nextItem;
  else collection.unshift(nextItem);
  saveActiveProfile();
  renderProfile();
  closeEditor();
}

function deleteCurrentContent() {
  if (!editingRef) return;
  const item = findContent(editingRef.type, editingRef.id);
  if (item) {
    item.status = "deleted";
    item.userApproved = false;
    item.deletedAt = new Date().toISOString();
    item.updatedAt = item.deletedAt;
  }
  saveActiveProfile();
  renderProfile();
  closeEditor();
}

function setAuthDrawer(open) {
  $("#authDrawer").classList.toggle("open", open);
  $("#authDrawer").setAttribute("aria-hidden", String(!open));
  if (open && !authCodeRequested) $("#ownerEmail").focus();
}

async function authRequest(path, payload) {
  const response = await fetch(path, {
    method: payload ? "POST" : "GET",
    headers: payload ? { "content-type": "application/json" } : {},
    credentials: "same-origin",
    body: payload ? JSON.stringify(payload) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Turnpo auth is not available yet.");
  return data;
}

function resetAuthForm(message = "Only approved owner emails can enter founder mode. If your email is approved, Turnpo will send a one-time code.") {
  authCodeRequested = false;
  pendingOwnerEmail = "";
  $("#ownerCodeRow").hidden = true;
  $("#ownerCode").value = "";
  $("#authSubmit").textContent = "Send login code";
  $("#authNote").textContent = message;
}

async function requestLoginCode() {
  const email = $("#ownerEmail").value.trim().toLowerCase();
  if (!email) {
    $("#authNote").textContent = "Enter your approved owner email first.";
    return;
  }
  $("#authSubmit").disabled = true;
  $("#authNote").textContent = "Sending a one-time login code...";
  try {
    await authRequest("/api/auth/request-code", { email });
    pendingOwnerEmail = email;
    authCodeRequested = true;
    $("#ownerCodeRow").hidden = false;
    $("#authSubmit").textContent = "Verify code";
    $("#authNote").textContent = "If this email is approved, a 6-digit code has been sent. Codes expire after 10 minutes.";
    $("#ownerCode").focus();
  } catch (error) {
    $("#authNote").textContent = error.message;
  } finally {
    $("#authSubmit").disabled = false;
  }
}

async function verifyLoginCode() {
  const code = $("#ownerCode").value.trim();
  if (!pendingOwnerEmail || !code) {
    $("#authNote").textContent = "Enter the 6-digit code from your email.";
    return;
  }
  $("#authSubmit").disabled = true;
  $("#authNote").textContent = "Verifying code...";
  try {
    const session = await authRequest("/api/auth/verify-code", { email: pendingOwnerEmail, code });
    if (session.profile && profiles[session.profile]) activeUsername = session.profile;
    setOwnerMode(true);
    setAuthDrawer(false);
    setRoute(activeUsername);
    resetAuthForm("Owner mode is active.");
  } catch (error) {
    $("#authNote").textContent = error.message;
  } finally {
    $("#authSubmit").disabled = false;
  }
}

async function checkOwnerSession() {
  try {
    const session = await authRequest("/api/auth/session");
    if (session.authenticated && session.profile && profiles[session.profile]) {
      activeUsername = session.profile;
      setOwnerMode(true);
    }
  } catch {
    setOwnerMode(false);
  }
}

async function logoutOwner() {
  try {
    await authRequest("/api/auth/logout", {});
  } catch {
    // Local static previews may not have the auth function available yet.
  }
  setOwnerMode(false);
  resetAuthForm("You have exited owner mode.");
}

async function copyAiProfile() {
  const button = $("#copyMd");
  const original = button.innerHTML;
  const markdown = $("#aiMarkdown");
  let copied = false;
  try {
    await navigator.clipboard.writeText(markdown.value);
    copied = true;
  } catch {
    markdown.focus();
    markdown.select();
    copied = document.execCommand("copy");
    markdown.setSelectionRange(0, 0);
  }
  if (copied) {
    button.classList.add("is-copied");
    button.innerHTML = "Copied";
    $("#copyStatus").textContent = "Copied published-only AI Profile Markdown";
  } else {
    button.innerHTML = "Copy failed";
    $("#copyStatus").textContent = "Copy failed. Select the text and copy manually.";
  }
  setTimeout(() => {
    button.classList.remove("is-copied");
    button.innerHTML = original;
    $("#copyStatus").textContent = "Ready to copy into any AI chat";
  }, 2400);
}

function exportProfile() {
  const blob = new Blob([JSON.stringify({ profile: currentProfile(), exportedAt: new Date().toISOString(), note: "Local prototype export. Do not treat this as backend storage." }, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `turnpo-${activeUsername}-local-profile.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function resetActiveProfile() {
  localStorage.removeItem(localKey(activeUsername));
  profiles[activeUsername] = normalizeProfile(clone(seedProfiles[activeUsername]));
  renderProfile();
}

$("#searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  renderHome($("#personSearch").value);
});

$("#searchResults").addEventListener("click", (event) => {
  const button = event.target.closest("[data-profile]");
  if (button) setRoute(button.dataset.profile);
});

$("#exampleProfiles").addEventListener("click", (event) => {
  const button = event.target.closest("[data-profile]");
  if (button) setRoute(button.dataset.profile);
});

$("#yearFilters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-year]");
  if (!button) return;
  const target = document.getElementById(`timeline-year-${button.dataset.year}`);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  target.focus({ preventScroll: true });
});

document.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit-id]");
  if (editButton) openEditor(editButton.dataset.editType, editButton.dataset.editId);
});

$("#timelineList").addEventListener("click", (event) => {
  if (!ownerMode || event.target.closest("button, a, input, textarea, select")) return;
  const storyCard = event.target.closest("[data-story-id]");
  openEditor("story", storyCard ? storyCard.dataset.storyId : "");
});

document.querySelectorAll(".toggle-btn").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".toggle-btn").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    $("#timelineList").classList.toggle("horizontal", button.dataset.view === "horizontal");
    $("#timelineList").classList.toggle("vertical", button.dataset.view !== "horizontal");
  });
});

$(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  setRoute("home");
});

$("#openStory").addEventListener("click", () => openEditor("story"));
$("#openWork").addEventListener("click", () => openEditor("work"));
$("#closeContent").addEventListener("click", closeEditor);
$("#closeBackdrop").addEventListener("click", closeEditor);
$("#contentType").addEventListener("change", (event) => toggleWorkFields(event.target.value));
$("#contentForm").addEventListener("submit", upsertContent);
$("#deleteContent").addEventListener("click", deleteCurrentContent);
$("#homeOwnerLogin").addEventListener("click", () => setAuthDrawer(true));
$("#ownerLogout").addEventListener("click", logoutOwner);
$("#backToSearch").addEventListener("click", () => setRoute("home"));
$("#closeAuth").addEventListener("click", () => setAuthDrawer(false));
$("#authBackdrop").addEventListener("click", () => setAuthDrawer(false));
$("#exportProfile").addEventListener("click", exportProfile);
$("#restoreSeed").addEventListener("click", resetActiveProfile);
$("#copyMd").addEventListener("click", copyAiProfile);
$("#saveSource").addEventListener("click", () => {
  localStorage.setItem(sourceKey(activeUsername), $("#sourceWorkspace").value);
  $("#sourceStatus").textContent = "Saved as owner-only local source material. It is not included in the public AI profile.";
});

$("#authForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (authCodeRequested) await verifyLoginCode();
  else await requestLoginCode();
});

window.addEventListener("popstate", () => setRoute(routeFromLocation()));

renderHome();
setRoute(routeFromLocation());
checkOwnerSession();
