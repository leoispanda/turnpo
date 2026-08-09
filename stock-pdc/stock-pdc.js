const $ = (selector) => document.querySelector(selector);
let currentRankFlow = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function dayOfWeek(value) {
  const [year, month, day] = String(value || "").split("-").map(Number);
  return [year, month, day].every(Number.isFinite) ? new Date(Date.UTC(year, month - 1, day)).getUTCDay() : null;
}

function isTradingWeekday(value) {
  const weekday = dayOfWeek(value);
  return weekday !== null && weekday !== 0 && weekday !== 6;
}

function formatPct(value, fallback = "--") {
  if (!Number.isFinite(value)) return fallback;
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function pctClass(value) {
  if (!Number.isFinite(value)) return "neutral";
  return value > 0 ? "positive" : value < 0 ? "negative" : "neutral";
}

function shortDate(value) {
  const [, month, day] = String(value || "").split("-");
  return month && day ? `${month}.${day}` : value;
}

function weekdayLabel(value) {
  const weekday = dayOfWeek(value);
  return weekday === null ? "" : ["日", "一", "二", "三", "四", "五", "六"][weekday];
}

function rankMovement(row) {
  if (row.changeType === "NEW") return "新进";
  if (row.changeType === "UP") return `↑${row.previousRank || "-"}`;
  if (row.changeType === "DOWN") return `↓${row.previousRank || "-"}`;
  return "—";
}

function actionLabel(row) {
  const instruction = String(row.frontDeskInstruction || "").replaceAll("_", " ");
  if (instruction) return instruction;
  const status = String(row.status || "");
  if (status === "Strong Watch" || status === "Trial Position") return "买入候选";
  if (status) return "研究观察";
  return "--";
}

function markdownText(value, fallback = "未提供") {
  const text = String(value ?? "").replaceAll("\r", "").trim();
  return text ? text.replaceAll("\n", " ") : fallback;
}

function latestDay(data) {
  const days = (data?.days || []).filter((day) => isTradingWeekday(day.date) && Array.isArray(day.rows) && day.rows.length);
  return days.reduce((latest, day) => (!latest || String(day.date) > String(latest.date) ? day : latest), null);
}

function roleScoresMarkdown(scores) {
  const entries = Object.entries(scores || {}).filter(([, value]) => Number.isFinite(value));
  return entries.length ? entries.map(([role, value]) => `${role}: ${value}`).join("；") : "未提供";
}

function buildTodayMarkdown(data) {
  const day = latestDay(data);
  if (!day) throw new Error("尚无可复制的每日 PDC 数据。");
  const verification = data?.verification || {};
  const verified = verification.status === "VERIFIED";
  const summary = day.summary || {};
  const header = [
    "# Stock PDC 今日信息包",
    "",
    `- 研究日期：${markdownText(day.date)}`,
    `- 导出时间：${new Date().toISOString()}`,
    `- 数据状态：${verified ? "已验证自动 Run" : "历史展示数据（未作为新的自动生成结果）"}`,
    `- 数据来源：${markdownText(data?.sourceKind || day.sourceFile)}`,
    `- Run ID：${markdownText(verification.runId, "未提供")}`,
    `- 展示产物 SHA-256：${markdownText(verification.displaySha256, "未提供")}`,
    "",
    "## 筛选与执行口径",
    "",
    "- 鹰眼固定规则：总市值 > 300 亿人民币；近 60 个交易日收益 > 0。",
    "- 鹰眼仅建立候选池；趋势、量价、突破、过热与风险判断由 PDC 完成。",
    `- 全市场数量：${markdownText(verification.marketCount, "未提供")}`,
    `- 鹰眼通过：${markdownText(verification.candidateCount, "未提供")}`,
    `- PDC 已评分：${markdownText(verification.pdcCount, "未提供")}`,
    `- 当日展示数量：${markdownText(summary.total || day.rows.length)}`,
    "",
    "## 今日 PDC 研究排序",
    ""
  ];
  const rows = day.rows.slice().sort((left, right) => Number(left.rank) - Number(right.rank)).map((row) => [
    `${markdownText(row.rank, "-")}. **${markdownText(row.name || row.ticker)}**（${markdownText(row.ticker)}）`,
    `   - PDC 分数：${markdownText(row.score)}`,
    `   - PDC 状态：${markdownText(row.status)}`,
    `   - 正式操作状态：${markdownText(row.frontDeskInstruction || row.decision?.action)}`,
    `   - 信号日变动：${formatPct(Number.isFinite(row.signalDayChangePct) ? row.signalDayChangePct : row.dayChangePct)}`,
    `   - 角色分数：${roleScoresMarkdown(row.scores || row.research?.scores)}`,
    `   - 核心理由：${markdownText(row.mainReason || row.research?.mainReason)}`,
    `   - 主要风险：${markdownText(row.mainRisk || row.research?.mainRisk)}`
  ].join("\n"));
  return [...header, ...rows, "", "## 使用说明", "", "- 本文件是当天页面中实际展示数据的复制快照，不补造缺失字段。", "- 研究排序不是交易指令；实际操作仅以 PDC 正式操作状态及人工复核为准。", "- 未验证的历史展示数据不得表述为新的自动生成结果。", ""].join("\n");
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("浏览器未允许写入剪贴板。");
}

async function copyTodayMarkdown() {
  const feedback = $("#todayMarkdownFeedback");
  try {
    await copyText(buildTodayMarkdown(currentRankFlow));
    if (feedback) feedback.textContent = "今日 PDC 信息包已生成并复制。";
  } catch (error) {
    if (feedback) feedback.textContent = `复制失败：${error.message}`;
  }
}

function renderVerification(data) {
  const verification = data?.verification || {};
  if (verification.status === "VERIFIED") {
    return `<section class="stock-data-quality"><strong>已验证自动 Run：${escapeHtml(verification.runId || "--")}</strong><p>${escapeHtml(verification.marketCount || "--")} 只全市场股票，鹰眼通过 ${escapeHtml(verification.candidateCount || "--")} 只，PDC 已评分 ${escapeHtml(verification.pdcCount || "--")} 只。</p></section>`;
  }
  return `<section class="stock-data-quality stock-data-quality-partial"><strong>历史展示数据</strong><p>当前时间流用于回顾每日 Top 20；在完成可信全市场 Run 发布前，不应将它表述为新的自动生成结果。</p></section>`;
}

function renderCell(day, rank) {
  const row = (day.rows || []).find((candidate) => Number(candidate.rank) === rank);
  if (!row) return `<div class="stock-rank-cell stock-rank-cell-empty"></div>`;
  const change = Number.isFinite(row.signalDayChangePct) ? row.signalDayChangePct : row.dayChangePct;
  return `<article class="stock-rank-cell stock-price-${pctClass(change)}">
    <div class="stock-name"><h3>${escapeHtml(row.name || row.ticker)}</h3><small>${escapeHtml(row.ticker)}</small></div>
    <span class="stock-day-change ${pctClass(change)}">${escapeHtml(formatPct(change))}</span>
    <span class="stock-change stock-rank-move" title="${escapeHtml(rankMovement(row))}">${escapeHtml(rankMovement(row))}</span>
    <small class="stock-action-label">${escapeHtml(actionLabel(row))}</small>
  </article>`;
}

function renderRankList(data) {
  const list = $("#stockRankList");
  currentRankFlow = data;
  const copyButton = $("#copyTodayMarkdown");
  const days = (data?.days || []).filter((day) => isTradingWeekday(day.date) && Array.isArray(day.rows) && day.rows.length).slice().reverse();
  if (!days.length) {
    if (copyButton) copyButton.disabled = true;
    list.innerHTML = `<section class="stock-empty"><h2>暂无可展示的每日 Top 20</h2><p>请先完成一份通过完整性校验的 Stock PDC Run。</p></section>`;
    return;
  }
  if (copyButton) copyButton.disabled = false;
  const ranks = Array.from({ length: 20 }, (_, index) => index + 1);
  list.innerHTML = `${renderVerification(data)}
    <section class="stock-strategy-note"><h2>每日 Top 20 研究时间流</h2><p>排名是 PDC 研究优先级；“买入候选”只来自引擎的正式操作状态，不能把所有 Top 20 当作买入或持有指令。</p></section>
    <div class="stock-rank-matrix" style="--date-count:${days.length}">
      <div class="stock-matrix-corner"></div>
      ${days.map((day) => `<time class="stock-date-head" datetime="${escapeHtml(day.date)}"><span>${escapeHtml(shortDate(day.date))}</span><small>周${escapeHtml(weekdayLabel(day.date))}</small></time>`).join("")}
      ${ranks.map((rank) => `<div class="stock-rank-axis">#${rank}</div>${days.map((day) => renderCell(day, rank)).join("")}`).join("")}
    </div>`;
}

$("#copyTodayMarkdown")?.addEventListener("click", copyTodayMarkdown);

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function loadPublishedRun() {
  const current = await fetch("/stock-pdc/decision/api/runs/current", { cache: "no-store" });
  if (current.status === 404) return null;
  if (!current.ok) throw new Error(`无法读取已发布 Run (${current.status})`);
  const currentBody = await current.json();
  const run = currentBody?.run;
  if (!run?.displayUrl || !/^[a-f0-9]{64}$/i.test(run.displaySha256 || "")) throw new Error("已发布 Run 缺少展示产物或哈希。");
  const artifact = await fetch(run.displayUrl, { cache: "no-store" });
  if (!artifact.ok) throw new Error(`无法读取已发布展示产物 (${artifact.status})`);
  const displayText = await artifact.text();
  if ((await sha256(displayText)) !== run.displaySha256.toLowerCase()) throw new Error("已发布展示产物的哈希不匹配。");
  const display = JSON.parse(displayText);
  if (display?.runId !== run.id || display?.verification?.status !== "VERIFIED") throw new Error("已发布展示产物未通过 Run 身份校验。");
  display.verification.displaySha256 = run.displaySha256;
  return display;
}

async function loadRankFlow() {
  const published = await loadPublishedRun();
  if (published) return published;
  const response = await fetch("/stock-pdc/rank-flow.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`无法读取历史排名数据 (${response.status})`);
  return response.json();
}

loadRankFlow()
  .then(renderRankList)
  .catch((error) => {
    const list = $("#stockRankList");
    if (list) list.innerHTML = `<section class="stock-empty"><h2>排名数据暂不可用</h2><p>${escapeHtml(error.message)}</p></section>`;
  });
