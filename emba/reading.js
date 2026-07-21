const READING_DATA_URL = "/emba/reading-data.json";

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

function statusLabel(status = "") {
  if (status === "source-available") return "原文已收录";
  if (status === "alternative-available") return "正式原文待补 · 替代资料可读";
  return "正式原文待补 · 学习包";
}

function sourceLink(reading) {
  const url = safeUrl(reading.sourceUrl);
  if (!url) return "";
  return `<a class="reading-source-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(reading.sourceLabel || "打开原文")} ↗</a>`;
}

function renderOriginalSection(reading) {
  const excerpts = Array.isArray(reading.excerpts) ? reading.excerpts : [];
  const note = reading.originalNote || "点击英文段落，可在原位置展开中文翻译。";
  return `
    <section class="reading-section reading-original" aria-labelledby="original-title">
      <div class="reading-section-heading">
        <span>Original close reading</span>
        <h2 id="original-title">阅读原文：点击段落展开中文翻译</h2>
        <p>${escapeHtml(note)}</p>
      </div>
      ${excerpts.length ? `
        <div class="reading-excerpts">
          ${excerpts.map((excerpt, excerptIndex) => `
            <details class="reading-excerpt">
              <summary>
                <span class="reading-excerpt-meta">
                  <span>Excerpt ${String(excerptIndex + 1).padStart(2, "0")}</span>
                  <span>${escapeHtml(excerpt.label || "原文摘录")}</span>
                </span>
                <span class="reading-excerpt-en" lang="en">${escapeHtml(excerpt.en)}</span>
                <span class="reading-excerpt-toggle">
                  <span class="reading-excerpt-open">点击查看中文翻译 ＋</span>
                  <span class="reading-excerpt-close">收起中文翻译 −</span>
                </span>
              </summary>
              <div class="reading-excerpt-translation" lang="zh-CN">
                <span>中文翻译</span>
                <p>${escapeHtml(excerpt.zh)}</p>
              </div>
            </details>
          `).join("")}
        </div>
      ` : `
        <div class="reading-original-empty">
          <span>原文段落暂未开放</span>
          <p>${escapeHtml(note)}</p>
          ${sourceLink(reading)}
        </div>
      `}
    </section>
  `;
}

function renderIndex(readings) {
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
      <p>每一篇都先用不超过 300 字建立全貌，再按文章论证顺序精读，并用可展开的中英对照理解核心原文，最后集中掌握关键词。点击卡片进入独立学习页面；PDF 原文会在新窗口打开。</p>
      <div class="reading-index-stats" aria-label="阅读资料统计">
        <span><strong>5</strong> 天</span>
        <span><strong>16</strong> 项指定阅读</span>
        <span><strong>12</strong> 项原文已收录</span>
        <span><strong>32</strong> 段中英对照</span>
        <span><strong>4</strong> 项替代学习包</span>
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
                  <span class="reading-status ${escapeHtml(reading.status)}">${escapeHtml(statusLabel(reading.status))}</span>
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

function renderReading(reading, readings) {
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
            <span class="reading-status ${escapeHtml(reading.status)}">${escapeHtml(statusLabel(reading.status))}</span>
          </div>
          <h1>${escapeHtml(reading.title)}</h1>
          <p class="reading-citation">${escapeHtml(reading.citation)}</p>
          ${sourceLink(reading)}
        </header>

        <section class="reading-quick" aria-labelledby="quick-title">
          <span>先建立全貌 · 300 字以内</span>
          <h2 id="quick-title">这篇文章最简单地在讲什么？</h2>
          <p>${escapeHtml(reading.summary)}</p>
          <div class="reading-core-question">
            <small>读完必须能回答</small>
            <strong>${escapeHtml(reading.coreQuestion)}</strong>
          </div>
        </section>

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

        ${renderOriginalSection(reading)}

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
    const requestedId = new URLSearchParams(window.location.search).get("reading");
    const reading = readings.find((item) => item.id === requestedId);
    if (requestedId && !reading) {
      app.innerHTML = `<div class="reading-error"><h1>没有找到这篇阅读</h1><p>它可能已经更名，或者链接不完整。</p><a href="/emba/reading.html">返回全部指定阅读</a></div>`;
      return;
    }
    if (reading) renderReading(reading, readings);
    else renderIndex(readings);
  } catch (error) {
    app.innerHTML = `<div class="reading-error"><h1>阅读页面暂时无法加载</h1><p>${escapeHtml(error.message || "Unknown error")}</p><a href="/emba/">返回 EMBA</a></div>`;
  }
}

init();
