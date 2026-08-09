const API = "/stock-pdc/decision/api";
const RUN_KEY = "turnpo:stock-pdc-generation-run";
const STEPS = ["创建不可变 Run", "抓取全市场 A 股", "抓取行情并核对完整性", "鹰眼：市值与 60 日收益", "PDC：全部通过者评分", "完整性校验与发布"];
const $ = (selector) => document.querySelector(selector);
const state = { run: null, polling: null };

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function stepIndex(status) {
  return ({ QUEUED: 0, FETCHING: 1, SCREENING: 3, SCORING: 4, READY: 5, PUBLISHED: 6, FAILED: 0 }[status] ?? 0);
}

function markdownText(value, fallback = "未提供") {
  const text = String(value ?? "").replaceAll("\r", "").trim();
  return text ? text.replaceAll("\n", " ") : fallback;
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

function buildGenerationMarkdown(run) {
  const summary = run?.summary || {};
  const integrity = run?.integrity || {};
  const errors = Array.isArray(integrity.errors) ? integrity.errors : [];
  const completed = stepIndex(run?.status);
  return [
    "# Stock PDC 今日生成 Run 信息包",
    "",
    `- 导出时间：${new Date().toISOString()}`,
    `- Run ID：${markdownText(run?.id, "尚未创建")}`,
    `- 运行状态：${markdownText(run?.status, "IDLE")}`,
    `- 执行信息：${markdownText(run?.message, "尚未创建运行。")}`,
    `- 计算服务：${run?.computeConfigured === true ? "已连接" : run?.computeConfigured === false ? "未配置" : "未知"}`,
    "",
    "## 固定筛选口径",
    "",
    "- 全市场 A 股由服务端抓取；浏览器不会提交或选择股票名单。",
    "- 鹰眼固定规则：总市值 > 300 亿人民币；近 60 个交易日收益 > 0。",
    "- 所有鹰眼通过者必须进入 PDC；任何数据或模型失败均应记录为 FAILED。",
    "",
    "## 本次实际数量",
    "",
    `- 全市场 A 股：${markdownText(summary.marketCount)}`,
    `- 鹰眼通过：${markdownText(summary.candidateCount)}`,
    `- PDC 已评分：${markdownText(summary.pdcCount)}`,
    "",
    "## 执行步骤",
    "",
    ...STEPS.map((title, index) => `${index + 1}. ${title}：${run ? (index < completed ? "已完成" : index === completed ? (run.status === "FAILED" ? "FAILED" : "进行中或等待") : "等待") : "尚未开始"}`),
    "",
    "## 完整性校验",
    "",
    `- 校验结果：${integrity.valid === true ? "通过" : integrity.valid === false ? "未通过" : "尚未执行"}`,
    `- 规则版本：${markdownText(integrity.rulesVersion)}`,
    `- 运行摘要哈希：${markdownText(integrity.manifestHash)}`,
    ...(errors.length ? errors.map((error) => `- FAILED / 校验问题：${markdownText(error)}`) : ["- 未报告校验问题。"]),
    "",
    "## 说明",
    "",
    "- 本文件只复制页面中本次 Run 的真实状态与已返回信息，不生成或补造评分、候选或模型结论。",
    "- 研究工具，不构成交易指令。",
    ""
  ].join("\n");
}

async function copyGenerationMarkdown() {
  const feedback = $("#generationMarkdownFeedback");
  try {
    await copyText(buildGenerationMarkdown(state.run));
    if (feedback) feedback.textContent = "本次 Run 信息包已生成并复制。";
  } catch (error) {
    if (feedback) feedback.textContent = `复制失败：${error.message}`;
  }
}

function render() {
  const run = state.run;
  $("#runId").textContent = run?.id ? run.id.slice(0, 12).toUpperCase() : "等待创建";
  $("#marketCount").textContent = run?.summary?.marketCount ?? "--";
  $("#candidateCount").textContent = run?.summary?.candidateCount ?? "--";
  $("#pdcCount").textContent = run?.summary?.pdcCount ?? "--";
  $("#runStatus").textContent = run?.status || "IDLE";
  $("#generationMode").textContent = run?.computeConfigured ? "服务端计算已连接" : "等待计算服务";
  $("#startGeneration").disabled = Boolean(run && !["FAILED", "PUBLISHED"].includes(run.status));
  $("#generationMessage").textContent = run?.message || "尚未创建运行。";
  const active = stepIndex(run?.status);
  $("#generationSteps").innerHTML = STEPS.map((title, index) => `<li class="${index < active ? "is-done" : index === active ? "is-active" : ""}"><strong>${index + 1}</strong><div><h3>${escapeHtml(title)}</h3><p>${index === 0 ? "浏览器不传递候选股票。" : index === 5 ? "核对数量、规则版本与产物哈希。" : "由受保护的计算服务执行。"}</p></div></li>`).join("");
  const result = $("#generationResult");
  const publish = $("#publishGeneration");
  if (!run?.integrity) {
    result.hidden = true;
    return;
  }
  result.hidden = false;
  const errors = (run.integrity.errors || []).map((error) => `<li>${escapeHtml(error)}</li>`).join("");
  $("#integrityResult").innerHTML = `<p><strong>${run.integrity.valid ? "校验通过" : "校验未通过"}</strong></p><ul>${errors || "<li>全市场数量、鹰眼候选数与 PDC 评分数已匹配。</li>"}</ul><p>规则版本：${escapeHtml(run.integrity.rulesVersion || "--")}；运行摘要哈希：${escapeHtml(run.integrity.manifestHash || "--")}</p>`;
  publish.hidden = run.status !== "READY" || !run.integrity.valid;
}

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, { ...options, headers: { "content-type": "application/json", ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `请求失败 (${response.status})`);
  return body;
}

function saveRunId(id) {
  try { sessionStorage.setItem(RUN_KEY, id); } catch { /* no persistent browser storage */ }
}

function stopPolling() {
  if (state.polling) clearInterval(state.polling);
  state.polling = null;
}

function beginPolling() {
  stopPolling();
  if (!state.run?.id || ["READY", "PUBLISHED", "FAILED"].includes(state.run.status)) return;
  state.polling = setInterval(refresh, 4000);
}

async function refresh() {
  if (!state.run?.id) return;
  try {
    const result = await api(`/runs/${state.run.id}`);
    state.run = result.run;
    render();
    beginPolling();
  } catch (error) {
    $("#generationMessage").textContent = error.message;
  }
}

async function start() {
  $("#startGeneration").disabled = true;
  try {
    const result = await api("/runs", { method: "POST", body: "{}" });
    state.run = result.run;
    saveRunId(state.run.id);
    render();
    beginPolling();
  } catch (error) {
    $("#generationMessage").textContent = error.message;
    $("#startGeneration").disabled = false;
  }
}

async function publish() {
  if (!state.run?.id) return;
  try {
    state.run = (await api(`/runs/${state.run.id}/publish`, { method: "POST", body: "{}" })).run;
    render();
  } catch (error) {
    $("#generationMessage").textContent = error.message;
  }
}

$("#startGeneration")?.addEventListener("click", start);
$("#publishGeneration")?.addEventListener("click", publish);
$("#copyGenerationMarkdown")?.addEventListener("click", copyGenerationMarkdown);
try {
  const saved = sessionStorage.getItem(RUN_KEY);
  if (/^[a-f0-9-]{36}$/i.test(saved || "")) {
    state.run = { id: saved, status: "QUEUED", message: "正在恢复此浏览器中的运行。" };
    refresh();
  }
} catch { /* no persistent browser storage */ }
render();
