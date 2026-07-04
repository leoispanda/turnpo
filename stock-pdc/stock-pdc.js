const STOCK_ACCESS_KEY = "turnpo:stock-pdc-access";
const STOCK_PASSWORD = "emba2026";
const state = {
  accessGranted: false,
  data: null
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

function changeLabel(row) {
  if (row.changeType === "UP") return `+${Math.abs(row.rankDelta || 0)}`;
  if (row.changeType === "DOWN") return `-${Math.abs(row.rankDelta || 0)}`;
  if (row.changeType === "NEW") return "New";
  return "0";
}

function droppedRankDelta(row) {
  const previousRank = Number.parseInt(row.previousRank, 10);
  return Number.isFinite(previousRank) ? Math.max(1, 21 - previousRank) : null;
}

function droppedChangeLabel(row) {
  const delta = droppedRankDelta(row);
  return delta === null ? "Out" : `-${delta}+`;
}

function droppedMovementPath(row) {
  const delta = droppedRankDelta(row);
  const movement = delta === null ? "跌出 Top 20" : `跌出 Top 20，至少下滑 ${delta} 名`;
  return `#${row.previousRank || "-"} -> ${movement}`;
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

function renderRankCell(day, rank) {
  const row = rowByRank(day, rank);
  if (!row) return `<div class="stock-rank-cell stock-rank-cell-empty" aria-label="${escapeHtml(day.date)} #${rank} empty"></div>`;
  return `
    <article class="stock-rank-cell ${escapeHtml(row.changeType)}" aria-label="${escapeHtml(day.date)} #${rank} ${escapeHtml(row.name)} ${escapeHtml(movementPath(row))}">
      <div class="stock-name">
        <h3>${escapeHtml(row.name)}</h3>
        <small>${escapeHtml(row.ticker)}</small>
      </div>
      <div class="stock-change" aria-label="${escapeHtml(movementPath(row))}">
        <span class="stock-change-arrow" aria-hidden="true"></span>
        <strong>${escapeHtml(changeLabel(row))}</strong>
      </div>
    </article>
  `;
}

function renderDroppedCell(day, index) {
  const row = (day.dropped || [])[index] || null;
  if (!row) return `<div class="stock-rank-cell stock-rank-cell-empty" aria-label="${escapeHtml(day.date)} dropped ${index + 1} empty"></div>`;
  return `
    <article class="stock-rank-cell DROPPED" aria-label="${escapeHtml(day.date)} dropped ${index + 1} ${escapeHtml(row.name)} ${escapeHtml(droppedMovementPath(row))}">
      <div class="stock-name">
        <h3>${escapeHtml(row.name)}</h3>
        <small>${escapeHtml(row.ticker)}</small>
      </div>
      <div class="stock-change" aria-label="${escapeHtml(droppedMovementPath(row))}">
        <span class="stock-change-arrow" aria-hidden="true"></span>
        <strong>${escapeHtml(droppedChangeLabel(row))}</strong>
      </div>
    </article>
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
    </div>
  `;
}

function renderDashboard() {
  renderRankList();
}

async function loadData() {
  const response = await fetch("/stock-pdc/rank-flow.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load rank-flow.json (${response.status})`);
  state.data = await response.json();
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
