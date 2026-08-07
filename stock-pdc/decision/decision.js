const DECISION_API_ENDPOINT = "/stock-pdc/decision/api";

const steps = [
  { id: "snapshot", title: "锁定研究数据快照", detail: "确认收盘状态、候选池版本与生成时间。", output: "已冻结输入事实包" },
  { id: "round-one", title: "第一轮独立盲评", detail: "四个 GPT mini 角色分别生成自己的 Top 20，不读取彼此结论。", output: "已收到 4 份独立排名" },
  { id: "merge", title: "合并候选挑战池", detail: "去重并融合排名，保留值得复核的候选。", output: "挑战池已生成" },
  { id: "round-two", title: "第二轮证据复核", detail: "四个角色重新评估候选与关键反证。", output: "复核评分已完成" },
  { id: "risk-check", title: "市场与风险闸门", detail: "检查共识、风险与不应进入最终名单的候选。", output: "风险门槛已应用" },
  { id: "final", title: "生成最终研究名单", detail: "保留最多 10 个通过闸门的研究席位；不足不强行补足。", output: "决策快照已生成" }
];

const models = [
  { id: "pdc", name: "GPT mini · PDC", role: "综合型评审", note: "综合趋势、量价、因子与证据一致性。" },
  { id: "trend", name: "GPT mini · 趋势", role: "趋势与量价评审", note: "独立识别趋势延续、相对强弱与量价确认。" },
  { id: "risk", name: "GPT mini · 风险", role: "风险与过热审计", note: "专注下行、过热与不应参与的情形。" },
  { id: "counter", name: "GPT mini · 反方", role: "反方证伪评审", note: "主动寻找论点漏洞、拥挤与证据不足。" }
];

const state = {
  running: false,
  completed: 0,
  activeStep: null,
  run: null,
  modelStates: Object.fromEntries(models.map((model) => [model.id, "idle"]))
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

function stepState(step) {
  if (state.activeStep === step.id) return "active";
  if (steps.findIndex((item) => item.id === step.id) < state.completed) return "complete";
  return "idle";
}

function stepStateText(step) {
  const status = stepState(step);
  if (status === "active") return "进行中";
  if (status === "complete") return step.output;
  return "等待";
}

function renderSteps() {
  const list = $("#decisionSteps");
  if (!list) return;
  list.innerHTML = steps.map((step, index) => `
    <li class="decision-step" data-state="${stepState(step)}">
      <span class="decision-step-index">${index + 1}</span>
      <div>
        <h3>${escapeHtml(step.title)}</h3>
        <p>${escapeHtml(step.detail)}</p>
      </div>
      <span class="decision-step-state">${escapeHtml(stepStateText(step))}</span>
    </li>
  `).join("");
}

function modelStatus(model) {
  const status = state.modelStates[model.id];
  if (status === "active") return "正在盲评";
  if (status === "complete") return "已提交 Top 20";
  return "等待开始";
}

function renderModels() {
  const grid = $("#modelGrid");
  if (!grid) return;
  grid.innerHTML = models.map((model) => `
    <article class="decision-model-card" data-state="${state.modelStates[model.id]}">
      <span>${escapeHtml(model.role)}</span>
      <h3>${escapeHtml(model.name)}</h3>
      <p>${escapeHtml(model.note)}</p>
      <div class="decision-model-status">${escapeHtml(modelStatus(model))}</div>
    </article>
  `).join("");
}

function setRunSummary() {
  const snapshot = $("#snapshotStatus");
  const status = $("#runStatus");
  const count = $("#progressCount");
  const copy = $("#progressCopy");
  const button = $("#generateDecision");
  const runId = $("#runId");
  const mode = $("#decisionMode");
  const run = state.run;

  if (runId) runId.textContent = run?.id ? run.id.slice(0, 8).toUpperCase() : "等待生成";
  if (snapshot) snapshot.textContent = state.completed > 0 ? `${run?.date || ""} 已锁定` : "尚未锁定";
  if (status) status.textContent = state.running ? "生成中" : state.completed === steps.length ? "等待发布" : "准备就绪";
  if (count) count.textContent = `${state.completed} / ${steps.length}`;
  if (mode) mode.textContent = run?.model ? `GPT mini · ${run.model}` : "GPT mini · API 已连接";
  if (copy) copy.textContent = state.running
    ? `正在执行：${steps.find((step) => step.id === state.activeStep)?.title || "准备任务"}`
    : state.completed === steps.length
      ? "本次 Run 已完成。确认无误后，点击“发布到 PDC”才会追加当天正式记录。"
      : "点击开始生成后，每一个步骤都会在这里留下真实状态与产物。";
  if (button) {
    button.disabled = state.running;
    button.textContent = state.running ? "正在生成…" : "开始生成";
  }
}

function renderResult() {
  const section = $("#decisionResult");
  const list = $("#resultList");
  const publish = $("#publishDecision");
  if (!section || !list || !publish) return;
  const final = Array.isArray(state.run?.final) ? state.run.final : [];
  section.hidden = state.completed !== steps.length;
  publish.hidden = section.hidden || Boolean(state.run?.publishedAt);
  publish.disabled = state.running;
  if (section.hidden) return;
  list.innerHTML = final.length ? final.map((row) => `
    <div class="decision-placeholder-row">
      <strong>#${escapeHtml(row.rank)}</strong>
      <span>${escapeHtml(row.name)} <small>${escapeHtml(row.ticker)}</small></span>
      <small>${escapeHtml(row.consensusScore)} 分 · ${escapeHtml(row.support)}/4 共识</small>
    </div>
  `).join("") : `<div class="stock-empty">没有候选通过当前风险闸门。</div>`;
}

function render() {
  renderSteps();
  renderModels();
  setRunSummary();
  renderResult();
}

async function api(path, options = {}) {
  const response = await fetch(`${DECISION_API_ENDPOINT}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Decision API error (${response.status})`);
  return payload;
}

async function latestSnapshot() {
  const response = await fetch("/stock-pdc/rank-flow.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load the current PDC fact snapshot.");
  const data = await response.json();
  const days = Array.isArray(data.days) ? data.days.filter((day) => Array.isArray(day.rows) && day.rows.length) : [];
  const latest = days.at(-1);
  if (!latest?.date || !latest.rows?.length) throw new Error("No current PDC candidates are available.");
  return {
    date: latest.date,
    source: "stock-pdc/rank-flow.json",
    candidates: latest.rows.slice(0, 30).map((row) => ({
      ticker: row.ticker,
      name: row.name,
      rank: row.rank,
      score: row.score,
      status: row.status,
      mainReason: row.mainReason || row.research?.mainReason,
      mainRisk: row.mainRisk || row.research?.mainRisk,
      signalDayChangePct: row.signalDayChangePct,
      scores: row.scores || row.research?.scores
    }))
  };
}

function completeThrough(stepId) {
  state.completed = steps.findIndex((step) => step.id === stepId) + 1;
  state.activeStep = null;
}

async function runDecisionFlow() {
  state.running = true;
  state.completed = 0;
  state.activeStep = "snapshot";
  state.run = null;
  state.modelStates = Object.fromEntries(models.map((model) => [model.id, "idle"]));
  render();
  try {
    const snapshot = await latestSnapshot();
    state.run = (await api("/runs", { method: "POST", body: JSON.stringify({ snapshot }) })).run;
    completeThrough("snapshot");
    render();

    state.activeStep = "round-one";
    models.forEach((model) => { state.modelStates[model.id] = "active"; });
    render();
    state.run = (await api(`/runs/${state.run.id}/round-one`, { method: "POST", body: "{}" })).run;
    models.forEach((model) => { state.modelStates[model.id] = "complete"; });
    completeThrough("round-one");
    render();

    state.activeStep = "merge";
    render();
    state.run = (await api(`/runs/${state.run.id}/merge`, { method: "POST", body: "{}" })).run;
    completeThrough("merge");
    render();

    state.activeStep = "round-two";
    render();
    state.run = (await api(`/runs/${state.run.id}/round-two`, { method: "POST", body: "{}" })).run;
    completeThrough("round-two");
    render();

    state.activeStep = "risk-check";
    render();
    state.run = (await api(`/runs/${state.run.id}/risk-check`, { method: "POST", body: "{}" })).run;
    completeThrough("risk-check");
    state.activeStep = "final";
    render();
    completeThrough("final");
  } catch (caught) {
    const copy = $("#progressCopy");
    if (copy) copy.textContent = `生成未完成：${caught.message || "请稍后重试。"}`;
  } finally {
    state.running = false;
    render();
  }
}

async function publishDecision() {
  if (!state.run?.id || state.running) return;
  state.running = true;
  render();
  try {
    const result = await api(`/runs/${state.run.id}/publish`, { method: "POST", body: "{}" });
    state.run = result.run;
  } catch (caught) {
    const copy = $("#progressCopy");
    if (copy) copy.textContent = `发布失败：${caught.message || "请稍后重试。"}`;
  } finally {
    state.running = false;
    render();
  }
}

$("#generateDecision")?.addEventListener("click", () => {
  if (!state.running) runDecisionFlow();
});

$("#publishDecision")?.addEventListener("click", publishDecision);

render();
