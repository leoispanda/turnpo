const OWNER_ACCOUNT = "leo";
const OWNER_PASSWORD = "turnpo-owner";
const STORAGE_KEY = "turnpo:leo:events";
const OWNER_KEY = "turnpo:owner-mode";

const seedEvents = [
  {
    year: "2026",
    items: [
      {
        id: "mapkai-2026",
        title: "Co-creating MapKAI",
        date: "May 2026 - Eindhoven",
        images: ["https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80"],
        note: "An early-stage exploration of knowledge mapping, AI-assisted reflection, and AI-native decision systems.",
        tags: ["MapKAI", "AI", "knowledge"],
        visibility: "public"
      },
      {
        id: "asml-learning-2026",
        title: "Designing learning and knowledge solutions at ASML",
        date: "2026 - ASML Academy",
        images: ["https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80"],
        note: "Working between people, systems, and performance to make expert knowledge easier to access and apply.",
        tags: ["ASML", "learning", "performance"],
        visibility: "public"
      }
    ]
  },
  {
    year: "2023",
    items: [
      {
        id: "solution-designer-2023",
        title: "Became L&KM Solution Designer",
        date: "July 2023 - Eindhoven",
        images: ["https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80"],
        note: "Moved into a role focused on scalable learning, knowledge sharing, and capability-building solutions.",
        tags: ["ASML", "role shift", "knowledge management"],
        visibility: "public"
      }
    ]
  },
  {
    year: "2018",
    items: [
      {
        id: "technical-instructor-2018",
        title: "Started at ASML as Technical Instructor/Developer",
        date: "August 2018 - Shanghai",
        images: ["https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80"],
        note: "Delivered technical training, led projects, and began turning engineering knowledge into reusable learning.",
        tags: ["technical training", "ASML", "China"],
        visibility: "public"
      }
    ]
  },
  {
    year: "2012",
    items: [
      {
        id: "aircraft-engineering-2012",
        title: "Began engineering work in aircraft engines",
        date: "August 2012 - Harbin",
        images: ["https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80"],
        note: "Worked on equipment installation, commissioning, maintenance, and internal technical training programs.",
        tags: ["engineering", "aircraft engines", "origin"],
        visibility: "public"
      }
    ]
  }
];

let events = loadEvents();
let ownerMode = localStorage.getItem(OWNER_KEY) === "true";
let editingRef = null;

const body = document.body;
const entryView = document.querySelector("#entryView");
const profileContent = document.querySelectorAll(".profile-content");
const timelineList = document.querySelector("#timelineList");
const drawer = document.querySelector("#drawer");
const authDrawer = document.querySelector("#authDrawer");
const copyStatus = document.querySelector("#copyStatus");
const markdown = document.querySelector("#aiMarkdown");
const searchResults = document.querySelector("#searchResults");
const eventForm = document.querySelector("#eventForm");
const eventStatus = document.querySelector("#eventStatus");
const deleteEventButton = document.querySelector("#deleteEvent");

function loadEvents() {
  try {
    return normalizeEvents(JSON.parse(localStorage.getItem(STORAGE_KEY)) || structuredClone(seedEvents));
  } catch {
    return normalizeEvents(structuredClone(seedEvents));
  }
}

function normalizeEvents(groups) {
  return groups.map((group) => {
    const items = (group.items || []).map((item) => ({
      id: item.id || crypto.randomUUID(),
      title: item.title || "Untitled moment",
      date: item.date || "",
      images: item.images?.length ? item.images : [item.image].filter(Boolean),
      note: item.note || "",
      tags: Array.isArray(item.tags) ? item.tags : [],
      visibility: item.visibility || "public"
    }));
    return { year: String(group.year), items, count: countLabel(items.length) };
  }).sort((a, b) => Number(b.year) - Number(a.year));
}

function countLabel(count) {
  return `${count} selected moment${count === 1 ? "" : "s"}`;
}

function saveEvents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function downloadEvents() {
  const payload = {
    profile: "leo",
    exportedAt: new Date().toISOString(),
    storage: "localStorage prototype",
    events
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "turnpo-leo-events-local.json";
  link.click();
  URL.revokeObjectURL(url);
}

function visibleItems(group) {
  return ownerMode ? group.items : group.items.filter((item) => item.visibility !== "private");
}

function syncCount(group) {
  group.count = countLabel(visibleItems(group).length);
}

function setRoute(route) {
  const isProfile = route === "leo";
  entryView.hidden = isProfile;
  profileContent.forEach((section) => {
    section.hidden = !isProfile;
  });
  body.classList.toggle("profile-open", isProfile);
  if (isProfile) {
    location.hash = "leo";
    renderTimeline();
  } else {
    history.replaceState(null, "", location.pathname);
  }
}

function setOwnerMode(enabled) {
  ownerMode = enabled;
  localStorage.setItem(OWNER_KEY, String(enabled));
  body.classList.toggle("owner-mode", enabled);
  document.querySelector("#openAdd").dataset.locked = String(!enabled);
  document.querySelector("#exportEvents").hidden = !enabled;
  renderTimeline();
}

function setDrawer(open, mode = "add") {
  if (!ownerMode && open) {
    setAuthDrawer(true);
    return;
  }
  drawer.classList.toggle("open", open);
  drawer.setAttribute("aria-hidden", String(!open));
  if (!open) {
    editingRef = null;
    resetEventForm();
  } else {
    document.querySelector("#eventModeLabel").textContent = mode === "edit" ? "Edit moment" : "New moment";
    document.querySelector("#eventFormTitle").textContent = mode === "edit" ? "Update this moment" : "Add to the road";
    deleteEventButton.hidden = mode !== "edit";
    eventStatus.textContent = mode === "edit"
      ? "Editing an existing local draft. Backend persistence is planned next."
      : "Draft changes stay local until the backend is connected.";
  }
}

function setAuthDrawer(open) {
  authDrawer.classList.toggle("open", open);
  authDrawer.setAttribute("aria-hidden", String(!open));
}

function mediaMarkup(item) {
  const images = item.images?.length ? item.images : [];
  if (!images.length) {
    return `<div class="event-media empty-media"></div>`;
  }

  return `
    <div class="event-media ${images.length > 1 ? "multi-media" : ""}">
      <img class="event-main-image" src="${images[0]}" alt="${item.title}" />
      ${images.length > 1 ? `
        <div class="media-strip">
          ${images.slice(1, 5).map((image, index) => `<img src="${image}" alt="${item.title} photo ${index + 2}" />`).join("")}
          ${images.length > 5 ? `<span>+${images.length - 5}</span>` : ""}
        </div>
      ` : ""}
    </div>
  `;
}

function renderTimeline() {
  timelineList.innerHTML = events.map((group) => {
    const items = visibleItems(group);
    return `
      <article class="year-block">
        <div class="year-label">${group.year}</div>
        <div class="year-title">${group.year}<span>${countLabel(items.length)}</span></div>
        <div class="event-stack">
          ${items.map((item) => `
            <article class="event-card ${item.visibility === "private" ? "private-card" : ""}">
              ${mediaMarkup(item)}
              <div>
                <div class="event-card-head">
                  <div class="event-date">${item.date}</div>
                  <div class="event-actions owner-only">
                    <span class="visibility-pill">${item.visibility}</span>
                    <button class="small-action" type="button" data-edit-id="${item.id}">Edit</button>
                  </div>
                </div>
                <h3>${item.title}</h3>
                <p>${item.note}</p>
                <div class="tag-row">
                  ${item.tags.map((tag) => `<span class="timeline-tag">${tag}</span>`).join("")}
                </div>
              </div>
            </article>
          `).join("")}
        </div>
      </article>
    `;
  }).join("");
}

function renderSearch(query = "") {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    searchResults.innerHTML = `
      <button class="person-result" type="button" data-person="leo">
        <img src="assets/leo-profile.png" alt="Leo Yang" />
        <span><strong>Leo Yang</strong><small>L&KM Solution Designer @ ASML · Co-creator of MapKAI</small></span>
      </button>
    `;
    return;
  }

  if ("leo yang".includes(normalized) || "leo".includes(normalized) || "yang".includes(normalized)) {
    renderSearch("");
    return;
  }

  searchResults.innerHTML = `<p class="empty-result">No public Turnpo profile found yet.</p>`;
}

function readUploadedFiles(files) {
  return Promise.all(Array.from(files || []).map((file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  })));
}

function parseTags(value) {
  return value.split(",").map((tag) => tag.trim()).filter(Boolean);
}

function imageFields() {
  return [
    document.querySelector("#eventImage").value.trim(),
    ...document.querySelector("#eventImageList").value.split("\n").map((line) => line.trim())
  ].filter(Boolean);
}

function resetEventForm() {
  eventForm.reset();
  document.querySelector("#eventTitle").value = "A quiet turning point";
  document.querySelector("#eventYear").value = "2026";
  document.querySelector("#eventDate").value = "June 2026";
  document.querySelector("#eventImage").value = "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=80";
  document.querySelector("#eventTags").value = "turning point, selected";
  document.querySelector("#eventNote").value = "The kind of moment that does not ask for an audience, but changes the direction of the work.";
  document.querySelector("#eventVisibility").value = "public";
  document.querySelector("#eventImageList").value = "";
  deleteEventButton.hidden = true;
  eventStatus.textContent = "Draft changes stay local until the backend is connected.";
}

function findEventById(id) {
  for (const group of events) {
    const index = group.items.findIndex((item) => item.id === id);
    if (index >= 0) {
      return { group, index, item: group.items[index] };
    }
  }
  return null;
}

function openEditEvent(id) {
  const found = findEventById(id);
  if (!found) {
    return;
  }

  editingRef = { id, originalYear: found.group.year };
  document.querySelector("#eventTitle").value = found.item.title;
  document.querySelector("#eventYear").value = found.group.year;
  document.querySelector("#eventDate").value = found.item.date;
  document.querySelector("#eventImage").value = found.item.images[0] || "";
  document.querySelector("#eventImageList").value = found.item.images.slice(1).join("\n");
  document.querySelector("#eventNote").value = found.item.note;
  document.querySelector("#eventTags").value = found.item.tags.join(", ");
  document.querySelector("#eventVisibility").value = found.item.visibility;
  setDrawer(true, "edit");
}

function removeEmptyGroups() {
  events = events.filter((group) => group.items.length);
}

function deleteEditingEvent() {
  if (!editingRef) {
    return;
  }
  const found = findEventById(editingRef.id);
  if (found) {
    found.group.items.splice(found.index, 1);
    removeEmptyGroups();
    events.forEach(syncCount);
    saveEvents();
    renderTimeline();
  }
  setDrawer(false);
}

document.querySelector("#searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const query = document.querySelector("#personSearch").value;
  if (query.trim().toLowerCase().includes("leo")) {
    setRoute("leo");
  } else {
    renderSearch(query);
  }
});

searchResults.addEventListener("click", (event) => {
  const result = event.target.closest("[data-person='leo']");
  if (result) {
    setRoute("leo");
  }
});

timelineList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-edit-id]");
  if (button && ownerMode) {
    openEditEvent(button.dataset.editId);
  }
});

document.querySelectorAll(".toggle-btn").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".toggle-btn").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    timelineList.classList.toggle("horizontal", button.dataset.view === "horizontal");
    timelineList.classList.toggle("vertical", button.dataset.view !== "horizontal");
  });
});

document.querySelector(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  setRoute("home");
});

document.querySelector("#openAdd").addEventListener("click", () => {
  resetEventForm();
  setDrawer(true, "add");
});
document.querySelector("#closeAdd").addEventListener("click", () => setDrawer(false));
document.querySelector("#closeBackdrop").addEventListener("click", () => setDrawer(false));
document.querySelector("#ownerLogin").addEventListener("click", () => setAuthDrawer(true));
document.querySelector("#ownerLogout").addEventListener("click", () => setOwnerMode(false));
document.querySelector("#exportEvents").addEventListener("click", downloadEvents);
document.querySelector("#restoreSeed").addEventListener("click", () => {
  events = normalizeEvents(structuredClone(seedEvents));
  saveEvents();
  renderTimeline();
});
deleteEventButton.addEventListener("click", deleteEditingEvent);
document.querySelector("#closeAuth").addEventListener("click", () => setAuthDrawer(false));
document.querySelector("#authBackdrop").addEventListener("click", () => setAuthDrawer(false));

document.querySelector("#authForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const account = document.querySelector("#ownerAccount").value.trim().toLowerCase();
  const password = document.querySelector("#ownerPassword").value;
  const authNote = document.querySelector("#authNote");
  if (account === OWNER_ACCOUNT && password === OWNER_PASSWORD) {
    setOwnerMode(true);
    setAuthDrawer(false);
    authNote.textContent = "Owner mode is active in this browser.";
    document.querySelector("#ownerPassword").value = "";
  } else {
    authNote.textContent = "Account or password is incorrect.";
  }
});

document.querySelector("#copyMd").addEventListener("click", async () => {
  await navigator.clipboard.writeText(markdown.value);
  copyStatus.textContent = "Copied. Paste it into ChatGPT, Claude, Gemini, or any AI chat.";
  setTimeout(() => {
    copyStatus.textContent = "Ready to copy into any AI chat.";
  }, 2400);
});

eventForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!ownerMode) {
    setAuthDrawer(true);
    return;
  }

  const year = document.querySelector("#eventYear").value.trim() || "2026";
  const uploadedImages = await readUploadedFiles(document.querySelector("#eventFile").files);
  const images = [...imageFields(), ...uploadedImages];
  const item = {
    id: editingRef?.id || crypto.randomUUID(),
    title: document.querySelector("#eventTitle").value.trim(),
    date: document.querySelector("#eventDate").value.trim(),
    images,
    note: document.querySelector("#eventNote").value.trim(),
    tags: parseTags(document.querySelector("#eventTags").value),
    visibility: document.querySelector("#eventVisibility").value
  };

  if (!item.title || !item.note) {
    eventStatus.textContent = "Title and description are required for a durable moment.";
    return;
  }

  if (editingRef) {
    const found = findEventById(editingRef.id);
    if (found) {
      found.group.items.splice(found.index, 1);
    }
  }

  let group = events.find((entry) => entry.year === year);
  if (!group) {
    group = { year, count: "1 selected moment", items: [] };
    events.unshift(group);
  }
  group.items.unshift(item);
  events.forEach(syncCount);
  removeEmptyGroups();
  events.sort((a, b) => Number(b.year) - Number(a.year));
  saveEvents();
  renderTimeline();
  eventStatus.textContent = "Saved in this browser.";
  setDrawer(false);
});

renderSearch();
setOwnerMode(ownerMode);
setRoute(location.hash === "#leo" ? "leo" : "home");
