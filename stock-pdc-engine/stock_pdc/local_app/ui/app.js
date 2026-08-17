const STAGES = [
  { id: "01", name: "Frozen Facts", short: "冻结事实", parents: [], description: "冻结行情文件、元数据和本次运行配置，作为全链路唯一输入。" },
  { id: "02", name: "Hawkeye", short: "鹰眼筛选", parents: ["01"], description: "按固定规则建立候选池，不在这里做趋势或风险判断。" },
  { id: "03", name: "Round 1 Members", short: "第一轮成员", parents: ["01", "02"], description: "对鹰眼候选逐票运行第一轮本地确定性成员评分。" },
  { id: "04", name: "R1 Aggregate / Shortlist", short: "第一轮汇总", parents: ["03"], description: "汇总第一轮结果，形成下一轮短名单。" },
  { id: "05", name: "Round 2 Members", short: "第二轮成员", parents: ["01", "04"], description: "只对短名单重新运行成员评分，保留独立 Attempt。" },
  { id: "06", name: "Secretary", short: "秘书汇总", parents: ["03", "04", "05"], description: "整理分歧、均值、状态分布和风险信息。" },
  { id: "07", name: "Blue Whale", short: "蓝鲸复核", parents: ["01", "03", "05", "06"], description: "基于已冻结证据做一次独立的研究风险复核。" },
  { id: "08", name: "Final Gate", short: "最终闸门", parents: ["02", "04", "05", "06", "07"], description: "决定哪些股票进入研究候选、观察或阻断名单。" },
  { id: "09", name: "Final Decision", short: "最终决定", parents: ["07", "08"], description: "输出研究结论，不产生任何真实交易动作。" }
];

const $ = (id) => document.getElementById(id);
let currentRunId = readSavedRun();
let currentRun = null;
let currentStages = [];
let currentCodexJob = null;
let codexPollTimer = null;
let auditStageId = "";
let auditAttemptId = "";
let auditRunId = "";
let auditFiles = [];
let auditFileName = "output.json";
let auditFileContent = null;
let auditLoading = false;
const CODEX_REVIEW_STAGES = new Set(["03", "05", "06", "07", "08", "09"]);

function readSavedRun() {
  try { return window.localStorage.getItem("stock-selector-current-run") || ""; } catch (_) { return ""; }
}

function saveCurrentRun(runId) {
  currentRunId = runId || "";
  try {
    if (currentRunId) window.localStorage.setItem("stock-selector-current-run", currentRunId);
    else window.localStorage.removeItem("stock-selector-current-run");
  } catch (_) {}
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setMessage(message, kind = "info") {
  const node = $("message");
  node.textContent = message;
  node.dataset.kind = kind;
}

function setActionButtonsDisabled(disabled) {
  [$("newRunButton"), $("openCodexButton"), $("refreshButton")].forEach((button) => {
    if (button) button.disabled = disabled;
  });
}

function stageMap(stages) {
  return new Map((stages || []).map((stage) => [stage.stageId, stage]));
}

function firstUnresolvedStage(stages) {
  return (stages || []).find((stage) => ["NOT_STARTED", "CANDIDATE", "STALE"].includes(stage.status));
}

function stageMeta(stageId) {
  return STAGES.find((stage) => stage.id === stageId) || STAGES[0];
}

function statusText(status) {
  return {
    VALID: "已通过",
    CANDIDATE: "待选择",
    STALE: "需要重跑",
    NOT_STARTED: "未开始",
    SELECTED: "已选择"
  }[status] || status || "未开始";
}

function renderProgress(stages = []) {
  const byId = stageMap(stages);
  const current = firstUnresolvedStage(stages);
  $("progressRail").innerHTML = STAGES.map((meta, index) => {
    const stage = byId.get(meta.id) || { stageId: meta.id, status: "NOT_STARTED", attempts: [] };
    const status = stage.status || "NOT_STARTED";
    const isCurrent = current?.stageId === meta.id;
    const isDone = status === "VALID";
    const marker = isDone ? "✓" : String(index + 1).padStart(2, "0");
    const attemptCount = stage.attempts?.length ? `${stage.attempts.length} 个 Attempt` : "等待输入";
    return `
      <div class="progress-step stage-${status.toLowerCase()}${isCurrent ? " is-current" : ""}">
        <span class="progress-node">${marker}</span>
        <div class="progress-copy">
          <strong>${escapeHtml(meta.short)}</strong>
          <small>${escapeHtml(statusText(status))} · ${escapeHtml(attemptCount)}</small>
        </div>
      </div>
      ${index < STAGES.length - 1 ? `<span class="progress-connector${isDone ? " connector-done" : ""}"></span>` : ""}
    `;
  }).join("");
  const done = stages.length === STAGES.length && stages.every((stage) => stage.status === "VALID");
  $("workflowMeta").textContent = !currentRunId
    ? "先创建 Run，从 Stage 01 开始"
    : done
      ? "全部 Stage 已通过，Run 已完成"
      : `当前处理：Stage ${current?.stageId || "—"}`;
}

function renderRuns(runs = []) {
  const node = $("runsList");
  if (!runs.length) {
    node.className = "empty-state";
    node.textContent = "暂时没有已登记的本地 Run。";
    return;
  }
  node.className = "runs-list";
  node.innerHTML = runs.slice(0, 8).map((run) => `
    <button class="run-row${run.runId === currentRunId ? " is-selected" : ""}" data-run-id="${escapeHtml(run.runId)}" type="button">
      <span class="run-row-main"><strong>${escapeHtml(run.runId)}</strong><small>${escapeHtml(run.updatedAt || run.analysisDate || "未设置日期")}</small></span>
      <span class="pill">${escapeHtml(run.status)}</span>
    </button>
  `).join("");
  node.querySelectorAll("[data-run-id]").forEach((button) => {
    button.addEventListener("click", () => {
      saveCurrentRun(button.dataset.runId);
      refresh();
    });
  });
}

function renderCurrentStep(stages = []) {
  const current = firstUnresolvedStage(stages);
  const byId = stageMap(stages);
  const title = $("currentStageTitle");
  const badge = $("currentStageBadge");
  const description = $("currentStageDescription");
  const action = $("currentAction");
  const codexPanel = $("codexJobPanel");
  $("attemptInspector").hidden = true;
  $("attemptInspector").textContent = "";

  if (!currentRunId || !current) {
    title.textContent = currentRunId ? "Run 已完成" : "先创建 Run";
    badge.textContent = currentRunId ? "DONE" : "STEP 0";
    description.textContent = currentRunId ? "1–9 个 Stage 都已通过。你可以回到任意历史 Attempt 做审计和比较。" : "创建本地 Run 后，系统会从 Frozen Facts 开始。每个 Stage 都会保留独立 Attempt。";
    action.innerHTML = currentRunId
      ? `<div class="done-callout"><span class="done-icon">✓</span><div><strong>研究流程完成</strong><small>结果仍然是研究输出，不会自动下单。</small></div></div>`
      : `<button class="button primary wide-button" id="emptyCreateRun" type="button">创建第一个本地 Run <span>→</span></button>`;
    $("emptyCreateRun")?.addEventListener("click", createRun);
    $("currentStepLabel").textContent = currentRunId ? "1–9 已完成" : "先新建一个本地 Run";
    codexPanel.hidden = true;
    return;
  }

  const meta = stageMeta(current.stageId);
  title.textContent = `${meta.short} · ${meta.name}`;
  badge.textContent = `STAGE ${meta.id}`;
  description.textContent = meta.description;
  $("currentStepLabel").textContent = `下一步：Stage ${meta.id} · ${meta.short}`;
  const attempts = current.attempts || [];
  const candidates = attempts.filter((attempt) => attempt.status === "CANDIDATE");
  const codexButton = CODEX_REVIEW_STAGES.has(current.stageId)
    ? `<button class="button codex-review-button" id="currentCodexReviewButton" type="button">使用 Codex 复核（只读）</button>`
    : "";
  const attemptRows = attempts.map((attempt) => `
    <div class="attempt-row">
      <span><strong>${escapeHtml(attempt.attemptId)}</strong><small>${escapeHtml(attempt.executionMode || "LOCAL")}</small></span>
      <span class="attempt-status attempt-${String(attempt.status).toLowerCase()}">${escapeHtml(statusText(attempt.status))}</span>
      <button class="text-button" data-inspect-stage="${escapeHtml(current.stageId)}" data-inspect-attempt="${escapeHtml(attempt.attemptId)}" type="button">查看</button>
      ${attempt.status === "CANDIDATE" ? `<button class="button mini-button" data-select-stage="${escapeHtml(current.stageId)}" data-select-attempt="${escapeHtml(attempt.attemptId)}" type="button">选择</button>` : ""}
    </div>
  `).join("");

  if (current.status === "CANDIDATE") {
    action.innerHTML = `
      <div class="step-callout candidate-callout"><span class="callout-number">2</span><div><strong>先检查 Attempt，再选择 Checkpoint</strong><small>当前有 ${candidates.length} 个候选版本。选择后才会解锁下一个 Stage。</small></div></div>
      <div class="attempt-list">${attemptRows}</div>
      ${codexButton}
    `;
  } else {
    const buttonText = current.status === "STALE" ? `重新运行 Stage ${meta.id}` : `运行 Stage ${meta.id}`;
    const reason = current.status === "STALE" ? "上游版本已经变化，旧结果保留但不能继续作为当前链路。" : "点击后生成一个新的 Attempt；生成后请返回这里检查并选择。";
    action.innerHTML = `
      <div class="step-callout"><span class="callout-number">1</span><div><strong>${escapeHtml(reason)}</strong><small>执行模式：本地确定性 Core · 研究模式</small></div></div>
      <button class="button primary wide-button" id="currentRunStageButton" type="button">${escapeHtml(buttonText)} <span>→</span></button>
      ${codexButton}
      ${attemptRows ? `<div class="attempt-list previous-attempts"><div class="attempt-list-title">历史 Attempt</div>${attemptRows}</div>` : ""}
    `;
    $("currentRunStageButton")?.addEventListener("click", () => executeStage(current.stageId));
  }
  $("currentCodexReviewButton")?.addEventListener("click", () => startCodexReview(current.stageId));
  action.querySelectorAll("[data-select-stage]").forEach((button) => {
    button.addEventListener("click", () => selectAttempt(button.dataset.selectStage, button.dataset.selectAttempt));
  });
  action.querySelectorAll("[data-inspect-stage]").forEach((button) => {
    button.addEventListener("click", () => inspectAttempt(button.dataset.inspectStage, button.dataset.inspectAttempt));
  });
  renderCodexJob();
}

function clearFinalDecision() {
  $("finalDecisionPanel").hidden = true;
  $("finalDecisionSummary").textContent = "";
  $("finalDecisionList").textContent = "";
}

async function loadFinalDecision() {
  const stage = currentStages.find((item) => item.stageId === "09" && item.status === "VALID");
  if (!currentRunId || !stage?.selectedAttempt) {
    clearFinalDecision();
    return;
  }
  try {
    const response = await fetch(`/api/runs/${encodeURIComponent(currentRunId)}/stages/09/attempts/${encodeURIComponent(stage.selectedAttempt)}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "无法读取最终研究结论。");
    const data = payload.output?.data || {};
    const decisions = Array.isArray(data.decisions) ? data.decisions : [];
    const counts = decisions.reduce((result, item) => {
      const key = String(item.decision || "UNKNOWN");
      result[key] = (result[key] || 0) + 1;
      return result;
    }, {});
    $("finalDecisionPanel").hidden = false;
    $("finalDecisionSummary").innerHTML = ["RESEARCH_CANDIDATE", "WATCH", "EXCLUDED"].map((key) =>
      `<span><strong>${escapeHtml(counts[key] || 0)}</strong><small>${escapeHtml(key.replaceAll("_", " "))}</small></span>`
    ).join("");
    $("finalDecisionList").innerHTML = decisions.slice(0, 12).map((item) => `
      <article class="decision-row">
        <div><strong>${escapeHtml(item.ticker || "—")}</strong><small>${escapeHtml(item.finalStatus || "无状态")}</small></div>
        <span class="decision-status decision-${escapeHtml(String(item.decision || "unknown").toLowerCase())}">${escapeHtml(item.decision || "UNKNOWN")}</span>
        <p>${escapeHtml(item.mainRisk || "未记录额外风险")}</p>
      </article>
    `).join("") || `<div class="empty-state">Final Gate 没有留下研究候选。</div>`;
  } catch (error) {
    clearFinalDecision();
    setMessage(`读取最终研究结论失败：${error.message}`, "error");
  }
}

function renderCodexJob() {
  const panel = $("codexJobPanel");
  if (!currentCodexJob || currentCodexJob.runId !== currentRunId) {
    currentCodexJob = null;
    panel.hidden = true;
    panel.textContent = "";
    return;
  }
  const job = currentCodexJob;
  const status = job.status || "UNKNOWN";
  const result = job.result || {};
  const summary = result.summary ? `<p>${escapeHtml(result.summary)}</p>` : "";
  const findings = Array.isArray(result.findings) && result.findings.length
    ? `<small>${escapeHtml(`${result.findings.length} 条研究发现 · ${result.riskFlags?.length || 0} 个风险标记`)}</small>`
    : "";
  panel.hidden = false;
  panel.innerHTML = `
    <div class="codex-job-heading"><span>CODEX READ-ONLY REVIEW</span><strong>${escapeHtml(status)}</strong></div>
    <p class="codex-job-meta">${escapeHtml(job.jobId || "")} · 不会自动选择 Checkpoint，不会交易</p>
    ${summary}${findings}
    ${status === "RUNNING" || status === "QUEUED" ? `<button class="text-button" id="cancelCodexReviewButton" type="button">取消这次复核</button>` : ""}
    ${status === "FAILED" ? `<small class="codex-error">${escapeHtml(job.error || "复核没有完成")}</small>` : ""}
  `;
  $("cancelCodexReviewButton")?.addEventListener("click", cancelCodexReview);
}

function summarizeAttempt(payload) {
  const output = payload.output || {};
  const data = output.data || {};
  const ignored = new Set(["universe", "metadata", "rows", "results", "sourceFilesSha256"]);
  const items = Object.entries(data).filter(([key]) => !ignored.has(key)).slice(0, 8);
  const formatValue = (value) => {
    if (Array.isArray(value)) return `${value.length} 项`;
    if (value && typeof value === "object") return `${Object.keys(value).length} 个字段`;
    return String(value ?? "");
  };
  const scalarRows = items.map(([key, value]) => `<div><span>${escapeHtml(key)}</span><strong>${escapeHtml(formatValue(value))}</strong></div>`).join("");
  const sizes = [];
  if (Array.isArray(data.rows)) sizes.push(`${data.rows.length} 行`);
  if (Array.isArray(data.results)) sizes.push(`${data.results.length} 个筛选结果`);
  if (data.universe && typeof data.universe === "object") sizes.push(`${Object.keys(data.universe).length} 个冻结标的`);
  return `<div class="inspector-heading"><span>ATTEMPT CHECK</span><button class="text-button" id="closeInspector" type="button">收起</button></div><h3>${escapeHtml(payload.checkpoint?.stageName || "Attempt")}</h3><p>${escapeHtml(payload.checkpoint?.attemptId || "")} · ${escapeHtml(payload.checkpoint?.executionMode || "")}</p><div class="inspector-grid">${scalarRows || `<div><span>output</span><strong>已生成</strong></div>`}</div><small class="inspector-foot">${escapeHtml(sizes.join(" · ") || "结构化输出已保存，可通过 Diff 比较")}</small>`;
}

async function inspectAttempt(stageId, attemptId) {
  try {
    const response = await fetch(`/api/runs/${encodeURIComponent(currentRunId)}/stages/${encodeURIComponent(stageId)}/attempts/${encodeURIComponent(attemptId)}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "无法读取 Attempt。");
    const inspector = $("attemptInspector");
    inspector.innerHTML = summarizeAttempt(payload);
    inspector.hidden = false;
    $("closeInspector")?.addEventListener("click", () => { inspector.hidden = true; });
  } catch (error) {
    setMessage(`读取 Attempt 失败：${error.message}`, "error");
  }
}

function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function selectedAuditStage(stages = currentStages) {
  return stages.find((stage) => stage.stageId === auditStageId) || null;
}

function ensureAuditSelection(stages = currentStages) {
  const current = selectedAuditStage(stages);
  if (auditRunId !== currentRunId || !current || !(current.attempts || []).some((attempt) => attempt.attemptId === auditAttemptId)) {
    const completed = [...stages].reverse().find((stage) => stage.selectedAttempt || stage.attempts?.length);
    auditRunId = currentRunId;
    auditStageId = completed?.stageId || "";
    auditAttemptId = completed?.selectedAttempt || completed?.attempts?.[0]?.attemptId || "";
    auditFiles = [];
    auditFileContent = null;
    auditFileName = "output.json";
  }
}

function renderStageAudit(stages = currentStages) {
  const panel = $("stageAuditPanel");
  if (!currentRunId || !stages.length) {
    panel.hidden = true;
    return;
  }
  ensureAuditSelection(stages);
  panel.hidden = false;
  $("auditStageList").innerHTML = STAGES.map((meta) => {
    const stage = stages.find((item) => item.stageId === meta.id) || { attempts: [], status: "NOT_STARTED" };
    const available = Boolean(stage.attempts?.length);
    return `<button class="audit-stage-button${auditStageId === meta.id ? " is-selected" : ""}" data-audit-stage="${meta.id}" type="button" ${available ? "" : "disabled"}>
      <strong>${escapeHtml(meta.id)} · ${escapeHtml(meta.short)}</strong>
      <small>${escapeHtml(statusText(stage.status))}${available ? ` · ${stage.attempts.length} 个版本` : ""}</small>
    </button>`;
  }).join("");
  $("auditStageList").querySelectorAll("[data-audit-stage]").forEach((button) => {
    button.addEventListener("click", () => openStageAudit(button.dataset.auditStage));
  });
  renderAuditDetail(stages);
  if (auditStageId && auditAttemptId && !auditLoading && !auditFiles.length) loadAuditFiles();
}

function renderAuditDetail(stages = currentStages) {
  const detail = $("auditDetail");
  const stage = selectedAuditStage(stages);
  if (!stage || !auditAttemptId) {
    detail.innerHTML = `<div class="empty-state">此 Run 尚未生成可审计的 Attempt。</div>`;
    return;
  }
  const attempts = stage.attempts || [];
  const options = attempts.map((attempt) => `<option value="${escapeHtml(attempt.attemptId)}" ${attempt.attemptId === auditAttemptId ? "selected" : ""}>${escapeHtml(attempt.attemptId)} · ${escapeHtml(attempt.status)} · ${escapeHtml(attempt.executionMode || "LOCAL")}</option>`).join("");
  const fileButtons = auditFiles.length
    ? auditFiles.map((file) => `<button class="audit-file-button${file.name === auditFileName ? " is-selected" : ""}" data-audit-file="${escapeHtml(file.name)}" type="button"><strong>${escapeHtml(file.name)}</strong><small>${escapeHtml(formatBytes(file.bytes))} · ${escapeHtml(String(file.sha256).slice(0, 12))}…</small></button>`).join("")
    : `<span class="audit-loading">${auditLoading ? "正在读取文件目录…" : "文件目录等待读取"}</span>`;
  let raw = "选择一个文件即可读取全部 JSON。";
  if (auditLoading && !auditFileContent) raw = "正在读取完整文件内容…";
  if (auditFileContent !== null) raw = JSON.stringify(auditFileContent, null, 2);
  detail.innerHTML = `
    <div class="audit-detail-heading">
      <div><strong>Stage ${escapeHtml(stage.stageId)} · ${escapeHtml(stage.name)}</strong><small>该 Attempt 只读；页面不会修改文件。</small></div>
      <label>审计版本<select id="auditAttemptSelect">${options}</select></label>
    </div>
    <div class="audit-file-list">${fileButtons}</div>
    <div class="audit-file-content-heading"><strong>${escapeHtml(auditFileName)}</strong><small>完整结构化内容</small></div>
    <pre class="audit-json" id="auditJsonContent"></pre>
  `;
  $("auditJsonContent").textContent = raw;
  $("auditAttemptSelect")?.addEventListener("change", (event) => openStageAudit(stage.stageId, event.target.value));
  detail.querySelectorAll("[data-audit-file]").forEach((button) => {
    button.addEventListener("click", () => openAuditFile(button.dataset.auditFile));
  });
}

async function openStageAudit(stageId, attemptId = "") {
  const stage = currentStages.find((item) => item.stageId === stageId);
  if (!stage?.attempts?.length) return;
  auditStageId = stageId;
  auditRunId = currentRunId;
  auditAttemptId = attemptId || stage.selectedAttempt || stage.attempts[0].attemptId;
  auditFiles = [];
  auditFileContent = null;
  auditFileName = "output.json";
  renderStageAudit();
}

async function loadAuditFiles() {
  if (!currentRunId || !auditStageId || !auditAttemptId) return;
  if (auditLoading) return;
  const requestKey = `${currentRunId}/${auditStageId}/${auditAttemptId}`;
  auditLoading = true;
  renderAuditDetail();
  try {
    const response = await fetch(`/api/runs/${encodeURIComponent(currentRunId)}/stages/${encodeURIComponent(auditStageId)}/attempts/${encodeURIComponent(auditAttemptId)}/files`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "无法读取 Attempt 文件目录。");
    if (requestKey !== `${currentRunId}/${auditStageId}/${auditAttemptId}`) return;
    auditFiles = payload.files || [];
    auditLoading = false;
    renderAuditDetail();
    await openAuditFile(auditFiles.some((file) => file.name === auditFileName) ? auditFileName : auditFiles[0]?.name);
  } catch (error) {
    auditLoading = false;
    auditFiles = [];
    renderAuditDetail();
    setMessage(`读取 Attempt 文件目录失败：${error.message}`, "error");
  }
}

async function openAuditFile(fileName) {
  if (!fileName || !currentRunId || !auditStageId || !auditAttemptId) return;
  auditFileName = fileName;
  auditFileContent = null;
  auditLoading = true;
  renderAuditDetail();
  const requestKey = `${currentRunId}/${auditStageId}/${auditAttemptId}/${fileName}`;
  try {
    const response = await fetch(`/api/runs/${encodeURIComponent(currentRunId)}/stages/${encodeURIComponent(auditStageId)}/attempts/${encodeURIComponent(auditAttemptId)}/files/${encodeURIComponent(fileName)}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || `无法读取 ${fileName}。`);
    if (requestKey !== `${currentRunId}/${auditStageId}/${auditAttemptId}/${auditFileName}`) return;
    auditFileContent = payload.content;
  } catch (error) {
    auditFileContent = { error: error.message };
    setMessage(`读取 Attempt 文件失败：${error.message}`, "error");
  } finally {
    auditLoading = false;
    renderAuditDetail();
  }
}

async function refresh() {
  if (window.location.protocol === "file:") {
    $("fileNotice").hidden = false;
    setActionButtonsDisabled(true);
    $("serviceStatus").textContent = "需要本地服务";
    $("serviceDetail").textContent = "请双击 PDC Local.command";
    setMessage("当前页面是 file://，无法连接本地 API。请双击 选股神器.command 启动。", "error");
    renderProgress([]);
    renderCurrentStep([]);
    renderStageAudit([]);
    return;
  }
  $("fileNotice").hidden = true;
  try {
    const [statusResponse, runsResponse] = await Promise.all([
      fetch("/api/system/status", { cache: "no-store" }),
      fetch("/api/runs", { cache: "no-store" })
    ]);
    if (!statusResponse.ok || !runsResponse.ok) throw new Error("本地服务返回异常状态。");
    const status = await statusResponse.json();
    const runsPayload = await runsResponse.json();
    const service = status.service || {};
    const codex = status.codex || {};
    const pipeline = status.pipeline || {};
    $("serviceStatus").textContent = service.status || "UNKNOWN";
    $("serviceDetail").textContent = `${service.host || "127.0.0.1"}:${service.port || "—"}`;
    $("codexStatus").textContent = codex.status || "UNKNOWN";
    $("codexDetail").textContent = codex.version || codex.message || "—";
    $("pipelineStatus").textContent = pipeline.status || "UNKNOWN";
    $("pipelineDetail").textContent = pipeline.message || "—";
    $("workspacePath").textContent = `Workspace: ${service.projectRoot || "—"}`;
    const runs = runsPayload.runs || [];
    renderRuns(runs);
    if (currentRunId && !runs.some((run) => run.runId === currentRunId)) saveCurrentRun("");
    if (!currentRunId && runs.length) saveCurrentRun(runs[0].runId);
    currentRun = null;
    currentStages = [];
    if (currentRunId) {
      const runResponse = await fetch(`/api/runs/${encodeURIComponent(currentRunId)}`, { cache: "no-store" });
      if (runResponse.ok) {
        const runPayload = await runResponse.json();
        currentRun = runPayload.run || null;
        currentStages = currentRun?.stages || [];
      }
    }
    $("currentRunLabel").textContent = currentRun ? `${currentRun.runId} · ${currentRun.status}` : "尚未创建";
    renderProgress(currentStages);
    renderCurrentStep(currentStages);
    renderStageAudit(currentStages);
    await loadFinalDecision();
  } catch (error) {
    $("serviceStatus").textContent = "ERROR";
    $("serviceDetail").textContent = error.message;
    setMessage(`无法读取本地状态：${error.message}`, "error");
    renderProgress([]);
    renderCurrentStep([]);
    renderStageAudit([]);
    clearFinalDecision();
  }
}

async function openCodex() {
  const button = $("openCodexButton");
  button.disabled = true;
  setMessage("正在请求打开 Codex 工作区…");
  try {
    const response = await fetch("/api/codex/open", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || payload.codex?.message || "Codex 未能启动。");
    setMessage(`Codex 已请求打开 PDC 工程：${payload.workspace}`, "success");
  } catch (error) {
    setMessage(`打开 Codex 失败：${error.message}`, "error");
  } finally {
    button.disabled = false;
  }
}

async function createRun() {
  const button = $("newRunButton");
  button.disabled = true;
  setMessage("正在创建本地 Run…");
  try {
    const response = await fetch("/api/runs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ metadata: { createdFrom: "PDC Local Dashboard" } }) });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "无法创建 Run。");
    saveCurrentRun(payload.run.runId);
    setMessage(`Run ${currentRunId} 已创建。从 Stage 01 开始。`, "success");
    await refresh();
  } catch (error) {
    setMessage(`创建 Run 失败：${error.message}`, "error");
  } finally {
    button.disabled = false;
  }
}

async function executeStage(stageId) {
  setMessage(`正在运行 Stage ${stageId}…`);
  try {
    const response = await fetch(`/api/runs/${encodeURIComponent(currentRunId)}/stages/${encodeURIComponent(stageId)}/execute`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ select: false }) });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || `Stage ${stageId} 执行失败。`);
    setMessage(`Stage ${stageId} 已生成 ${payload.checkpoint.attemptId}。请检查后选择。`, "success");
    await refresh();
  } catch (error) {
    setMessage(`Stage ${stageId} 执行失败：${error.message}`, "error");
  }
}

async function startCodexReview(stageId) {
  if (!currentRunId) return;
  setMessage(`正在启动 Stage ${stageId} 的 Codex 只读复核…`);
  try {
    const response = await fetch(`/api/runs/${encodeURIComponent(currentRunId)}/stages/${encodeURIComponent(stageId)}/codex-review`, {
      method: "POST", headers: { "content-type": "application/json" }, body: "{}"
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "Codex 复核未能启动。");
    currentCodexJob = payload.job;
    renderCodexJob();
    setMessage(`Codex 正在只读复核 Stage ${stageId}。结果只会保存为独立审计证据。`, "success");
    pollCodexJob();
  } catch (error) {
    setMessage(`Codex 复核启动失败：${error.message}`, "error");
  }
}

async function pollCodexJob() {
  if (!currentRunId || !currentCodexJob?.jobId) return;
  if (codexPollTimer) window.clearTimeout(codexPollTimer);
  try {
    const response = await fetch(`/api/runs/${encodeURIComponent(currentRunId)}/codex-jobs/${encodeURIComponent(currentCodexJob.jobId)}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "无法读取 Codex 复核状态。");
    currentCodexJob = payload.job;
    renderCodexJob();
    if (["QUEUED", "RUNNING"].includes(currentCodexJob.status)) {
      codexPollTimer = window.setTimeout(pollCodexJob, 1200);
    } else if (currentCodexJob.status === "COMPLETED") {
      setMessage("Codex 复核已完成。请阅读独立证据；它没有改变任何 Checkpoint。", "success");
    }
  } catch (error) {
    setMessage(`读取 Codex 复核失败：${error.message}`, "error");
  }
}

async function cancelCodexReview() {
  if (!currentRunId || !currentCodexJob?.jobId) return;
  try {
    const response = await fetch(`/api/runs/${encodeURIComponent(currentRunId)}/codex-jobs/${encodeURIComponent(currentCodexJob.jobId)}/cancel`, {
      method: "POST", headers: { "content-type": "application/json" }, body: "{}"
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "无法取消 Codex 复核。");
    currentCodexJob = payload.job;
    renderCodexJob();
    setMessage("已取消 Codex 复核。PDC Checkpoint 没有变化。", "success");
  } catch (error) {
    setMessage(`取消 Codex 复核失败：${error.message}`, "error");
  }
}

async function selectAttempt(stageId, attemptId) {
  setMessage(`正在选择 Stage ${stageId} 的 ${attemptId}…`);
  try {
    const response = await fetch(`/api/runs/${encodeURIComponent(currentRunId)}/stages/${encodeURIComponent(stageId)}/select`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ attemptId }) });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "无法选择 Checkpoint。");
    const stale = payload.staleStages?.length ? ` 下游已标记 STALE：${payload.staleStages.join(", ")}` : "";
    setMessage(`Stage ${stageId} 已选择 ${attemptId}。${stale}`, "success");
    await refresh();
  } catch (error) {
    setMessage(`选择 Checkpoint 失败：${error.message}`, "error");
  }
}

$("refreshButton").addEventListener("click", refresh);
$("newRunButton").addEventListener("click", createRun);
$("openCodexButton").addEventListener("click", openCodex);
renderProgress([]);
renderCurrentStep([]);
refresh();
