const STOCK_ACCESS_KEY = "turnpo:stock-pdc-access";
const STOCK_PASSWORD = "emba2026";
const state = {
  accessGranted: false,
  data: null,
  dailyTop10: null,
  decisionHistory: []
};

const $ = (selector) => document.querySelector(selector);

function visibleDays() {
  return (state.data?.days || [])
    .filter((day) => Array.isArray(day.rows) && day.rows.length)
    .filter((day) => isTradingWeekday(day.date))
    .slice()
    .reverse();
}

function dateParts(value) {
  const [year, month, day] = String(value || "").split("-").map((part) => Number.parseInt(part, 10));
  return [year, month, day].every(Number.isFinite) ? { year, month, day } : null;
}

function dayOfWeek(value) {
  const parts = dateParts(value);
  return parts ? new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay() : null;
}

function isTradingWeekday(value) {
  const weekday = dayOfWeek(value);
  return weekday !== null && weekday !== 0 && weekday !== 6;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function movementPath(row) {
  if (row.changeType === "NEW") return `未在上一期 -> #${row.rank}`;
  if (row.changeType === "UNCHANGED") return `#${row.previousRank || row.rank} -> #${row.rank}`;
  if (row.changeType === "UP") return `#${row.previousRank} -> #${row.rank}`;
  if (row.changeType === "DOWN") return `#${row.previousRank} -> #${row.rank}`;
  return "";
}

function pctClass(value) {
  if (!Number.isFinite(value)) return "neutral";
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

function formatPct(value, fallback = "--") {
  if (!Number.isFinite(value)) return fallback;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatValuePct(value, fallback = "--") {
  return Number.isFinite(value) ? `${value.toFixed(2)}%` : fallback;
}

function latestDailyTop10(data) {
  const days = (data?.days || [])
    .filter((day) => isTradingWeekday(day.date) && Array.isArray(day.rows) && day.rows.length)
    .slice()
    .sort((left, right) => String(right.date).localeCompare(String(left.date)));
  return days[0] || null;
}

function renderDailyTop10Panel() {
  const panel = $("#stockDailyTop10Panel");
  if (!panel) return;
  const day = latestDailyTop10(state.dailyTop10);
  if (!day) {
    panel.innerHTML = "";
    return;
  }
  const summary = day.summary || {};
  const rows = day.rows.slice().sort((left, right) => Number(left.rank) - Number(right.rank));
  panel.innerHTML = `
    <div class="stock-daily-top10-head">
      <div>
        <h2>今日 DAILY_TOP10</h2>
        <p>双模型共识研究清单；仅供研究与人工复核，不连接券商、不自动下单。</p>
      </div>
      <time datetime="${escapeHtml(day.date)}">${escapeHtml(day.date)}</time>
    </div>
    <div class="stock-daily-top10-summary" aria-label="DAILY_TOP10 summary">
      <span>投资 ${escapeHtml(formatValuePct(Number(summary.investedPct)))}</span>
      <span>现金 ${escapeHtml(formatValuePct(Number(summary.cashReservePct)))}</span>
      <span>平均分 ${escapeHtml(Number.isFinite(summary.avgScore) ? summary.avgScore.toFixed(2) : "--")}</span>
      <span>状态 ${escapeHtml(summary.degradationStatus || "NONE")}</span>
    </div>
    <div class="stock-daily-top10-grid">
      ${rows.map((row) => `
        <article class="stock-daily-top10-card" aria-label="${escapeHtml(`${row.rank} ${row.name || row.ticker}`)}">
          <div>
            <small>#${escapeHtml(row.rank)} · ${escapeHtml(row.ticker)}</small>
            <h3>${escapeHtml(row.name || row.ticker)}</h3>
          </div>
          <strong>${escapeHtml(Number.isFinite(row.consensusTotal) ? row.consensusTotal.toFixed(2) : "--")}</strong>
          <p>${escapeHtml(row.sector || "未分组")} · 目标仓位 ${escapeHtml(formatValuePct(Number(row.allocation_pct), "0.00%"))}</p>
          <span class="stock-daily-top10-action">${escapeHtml(row.frontDeskInstruction || row.status || "研究观察")}</span>
        </article>
      `).join("")}
    </div>
  `;
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

function shortDate(value) {
  const [, month = "", day = ""] = String(value || "").split("-");
  return month && day ? `${month}.${day}` : value;
}

function weekdayLabel(value) {
  const weekday = dayOfWeek(value);
  if (weekday === null) return "";
  return ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][weekday];
}

function dayFlowUrl(day) {
  const audit = day?.audit || {};
  if (audit.flowUrl) return String(audit.flowUrl);
  if (audit.runtimeMode !== "DAILY_TOP10" || !audit.runId) return "";
  return `/stock-pdc/runs/${encodeURIComponent(audit.runId)}/daily_top10_flow.html`;
}

function dayRunTimestamp(day) {
  const audit = day?.audit || {};
  const raw = audit.generatedAt || audit.frozenAt
    || (day?.date === state.data?.latestDate ? state.data?.generatedAt : "");
  if (!raw) return "";
  const rawText = String(raw);
  const timezone = /(?:Z|\+00:00)$/.test(rawText) ? " UTC" : "";
  return `${rawText.replace("T", " ").replace(/\.\d+/, "").slice(0, 16)}${timezone}`;
}

function dayModeLabel(day) {
  return day?.audit?.runtimeMode === "DAILY_TOP10" ? "DAILY_TOP10" : "";
}

function rowByRank(day, rank) {
  return (day.rows || []).find((row) => Number(row.rank) === rank) || null;
}

function renderDayChange(row) {
  const value = signalDayChangeValue(row);
  return `<span class="stock-day-change ${pctClass(value)}">${formatPct(value)}</span>`;
}

function renderDroppedDayChange(row) {
  const value = signalDayChangeValue(row);
  return `<span class="stock-day-change ${pctClass(value)}">${formatPct(value)}</span>`;
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

function renderRankCell(day, rank) {
  const row = rowByRank(day, rank);
  if (!row) return `<div class="stock-rank-cell stock-rank-cell-empty" aria-label="${escapeHtml(day.date)} #${rank} empty"></div>`;
  const dayChange = signalDayChangeValue(row);
  return `
    <article class="stock-rank-cell ${priceMoveClass(dayChange)}" aria-label="${escapeHtml(day.date)} #${rank} ${escapeHtml(row.name)} ${escapeHtml(movementPath(row))} 当日涨跌幅 ${escapeHtml(formatPct(dayChange, "unknown"))}">
      <div class="stock-name">
        <h3>${escapeHtml(row.name)}</h3>
        <small>${escapeHtml(row.ticker)}</small>
      </div>
      ${renderDayChange(row)}
      <span class="stock-change stock-rank-move ${rankMoveClass(row.changeType)}" role="img" aria-label="${escapeHtml(movementPath(row))}">
        <span class="stock-change-arrow" aria-hidden="true"></span>
      </span>
    </article>
  `;
}

function renderDroppedCell(day, index) {
  const row = (day.dropped || [])[index] || null;
  if (!row) return `<div class="stock-rank-cell stock-rank-cell-empty" aria-label="${escapeHtml(day.date)} dropped ${index + 1} empty"></div>`;
  const dayChange = signalDayChangeValue(row);
  return `
    <article class="stock-rank-cell ${priceMoveClass(dayChange)}" aria-label="${escapeHtml(day.date)} dropped ${index + 1} ${escapeHtml(row.name)} ${escapeHtml(droppedMovementPath(row))} 当日涨跌幅 ${escapeHtml(formatPct(dayChange, "unknown"))}">
      <div class="stock-name">
        <h3>${escapeHtml(row.name)}</h3>
        <small>${escapeHtml(row.ticker)}</small>
      </div>
      ${renderDroppedDayChange(row)}
      <span class="stock-change stock-rank-move stock-rank-dropped" role="img" aria-label="${escapeHtml(droppedMovementPath(row))}">
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

function latestPortfolioSummary(days) {
  const latest = days.find((day) => day.date === state.data?.portfolio?.daily?.at(-1)?.date)?.portfolio
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

function renderStrategySummary() {
  const strategy = state.data?.strategy;
  if (!strategy) return "";
  const latestDay = visibleDays()[0] || null;
  const flowUrl = dayFlowUrl(latestDay);
  const flowTimestamp = dayRunTimestamp(latestDay);
  return `
    <section class="stock-strategy-note" aria-label="Stock PDC strategy rule">
      <h2>Top20 Rotation</h2>
      <p>鹰眼雷达先筛候选，PDC 只做排序。最终决策只看当日 Top 20，全部委员分数仅保留用于未来调权和复盘。</p>
      <div class="stock-strategy-meta">
        <span>${escapeHtml(strategy.candidateStage || "Hawkeye Radar")}</span>
        <span>${escapeHtml(strategy.rankingStage || "PDC ranking")}</span>
        <span>${escapeHtml(strategy.exitRule || "Top 20 exit review")}</span>
      </div>
      ${flowUrl ? `<div class="stock-flow-audit-row"><span>最新 DAILY_TOP10 · ${escapeHtml(latestDay.date)}${flowTimestamp ? ` · 记录 ${escapeHtml(flowTimestamp)}` : ""}</span><a href="${escapeHtml(flowUrl)}" target="_blank" rel="noreferrer">查看完整流程</a></div>` : ""}
    </section>
  `;
}

function actionRows(action) {
  const rows = state.data?.actions?.rows;
  return Array.isArray(rows) ? rows.filter((row) => row.action === action) : [];
}

function actionCount(action) {
  const counts = state.data?.actions?.counts;
  const key = action.toLowerCase();
  return Number.isFinite(counts?.[key]) ? counts[key] : actionRows(action).length;
}

function actionDetail(row) {
  if (row.sourceInstruction === "HOLD_DROPPED_UP_DAY") return "上涨不卖";
  if (row.action === "BUY") return "通过完整 PDC 买入闸门";
  if (row.action === "HOLD") return "确认持仓，趋势仍完整";
  if (row.action === "SELL") return "确认持仓，卖出复核";
  return row.sourceInstruction || "已通过行动合约核验";
}

function renderActionRows(rows, emptyText) {
  if (!rows.length) return `<p class="stock-action-empty">${escapeHtml(emptyText)}</p>`;
  return `
    <ul class="stock-action-list">
      ${rows.map((row) => `
        <li class="stock-action-row">
          <div>
            <strong>${escapeHtml(row.name || row.ticker)}</strong>
            <span>${escapeHtml(row.ticker)}</span>
          </div>
          <small>${escapeHtml(actionDetail(row))}</small>
        </li>
      `).join("")}
    </ul>
  `;
}

function renderActionPanel() {
  const panel = $("#stockActionPanel");
  if (!panel) return;
  const actions = state.data?.actions;
  const latestDate = actions?.latestDate || state.data?.latestDate || "--";
  if (!actions || !Array.isArray(actions.rows)) {
    panel.innerHTML = `
      <div class="stock-action-header">
        <div><h2>最新 PDC 行动</h2><p>行动数据尚未生成；排名仅供研究。</p></div>
        <time>${escapeHtml(latestDate)}</time>
      </div>
    `;
    return;
  }
  const groups = [
    { action: "BUY", title: "买入", empty: "今日没有通过完整 PDC 买入闸门的标的。" },
    { action: "HOLD", title: "保留", empty: "当前没有需要保留的确认持仓。" },
    { action: "SELL", title: "卖出复核", empty: "当前没有需要卖出复核的确认持仓。" }
  ];
  panel.innerHTML = `
    <div class="stock-action-header">
      <div>
        <h2>最新 PDC 行动</h2>
        <p>每个已验证收盘日都会显示；即使结果与昨天相同。研究排名不会自动变成买卖行动。</p>
      </div>
      <time datetime="${escapeHtml(latestDate)}">${escapeHtml(latestDate)}</time>
    </div>
    <div class="stock-action-counts" aria-label="最新行动数量">
      ${groups.map((group) => `<span class="stock-action-count stock-action-${group.action.toLowerCase()}">${escapeHtml(group.title)} <strong>${actionCount(group.action)}</strong></span>`).join("")}
    </div>
    <div class="stock-action-grid">
      ${groups.map((group) => `
        <section class="stock-action-group stock-action-${group.action.toLowerCase()}" aria-label="${escapeHtml(group.title)}">
          <h3>${escapeHtml(group.title)} <span>${actionCount(group.action)}</span></h3>
          ${renderActionRows(actionRows(group.action), group.empty)}
        </section>
      `).join("")}
    </div>
  `;
}

function renderPublishedDecisionHistory() {
  const days = Array.isArray(state.decisionHistory) ? state.decisionHistory : [];
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
            <span>${escapeHtml(day.model || "GPT mini")}</span>
            <div>
              ${(day.decisions || []).map((decision) => `
                <p><strong>#${escapeHtml(decision.rank)}</strong> ${escapeHtml(decision.name)} <small>${escapeHtml(decision.ticker)}</small></p>
              `).join("") || "<p>没有候选通过本次风险闸门。</p>"}
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderRankList() {
  const list = $("#stockRankList");
  if (!list) return;
  const days = visibleDays();
  if (!days.length) {
    list.innerHTML = `<div class="stock-empty">No Stock PDC data yet.</div>`;
    return;
  }
  const ranks = Array.from({ length: 20 }, (_, index) => index + 1);
  const droppedSlots = Array.from({ length: 10 }, (_, index) => index);
  list.innerHTML = `
    ${renderStrategySummary()}
    ${renderPublishedDecisionHistory()}
      <div class="stock-rank-matrix" style="--date-count: ${days.length}">
      <div class="stock-matrix-corner" aria-hidden="true"></div>
      ${days.map((day) => `
        <time class="stock-date-head" datetime="${escapeHtml(day.date)}" title="${escapeHtml(`${day.date}${dayRunTimestamp(day) ? ` · 记录 ${dayRunTimestamp(day)}` : ""}`)}">
          <span>${escapeHtml(shortDate(day.date))}</span>
          <small>${escapeHtml([dayModeLabel(day), weekdayLabel(day.date)].filter(Boolean).join(" · "))}</small>
          ${dayRunTimestamp(day) ? `<small class="stock-date-timestamp">${escapeHtml(dayRunTimestamp(day))}</small>` : ""}
          ${dayFlowUrl(day) ? `<a class="stock-date-flow-link" href="${escapeHtml(dayFlowUrl(day))}" target="_blank" rel="noreferrer">查看流程</a>` : ""}
        </time>
      `).join("")}
      ${ranks.map((rank) => `
        <div class="stock-rank-axis">#${rank}</div>
        ${days.map((day) => renderRankCell(day, rank)).join("")}
      `).join("")}
      ${droppedSlots.map((index) => `
        <div class="stock-rank-axis stock-rank-axis-dropped">出${index + 1}</div>
        ${days.map((day) => renderDroppedCell(day, index)).join("")}
      `).join("")}
      <div class="stock-rank-axis stock-rank-axis-return">收益</div>
      ${days.map((day) => renderPortfolioCell(day)).join("")}
      <div class="stock-rank-axis stock-rank-axis-return">大盘</div>
      ${days.map((day) => renderBenchmarkCell(day)).join("")}
    </div>
    ${latestPortfolioSummary(days)}
  `;
}

function renderDashboard() {
  renderDailyTop10Panel();
  renderActionPanel();
  renderRankList();
}

async function loadData() {
  const [rankResponse, decisionResponse, dailyResponse] = await Promise.all([
    fetch("/stock-pdc/rank-flow.json", { cache: "no-store" }),
    fetch("/stock-pdc/decision/api/history", { cache: "no-store" }).catch(() => null),
    fetch("/stock-pdc/daily-top10.json", { cache: "no-store" }).catch(() => null)
  ]);
  if (!rankResponse.ok) throw new Error(`Could not load rank-flow.json (${rankResponse.status})`);
  state.data = await rankResponse.json();
  if (dailyResponse?.ok) state.dailyTop10 = await dailyResponse.json().catch(() => null);
  if (decisionResponse?.ok) {
    const decisionData = await decisionResponse.json().catch(() => ({}));
    state.decisionHistory = Array.isArray(decisionData.days) ? decisionData.days : [];
  }
  renderDashboard();
}

function hasStockAccess() {
  if (state.accessGranted) return true;
  if (document.cookie.split(";").some((cookie) => cookie.trim() === "turnpo_stock_pdc_ui=granted")) return true;
  try {
    return sessionStorage.getItem(STOCK_ACCESS_KEY) === "granted";
  } catch {
    return false;
  }
}

function setStockAccess(granted) {
  state.accessGranted = granted;
  document.cookie = granted
    ? "turnpo_stock_pdc_ui=granted; Path=/stock-pdc; Max-Age=604800; SameSite=Lax"
    : "turnpo_stock_pdc_ui=; Path=/stock-pdc; Max-Age=0; SameSite=Lax";
  try {
    if (granted) sessionStorage.setItem(STOCK_ACCESS_KEY, "granted");
    else sessionStorage.removeItem(STOCK_ACCESS_KEY);
  } catch {
    // Keep the live page state even if sessionStorage is unavailable.
  }
}

function renderAccessState() {
  const granted = hasStockAccess();
  const gate = $("#stockAccessGate");
  const app = $("#stockApp");
  const lock = $("#stockLock");
  document.body.classList.toggle("stock-unlocked", granted);
  if (gate) gate.hidden = granted;
  if (app) app.hidden = !granted;
  if (lock) lock.hidden = !granted;
  if (granted && !state.data) {
    loadData().catch((error) => {
      const list = $("#stockRankList");
      if (list) list.innerHTML = `<div class="stock-empty">${escapeHtml(error.message)}</div>`;
    });
  }
}

function initAccessGate() {
  $("#stockAccessForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const passwordInput = $("#stockPassword");
    const note = $("#stockAccessNote");
    if ((passwordInput?.value || "").trim() === STOCK_PASSWORD) {
      setStockAccess(true);
      if (passwordInput) passwordInput.value = "";
      if (note) note.textContent = "";
      renderAccessState();
      return;
    }
    if (note) note.textContent = "Password is incorrect.";
    passwordInput?.focus();
  });

  $("#stockLock")?.addEventListener("click", async () => {
    setStockAccess(false);
    await fetch("/stock-pdc/logout", { method: "POST" }).catch(() => null);
    renderAccessState();
    $("#stockPassword")?.focus();
  });

  renderAccessState();
}

initAccessGate();
