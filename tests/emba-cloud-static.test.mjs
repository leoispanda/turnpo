import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const { normalizeLibraryPayload, requireEmbaAccess } = await import("../functions/api/emba/_utils.js");
const { onRequestGet: embaAccessGet, onRequestPost: embaAccessPost } = await import("../functions/emba/[[path]].js");

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
const embaOfferMirror = fs.readFileSync(new URL("../emba/content/2026/06_June/converted-md/source-documents/2026-06-offer-of-admission.md", import.meta.url), "utf8");
const embaJulyIndex = fs.readFileSync(new URL("../emba/content/2026/07_July/2026-07_EMBA_Learning_Index.md", import.meta.url), "utf8");
const embaConvertedNote = fs.readFileSync(new URL("../emba/content/2026/07_July/converted-md/2026-07-01-leadership-learning-handwritten-notes.md", import.meta.url), "utf8");
const embaLeoThinkingJourney = fs.readFileSync(new URL("../emba/content/2026/07_July/reflections/2026-07-leo-thinking-journey.md", import.meta.url), "utf8");
const embaPersonalMarkerExtract = fs.readFileSync(new URL("../emba/content/2026/07_July/reflections/2026-07-personal-marker-original-extract.md", import.meta.url), "utf8");
const embaPersonalReflections = fs.readFileSync(new URL("../emba/content/2026/07_July/reflections/2026-07-questions-and-reflections-review.md", import.meta.url), "utf8");
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
assert.ok(embaJs.includes("liveMonthSearchText"));
assert.ok(embaJs.includes("note.search_body"));
assert.ok(embaJs.includes("splitFrontmatter(markdown).body"));
assert.ok(embaJs.includes("openKnowledgeNote"));
assert.ok(embaJs.includes("markdownToHtml"));
assert.ok(embaJs.includes("function copyPlainText"));
assert.ok(embaJs.includes("data-material-copy"));
assert.ok(embaJs.includes("完整 Markdown 已复制，可直接粘贴给 GPT。"));
const markdownInlineSource = embaJs.slice(embaJs.indexOf("function markdownInline"), embaJs.indexOf("function splitFrontmatter"));
assert.ok(markdownInlineSource.includes('target="_blank" rel="noopener noreferrer"'));
assert.ok(!markdownInlineSource.includes("data-material-open"));
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
assert.ok(embaJs.includes('data-reflection-workspace'));
assert.ok(embaJs.includes('data-reflection-section="thinking"'));
assert.ok(embaJs.includes("<h3>个人反思</h3>"));
assert.ok(embaJs.includes("原文、当时上下文、寓言、Codex 补齐"));
assert.ok(embaJs.includes('<span class="emba-thinking-label">原文</span>'));
assert.ok(embaJs.includes('renderThinkingReviewRow("当时上下文", item.context)'));
assert.ok(embaJs.includes('renderThinkingReviewRow("寓言", item.fable'));
assert.ok(embaJs.includes('renderThinkingReviewRow("Codex 补齐", item.reconstruction'));
assert.ok(embaJs.includes('return `${thinkingCount} 条个人反思`;'));
assert.ok(!embaJs.includes("data-thinking-item-field"));
assert.ok(!embaJs.includes('data-reflection-section="followup"'));
assert.ok(!embaJs.includes('data-reflection-view'));
assert.ok(!embaJs.includes('reflectionView:'));
assert.ok(!embaJs.includes("证据边界"));
assert.ok(!embaJs.includes("你的 Review"));
assert.ok(!embaJs.includes("Review 记录"));
assert.ok(!embaJs.includes("Follow-up 记录"));
assert.ok(!embaJs.includes("Self-learning reflection"));
assert.ok(!embaJs.includes("Review 管理"));
assert.ok(embaJs.includes("reviewStatus"));
assert.ok(embaJs.includes("reviewDate"));
assert.ok(embaJs.includes("bumpRevision"));
assert.ok(embaJs.includes("materialsRevision"));
assert.ok(embaJs.includes("reflectionRevision"));
assert.ok(embaJs.includes("followUpRevision"));
assert.ok(embaJs.includes("memoryRevision"));
assert.ok(embaJs.includes("HIDDEN_MATERIAL_FILES"));
assert.ok(!embaJs.includes("items.slice(0, 12)"));
assert.ok(!embaJs.includes("function renderFollowUpPoints"));
assert.ok(!embaJs.includes("[data-follow-up-editor]"));
assert.ok(!embaJs.includes("month.followUpPoints = target.value"));
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
assert.ok(embaCss.includes(".emba-material-reader-actions"));
assert.ok(embaCss.includes(".emba-material-copy-status"));
assert.ok(embaCss.includes(".emba-markdown-rendered ol"));
assert.ok(embaCss.includes(".emba-note-reader"));
assert.ok(embaCss.includes(".emba-note-source-actions"));
assert.ok(embaCss.includes(".emba-thinking-list"));
assert.ok(embaCss.includes(".emba-thinking-review-card"));
assert.ok(embaCss.includes("grid-template-columns: repeat(2, minmax(0, 1fr));"));
assert.ok(embaCss.includes(".emba-reflection-workspace"));
assert.ok(embaCss.includes(".emba-reflection-section-head"));
assert.ok(!embaCss.includes(".emba-follow-up-list"));
assert.ok(!embaCss.includes(".emba-reflection-view-tabs"));
assert.ok(!embaCss.includes(".emba-reflection-view-tab.active"));
assert.ok(!embaCss.includes(".emba-thinking-note-editor"));
assert.ok(!embaCss.includes(".emba-thinking-review-management"));
assert.ok(!embaCss.includes(".emba-thinking-review-control"));
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
assert.ok(embaHtml.includes('<form class="emba-access-card" id="embaAccessForm" method="post">'));
assert.ok(embaHtml.includes('name="accessCode"'));
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
assert.equal(embaFunction.includes("DEFAULT_EMBA_ACCESS_CODE"), false);
assert.ok(embaFunction.includes("EMBA access is not configured."));

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
assert.ok(embaApiUtils.includes("reviewStatus:"));
assert.ok(embaApiUtils.includes("reviewDate:"));
assert.ok(embaApiUtils.includes("materialsRevision: cleanRevision"));
assert.ok(embaApiUtils.includes("reflectionRevision: cleanRevision"));
assert.ok(embaApiUtils.includes("followUpRevision: cleanRevision"));
assert.ok(embaApiUtils.includes("markdownRevision: cleanRevision"));
assert.ok(embaApiUtils.includes("memoryRevision: cleanRevision"));
assert.equal(embaApiUtils.includes("DEFAULT_EMBA_ACCESS_CODE"), false);
assert.ok(embaApiUtils.includes("EMBA access is not configured."));
const defaultAccess = await requireEmbaAccess(new Request("https://www.turnpo.com/api/emba/library"), {});
assert.equal(defaultAccess.status, 503);
assert.equal((await defaultAccess.json()).error, "EMBA access is not configured.");

const missingLogin = await embaAccessPost({
  request: new Request("https://www.turnpo.com/emba/", {
    method: "POST",
    body: new URLSearchParams({ accessCode: "anything" })
  }),
  env: {}
});
assert.equal(missingLogin.status, 200);
assert.ok((await missingLogin.text()).includes("EMBA access is not configured."));

const missingPage = await embaAccessGet({
  request: new Request("https://www.turnpo.com/emba/"),
  env: {}
});
assert.equal(missingPage.status, 200);
assert.ok((await missingPage.text()).includes("EMBA access is not configured."));

const configuredLogin = await embaAccessPost({
  request: new Request("https://www.turnpo.com/emba/", {
    method: "POST",
    body: new URLSearchParams({ accessCode: "custom-emba-code" })
  }),
  env: { EMBA_ACCESS_CODE: "custom-emba-code" }
});
assert.equal(configuredLogin.status, 303);
const embaToken = (configuredLogin.headers.get("set-cookie") || "").match(/turnpo_emba_access=([^;]+)/)?.[1] || "";
assert.ok(embaToken);
assert.equal(await requireEmbaAccess(
  new Request("https://www.turnpo.com/api/emba/library", {
    headers: { cookie: `turnpo_emba_access=${embaToken}` }
  }),
  { EMBA_ACCESS_CODE: "custom-emba-code" }
), null);

assert.ok(embaLibraryApi.includes("env.EMBA_DB"));
assert.ok(embaLibraryApi.includes("CREATE TABLE IF NOT EXISTS emba_state"));
assert.ok(embaLibraryApi.includes("CREATE TABLE IF NOT EXISTS emba_state_history"));
assert.ok(embaLibraryApi.includes("INSERT INTO emba_state_history"));
assert.ok(embaLibraryApi.includes("HISTORY_LIMIT = 50"));
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
assert.ok(embaReadme.includes("EMBA_ACCESS_CODE"));
assert.equal(embaReadme.includes("original compatibility password"), false);
assert.ok(embaReadme.includes("Original PDF, PPT, Word, image, and case files should stay"));
assert.ok(embaReadme.includes("## Canonical Layers"));
assert.ok(embaReadme.includes("one search input"));
assert.ok(embaReadme.includes("newest 50 snapshots"));

const parsedKnowledgeIndex = JSON.parse(embaKnowledgeIndex);
assert.ok(Array.isArray(parsedKnowledgeIndex.notes));
const indexedNoteIds = new Set(parsedKnowledgeIndex.notes.map((note) => note.id));
assert.ok(indexedNoteIds.has("emba-master-index"));
assert.ok(indexedNoteIds.has("emba-2026-06-preparation-index"));
assert.ok(indexedNoteIds.has("emba-2026-06-preparation-documents-analysis"));
assert.ok(indexedNoteIds.has("emba-2026-06-offer-of-admission"));
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
assert.ok(indexedNoteIds.has("emba-2026-07-leadership-development-trajectory"));
assert.ok(indexedNoteIds.has("emba-2026-07-team-building"));
assert.ok(indexedNoteIds.has("emba-2026-07-welcome-mba"));
assert.ok(indexedNoteIds.has("emba-2026-07-alumni-forum"));
assert.ok(indexedNoteIds.has("emba-2026-07-mba-need-to-knows"));
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
assert.ok(embaJuneIndex.includes("./converted-md/source-documents/2026-06-offer-of-admission.md"));
assert.ok(embaJuneIndex.includes("./converted-md/source-documents/2026-06-maastricht-curriculum-elective-modules.md"));
assert.ok(embaJuneAnalysis.includes("## 1A. Search Card"));
assert.ok(embaJuneAnalysis.includes("## 11A. Retrieval Anchors"));
assert.ok(embaJuneAnalysis.includes("./source-documents/2026-06-study-fees-policies-procedures.md"));
assert.ok(embaJuneAnalysis.includes("./source-documents/2026-06-offer-of-admission.md"));
assert.ok(embaOfferMirror.includes("id: emba-2026-06-offer-of-admission"));
assert.ok(embaOfferMirror.includes("Personal address details, signatures, and private contact details are intentionally omitted"));
assert.ok(embaOfferMirror.includes("2026-09-11"));
assert.ok(embaOfferMirror.includes("2026-09-12"));
assert.ok(embaJulyIndex.includes("# EMBA Monthly Learning Index - July 2026"));
assert.ok(embaJulyIndex.includes("## 5A. Knowledge Map"));
assert.ok(embaJulyIndex.includes("./converted-md/source-documents/2026-07-leading-in-learning-programme.md"));
assert.ok(embaJulyIndex.includes("./converted-md/source-documents/2026-07-leadership-development-trajectory.md"));
assert.ok(embaJulyIndex.includes("./converted-md/source-documents/2026-07-mba-need-to-knows.md"));
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
assert.ok(embaPersonalReflections.includes("id: emba-2026-07-questions-and-reflections-review"));
assert.ok(embaPersonalReflections.includes("# 2026 年 7 月个人反思"));
assert.equal((embaPersonalReflections.match(/^## T\d{2} -/gm) || []).length, 19);
assert.equal((embaPersonalReflections.match(/^\*\*原文\*\*$/gm) || []).length, 19);
assert.equal((embaPersonalReflections.match(/^\*\*当时上下文\*\*$/gm) || []).length, 19);
assert.equal((embaPersonalReflections.match(/^\*\*寓言｜/gm) || []).length, 19);
assert.equal((embaPersonalReflections.match(/^\*\*Codex 补齐\*\*$/gm) || []).length, 19);
assert.ok(embaPersonalReflections.includes("Use AI summarize my thought"));
assert.ok(!embaPersonalReflections.includes("**证据边界**"));
assert.ok(!embaPersonalReflections.includes("**你的 Review**"));
assert.ok(!embaPersonalReflections.includes("**Follow-up**"));
assert.ok(!embaPersonalReflections.includes("**Self-learning reflection**"));
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
assert.ok(juneMaterials.materials.some((item) => item.file.includes("/api/emba/file/emba/2026-06/material/") && item.file.endsWith("offer-signed-leo.pdf")));
assert.ok(juneMaterials.materials.some((item) => item.notes.includes("/emba/content/2026/06_June/converted-md/source-documents/2026-06-offer-of-admission.md")));
assert.ok(juneMaterials.materials.some((item) => item.notes.includes("/emba/content/2026/06_June/converted-md/source-documents/2026-06-onboarding-guideline.md")));
assert.ok(julyMaterials.materials.some((item) => item.file.includes("/api/emba/file/emba/2026-07/material/") && item.file.endsWith("September-intake---MaastrichtMBA-Leading-in-Learning-Programme-July-2026.pdf")));
assert.ok(julyMaterials.materials.some((item) => item.notes.includes("/emba/content/2026/07_July/converted-md/source-documents/2026-07-leading-in-learning-programme.md")));
assert.ok(julyMaterials.materials.some((item) => item.file.endsWith("Leadership-Development-Trajectory---Micole-Smits.pdf") && item.notes.includes("2026-07-leadership-development-trajectory.md")));
assert.ok(julyMaterials.materials.some((item) => item.file.endsWith("Team-building---Diana-Mingo-Berdun.pdf") && item.notes.includes("2026-07-team-building.md")));
assert.ok(julyMaterials.materials.some((item) => item.file.endsWith("Welcome-MBA---Ron-Jacobs.pdf") && item.notes.includes("2026-07-welcome-mba.md")));
assert.ok(julyMaterials.materials.some((item) => item.file.endsWith("Alumni-Forum---Jeroen-Duijsinx.pdf") && item.notes.includes("2026-07-alumni-forum.md")));
assert.ok(julyMaterials.materials.some((item) => item.file.endsWith("MBA-need-to-knows---Jesca-Rijpkema.pdf") && item.notes.includes("2026-07-mba-need-to-knows.md")));
assert.ok(julyMaterials.materials.some((item) => item.file === "/emba/content/2026/07_July/converted-md/2026-07-01-leadership-learning-handwritten-notes.md"));
assert.ok(julyMaterials.materials.some((item) => item.file === "/emba/content/2026/07_July/reflections/2026-07-leo-thinking-journey.md"));
assert.ok(julyMaterials.materials.some((item) => item.file === "/emba/content/2026/07_July/reflections/2026-07-personal-marker-original-extract.md"));
assert.ok(julyMaterials.materials.some((item) => item.file === "/emba/content/2026/07_July/reflections/2026-07-questions-and-reflections-review.md"));
assert.ok(!julyMaterials.materials.some((item) => item.file.includes("leadership-learning-notes-analysis.md")));
assert.equal(julyMaterials.materials.length, 10);
const legacyDuplicateMaterial = normalizeLibraryPayload({
  months: [{
    month: "2026-07",
    materials: [{
      title: "Legacy duplicate",
      file: "/emba/materials/2026-07/handwritten-notes/leadership-learning-notes-analysis.md"
    }]
  }]
});
assert.equal(legacyDuplicateMaterial.months[0].materials.length, 0);
assert.equal(julyMaterials.thinkingQuestions.length, 19);
assert.equal(new Set(julyMaterials.thinkingQuestions.map((item) => item.id)).size, 19);
assert.ok(julyMaterials.thinkingQuestions.every((item) => item.original && item.context && item.reconstruction));
assert.equal(julyMaterials.thinkingQuestions.find((item) => item.id === "T07")?.original, 'Leo: "True leadership": people want to follow you ... how many people you can influence and they are willing to follow you');
assert.ok(julyMaterials.thinkingQuestions.find((item) => item.id === "T15")?.original.includes("Use AI summarize my thought"));
assert.equal(julyMaterials.markdownRevision, 2);
assert.equal(julyMaterials.materialsRevision, 0);
assert.equal(julyMaterials.reflectionRevision, 0);
assert.equal(julyMaterials.followUpRevision, 0);
assert.equal(julyMaterials.memoryRevision, 0);
assert.ok(julyMaterials.reviewedMarkdown.includes("# EMBA July 2026 - Source-First Reviewed Notes"));
assert.ok(julyMaterials.reviewedMarkdown.includes("## Current Logic Assessment"));

const normalizedLibrary = normalizeLibraryPayload(parsedMaterials);
const normalizedJuly = normalizedLibrary.months.find((month) => month.month === "2026-07");
assert.ok(normalizedJuly);
assert.equal(normalizedJuly.thinkingQuestions.length, 19);
assert.equal(normalizedJuly.thinkingQuestions[6].id, "T07");
assert.ok(normalizedJuly.thinkingQuestions[6].original.includes("people want to follow you"));
assert.ok(Object.hasOwn(normalizedJuly.thinkingQuestions[6], "reviewNotes"));
assert.equal(normalizedJuly.thinkingQuestions[6].reviewStatus, "pending");
assert.equal(normalizedJuly.thinkingQuestions[6].reviewDate, "");
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
      learningNotes: "Revisit next month.",
      reviewStatus: "action",
      reviewDate: "2026-07-10"
    }]
  }]
});
assert.deepEqual(
  {
    reviewNotes: reviewRoundTrip.months[0].thinkingQuestions[0].reviewNotes,
    followUpNotes: reviewRoundTrip.months[0].thinkingQuestions[0].followUpNotes,
    learningNotes: reviewRoundTrip.months[0].thinkingQuestions[0].learningNotes,
    reviewStatus: reviewRoundTrip.months[0].thinkingQuestions[0].reviewStatus,
    reviewDate: reviewRoundTrip.months[0].thinkingQuestions[0].reviewDate
  },
  {
    reviewNotes: "Confirmed after review.",
    followUpNotes: "Add three real cases.",
    learningNotes: "Revisit next month.",
    reviewStatus: "action",
    reviewDate: "2026-07-10"
  }
);

const contentRoot = fileURLToPath(new URL("../emba/content/", import.meta.url));
function markdownFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? markdownFiles(file) : file.endsWith(".md") ? [file] : [];
  });
}
const substantiveMarkdown = markdownFiles(contentRoot)
  .filter((file) => !file.includes(`${path.sep}templates${path.sep}`))
  .filter((file) => !file.endsWith(`${path.sep}originals${path.sep}README.md`))
  .map((file) => `/emba/content/${path.relative(contentRoot, file).split(path.sep).join("/")}`)
  .sort();
const indexedMarkdown = parsedKnowledgeIndex.notes.map((note) => note.md_file).sort();
assert.deepEqual(indexedMarkdown, substantiveMarkdown);
assert.equal(new Set(indexedMarkdown).size, indexedMarkdown.length);
parsedKnowledgeIndex.notes
  .filter((note) => note.source_type === "pdf")
  .forEach((note) => {
    assert.ok(note.source_file.startsWith("/api/emba/file/"), `${note.id} must use a protected source URL`);
    const markdown = fs.readFileSync(path.join(contentRoot, path.relative("/emba/content", note.md_file)), "utf8");
    assert.ok(markdown.includes(`source_file: ${note.source_file}`), `${note.id} source URL must match its Markdown frontmatter`);
  });
parsedMaterials.months.flatMap((month) => month.materials)
  .filter((item) => /\.pdf$/i.test(item.file || ""))
  .forEach((item) => {
    const indexedSource = parsedKnowledgeIndex.notes.find((note) => note.source_file === item.file);
    assert.ok(indexedSource, `${item.title} must have an indexed Markdown mirror`);
    assert.ok(item.notes.includes(indexedSource.md_file), `${item.title} Material notes must link its Markdown mirror`);
  });
const welcomeMirror = fs.readFileSync(path.join(contentRoot, "2026/07_July/converted-md/source-documents/2026-07-welcome-mba.md"), "utf8");
const teamBuildingMirror = fs.readFileSync(path.join(contentRoot, "2026/07_July/converted-md/source-documents/2026-07-team-building.md"), "utf8");
const needToKnowsMirror = fs.readFileSync(path.join(contentRoot, "2026/07_July/converted-md/source-documents/2026-07-mba-need-to-knows.md"), "utf8");
assert.ok(welcomeMirror.includes("exact percentages remain unverified"));
assert.ok(teamBuildingMirror.includes("Classmate names are intentionally not reproduced"));
assert.ok(needToKnowsMirror.includes("participant roster and profile-picture groups"));

const browserContext = {
  console,
  document: {
    body: { classList: { add() {}, remove() {}, toggle() {} } },
    cookie: "",
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {}
  },
  window: {
    clearTimeout() {},
    setTimeout() { return 1; },
    location: { origin: "https://www.turnpo.com" }
  },
  localStorage: { getItem() { return null; }, setItem() {} },
  sessionStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  URL,
  Date,
  Intl,
  setTimeout,
  clearTimeout
};
vm.createContext(browserContext);
vm.runInContext(embaJs, browserContext);
const revisionMerge = vm.runInContext(`mergeMonthData(
  {
    month: "2026-07",
    materialsRevision: 0,
    reflectionRevision: 0,
    followUpRevision: 0,
    markdownRevision: 2,
    memoryRevision: 0,
    materials: [{ title: "A", file: "/a" }, { title: "B", file: "/b" }],
    reflection: "A much longer base reflection that should not override a deliberate edit.",
    thinkingQuestions: [{ id: "T01", title: "Base", original: "Original", reconstruction: "Keep this" }],
    followUpPoints: ["One", "Two"],
    markdown: "Long canonical markdown",
    memoryMoment: [{ title: "Photo", image: "/photo.jpg" }]
  },
  {
    month: "2026-07",
    materialsRevision: 1,
    reflectionRevision: 1,
    followUpRevision: 1,
    markdownRevision: 3,
    memoryRevision: 1,
    materials: [{ title: "A", file: "/a" }],
    reflection: "Short edit",
    thinkingQuestions: [{ id: "T01", title: "Base", reviewNotes: "Leo review", reviewStatus: "keep", reviewDate: "2026-07-10" }],
    followUpPoints: ["One"],
    markdown: "Short note",
    memoryMoment: []
  }
)`, browserContext);
assert.deepEqual(JSON.parse(JSON.stringify({
  materialFiles: revisionMerge.materials.map((item) => item.file),
  reflection: revisionMerge.reflection,
  followUpPoints: revisionMerge.followUpPoints,
  markdown: revisionMerge.markdown,
  memories: revisionMerge.memoryMoment,
  original: revisionMerge.thinkingQuestions[0].original,
  reconstruction: revisionMerge.thinkingQuestions[0].reconstruction,
  reviewNotes: revisionMerge.thinkingQuestions[0].reviewNotes,
  reviewStatus: revisionMerge.thinkingQuestions[0].reviewStatus,
  reviewDate: revisionMerge.thinkingQuestions[0].reviewDate
})), {
  materialFiles: ["/a"],
  reflection: "Short edit",
  followUpPoints: ["One"],
  markdown: "Short note",
  memories: [],
  original: "Original",
  reconstruction: "Keep this",
  reviewNotes: "Leo review",
  reviewStatus: "keep",
  reviewDate: "2026-07-10"
});

// 裸域名补 https,与公开档案的 safePublicUrl 保持一致;危险协议仍须拒绝。
const materialFile = (file) => normalizeLibraryPayload({
  months: [{ month: "2026-07", materials: [{ title: "M", file }] }]
}).months[0].materials[0].file;

assert.equal(materialFile("www.dishkai.com"), "https://www.dishkai.com/");
assert.equal(materialFile("example.org/reading.pdf"), "https://example.org/reading.pdf");
assert.equal(materialFile("https://example.org/x.pdf"), "https://example.org/x.pdf");
assert.equal(materialFile("/emba/materials/2026-07/a.md"), "/emba/materials/2026-07/a.md");
assert.equal(materialFile("javascript:alert(1)"), "");
assert.equal(materialFile("data:text/html,<script>"), "");
assert.equal(materialFile("//evil.example.com"), "");
assert.equal(materialFile("not a url"), "");

console.log("EMBA cloud static checks passed");
