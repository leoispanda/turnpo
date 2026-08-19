const $ = (selector) => document.querySelector(selector);
let currentRankFlow = null;
let currentDecisionHistory = [];

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

function movementPath(row) {
  if (row.changeType === "NEW") return `未在上一期 -> #${row.rank}`;
  if (row.changeType === "UNCHANGED") return `#${row.previousRank || row.rank} -> #${row.rank}`;
  if (row.changeType === "UP" || row.changeType === "DOWN") return `#${row.previousRank} -> #${row.rank}`;
  return "";
}

function formatValuePct(value, fallback = "--") {
  return Number.isFinite(value) ? `${value.toFixed(2)}%` : fallback;
}

function droppedRankDelta(row) {
  const previousRank = Number.parseInt(row.previousRank, 10);
  return Number.isFinite(previousRank) ? Math.max(1, 21 - previousRank) : null;
}

function droppedMovementPath(row) {
  const delta = droppedRankDelta(row);
  const movement = delta === null ? "跌出 Top 20" : `跌出 Top 20，至少下滑 ${delta} 名`;
  const action = row.exitText ? `，${row.exitText}` : "";
  return `#${row.previousRank || "-"} -> ${movement}${action}`;
}

function signalDayChangeValue(row) {
  return Number.isFinite(row.signalDayChangePct) ? row.signalDayChangePct : row.dayChangePct;
}

function priceMoveClass(value) {
  return `stock-price-${pctClass(value)}`;
}

function rankMoveClass(changeType) {
  return `stock-rank-${String(changeType || "UNCHANGED").toLowerCase()}`;
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

function isDailyTop10Day(day) {
  return String(day?.kind || day?.sourceKind || "").toUpperCase() === "DAILY_TOP10";
}

function dayKindLabel(day) {
  return isDailyTop10Day(day) ? "DAILY_TOP10" : "Top20";
}

function formatScore(value, fallback = "--") {
  return Number.isFinite(value) ? value.toFixed(2) : fallback;
}

function formatPlainPct(value, fallback = "--") {
  if (!Number.isFinite(value)) return fallback;
  return `${value.toFixed(Number.isInteger(value) ? 0 : 2)}%`;
}

function roleScoresMarkdown(scores) {
  const entries = Object.entries(scores || {}).filter(([, value]) => Number.isFinite(value));
  return entries.length ? entries.map(([role, value]) => `${role}: ${value}`).join("；") : "未提供";
}

function buildTodayMarkdown(data) {
  const day = latestDay(data);
  if (!day) throw new Error("尚无可复制的每日 PDC 数据。");
  const dailyTop10 = isDailyTop10Day(day);
  const verification = data?.verification || {};
  const verified = verification.status === "VERIFIED";
  const summary = day.summary || {};
  const header = [
    "# Stock PDC 今日信息包",
    "",
    `- 研究日期：${markdownText(day.date)}`,
    `- 榜单类型：${dailyTop10 ? "DAILY_TOP10 双模型共识" : "Top20 研究排序"}`,
    `- 导出时间：${new Date().toISOString()}`,
    `- 数据状态：${dailyTop10 ? "研究清单（未连接券商、不自动下单）" : verified ? "已验证自动 Run" : "历史展示数据（未作为新的自动生成结果）"}`,
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
    ...(dailyTop10 ? [
      `- 投资敞口：${formatPlainPct(Number(summary.investedPct))}`,
      `- 现金储备：${formatPlainPct(Number(summary.cashReservePct))}`,
      `- 终审状态：${markdownText(summary.degradationStatus, "未提供")}`
    ] : []),
    "",
    `## 今日 ${dailyTop10 ? "DAILY_TOP10" : "PDC"} 研究排序`,
    ""
  ];
  const rows = day.rows.slice().sort((left, right) => Number(left.rank) - Number(right.rank)).map((row) => {
    if (dailyTop10) {
      return [
        `${markdownText(row.rank, "-")}. **${markdownText(row.name || row.ticker)}**（${markdownText(row.ticker)}）`,
        `   - 共识分：${markdownText(row.consensusTotal ?? row.score)}`,
        `   - Codex / Claude：${markdownText(row.seatTotals?.sol)} / ${markdownText(row.seatTotals?.claude)}`,
        `   - 分歧：${markdownText(row.totalDisagreement)}`,
        `   - 行业：${markdownText(row.sector)}`,
        `   - 风险分 / 过热分：${markdownText(row.riskScore)} / ${markdownText(row.overheatScore)}`,
        `   - 止损距离 / 目标仓位：${formatPlainPct(row.stopDistancePct)} / ${formatPlainPct(row.allocation_pct)}`,
        `   - 操作状态：${markdownText(row.action || row.frontDeskInstruction || row.status)}`
      ].join("\n");
    }
    return [
      `${markdownText(row.rank, "-")}. **${markdownText(row.name || row.ticker)}**（${markdownText(row.ticker)}）`,
      `   - PDC 分数：${markdownText(row.score)}`,
      `   - PDC 状态：${markdownText(row.status)}`,
      `   - 正式操作状态：${markdownText(row.frontDeskInstruction || row.decision?.action)}`,
      `   - 信号日变动：${formatPct(Number.isFinite(row.signalDayChangePct) ? row.signalDayChangePct : row.dayChangePct)}`,
      `   - 角色分数：${roleScoresMarkdown(row.scores || row.research?.scores)}`,
      `   - 核心理由：${markdownText(row.mainReason || row.research?.mainReason)}`,
      `   - 主要风险：${markdownText(row.mainRisk || row.research?.mainRisk)}`
    ].join("\n");
  });
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
  const latest = latestDay(data);
  if (isDailyTop10Day(latest)) {
    const summary = latest.summary || {};
    const source = data?.dailyTop10?.source || data?.source || {};
    const auditPage = latest.auditPage || source.auditPage || "";
    const auditLink = auditPage
      ? ` <a href="${escapeHtml(auditPage)}" target="_blank" rel="noreferrer">查看审计流程</a>`
      : "";
    return `<section class="stock-data-quality stock-data-quality-daily" aria-label="DAILY_TOP10 研究清单状态"><strong>${escapeHtml(latest.date)}：DAILY_TOP10 ${escapeHtml(summary.total || latest.rows.length)} 个席位</strong><p>双模型共识研究清单；投资 ${escapeHtml(formatPlainPct(Number(summary.investedPct)))}、现金 ${escapeHtml(formatPlainPct(Number(summary.cashReservePct)))}。${escapeHtml(summary.degradationStatus || "")}${auditLink}</p></section>`;
  }
  if (verification.status === "VERIFIED") {
    return `<section class="stock-data-quality"><strong>已验证自动 Run：${escapeHtml(verification.runId || "--")}</strong><p>${escapeHtml(verification.marketCount || "--")} 只全市场股票，鹰眼通过 ${escapeHtml(verification.candidateCount || "--")} 只，PDC 已评分 ${escapeHtml(verification.pdcCount || "--")} 只。</p></section>`;
  }
  return `<section class="stock-data-quality stock-data-quality-partial"><strong>历史展示数据</strong><p>当前时间流用于回顾每日 Top 20；在完成可信全市场 Run 发布前，不应将它表述为新的自动生成结果。</p></section>`;
}

function renderRankCell(day, rank) {
  const row = (day.rows || []).find((candidate) => Number(candidate.rank) === rank);
  if (!row) return `<div class="stock-rank-cell stock-rank-cell-empty" aria-label="${escapeHtml(day.date)} #${rank} empty"></div>`;
  if (isDailyTop10Day(day)) {
    const score = Number.isFinite(row.consensusTotal) ? row.consensusTotal : row.score;
    const action = row.action || row.frontDeskInstruction || row.status || "--";
    const detail = [
      `风险 ${formatScore(row.riskScore)}`,
      `过热 ${formatScore(row.overheatScore)}`,
      `止损 ${formatPlainPct(row.stopDistancePct)}`,
      `分歧 ${formatScore(row.totalDisagreement)}`
    ].join(" · ");
    const movement = `${day.date} DAILY_TOP10 #${row.rank} ${row.name || row.ticker}`;
    return `
      <article class="stock-rank-cell stock-daily-top10-cell stock-price-neutral" aria-label="${escapeHtml(movement)}，共识分 ${escapeHtml(formatScore(score))}，行业 ${escapeHtml(row.sector || "未分组")}，目标仓位 ${escapeHtml(formatPlainPct(row.allocation_pct))}">
        <div class="stock-name">
          <h3>${escapeHtml(row.name || row.ticker)}</h3>
          <small>${escapeHtml(row.ticker)}</small>
          <small class="stock-daily-sector">${escapeHtml(row.sector || "未分组")} · ${escapeHtml(formatPlainPct(row.allocation_pct))}</small>
        </div>
        <span class="stock-daily-top10-score">${escapeHtml(formatScore(score))}</span>
        <span class="stock-daily-top10-action">${escapeHtml(action)}</span>
        <small class="stock-action-label">${escapeHtml(detail)}</small>
      </article>
    `;
  }
  const dayChange = signalDayChangeValue(row);
  const movement = movementPath(row);
  return `
    <article class="stock-rank-cell ${priceMoveClass(dayChange)}" aria-label="${escapeHtml(day.date)} #${rank} ${escapeHtml(row.name || row.ticker)} ${escapeHtml(movement)} 当日涨跌幅 ${escapeHtml(formatPct(dayChange, "unknown"))}">
      <div class="stock-name">
        <h3>${escapeHtml(row.name || row.ticker)}</h3>
        <small>${escapeHtml(row.ticker)}</small>
      </div>
      <span class="stock-day-change ${pctClass(dayChange)}">${escapeHtml(formatPct(dayChange))}</span>
      <span class="stock-change stock-rank-move ${rankMoveClass(row.changeType)}" role="img" aria-label="${escapeHtml(movement)}" title="${escapeHtml(movement)}">
        <span class="stock-change-arrow" aria-hidden="true"></span>
      </span>
      <small class="stock-action-label">${escapeHtml(actionLabel(row))}</small>
    </article>
  `;
}

function renderDroppedCell(day, index) {
  const row = (day.dropped || [])[index] || null;
  if (!row) return `<div class="stock-rank-cell stock-rank-cell-empty" aria-label="${escapeHtml(day.date)} dropped ${index + 1} empty"></div>`;
  const dayChange = signalDayChangeValue(row);
  const movement = droppedMovementPath(row);
  return `
    <article class="stock-rank-cell ${priceMoveClass(dayChange)}" aria-label="${escapeHtml(day.date)} dropped ${index + 1} ${escapeHtml(row.name || row.ticker)} ${escapeHtml(movement)} 当日涨跌幅 ${escapeHtml(formatPct(dayChange, "unknown"))}">
      <div class="stock-name">
        <h3>${escapeHtml(row.name || row.ticker)}</h3>
        <small>${escapeHtml(row.ticker)}</small>
      </div>
      <span class="stock-day-change ${pctClass(dayChange)}">${escapeHtml(formatPct(dayChange))}</span>
      <span class="stock-change stock-rank-move stock-rank-dropped" role="img" aria-label="${escapeHtml(movement)}" title="${escapeHtml(movement)}">
        <span class="stock-change-arrow" aria-hidden="true"></span>
      </span>
    </article>
  `;
}

function renderPortfolioCell(day) {
  const portfolio = day.portfolio || {};
  const cumulative = portfolio.cumulativeReturnPct;
  const daily = portfolio.dailyReturnPct;
  if (!Number.isFinite(cumulative)) {
    return `<div class="stock-rank-cell stock-rank-cell-empty stock-portfolio-cell" aria-label="${escapeHtml(day.date)} portfolio empty"></div>`;
  }
  return `
    <article class="stock-rank-cell stock-portfolio-cell ${priceMoveClass(daily)}" aria-label="${escapeHtml(day.date)} 初始100组合累计 ${escapeHtml(formatPct(cumulative))} 下一交易日 ${escapeHtml(formatPct(daily))}">
      <div class="stock-name">
        <h3>${escapeHtml(formatPct(cumulative))}</h3>
        <small>100% -> ${escapeHtml(formatValuePct(portfolio.valuePct))}</small>
      </div>
      <span class="stock-day-change neutral">${escapeHtml(portfolio.investedCount || 0)} / 20</span>
      <div class="stock-change stock-performance-change ${pctClass(daily)}" aria-label="${escapeHtml(day.date)} portfolio daily return">
        <strong>${escapeHtml(formatPct(daily))}</strong>
      </div>
    </article>
  `;
}

function renderBenchmarkCell(day) {
  const benchmark = day.benchmark || {};
  const cumulative = benchmark.cumulativeReturnPct;
  const daily = benchmark.dailyReturnPct;
  if (!Number.isFinite(cumulative)) {
    return `<div class="stock-rank-cell stock-rank-cell-empty stock-portfolio-cell" aria-label="${escapeHtml(day.date)} benchmark empty"></div>`;
  }
  return `
    <article class="stock-rank-cell stock-portfolio-cell ${priceMoveClass(daily)}" aria-label="${escapeHtml(day.date)} 大盘累计 ${escapeHtml(formatPct(cumulative))} 下一交易日 ${escapeHtml(formatPct(daily))}">
      <div class="stock-name">
        <h3>${escapeHtml(formatPct(cumulative))}</h3>
        <small>${escapeHtml(benchmark.ticker || "CSI300ETF")} ${escapeHtml(formatValuePct(benchmark.valuePct))}</small>
      </div>
      <span class="stock-day-change neutral">${escapeHtml(benchmark.returnDate || "--")}</span>
      <div class="stock-change stock-performance-change ${pctClass(daily)}" aria-label="${escapeHtml(day.date)} benchmark daily return">
        <strong>${escapeHtml(formatPct(daily))}</strong>
      </div>
    </article>
  `;
}

function latestPortfolioSummary(data, days) {
  const portfolioDate = data?.portfolio?.daily?.at(-1)?.date;
  const latest = days.find((day) => day.date === portfolioDate)?.portfolio
    || days.find((day) => day.portfolio)?.portfolio
    || null;
  if (!latest) return "";
  return `
    <div class="stock-portfolio-summary" aria-label="Stock PDC equal weight portfolio return">
      <span>初始 100%</span>
      <strong class="${pctClass(latest.cumulativeReturnPct)}">${escapeHtml(formatPct(latest.cumulativeReturnPct))}</strong>
      <small>截至 ${escapeHtml(latest.returnDate || latest.date)}，当前 ${escapeHtml(formatValuePct(latest.valuePct))}，次日 ${escapeHtml(formatPct(latest.dailyReturnPct))}</small>
    </div>
  `;
}

function renderStrategySummary(data) {
  const strategy = data?.strategy;
  const latest = latestDay(data);
  if (isDailyTop10Day(latest)) {
    const summary = latest.summary || {};
    return `
      <section class="stock-strategy-note stock-strategy-note-daily" aria-label="DAILY_TOP10 时间流说明">
        <h2>DAILY_TOP10 · 双模型时间流</h2>
        <p>最新一列是两模型共同完成的每日 10 席研究清单；旧日期仍保留 Top20 历史排名。所有数值来自冻结审计产物，不连接券商、不自动下单。</p>
        <div class="stock-strategy-meta">
          <span>投资 ${escapeHtml(formatPlainPct(Number(summary.investedPct)))}</span>
          <span>现金 ${escapeHtml(formatPlainPct(Number(summary.cashReservePct)))}</span>
          <span>行业上限 ${escapeHtml(summary.sectorCapStatus || "未提供")}</span>
          <span>Run ${escapeHtml(data?.dailyTop10?.source?.runId || data?.source?.runId || "--")}</span>
        </div>
      </section>
    `;
  }
  if (!strategy) return "";
  return `
    <section class="stock-strategy-note" aria-label="Stock PDC strategy rule">
      <h2>Top20 Rotation</h2>
      <p>鹰眼雷达先筛候选，PDC 只做排序。最终决策只看当日 Top 20，全部委员分数仅保留用于未来调权和复盘。</p>
    </section>
  `;
}

function renderDataQualityNotice(days) {
  const latest = days[0];
  if (!latest) return "";
  const candidateCount = latest.rows.length;
  if (isDailyTop10Day(latest)) {
    const summary = latest.summary || {};
    return `
      <section class="stock-data-quality stock-data-quality-daily" aria-label="当前 DAILY_TOP10 数据状态">
        <strong>${escapeHtml(latest.date)}：DAILY_TOP10 · ${escapeHtml(candidateCount)} / ${escapeHtml(summary.total || candidateCount)} 个席位</strong>
        <p>每格显示：共识分、行业、目标仓位，以及风险 / 过热 / 止损 / 分歧摘要。${escapeHtml(summary.degradationStatus || "")}</p>
      </section>
    `;
  }
  const missingSlots = Math.max(0, 20 - candidateCount);
  const returnPending = !Number.isFinite(latest.portfolio?.cumulativeReturnPct);
  return `
    <section class="stock-data-quality ${candidateCount < 20 ? "stock-data-quality-partial" : ""}" aria-label="当前榜单数据状态">
      <strong>${escapeHtml(latest.date)}：${candidateCount} / 20 个研究席位</strong>
      <p>${candidateCount < 20
        ? `当日只发布 ${candidateCount} 个 PDC 榜单席位，余下 ${missingSlots} 个席位保持为空，不补位。`
        : "当日候选池已达到 20 个研究席位。"}${returnPending ? " 下一交易日收益尚未生成。" : ""}</p>
    </section>
  `;
}

function renderPublishedDecisionHistory() {
  const days = Array.isArray(currentDecisionHistory) ? currentDecisionHistory : [];
  if (!days.length) return "";
  return `
    <section class="stock-published-decisions" aria-label="已发布 PDC 决策历史">
      <div class="stock-published-head">
        <div>
          <h2>最终 PDC 决策</h2>
          <p>由今日决策页发布；每个日期保留一份不可覆盖的研究记录。</p>
        </div>
        <a href="/stock-pdc/decision/">生成新决策</a>
      </div>
      <div class="stock-published-history">
        ${days.map((day) => `
          <article class="stock-published-day">
            <time datetime="${escapeHtml(day.date)}">${escapeHtml(day.date)}</time>
            <span>${escapeHtml(day.model || "已发布 Run")}</span>
            <div>
              ${(day.decisions || []).map((decision) => `
                <p><strong>#${escapeHtml(decision.rank)}</strong> ${escapeHtml(decision.name || decision.ticker)} <small>${escapeHtml(decision.ticker)}</small></p>
              `).join("") || "<p>没有候选通过本次风险闸门。</p>"}
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderRankList(data) {
  const list = $("#stockRankList");
  if (!list) return;
  currentRankFlow = data;
  const copyButton = $("#copyTodayMarkdown");
  const days = (data?.days || [])
    .filter((day) => isTradingWeekday(day.date) && Array.isArray(day.rows) && day.rows.length)
    .slice()
    .sort((left, right) => String(right.date).localeCompare(String(left.date)));
  if (!days.length) {
    if (copyButton) copyButton.disabled = true;
    list.innerHTML = `<section class="stock-empty"><h2>暂无可展示的每日 Top 20</h2><p>请先完成一份通过完整性校验的 Stock PDC Run。</p></section>`;
    return;
  }
  if (copyButton) copyButton.disabled = false;
  const ranks = Array.from({ length: 20 }, (_, index) => index + 1);
  const droppedSlotCount = Math.max(10, ...days.map((day) => (day.dropped || []).length));
  const droppedSlots = Array.from({ length: droppedSlotCount }, (_, index) => index);
  list.innerHTML = `${renderVerification(data)}
    ${renderStrategySummary(data)}
    ${renderDataQualityNotice(days)}
    ${renderPublishedDecisionHistory()}
    <div class="stock-rank-matrix" style="--date-count:${days.length}">
      <div class="stock-matrix-corner" aria-hidden="true"></div>
      ${days.map((day) => `<time class="stock-date-head ${isDailyTop10Day(day) ? "stock-date-head-daily" : ""}" datetime="${escapeHtml(day.date)}" title="${escapeHtml(day.date)}"><span>${escapeHtml(shortDate(day.date))}</span><small>${escapeHtml(dayKindLabel(day))} · ${escapeHtml(weekdayLabel(day.date))}</small></time>`).join("")}
      ${ranks.map((rank) => `<div class="stock-rank-axis">#${rank}</div>${days.map((day) => renderRankCell(day, rank)).join("")}`).join("")}
      ${droppedSlots.map((index) => `<div class="stock-rank-axis stock-rank-axis-dropped">出${index + 1}</div>${days.map((day) => renderDroppedCell(day, index)).join("")}`).join("")}
      <div class="stock-rank-axis stock-rank-axis-return">收益</div>
      ${days.map((day) => renderPortfolioCell(day)).join("")}
      <div class="stock-rank-axis stock-rank-axis-return">大盘</div>
      ${days.map((day) => renderBenchmarkCell(day)).join("")}
    </div>
    ${latestPortfolioSummary(data, days)}`;
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

function nonEmptyFields(value) {
  return Object.fromEntries(Object.entries(value || {}).filter(([, field]) => field !== null && field !== undefined && field !== ""));
}

function mergePublishedDay(baseDay, publishedDay) {
  if (!baseDay) return { ...publishedDay, rows: (publishedDay.rows || []).map((row) => ({ ...row })) };
  const baseByTicker = new Map((baseDay.rows || []).map((row) => [String(row.ticker || "").toUpperCase(), row]));
  const baseByRank = new Map((baseDay.rows || []).map((row) => [Number(row.rank), row]));
  const rows = (publishedDay.rows || []).map((row) => {
    const base = baseByTicker.get(String(row.ticker || "").toUpperCase()) || baseByRank.get(Number(row.rank));
    return base ? { ...base, ...nonEmptyFields(row) } : { ...row };
  });
  return { ...baseDay, ...publishedDay, rows };
}

function mergePublishedRun(historical, published) {
  const daysByDate = new Map((historical.days || []).map((day) => [String(day.date), day]));
  (published.days || []).filter((day) => isTradingWeekday(day.date) && Array.isArray(day.rows) && day.rows.length).forEach((day) => {
    const date = String(day.date);
    daysByDate.set(date, mergePublishedDay(daysByDate.get(date), day));
  });
  const days = [...daysByDate.values()].sort((left, right) => String(left.date).localeCompare(String(right.date)));
  return {
    ...historical,
    ...published,
    dates: days.map((day) => day.date),
    days,
    latestDate: days.at(-1)?.date || historical.latestDate
  };
}

function mergeDailyTop10(historical, dailyTop10) {
  const daysByDate = new Map((historical.days || []).map((day) => [String(day.date), day]));
  (dailyTop10?.days || [])
    .filter((day) => isTradingWeekday(day.date) && Array.isArray(day.rows) && day.rows.length)
    .forEach((day) => {
      const normalized = {
        ...day,
        kind: "DAILY_TOP10",
        sourceFile: day.sourceFile || dailyTop10?.source?.selectionFile || "",
        auditPage: dailyTop10?.source?.auditPage || ""
      };
      // A DAILY_TOP10 decision is the more specific record for that date. It
      // replaces a same-date legacy Top20 column instead of creating two
      // indistinguishable date headers in the timeline.
      daysByDate.set(String(day.date), normalized);
    });
  const days = [...daysByDate.values()].sort((left, right) => String(left.date).localeCompare(String(right.date)));
  return {
    ...historical,
    dailyTop10,
    dates: days.map((day) => day.date),
    days,
    latestDate: days.at(-1)?.date || historical.latestDate
  };
}

async function loadDecisionHistory() {
  const response = await fetch("/stock-pdc/decision/api/history", { cache: "no-store" }).catch(() => null);
  if (!response?.ok) return [];
  const body = await response.json().catch(() => ({}));
  return Array.isArray(body.days) ? body.days : [];
}

async function loadDailyTop10() {
  const response = await fetch("/stock-pdc/daily-top10.json", { cache: "no-store" }).catch(() => null);
  if (!response || response.status === 404 || !response.ok) return null;
  return response.json().catch(() => null);
}

async function loadRankFlow() {
  const response = await fetch("/stock-pdc/rank-flow.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`无法读取历史排名数据 (${response.status})`);
  const historical = await response.json();
  const published = await loadPublishedRun().catch(() => null);
  const merged = published ? mergePublishedRun(historical, published) : historical;
  const dailyTop10 = await loadDailyTop10();
  return dailyTop10 ? mergeDailyTop10(merged, dailyTop10) : merged;
}

Promise.all([loadRankFlow(), loadDecisionHistory()])
  .then(([data, history]) => {
    currentDecisionHistory = history;
    renderRankList(data);
  })
  .catch((error) => {
    const list = $("#stockRankList");
    if (list) list.innerHTML = `<section class="stock-empty"><h2>排名数据暂不可用</h2><p>${escapeHtml(error.message)}</p></section>`;
  });
