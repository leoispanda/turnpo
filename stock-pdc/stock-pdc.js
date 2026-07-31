const STOCK_ACCESS_KEY = "turnpo:stock-pdc-access";
const STOCK_PASSWORD = "emba2026";
const ACTION_META = {
  BUY: { title: "买入", note: "仅显示已通过 PDC 即时买入闸门的股票" },
  HOLD: { title: "保留", note: "仅显示已确认持仓且满足保留规则的股票" },
  SELL: { title: "卖出", note: "仅显示已确认持仓且需要人工卖出复核的股票" }
};
const state = {
  accessGranted: false,
  data: null
};

const $ = (selector) => document.querySelector(selector);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

function formatPrice(value) {
  return Number.isFinite(value) ? value.toFixed(value >= 100 ? 2 : 3) : "--";
}

function actionRows() {
  const rows = state.data?.actions?.rows;
  if (!Array.isArray(rows)) return [];
  return rows.filter((row) => Object.hasOwn(ACTION_META, row.action));
}

function renderActionCard(row) {
  return `
    <article class="stock-action-card stock-action-${escapeHtml(row.action.toLowerCase())}">
      <div class="stock-action-card-head">
        <div>
          <h3>${escapeHtml(row.name)}</h3>
          <small>${escapeHtml(row.ticker)}</small>
        </div>
        <strong>${escapeHtml(row.actionText || ACTION_META[row.action].title)}</strong>
      </div>
      <div class="stock-action-market">
        <span>参考收盘 ${escapeHtml(formatPrice(row.latestClose))}</span>
        <span class="${pctClass(row.signalDayChangePct)}">${escapeHtml(formatPct(row.signalDayChangePct))}</span>
      </div>
      <p>${escapeHtml(row.reason || "等待人工复核")}</p>
    </article>
  `;
}

function renderActionGroup(action, rows) {
  const meta = ACTION_META[action];
  return `
    <section class="stock-action-group stock-action-group-${action.toLowerCase()}">
      <header>
        <div>
          <span>${escapeHtml(action)}</span>
          <h2>${escapeHtml(meta.title)}</h2>
        </div>
        <strong>${rows.length}</strong>
      </header>
      <p class="stock-action-note">${escapeHtml(meta.note)}</p>
      <div class="stock-action-cards">
        ${rows.length
          ? rows.map(renderActionCard).join("")
          : '<div class="stock-action-none">没有需要处理的股票</div>'}
      </div>
    </section>
  `;
}

function renderActionList() {
  const list = $("#stockRankList");
  if (!list) return;
  const actions = state.data?.actions;
  const rows = actionRows();
  const latestDate = actions?.latestDate || state.data?.latestDate || "--";
  const groups = ["BUY", "HOLD", "SELL"];

  list.innerHTML = `
    <section class="stock-action-hero">
      <div>
        <span>STOCK PDC ACTIONS</span>
        <h1>买入・保留・卖出</h1>
        <p>${escapeHtml(latestDate)} · 只显示需要采取行动的股票</p>
      </div>
      <div class="stock-action-total">
        <strong>${rows.length}</strong>
        <span>项行动</span>
      </div>
    </section>
    ${rows.length === 0
      ? '<section class="stock-no-action"><strong>今日无需操作</strong><p>没有通过买入闸门的机会，也没有已确认持仓需要保留或卖出。</p></section>'
      : ""}
    <div class="stock-action-grid">
      ${groups.map((action) => renderActionGroup(action, rows.filter((row) => row.action === action))).join("")}
    </div>
    <p class="stock-action-footnote">其他研究候选和未确认成交计划均已隐藏。所有行动均为研究和人工复核，不连接券商或自动下单。</p>
  `;
}

function renderDashboard() {
  renderActionList();
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
