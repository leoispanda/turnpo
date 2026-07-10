import assert from "node:assert/strict";
import fs from "node:fs";

const { normalizeLibraryPayload } = await import("../functions/api/emba/_utils.js");

const embaJs = fs.readFileSync(new URL("../emba/emba.js", import.meta.url), "utf8");
const embaCss = fs.readFileSync(new URL("../emba/emba.css", import.meta.url), "utf8");
const embaHtml = fs.readFileSync(new URL("../emba/index.html", import.meta.url), "utf8");
const turnpoVersion = JSON.parse(fs.readFileSync(new URL("../version.json", import.meta.url), "utf8")).version;
const embaReadme = fs.readFileSync(new URL("../emba/README.md", import.meta.url), "utf8");
const embaMaterials = fs.readFileSync(new URL("../emba/materials.json", import.meta.url), "utf8");
const classmateHtml = fs.readFileSync(new URL("../emba/linkedin-class-connect.html", import.meta.url), "utf8");
const classmateJs = fs.readFileSync(new URL("../emba/linkedin-class-connect.js", import.meta.url), "utf8");
const embaFunction = fs.readFileSync(new URL("../functions/emba/[[path]].js", import.meta.url), "utf8");
const embaApiUtils = fs.readFileSync(new URL("../functions/api/emba/_utils.js", import.meta.url), "utf8");
const embaLibraryApi = fs.readFileSync(new URL("../functions/api/emba/library.js", import.meta.url), "utf8");
const embaUploadApi = fs.readFileSync(new URL("../functions/api/emba/upload.js", import.meta.url), "utf8");
const embaFileApi = fs.readFileSync(new URL("../functions/api/emba/file/[[key]].js", import.meta.url), "utf8");
const embaKnowledgeIndex = fs.readFileSync(new URL("../emba/content/knowledge-index.json", import.meta.url), "utf8");
const embaMasterIndex = fs.readFileSync(new URL("../emba/content/00_EMBA_Master_Index.md", import.meta.url), "utf8");
const embaJuneIndex = fs.readFileSync(new URL("../emba/content/2026/06_June/2026-06_EMBA_Preparation_Index.md", import.meta.url), "utf8");
const embaJuneAnalysis = fs.readFileSync(new URL("../emba/content/2026/06_June/converted-md/2026-06-emba-preparation-documents-analysis.md", import.meta.url), "utf8");
const embaJulyIndex = fs.readFileSync(new URL("../emba/content/2026/07_July/2026-07_EMBA_Learning_Index.md", import.meta.url), "utf8");
const embaConvertedNote = fs.readFileSync(new URL("../emba/content/2026/07_July/converted-md/2026-07-01-leadership-learning-handwritten-notes.md", import.meta.url), "utf8");
const embaLeoThinkingJourney = fs.readFileSync(new URL("../emba/content/2026/07_July/reflections/2026-07-leo-thinking-journey.md", import.meta.url), "utf8");
const embaPersonalMarkerExtract = fs.readFileSync(new URL("../emba/content/2026/07_July/reflections/2026-07-personal-marker-original-extract.md", import.meta.url), "utf8");
const embaLeadershipTheme = fs.readFileSync(new URL("../emba/content/themes/leadership.md", import.meta.url), "utf8");
const embaStrategyTheme = fs.readFileSync(new URL("../emba/content/themes/strategy.md", import.meta.url), "utf8");

assert.ok(embaJs.includes('const EMBA_LIBRARY_API = "/api/emba/library";'));
assert.ok(embaJs.includes('const EMBA_UPLOAD_API = "/api/emba/upload";'));
assert.ok(embaJs.includes('const EMBA_KNOWLEDGE_INDEX = "/emba/content/knowledge-index.json";'));
assert.ok(embaJs.includes('const DEFAULT_START_MONTH = "2026-06";'));
assert.ok(embaJs.includes("uploadEmbaFile(file, month.month, \"memory\")"));
assert.ok(embaJs.includes("uploadEmbaFile(file, month.month, \"material\")"));
assert.ok(embaJs.includes("libraryForCloud"));
assert.ok(embaJs.includes("loadKnowledgeBase"));
assert.ok(embaJs.includes("renderKnowledgeResults"));
assert.ok(embaJs.includes("openKnowledgeNote"));
assert.ok(embaJs.includes("markdownToHtml"));
assert.ok(embaJs.includes("orderedListOpen"));
assert.ok(embaJs.includes("isTableSeparator"));
assert.ok(embaJs.includes("[data-knowledge-month]"));
assert.ok(embaJs.includes("emba-memory-gallery"));
assert.ok(embaJs.includes('input name="image" type="file" accept="image/*" multiple'));
assert.ok(embaJs.includes("function monthHasContent"));
assert.ok(embaJs.includes(".filter(monthHasContent)"));
assert.ok(embaJs.includes("No EMBA month has content yet."));
assert.ok(embaJs.includes("function mergeMonthData"));
assert.ok(embaJs.includes("function mergeThinkingLists"));
assert.ok(embaJs.includes("function richerText"));
assert.ok(embaJs.includes('$("#embaTimeline")?.addEventListener("click"'));
assert.ok(embaJs.includes('aria-current="date"'));
assert.ok(!embaJs.includes("handleTimelineHover"));
assert.ok(!embaJs.includes('addEventListener("pointerover"'));
assert.ok(!embaJs.includes('addEventListener("mouseover"'));
assert.ok(!embaJs.includes('addEventListener("mousemove"'));
assert.ok(!embaJs.includes('addEventListener("focusin"'));
assert.ok(embaJs.includes("editMode: false"));
assert.ok(embaJs.includes("function setEditMode"));
assert.ok(embaJs.includes("function openMemoryLightbox"));
assert.ok(embaJs.includes("function renderMarkdown"));
assert.ok(embaJs.includes("timelineMarkdownToDisplayMarkdown"));
assert.ok(embaJs.includes("noteStatsText"));
assert.ok(embaJs.includes("noteSourceLinks"));
assert.ok(embaJs.includes("Structured note"));
assert.ok(embaJs.includes("function blockSummary"));
assert.ok(embaJs.includes("function renderBlockContent"));
assert.ok(embaJs.includes("function renderOpenBlockPanel"));
assert.ok(embaJs.includes('data-block-card="${escapeHtml(id)}"'));
assert.ok(embaJs.includes('data-block-panel="${escapeHtml(state.openBlockId)}"'));
assert.ok(embaJs.includes('blockTemplate("reflection", "Reflection（我的思考）", month)'));
assert.ok(embaJs.includes('blockTemplate("memory", "照片", month)'));
assert.ok(embaJs.includes('blockTemplate("material", "资料", month)'));
assert.ok(embaJs.includes('blockTemplate("markdown", "课堂笔记（完全内容整合版）", month)'));
assert.ok(!embaJs.includes('blockTemplate("thinking", "思考与问题", month)'));
assert.ok(!embaJs.includes('blockTemplate("followup", "待补充与验证", month)'));
assert.ok(embaJs.includes("function renderThinkingQuestions"));
assert.ok(embaJs.includes("[data-thinking-editor]"));
assert.ok(embaJs.includes("function renderStructuredThinkingItem"));
assert.ok(embaJs.includes("data-thinking-item-field"));
assert.ok(embaJs.includes('data-reflection-workspace'));
assert.ok(embaJs.includes('data-reflection-section="thinking"'));
assert.ok(embaJs.includes('data-reflection-section="followup"'));
assert.ok(embaJs.includes("我的反思、问题与思考"));
assert.ok(embaJs.includes("Codex 补齐后的完整论述"));
assert.ok(embaJs.includes('data-reflection-view="${item.id}"'));
assert.ok(embaJs.includes('reflectionView: "review"'));
assert.ok(embaJs.includes('parts.push(`${thinkingCount} 条逐条反思`)'));
assert.ok(embaJs.includes("Review 记录"));
assert.ok(embaJs.includes("Self-learning reflection"));
assert.ok(!embaJs.includes("items.slice(0, 12)"));
assert.ok(embaJs.includes("function renderFollowUpPoints"));
assert.ok(embaJs.includes("[data-follow-up-editor]"));
assert.ok(embaJs.includes("month.followUpPoints = target.value"));
assert.ok(embaJs.includes("[data-markdown-editor]"));
assert.ok(embaJs.includes("Write class notes for this month..."));
assert.ok(embaJs.includes("No class notes yet."));
assert.ok(embaJs.includes("month.markdown = target.value"));
assert.ok(embaJs.includes('data-memory-preview="${item.originalIndex}"'));
assert.ok(embaJs.includes("if (!isEditMode()) return;"));
assert.ok(embaJs.includes('detail.dataset.mode = isEditMode() ? "edit" : "read";'));
assert.ok(!embaJs.includes("Photo title"));
assert.ok(!embaJs.includes('placeholder="Caption"'));
assert.ok(embaCss.includes(".emba-markdown-table-wrap"));
assert.ok(embaCss.includes(".emba-markdown-rendered ol"));
assert.ok(embaCss.includes(".emba-note-reader"));
assert.ok(embaCss.includes(".emba-note-source-actions"));
assert.ok(embaCss.includes(".emba-thinking-list"));
assert.ok(embaCss.includes(".emba-follow-up-list"));
assert.ok(embaCss.includes(".emba-thinking-review-card"));
assert.ok(embaCss.includes("grid-template-columns: repeat(2, minmax(0, 1fr));"));
assert.ok(embaCss.includes(".emba-reflection-workspace"));
assert.ok(embaCss.includes(".emba-reflection-section-head"));
assert.ok(embaCss.includes(".emba-reflection-view-tabs"));
assert.ok(embaCss.includes(".emba-reflection-view-tab.active"));
assert.ok(embaCss.includes(".emba-thinking-note-editor"));
assert.ok(embaCss.includes(".emba-timeline-item.active::before"));
assert.ok(embaCss.includes(".emba-timeline-item:not(.active):hover::before"));
assert.ok(embaHtml.includes('id="embaSyncStatus"'));
assert.ok(embaHtml.includes('id="embaEditToggle"'));
assert.ok(embaHtml.includes('id="embaLightbox"'));
assert.ok(embaHtml.includes("data-lightbox-close"));
assert.ok(embaHtml.includes('id="embaKnowledge"'));
assert.ok(embaHtml.includes('id="embaKnowledgeSearch"'));
assert.ok(embaHtml.includes('placeholder="Search EMBA notes"'));
assert.ok(embaHtml.includes('id="embaKnowledgeResults"'));
assert.ok(embaHtml.includes(`/styles.css?v=${turnpoVersion}`));
assert.ok(embaHtml.includes(`/emba/emba.css?v=${turnpoVersion}`));
assert.ok(embaHtml.includes(`/emba/emba.js?v=${turnpoVersion}`));
assert.ok(embaHtml.includes('id="embaKnowledgeStatus" aria-live="polite" hidden'));
assert.ok(embaHtml.includes('id="embaKnowledgeResults" aria-label="Knowledge base search results" hidden'));
assert.ok(!embaHtml.includes('id="embaKnowledgePreview"'));
assert.ok(!embaHtml.includes("Search monthly indexes, converted Markdown mirrors"));
assert.ok(!embaHtml.includes("/emba/content/00_EMBA_Master_Index.md"));
assert.ok(!embaHtml.includes('id="embaKnowledgeYear"'));
assert.ok(!embaHtml.includes('id="embaKnowledgeMonth"'));
assert.ok(!embaHtml.includes('id="embaKnowledgeCourse"'));
assert.ok(!embaHtml.includes('id="embaKnowledgeType"'));
assert.ok(!embaHtml.includes('id="embaKnowledgeTag"'));
assert.ok(!embaHtml.includes('id="embaKnowledgeKeyword"'));
assert.ok(!embaHtml.includes('id="embaKnowledgeClear"'));
assert.ok(!embaJs.includes("setKnowledgeSelect"));

assert.ok(classmateHtml.includes('src="/emba/linkedin-class-connect.js"'));
assert.equal(classmateHtml.match(/<script(?![^>]*\bsrc=)/g)?.length || 0, 0);
assert.ok(classmateJs.includes("function guardEmbaTool"));
assert.ok(classmateJs.includes("const people = ["));
assert.ok(classmateJs.includes("renderRows();"));

assert.ok(embaFunction.includes('accessCookie(token, path = "/")'));
assert.ok(embaFunction.includes('clearAccessCookie(path = "/")'));
assert.ok(embaFunction.includes("appendClearCookies"));

assert.ok(embaApiUtils.includes("turnpo_emba_access"));
assert.ok(embaApiUtils.includes("validateSameOriginRequest"));
assert.ok(embaApiUtils.includes("validR2Key"));
assert.ok(embaApiUtils.includes("data:"));
assert.ok(embaApiUtils.includes("MAX_MEMORIES_PER_MONTH = 100"));
assert.ok(embaApiUtils.includes("MAX_THINKING_ITEMS_PER_MONTH = 100"));
assert.ok(embaApiUtils.includes("MAX_FOLLOW_UP_ITEMS_PER_MONTH = 100"));
assert.ok(embaApiUtils.includes("MAX_UPLOAD_BYTES = 64 * 1024 * 1024"));
assert.ok(embaApiUtils.includes("thinkingQuestions"));
assert.ok(embaApiUtils.includes("followUpPoints"));
assert.ok(embaApiUtils.includes("markdown: cleanText"));
assert.ok(embaApiUtils.includes("reviewNotes: cleanText"));
assert.ok(embaApiUtils.includes("followUpNotes: cleanText"));
assert.ok(embaApiUtils.includes("learningNotes: cleanText"));
assert.ok(embaApiUtils.includes("markdownRevision: cleanRevision"));

assert.ok(embaLibraryApi.includes("env.EMBA_DB"));
assert.ok(embaLibraryApi.includes("CREATE TABLE IF NOT EXISTS emba_state"));
assert.ok(embaLibraryApi.includes("ON CONFLICT(key) DO UPDATE"));

assert.ok(embaUploadApi.includes("env.EMBA_BUCKET"));
assert.ok(embaUploadApi.includes("request.formData()"));
assert.ok(embaUploadApi.includes("fileUrlFromKey(key)"));

assert.ok(embaFileApi.includes("env.EMBA_BUCKET.get(key)"));
assert.ok(embaFileApi.includes("requireEmbaAccess"));
assert.ok(embaFileApi.includes("writeHttpMetadata"));

assert.ok(embaReadme.includes("D1 database binding name: EMBA_DB"));
assert.ok(embaReadme.includes("R2 bucket binding name: EMBA_BUCKET"));
assert.ok(embaReadme.includes("The private knowledge base lives under `emba/content/`"));
assert.ok(embaReadme.includes("Original PDF, PPT, Word, image, and case files should stay"));

const parsedKnowledgeIndex = JSON.parse(embaKnowledgeIndex);
assert.ok(Array.isArray(parsedKnowledgeIndex.notes));
const indexedNoteIds = new Set(parsedKnowledgeIndex.notes.map((note) => note.id));
assert.ok(indexedNoteIds.has("emba-master-index"));
assert.ok(indexedNoteIds.has("emba-2026-06-preparation-index"));
assert.ok(indexedNoteIds.has("emba-2026-06-preparation-documents-analysis"));
assert.ok(indexedNoteIds.has("emba-2026-06-um-certificate-of-enrolment"));
assert.ok(indexedNoteIds.has("emba-2026-06-onboarding-guideline"));
assert.ok(indexedNoteIds.has("emba-2026-06-study-fees-policies-procedures"));
assert.ok(indexedNoteIds.has("emba-2026-06-maastricht-on-campus-programme-outline"));
assert.ok(indexedNoteIds.has("emba-2026-06-maastricht-online-programme-outline"));
assert.ok(indexedNoteIds.has("emba-2026-06-maastricht-curriculum-elective-modules"));
assert.ok(indexedNoteIds.has("emba-2026-06-lost-art-of-thinking-large-organizations"));
assert.ok(indexedNoteIds.has("emba-2026-06-nyenrode-impact-mba-executive-brochure"));
assert.ok(indexedNoteIds.has("emba-2026-07-learning-index"));
assert.ok(indexedNoteIds.has("emba-2026-07-leading-in-learning-programme"));
assert.ok(indexedNoteIds.has("emba-2026-07-leadership-learning-handwritten-notes"));
assert.ok(indexedNoteIds.has("emba-2026-07-questions-and-reflections-review"));
assert.ok(indexedNoteIds.has("emba-2026-07-leo-thinking-journey"));
assert.ok(indexedNoteIds.has("emba-2026-07-personal-marker-original-extract"));
assert.ok(indexedNoteIds.has("emba-theme-leadership"));
assert.ok(indexedNoteIds.has("emba-theme-strategy"));
assert.ok(indexedNoteIds.has("emba-theme-finance"));
assert.ok(indexedNoteIds.has("emba-theme-ai-and-digital-transformation"));
assert.ok(indexedNoteIds.has("emba-theme-decision-making"));
assert.ok(indexedNoteIds.has("emba-theme-personal-growth"));
assert.ok(embaKnowledgeIndex.includes("录取"));
assert.ok(embaKnowledgeIndex.includes("领导力"));
assert.ok(embaMasterIndex.includes("# EMBA Master Index"));
assert.ok(embaMasterIndex.includes("## Current Corpus"));
assert.ok(embaMasterIndex.includes("## Operating Rule For New Documents"));
assert.ok(embaJuneIndex.includes("# EMBA Monthly Learning Index - June 2026"));
assert.ok(embaJuneIndex.includes("## 5A. Knowledge Map"));
assert.ok(embaJuneIndex.includes("./converted-md/source-documents/2026-06-onboarding-guideline.md"));
assert.ok(embaJuneIndex.includes("./converted-md/source-documents/2026-06-maastricht-curriculum-elective-modules.md"));
assert.ok(embaJuneAnalysis.includes("## 1A. Search Card"));
assert.ok(embaJuneAnalysis.includes("## 11A. Retrieval Anchors"));
assert.ok(embaJuneAnalysis.includes("./source-documents/2026-06-study-fees-policies-procedures.md"));
assert.ok(embaJulyIndex.includes("# EMBA Monthly Learning Index - July 2026"));
assert.ok(embaJulyIndex.includes("## 5A. Knowledge Map"));
assert.ok(embaJulyIndex.includes("./converted-md/source-documents/2026-07-leading-in-learning-programme.md"));
assert.ok(embaJulyIndex.includes("Leo's EMBA Thinking Journey"));
assert.ok(embaJulyIndex.includes("Personal Reflection Evidence Ledger"));
assert.ok(embaConvertedNote.startsWith("---\n"));
assert.ok(embaConvertedNote.includes("rag_include: true"));
assert.ok(embaConvertedNote.includes("source_files:"));
assert.ok(embaConvertedNote.includes("## 1A. Search Card"));
assert.ok(embaConvertedNote.includes("## 4A. Knowledge Map"));
assert.ok(embaLeoThinkingJourney.includes("id: emba-2026-07-leo-thinking-journey"));
assert.ok(embaLeoThinkingJourney.includes("## 先回答：我的思考有逻辑吗？"));
assert.ok(embaLeoThinkingJourney.includes("## 三层证据"));
assert.ok(embaLeoThinkingJourney.includes("## 思考链 6：AI 的核心不是生成，而是 ownership 与 mastery"));
assert.ok(embaLeoThinkingJourney.includes("## 课堂笔记的完整性评估"));
assert.ok(embaLeoThinkingJourney.includes("E001-E120"));
assert.ok(embaLeoThinkingJourney.includes("human in the lead"));
assert.ok(embaPersonalMarkerExtract.includes("id: emba-2026-07-personal-marker-original-extract"));
assert.ok(embaPersonalMarkerExtract.includes("## 审核规则"));
assert.ok(embaPersonalMarkerExtract.includes("E001"));
assert.ok(embaPersonalMarkerExtract.includes("E120"));
assert.ok(embaPersonalMarkerExtract.includes("Not make your comfortable room"));
assert.ok(embaPersonalMarkerExtract.includes("True Leadership and Department Value"));
assert.ok(embaPersonalMarkerExtract.includes("Use AI summarize my thought"));
assert.ok(embaPersonalMarkerExtract.includes("Who? Why? How? -> What"));
assert.ok(embaPersonalMarkerExtract.includes("1997 China"));
assert.ok(embaLeadershipTheme.includes("## Current Synthesis"));
assert.ok(embaStrategyTheme.includes("## Current Synthesis"));

const parsedMaterials = JSON.parse(embaMaterials);
assert.equal(parsedMaterials.timeline.startMonth, "2026-06");
assert.ok(parsedMaterials.months.some((month) => month.month === "2026-06"));
const julyMaterials = parsedMaterials.months.find((month) => month.month === "2026-07");
assert.ok(julyMaterials);
const juneMaterials = parsedMaterials.months.find((month) => month.month === "2026-06");
assert.ok(juneMaterials.materials.some((item) => item.file.includes("/api/emba/file/emba/2026-06/material/") && item.file.endsWith("Onboarding-guideline.pdf")));
assert.ok(juneMaterials.materials.some((item) => item.file.includes("/api/emba/file/emba/2026-06/material/") && item.file.endsWith("MaastrichtMBA---Curriculum-Elective-Modules.pdf")));
assert.ok(juneMaterials.materials.some((item) => item.file.includes("/api/emba/file/emba/2026-06/material/") && item.file.endsWith("nyenrode-impact-mba-executive-brochure.pdf")));
assert.ok(juneMaterials.materials.some((item) => item.notes.includes("/emba/content/2026/06_June/converted-md/source-documents/2026-06-onboarding-guideline.md")));
assert.ok(julyMaterials.materials.some((item) => item.file.includes("/api/emba/file/emba/2026-07/material/") && item.file.endsWith("September-intake---MaastrichtMBA-Leading-in-Learning-Programme-July-2026.pdf")));
assert.ok(julyMaterials.materials.some((item) => item.notes.includes("/emba/content/2026/07_July/converted-md/source-documents/2026-07-leading-in-learning-programme.md")));
assert.ok(julyMaterials.materials.some((item) => item.file === "/emba/content/2026/07_July/converted-md/2026-07-01-leadership-learning-handwritten-notes.md"));
assert.ok(julyMaterials.materials.some((item) => item.file === "/emba/content/2026/07_July/reflections/2026-07-leo-thinking-journey.md"));
assert.ok(julyMaterials.materials.some((item) => item.file === "/emba/content/2026/07_July/reflections/2026-07-personal-marker-original-extract.md"));
assert.ok(julyMaterials.materials.some((item) => item.file === "/emba/content/2026/07_July/reflections/2026-07-questions-and-reflections-review.md"));
assert.equal(julyMaterials.thinkingQuestions.length, 19);
assert.equal(new Set(julyMaterials.thinkingQuestions.map((item) => item.id)).size, 19);
assert.ok(julyMaterials.thinkingQuestions.every((item) => item.original && item.context && item.reconstruction && item.evidenceBoundary));
assert.equal(julyMaterials.thinkingQuestions.find((item) => item.id === "T07")?.original, 'Leo: "True leadership": people want to follow you ... how many people you can influence and they are willing to follow you');
assert.ok(julyMaterials.thinkingQuestions.find((item) => item.id === "T15")?.original.includes("Use AI summarize my thought"));
assert.equal(julyMaterials.followUpPoints.length, 12);
assert.ok(julyMaterials.followUpPoints.some((item) => item.startsWith("[T01]")));
assert.ok(julyMaterials.followUpPoints.some((item) => item.startsWith("[行动闭环]")));
assert.equal(julyMaterials.markdownRevision, 2);
assert.ok(julyMaterials.reviewedMarkdown.includes("# EMBA July 2026 - Source-First Reviewed Notes"));
assert.ok(julyMaterials.reviewedMarkdown.includes("## Current Logic Assessment"));

const normalizedLibrary = normalizeLibraryPayload(parsedMaterials);
const normalizedJuly = normalizedLibrary.months.find((month) => month.month === "2026-07");
assert.ok(normalizedJuly);
assert.equal(normalizedJuly.thinkingQuestions.length, 19);
assert.equal(normalizedJuly.thinkingQuestions[6].id, "T07");
assert.ok(normalizedJuly.thinkingQuestions[6].original.includes("people want to follow you"));
assert.ok(Object.hasOwn(normalizedJuly.thinkingQuestions[6], "reviewNotes"));
assert.equal(normalizedJuly.markdownRevision, 2);
assert.ok(normalizedJuly.markdown.includes("# EMBA July 2026 - Source-First Reviewed Notes"));

const reviewRoundTrip = normalizeLibraryPayload({
  months: [{
    month: "2026-07",
    thinkingQuestions: [{
      id: "T07",
      title: "True leadership",
      original: "people want to follow you",
      reviewNotes: "Confirmed after review.",
      followUpNotes: "Add three real cases.",
      learningNotes: "Revisit next month."
    }]
  }]
});
assert.deepEqual(
  {
    reviewNotes: reviewRoundTrip.months[0].thinkingQuestions[0].reviewNotes,
    followUpNotes: reviewRoundTrip.months[0].thinkingQuestions[0].followUpNotes,
    learningNotes: reviewRoundTrip.months[0].thinkingQuestions[0].learningNotes
  },
  {
    reviewNotes: "Confirmed after review.",
    followUpNotes: "Add three real cases.",
    learningNotes: "Revisit next month."
  }
);

console.log("EMBA cloud static checks passed");
