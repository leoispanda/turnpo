const READING_DATA_URL = "/emba/reading-data.json";
const FULL_READING_INDEX_URL = "/emba/reading-texts/index.json";

const app = document.querySelector("#readingApp");

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

function readingUrl(id = "") {
  return `/emba/reading.html?reading=${encodeURIComponent(id)}`;
}

function originalReadingUrl(id = "") {
  return `/emba/original-reading.html?reading=${encodeURIComponent(id)}`;
}

function statusLabel(status = "", hasFullText = false) {
  if (hasFullText) return "完整原文已收录";
  if (status === "source-available") return "原文已收录";
  if (status === "alternative-available") return "正式原文待补 · 替代资料可读";
  return "正式原文待补 · 学习包";
}

function sourceLink(reading) {
  const url = safeUrl(reading.sourceUrl);
  if (!url) return "";
  return `<a class="reading-source-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(reading.sourceLabel || "打开原文")} ↗</a>`;
}

function renderIndex(readings, fullReadings) {
  const fullIds = new Set(fullReadings.map((item) => item.id));
  const paragraphCount = fullReadings.reduce((total, item) => total + (item.paragraphCount || 0), 0);
  const groups = Object.groupBy
    ? Object.groupBy(readings, (reading) => reading.day)
    : readings.reduce((result, reading) => {
        (result[reading.day] ||= []).push(reading);
        return result;
      }, {});

  document.title = "September CFA 指定阅读 | Turnpo";
  app.innerHTML = `
    <header class="reading-index-hero">
      <span class="reading-eyebrow">September 2026 · Corporate Finance & Accounting</span>
      <h1>五天，16 项指定阅读</h1>
      <p>每一篇先用不超过 300 字建立全貌，再按文章论证顺序精读并掌握关键词。点击“阅读完整原文”会进入独立阅读页；英文按 PDF 页码呈现，点击任意段落即可原位切换成中文。</p>
      <div class="reading-index-stats" aria-label="阅读资料统计">
        <span><strong>5</strong> 天</span>
        <span><strong>16</strong> 项指定阅读</span>
        <span><strong>${fullReadings.length}</strong> 项完整原文</span>
        <span><strong>${paragraphCount}</strong> 个原文阅读段</span>
        <span><strong>${readings.length - fullReadings.length}</strong> 项待取得正文</span>
      </div>
    </header>
    <div class="reading-day-list">
      ${Object.entries(groups).map(([day, items]) => `
        <section class="reading-day-group">
          <div class="reading-day-heading">
            <span>${escapeHtml(day)}</span>
            <div>
              <h2>${escapeHtml(items[0].dayTitle)}</h2>
              <p>${escapeHtml(items.length)} 项指定阅读</p>
            </div>
          </div>
          <div class="reading-card-grid">
            ${items.map((reading, index) => `
              <a class="reading-card" href="${readingUrl(reading.id)}">
                <div class="reading-card-meta">
                  <span>Reading ${index + 1}</span>
                  <span class="reading-status ${escapeHtml(reading.status)}">${escapeHtml(statusLabel(reading.status, fullIds.has(reading.id)))}</span>
                </div>
                <h3>${escapeHtml(reading.shortTitle)}</h3>
                <p>${escapeHtml(reading.summary)}</p>
                <span class="reading-card-action">进入结构化学习页 →</span>
              </a>
            `).join("")}
          </div>
        </section>
      `).join("")}
    </div>
  `;
}

function renderReading(reading, readings, fullIds) {
  const index = readings.findIndex((item) => item.id === reading.id);
  const previous = index > 0 ? readings[index - 1] : null;
  const next = index < readings.length - 1 ? readings[index + 1] : null;
  const sameDay = readings.filter((item) => item.day === reading.day);

  document.title = `${reading.shortTitle} | September CFA`;
  app.innerHTML = `
    <div class="reading-page-layout">
      <aside class="reading-side" aria-label="当天阅读目录">
        <a class="reading-back" href="/emba/reading.html">← 全部指定阅读</a>
        <span class="reading-side-day">${escapeHtml(reading.day)}</span>
        <strong>${escapeHtml(reading.dayTitle)}</strong>
        <nav>
          ${sameDay.map((item, itemIndex) => `
            <a href="${readingUrl(item.id)}"${item.id === reading.id ? ' aria-current="page"' : ""}>
              <span>${itemIndex + 1}</span>${escapeHtml(item.shortTitle)}
            </a>
          `).join("")}
        </nav>
      </aside>

      <article class="reading-article">
        <header class="reading-hero">
          <div class="reading-hero-meta">
            <span>${escapeHtml(reading.day)} · Reading ${sameDay.findIndex((item) => item.id === reading.id) + 1}</span>
            <span class="reading-status ${escapeHtml(reading.status)}">${escapeHtml(statusLabel(reading.status, fullIds.has(reading.id)))}</span>
          </div>
          <h1>${escapeHtml(reading.title)}</h1>
          <p class="reading-citation">${escapeHtml(reading.citation)}</p>
          <div class="reading-hero-actions">
            ${fullIds.has(reading.id) ? `<a class="reading-original-link" href="${originalReadingUrl(reading.id)}" target="_blank" rel="noopener noreferrer">阅读完整原文 →</a>` : reading.excerpts?.length ? `<a class="reading-original-link" href="${originalReadingUrl(reading.id)}" target="_blank" rel="noopener noreferrer">阅读核心原文 →</a>` : `<span class="reading-original-unavailable">完整原文待补</span>`}
            ${sourceLink(reading)}
          </div>
        </header>

        ${reading.fable ? `
          <section class="reading-fable" aria-labelledby="fable-title">
            <div class="reading-fable-heading">
              <span>Before the formulas · 知识寓言</span>
              <h2 id="fable-title">${escapeHtml(reading.fable.title)}</h2>
              <p>${escapeHtml(reading.fable.intro)}</p>
            </div>
            <div class="reading-fable-copy">
              ${reading.fable.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`).join("")}
            </div>
            <p class="reading-fable-bridge"><strong>把它带回教材：</strong>${escapeHtml(reading.fable.bridge)}</p>
          </section>
        ` : ""}

        <section class="reading-quick" aria-labelledby="quick-title">
          <span>先建立全貌 · 300 字以内</span>
          <h2 id="quick-title">这篇文章最简单地在讲什么？</h2>
          <p>${escapeHtml(reading.summary)}</p>
          <div class="reading-core-question">
            <small>读完必须能回答</small>
            <strong>${escapeHtml(reading.coreQuestion)}</strong>
          </div>
        </section>

        ${reading.editionBridge ? `
          <section class="reading-edition-bridge" aria-labelledby="edition-bridge-title">
            <div class="reading-section-heading">
              <span>Simple overview · 简单概念导读</span>
              <h2 id="edition-bridge-title">${escapeHtml(reading.editionBridge.title)}</h2>
              <p>${escapeHtml(reading.editionBridge.intro)}</p>
            </div>
            <div class="edition-bridge-grid">
              ${reading.editionBridge.items.map((item) => `
                <article class="edition-bridge-item">
                  <span>概念 ${escapeHtml(item.step)}</span>
                  <h3>${escapeHtml(item.title)}</h3>
                  <p class="edition-bridge-course">${escapeHtml(item.reference)}</p>
                  <p>${escapeHtml(item.body)}</p>
                </article>
              `).join("")}
            </div>
            <div class="edition-bridge-route">
              <small>轻松阅读顺序｜约 45–60 分钟</small>
              <ol>
                ${reading.editionBridge.route.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
              </ol>
            </div>
          </section>
        ` : ""}

        <section class="reading-section" aria-labelledby="parts-title">
          <div class="reading-section-heading">
            <span>Deep reading</span>
            <h2 id="parts-title">沿着文章结构逐部分读</h2>
            <p>先理解作者为什么要写这一部分，再记结论。以下顺序是课堂学习路线，不是虚构的原文小标题。</p>
          </div>
          <div class="reading-parts">
            ${reading.parts.map((part, partIndex) => `
              <section class="reading-part">
                <div class="reading-part-number">${String(partIndex + 1).padStart(2, "0")}</div>
                <div>
                  <h3>${escapeHtml(part.title)}</h3>
                  <p>${escapeHtml(part.body)}</p>
                  <div class="reading-part-takeaway"><strong>你要抓住：</strong>${escapeHtml(part.takeaway)}</div>
                </div>
              </section>
            `).join("")}
          </div>
        </section>

        <section class="reading-section" aria-labelledby="keywords-title">
          <div class="reading-section-heading">
            <span>Vocabulary</span>
            <h2 id="keywords-title">关键词：看到就应该知道它在说什么</h2>
          </div>
          <dl class="reading-keywords">
            ${reading.keywords.map((keyword) => `
              <div class="reading-keyword">
                <dt>
                  <strong>${escapeHtml(keyword.term)}</strong>
                  <span>${escapeHtml(keyword.ipa)}</span>
                </dt>
                <dd><strong>${escapeHtml(keyword.zh)}</strong>${escapeHtml(keyword.meaning)}</dd>
              </div>
            `).join("")}
          </dl>
        </section>

        <section class="reading-application" aria-labelledby="application-title">
          <span>Classroom transfer</span>
          <h2 id="application-title">上课讨论时怎么使用？</h2>
          <p>${escapeHtml(reading.classroomUse)}</p>
          <div>
            <small>一句可以直接带进课堂的判断</small>
            <blockquote>${escapeHtml(reading.classroomLine)}</blockquote>
          </div>
        </section>

        <footer class="reading-pagination">
          ${previous ? `<a href="${readingUrl(previous.id)}"><span>上一篇</span><strong>← ${escapeHtml(previous.shortTitle)}</strong></a>` : `<span></span>`}
          ${next ? `<a href="${readingUrl(next.id)}"><span>下一篇</span><strong>${escapeHtml(next.shortTitle)} →</strong></a>` : `<a href="/emba/reading.html"><span>完成</span><strong>返回全部阅读 →</strong></a>`}
        </footer>
      </article>
    </div>
  `;
}

async function init() {
  try {
    const response = await fetch(READING_DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const readings = Array.isArray(payload.readings) ? payload.readings : [];
    let fullReadings = [];
    try {
      const fullResponse = await fetch(FULL_READING_INDEX_URL, { cache: "no-store" });
      if (fullResponse.ok) {
        const fullPayload = await fullResponse.json();
        fullReadings = Array.isArray(fullPayload.readings) ? fullPayload.readings : [];
      }
    } catch (_) {
      // The structured study pages remain available without the full-text index.
    }
    const fullIds = new Set(fullReadings.map((item) => item.id));
    const requestedId = new URLSearchParams(window.location.search).get("reading");
    const reading = readings.find((item) => item.id === requestedId);
    if (requestedId && !reading) {
      app.innerHTML = `<div class="reading-error"><h1>没有找到这篇阅读</h1><p>它可能已经更名，或者链接不完整。</p><a href="/emba/reading.html">返回全部指定阅读</a></div>`;
      return;
    }
    if (reading) renderReading(reading, readings, fullIds);
    else renderIndex(readings, fullReadings);
  } catch (error) {
    app.innerHTML = `<div class="reading-error"><h1>阅读页面暂时无法加载</h1><p>${escapeHtml(error.message || "Unknown error")}</p><a href="/emba/">返回 EMBA</a></div>`;
  }
}

init();
