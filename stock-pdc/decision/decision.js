const DECISION_API_ENDPOINT = "/stock-pdc/decision/api";
const RUN_STORAGE_KEY = "turnpo-stock-pdc-decision-run";

const steps = [
  { id: "snapshot", title: "锁定研究数据快照", detail: "确认收盘状态、候选池版本与生成时间。", output: "已冻结输入事实包" },
  { id: "round-one", title: "第一轮独立盲评", detail: "每个旗舰模型仅基于同一份冻结事实包生成独立排名，不读取其他模型结论。", output: "已收到独立排名" },
  { id: "merge", title: "合并候选挑战池", detail: "去重并融合排名，保留值得复核的候选。", output: "挑战池已生成" },
  { id: "round-two", title: "第二轮证据复核", detail: "四个角色重新评估候选与关键反证。", output: "复核评分已完成" },
  { id: "risk-check", title: "市场与风险闸门", detail: "检查共识、风险与不应进入最终名单的候选。", output: "风险门槛已应用" },
  { id: "final", title: "生成最终研究名单", detail: "保留最多 10 个通过闸门的研究席位；不足不强行补足。", output: "决策快照已生成" }
];

const models = [
  { id: "pdc", name: "PDC", role: "综合型评审", note: "综合趋势、量价、因子与证据一致性。" },
  { id: "trend", name: "趋势", role: "趋势与量价评审", note: "独立识别趋势延续、相对强弱与量价确认。" },
  { id: "risk", name: "风险", role: "风险与过热审计", note: "专注下行、过热与不应参与的情形。" },
  { id: "counter", name: "反方", role: "反方证伪评审", note: "主动寻找论点漏洞、拥挤与证据不足。" }
];

const state = {
  running: false,
  completed: 0,
  activeStep: null,
  activeRoleId: "",
  error: "",
  run: null,
  dataContract: null,
  modelProfiles: [{ id: "gpt-5.6-sol", label: "GPT-5.6 Sol · Pro PDC", provider: "OpenAI", model: "gpt-5.6-sol" }],
  selectedModelProfileId: "gpt-5.6-sol",
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

function selectedModelProfile() {
  return state.modelProfiles.find((profile) => profile.id === state.selectedModelProfileId) || state.modelProfiles[0] || null;
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
  if (status === "active") return "正在评审";
  if (status === "complete") return "已提交 Top 20";
  return "等待开始";
}

function renderModels() {
  const grid = $("#modelGrid");
  if (!grid) return;
  const modelLabel = selectedModelProfile()?.label || "GPT-5.6 Sol · Pro PDC";
  grid.innerHTML = models.map((model) => `
    <article class="decision-model-card" data-state="${state.modelStates[model.id]}">
      <span>${escapeHtml(model.role)}</span>
      <h3>${escapeHtml(modelLabel)} · ${escapeHtml(model.name)}</h3>
      <p>${escapeHtml(model.note)}</p>
      <div class="decision-model-status">${escapeHtml(modelStatus(model))}</div>
    </article>
  `).join("");
}

function renderModelPicker() {
  const select = $("#decisionModelSelect");
  const note = $("#decisionModelNote");
  const profile = selectedModelProfile();
  if (!select || !note) return;
  select.innerHTML = state.modelProfiles.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)} · ${escapeHtml(item.model)}</option>`).join("");
  select.value = profile?.id || "";
  select.disabled = state.running || Boolean(state.run);
  note.textContent = profile
    ? `${profile.provider} · ${profile.model}。密钥只保留在服务端；本次选择会写入这份 Run。`
    : "当前没有可用模型。请先完成服务端模型配置。";
}

function setText(selector, value) {
  const node = $(selector);
  if (node) node.textContent = value || "—";
}

function renderDataContract() {
  const contract = state.dataContract || {};
  const governance = contract.governance || {};
  const primary = governance.primary || {};
  const backup = governance.backup || {};
  const snapshot = contract.snapshot || {};
  setText("#dataPrimary", primary.label || "Stock PDC 本地日度数据集");
  setText("#dataPrimaryPolicy", primary.policy || "统一事实包，供 Hawkeye、PDC 与复盘复用。");
  setText("#dataSnapshotId", snapshot.id || "等待锁定");
  setText("#dataSnapshotMeta", snapshot.candidateCount ? `${snapshot.candidateCount} 个候选 · ${contract.date || ""}` : "候选与特征将在开始后冻结");
  setText("#dataPriceRun", snapshot.priceDataRun || "等待数据批次");
  setText("#dataSourceFile", snapshot.sourceFile || "rank-flow.json");
  setText("#dataBackup", backup.label || "未配置备用校验源");
  setText("#dataBackupPolicy", backup.policy || "只做校验，不能混入正式计算。");
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
  if (mode) {
    const profile = run?.modelProfile || selectedModelProfile();
    mode.textContent = profile ? `${profile.label} · ${profile.model}` : "未配置模型";
  }
  if (copy) copy.textContent = state.error
    ? `已暂停：${state.error} 点击“继续生成”会从已保存的评审继续，不会重复已完成的角色。`
    : state.running
    ? `正在执行：${steps.find((step) => step.id === state.activeStep)?.title || "准备任务"}`
    : state.completed === steps.length
      ? "本次 Run 已完成。确认无误后，点击“发布到 PDC”才会追加当天正式记录。"
      : "点击开始生成后，每一个步骤都会在这里留下真实状态与产物。";
  if (button) {
    button.disabled = state.running;
    button.textContent = state.running ? "正在生成…" : state.run ? "继续生成" : "开始生成";
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
  try {
    if (state.run?.id && !state.run.publishedAt) sessionStorage.setItem(RUN_STORAGE_KEY, state.run.id);
    else if (state.run?.publishedAt) sessionStorage.removeItem(RUN_STORAGE_KEY);
  } catch {
    // The decision flow still works when browser storage is unavailable.
  }
  renderSteps();
  renderDataContract();
  renderModelPicker();
  renderModels();
  setRunSummary();
  renderResult();
}

async function api(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35000);
  try {
    const response = await fetch(`${DECISION_API_ENDPOINT}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        ...(options.headers || {})
      }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Decision API error (${response.status})`);
    return payload;
  } catch (caught) {
    if (caught?.name === "AbortError") throw new Error("该评审超过 35 秒未返回，可能是模型额度或网络问题。");
    throw caught;
  } finally {
    clearTimeout(timeout);
  }
}

async function latestSnapshot() {
  const response = await fetch("/stock-pdc/rank-flow.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load the current PDC fact snapshot.");
  const data = await response.json();
  const days = Array.isArray(data.days) ? data.days.filter((day) => Array.isArray(day.rows) && day.rows.length) : [];
  const latest = days.at(-1);
  if (!latest?.date || !latest.rows?.length) throw new Error("No current PDC candidates are available.");
  const governance = data.dataGovernance || {};
  const dataSnapshot = latest.dataSnapshot || {};
  const provenance = {
    snapshotId: dataSnapshot.id || `pdc-${latest.date}-rank-flow`,
    primarySourceId: dataSnapshot.primarySourceId || governance.primary?.id || "stock-pdc-local-frozen-watchlist",
    primarySourceLabel: governance.primary?.label || "Stock PDC 本地日度数据集",
    sourceFile: dataSnapshot.sourceFile || latest.sourceFile || "stock-pdc/rank-flow.json",
    priceDataRun: dataSnapshot.priceDataRun || data.priceDataDir || "",
    backupPolicy: governance.backup?.policy || "备用源只用于校验，不进入正式计算。",
    featureContract: governance.principle || "Deterministic facts, diversified reasoning."
  };
  state.dataContract = {
    date: latest.date,
    governance,
    snapshot: { ...provenance, candidateCount: latest.rows.length }
  };
  return {
    date: latest.date,
    source: provenance.sourceFile,
    provenance,
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

async function loadDataContract() {
  try {
    await latestSnapshot();
  } catch {
    // The decision run will show a concrete error if the required fact snapshot cannot be loaded.
  } finally {
    render();
  }
}

async function loadModelProfiles() {
  try {
    const result = await api("/models", { headers: { accept: "application/json" } });
    if (Array.isArray(result.models) && result.models.length) {
      state.modelProfiles = result.models;
      if (!state.modelProfiles.some((profile) => profile.id === state.selectedModelProfileId)) {
        state.selectedModelProfileId = state.modelProfiles[0].id;
      }
    }
  } catch {
    // Keep the default Luna profile visible while the authenticated API is unavailable.
  } finally {
    render();
  }
}

async function restoreSavedRun() {
  try {
    const runId = sessionStorage.getItem(RUN_STORAGE_KEY);
    if (!runId) return;
    const result = await api(`/runs/${runId}`, { headers: { accept: "application/json" } });
    if (!result.run?.publishedAt) {
      state.run = result.run;
      syncRunProgress();
    } else {
      sessionStorage.removeItem(RUN_STORAGE_KEY);
    }
  } catch {
    try { sessionStorage.removeItem(RUN_STORAGE_KEY); } catch { /* Storage is optional. */ }
  } finally {
    render();
  }
}

function completeThrough(stepId) {
  state.completed = steps.findIndex((step) => step.id === stepId) + 1;
  state.activeStep = null;
}

function syncRunProgress() {
  if (!state.run) return;
  state.completed = 1;
  state.modelStates = Object.fromEntries(models.map((model) => [model.id, "idle"]));
  state.run.roles?.forEach((role) => {
    if (role.state === "complete") state.modelStates[role.id] = "complete";
  });
  if (state.run.roundOneComplete) state.completed = 2;
  if (state.run.pool?.length) state.completed = 3;
  if (state.run.roundTwoComplete) state.completed = 4;
  if (state.run.status === "READY_TO_PUBLISH" || state.run.status === "PUBLISHED") state.completed = steps.length;
}

async function runReviewers(stage) {
  for (const model of models) {
    if (state.modelStates[model.id] === "complete" && stage === "round-one") continue;
    state.activeStep = stage;
    state.activeRoleId = model.id;
    state.modelStates[model.id] = "active";
    render();
    state.run = (await api(`/runs/${state.run.id}/${stage}/${model.id}`, { method: "POST", body: "{}" })).run;
    state.modelStates[model.id] = "complete";
    state.activeRoleId = "";
    render();
  }
}

async function runDecisionFlow() {
  state.running = true;
  state.error = "";
  if (!state.run) {
    state.completed = 0;
    state.activeStep = "snapshot";
    state.modelStates = Object.fromEntries(models.map((model) => [model.id, "idle"]));
  } else {
    syncRunProgress();
  }
  render();
  try {
    if (!state.run) {
      const snapshot = await latestSnapshot();
      state.run = (await api("/runs", {
        method: "POST",
        body: JSON.stringify({ snapshot, modelProfileId: state.selectedModelProfileId })
      })).run;
      completeThrough("snapshot");
      render();
    }

    if (!state.run.roundOneComplete) {
      await runReviewers("round-one");
      completeThrough("round-one");
      render();
    }

    if (!state.run.pool?.length) {
      state.activeStep = "merge";
      render();
      state.run = (await api(`/runs/${state.run.id}/merge`, { method: "POST", body: "{}" })).run;
      completeThrough("merge");
      render();
    }

    if (!state.run.roundTwoComplete) {
      state.modelStates = Object.fromEntries(models.map((model) => [model.id, "idle"]));
      await runReviewers("round-two");
      completeThrough("round-two");
      render();
    }

    if (state.run.status !== "READY_TO_PUBLISH" && state.run.status !== "PUBLISHED") {
      state.activeStep = "risk-check";
      render();
      state.run = (await api(`/runs/${state.run.id}/risk-check`, { method: "POST", body: "{}" })).run;
      completeThrough("risk-check");
      state.activeStep = "final";
      render();
      completeThrough("final");
    }
  } catch (caught) {
    state.error = caught.message || "请稍后重试。";
  } finally {
    state.running = false;
    state.activeRoleId = "";
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

$("#decisionModelSelect")?.addEventListener("change", (event) => {
  if (state.running || state.run) return;
  state.selectedModelProfileId = event.currentTarget.value;
  render();
});

$("#publishDecision")?.addEventListener("click", publishDecision);

render();
loadModelProfiles();
loadDataContract();
restoreSavedRun();
