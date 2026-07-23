const DAY_ONE_PATH = "/emba/materials/2026-09/reflections/2026-09-07-day-1-financial-management-leo-learning-path.md";

const app = document.querySelector("#learningPathApp");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function inline(markdown = "") {
  return escapeHtml(markdown)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/&lt;br&gt;/g, "<br>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
      const safeUrl = String(url || "").startsWith("/") || /^https?:\/\//i.test(url) ? url : "";
      return safeUrl ? `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${label}</a>` : label;
    });
}

function slug(value = "") {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/(^-|-$)/g, "") || "section";
}

function paragraphs(lines) {
  return lines
    .join(" ")
    .trim()
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((item) => `<p>${inline(item.trim())}</p>`)
    .join("");
}

function parseTable(lines) {
  const rows = lines
    .filter((line) => line.includes("|"))
    .map((line) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));
  if (rows.length < 2) return "";
  const header = rows[0];
  const body = rows.slice(2);
  return `<div class="learning-table-wrap"><table class="learning-table"><thead><tr>${header.map((cell) => `<th>${inline(cell)}</th>`).join("")}</tr></thead><tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function renderBlocks(lines) {
  const html = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    if (line.startsWith("> ")) {
      const quote = [];
      while (index < lines.length && lines[index].startsWith("> ")) {
        quote.push(lines[index].slice(2));
        index += 1;
      }
      html.push(`<blockquote>${quote.map(inline).join("<br>")}</blockquote>`);
      continue;
    }
    if (/^[-*] /.test(line)) {
      const items = [];
      while (index < lines.length && /^[-*] /.test(lines[index])) {
        items.push(lines[index].replace(/^[-*] /, ""));
        index += 1;
      }
      html.push(`<ul>${items.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`);
      continue;
    }
    if (/^\d+\. /.test(line)) {
      const items = [];
      while (index < lines.length && /^\d+\. /.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\. /, ""));
        index += 1;
      }
      html.push(`<ol>${items.map((item) => `<li>${inline(item)}</li>`).join("")}</ol>`);
      continue;
    }
    if (line.includes("|") && index + 1 < lines.length && /^\|?\s*:?-{3,}/.test(lines[index + 1])) {
      const tableLines = [];
      while (index < lines.length && lines[index].includes("|")) {
        tableLines.push(lines[index]);
        index += 1;
      }
      html.push(parseTable(tableLines));
      continue;
    }
    const copy = [];
    while (index < lines.length && lines[index].trim() && !lines[index].startsWith("> ") && !/^[-*] /.test(lines[index]) && !/^\d+\. /.test(lines[index]) && !lines[index].startsWith("## ") && !lines[index].startsWith("### ")) {
      copy.push(lines[index]);
      index += 1;
    }
    html.push(paragraphs(copy));
  }
  return html.join("");
}

function sectionsFromMarkdown(markdown) {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const title = lines.find((line) => line.startsWith("# "))?.slice(2).trim() || "Day 1 学习路径";
  const intro = [];
  const sections = [];
  let active = null;
  let seenFirstHeading = false;

  lines.forEach((line) => {
    if (line.startsWith("# ")) {
      seenFirstHeading = true;
      return;
    }
    if (line.startsWith("## ")) {
      active = { title: line.slice(3).trim(), blocks: [] };
      sections.push(active);
      return;
    }
    if (seenFirstHeading) {
      if (active) active.blocks.push(line);
      else intro.push(line);
    }
  });
  return { title, intro, sections };
}

function renderSection(section, index) {
  const id = slug(section.title);
  const blocks = section.blocks;
  const isStations = section.title.includes("我是怎样走进");
  const stationParts = [];
  if (isStations) {
    let current = null;
    blocks.forEach((line) => {
      if (line.startsWith("### ")) {
        if (current) stationParts.push(current);
        current = { title: line.slice(4).trim(), lines: [] };
      } else if (current) {
        current.lines.push(line);
      }
    });
    if (current) stationParts.push(current);
  }
  const body = isStations
    ? `<div class="learning-stations">${stationParts.map((station, stationIndex) => `<section class="learning-station"><div class="learning-station-number">${String(stationIndex + 1).padStart(2, "0")}</div><div><h3>${inline(station.title)}</h3><div class="learning-copy">${renderBlocks(station.lines)}</div></div></section>`).join("")}</div>`
    : `<div class="learning-copy">${renderBlocks(blocks)}</div>`;
  const closing = section.title.includes("最终 Reflection") ? " learning-closing" : "";
  return `<section class="learning-section${closing}" id="${id}"><header class="learning-section-head"><span class="learning-section-kicker">${index === 0 ? "Begin here" : `Path ${String(index).padStart(2, "0")}`}</span><h2>${inline(section.title)}</h2></header>${body}</section>`;
}

function renderPath(markdown) {
  const { title, intro, sections } = sectionsFromMarkdown(markdown);
  const introText = intro
    .filter((line) => line.trim() && !line.startsWith("["))
    .map((line) => line.replace(/^>\s*/, ""))
    .join(" ");
  const introSections = sections.slice(0, 1);
  const contentSections = sections.slice(1);
  document.title = "Day 1 学习路径 | Turnpo";
  app.innerHTML = `
    <div class="learning-layout">
      <aside class="learning-side" aria-label="Day 1 学习路径目录">
        <span class="learning-side-kicker">September 2026 · Day 1</span>
        <strong>Financial Management</strong>
        <p>Leo 的长期复习路线：从项目故事，回到可以执行的管理判断。</p>
        <nav>
          ${sections.map((section, index) => `<a href="#${slug(section.title)}"><span>${String(index + 1).padStart(2, "0")}</span>${escapeHtml(section.title)}</a>`).join("")}
        </nav>
      </aside>
      <article class="learning-article">
        <header class="learning-hero">
          <span class="learning-hero-kicker">Personal learning path · Day 1</span>
          <h1>${escapeHtml(title)}</h1>
          <p>${inline(introText)}</p>
          <div class="learning-hero-actions">
            <a href="/emba/">返回 EMBA 课程页 →</a>
            <a href="/emba/reading.html">进入指定阅读 →</a>
          </div>
        </header>
        ${introSections.map((section, index) => `<section class="learning-intro" id="${slug(section.title)}"><span class="learning-section-kicker">${escapeHtml(section.title)}</span><div>${renderBlocks(section.blocks)}</div></section>`).join("")}
        ${contentSections.map((section, index) => renderSection(section, index + 1)).join("")}
      </article>
    </div>
  `;
}

async function init() {
  try {
    const response = await fetch(DAY_ONE_PATH, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    renderPath(await response.text());
  } catch (error) {
    app.innerHTML = `<div class="reading-error"><h1>学习路径暂时无法打开</h1><p>${escapeHtml(error.message || "Unknown error")}</p><a href="/emba/">返回 EMBA</a></div>`;
  }
}

document.querySelector("[data-learning-back]")?.addEventListener("click", () => {
  if (window.history.length > 1) window.history.back();
  else window.location.assign("/emba/");
});

init();
