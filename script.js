const events = [
  {
    year: "2026",
    count: "3 selected moments",
    items: [
      {
        title: "Buying the domain for a quieter personal web",
        date: "June 2026 - Amsterdam",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
        note: "The idea became real enough to deserve an address: a place for the road so far, not another feed.",
        tags: ["turning point", "product", "identity"]
      },
      {
        title: "The AI-readable profile becomes the homepage",
        date: "Spring 2026 - Remote",
        image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
        note: "A profile that can be read by people and copied into an AI assistant as durable personal context.",
        tags: ["AI context", "homepage", "portable"]
      }
    ]
  },
  {
    year: "2024",
    count: "5 selected moments",
    items: [
      {
        title: "Choosing annual memory over daily sharing",
        date: "December 2024 - End of year",
        image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80",
        note: "A small archive of moments felt more honest than a stream that keeps asking for more.",
        tags: ["archive", "memoir", "focus"]
      }
    ]
  },
  {
    year: "2021",
    count: "4 selected moments",
    items: [
      {
        title: "A move that changed the scale of ambition",
        date: "September 2021 - New chapter",
        image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
        note: "The geography changed, but the larger shift was learning to think in longer arcs.",
        tags: ["move", "chapter", "growth"]
      }
    ]
  },
  {
    year: "2018",
    count: "2 selected moments",
    items: [
      {
        title: "First proof that making things could be a life",
        date: "May 2018 - Early work",
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80",
        note: "Not a polished beginning, but a beginning that stayed with everything after it.",
        tags: ["origin", "work", "craft"]
      }
    ]
  }
];

const timelineList = document.querySelector("#timelineList");
const drawer = document.querySelector("#drawer");
const copyStatus = document.querySelector("#copyStatus");
const markdown = document.querySelector("#aiMarkdown");

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

function setDrawer(open) {
  drawer.classList.toggle("open", open);
  drawer.setAttribute("aria-hidden", String(!open));
}

document.querySelectorAll(".toggle-btn").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".toggle-btn").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    timelineList.classList.toggle("horizontal", button.dataset.view === "horizontal");
    timelineList.classList.toggle("vertical", button.dataset.view !== "horizontal");
  });
});

document.querySelector("#openAdd").addEventListener("click", () => setDrawer(true));
document.querySelector("#closeAdd").addEventListener("click", () => setDrawer(false));
document.querySelector("#closeBackdrop").addEventListener("click", () => setDrawer(false));

document.querySelector("#copyMd").addEventListener("click", async () => {
  await navigator.clipboard.writeText(markdown.value);
  copyStatus.textContent = "Copied. Paste it into ChatGPT, Claude, Gemini, or any AI chat.";
  setTimeout(() => {
    copyStatus.textContent = "Ready to copy into any AI chat.";
  }, 2400);
});

document.querySelector("#eventForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const year = document.querySelector("#eventYear").value.trim() || "2026";
  const item = {
    title: document.querySelector("#eventTitle").value.trim(),
    date: document.querySelector("#eventDate").value.trim(),
    image: document.querySelector("#eventImage").value.trim(),
    note: document.querySelector("#eventNote").value.trim(),
    tags: ["new", "selected", "private draft"]
  };
  let group = events.find((entry) => entry.year === year);
  if (!group) {
    group = { year, count: "1 selected moment", items: [] };
    events.unshift(group);
  }
  group.items.unshift(item);
  group.count = `${group.items.length} selected moment${group.items.length === 1 ? "" : "s"}`;
  events.sort((a, b) => Number(b.year) - Number(a.year));
  renderTimeline();
  setDrawer(false);
});

renderTimeline();
