const PRACTICE_ACCESS_KEY = "turnpo:ai-practice-access";
const PRACTICE_ITEMS_KEY = "turnpo:ai-practice-items";

const state = {
  accessGranted: false,
  items: []
};

const $ = (selector) => document.querySelector(selector);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function uid() {
  return globalThis.crypto?.randomUUID?.() || `practice-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeItem(item = {}) {
  return {
    id: item.id || uid(),
    date: item.date || todayKey(),
    mode: item.mode || "Prompt",
    title: item.title || "Untitled practice",
    prompt: item.prompt || "",
    outcome: item.outcome || "",
    nextAction: item.nextAction || "",
    createdAt: item.createdAt || new Date().toISOString()
  };
}

function sortedItems(items) {
  return [...items].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

function loadItems() {
  try {
    const saved = JSON.parse(localStorage.getItem(PRACTICE_ITEMS_KEY) || "[]");
    state.items = Array.isArray(saved) ? sortedItems(saved.map(normalizeItem)) : [];
  } catch {
    state.items = [];
  }
}

function saveItems() {
  localStorage.setItem(PRACTICE_ITEMS_KEY, JSON.stringify(sortedItems(state.items)));
}

function markdownForItems() {
  if (!state.items.length) return "# AI Practice\n\nNo saved practice yet.";
  return [
    "# AI Practice",
    "",
    ...sortedItems(state.items).map((item) => [
      `## ${item.date} - ${item.title}`,
      "",
      `Mode: ${item.mode}`,
      "",
      item.prompt ? `Prompt or task:\n${item.prompt}` : "",
      item.outcome ? `Result or reflection:\n${item.outcome}` : "",
      item.nextAction ? `Next action: ${item.nextAction}` : ""
    ].filter(Boolean).join("\n\n"))
  ].join("\n");
}

function renderStats() {
  const nextCount = state.items.filter((item) => item.nextAction.trim()).length;
  const latest = sortedItems(state.items)[0]?.date || "-";
  $("#practiceCount").textContent = String(state.items.length);
  $("#practiceNextCount").textContent = String(nextCount);
  $("#practiceLastDate").textContent = latest;
}

function renderMarkdown() {
  const output = $("#practiceMarkdown");
  if (output) output.value = markdownForItems();
}

function renderList() {
  const list = $("#practiceList");
  if (!list) return;
  if (!state.items.length) {
    list.innerHTML = `<div class="practice-empty">No saved practice yet.</div>`;
    renderStats();
    renderMarkdown();
    return;
  }

  list.innerHTML = sortedItems(state.items).map((item) => `
    <article class="practice-card">
      <div class="practice-card-head">
        <div>
          <div class="practice-card-meta">
            <span>${escapeHtml(item.date)}</span>
            <span>${escapeHtml(item.mode)}</span>
          </div>
          <h3>${escapeHtml(item.title)}</h3>
        </div>
        <button class="practice-delete-btn" type="button" aria-label="Delete ${escapeHtml(item.title)}" data-practice-delete="${escapeHtml(item.id)}">x</button>
      </div>
      ${item.prompt ? `<p><strong>Prompt:</strong><br />${escapeHtml(item.prompt)}</p>` : ""}
      ${item.outcome ? `<p><strong>Reflection:</strong><br />${escapeHtml(item.outcome)}</p>` : ""}
      ${item.nextAction ? `<p><strong>Next:</strong> ${escapeHtml(item.nextAction)}</p>` : ""}
    </article>
  `).join("");

  renderStats();
  renderMarkdown();
}

function hasPracticeAccess() {
  if (state.accessGranted) return true;
  if (document.cookie.split(";").some((cookie) => cookie.trim() === "turnpo_ai_practice_ui=granted")) return true;
  try {
    return sessionStorage.getItem(PRACTICE_ACCESS_KEY) === "granted";
  } catch {
    return false;
  }
}

function setPracticeAccess(granted) {
  state.accessGranted = granted;
  document.cookie = granted
    ? "turnpo_ai_practice_ui=granted; Path=/ai-practice; Max-Age=604800; SameSite=Lax"
    : "turnpo_ai_practice_ui=; Path=/ai-practice; Max-Age=0; SameSite=Lax";
  try {
    if (granted) sessionStorage.setItem(PRACTICE_ACCESS_KEY, "granted");
    else sessionStorage.removeItem(PRACTICE_ACCESS_KEY);
  } catch {
    // Keep the live page state even if sessionStorage is unavailable.
  }
}

function renderAccessState() {
  const granted = hasPracticeAccess();
  const gate = $("#practiceAccessGate");
  const app = $("#practiceApp");
  const lock = $("#practiceLock");
  if (gate) gate.hidden = granted;
  if (app) app.hidden = !granted;
  if (lock) lock.hidden = !granted;
  if (granted) {
    loadItems();
    renderList();
  }
}

function resetPracticeForm() {
  const form = $("#practiceForm");
  form?.reset();
  const date = $("#practiceDate");
  if (date) date.value = todayKey();
}

function initAccessGate() {
  $("#practiceLock")?.addEventListener("click", async () => {
    setPracticeAccess(false);
    await fetch("/ai-practice/logout", { method: "POST" }).catch(() => null);
    renderAccessState();
    $("#practicePassword")?.focus();
  });

  renderAccessState();
}

$("#practiceForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const title = String(formData.get("title") || "").trim();
  if (!title) return;

  state.items.unshift(normalizeItem({
    date: String(formData.get("date") || todayKey()),
    mode: String(formData.get("mode") || "Prompt"),
    title,
    prompt: String(formData.get("prompt") || "").trim(),
    outcome: String(formData.get("outcome") || "").trim(),
    nextAction: String(formData.get("nextAction") || "").trim()
  }));
  saveItems();
  resetPracticeForm();
  renderList();
});

$("#practiceList")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-practice-delete]");
  if (!button) return;
  state.items = state.items.filter((item) => item.id !== button.dataset.practiceDelete);
  saveItems();
  renderList();
});

$("#copyPracticeMarkdown")?.addEventListener("click", async () => {
  const status = $("#practiceCopyStatus");
  try {
    await navigator.clipboard.writeText(markdownForItems());
    if (status) status.textContent = "Copied";
  } catch {
    $("#practiceMarkdown")?.select();
    if (status) status.textContent = "Select and copy from the field.";
  }
});

resetPracticeForm();
initAccessGate();
