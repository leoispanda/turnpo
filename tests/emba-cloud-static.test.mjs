import assert from "node:assert/strict";
import fs from "node:fs";

const embaJs = fs.readFileSync(new URL("../emba/emba.js", import.meta.url), "utf8");
const embaHtml = fs.readFileSync(new URL("../emba/index.html", import.meta.url), "utf8");
const embaReadme = fs.readFileSync(new URL("../emba/README.md", import.meta.url), "utf8");
const classmateHtml = fs.readFileSync(new URL("../emba/linkedin-class-connect.html", import.meta.url), "utf8");
const classmateJs = fs.readFileSync(new URL("../emba/linkedin-class-connect.js", import.meta.url), "utf8");
const embaFunction = fs.readFileSync(new URL("../functions/emba/[[path]].js", import.meta.url), "utf8");
const embaApiUtils = fs.readFileSync(new URL("../functions/api/emba/_utils.js", import.meta.url), "utf8");
const embaLibraryApi = fs.readFileSync(new URL("../functions/api/emba/library.js", import.meta.url), "utf8");
const embaUploadApi = fs.readFileSync(new URL("../functions/api/emba/upload.js", import.meta.url), "utf8");
const embaFileApi = fs.readFileSync(new URL("../functions/api/emba/file/[[key]].js", import.meta.url), "utf8");
const embaKnowledgeIndex = fs.readFileSync(new URL("../emba/content/knowledge-index.json", import.meta.url), "utf8");
const embaMasterIndex = fs.readFileSync(new URL("../emba/content/00_EMBA_Master_Index.md", import.meta.url), "utf8");
const embaJulyIndex = fs.readFileSync(new URL("../emba/content/2026/07_July/2026-07_EMBA_Learning_Index.md", import.meta.url), "utf8");
const embaConvertedNote = fs.readFileSync(new URL("../emba/content/2026/07_July/converted-md/2026-07-01-leadership-learning-handwritten-notes.md", import.meta.url), "utf8");

assert.ok(embaJs.includes('const EMBA_LIBRARY_API = "/api/emba/library";'));
assert.ok(embaJs.includes('const EMBA_UPLOAD_API = "/api/emba/upload";'));
assert.ok(embaJs.includes('const EMBA_KNOWLEDGE_INDEX = "/emba/content/knowledge-index.json";'));
assert.ok(embaJs.includes("uploadEmbaFile(file, month.month, \"memory\")"));
assert.ok(embaJs.includes("uploadEmbaFile(file, month.month, \"material\")"));
assert.ok(embaJs.includes("libraryForCloud"));
assert.ok(embaJs.includes("loadKnowledgeBase"));
assert.ok(embaJs.includes("renderKnowledgeResults"));
assert.ok(embaJs.includes("openKnowledgeNote"));
assert.ok(embaJs.includes("markdownToHtml"));
assert.ok(embaJs.includes("[data-knowledge-note]"));
assert.ok(embaJs.includes("[data-knowledge-month]"));
assert.ok(embaJs.includes("emba-memory-gallery"));
assert.ok(embaJs.includes('input name="image" type="file" accept="image/*" multiple'));
assert.ok(embaJs.includes("function monthHasContent"));
assert.ok(embaJs.includes(".filter(monthHasContent)"));
assert.ok(embaJs.includes("No EMBA month has content yet."));
assert.ok(embaJs.includes("editMode: false"));
assert.ok(embaJs.includes("function setEditMode"));
assert.ok(embaJs.includes("function openMemoryLightbox"));
assert.ok(embaJs.includes("function renderMarkdown"));
assert.ok(embaJs.includes("function blockSummary"));
assert.ok(embaJs.includes("function renderBlockContent"));
assert.ok(embaJs.includes("function renderOpenBlockPanel"));
assert.ok(embaJs.includes('data-block-card="${escapeHtml(id)}"'));
assert.ok(embaJs.includes('data-block-panel="${escapeHtml(state.openBlockId)}"'));
assert.ok(embaJs.includes('blockTemplate("markdown", "课堂笔记", month)'));
assert.ok(embaJs.includes("[data-markdown-editor]"));
assert.ok(embaJs.includes("Write class notes for this month..."));
assert.ok(embaJs.includes("No class notes yet."));
assert.ok(embaJs.includes("month.markdown = target.value"));
assert.ok(embaJs.includes('data-memory-preview="${item.originalIndex}"'));
assert.ok(embaJs.includes("if (!isEditMode()) return;"));
assert.ok(embaJs.includes('detail.dataset.mode = isEditMode() ? "edit" : "read";'));
assert.ok(!embaJs.includes("Photo title"));
assert.ok(!embaJs.includes('placeholder="Caption"'));
assert.ok(embaHtml.includes('id="embaSyncStatus"'));
assert.ok(embaHtml.includes('id="embaEditToggle"'));
assert.ok(embaHtml.includes('id="embaLightbox"'));
assert.ok(embaHtml.includes("data-lightbox-close"));
assert.ok(embaHtml.includes('id="embaKnowledge"'));
assert.ok(embaHtml.includes('id="embaKnowledgeSearch"'));
assert.ok(embaHtml.includes('id="embaKnowledgeResults"'));
assert.ok(embaHtml.includes('id="embaKnowledgePreview"'));
assert.ok(embaHtml.includes("/emba/content/00_EMBA_Master_Index.md"));

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
assert.ok(embaApiUtils.includes("markdown: cleanText"));

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
assert.ok(parsedKnowledgeIndex.notes.some((note) => note.id === "emba-2026-07-learning-index"));
assert.ok(parsedKnowledgeIndex.notes.some((note) => note.id === "emba-2026-07-leadership-learning-handwritten-notes"));
assert.ok(embaMasterIndex.includes("# EMBA Master Index"));
assert.ok(embaJulyIndex.includes("# EMBA Monthly Learning Index - July 2026"));
assert.ok(embaConvertedNote.startsWith("---\n"));
assert.ok(embaConvertedNote.includes("rag_include: true"));
assert.ok(embaConvertedNote.includes("source_files:"));

console.log("EMBA cloud static checks passed");
