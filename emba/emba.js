const EMBA_ACCESS_KEY = "turnpo:emba-access";
const EMBA_PASSWORD = "emba2026";
const EMBA_LIBRARY_KEY = "turnpo:emba-library";
const EMBA_LIBRARY_API = "/api/emba/library";
const EMBA_UPLOAD_API = "/api/emba/upload";
const DEFAULT_START_MONTH = "2026-07";
const DEFAULT_END_MONTH = "2028-12";
const CLOUD_SAVE_DELAY_MS = 700;

const state = {
  selectedMonthId: "",
  library: {
    timeline: {},
    months: []
  },
  openBlockId: "",
  libraryLoaded: false,
  accessGranted: false,
  cloudReady: false,
  cloudSaveTimer: 0
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

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function slugify(value) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseMonth(monthKey) {
  const [year, month] = String(monthKey || "").split("-").map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null;
  return new Date(Date.UTC(year, month - 1, 1));
}

function monthKeyFromDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}` : "";
}

function addMonths(monthKey, amount) {
  const date = parseMonth(monthKey);
  if (!date) return "";
  date.setUTCMonth(date.getUTCMonth() + amount);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthRange(startMonth, endMonth) {
  const months = [];
  let current = startMonth;
  let guard = 0;
  while (current && current <= endMonth && guard < 60) {
    months.push(current);
    current = addMonths(current, 1);
    guard += 1;
  }
  return months;
}

function formatMonth(monthKey, options = { month: "long", year: "numeric" }) {
  const date = parseMonth(monthKey);
  if (!date) return monthKey || "Month";
  return date.toLocaleDateString("en", { timeZone: "UTC", ...options });
}

function monthId(month) {
  return month.id || month.month || slugify(month.title || "emba-month");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeMaterial(item) {
  if (typeof item === "string") return { title: item, type: "", file: "", notes: "" };
  return {
    title: item?.title || item?.name || "Material",
    type: item?.type || "",
    file: item?.file || item?.href || "",
    notes: item?.notes || item?.summary || ""
  };
}

function normalizeMemory(item, monthKey) {
  if (typeof item === "string") return { title: item, image: "", caption: "", month: monthKey };
  return {
    title: item?.title || "Memory",
    image: item?.image || item?.photo || item?.file || "",
    caption: item?.caption || item?.notes || "",
    month: item?.month || monthKey
  };
}

function normalizeMonth(month) {
  const monthKey = month.month || monthKeyFromDate(month.date) || DEFAULT_START_MONTH;
  const materials = asArray(month.materials || month.material || month.documents).map(normalizeMaterial);
  const memories = asArray(month.memoryMoment || month.memoryMoments || month.photos).map((item) => normalizeMemory(item, monthKey));
  return {
    id: month.id || monthKey,
    month: monthKey,
    title: month.title || formatMonth(monthKey),
    materials,
    reflection: month.reflection || month.notes || "",
    memoryMoment: memories
  };
}

function legacyDaysToMonths(days = []) {
  const grouped = new Map();
  days.forEach((day) => {
    const monthKey = monthKeyFromDate(day.date);
    if (!monthKey) return;
    const entry = grouped.get(monthKey) || {
      id: monthKey,
      month: monthKey,
      title: formatMonth(monthKey),
      materials: [],
      reflection: "",
      memoryMoment: []
    };
    entry.materials.push(...asArray(day.documents).map(normalizeMaterial));
    if (!entry.reflection && Array.isArray(day.notes) && day.notes[0]) {
      entry.reflection = day.notes[0].body || day.notes[0].title || "";
    }
    grouped.set(monthKey, entry);
  });
  return [...grouped.values()];
}

function timelineMonths() {
  const startMonth = state.library.timeline.startMonth || DEFAULT_START_MONTH;
  const endMonth = state.library.timeline.endMonth || DEFAULT_END_MONTH;
  const savedMonths = new Map(state.library.months.map((month) => [month.month, month]));
  return monthRange(startMonth, endMonth).map((monthKey) => savedMonths.get(monthKey) || {
    id: monthKey,
    month: monthKey,
    title: formatMonth(monthKey),
    materials: [],
    reflection: "",
    memoryMoment: []
  });
}

function createEmptyMonth(monthKey) {
  return {
    id: monthKey,
    month: monthKey,
    title: formatMonth(monthKey),
    materials: [],
    reflection: "",
    memoryMoment: []
  };
}

function sortLibraryMonths() {
  state.library.months.sort((a, b) => String(a.month || "").localeCompare(String(b.month || "")));
}

function editableMonth() {
  const current = selectedMonth();
  const monthKey = current?.month || DEFAULT_START_MONTH;
  let month = state.library.months.find((item) => item.month === monthKey);
  if (!month) {
    month = createEmptyMonth(monthKey);
    state.library.months.push(month);
    sortLibraryMonths();
  }
  month.materials = asArray(month.materials);
  month.memoryMoment = asArray(month.memoryMoment);
  if (typeof month.reflection !== "string") month.reflection = "";
  return month;
}

function normalizeLibraryData(library = {}) {
  const months = Array.isArray(library.months)
    ? library.months.map(normalizeMonth)
    : legacyDaysToMonths(library.days || library.items);
  return {
    timeline: library.timeline || {},
    months
  };
}

function savedLibrary() {
  try {
    const saved = JSON.parse(localStorage.getItem(EMBA_LIBRARY_KEY) || "null");
    if (!saved || !Array.isArray(saved.months)) return null;
    return normalizeLibraryData(saved);
  } catch {
    return null;
  }
}

function mergeLibrary(baseLibrary, saved) {
  if (!saved) return baseLibrary;
  const months = new Map(baseLibrary.months.map((month) => [month.month, month]));
  saved.months.forEach((month) => months.set(month.month, month));
  return {
    timeline: { ...baseLibrary.timeline, ...saved.timeline },
    months: [...months.values()].sort((a, b) => String(a.month || "").localeCompare(String(b.month || "")))
  };
}

function setSyncStatus(message = "", tone = "") {
  const status = $("#embaSyncStatus");
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function libraryForCloud() {
  return {
    updated: new Date().toISOString(),
    timeline: state.library.timeline,
    months: state.library.months.map((month) => ({
      ...month,
      memoryMoment: asArray(month.memoryMoment).map((item) => ({
        ...item,
        image: String(item.image || "").startsWith("data:") ? "" : item.image
      }))
    }))
  };
}

function persistLocalLibrary() {
  try {
    localStorage.setItem(EMBA_LIBRARY_KEY, JSON.stringify({
      updated: new Date().toISOString(),
      timeline: state.library.timeline,
      months: state.library.months
    }));
  } catch (error) {
    console.warn("Could not save EMBA edits locally.", error);
  }
}

async function syncLibraryToCloud() {
  if (!state.cloudReady) return;
  setSyncStatus("Saving");
  try {
    const response = await fetch(EMBA_LIBRARY_API, {
      method: "PUT",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(libraryForCloud())
    });
    if (!response.ok) throw new Error(`Cloud save failed (${response.status})`);
    setSyncStatus("Saved");
  } catch (error) {
    console.warn("Could not save EMBA library to cloud.", error);
    setSyncStatus("Local saved", "warn");
  }
}

function queueCloudSave() {
  if (!state.cloudReady) {
    setSyncStatus("Local saved", "warn");
    return;
  }
  window.clearTimeout(state.cloudSaveTimer);
  state.cloudSaveTimer = window.setTimeout(syncLibraryToCloud, CLOUD_SAVE_DELAY_MS);
}

function saveLibrary() {
  persistLocalLibrary();
  queueCloudSave();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function imageFileToDataUrl(file) {
  if (!file || !file.type.startsWith("image/")) return "";
  const rawDataUrl = await readFileAsDataUrl(file);
  try {
    const image = await loadImage(rawDataUrl);
    const maxSide = 1400;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.84);
  } catch {
    return rawDataUrl;
  }
}

async function uploadEmbaFile(file, month, kind) {
  if (!file || !state.cloudReady) return null;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("month", month);
  formData.append("kind", kind);
  setSyncStatus("Uploading");
  try {
    const response = await fetch(EMBA_UPLOAD_API, {
      method: "POST",
      credentials: "same-origin",
      body: formData
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Upload failed (${response.status})`);
    setSyncStatus("Uploaded");
    return payload;
  } catch (error) {
    console.warn("Could not upload EMBA file to cloud.", error);
    setSyncStatus("Upload kept local", "warn");
    return null;
  }
}

function selectedMonth() {
  return timelineMonths().find((month) => monthId(month) === state.selectedMonthId) || timelineMonths()[0] || null;
}

function renderTimeline() {
  const timeline = $("#embaTimeline");
  if (!timeline) return;
  const months = timelineMonths();
  if (!months.length) {
    timeline.innerHTML = `<div class="emba-empty-state">Add months in emba/materials.json.</div>`;
    renderMonthDetail(null);
    return;
  }
  if (!state.selectedMonthId) state.selectedMonthId = monthId(months[0]);

  timeline.innerHTML = months.map((month) => {
    const id = monthId(month);
    const isActive = state.selectedMonthId === id;
    const monthName = formatMonth(month.month, { month: "short" });
    const year = formatMonth(month.month, { year: "numeric" });
    return `
      <button class="emba-timeline-item${isActive ? " active" : ""}" type="button" data-month-id="${escapeHtml(id)}" aria-pressed="${isActive}" aria-label="${escapeHtml(formatMonth(month.month))}">
        <span class="emba-timeline-title">
          <span>${escapeHtml(monthName)}</span>
          <span>${escapeHtml(year)}</span>
        </span>
      </button>
    `;
  }).join("");
  timeline.style.setProperty("--month-count", months.length);
  renderMonthDetail(selectedMonth());
}

function renderMaterials(month) {
  const materials = asArray(month?.materials);
  return `
    <form class="emba-edit-form emba-material-form" data-material-add>
      <label class="emba-upload-target">
        <input name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.key,.pages,.numbers,.xls,.xlsx,image/*,application/pdf" />
        <span>Upload file</span>
      </label>
      <input class="emba-edit-input" name="title" placeholder="Material title" autocomplete="off" />
      <input class="emba-edit-input" name="notes" placeholder="Notes or link" autocomplete="off" />
      <button class="emba-small-btn" type="submit">Add</button>
    </form>
    ${materials.length ? `
      <ul class="emba-edit-list">
        ${materials.map((item, index) => `
          <li class="emba-edit-item">
            <input class="emba-edit-input" value="${escapeHtml(item.title)}" data-material-field="title" data-index="${index}" aria-label="Material title" />
            <input class="emba-edit-input" value="${escapeHtml(item.notes || "")}" data-material-field="notes" data-index="${index}" aria-label="Material notes" />
            ${item.file ? `<a class="emba-file-link" href="${escapeHtml(item.file)}" target="_blank" rel="noopener">Open file</a>` : `<span class="emba-file-spacer" aria-hidden="true"></span>`}
            <button class="emba-text-btn" type="button" data-material-delete="${index}">Delete</button>
          </li>
        `).join("")}
      </ul>
    ` : `<p class="emba-empty-copy">No material yet.</p>`}
  `;
}

function renderReflection(month) {
  const reflection = typeof month?.reflection === "string"
    ? month.reflection
    : asArray(month?.reflection).map((item) => item.body || item.title || item).filter(Boolean).join("\n\n");
  return `
    <textarea class="emba-reflection-editor" data-reflection-editor placeholder="Write reflection for this month...">${escapeHtml(reflection)}</textarea>
  `;
}

function memoryInitials(monthKey) {
  const date = parseMonth(monthKey);
  if (!date) return "EMBA";
  return date.toLocaleDateString("en", { timeZone: "UTC", month: "short" }).toUpperCase();
}

function renderMemoryMoment(month) {
  const memories = asArray(month?.memoryMoment);
  return `
    <form class="emba-upload-form" data-memory-add>
      <label class="emba-upload-target">
        <input name="image" type="file" accept="image/*" />
        <span>Upload photo</span>
      </label>
      <input class="emba-edit-input" name="title" placeholder="Photo title" autocomplete="off" />
      <input class="emba-edit-input" name="caption" placeholder="Caption" autocomplete="off" />
      <button class="emba-small-btn" type="submit">Add</button>
    </form>
    ${memories.length ? `
      <div class="emba-memory-rail">
        ${memories.map((item, index) => `
          <article class="emba-memory-item">
            <div class="emba-memory-photo">${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" />` : escapeHtml(memoryInitials(item.month))}</div>
            <div class="emba-memory-caption">
              <input class="emba-edit-input" value="${escapeHtml(item.title)}" data-memory-field="title" data-index="${index}" aria-label="Memory title" />
              <textarea class="emba-edit-textarea" data-memory-field="caption" data-index="${index}" aria-label="Memory caption">${escapeHtml(item.caption)}</textarea>
              <button class="emba-text-btn" type="button" data-memory-delete="${index}">Delete</button>
            </div>
          </article>
        `).join("")}
      </div>
    ` : `<p class="emba-empty-copy">No memory photos yet.</p>`}
  `;
}

function blockTemplate(id, title, body) {
  const isOpen = state.openBlockId === id;
  return `
    <article class="emba-content-block${isOpen ? " open" : ""}" data-block-id="${escapeHtml(id)}">
      <button class="emba-block-toggle" type="button" aria-expanded="${isOpen}" data-block-toggle="${escapeHtml(id)}">
        <span class="emba-block-title">${escapeHtml(title)}</span>
      </button>
      <div class="emba-block-body" ${isOpen ? "" : "hidden"}>${body}</div>
    </article>
  `;
}

function renderMonthDetail(month) {
  const detail = $("#embaMonthDetail");
  if (!detail) return;
  if (!month) {
    detail.innerHTML = "";
    return;
  }
  detail.innerHTML = `
    <div class="emba-month-kicker">${escapeHtml(formatMonth(month.month))}</div>
    <div class="emba-block-grid">
      ${blockTemplate("memory", "Memory Moment", renderMemoryMoment(month))}
      ${blockTemplate("reflection", "Reflection", renderReflection(month))}
      ${blockTemplate("material", "Material", renderMaterials(month))}
    </div>
  `;
}

function setActiveMonth(monthIdValue) {
  if (!monthIdValue || state.selectedMonthId === monthIdValue) return;
  state.selectedMonthId = monthIdValue;
  state.openBlockId = "";
  document.querySelectorAll("[data-month-id]").forEach((button) => {
    const isActive = button.dataset.monthId === state.selectedMonthId;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  renderMonthDetail(selectedMonth());
}

function hasEmbaAccess() {
  if (state.accessGranted) return true;
  if (document.cookie.split(";").some((cookie) => cookie.trim() === "turnpo_emba_ui=granted")) return true;
  try {
    return sessionStorage.getItem(EMBA_ACCESS_KEY) === "granted";
  } catch {
    return false;
  }
}

function setEmbaAccess(granted) {
  state.accessGranted = granted;
  document.cookie = granted
    ? "turnpo_emba_ui=granted; Path=/emba; Max-Age=604800; SameSite=Lax"
    : "turnpo_emba_ui=; Path=/emba; Max-Age=0; SameSite=Lax";
  try {
    if (granted) sessionStorage.setItem(EMBA_ACCESS_KEY, "granted");
    else sessionStorage.removeItem(EMBA_ACCESS_KEY);
  } catch {
    // Keep the live page state even if sessionStorage is unavailable.
  }
}

function renderAccessState() {
  const granted = hasEmbaAccess();
  const gate = $("#embaAccessGate");
  const app = $("#embaApp");
  const lock = $("#embaLock");
  if (gate) gate.hidden = granted;
  if (app) app.hidden = !granted;
  if (lock) lock.hidden = !granted;
  if (granted && !state.libraryLoaded) loadLibrary();
}

async function loadLibrary() {
  try {
    state.libraryLoaded = true;
    const response = await fetch("/emba/materials.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load materials.json (${response.status})`);
    const library = await response.json();
    const baseLibrary = normalizeLibraryData(library);
    const cloudLibrary = await loadCloudLibrary();
    const localLibrary = savedLibrary();
    if (cloudLibrary) {
      state.library = mergeLibrary(baseLibrary, cloudLibrary);
      if (!cloudLibrary.months.length && localLibrary) {
        state.library = mergeLibrary(state.library, localLibrary);
        saveLibrary();
      } else {
        persistLocalLibrary();
      }
    } else {
      state.library = mergeLibrary(baseLibrary, localLibrary);
    }
    state.selectedMonthId = timelineMonths()[0] ? monthId(timelineMonths()[0]) : "";
    renderTimeline();
  } catch (error) {
    state.libraryLoaded = false;
    const timeline = $("#embaTimeline");
    if (timeline) timeline.innerHTML = `<div class="emba-empty-state">${escapeHtml(error.message)}</div>`;
  }
}

async function loadCloudLibrary() {
  try {
    const response = await fetch(EMBA_LIBRARY_API, {
      cache: "no-store",
      credentials: "same-origin"
    });
    if (response.status === 401 || response.status === 404) {
      state.cloudReady = false;
      setSyncStatus("Local only", "warn");
      return null;
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.configured === false) {
      state.cloudReady = false;
      setSyncStatus("Local only", "warn");
      return null;
    }
    state.cloudReady = true;
    setSyncStatus(payload.months?.length ? "Cloud synced" : "Cloud ready");
    return normalizeLibraryData(payload);
  } catch (error) {
    state.cloudReady = false;
    setSyncStatus("Local only", "warn");
    return null;
  }
}

function initAccessGate() {
  $("#embaAccessForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const passwordInput = $("#embaPassword");
    const note = $("#embaAccessNote");
    if ((passwordInput?.value || "").trim() === EMBA_PASSWORD) {
      setEmbaAccess(true);
      if (passwordInput) passwordInput.value = "";
      if (note) note.textContent = "";
      renderAccessState();
      return;
    }
    if (note) note.textContent = "Password is incorrect.";
    passwordInput?.focus();
  });

  $("#embaLock")?.addEventListener("click", async () => {
    setEmbaAccess(false);
    await fetch("/emba/logout", { method: "POST" }).catch(() => null);
    renderAccessState();
    $("#embaPassword")?.focus();
  });

  renderAccessState();
}

$("#embaTimeline")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-month-id]");
  if (!button) return;
  setActiveMonth(button.dataset.monthId || "");
});

function handleTimelineHover(event) {
  const button = event.target.closest("[data-month-id]");
  if (!button) return;
  setActiveMonth(button.dataset.monthId || "");
}

$("#embaTimeline")?.addEventListener("pointerover", handleTimelineHover);
$("#embaTimeline")?.addEventListener("mouseover", handleTimelineHover);
$("#embaTimeline")?.addEventListener("mousemove", handleTimelineHover);

$("#embaTimeline")?.addEventListener("focusin", (event) => {
  const button = event.target.closest("[data-month-id]");
  if (!button) return;
  setActiveMonth(button.dataset.monthId || "");
});

$("#embaMonthDetail")?.addEventListener("click", (event) => {
  const memoryDelete = event.target.closest("[data-memory-delete]");
  if (memoryDelete) {
    const month = editableMonth();
    month.memoryMoment.splice(Number(memoryDelete.dataset.memoryDelete), 1);
    saveLibrary();
    renderMonthDetail(selectedMonth());
    return;
  }

  const materialDelete = event.target.closest("[data-material-delete]");
  if (materialDelete) {
    const month = editableMonth();
    month.materials.splice(Number(materialDelete.dataset.materialDelete), 1);
    saveLibrary();
    renderMonthDetail(selectedMonth());
    return;
  }

  const button = event.target.closest("[data-block-toggle]");
  if (!button) return;
  const blockId = button.dataset.blockToggle || "";
  state.openBlockId = state.openBlockId === blockId ? "" : blockId;
  renderMonthDetail(selectedMonth());
});

$("#embaMonthDetail")?.addEventListener("input", (event) => {
  const target = event.target;
  const month = editableMonth();

  if (target.matches("[data-reflection-editor]")) {
    month.reflection = target.value;
    saveLibrary();
    return;
  }

  if (target.matches("[data-memory-field]")) {
    const item = month.memoryMoment[Number(target.dataset.index)];
    if (!item) return;
    item[target.dataset.memoryField] = target.value;
    saveLibrary();
    return;
  }

  if (target.matches("[data-material-field]")) {
    const item = month.materials[Number(target.dataset.index)];
    if (!item) return;
    item[target.dataset.materialField] = target.value;
    saveLibrary();
  }
});

$("#embaMonthDetail")?.addEventListener("submit", async (event) => {
  const form = event.target;
  if (!form.matches("[data-memory-add], [data-material-add]")) return;
  event.preventDefault();
  const month = editableMonth();

  if (form.matches("[data-memory-add]")) {
    const file = form.elements.image?.files?.[0] || null;
    const title = String(form.elements.title?.value || "").trim();
    const caption = String(form.elements.caption?.value || "").trim();
    const uploaded = file ? await uploadEmbaFile(file, month.month, "memory") : null;
    const image = uploaded?.url || (file ? await imageFileToDataUrl(file) : "");
    if (!image && !title && !caption) return;
    month.memoryMoment.push({
      title: title || "Memory",
      image,
      caption,
      month: month.month
    });
    saveLibrary();
    form.reset();
    renderMonthDetail(selectedMonth());
    return;
  }

  if (form.matches("[data-material-add]")) {
    const file = form.elements.file?.files?.[0] || null;
    const title = String(form.elements.title?.value || "").trim();
    const notes = String(form.elements.notes?.value || "").trim();
    const uploaded = file ? await uploadEmbaFile(file, month.month, "material") : null;
    if (file && !uploaded && !title && !notes) return;
    if (!file && !title && !notes) return;
    month.materials.push({
      title: title || uploaded?.name || "Material",
      type: uploaded?.type || "",
      file: uploaded?.url || "",
      notes
    });
    saveLibrary();
    form.reset();
    renderMonthDetail(selectedMonth());
  }
});

initAccessGate();
