const OWNER_ACCOUNT = "leo";
const OWNER_PASSWORD = "turnpo-owner";
const STORAGE_KEY = "turnpo:leo:events";
const OWNER_KEY = "turnpo:owner-mode";

const seedEvents = [
  {
    year: "2026",
    count: "3 selected moments",
    items: [
      {
        title: "Co-creating MapKAI",
        date: "May 2026 - Eindhoven",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
        note: "An early-stage exploration of knowledge mapping, AI-assisted reflection, and AI-native decision systems.",
        tags: ["MapKAI", "AI", "knowledge"]
      },
      {
        title: "Designing learning and knowledge solutions at ASML",
        date: "2026 - ASML Academy",
        image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
        note: "Working between people, systems, and performance to make expert knowledge easier to access and apply.",
        tags: ["ASML", "learning", "performance"]
      }
    ]
  },
  {
    year: "2023",
    count: "1 selected moment",
    items: [
      {
        title: "Became L&KM Solution Designer",
        date: "July 2023 - Eindhoven",
        image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80",
        note: "Moved into a role focused on scalable learning, knowledge sharing, and capability-building solutions.",
        tags: ["ASML", "role shift", "knowledge management"]
      }
    ]
  },
  {
    year: "2018",
    count: "1 selected moment",
    items: [
      {
        title: "Started at ASML as Technical Instructor/Developer",
        date: "August 2018 - Shanghai",
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80",
        note: "Delivered technical training, led projects, and began turning engineering knowledge into reusable learning.",
        tags: ["technical training", "ASML", "China"]
      }
    ]
  },
  {
    year: "2012",
    count: "1 selected moment",
    items: [
      {
        title: "Began engineering work in aircraft engines",
        date: "August 2012 - Harbin",
        image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
        note: "Worked on equipment installation, commissioning, maintenance, and internal technical training programs.",
        tags: ["engineering", "aircraft engines", "origin"]
      }
    ]
  }
];

let events = loadEvents();
let ownerMode = localStorage.getItem(OWNER_KEY) === "true";

const body = document.body;
const entryView = document.querySelector("#entryView");
const profileContent = document.querySelectorAll(".profile-content");
const timelineList = document.querySelector("#timelineList");
const drawer = document.querySelector("#drawer");
const authDrawer = document.querySelector("#authDrawer");
const copyStatus = document.querySelector("#copyStatus");
const markdown = document.querySelector("#aiMarkdown");
const searchResults = document.querySelector("#searchResults");

function loadEvents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || structuredClone(seedEvents);
  } catch {
    return structuredClone(seedEvents);
  }
}

function saveEvents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function syncCount(group) {
  group.count = `${group.items.length} selected moment${group.items.length === 1 ? "" : "s"}`;
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
}

function setDrawer(open) {
  if (!ownerMode && open) {
    setAuthDrawer(true);
    return;
  }
  drawer.classList.toggle("open", open);
  drawer.setAttribute("aria-hidden", String(!open));
}

function setAuthDrawer(open) {
  authDrawer.classList.toggle("open", open);
  authDrawer.setAttribute("aria-hidden", String(!open));
}

function renderTimeline() {
  timelineList.innerHTML = events.map((group) => `
    <article class="year-block">
      <div class="year-label">${group.year}</div>
      <div class="year-title">${group.year}<span>${group.count}</span></div>
      <div class="event-stack">
        ${group.items.map((item) => `
          <article class="event-card">
            <img src="${item.image}" alt="${item.title}" />
            <div>
              <div class="event-date">${item.date}</div>
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
  `).join("");
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

function readUploadedFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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

document.querySelector("#openAdd").addEventListener("click", () => setDrawer(true));
document.querySelector("#closeAdd").addEventListener("click", () => setDrawer(false));
document.querySelector("#closeBackdrop").addEventListener("click", () => setDrawer(false));
document.querySelector("#ownerLogin").addEventListener("click", () => setAuthDrawer(true));
document.querySelector("#ownerLogout").addEventListener("click", () => setOwnerMode(false));
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

document.querySelector("#eventForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!ownerMode) {
    setAuthDrawer(true);
    return;
  }

  const year = document.querySelector("#eventYear").value.trim() || "2026";
  const uploadedImage = await readUploadedFile(document.querySelector("#eventFile").files[0]);
  const item = {
    title: document.querySelector("#eventTitle").value.trim(),
    date: document.querySelector("#eventDate").value.trim(),
    image: uploadedImage || document.querySelector("#eventImage").value.trim(),
    note: document.querySelector("#eventNote").value.trim(),
    tags: ["new", "selected", "owner added"]
  };

  let group = events.find((entry) => entry.year === year);
  if (!group) {
    group = { year, count: "1 selected moment", items: [] };
    events.unshift(group);
  }
  group.items.unshift(item);
  syncCount(group);
  events.sort((a, b) => Number(b.year) - Number(a.year));
  saveEvents();
  renderTimeline();
  setDrawer(false);
  event.target.reset();
});

renderSearch();
setOwnerMode(ownerMode);
setRoute(location.hash === "#leo" ? "leo" : "home");
