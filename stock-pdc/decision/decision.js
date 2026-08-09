const DECISION_API_ENDPOINT = "/stock-pdc/decision/api";
const DECISION_RUN_KEY = "turnpo:stock-pdc-decision-run";

const steps = [
  { id: "snapshot", title: "锁定研究数据快照", detail: "确认收盘状态、候选池版本与生成时间。", output: "已冻结输入事实包" },
  { id: "round-one", title: "第一轮独立盲评", detail: "四个 GPT mini 角色各自从雷达候选池推荐最多 20 个，不读取彼此结论。", output: "已收到 4 份独立推荐" },
  { id: "merge", title: "合并候选挑战池", detail: "去重并保留所有首轮推荐，最多 80 个候选进入复核。", output: "挑战池已生成" },
  { id: "round-two", title: "第二轮证据复核", detail: "四个角色重新评估合并池，并各自推荐最多 20 个。", output: "复核评分已完成" },
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
  failedMessage: "",
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

function compactText(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function compactScores(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).slice(0, 14));
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

function completedStepsForStatus(status) {
  const progress = {
    SNAPSHOT_LOCKED: 1,
    ROUND_ONE_COMPLETE: 2,
    POOL_READY: 3,
    ROUND_TWO_COMPLETE: 4,
    READY_TO_PUBLISH: 6,
    PUBLISHED: 6
  };
  return progress[status] || 0;
}

function nextStageForRun(run) {
  const next = {
    SNAPSHOT_LOCKED: "round-one",
    ROUND_ONE_COMPLETE: "merge",
    POOL_READY: "round-two",
    ROUND_TWO_COMPLETE: "risk-check"
  };
  return next[run?.status] || "";
}

function rememberRun(run) {
  state.run = run;
  try {
    if (run?.id && !run?.publishedAt) sessionStorage.setItem(DECISION_RUN_KEY, run.id);
    else sessionStorage.removeItem(DECISION_RUN_KEY);
  } catch {
    // A reload can still start a new run if session storage is unavailable.
  }
}

function hydrateRun(run) {
  rememberRun(run);
  state.completed = completedStepsForStatus(run?.status);
  state.activeStep = null;
  const roundOneComplete = state.completed >= 2;
  state.modelStates = Object.fromEntries(models.map((model) => [model.id, roundOneComplete ? "complete" : "idle"]));
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

function nextStepLabel(run) {
  const labels = {
    "round-one": "运行第一轮盲评",
    merge: "合并首轮推荐",
    "round-two": "运行第二轮复核",
    "risk-check": "执行风险闸门"
  };
  return labels[nextStageForRun(run)] || (run?.status === "READY_TO_PUBLISH" ? "生成最终研究名单" : "下一步");
}

function renderCandidateRows(candidates) {
  return `<div class="decision-review-list">${candidates.map((candidate) => `
    <article class="decision-review-row">
      <strong>#${escapeHtml(candidate.rank)}</strong>
      <span>${escapeHtml(candidate.name)} <small>${escapeHtml(candidate.ticker)}</small></span>
      <small>${escapeHtml(candidate.status || "--")} · ${escapeHtml(candidate.score ?? "--")}</small>
    </article>
  `).join("")}</div>`;
}

function renderReviewers(reviews, title) {
  const groups = models
    .map((model) => ({ model, review: reviews?.[model.id] }))
    .filter(({ review }) => review);
  if (!groups.length) return "";
  return `
    <section class="decision-review-stage">
      <h3>${escapeHtml(title)}</h3>
      <div class="decision-reviewer-grid">
        ${groups.map(({ model, review }) => `
          <article class="decision-reviewer-card">
            <h4>${escapeHtml(model.name)}</h4>
            <p>${escapeHtml(review.summary || "没有返回摘要。")}</p>
            <ol>${(review.rankings || []).map((row) => `
              <li><strong>#${escapeHtml(row.rank)}</strong> ${escapeHtml(row.name)} <small>${escapeHtml(row.ticker)} · ${escapeHtml(row.score)}</small><span>${escapeHtml(row.thesis || row.risk || "")}</span></li>
            `).join("")}</ol>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderReview() {
  const section = $("#decisionReview");
  const content = $("#reviewContent");
  const copy = $("#reviewCopy");
  const run = state.run;
  if (!section || !content || !copy) return;
  section.hidden = !run || state.completed < 1;
  if (section.hidden) return;
  const snapshotCandidates = Array.isArray(run.snapshot?.candidates) ? run.snapshot.candidates : [];
  const pool = Array.isArray(run.pool) ? run.pool : [];
  const stages = [
    `<section class="decision-review-stage"><h3>步骤 1 · 已锁定的雷达事实包</h3><p>${escapeHtml(run.date)}，共 ${snapshotCandidates.length} 个候选。以下是提交给每位评审的同一份候选池。</p>${renderCandidateRows(snapshotCandidates)}</section>`,
    state.completed >= 2 ? renderReviewers(run.roundOne, "步骤 2 · 第一轮独立推荐") : "",
    state.completed >= 3 ? `<section class="decision-review-stage"><h3>步骤 3 · 合并挑战池</h3><p>首轮推荐去重后保留 ${pool.length} 个候选进入第二轮。</p>${renderCandidateRows(pool.map((row, index) => ({ ...row, rank: index + 1, score: row.consensusScore, status: `${row.support}/4 支持` })))}</section>` : "",
    state.completed >= 4 ? renderReviewers(run.roundTwo, "步骤 4 · 第二轮独立复核") : "",
    state.completed >= 5 ? `<section class="decision-review-stage"><h3>步骤 5 · 风险闸门结果</h3><p>已生成最终研究名单；继续下一步即可进入发布前确认。</p></section>` : ""
  ].filter(Boolean);
  content.innerHTML = stages.join("");
  copy.textContent = state.completed === steps.length
    ? "所有研究内容均已完成。确认最终名单后再发布到 PDC 历史。"
    : `已停在步骤 ${state.completed}。审阅完成后，点击“${nextStepLabel(run)}”。`;
}

function setRunSummary() {
  const snapshot = $("#snapshotStatus");
  const status = $("#runStatus");
  const count = $("#progressCount");
  const copy = $("#progressCopy");
  const stepStart = $("#generateDecision");
  const runAll = $("#runAllDecision");
  const next = $("#nextDecisionStep");
  const runId = $("#runId");
  const mode = $("#decisionMode");
  const run = state.run;

  if (runId) runId.textContent = run?.id ? run.id.slice(0, 8).toUpperCase() : "等待生成";
  if (snapshot) snapshot.textContent = state.completed > 0 ? `${run?.date || ""} 已锁定` : "尚未锁定";
  if (status) status.textContent = state.running ? "生成中" : state.failedMessage ? "需要重试" : state.completed === steps.length ? "等待发布" : state.run ? "可继续生成" : "准备就绪";
  if (count) count.textContent = `${state.completed} / ${steps.length}`;
  if (mode) mode.textContent = run?.model ? `GPT mini · ${run.model}` : "GPT mini · API 已连接";
  if (copy) copy.textContent = state.failedMessage
    ? `生成已暂停：${state.failedMessage}。可重试当前步骤，不会创建新的 Run。`
    : state.running
    ? `正在执行：${steps.find((step) => step.id === state.activeStep)?.title || "准备任务"}`
    : state.completed === steps.length
      ? "本次 Run 已完成。确认无误后，点击“发布到 PDC”才会追加当天正式记录。"
      : "点击开始生成后，每一个步骤都会在这里留下真实状态与产物。";
  const hasOpenRun = Boolean(run && !run.publishedAt && state.completed < steps.length);
  if (stepStart) {
    stepStart.hidden = Boolean(run && !run.publishedAt);
    stepStart.disabled = state.running;
    stepStart.textContent = "逐步开始";
  }
  if (next) {
    next.hidden = !hasOpenRun;
    next.disabled = state.running;
    next.textContent = state.running ? "正在生成…" : state.failedMessage ? "重试当前步骤" : nextStepLabel(run);
  }
  if (runAll) {
    runAll.hidden = Boolean(run?.publishedAt) || state.completed === steps.length;
    runAll.disabled = state.running;
    runAll.textContent = state.running ? "正在生成…" : hasOpenRun ? "一键完成剩余步骤" : "一键跑通";
  }
}

function renderResult() {
  const section = $("#decisionResult");
  const list = $("#resultList");
  const publish = $("#publishDecision");
  if (!section || !list || !publish) return;
  const final = Array.isArray(state.run?.final) ? state.run.final : [];
  const candidateCount = state.run?.snapshot?.candidateCount || 0;
  const candidateCountNode = $("#resultCandidateCount");
  const candidateNoteNode = $("#resultCandidateNote");
  if (candidateCountNode) candidateCountNode.textContent = candidateCount ? `${candidateCount} 个` : "--";
  if (candidateNoteNode) candidateNoteNode.textContent = candidateCount
    ? `每位评审从 ${candidateCount} 个雷达候选中推荐最多 20 个`
    : "以当日实际数量为准";
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
  renderReview();
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
  const response = await fetch("/stock-pdc/decision-candidates.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load the current radar candidate snapshot.");
  const data = await response.json();
  const candidates = Array.isArray(data.candidates) ? data.candidates : [];
  if (data.availability !== "ACTIVE" || !data.latestDate || !candidates.length) {
    throw new Error(data.validationErrors?.[0] || "No current radar candidate snapshot is available.");
  }
  if (candidates.length < 5) {
    throw new Error(`当前只有 ${candidates.length} 个雷达候选，少于生成多模型决策所需的 5 个；请等待候选池更新。`);
  }
  return {
    date: data.latestDate,
    source: "stock-pdc/decision-candidates.json",
    candidates: candidates.slice(0, 500).map((row) => ({
      ticker: row.ticker,
      name: compactText(row.name || row.ticker, 80),
      rank: row.rank,
      score: row.score,
      status: row.status,
      mainReason: compactText(row.mainReason, 360),
      mainRisk: compactText(row.mainRisk, 240),
      signalDayChangePct: row.signalDayChangePct,
      scores: compactScores(row.scores)
    }))
  };
}

function completeThrough(stepId) {
  state.completed = steps.findIndex((step) => step.id === stepId) + 1;
  state.activeStep = null;
}

async function createDecisionRun() {
  state.activeStep = "snapshot";
  render();
  const snapshot = await latestSnapshot();
  hydrateRun((await api("/runs", { method: "POST", body: JSON.stringify({ snapshot }) })).run);
  completeThrough("snapshot");
}

async function advanceDecisionStage(stage) {
  state.activeStep = stage;
  if (stage === "round-one") models.forEach((model) => { state.modelStates[model.id] = "active"; });
  render();
  const run = await api(`/runs/${state.run.id}/${stage}`, { method: "POST", body: "{}" });
  hydrateRun(run.run);
  if (stage === "round-one") models.forEach((model) => { state.modelStates[model.id] = "complete"; });
  completeThrough(stage);
}

function resetForNewRun() {
  state.completed = 0;
  state.activeStep = null;
  state.modelStates = Object.fromEntries(models.map((model) => [model.id, "idle"]));
  rememberRun(null);
}

async function runWithProgress(action) {
  state.running = true;
  state.failedMessage = "";
  render();
  try {
    await action();
  } catch (caught) {
    state.activeStep = null;
    state.failedMessage = caught.message || "请稍后重试。";
  } finally {
    state.running = false;
    render();
  }
}

async function startStepByStep() {
  if (state.run && !state.run.publishedAt) return;
  await runWithProgress(async () => {
    resetForNewRun();
    await createDecisionRun();
  });
}

async function advanceNextStep() {
  if (!state.run || state.run.publishedAt) return;
  await runWithProgress(async () => {
    const stage = nextStageForRun(state.run);
    if (stage) {
      await advanceDecisionStage(stage);
      return;
    }
    if (state.run.status === "READY_TO_PUBLISH") {
      state.activeStep = "final";
      render();
      completeThrough("final");
    }
  });
}

async function runDecisionFlow() {
  await runWithProgress(async () => {
    if (!state.run || state.run.publishedAt) {
      resetForNewRun();
      await createDecisionRun();
      render();
    }
    let stage = nextStageForRun(state.run);
    while (stage) {
      await advanceDecisionStage(stage);
      render();
      stage = nextStageForRun(state.run);
    }
    if (state.run?.status === "READY_TO_PUBLISH") {
      state.activeStep = "final";
      render();
      completeThrough("final");
    }
  });
}

async function publishDecision() {
  if (!state.run?.id || state.running) return;
  state.running = true;
  render();
  try {
    const result = await api(`/runs/${state.run.id}/publish`, { method: "POST", body: "{}" });
    hydrateRun(result.run);
  } catch (caught) {
    state.failedMessage = `发布失败：${caught.message || "请稍后重试。"}`;
  } finally {
    state.running = false;
    render();
  }
}

async function restoreSavedRun() {
  let runId = "";
  try {
    runId = sessionStorage.getItem(DECISION_RUN_KEY) || "";
  } catch {
    return;
  }
  if (!/^[a-f0-9-]{36}$/i.test(runId)) return;
  try {
    const result = await api(`/runs/${runId}`);
    if (!result.run?.publishedAt) hydrateRun(result.run);
    else rememberRun(null);
  } catch {
    rememberRun(null);
  }
}

$("#generateDecision")?.addEventListener("click", startStepByStep);

$("#nextDecisionStep")?.addEventListener("click", advanceNextStep);

$("#runAllDecision")?.addEventListener("click", runDecisionFlow);

$("#publishDecision")?.addEventListener("click", publishDecision);

render();
restoreSavedRun().finally(render);
