const DECISION_API_ENDPOINT = "/api/stock-pdc/decision-runs";

const steps = [
  { id: "snapshot", title: "锁定研究数据快照", detail: "确认收盘状态、候选池版本与生成时间。", output: "已冻结输入事实包" },
  { id: "round-one", title: "第一轮独立盲评", detail: "四个模型分别生成自己的 Top 20，不读取彼此结论。", output: "已收到 4 份独立排名" },
  { id: "pool", title: "合并候选挑战池", detail: "去重并融合排名，保留值得复核的 30–40 个候选。", output: "挑战池已生成" },
  { id: "round-two", title: "第二轮证据复核", detail: "模型只看统一事实包，重新评估候选与关键反证。", output: "复核评分已完成" },
  { id: "risk", title: "市场与风险闸门", detail: "检查市场状态、流动性、集中度与不可交易风险。", output: "风险门槛已应用" },
  { id: "final", title: "生成最终研究名单", detail: "保留最多 10 个通过闸门的研究席位；不足不强行补足。", output: "决策快照已生成" }
];

const models = [
  { id: "pdc", name: "GPT-5.6 PDC", role: "综合型卫冕选手", note: "保留现有 PDC 的结构化判断。" },
  { id: "gemini", name: "Gemini", role: "质量与行业视角", note: "独立评估事实包中的质量与景气线索。" },
  { id: "kimi", name: "Kimi", role: "趋势与催化视角", note: "独立识别趋势、量价与催化剂。" },
  { id: "fable", name: "Fable", role: "反方与证伪视角", note: "主动寻找拥挤、叙事断裂与下行风险。" }
];

const state = {
  running: false,
  completed: 0,
  activeStep: null,
  runId: "",
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

  if (runId) runId.textContent = state.runId || "等待生成";
  if (snapshot) snapshot.textContent = state.completed > 0 ? "已锁定" : "尚未锁定";
  if (status) status.textContent = state.running ? "生成中" : state.completed === steps.length ? "已完成" : "准备就绪";
  if (count) count.textContent = `${state.completed} / ${steps.length}`;
  if (copy) copy.textContent = state.running
    ? `正在执行：${steps.find((step) => step.id === state.activeStep)?.title || "准备任务"}`
    : state.completed === steps.length
      ? "本次模拟 Run 已完成。实际 API 接入后，这里会显示服务端返回的每一步证据与耗时。"
      : "点击开始生成后，每一个步骤都会在这里留下状态与产物。";
  if (button) {
    button.disabled = state.running;
    button.textContent = state.running ? "正在生成…" : state.completed === steps.length ? "再次生成" : "开始生成";
  }
}

function renderResult() {
  const section = $("#decisionResult");
  const list = $("#resultList");
  if (!section || !list) return;
  section.hidden = state.completed !== steps.length;
  if (section.hidden) return;
  list.innerHTML = Array.from({ length: 10 }, (_, index) => `
    <div class="decision-placeholder-row">
      <strong>#${index + 1}</strong>
      <span>最终研究席位</span>
      <small>等待 API 返回候选</small>
    </div>
  `).join("");
}

function render() {
  renderSteps();
  renderModels();
  setRunSummary();
  renderResult();
}

function pause(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function newRunId() {
  const now = new Date();
  const compact = now.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `DEMO-${compact}`;
}

async function createDecisionRun() {
  // Replace this local demo adapter with a POST to DECISION_API_ENDPOINT once the API exists.
  // Expected response: { runId, snapshotAt, status, steps, models, result }.
  return { runId: newRunId(), mode: "demo", endpoint: DECISION_API_ENDPOINT };
}

async function runDemoFlow() {
  const run = await createDecisionRun();
  state.running = true;
  state.completed = 0;
  state.activeStep = null;
  state.runId = run.runId;
  state.modelStates = Object.fromEntries(models.map((model) => [model.id, "idle"]));
  render();

  for (const [index, step] of steps.entries()) {
    state.activeStep = step.id;
    if (step.id === "round-one") {
      models.forEach((model) => { state.modelStates[model.id] = "active"; });
    }
    render();
    await pause(step.id === "round-one" ? 1150 : 680);
    if (step.id === "round-one") {
      models.forEach((model) => { state.modelStates[model.id] = "complete"; });
    }
    state.completed = index + 1;
    state.activeStep = null;
    render();
    await pause(160);
  }

  state.running = false;
  render();
}

$("#generateDecision")?.addEventListener("click", () => {
  if (!state.running) runDemoFlow();
});

render();
