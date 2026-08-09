const state = {
  data: null,
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
  return `
    <section class="stock-strategy-note" aria-label="Stock PDC strategy rule">
      <h2>Top20 Rotation</h2>
      <p>鹰眼雷达先筛候选，PDC 只做排序。每日发布最多 20 个通过筛选的研究席位；候选不足时不补位，委员分数仅保留用于复盘。</p>
      <div class="stock-strategy-meta">
        <span>${escapeHtml(strategy.candidateStage || "Hawkeye Radar")}</span>
        <span>${escapeHtml(strategy.rankingStage || "PDC ranking")}</span>
        <span>${escapeHtml(strategy.exitRule || "Top 20 exit review")}</span>
      </div>
    </section>
  `;
}

function renderDataQualityNotice(days) {
  const latest = days[0];
  if (!latest) return "";
  const candidateCount = latest.rows.length;
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
    ${renderDataQualityNotice(days)}
    ${renderPublishedDecisionHistory()}
    <div class="stock-rank-matrix" style="--date-count: ${days.length}">
      <div class="stock-matrix-corner" aria-hidden="true"></div>
      ${days.map((day) => `
        <time class="stock-date-head" datetime="${escapeHtml(day.date)}" title="${escapeHtml(day.date)}">
          <span>${escapeHtml(shortDate(day.date))}</span>
          <small>${escapeHtml(weekdayLabel(day.date))}</small>
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
  renderRankList();
}

async function loadData() {
  const [rankResponse, decisionResponse] = await Promise.all([
    fetch("/stock-pdc/rank-flow.json", { cache: "no-store" }),
    fetch("/stock-pdc/decision/api/history", { cache: "no-store" }).catch(() => null)
  ]);
  if (!rankResponse.ok) throw new Error(`Could not load rank-flow.json (${rankResponse.status})`);
  state.data = await rankResponse.json();
  if (decisionResponse?.ok) {
    const decisionData = await decisionResponse.json().catch(() => ({}));
    state.decisionHistory = Array.isArray(decisionData.days) ? decisionData.days : [];
  }
  renderDashboard();
}

loadData().catch((error) => {
  const list = $("#stockRankList");
  if (list) list.innerHTML = `<div class="stock-empty">${escapeHtml(error.message)}</div>`;
});
