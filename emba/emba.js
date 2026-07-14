const EMBA_ACCESS_KEY = "turnpo:emba-access";
const EMBA_PASSWORD = "emba2026";
const EMBA_LIBRARY_KEY = "turnpo:emba-library";
const EMBA_LIBRARY_API = "/api/emba/library";
const EMBA_UPLOAD_API = "/api/emba/upload";
const EMBA_KNOWLEDGE_INDEX = "/emba/content/knowledge-index.json";
const DEFAULT_START_MONTH = "2026-06";
const DEFAULT_END_MONTH = "2028-12";
const CLOUD_SAVE_DELAY_MS = 700;
const THINKING_REVIEW_STATUSES = ["pending", "keep", "rewrite", "action", "complete"];
const HIDDEN_MATERIAL_FILES = new Set([
  "/emba/materials/2026-07/handwritten-notes/leadership-learning-notes-analysis.md"
]);
const PREPARATION_MATERIAL_TYPES = new Set([
  "course_overview",
  "course_requirements",
  "daily_course_intro",
  "reading_learning_map",
  "case_inspiration"
]);

const state = {
  selectedMonthId: "",
  library: {
    timeline: {},
    months: []
  },
  openBlockId: "",
  materialReader: null,
  libraryLoaded: false,
  accessGranted: false,
  editMode: false,
  cloudReady: false,
  cloudSaveTimer: 0,
  knowledge: {
    loaded: false,
    loading: false,
    notes: [],
    selectedNoteId: "",
    markdownCache: {},
    filters: {
      query: ""
    }
  }
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

function isEditMode() {
  return state.editMode;
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

function normalizeMarkdown(value) {
  return String(value || "");
}

function normalizeRevision(value = 0) {
  const revision = Number(value || 0);
  if (!Number.isFinite(revision)) return 0;
  return Math.max(0, Math.min(9999, Math.trunc(revision)));
}

function bumpRevision(month, field) {
  month[field] = Math.min(9999, normalizeRevision(month[field]) + 1);
}

function bumpInputRevision(target, month, field) {
  if (target.dataset.revisionBumped === "true") return;
  target.dataset.revisionBumped = "true";
  bumpRevision(month, field);
}

function normalizeThinkingReviewStatus(value = "") {
  const status = String(value || "").trim().toLowerCase();
  return THINKING_REVIEW_STATUSES.includes(status) ? status : "pending";
}

function normalizeReviewDate(value = "") {
  const date = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
}

function normalizeThinkingItem(item) {
  if (typeof item === "string") return item.trim();
  if (!item || typeof item !== "object") return "";

  const normalizedItem = {
    id: String(item.id || "").trim(),
    kind: String(item.kind || item.type || "思考").trim(),
    title: String(item.title || item.body || item.original || "").trim(),
    date: String(item.date || "").trim(),
    source: String(item.source || "").trim(),
    position: String(item.position || "").trim(),
    original: String(item.original || item.raw || "").trim(),
    context: String(item.context || "").trim(),
    reconstruction: String(item.reconstruction || item.completedArgument || item.completed || "").trim(),
    evidenceBoundary: String(item.evidenceBoundary || item.boundary || "").trim(),
    reviewPrompt: String(item.reviewPrompt || item.review || "").trim(),
    reviewNotes: String(item.reviewNotes || "").trim(),
    followUp: String(item.followUp || item.followup || "").trim(),
    followUpNotes: String(item.followUpNotes || "").trim(),
    learningReflection: String(item.learningReflection || item.reflection || "").trim(),
    learningNotes: String(item.learningNotes || "").trim(),
    reviewStatus: normalizeThinkingReviewStatus(item.reviewStatus || item.status),
    reviewDate: normalizeReviewDate(item.reviewDate || item.reviewedAt),
    confidence: String(item.confidence || "").trim().toLowerCase(),
    image: String(item.image || item.sourceImage || "").trim()
  };

  return normalizedItem.title || normalizedItem.original ? normalizedItem : "";
}

function normalizeThinkingQuestions(value) {
  return asArray(value).map(normalizeThinkingItem).filter(Boolean);
}

function thinkingItemText(item) {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return "";
  return [
    item.id,
    item.kind,
    item.title,
    item.date,
    item.source,
    item.position,
    item.original,
    item.context,
    item.reconstruction
  ].filter(Boolean).join(" ");
}

function thinkingItemHasContent(item) {
  return hasTextContent(thinkingItemText(item));
}

function normalizeMonth(month) {
  const monthKey = month.month || monthKeyFromDate(month.date) || DEFAULT_START_MONTH;
  const materials = asArray(month.materials || month.material || month.documents)
    .map(normalizeMaterial)
    .filter(materialHasContent);
  const memories = asArray(month.memoryMoment || month.memoryMoments || month.photos).map((item) => normalizeMemory(item, monthKey));
  return {
    id: month.id || monthKey,
    month: monthKey,
    title: month.title || formatMonth(monthKey),
    materialsRevision: normalizeRevision(month.materialsRevision),
    reflectionRevision: normalizeRevision(month.reflectionRevision),
    followUpRevision: normalizeRevision(month.followUpRevision),
    markdownRevision: normalizeRevision(month.markdownRevision),
    memoryRevision: normalizeRevision(month.memoryRevision),
    materials,
    reflection: month.reflection || month.notes || "",
    thinkingQuestions: normalizeThinkingQuestions(month.thinkingQuestions || month.questions || month.thoughts),
    followUpPoints: normalizeThinkingQuestions(month.followUpPoints || month.followUps || month.openQuestions),
    markdown: normalizeMarkdown(month.reviewedMarkdown || month.markdown || month.md || month.searchNotes),
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
      materialsRevision: 0,
      reflectionRevision: 0,
      followUpRevision: 0,
      markdownRevision: 0,
      memoryRevision: 0,
      materials: [],
      reflection: "",
      thinkingQuestions: [],
      followUpPoints: [],
      markdown: "",
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

function hasTextContent(value) {
  return String(value || "").trim().length > 0;
}

function materialHasContent(item = {}) {
  if (HIDDEN_MATERIAL_FILES.has(String(item.file || ""))) return false;
  return hasTextContent(item.file)
    || hasTextContent(item.notes)
    || (hasTextContent(item.title) && item.title !== "Material");
}

function memoryHasContent(item = {}) {
  return hasTextContent(item.image);
}

function monthHasContent(month = {}) {
  return asArray(month.materials).some(materialHasContent)
    || hasTextContent(month.reflection)
    || asArray(month.thinkingQuestions).some(thinkingItemHasContent)
    || asArray(month.followUpPoints).some(thinkingItemHasContent)
    || hasTextContent(month.markdown)
    || asArray(month.memoryMoment).some(memoryHasContent);
}

function timelineMonths() {
  return state.library.months
    .filter(monthHasContent)
    .sort((a, b) => String(a.month || "").localeCompare(String(b.month || "")));
}

function createEmptyMonth(monthKey) {
  return {
    id: monthKey,
    month: monthKey,
    title: formatMonth(monthKey),
    materialsRevision: 0,
    reflectionRevision: 0,
    followUpRevision: 0,
    markdownRevision: 0,
    memoryRevision: 0,
    materials: [],
    reflection: "",
    thinkingQuestions: [],
    followUpPoints: [],
    markdown: "",
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
  month.thinkingQuestions = normalizeThinkingQuestions(month.thinkingQuestions);
  month.followUpPoints = normalizeThinkingQuestions(month.followUpPoints);
  if (typeof month.markdown !== "string") month.markdown = "";
  ["materialsRevision", "reflectionRevision", "followUpRevision", "markdownRevision", "memoryRevision"]
    .forEach((field) => {
      month[field] = normalizeRevision(month[field]);
    });
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

function compactTextLength(value) {
  return String(value || "").replace(/\s+/g, "").length;
}

function richerText(baseValue, overlayValue) {
  const baseText = normalizeMarkdown(baseValue);
  const overlayText = normalizeMarkdown(overlayValue);
  if (!hasTextContent(baseText)) return overlayText;
  if (!hasTextContent(overlayText)) return baseText;
  return compactTextLength(baseText) > compactTextLength(overlayText) * 1.35 ? baseText : overlayText;
}

function mergeMaterialLists(baseMaterials = [], overlayMaterials = []) {
  const seen = new Set();
  return [...asArray(baseMaterials), ...asArray(overlayMaterials)]
    .map(normalizeMaterial)
    .filter(materialHasContent)
    .filter((item) => {
      const key = `${normalize(item.file)}|${normalize(item.title)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function mergeThinkingLists(baseItems = [], overlayItems = []) {
  const base = normalizeThinkingQuestions(baseItems);
  const overlay = normalizeThinkingQuestions(overlayItems);
  const baseIsStructured = base.some((item) => typeof item === "object");
  if (baseIsStructured) {
    const merged = base.map((item) => typeof item === "object" ? { ...item } : item);
    const indexesById = new Map(merged
      .map((item, index) => [typeof item === "object" ? normalize(item.id) : "", index])
      .filter(([id]) => id));
    overlay.filter((item) => typeof item === "object").forEach((item) => {
      const key = normalize(item.id);
      const existingIndex = indexesById.get(key);
      if (existingIndex === undefined) {
        indexesById.set(key, merged.length);
        merged.push(item);
        return;
      }
      merged[existingIndex] = {
        ...merged[existingIndex],
        reviewNotes: item.reviewNotes,
        followUpNotes: item.followUpNotes,
        learningNotes: item.learningNotes,
        reviewStatus: item.reviewStatus,
        reviewDate: item.reviewDate
      };
    });
    return merged;
  }

  const seen = new Set();
  return [...base, ...overlay]
    .filter((item) => {
      const key = typeof item === "object" && item.id
        ? `id:${normalize(item.id)}`
        : normalize(thinkingItemText(item));
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function revisionWinner(baseMonth = {}, overlayMonth = {}, field = "") {
  const baseRevision = normalizeRevision(baseMonth[field]);
  const overlayRevision = normalizeRevision(overlayMonth[field]);
  if (baseRevision === overlayRevision) return "";
  return baseRevision > overlayRevision ? "base" : "overlay";
}

function mergeMonthData(baseMonth = {}, overlayMonth = {}) {
  const materialsWinner = revisionWinner(baseMonth, overlayMonth, "materialsRevision");
  const reflectionWinner = revisionWinner(baseMonth, overlayMonth, "reflectionRevision");
  const followUpWinner = revisionWinner(baseMonth, overlayMonth, "followUpRevision");
  const markdownWinner = revisionWinner(baseMonth, overlayMonth, "markdownRevision");
  const memoryWinner = revisionWinner(baseMonth, overlayMonth, "memoryRevision");
  const baseThinking = normalizeThinkingQuestions(baseMonth.thinkingQuestions);
  const baseThinkingIsStructured = baseThinking.some((item) => typeof item === "object");
  const exactMaterials = (items) => asArray(items).map(normalizeMaterial).filter(materialHasContent);
  const exactMemories = (items) => asArray(items).map((item) => normalizeMemory(item, overlayMonth.month || baseMonth.month));
  return {
    ...baseMonth,
    ...overlayMonth,
    title: overlayMonth.title || baseMonth.title,
    materials: materialsWinner
      ? exactMaterials(materialsWinner === "base" ? baseMonth.materials : overlayMonth.materials)
      : mergeMaterialLists(baseMonth.materials, overlayMonth.materials),
    materialsRevision: Math.max(normalizeRevision(baseMonth.materialsRevision), normalizeRevision(overlayMonth.materialsRevision)),
    reflection: reflectionWinner
      ? normalizeMarkdown(reflectionWinner === "base" ? baseMonth.reflection : overlayMonth.reflection)
      : richerText(baseMonth.reflection, overlayMonth.reflection),
    reflectionRevision: Math.max(normalizeRevision(baseMonth.reflectionRevision), normalizeRevision(overlayMonth.reflectionRevision)),
    thinkingQuestions: baseThinkingIsStructured
      ? mergeThinkingLists(baseMonth.thinkingQuestions, overlayMonth.thinkingQuestions)
      : reflectionWinner
        ? normalizeThinkingQuestions(reflectionWinner === "base" ? baseMonth.thinkingQuestions : overlayMonth.thinkingQuestions)
        : mergeThinkingLists(baseMonth.thinkingQuestions, overlayMonth.thinkingQuestions),
    followUpPoints: followUpWinner
      ? normalizeThinkingQuestions(followUpWinner === "base" ? baseMonth.followUpPoints : overlayMonth.followUpPoints)
      : mergeThinkingLists(baseMonth.followUpPoints, overlayMonth.followUpPoints),
    followUpRevision: Math.max(normalizeRevision(baseMonth.followUpRevision), normalizeRevision(overlayMonth.followUpRevision)),
    markdown: markdownWinner
      ? normalizeMarkdown(markdownWinner === "base" ? baseMonth.markdown : overlayMonth.markdown)
      : richerText(baseMonth.markdown, overlayMonth.markdown),
    markdownRevision: Math.max(normalizeRevision(baseMonth.markdownRevision), normalizeRevision(overlayMonth.markdownRevision)),
    memoryMoment: memoryWinner
      ? exactMemories(memoryWinner === "base" ? baseMonth.memoryMoment : overlayMonth.memoryMoment)
      : asArray(overlayMonth.memoryMoment).length
        ? exactMemories(overlayMonth.memoryMoment)
        : exactMemories(baseMonth.memoryMoment),
    memoryRevision: Math.max(normalizeRevision(baseMonth.memoryRevision), normalizeRevision(overlayMonth.memoryRevision))
  };
}

function mergeLibrary(baseLibrary, saved) {
  if (!saved) return baseLibrary;
  const months = new Map(baseLibrary.months.map((month) => [month.month, month]));
  saved.months.forEach((month) => {
    const baseMonth = months.get(month.month);
    months.set(month.month, baseMonth ? mergeMonthData(baseMonth, month) : month);
  });
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

function updateEditModeControl() {
  const button = $("#embaEditToggle");
  if (!button) return;
  const granted = hasEmbaAccess();
  button.hidden = !granted;
  button.setAttribute("aria-pressed", String(isEditMode()));
  button.textContent = isEditMode() ? "Editing" : "Edit mode";
  button.setAttribute("aria-label", isEditMode() ? "Turn off EMBA editing" : "Turn on EMBA editing");
  document.body.classList.toggle("emba-editing", isEditMode());
}

function setEditMode(enabled) {
  state.editMode = Boolean(enabled);
  updateEditModeControl();
  renderMonthDetail(selectedMonth());
}

function openMemoryLightbox(image, label = "") {
  const lightbox = $("#embaLightbox");
  const photo = $("#embaLightboxImage");
  if (!lightbox || !photo || !image) return;
  photo.src = image;
  photo.alt = label || "EMBA memory photo";
  lightbox.hidden = false;
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("emba-lightbox-open");
}

function closeMemoryLightbox() {
  const lightbox = $("#embaLightbox");
  const photo = $("#embaLightboxImage");
  if (!lightbox || !photo) return;
  lightbox.hidden = true;
  lightbox.setAttribute("aria-hidden", "true");
  photo.removeAttribute("src");
  photo.alt = "";
  document.body.classList.remove("emba-lightbox-open");
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

function cleanStringList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  if (!value) return [];
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
}

function normalizeKnowledgeNote(note = {}) {
  const year = Number(note.year || monthKeyFromDate(note.date).slice(0, 4));
  return {
    id: note.id || slugify(note.title || note.md_file || "emba-note"),
    title: note.title || "Untitled EMBA note",
    type: note.type || "note",
    program: note.program || "EMBA",
    school: note.school || "Maastricht University",
    course: note.course || "",
    module: note.module || "",
    session: note.session || "",
    date: note.date || "",
    year: Number.isFinite(year) ? year : "",
    month: note.month || monthKeyFromDate(note.date),
    source_type: note.source_type || "",
    source_file: note.source_file || note.original_file || "",
    source_files: cleanStringList(note.source_files || note.original_files),
    converted_from: note.converted_from || "",
    md_file: note.md_file || note.file || "",
    visibility: note.visibility || "private",
    status: note.status || "active",
    tags: cleanStringList(note.tags),
    keywords: cleanStringList(note.keywords),
    summary: note.summary || "",
    related_topics: cleanStringList(note.related_topics),
    rag_include: note.rag_include !== false,
    search_text: note.search_text || "",
    search_body: note.search_body || ""
  };
}

function setKnowledgeStatus(message = "", tone = "") {
  const status = $("#embaKnowledgeStatus");
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
  status.hidden = !message;
}

function liveMonthSearchText(note = {}) {
  if (!note.month) return "";
  const month = state.library.months.find((item) => item.month === note.month);
  if (!month) return "";

  const thinkingItems = normalizeThinkingQuestions(month.thinkingQuestions);
  if (note.id === "emba-2026-07-personal-marker-original-extract") {
    return thinkingItems
      .map((item) => typeof item === "object"
        ? [item.id, item.original, item.context, item.source, item.position].filter(Boolean).join(" ")
        : item)
      .join(" ");
  }
  if (note.id === "emba-2026-07-questions-and-reflections-review") {
    return thinkingItems.map(thinkingItemText).join(" ");
  }
  if (note.type === "personal_reflection") {
    return [month.reflection, ...thinkingItems.map(thinkingItemText)].join(" ");
  }
  if (note.type === "course_note") return month.markdown;
  if (note.type === "monthly_index") {
    return [month.reflection, month.markdown].join(" ");
  }
  return "";
}

function noteSearchBlob(note = {}) {
  return [
    note.title,
    note.type,
    note.course,
    note.module,
    note.session,
    note.date,
    note.year,
    note.month,
    note.source_type,
    note.converted_from,
    note.summary,
    note.tags.join(" "),
    note.keywords.join(" "),
    note.related_topics.join(" "),
    note.search_text,
    note.search_body,
    liveMonthSearchText(note)
  ].join(" ").toLowerCase();
}

function noteMatchesKnowledgeFilters(note = {}) {
  const filters = state.knowledge.filters;
  const terms = normalize(filters.query).split(/\s+/).filter(Boolean);
  const searchable = noteSearchBlob(note);
  return !terms.length || terms.every((term) => searchable.includes(term));
}

function filteredKnowledgeNotes() {
  if (!normalize(state.knowledge.filters.query)) return [];
  return state.knowledge.notes
    .filter((note) => note.visibility !== "public" ? true : note.status !== "deleted")
    .filter((note) => note.status !== "deleted")
    .filter(noteMatchesKnowledgeFilters)
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || a.title.localeCompare(b.title));
}

function formatKnowledgeType(value = "") {
  return String(value || "note").replaceAll("_", " ");
}

function formatKnowledgeMonth(value = "") {
  return value ? `${formatMonth(value)} (${value})` : "";
}

function renderKnowledgeControls() {
  const input = $("#embaKnowledgeSearch");
  if (input && input.value !== state.knowledge.filters.query) {
    input.value = state.knowledge.filters.query;
  }
}

function noteMetaText(note = {}) {
  return [
    note.month,
    note.course,
    formatKnowledgeType(note.type),
    note.source_type
  ].filter(Boolean).join(" · ");
}

function renderKnowledgeResult(note, isSelected) {
  const sourceCount = note.source_files.length || (note.source_file ? 1 : 0);
  return `
    <article class="emba-knowledge-result${isSelected ? " selected" : ""}">
      <div class="emba-knowledge-result-main">
        <span class="emba-knowledge-result-title">${escapeHtml(note.title)}</span>
        <span class="emba-knowledge-result-meta">${escapeHtml(noteMetaText(note))}</span>
      </div>
      <div class="emba-knowledge-result-actions">
        ${note.md_file ? `<a class="emba-file-link" href="${escapeHtml(note.md_file)}" target="_blank" rel="noopener">Open MD</a>` : ""}
        ${note.source_file ? `<a class="emba-file-link" href="${escapeHtml(note.source_file)}" target="_blank" rel="noopener">Open source${sourceCount > 1 ? ` (${sourceCount})` : ""}</a>` : ""}
        ${note.month ? `<button class="emba-text-btn" type="button" data-knowledge-month="${escapeHtml(note.month)}">Show month</button>` : ""}
      </div>
    </article>
  `;
}

function renderKnowledgeResults() {
  const results = $("#embaKnowledgeResults");
  if (!results) return;
  const hasQuery = Boolean(normalize(state.knowledge.filters.query));
  if (!hasQuery) {
    state.knowledge.selectedNoteId = "";
    setKnowledgeStatus("");
    results.innerHTML = "";
    results.hidden = true;
    return;
  }
  const notes = filteredKnowledgeNotes();
  const count = notes.length;
  results.hidden = false;
  setKnowledgeStatus(state.knowledge.loaded ? `${count} note${count === 1 ? "" : "s"} found.` : "Loading knowledge base.");
  results.innerHTML = count ? notes.map((note) => renderKnowledgeResult(note, note.id === state.knowledge.selectedNoteId)).join("")
    : `<div class="emba-empty-state">No EMBA notes match these filters.</div>`;
}

function renderKnowledgeBase() {
  renderKnowledgeControls();
  renderKnowledgeResults();
}

function safeMarkdownLink(value = "", basePath = "") {
  const url = String(value || "").trim();
  if (!url || /^javascript:/i.test(url) || /^data:/i.test(url)) return "";
  if (url.startsWith("#")) return url;
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("..")) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (!basePath) return url;
  try {
    const baseUrl = new URL(basePath, window.location.origin);
    return new URL(url, baseUrl).pathname;
  } catch {
    return "";
  }
}

function markdownInline(value = "", basePath = "") {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
      const safeUrl = safeMarkdownLink(url, basePath);
      if (/^\/emba\/materials\/.*\.md$/i.test(safeUrl)) {
        return `<button class="emba-markdown-link" type="button" data-material-open="${escapeHtml(safeUrl)}" data-material-title="${label}">${label}</button>`;
      }
      return safeUrl ? `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener">${label}</a>` : label;
    });
}

function splitFrontmatter(markdown = "") {
  const source = String(markdown || "");
  if (!source.startsWith("---\n")) return { frontmatter: "", body: source };
  const closeIndex = source.indexOf("\n---\n", 4);
  if (closeIndex === -1) return { frontmatter: "", body: source };
  return {
    frontmatter: source.slice(4, closeIndex).trim(),
    body: source.slice(closeIndex + 5).trimStart()
  };
}

function markdownToHtml(markdown = "", basePath = "") {
  const { body } = splitFrontmatter(markdown);
  const lines = body.split(/\r?\n/);
  const html = [];
  let listOpen = false;
  let orderedListOpen = false;
  let codeOpen = false;
  let paragraph = [];
  let tableRows = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${markdownInline(paragraph.join(" "), basePath)}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (!listOpen) return;
    html.push("</ul>");
    listOpen = false;
  };
  const closeOrderedList = () => {
    if (!orderedListOpen) return;
    html.push("</ol>");
    orderedListOpen = false;
  };
  const tableCells = (line) => String(line || "")
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
  const isTableSeparator = (line) => /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(String(line || "").trim());
  const flushTable = () => {
    if (!tableRows.length) return;
    const rows = tableRows.slice();
    tableRows = [];
    const hasHeader = rows.length > 1 && isTableSeparator(rows[1]);
    const header = hasHeader ? tableCells(rows[0]) : [];
    const bodyRows = (hasHeader ? rows.slice(2) : rows).map(tableCells);
    html.push("<div class=\"emba-markdown-table-wrap\"><table>");
    if (header.length) {
      html.push(`<thead><tr>${header.map((cell) => `<th>${markdownInline(cell, basePath)}</th>`).join("")}</tr></thead>`);
    }
    html.push("<tbody>");
    bodyRows.forEach((cells) => {
      html.push(`<tr>${cells.map((cell) => `<td>${markdownInline(cell, basePath)}</td>`).join("")}</tr>`);
    });
    html.push("</tbody></table></div>");
  };

  lines.forEach((line) => {
    if (line.trim().startsWith("```")) {
      flushParagraph();
      closeList();
      closeOrderedList();
      flushTable();
      if (codeOpen) {
        html.push("</code></pre>");
        codeOpen = false;
      } else {
        html.push("<pre><code>");
        codeOpen = true;
      }
      return;
    }
    if (codeOpen) {
      html.push(escapeHtml(line));
      return;
    }
    if (!line.trim()) {
      flushParagraph();
      closeList();
      closeOrderedList();
      flushTable();
      return;
    }
    if (/^\s*\|.+\|\s*$/.test(line)) {
      flushParagraph();
      closeList();
      closeOrderedList();
      tableRows.push(line);
      return;
    }
    flushTable();
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      closeOrderedList();
      const level = Math.min(heading[1].length + 2, 6);
      html.push(`<h${level}>${markdownInline(heading[2], basePath)}</h${level}>`);
      return;
    }
    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      closeOrderedList();
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${markdownInline(bullet[1], basePath)}</li>`);
      return;
    }
    const numbered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (numbered) {
      flushParagraph();
      closeList();
      if (!orderedListOpen) {
        html.push("<ol>");
        orderedListOpen = true;
      }
      html.push(`<li>${markdownInline(numbered[1], basePath)}</li>`);
      return;
    }
    paragraph.push(line.trim());
  });

  flushParagraph();
  closeList();
  closeOrderedList();
  flushTable();
  if (codeOpen) html.push("</code></pre>");
  return html.join("\n");
}

function renderKnowledgePreview(note, markdown) {
  const preview = $("#embaKnowledgePreview");
  if (!preview) return;
  preview.innerHTML = `
    <div class="emba-knowledge-preview-head">
      <div>
        <span class="emba-month-kicker">${escapeHtml(formatKnowledgeMonth(note.month) || "EMBA note")}</span>
        <h3>${escapeHtml(note.title)}</h3>
        <p>${escapeHtml(note.summary || noteMetaText(note))}</p>
      </div>
      <div class="emba-knowledge-preview-actions">
        ${note.md_file ? `<a class="emba-file-link" href="${escapeHtml(note.md_file)}" target="_blank" rel="noopener">Open MD</a>` : ""}
        ${note.source_file ? `<a class="emba-file-link" href="${escapeHtml(note.source_file)}" target="_blank" rel="noopener">Open source</a>` : ""}
      </div>
    </div>
    <div class="emba-knowledge-preview-meta">
      ${[note.course, formatKnowledgeType(note.type), note.source_type, note.rag_include ? "RAG included" : "RAG excluded"].filter(Boolean).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
    </div>
    <div class="emba-markdown-rendered">${markdownToHtml(markdown, note.md_file)}</div>
  `;
}

async function openKnowledgeNote(noteId) {
  const note = state.knowledge.notes.find((item) => item.id === noteId);
  if (!note || !note.md_file) return;
  state.knowledge.selectedNoteId = note.id;
  renderKnowledgeResults();
  setKnowledgeStatus(`Opening ${note.title}.`);
  try {
    if (!state.knowledge.markdownCache[note.md_file]) {
      const response = await fetch(note.md_file, { cache: "no-store" });
      if (!response.ok) throw new Error(`Could not load Markdown (${response.status})`);
      state.knowledge.markdownCache[note.md_file] = await response.text();
    }
    renderKnowledgePreview(note, state.knowledge.markdownCache[note.md_file]);
    setKnowledgeStatus(`${filteredKnowledgeNotes().length} note${filteredKnowledgeNotes().length === 1 ? "" : "s"} found.`);
  } catch (error) {
    const preview = $("#embaKnowledgePreview");
    if (preview) preview.innerHTML = `<p class="emba-empty-copy">${escapeHtml(error.message)}</p>`;
    setKnowledgeStatus("Could not load Markdown preview.", "warn");
  }
}

async function loadKnowledgeBase() {
  if (state.knowledge.loading || state.knowledge.loaded) return;
  state.knowledge.loading = true;
  if (normalize(state.knowledge.filters.query)) setKnowledgeStatus("Loading knowledge base.");
  try {
    const response = await fetch(EMBA_KNOWLEDGE_INDEX, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load knowledge index (${response.status})`);
    const payload = await response.json();
    state.knowledge.notes = asArray(payload.notes).map(normalizeKnowledgeNote).filter((note) => note.md_file);
    renderKnowledgeBase();
    const batchSize = 6;
    for (let index = 0; index < state.knowledge.notes.length; index += batchSize) {
      const batch = state.knowledge.notes.slice(index, index + batchSize);
      await Promise.all(batch.map(async (note) => {
        try {
          const response = await fetch(note.md_file, { cache: "no-store" });
          if (!response.ok) return;
          const markdown = await response.text();
          state.knowledge.markdownCache[note.md_file] = markdown;
          note.search_body = splitFrontmatter(markdown).body;
        } catch {
          // Metadata search remains available when one Markdown file cannot load.
        }
      }));
    }
    state.knowledge.loaded = true;
    renderKnowledgeBase();
  } catch (error) {
    setKnowledgeStatus(error.message, "warn");
  } finally {
    state.knowledge.loading = false;
  }
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
  const months = timelineMonths();
  return months.find((month) => monthId(month) === state.selectedMonthId) || months[0] || null;
}

function renderTimeline() {
  const timeline = $("#embaTimeline");
  if (!timeline) return;
  const months = timelineMonths();
  if (!months.length) {
    timeline.innerHTML = `<div class="emba-empty-state">No EMBA month has content yet.</div>`;
    state.selectedMonthId = "";
    renderMonthDetail(null);
    return;
  }
  if (!months.some((month) => monthId(month) === state.selectedMonthId)) {
    state.selectedMonthId = monthId(months[0]);
  }

  timeline.innerHTML = months.map((month) => {
    const id = monthId(month);
    const isActive = state.selectedMonthId === id;
    const monthName = formatMonth(month.month, { month: "short" });
    const year = formatMonth(month.month, { year: "numeric" });
    return `
      <button class="emba-timeline-item${isActive ? " active" : ""}" type="button" data-month-id="${escapeHtml(id)}" aria-pressed="${isActive}"${isActive ? ' aria-current="date"' : ""} aria-label="${escapeHtml(formatMonth(month.month))}">
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

function materialsForSection(month, section = "materials") {
  const materials = asArray(month?.materials);
  if (section === "preparation") return materials.filter((item) => PREPARATION_MATERIAL_TYPES.has(item.type));
  if (section === "vocabulary") return materials.filter((item) => item.type === "vocabulary");
  return materials.filter((item) => !PREPARATION_MATERIAL_TYPES.has(item.type) && item.type !== "vocabulary");
}

function renderMaterials(month, section = "materials") {
  const materials = isEditMode() ? asArray(month?.materials) : materialsForSection(month, section);
  if (!isEditMode()) {
    if (state.materialReader?.file) return renderMaterialReader();
    return materials.length ? `
      <ul class="emba-read-list emba-material-read-list">
        ${materials.map((item) => `
          <li class="emba-material-read-item">
            ${isReadableMaterial(item.file) ? `<button class="emba-material-open" type="button" data-material-open="${escapeHtml(item.file)}" data-material-title="${escapeHtml(item.title || "Material")}" data-material-notes="${escapeHtml(item.notes || "")}">` : `<div class="emba-read-copy">`}
              <div class="emba-read-copy">
              <span class="emba-read-title">${escapeHtml(item.title || "Material")}</span>
              ${item.notes ? `<span class="emba-read-note">${escapeHtml(item.notes)}</span>` : ""}
              </div>
              ${isReadableMaterial(item.file) ? `<span class="emba-read-action">阅读介绍 →</span>` : ""}
            ${isReadableMaterial(item.file) ? `</button>` : `</div>`}
            ${item.file && !isReadableMaterial(item.file) ? `<a class="emba-file-link" href="${escapeHtml(item.file)}" target="_blank" rel="noopener">Open file</a>` : ""}
          </li>
        `).join("")}
      </ul>
    ` : `<p class="emba-empty-copy">No material yet.</p>`;
  }

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

function renderPreparation(month) {
  if (isEditMode()) return `<p class="emba-empty-copy">课前准备的资料分类会在阅读模式中显示；编辑模式下请在“资料”中管理文件。</p>`;
  return renderMaterials(month, "preparation");
}

function renderVocabulary(month) {
  return renderMaterials(month, "vocabulary");
}

function isReadableMaterial(file = "") {
  return /^\/emba\/materials\/.*\.md$/i.test(String(file || ""));
}

function renderMaterialReader() {
  const reader = state.materialReader;
  if (!reader) return "";
  const body = reader.loading
    ? `<p class="emba-empty-copy">正在打开课程介绍…</p>`
    : reader.error
      ? `<p class="emba-empty-copy">无法打开这份介绍：${escapeHtml(reader.error)}</p>`
      : `<div class="emba-markdown-rendered">${markdownToHtml(reader.markdown || "", reader.file)}</div>`;
  return `
    <article class="emba-material-reader">
      <div class="emba-material-reader-head">
        <div>
          <span class="emba-month-kicker">课程介绍</span>
          <h3>${escapeHtml(reader.title || "Material")}</h3>
          ${reader.notes ? `<p>${escapeHtml(reader.notes)}</p>` : ""}
        </div>
        <button class="emba-file-link" type="button" data-material-back>← 返回资料</button>
      </div>
      ${body}
    </article>
  `;
}

async function openMaterialReader(file, title = "Material", notes = "") {
  if (!isReadableMaterial(file)) return;
  state.materialReader = { file, title, notes, markdown: "", loading: true, error: "" };
  renderMonthDetail(selectedMonth());
  scrollToMonthTarget("[data-block-panel]");
  try {
    const response = await fetch(file, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const markdown = await response.text();
    if (state.materialReader?.file !== file) return;
    state.materialReader = { file, title, notes, markdown, loading: false, error: "" };
  } catch (error) {
    if (state.materialReader?.file !== file) return;
    state.materialReader = { file, title, notes, markdown: "", loading: false, error: error?.message || "Unknown error" };
  }
  renderMonthDetail(selectedMonth());
  scrollToMonthTarget("[data-block-panel]");
}

function renderReflection(month) {
  const reflection = typeof month?.reflection === "string"
    ? month.reflection
    : asArray(month?.reflection).map((item) => item.body || item.title || item).filter(Boolean).join("\n\n");
  const thinkingItems = normalizeThinkingQuestions(month?.thinkingQuestions);
  if (thinkingItems.length) {
    return `
      <div class="emba-reflection-workspace" data-reflection-workspace>
        <section class="emba-reflection-section" data-reflection-section="thinking" aria-label="个人反思">
          <div class="emba-reflection-section-head">
            <h3>个人反思</h3>
            <span>${thinkingItems.length} 条 · 原文、当时上下文、Codex 补齐</span>
          </div>
          ${renderThinkingQuestions(month)}
        </section>
      </div>
    `;
  }

  const reflectionContent = isEditMode()
    ? `<textarea class="emba-reflection-editor" data-reflection-editor placeholder="Write reflection for this month...">${escapeHtml(reflection)}</textarea>`
    : reflection.trim()
      ? `<div class="emba-reflection-read">${escapeHtml(reflection)}</div>`
      : `<p class="emba-empty-copy">No reflection yet.</p>`;
  return `
    <div class="emba-reflection-workspace" data-reflection-workspace>
      <section class="emba-reflection-section" data-reflection-section="summary" aria-label="综合反思">
        <div class="emba-reflection-section-head">
          <h3>本月综合反思</h3>
        </div>
        ${reflectionContent}
      </section>
    </div>
  `;
}

function thinkingConfidenceLabel(value = "") {
  if (value === "high") return "原文清晰";
  if (value === "medium") return "语义可辨";
  if (value === "unclear") return "待核原图";
  return "";
}

function textWithBreaks(value = "") {
  return escapeHtml(String(value || "")).replace(/\r?\n/g, "<br>");
}

function renderThinkingReviewRow(label, value, className = "") {
  if (!hasTextContent(value)) return "";
  return `
    <div class="emba-thinking-review-row${className ? ` ${className}` : ""}">
      <dt>${escapeHtml(label)}</dt>
      <dd>${textWithBreaks(value)}</dd>
    </div>
  `;
}

function renderStructuredThinkingItem(item, index) {
  const itemId = item.id || `T${String(index + 1).padStart(2, "0")}`;
  const confidence = thinkingConfidenceLabel(item.confidence);
  const meta = [item.kind, item.date, confidence].filter(Boolean).join(" · ");
  const sourceMeta = [item.date, item.source, item.position].filter(Boolean).join(" · ");
  return `
    <details class="emba-thinking-review-card" data-thinking-item="${escapeHtml(itemId)}">
      <summary class="emba-thinking-review-summary">
        <span class="emba-thinking-review-id">${escapeHtml(itemId)}</span>
        <span class="emba-thinking-review-heading">
          <span class="emba-thinking-review-title">${escapeHtml(item.title)}</span>
          ${meta ? `<span class="emba-thinking-review-meta">${escapeHtml(meta)}</span>` : ""}
        </span>
      </summary>
      <div class="emba-thinking-review-body">
        <div class="emba-thinking-evidence">
          <span class="emba-thinking-label">原文</span>
          <blockquote>${textWithBreaks(item.original || item.title)}</blockquote>
          ${sourceMeta || item.image ? `
            <div class="emba-thinking-source">
              ${sourceMeta ? `<span>${escapeHtml(sourceMeta)}</span>` : ""}
              ${item.image ? `<a href="${escapeHtml(item.image)}" target="_blank" rel="noopener">查看原图</a>` : ""}
            </div>
          ` : ""}
        </div>
        <dl class="emba-thinking-review-details">
          ${renderThinkingReviewRow("当时上下文", item.context)}
          ${renderThinkingReviewRow("Codex 补齐", item.reconstruction, "is-reconstruction")}
        </dl>
      </div>
    </details>
  `;
}

function renderThinkingQuestions(month) {
  const items = normalizeThinkingQuestions(month?.thinkingQuestions);
  const hasStructuredItems = items.some((item) => typeof item === "object");
  if (hasStructuredItems) {
    return `
      <div class="emba-thinking-review-list">
        ${items.map((item, index) => typeof item === "object"
          ? renderStructuredThinkingItem(item, index)
          : `<div class="emba-thinking-legacy-item">${escapeHtml(item)}</div>`).join("")}
      </div>
    `;
  }

  if (!isEditMode()) {
    return items.length
      ? `
        <ol class="emba-thinking-list">
          ${items.map((item) => `<li>${escapeHtml(thinkingItemText(item))}</li>`).join("")}
        </ol>
      `
      : `<p class="emba-empty-copy">No thoughts or questions yet.</p>`;
  }

  return `
    <textarea class="emba-thinking-editor" data-thinking-editor placeholder="One thought or question per line...">${escapeHtml(items.map(thinkingItemText).join("\n"))}</textarea>
  `;
}

function timelineMarkdownToDisplayMarkdown(markdown = "") {
  const source = normalizeMarkdown(markdown).trim();
  if (!source) return "";
  if (/^#{1,6}\s+/m.test(source)) return source;
  let titleSeen = false;
  return source.split(/\r?\n/).map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    if (!titleSeen) {
      titleSeen = true;
      return `# ${trimmed}`;
    }
    if (/^IMG_\d{4}｜/.test(trimmed)) return `## ${trimmed}`;
    if (/^\[[^\]]+\]\s+/.test(trimmed)) return `### ${trimmed}`;
    return line;
  }).join("\n");
}

function markdownSectionCount(markdown = "") {
  const headings = normalizeMarkdown(markdown).match(/^#{1,6}\s+/gm);
  if (headings?.length) return headings.length;
  const imageSections = normalizeMarkdown(markdown).match(/^IMG_\d{4}｜/gm);
  return imageSections?.length || 1;
}

function noteStatsText(markdown = "") {
  const chars = compactTextLength(markdown);
  const sections = markdownSectionCount(markdown);
  return `${sections} section${sections === 1 ? "" : "s"} · ${chars.toLocaleString("en")} chars`;
}

function noteSourceLinks(month) {
  return asArray(month?.materials)
    .map(normalizeMaterial)
    .filter((item) => item.file && (item.file.endsWith(".md") || /note|analysis|index/i.test(`${item.type} ${item.title}`)))
    .slice(0, 4);
}

function sourceLinkLabel(item, index) {
  const title = normalize(item.title);
  if (title.includes("monthly") || title.includes("index")) return "Open index";
  if (title.includes("analysis")) return "Open analysis";
  if (title.includes("note")) return "Open notes";
  return index === 0 ? "Open source" : `Open source ${index + 1}`;
}

function renderMarkdown(month) {
  const markdown = normalizeMarkdown(month?.markdown || month?.md || month?.searchNotes);
  if (!isEditMode()) {
    const displayMarkdown = timelineMarkdownToDisplayMarkdown(markdown);
    const sources = noteSourceLinks(month);
    return displayMarkdown.trim()
      ? `
        <div class="emba-note-reader">
          <div class="emba-note-reader-head">
            <div>
              <span class="emba-note-reader-kicker">Structured note</span>
              <span class="emba-note-reader-meta">${escapeHtml(noteStatsText(displayMarkdown))}</span>
            </div>
            ${sources.length ? `
              <div class="emba-note-source-actions">
                ${sources.map((item, index) => `<a class="emba-file-link" href="${escapeHtml(item.file)}" target="_blank" rel="noopener">${escapeHtml(sourceLinkLabel(item, index))}</a>`).join("")}
              </div>
            ` : ""}
          </div>
          <div class="emba-markdown-read emba-markdown-rendered">${markdownToHtml(displayMarkdown)}</div>
        </div>
      `
      : `<p class="emba-empty-copy">No class notes yet.</p>`;
  }

  return `
    <textarea class="emba-markdown-editor" data-markdown-editor placeholder="Write class notes for this month...">${escapeHtml(markdown)}</textarea>
  `;
}

function memoryInitials(monthKey) {
  const date = parseMonth(monthKey);
  if (!date) return "EMBA";
  return date.toLocaleDateString("en", { timeZone: "UTC", month: "short" }).toUpperCase();
}

function renderMemoryMoment(month) {
  const memories = asArray(month?.memoryMoment)
    .map((item, index) => ({ ...normalizeMemory(item, month?.month), originalIndex: index }))
    .filter((item) => item.image);
  return `
    <div class="emba-memory-gallery">
      ${isEditMode() ? `
        <label class="emba-photo-upload">
          <input name="image" type="file" accept="image/*" multiple />
          <span class="emba-photo-placeholder"><span class="emba-photo-initial">${escapeHtml(memoryInitials(month?.month))}</span><span>Upload photos</span></span>
        </label>
      ` : ""}
      ${memories.length ? `
        <div class="emba-photo-grid">
          ${memories.map((item) => `
            <article class="emba-photo-card has-photo">
              <button class="emba-photo-preview" type="button" data-memory-preview="${item.originalIndex}" aria-label="Open photo preview">
                <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title || formatMonth(month?.month))}" loading="lazy" />
              </button>
              ${isEditMode() ? `<button class="emba-photo-remove" type="button" data-memory-delete="${item.originalIndex}" aria-label="Remove photo">×</button>` : ""}
            </article>
          `).join("")}
        </div>
      ` : `<p class="emba-empty-copy">No memory photos yet.</p>`}
    </div>
  `;
}

function blockSummary(id, month) {
  if (id === "memory") {
    const count = asArray(month?.memoryMoment).filter((item) => normalizeMemory(item, month?.month).image).length;
    return count ? `${count} photo${count === 1 ? "" : "s"}` : "No photos yet";
  }
  if (id === "reflection") {
    const thinkingCount = normalizeThinkingQuestions(month?.thinkingQuestions).length;
    if (thinkingCount) return `${thinkingCount} 条个人反思`;
    return hasTextContent(month?.reflection) ? "综合反思" : "暂无个人思考";
  }
  if (id === "markdown") {
    return hasTextContent(month?.markdown) ? "Notes saved" : "No class notes yet";
  }
  if (id === "material") {
    const count = materialsForSection(month, "materials").filter(materialHasContent).length;
    return count ? `${count} material${count === 1 ? "" : "s"}` : "No materials yet";
  }
  if (id === "preparation") {
    const count = materialsForSection(month, "preparation").filter(materialHasContent).length;
    return count ? `${count} 个学习入口` : "暂无课前准备";
  }
  if (id === "vocabulary") {
    const count = materialsForSection(month, "vocabulary").filter(materialHasContent).length;
    return count ? "30 个术语 · IPA 音标" : "暂无专业词汇";
  }
  return "";
}

function renderBlockContent(id, month) {
  if (id === "memory") return renderMemoryMoment(month);
  if (id === "reflection") return renderReflection(month);
  if (id === "markdown") return renderMarkdown(month);
  if (id === "material") return renderMaterials(month);
  if (id === "preparation") return renderPreparation(month);
  if (id === "vocabulary") return renderVocabulary(month);
  return "";
}

function blockTemplate(id, title, month) {
  const isOpen = state.openBlockId === id;
  const summary = blockSummary(id, month);
  return `
    <article class="emba-content-block${isOpen ? " open" : ""}" data-block-id="${escapeHtml(id)}" data-block-card="${escapeHtml(id)}">
      <button class="emba-block-toggle" type="button" aria-expanded="${isOpen}" data-block-toggle="${escapeHtml(id)}">
        <span class="emba-block-title">${escapeHtml(title)}</span>
        <span class="emba-block-meta">${escapeHtml(summary)}</span>
      </button>
    </article>
  `;
}

function renderOpenBlockPanel(month) {
  if (!state.openBlockId) return "";
  const content = renderBlockContent(state.openBlockId, month);
  if (!content) return "";
  return `
    <article class="emba-block-panel" data-block-panel="${escapeHtml(state.openBlockId)}">
      <div class="emba-block-panel-nav">
        <button class="emba-panel-back" type="button" data-block-close>← 返回课程入口</button>
      </div>
      <div class="emba-block-body">${content}</div>
    </article>
  `;
}

function scrollToMonthTarget(selector) {
  requestAnimationFrame(() => {
    document.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function renderMonthDetail(month) {
  const detail = $("#embaMonthDetail");
  if (!detail) return;
  detail.dataset.mode = isEditMode() ? "edit" : "read";
  if (!month) {
    detail.innerHTML = "";
    return;
  }
  detail.innerHTML = `
    <div class="emba-month-kicker">${escapeHtml(formatMonth(month.month))}</div>
    ${renderOpenBlockPanel(month)}
    <div class="emba-block-grid">
      ${materialsForSection(month, "preparation").some(materialHasContent) ? blockTemplate("preparation", "课前准备", month) : ""}
      ${materialsForSection(month, "vocabulary").some(materialHasContent) ? blockTemplate("vocabulary", "专业词汇", month) : ""}
      ${blockTemplate("reflection", "Reflection（我的思考）", month)}
      ${blockTemplate("memory", "照片", month)}
      ${blockTemplate("material", "资料", month)}
      ${blockTemplate("markdown", "课堂笔记（完全内容整合版）", month)}
    </div>
  `;
}

function setActiveMonth(monthIdValue) {
  if (!monthIdValue || state.selectedMonthId === monthIdValue) return;
  state.selectedMonthId = monthIdValue;
  state.openBlockId = "";
  state.materialReader = null;
  document.querySelectorAll("[data-month-id]").forEach((button) => {
    const isActive = button.dataset.monthId === state.selectedMonthId;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    if (isActive) button.setAttribute("aria-current", "date");
    else button.removeAttribute("aria-current");
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
  if (!granted) state.editMode = false;
  if (gate) gate.hidden = granted;
  if (app) app.hidden = !granted;
  if (lock) lock.hidden = !granted;
  updateEditModeControl();
  if (granted && !state.libraryLoaded) loadLibrary();
  if (granted && !state.knowledge.loaded) loadKnowledgeBase();
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
    if (state.knowledge.notes.length) renderKnowledgeBase();
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
    setEditMode(false);
    await fetch("/emba/logout", { method: "POST" }).catch(() => null);
    renderAccessState();
    $("#embaPassword")?.focus();
  });

  $("#embaEditToggle")?.addEventListener("click", () => {
    if (!hasEmbaAccess()) return;
    setEditMode(!isEditMode());
  });

  renderAccessState();
}

$("#embaTimeline")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-month-id]");
  if (!button) return;
  setActiveMonth(button.dataset.monthId || "");
});

$("#embaMonthDetail")?.addEventListener("click", (event) => {
  const blockClose = event.target.closest("[data-block-close]");
  if (blockClose) {
    state.openBlockId = "";
    state.materialReader = null;
    renderMonthDetail(selectedMonth());
    scrollToMonthTarget("#embaMonthDetail");
    return;
  }

  const materialBack = event.target.closest("[data-material-back]");
  if (materialBack) {
    state.materialReader = null;
    renderMonthDetail(selectedMonth());
    scrollToMonthTarget("[data-block-panel]");
    return;
  }

  const materialOpen = event.target.closest("[data-material-open]");
  if (materialOpen) {
    event.preventDefault();
    openMaterialReader(
      materialOpen.dataset.materialOpen || "",
      materialOpen.dataset.materialTitle || materialOpen.textContent?.trim() || "Material",
      materialOpen.dataset.materialNotes || ""
    );
    return;
  }

  const memoryDelete = event.target.closest("[data-memory-delete]");
  if (memoryDelete) {
    if (!isEditMode()) return;
    const month = editableMonth();
    month.memoryMoment.splice(Number(memoryDelete.dataset.memoryDelete), 1);
    bumpRevision(month, "memoryRevision");
    saveLibrary();
    renderMonthDetail(selectedMonth());
    return;
  }

  const materialDelete = event.target.closest("[data-material-delete]");
  if (materialDelete) {
    if (!isEditMode()) return;
    const month = editableMonth();
    month.materials.splice(Number(materialDelete.dataset.materialDelete), 1);
    bumpRevision(month, "materialsRevision");
    saveLibrary();
    renderMonthDetail(selectedMonth());
    return;
  }

  const memoryPreview = event.target.closest("[data-memory-preview]");
  if (memoryPreview) {
    const month = selectedMonth();
    const item = normalizeMemory(asArray(month?.memoryMoment)[Number(memoryPreview.dataset.memoryPreview)], month?.month);
    if (item?.image) openMemoryLightbox(item.image, item.title || formatMonth(month?.month));
    return;
  }

  const button = event.target.closest("[data-block-toggle]");
  if (!button) return;
  const blockId = button.dataset.blockToggle || "";
  state.openBlockId = blockId;
  state.materialReader = null;
  renderMonthDetail(selectedMonth());
  scrollToMonthTarget("[data-block-panel]");
});

$("#embaMonthDetail")?.addEventListener("change", async (event) => {
  const target = event.target;
  if (!target.matches('.emba-photo-upload input[name="image"]')) return;
  if (!isEditMode()) {
    target.value = "";
    return;
  }
  const files = [...(target.files || [])].filter((file) => file.type.startsWith("image/"));
  if (!files.length) return;
  const month = editableMonth();
  let photosAdded = 0;
  for (const file of files) {
    const uploaded = await uploadEmbaFile(file, month.month, "memory");
    const image = uploaded?.url || await imageFileToDataUrl(file);
    if (!image) continue;
    month.memoryMoment.push({
      title: "Memory",
      image,
      caption: "",
      month: month.month
    });
    photosAdded += 1;
  }
  if (photosAdded) bumpRevision(month, "memoryRevision");
  saveLibrary();
  renderMonthDetail(selectedMonth());
});

$("#embaMonthDetail")?.addEventListener("input", (event) => {
  const target = event.target;
  if (!isEditMode()) return;

  if (target.matches("[data-reflection-editor]")) {
    const month = editableMonth();
    month.reflection = target.value;
    bumpInputRevision(target, month, "reflectionRevision");
    saveLibrary();
    return;
  }

  if (target.matches("[data-thinking-editor]")) {
    const month = editableMonth();
    month.thinkingQuestions = target.value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    bumpInputRevision(target, month, "reflectionRevision");
    saveLibrary();
    return;
  }

  if (target.matches("[data-markdown-editor]")) {
    const month = editableMonth();
    month.markdown = target.value;
    bumpInputRevision(target, month, "markdownRevision");
    saveLibrary();
    return;
  }

  if (target.matches("[data-material-field]")) {
    const month = editableMonth();
    const item = month.materials[Number(target.dataset.index)];
    if (!item) return;
    item[target.dataset.materialField] = target.value;
    bumpInputRevision(target, month, "materialsRevision");
    saveLibrary();
  }
});

$("#embaMonthDetail")?.addEventListener("submit", async (event) => {
  const form = event.target;
  if (!form.matches("[data-material-add]")) return;
  event.preventDefault();
  if (!isEditMode()) return;
  const month = editableMonth();

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
    bumpRevision(month, "materialsRevision");
    saveLibrary();
    form.reset();
    renderMonthDetail(selectedMonth());
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("[data-lightbox-close]")) return;
  closeMemoryLightbox();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  closeMemoryLightbox();
});

function initKnowledgeInteractions() {
  $("#embaKnowledgeSearch")?.addEventListener("input", (event) => {
    state.knowledge.filters.query = event.target.value;
    renderKnowledgeResults();
  });

  $("#embaKnowledgeResults")?.addEventListener("click", (event) => {
    const monthButton = event.target.closest("[data-knowledge-month]");
    if (monthButton) {
      setActiveMonth(monthButton.dataset.knowledgeMonth || "");
      $("#embaMonthDetail")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const noteButton = event.target.closest("[data-knowledge-note]");
    if (!noteButton) return;
    openKnowledgeNote(noteButton.dataset.knowledgeNote || "");
  });
}

initKnowledgeInteractions();
initAccessGate();
