const READING_DATA_URL = "/emba/reading-data.json";
const app = document.querySelector("#originalReadingApp");
const structuredReadingLink = document.querySelector("#structuredReadingLink");

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

function renderReader(reading, readings) {
  const originalReadings = readings.filter((item) => Array.isArray(item.excerpts) && item.excerpts.length);
  const readingIndex = originalReadings.findIndex((item) => item.id === reading.id);
  const previous = readingIndex > 0 ? originalReadings[readingIndex - 1] : null;
  const next = readingIndex < originalReadings.length - 1 ? originalReadings[readingIndex + 1] : null;
  document.title = `${reading.shortTitle} · 原文阅读`;
  structuredReadingLink.href = structuredUrl(reading.id);

  app.innerHTML = `
    <article class="original-reader">
      <header class="original-hero">
        <div class="original-hero-meta">
          <span>${escapeHtml(reading.day)} · Original Reading</span>
          <span>${reading.excerpts.length} 段</span>
        </div>
        <h1>${escapeHtml(reading.title)}</h1>
        <p>${escapeHtml(reading.citation)}</p>
        <div class="original-instruction">
          <span aria-hidden="true">EN ⇄ 中</span>
          <div>
            <strong>直接从英文开始</strong>
            <p>点击任意段落，该段会原位切换成中文；再次点击恢复英文。</p>
          </div>
          <span class="original-progress" id="originalProgress" role="status">0 / ${reading.excerpts.length} 中文</span>
        </div>
      </header>

      <section class="original-paragraphs" aria-label="英文原文段落">
        ${reading.excerpts.map((excerpt, index) => `
          <button class="original-paragraph" type="button" data-original-paragraph aria-pressed="false" aria-label="第 ${index + 1} 段英文，点击切换为中文">
            <span class="original-paragraph-meta">
              <span>${String(index + 1).padStart(2, "0")}</span>
              <span>${escapeHtml(excerpt.label)}</span>
              <span class="original-language-indicator">
                <span class="original-language-en">English</span>
                <span class="original-language-zh">中文翻译</span>
              </span>
            </span>
            <span class="original-text original-text-en" lang="en">${escapeHtml(excerpt.en)}</span>
            <span class="original-text original-text-zh" lang="zh-CN">${escapeHtml(excerpt.zh)}</span>
            <span class="original-swap-hint">
              <span class="original-hint-en">点击切换中文 →</span>
              <span class="original-hint-zh">← 点击返回英文</span>
            </span>
          </button>
        `).join("")}
      </section>

      <section class="original-source-panel">
        <div>
          <span>Source document</span>
          <p>这里展示的是经过核对的课程核心段落，不替代完整文件。需要上下文时，请打开 PDF 原件继续阅读。</p>
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

function updateProgress() {
  const paragraphs = [...document.querySelectorAll("[data-original-paragraph]")];
  const translated = paragraphs.filter((paragraph) => paragraph.getAttribute("aria-pressed") === "true").length;
  const progress = document.querySelector("#originalProgress");
  if (progress) progress.textContent = `${translated} / ${paragraphs.length} 中文`;
}

document.addEventListener("click", (event) => {
  const paragraph = event.target.closest("[data-original-paragraph]");
  if (!paragraph) return;
  const translated = paragraph.getAttribute("aria-pressed") === "true";
  paragraph.setAttribute("aria-pressed", String(!translated));
  paragraph.setAttribute("aria-label", !translated ? "当前为中文，点击恢复英文" : "当前为英文，点击切换为中文");
  updateProgress();
});

async function init() {
  try {
    const response = await fetch(READING_DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const readings = Array.isArray(payload.readings) ? payload.readings : [];
    const requestedId = new URLSearchParams(window.location.search).get("reading");
    const reading = readings.find((item) => item.id === requestedId);
    if (!reading) {
      app.innerHTML = `<section class="original-unavailable"><span>Not found</span><h1>没有找到这篇原文</h1><p>链接可能已经更改。</p><div><a href="/emba/reading.html">返回全部阅读</a></div></section>`;
      return;
    }
    if (!reading.excerpts?.length) renderUnavailable(reading);
    else renderReader(reading, readings);
  } catch (error) {
    app.innerHTML = `<section class="original-unavailable"><span>Loading error</span><h1>原文页面暂时无法加载</h1><p>${escapeHtml(error.message || "Unknown error")}</p><div><a href="/emba/reading.html">返回全部阅读</a></div></section>`;
  }
}

init();
