const PORTFOLIO_API = "/stock-pdc/portfolio/api";
const $ = (selector) => document.querySelector(selector);
const state = { dashboard: null, ledger: { holdings: [], closed: [] }, config: {}, busy: false };
const configLabels = {
  maxPositions: "最大持仓", buyMinVotes: "BUY 最少票数", holdMinVotes: "HOLD 最少票数", buyMinForwardUpside: "BUY Forward Upside", buyMinProbability5dUp: "P(5D>+2%)", buyMinEntryTiming: "BUY Entry Timing", noonMaxChasePct: "午盘最大追高%", hardStopPct: "Hard Stop%", timeStopDays: "Time Stop 天数", timeStopTargetPct: "Time Stop 目标%", rankExitThreshold: "Rank Exit 阈值", rankExitDays: "连续 Rank Exit 天数", cooldownTradingDays: "Cooldown 交易日", reentryMaxRank: "Re-entry 最大 Rank", reentryMinVotes: "Re-entry 最少票数", reentryMinEntryTiming: "Re-entry Entry Timing", replacementMargin: "Replacement Margin"
};

function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function today() { return new Date().toISOString().slice(0, 10); }
function number(value, fallback = "—") { const valueNumber = Number(value); return Number.isFinite(valueNumber) ? valueNumber : fallback; }

async function api(path, options = {}) {
  const response = await fetch(`${PORTFOLIO_API}${path}`, { ...options, headers: { "content-type": "application/json", ...(options.headers || {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Portfolio API 请求失败。");
  return payload;
}

function card(row) {
  return `<div class="portfolio-card"><strong>${escapeHtml(row.name)} <small>${escapeHtml(row.ticker)}</small></strong><em>${escapeHtml(row.trigger || row.recheckAction || row.action || "—")}</em><small>Rank #${number(row.rank)} · Forward ${number(row.forwardUpsideScore)}/100 · 5D↑ ${number(row.probability5dUp)}%</small><small>${escapeHtml(row.evidence || row.reason || "等待证据。")}</small>${row.replacementCandidate ? `<small>替换候选：${escapeHtml(row.replacementCandidate.name)} #${number(row.replacementCandidate.rank)}</small>` : ""}</div>`;
}

function renderAction(id, rows) {
  $(`#${id}Count`).textContent = rows.length;
  $(`#${id}List`).innerHTML = rows.length ? rows.map(card).join("") : `<p class="stock-empty">暂无 ${id === "buy" ? "新买入" : id === "hold" ? "持有" : "卖出"} 动作。</p>`;
}

function recheckUniverse() {
  const candidates = state.dashboard?.candidates || [];
  const holdings = state.ledger?.holdings || [];
  const byTicker = new Map();
  candidates.forEach((row) => byTicker.set(row.ticker, { ...row }));
  holdings.forEach((holding) => byTicker.set(holding.ticker, { ...byTicker.get(holding.ticker), ticker: holding.ticker, name: holding.name || holding.ticker }));
  return [...byTicker.values()];
}

function renderNoonRows() {
  const rows = recheckUniverse();
  const button = $("#runNoonRecheck");
  button.disabled = !state.dashboard || state.dashboard.stage !== "PRE_MARKET" || !rows.length || state.busy;
  $("#noonRows").innerHTML = rows.length ? rows.map((row) => `<article class="portfolio-noon-row" data-ticker="${escapeHtml(row.ticker)}"><strong>${escapeHtml(row.name)} · ${escapeHtml(row.ticker)} · 盘前 Rank #${number(row.rank)}</strong><label>11:30 最新价<input data-field="referencePrice" type="number" min="0.001" step="0.001" required /></label><label>上午涨跌%<input data-field="dayChangePct" type="number" step="0.01" value="0" /></label><label>Entry Timing 0–10<input data-field="entryTiming" type="number" min="0" max="10" step="0.1" value="${number(row.entryTiming, 0)}" /></label><label>Overheat 安全 0–10<input data-field="overheatSafety" type="number" min="0" max="10" step="0.1" value="${number(row.overheatSafety, 0)}" /></label><label>Downside 安全 0–10<input data-field="downsideSafety" type="number" min="0" max="10" step="0.1" value="${number(row.downsideSafety, 0)}" /></label><label>相对强度 0–10<input data-field="relativeStrength" type="number" min="0" max="10" step="0.1" value="${number(row.relativeStrength, 0)}" /></label><label>趋势加速 0–10<input data-field="trendAcceleration" type="number" min="0" max="10" step="0.1" value="${number(row.trendAcceleration, 0)}" /></label><label>突破确认 0–10<input data-field="breakoutConfirmation" type="number" min="0" max="10" step="0.1" value="${number(row.breakoutConfirmation, 0)}" /></label><label>量价确认 0–10<input data-field="volumeConfirmation" type="number" min="0" max="10" step="0.1" value="${number(row.volumeConfirmation, 0)}" /></label><label><input data-field="breakoutValid" type="checkbox" checked /> 突破仍有效</label><label><input data-field="pullback" type="checkbox" /> 冲高回落</label></article>`).join("") : `<p class="stock-empty">先生成盘前决策，系统会列出需要复核的股票。</p>`;
}

function renderLedger() {
  const holdings = state.ledger?.holdings || [];
  const select = $("#exitTicker");
  select.innerHTML = `<option value="">选择持仓</option>${holdings.map((holding) => `<option value="${escapeHtml(holding.ticker)}">${escapeHtml(holding.name || holding.ticker)} · ${escapeHtml(holding.ticker)}</option>`).join("")}`;
  $("#holdingList").innerHTML = holdings.length ? holdings.map((holding) => `<article class="portfolio-holding"><strong>${escapeHtml(holding.name || holding.ticker)} · ${escapeHtml(holding.ticker)}</strong><small>实际买入：${number(holding.actualEntryPrice)} · ${escapeHtml(holding.actualEntryDate)}</small><small>数量：${number(holding.quantity, "未填")} · Rank Exit 计数：${number(holding.rankExitDays, 0)}</small></article>`).join("") : `<p class="stock-empty">尚未记录实际持仓。</p>`;
}

function renderConfig() {
  $("#configGrid").innerHTML = Object.entries(configLabels).map(([key, label]) => `<label>${label}<input data-config="${key}" type="number" step="0.1" value="${escapeHtml(state.config[key])}" /></label>`).join("");
}

function render() {
  const dashboard = state.dashboard;
  $("#portfolioStage").textContent = dashboard?.stage === "NOON_RECHECK" ? "午盘复核已冻结" : dashboard?.stage === "PRE_MARKET" ? "PRE-MARKET DECISION" : "等待盘前决策";
  $("#referencePrice").textContent = dashboard?.referencePrice === "11:30_LATEST_AVAILABLE_PRICE" ? "午盘：11:30 最新可用价格" : "盘前：前一交易日收盘价";
  $("#portfolioMeta").textContent = dashboard ? `${dashboard.date} · Run ${String(dashboard.runId || "").slice(0, 8).toUpperCase()} · 最大 ${state.config.maxPositions || 15} 个持仓` : "先生成盘前决策，再在午盘确认。";
  renderAction("buy", dashboard?.actions?.buy || []);
  renderAction("hold", dashboard?.actions?.hold || []);
  renderAction("sell", dashboard?.actions?.sell || []);
  renderNoonRows(); renderLedger(); renderConfig();
  $("#generatePremarket").disabled = state.busy;
}

async function reload() {
  const result = await api("/dashboard");
  state.dashboard = result.dashboard; state.ledger = result.ledger; state.config = result.config; render();
}

$("#generatePremarket").addEventListener("click", async () => {
  state.busy = true; render();
  try { const result = await api("/pre-market", { method: "POST", body: JSON.stringify({}) }); state.dashboard = result.dashboard; await reload(); }
  catch (error) { $("#portfolioMeta").textContent = error.message; }
  finally { state.busy = false; render(); }
});

$("#runNoonRecheck").addEventListener("click", async () => {
  const rows = [...document.querySelectorAll(".portfolio-noon-row")].map((node) => {
    const field = (name) => node.querySelector(`[data-field="${name}"]`);
    const read = (name) => field(name)?.type === "checkbox" ? field(name).checked : Number(field(name)?.value);
    return { ticker: node.dataset.ticker, referencePrice: read("referencePrice"), dayChangePct: read("dayChangePct"), entryTiming: read("entryTiming"), overheatSafety: read("overheatSafety"), downsideSafety: read("downsideSafety"), relativeStrength: read("relativeStrength"), trendAcceleration: read("trendAcceleration"), breakoutConfirmation: read("breakoutConfirmation"), volumeConfirmation: read("volumeConfirmation"), breakoutValid: read("breakoutValid"), pullback: read("pullback") };
  });
  if (rows.some((row) => !Number.isFinite(row.referencePrice) || row.referencePrice <= 0)) { $("#portfolioMeta").textContent = "请为每一只复核股票填写有效的 11:30 最新价。"; return; }
  state.busy = true; render();
  try { const result = await api("/noon-recheck", { method: "POST", body: JSON.stringify({ date: state.dashboard.date, noonSnapshot: { rows } }) }); state.dashboard = result.dashboard; await reload(); }
  catch (error) { $("#portfolioMeta").textContent = error.message; }
  finally { state.busy = false; render(); }
});

$("#entryForm").addEventListener("submit", async (event) => {
  event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); data.actualEntryDate ||= today();
  try { const result = await api("/holdings/entry", { method: "POST", body: JSON.stringify(data) }); state.ledger = result.ledger; event.currentTarget.reset(); event.currentTarget.actualEntryDate.value = today(); render(); }
  catch (error) { $("#portfolioMeta").textContent = error.message; }
});
$("#exitForm").addEventListener("submit", async (event) => {
  event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); data.actualExitDate ||= today();
  try { const result = await api("/holdings/exit", { method: "POST", body: JSON.stringify(data) }); state.ledger = result.ledger; event.currentTarget.reset(); event.currentTarget.actualExitDate.value = today(); render(); }
  catch (error) { $("#portfolioMeta").textContent = error.message; }
});
$("#saveConfig").addEventListener("click", async () => {
  const config = Object.fromEntries([...document.querySelectorAll("[data-config]")].map((input) => [input.dataset.config, Number(input.value)]));
  try { const result = await api("/config", { method: "POST", body: JSON.stringify({ config }) }); state.config = result.config; render(); $("#portfolioMeta").textContent = "组合阈值已保存。"; }
  catch (error) { $("#portfolioMeta").textContent = error.message; }
});

$("#entryForm").actualEntryDate.value = today();
$("#exitForm").actualExitDate.value = today();
reload().catch((error) => { $("#portfolioMeta").textContent = error.message; });
