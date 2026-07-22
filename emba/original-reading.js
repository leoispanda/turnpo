const READING_DATA_URL = "/emba/reading-data.json";
const FULL_READING_INDEX_URL = "/emba/reading-texts/index.json";
const app = document.querySelector("#originalReadingApp");
const structuredReadingLink = document.querySelector("#structuredReadingLink");
let activeReadingId = "";
let activeParagraphs = [];
let browserTranslatorPromise = null;

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(value = "") {
  const url = String(value || "").trim();
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("..")) return url;
  return "";
}

function structuredUrl(id = "") {
  return `/emba/reading.html?reading=${encodeURIComponent(id)}`;
}

function originalUrl(id = "") {
  return `/emba/original-reading.html?reading=${encodeURIComponent(id)}`;
}

function fullReadingUrl(id = "") {
  return `/emba/reading-texts/${encodeURIComponent(id)}.json`;
}

function sourceLink(reading) {
  const url = safeUrl(reading.sourceUrl);
  if (!url) return "";
  return `<a class="original-source" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(reading.sourceLabel || "打开 PDF 原件")} ↗</a>`;
}

function renderUnavailable(reading) {
  document.title = `${reading.shortTitle} · 原文待补`;
  structuredReadingLink.href = structuredUrl(reading.id);
  app.innerHTML = `
    <section class="original-unavailable">
      <span>Original unavailable</span>
      <h1>${escapeHtml(reading.title)}</h1>
      <p>${escapeHtml(reading.originalNote || "这项资料暂时没有可核对的英文原文。")}</p>
      <div>
        <a href="${structuredUrl(reading.id)}">返回结构化讲解</a>
        ${sourceLink(reading)}
      </div>
    </section>
  `;
}

function renderReader(reading, readings, availableIds, fullReading) {
  const originalReadings = readings.filter((item) => availableIds.has(item.id));
  const readingIndex = originalReadings.findIndex((item) => item.id === reading.id);
  const previous = readingIndex > 0 ? originalReadings[readingIndex - 1] : null;
  const next = readingIndex < originalReadings.length - 1 ? originalReadings[readingIndex + 1] : null;
  const paragraphs = fullReading?.paragraphs?.length ? fullReading.paragraphs : reading.excerpts;
  const isComplete = Boolean(fullReading?.paragraphs?.length);
  activeReadingId = reading.id;
  activeParagraphs = paragraphs;
  document.title = `${reading.shortTitle} · 原文阅读`;
  structuredReadingLink.href = structuredUrl(reading.id);

  app.innerHTML = `
    <article class="original-reader">
      <header class="original-hero">
        <div class="original-hero-meta">
          <span>${escapeHtml(reading.day)} · Original Reading</span>
          <span>${isComplete ? `${fullReading.pageCount} 页 · ` : ""}${paragraphs.length} 段</span>
        </div>
        <h1>${escapeHtml(reading.title)}</h1>
        <p>${escapeHtml(reading.citation)}</p>
        ${isComplete ? `<p class="original-scope">完整范围：${escapeHtml(fullReading.scope)}</p>` : ""}
        <div class="original-instruction">
          <span aria-hidden="true">EN ⇄ 中</span>
          <div>
            <strong>直接从英文开始</strong>
            <p>点击任意段落，该段会原位生成并切换成中文；再次点击恢复英文。</p>
          </div>
          <span class="original-progress" id="originalProgress" role="status">0 / ${paragraphs.length} 中文</span>
        </div>
      </header>

      <section class="original-paragraphs" aria-label="英文原文段落">
        ${paragraphs.map((paragraph, index) => `
          <button class="original-paragraph" type="button" data-original-paragraph data-original-index="${index}" data-translation-ready="${paragraph.zh ? "true" : "false"}" aria-pressed="false" aria-label="第 ${index + 1} 段英文，点击切换为中文">
            <span class="original-paragraph-meta">
              <span>${String(index + 1).padStart(2, "0")}</span>
              <span>${escapeHtml(paragraph.label || `第 ${index + 1} 段`)}</span>
              <span class="original-language-indicator">
                <span class="original-language-en">English</span>
                <span class="original-language-zh">中文翻译</span>
              </span>
            </span>
            <span class="original-text original-text-en" lang="en">${escapeHtml(paragraph.en)}</span>
            <span class="original-text original-text-zh" lang="zh-CN">${escapeHtml(paragraph.zh || "")}</span>
            <span class="original-swap-hint">
              <span class="original-hint-en">点击切换中文 →</span>
              <span class="original-hint-zh">← 点击返回英文</span>
            </span>
          </button>
        `).join("")}
      </section>

      <section class="original-source-panel">
        <div>
          <span>${isComplete ? "Complete reading" : "Selected reading"}</span>
          <p>${isComplete
            ? "这里按 PDF 页码展示已收录的完整指定范围。正文由文件提取，中文在点击时自动生成；图表、脚注与原始版式请以 PDF 为准。"
            : "目前只能展示已核对的核心段落；取得完整正文文件后才能补成全文。"}</p>
        </div>
        ${sourceLink(reading)}
      </section>

      <footer class="original-pagination">
        ${previous ? `<a href="${originalUrl(previous.id)}"><span>上一篇原文</span><strong>← ${escapeHtml(previous.shortTitle)}</strong></a>` : `<a href="/emba/reading.html"><span>阅读目录</span><strong>← 返回全部阅读</strong></a>`}
        ${next ? `<a href="${originalUrl(next.id)}"><span>下一篇原文</span><strong>${escapeHtml(next.shortTitle)} →</strong></a>` : `<a href="/emba/reading.html"><span>完成</span><strong>返回全部阅读 →</strong></a>`}
      </footer>
    </article>
  `;
}

function translationCacheKey(paragraph, index) {
  const location = paragraph.pdfPage || paragraph.page || "excerpt";
  const sequence = paragraph.sequence || index + 1;
  return `turnpo:translation:${activeReadingId}:${location}:${sequence}`;
}

function cachedTranslation(paragraph, index) {
  try {
    return localStorage.getItem(translationCacheKey(paragraph, index)) || "";
  } catch (_) {
    return "";
  }
}

function cacheTranslation(paragraph, index, translation) {
  try {
    localStorage.setItem(translationCacheKey(paragraph, index), translation);
  } catch (_) {
    // Reading still works if private browsing or storage limits prevent caching.
  }
}

async function browserTranslator() {
  if (typeof window.Translator?.create !== "function") return null;
  if (!browserTranslatorPromise) {
    browserTranslatorPromise = window.Translator.create({
      sourceLanguage: "en",
      targetLanguage: "zh",
    }).catch(() => null);
  }
  return browserTranslatorPromise;
}

async function googleTranslation(text) {
  const endpoint = new URL("https://translate.googleapis.com/translate_a/single");
  endpoint.search = new URLSearchParams({
    client: "gtx",
    sl: "en",
    tl: "zh-CN",
    dt: "t",
    q: text,
  }).toString();
  const response = await fetch(endpoint, { referrerPolicy: "no-referrer" });
  if (!response.ok) throw new Error(`Translation HTTP ${response.status}`);
  const payload = await response.json();
  const translation = Array.isArray(payload?.[0])
    ? payload[0].map((part) => part?.[0] || "").join("")
    : "";
  if (!translation) throw new Error("Empty translation");
  return translation;
}

async function translateParagraph(paragraph, index) {
  if (paragraph.zh) return paragraph.zh;
  const cached = cachedTranslation(paragraph, index);
  if (cached) return cached;
  const translator = await browserTranslator();
  let translated = "";
  if (translator) {
    try {
      translated = await translator.translate(paragraph.en);
    } catch (_) {
      translated = await googleTranslation(paragraph.en);
    }
  } else {
    translated = await googleTranslation(paragraph.en);
  }
  cacheTranslation(paragraph, index, translated);
  return translated;
}

function updateProgress() {
  const paragraphs = [...document.querySelectorAll("[data-original-paragraph]")];
  const translated = paragraphs.filter((paragraph) => paragraph.getAttribute("aria-pressed") === "true").length;
  const progress = document.querySelector("#originalProgress");
  if (progress) progress.textContent = `${translated} / ${paragraphs.length} 中文`;
}

document.addEventListener("click", async (event) => {
  const paragraph = event.target.closest("[data-original-paragraph]");
  if (!paragraph) return;
  const translated = paragraph.getAttribute("aria-pressed") === "true";
  if (translated) {
    paragraph.setAttribute("aria-pressed", "false");
    paragraph.setAttribute("aria-label", "当前为英文，点击切换为中文");
    updateProgress();
    return;
  }

  const index = Number(paragraph.dataset.originalIndex);
  const source = activeParagraphs[index];
  if (!source || paragraph.dataset.translationLoading === "true") return;
  const chineseText = paragraph.querySelector(".original-text-zh");
  const hint = paragraph.querySelector(".original-hint-en");
  try {
    if (paragraph.dataset.translationReady !== "true") {
      paragraph.dataset.translationLoading = "true";
      paragraph.classList.add("is-translating");
      if (hint) hint.textContent = "正在生成中文翻译…";
      const translation = await translateParagraph(source, index);
      if (chineseText) chineseText.textContent = translation;
      paragraph.dataset.translationReady = "true";
    }
    paragraph.setAttribute("aria-pressed", "true");
    paragraph.setAttribute("aria-label", "当前为中文，点击恢复英文");
  } catch (_) {
    if (hint) hint.textContent = "翻译暂时不可用，点击重试 →";
    paragraph.setAttribute("aria-label", "翻译暂时不可用，点击重试");
  } finally {
    paragraph.dataset.translationLoading = "false";
    paragraph.classList.remove("is-translating");
  }
  updateProgress();
});

async function loadFullReading(readingId, fullIndex) {
  if (!fullIndex.has(readingId)) return null;
  const response = await fetch(fullReadingUrl(readingId), { cache: "no-store" });
  if (!response.ok) throw new Error(`Full reading HTTP ${response.status}`);
  return response.json();
}

async function init() {
  try {
    const response = await fetch(READING_DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const readings = Array.isArray(payload.readings) ? payload.readings : [];
    let fullIndexPayload = { readings: [] };
    try {
      const fullIndexResponse = await fetch(FULL_READING_INDEX_URL, { cache: "no-store" });
      if (fullIndexResponse.ok) fullIndexPayload = await fullIndexResponse.json();
    } catch (_) {
      // Existing excerpt reader remains available if the full-text index cannot load.
    }
    const fullIndex = new Set((fullIndexPayload.readings || []).map((item) => item.id));
    const availableIds = new Set([
      ...fullIndex,
      ...readings.filter((item) => item.excerpts?.length).map((item) => item.id),
    ]);
    const requestedId = new URLSearchParams(window.location.search).get("reading");
    const reading = readings.find((item) => item.id === requestedId);
    if (!reading) {
      app.innerHTML = `<section class="original-unavailable"><span>Not found</span><h1>没有找到这篇原文</h1><p>链接可能已经更改。</p><div><a href="/emba/reading.html">返回全部阅读</a></div></section>`;
      return;
    }
    const fullReading = await loadFullReading(reading.id, fullIndex);
    if (!fullReading && !reading.excerpts?.length) renderUnavailable(reading);
    else renderReader(reading, readings, availableIds, fullReading);
  } catch (error) {
    app.innerHTML = `<section class="original-unavailable"><span>Loading error</span><h1>原文页面暂时无法加载</h1><p>${escapeHtml(error.message || "Unknown error")}</p><div><a href="/emba/reading.html">返回全部阅读</a></div></section>`;
  }
}

init();
