const IS_DEMO_MODE = window.location.pathname.startsWith("/stock-pdc/decision-demo");
const DECISION_API_ENDPOINT = IS_DEMO_MODE ? "/stock-pdc/decision-demo/api" : "/stock-pdc/decision/api";
const RUN_STORAGE_KEY = IS_DEMO_MODE ? "turnpo-stock-pdc-decision-demo-run" : "turnpo-stock-pdc-decision-run";
const PDC_MODE_LABEL = IS_DEMO_MODE ? "Mini Demo" : "正式 PDC";
const PDC_DIMENSIONS = [
  { id: "marketRegime", short: "市场" },
  { id: "relativeStrength", short: "相对强" },
  { id: "trendAcceleration", short: "趋势加速" },
  { id: "breakoutConfirmation", short: "突破确认" },
  { id: "volumeFlowConfirmation", short: "量价确认" },
  { id: "catalystInformation", short: "短催化" },
  { id: "entryTiming", short: "买点" },
  { id: "overheatReversalRisk", short: "低反转" },
  { id: "downsideFailureRisk", short: "低下行" }
];

const BACKGROUND_CHECKS = [
  ["fundamentalRedFlag", "基本面红旗"],
  ["valuationExtremeFlag", "估值极端"],
  ["majorEventRisk", "重大事件"],
  ["financialDistressFlag", "财务困境"],
  ["stDelistingRisk", "ST/退市风险"]
];

const steps = [
  { id: "verify", stage: "prepare", title: `验证${IS_DEMO_MODE ? "Mini" : "旗舰"}模型可用性`, detail: "用本轮的 API Key 与实际 Model ID 做一次极短的真实 JSON 请求。", output: "所有委员已通过验证" },
  { id: "snapshot", stage: "prepare", title: "锁定研究数据快照", detail: "确认收盘状态、候选池版本与生成时间。", output: "事实包已冻结" },
  { id: "round-one", stage: "review", title: "第一轮独立盲评", detail: "五位模型只看同一份事实包，不读取其他模型结论。", output: "首轮结论已收齐" },
  { id: "merge", stage: "review", title: "合并共同复核池", detail: "程序去重并汇总首轮排名，找出值得再次研究的候选。", output: "Top 20 已形成" },
  { id: "round-two", stage: "review", title: "第二轮证据复核", detail: "五位模型对共同候选重新检查，并交回最终复核意见。", output: "复核结论已收齐" },
  { id: "secretary", stage: "review", title: "Secretary 汇总", detail: "GPT Terra 汇总第二轮所有结论、分歧与待复核风险。", output: "Secretary 摘要已生成" },
  { id: "risk-check", stage: "deliver", title: "共识与风险闸门", detail: "程序核对支持票、排除意见、九维评分和风险信号。", output: "风险闸门已完成" },
  { id: "final", stage: "deliver", title: "生成最终研究名单", detail: "只保留通过闸门的研究席位；不足 10 个也不会强行补足。", output: "本轮名单已生成" }
];

const decisionStages = [
  { id: "prepare", number: "A", title: "准备事实", detail: "先锁定本轮所有人共同使用的研究输入。" },
  { id: "review", number: "B", title: "独立判断", detail: "模型先分别判断，再基于共同候选做第二次复核。" },
  { id: "deliver", number: "C", title: "共识交付", detail: "由程序应用共识与风险规则，形成可审阅的最终名单。" }
];

const state = {
  running: false,
  completed: 0,
  activeStep: null,
  activeMemberId: "",
  expandedMemberId: "",
  error: "",
  run: null,
  dataContract: null,
  modelProfiles: [{ id: IS_DEMO_MODE ? "gpt-5.6-luna" : "gpt-5.6-sol", label: IS_DEMO_MODE ? "GPT-5.6 Luna · Mini Demo" : "GPT-5.6 Sol · Pro PDC", provider: "OpenAI", model: IS_DEMO_MODE ? "gpt-5.6-luna" : "gpt-5.6-sol", tier: IS_DEMO_MODE ? "mini-demo" : "flagship" }],
  selectedModelProfileIds: [IS_DEMO_MODE ? "gpt-5.6-luna" : "gpt-5.6-sol"],
  modelStates: { [IS_DEMO_MODE ? "gpt-5.6-luna" : "gpt-5.6-sol"]: "idle" },
  verification: {},
  testing: false,
  smokeTests: {},
  refreshingMarketData: false,
  marketRefreshMessage: "",
  marketRefreshError: "",
  marketRefreshWorkflowUrl: "",
  marketRefreshManualOnly: false
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

function selectedModelProfiles() {
  const selected = state.modelProfiles.filter((profile) => state.selectedModelProfileIds.includes(profile.id));
  return selected.length ? selected : state.modelProfiles;
}

const WORKFLOW_STAGES = [
  { id: "verify", title: "模型验证", call: "5 PDC + Secretary Terra" },
  { id: "snapshot", title: "事实快照", call: "行情数据 + Hawkeye" },
  { id: "round-one", title: "第一轮", call: "5 PDC × 全部候选 · 完整性校验" },
  { id: "merge", title: "共同复核池", call: "首轮结果 → Top 20" },
  { id: "round-two", title: "第二轮", call: "Top 20 × 5 PDC" },
  { id: "secretary", title: "Secretary 汇总", call: "GPT-5.6 Terra" },
  { id: "risk-check", title: "最终名单", call: "共识 + 风险闸门 → Top 10" }
];

function auditTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? escapeHtml(value) : date.toLocaleString("zh-CN", { hour12: false });
}

function rawAuditMarkup(value, label = "完整记录") {
  if (!value || (typeof value === "object" && !Object.keys(value).length)) return "";
  return `<details class="decision-workflow-raw"><summary>${escapeHtml(label)}</summary><pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre></details>`;
}

function workflowStageMeta(stage, run) {
  const members = run?.members || [];
  if (!run) {
    if (stage.id === "verify") {
      const results = Object.values(state.verification).filter((member) => !member.checking);
      return results.length ? `${results.filter((member) => member.ok).length}/${results.length} 通过` : stage.call;
    }
    return stage.call;
  }
  if (stage.id === "verify") return `${run.modelVerification?.members?.filter((member) => member.ok).length || 0}/${run.modelVerification?.members?.length || 0} 通过`;
  if (stage.id === "snapshot") return `${run.snapshot?.candidateCount || 0} 只候选`;
  if (stage.id === "round-one") return `${members.filter((member) => member.roundOne?.status === "COMPLETE" && member.roundOne?.integrity?.status === "COMPLETE").length}/${members.length} 完整返回`;
  if (stage.id === "merge") return run.pool?.length ? `${run.pool.length} 只进入复核` : "等待汇总";
  if (stage.id === "round-two") return `${members.filter((member) => member.roundTwo?.status === "COMPLETE" && member.roundTwo?.integrity?.status === "COMPLETE").length}/${members.length} 完整返回`;
  if (stage.id === "secretary") return run.secretary?.summary ? "已生成" : run.audit?.secretary?.status === "failed" ? "失败" : "等待汇总";
  return run.audit?.riskCheck?.status === "complete" ? `${run.final?.length || 0} 个保留` : "等待闸门";
}

function workflowMemberRecords(members, phase) {
  return `<div class="decision-workflow-members">${members.map((member) => {
    const review = member[phase];
    const audit = member.audit?.[phase];
    const stateLabel = String(audit?.status || "").toUpperCase() === "FAILED"
      ? `失败 · ${audit.error || "未知错误"}`
      : review?.status === "IN_PROGRESS"
        ? `分批处理中 · ${review.integrity?.validCount ?? 0}/${review.integrity?.expectedCount ?? "—"} · 第 ${review.batch?.completed || 0}/${review.batch?.total || "—"} 批`
        : review?.status === "PARTIAL"
        ? `不完整 · ${review.integrity?.validCount ?? 0}/${review.integrity?.expectedCount ?? "—"}`
        : review?.status === "FAILED"
          ? "输出无效 · 已阻断"
          : review?.status === "COMPLETE"
            ? "完整返回"
            : "等待";
    return `<details class="decision-workflow-member"><summary><strong>${escapeHtml(member.label)}</strong><small>${escapeHtml(member.model)} · ${escapeHtml(stateLabel)}</small></summary>
      <div><p>${escapeHtml(review?.summary || audit?.error || "尚未产生输出")}</p><small>${escapeHtml(auditTime(audit?.startedAt))} → ${escapeHtml(auditTime(audit?.completedAt))}</small>${rawAuditMarkup({ input: audit?.input || {}, output: review || audit?.output || {}, error: audit?.error || "" }, "全部输入与输出")}</div>
    </details>`;
  }).join("")}</div>`;
}

function workflowStageContent(stage, run) {
  if (!run && stage.id === "verify") return rawAuditMarkup({ members: Object.values(state.verification).filter((member) => !member.checking) }, "全部验证记录");
  const audit = run.audit || {};
  if (stage.id === "verify") return rawAuditMarkup({ audit: audit.verification, members: run.modelVerification?.members || [] }, "全部验证记录");
  if (stage.id === "snapshot") return rawAuditMarkup({ audit: audit.snapshot, snapshot: run.snapshot }, "全部冻结事实包");
  if (stage.id === "round-one") return workflowMemberRecords(run.members || [], "roundOne");
  if (stage.id === "merge") return rawAuditMarkup({ audit: audit.merge, pool: run.pool || [] }, "全部共同复核池");
  if (stage.id === "round-two") return workflowMemberRecords(run.members || [], "roundTwo");
  if (stage.id === "secretary") return `${rawAuditMarkup({ audit: audit.secretary, secretary: run.secretary || {} }, "Secretary 全部输入与输出")}`;
  return rawAuditMarkup({ audit: audit.riskCheck, final: run.final || [] }, "最终闸门全部记录");
}

function renderWorkflow() {
  const workflow = $("#decisionWorkflow");
  if (!workflow) return;
  const run = state.run;
  workflow.innerHTML = WORKFLOW_STAGES.map((stage, index) => {
    const active = state.activeStep === stage.id;
    const hasRecord = Boolean(run) || (stage.id === "verify" && Object.values(state.verification).some((member) => !member.checking));
    const content = hasRecord ? workflowStageContent(stage, run) : "";
    const card = `<span class="decision-workflow-index">${String(index + 1).padStart(2, "0")}</span><span><strong>${escapeHtml(stage.title)}</strong><small>${escapeHtml(workflowStageMeta(stage, run))}</small></span>`;
    return `<li data-stage="${escapeHtml(stage.id)}" data-state="${active ? "active" : "idle"}">${hasRecord ? `<details${active ? " open" : ""}><summary>${card}</summary><div class="decision-workflow-content">${content || "<small>尚未产生记录</small>"}</div></details>` : `<div class="decision-workflow-card">${card}</div>`}</li>`;
  }).join("");
}

function renderSteps() {
  const list = $("#decisionSteps");
  if (list) list.innerHTML = "";
  const archive = $("#decisionArchive");
  if (archive) archive.hidden = !(state.running || state.testing || state.refreshingMarketData || state.marketRefreshMessage || state.marketRefreshError || state.error || state.run);
  const copy = $("#progressCopy");
  if (copy) copy.hidden = !(state.running || state.testing || state.refreshingMarketData || state.marketRefreshMessage || state.marketRefreshError || state.error || state.run);
}

function stepArtifact(step) {
  const run = state.run;
  if (step.id === "verify") {
    const profiles = selectedModelProfiles();
    const results = profiles.map((profile) => state.verification[profile.id]).filter(Boolean);
    const passed = results.filter((result) => result.ok).length;
    const failed = results.find((result) => result.ok === false);
    if (failed) return `${passed}/${profiles.length} 位委员验证通过；${failed.label || failed.id} 未通过：${failed.error || "请检查型号与额度"}`;
    if (results.length === profiles.length && passed === profiles.length) return `${passed}/${profiles.length} 位委员已验证：Key、实际型号与 JSON 输出均可用。`;
    return "开始后先进行一次极短的真实 API 验证；未通过者不能进入本轮。";
  }
  if (!run) return "开始后，这里会显示这一环节的实际产物。";
  const members = run.members || [];
  const roundOneCount = members.filter((member) => member.roundOne?.status === "COMPLETE" && member.roundOne?.integrity?.status === "COMPLETE").length;
  const roundTwoCount = members.filter((member) => member.roundTwo?.status === "COMPLETE" && member.roundTwo?.integrity?.status === "COMPLETE").length;
  if (step.id === "snapshot") return `${run.snapshot?.candidateCount || 0} 只候选已锁定；所有模型读取同一份事实包。`;
  if (step.id === "round-one") return `${roundOneCount}/${members.length} 位委员已独立交回全部候选评分；页面只展示前 30。`;
  if (step.id === "merge") return run.pool?.length ? `已形成 ${run.pool.length} 只共同复核候选，来自首轮交集与高分股。` : "等待首轮全部完成后，由程序合并候选。";
  if (step.id === "round-two") return `${roundTwoCount}/${members.length} 位委员已交回最终复核结论。`;
  if (step.id === "risk-check") return run.final?.length ? `${run.final.length} 只股票通过当前共识与风险闸门。` : "程序会检查反对票、风险排除与共识门槛。";
  return run.status === "PUBLISHED" ? "已追加到 PDC 历史。" : run.final?.length ? "最终研究名单已生成，可先复制给 GPT 讨论，再决定是否发布。" : "等待风险闸门完成。";
}

function modelStatus(member) {
  const status = state.modelStates[member.id] || member.state || "idle";
  const verification = state.verification[member.id];
  const smokeTest = state.smokeTests[member.id];
  if (!state.run && smokeTest?.checking) return "正在进行轻量对话 Test";
  if (!state.run && smokeTest?.ok) return `对话 Test 已通过 · ${smokeTest.latencyMs || 0}ms`;
  if (!state.run && smokeTest && smokeTest.ok === false) return `Test 未通过 · ${smokeTest.error || "请检查模型输出"}`;
  if (!state.run && verification?.checking) return "正在验证 API 与实际型号";
  if (!state.run && verification?.ok) return `本轮已验证 · ${verification.latencyMs || 0}ms`;
  if (!state.run && verification && verification.ok === false) return `验证未通过 · ${verification.error || "请检查配置"}`;
  if (status === "active") return "正在形成完整 PDC 结论";
  if (status === "round_one_partial" || status === "round_two_partial") return "输出不完整 · 已阻断，不会进入下一阶段";
  if (status === "round_one_failed" || status === "round_two_failed") return "输出无效或模型失败 · 已记录 FAILED";
  if (status === "round_two_complete") return "已完成第二轮结论 · 点击查看";
  if (status === "round_one_complete" || status === "complete") return "已完成第一轮结论 · 点击查看";
  return state.run ? "等待本轮评审" : state.selectedModelProfileIds.includes(member.id) ? "已加入本轮" : "未加入本轮";
}

function verificationReceiptMarkup(verification) {
  if (!verification || verification.checking) return "";
  const checkedAt = verification.checkedAt ? new Date(verification.checkedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "刚刚";
  if (!verification.ok) return `<div class="decision-verification-receipt" data-ok="false"><strong>启动前验证未通过</strong><small>${escapeHtml(verification.error || "请检查 API Key、型号或额度。")} · ${escapeHtml(checkedAt)}</small></div>`;
  return `<div class="decision-verification-receipt" data-ok="true"><strong>启动前验证已通过 · ${escapeHtml(verification.latencyMs || 0)}ms</strong><small>返回：${escapeHtml(verification.response || '{"status":"ok"}')} · ${escapeHtml(checkedAt)}</small></div>`;
}

function smokeTestMarkup(test) {
  if (!test || test.checking) return "";
  if (!test.ok) return `<div class="decision-verification-receipt" data-ok="false"><strong>对话 Test 未通过</strong><small>${escapeHtml(test.error || "模型未返回对话。")}</small></div>`;
  return `<div class="decision-verification-receipt" data-ok="true"><strong>对话 Test 已跑通 · ${escapeHtml(test.latencyMs || 0)}ms</strong><small>${escapeHtml(test.reply || "模型已返回。")}</small></div>`;
}

function dimensionCopyText(row) {
  return PDC_DIMENSIONS.map((dimension) => {
    const value = row.dimensionScores?.[dimension.id];
    return `${dimension.short}：${value?.available ? `${value.score}/10` : "N/A"}${value?.evidence ? `（${value.evidence}）` : ""}`;
  }).join("\n");
}

function dimensionMarkup(row) {
  const cells = PDC_DIMENSIONS.map((dimension) => {
    const value = row.dimensionScores?.[dimension.id];
    const available = Boolean(value?.available);
    const score = available ? `${value.score}/10` : "N/A";
    return `<span data-available="${available}" title="${escapeHtml(value?.evidence || "未提供数据")}"><b>${dimension.short}</b>${escapeHtml(score)}</span>`;
  }).join("");
  return `<details class="decision-dimension-breakdown"><summary>九维评分 · 数据覆盖 ${escapeHtml(row.coveragePct ?? 0)}%</summary><div>${cells}</div></details>`;
}

function forwardPredictionCopyText(row) {
  const prediction = row.forwardPrediction || {};
  return [
    `5D 上涨超过 +2% 概率：${prediction.prob5dUpGt2Pct ?? "N/A"}${prediction.prob5dUpGt2Pct === null || prediction.prob5dUpGt2Pct === undefined ? "" : "%"}`,
    `预期 5D 收益：${prediction.expected5dReturnPct ?? "N/A"}${prediction.expected5dReturnPct === null || prediction.expected5dReturnPct === undefined ? "" : "%"}`,
    `5D 下跌低于 -3% 概率：${prediction.prob5dDownLtMinus3Pct ?? "N/A"}${prediction.prob5dDownLtMinus3Pct === null || prediction.prob5dDownLtMinus3Pct === undefined ? "" : "%"}`,
    `Forward Upside：${prediction.forwardUpsideScore ?? "N/A"}/100`
  ].join("；");
}

function backgroundCheckCopyText(row) {
  const flagged = BACKGROUND_CHECKS.filter(([id]) => row.backgroundChecks?.[id]).map(([, label]) => label);
  return flagged.length ? `背景安全检查：发现 ${flagged.join("、")}` : "背景安全检查：冻结事实中未发现明确红旗（非完整尽调）";
}

function forwardPredictionMarkup(row) {
  return `<span class="decision-forward-prediction">${escapeHtml(forwardPredictionCopyText(row))}<br><small>${escapeHtml(backgroundCheckCopyText(row))}</small></span>`;
}

function reviewCopyText(member, review, phase) {
  const phaseTitle = phase === "round-two" ? "第二轮最终复核" : "第一轮独立盲评";
  const rows = (review?.rankings || []).map((row) => [
    `#${row.rank} ${row.name} (${row.ticker}) · ${row.score} 分`,
    `理由：${row.thesis || "未提供"}`,
    `风险：${row.risk || "未提供"}`,
    `模型状态：${row.decision || "WATCH"}；信心：${row.confidence ?? 0}/100；数据覆盖：${row.coveragePct ?? 0}%`,
    forwardPredictionCopyText(row),
    backgroundCheckCopyText(row),
    dimensionCopyText(row),
    `排除：${row.exclude ? "是" : "否"}`
  ].join("\n")).join("\n\n");
  return [
    "# Stock PDC 独立模型结论",
    `模式：${PDC_MODE_LABEL}`,
    `日期：${state.run?.date || "未锁定"}`,
    `模型：${member.label}（${member.provider} / ${member.model}）`,
    `阶段：${phaseTitle}`,
    "请只基于以下冻结事实与模型结论协助我讨论；不要把它视为交易指令。",
    "",
    "模型摘要：",
    review?.summary || "未提供摘要。",
    "",
    "排名与依据：",
    rows || "该阶段尚未返回排名。"
  ].join("\n");
}

function fullRunCopyText() {
  const run = state.run;
  if (!run) return "";
  const facts = (run.snapshot?.facts || []).map((row) => [
    `${row.name} (${row.ticker})`,
    `原始排名：${row.rank}；基础分：${row.score ?? "—"}；状态：${row.status || "—"}`,
    `已有理由：${row.mainReason || "—"}`,
    `已有风险：${row.mainRisk || "—"}`
  ].join("\n")).join("\n\n");
  const conclusions = (run.members || []).flatMap((member) => [
    member.roundOne ? reviewCopyText(member, member.roundOne, "round-one") : "",
    member.roundTwo ? reviewCopyText(member, member.roundTwo, "round-two") : ""
  ]).filter(Boolean).join("\n\n---\n\n");
  const final = (run.final || []).map((row) => `#${row.rank} ${row.name} (${row.ticker}) · ${row.consensusScore} 分 · ${row.buyVotes ?? 0}/${row.requiredSupport || "—"} BUY 共识\n数据覆盖：${row.averageCoveragePct ?? 0}%\n5D 上涨超过 +2% 概率共识：${row.forwardPrediction?.prob5dUpGt2Pct ?? "N/A"}%；预期 5D 收益：${row.forwardPrediction?.expected5dReturnPct ?? "N/A"}%；5D 下跌低于 -3% 概率：${row.forwardPrediction?.prob5dDownLtMinus3Pct ?? "N/A"}%\n趋势加速共识：${row.dimensionConsensus?.trendAcceleration?.median ?? "N/A"}/10；买点共识：${row.dimensionConsensus?.entryTiming?.median ?? "N/A"}/10；低反转共识：${row.dimensionConsensus?.overheatReversalRisk?.median ?? "N/A"}/10\n理由：${row.thesis}\n风险：${row.risk}`).join("\n\n");
  return [
    "# Stock PDC 本轮决策包",
    `模式：${PDC_MODE_LABEL}；日期：${run.date}；Run：${run.id}`,
    "用途：请协助我审阅这一轮研究过程，重点指出证据缺口、模型分歧与风险；不构成交易指令。",
    "",
    "## 冻结事实包",
    facts || "等待数据快照。",
    "",
    "## 各模型原始结论",
    conclusions || "模型评审尚未完成。",
    "",
    "## 当前最终研究名单",
    final || "尚未形成最终名单。"
  ].join("\n");
}

async function copyText(value, button) {
  if (!value || !button) return;
  const original = button.textContent;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      const area = document.createElement("textarea");
      area.value = value;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.append(area);
      area.select();
      const copied = document.execCommand("copy");
      area.remove();
      if (!copied) throw new Error("copy unavailable");
    }
    button.textContent = "已复制，可以粘贴给 GPT";
  } catch {
    button.textContent = "复制失败，请重试";
  }
  setTimeout(() => { button.textContent = original; }, 1800);
}

function reviewPanel(member, phase, review) {
  if (!review) return "";
  const title = phase === "round-two" ? "第二轮 · 最终复核结论（展示前 30）" : "第一轮 · 独立盲评结论（展示前 30）";
  return `<section class="decision-review-panel">
    <div class="decision-review-panel-head">
      <div><strong>${title}</strong><p>${escapeHtml(review.summary || "该模型已提交完整评分。")}</p></div>
      <button class="decision-member-copy" type="button" data-copy-member="${escapeHtml(member.id)}" data-copy-phase="${phase}">复制给 GPT</button>
    </div>
    <ol>${review.rankings.slice(0, 30).map((row) => `<li><b>#${escapeHtml(row.rank)}</b><span>${escapeHtml(row.name)} <small>${escapeHtml(row.ticker)}</small></span><em>${escapeHtml(row.score)} 分</em><p>${escapeHtml(row.thesis)}<br><small>${escapeHtml(row.decision || "WATCH")} · 信心 ${escapeHtml(row.confidence ?? 0)}/100 · 风险：${escapeHtml(row.risk)}${row.exclude ? " · 建议排除" : ""}</small>${forwardPredictionMarkup(row)}${dimensionMarkup(row)}</p></li>`).join("")}</ol>
  </section>`;
}

function renderModels() {
  const grid = $("#modelGrid");
  if (!grid) return;
  const members = state.run?.committeeMode ? state.run.members : state.modelProfiles;
  grid.innerHTML = members.map((member) => {
    const review = member.roundTwo || member.roundOne;
    const expanded = state.expandedMemberId === member.id;
    const verification = state.verification[member.id];
    const smokeTest = state.smokeTests[member.id];
    const verificationState = verification?.checking ? "checking" : verification?.ok ? "passed" : verification ? "failed" : "idle";
    return `
    <article class="decision-model-card ${review ? "is-clickable" : ""}" data-state="${escapeHtml(state.modelStates[member.id] || member.state || "idle")}" data-verification="${verificationState}">
      <span>${escapeHtml(member.provider)} · 完整 PDC</span>
      <h3>${escapeHtml(member.label)}</h3>
      <p>型号：${escapeHtml(member.model)}</p>
      <div class="decision-model-status">${escapeHtml(modelStatus(member))}</div>
      ${verificationReceiptMarkup(verification)}
      ${smokeTestMarkup(smokeTest)}
      ${!state.run ? `<button class="decision-member-toggle" type="button" data-member-toggle="${escapeHtml(member.id)}">${state.selectedModelProfileIds.includes(member.id) ? "已加入本轮" : "加入本轮"}</button>` : ""}
      ${review ? `<button class="decision-member-open" type="button" data-member-open="${escapeHtml(member.id)}">${expanded ? "收起结论" : "查看结论"}</button>` : ""}
      ${review && expanded ? `<div class="decision-member-conclusion">
        ${reviewPanel(member, "round-one", member.roundOne)}
        ${reviewPanel(member, "round-two", member.roundTwo)}
      </div>` : ""}
    </article>
  `;
  }).join("");
  grid.querySelectorAll("[data-member-toggle]").forEach((button) => button.addEventListener("click", () => {
    if (state.run || state.running) return;
    const id = button.dataset.memberToggle;
    state.selectedModelProfileIds = state.selectedModelProfileIds.includes(id)
      ? state.selectedModelProfileIds.filter((item) => item !== id)
      : [...state.selectedModelProfileIds, id];
    if (!state.selectedModelProfileIds.length) state.selectedModelProfileIds = [id];
    render();
  }));
  grid.querySelectorAll("[data-member-open]").forEach((button) => button.addEventListener("click", () => {
    const id = button.dataset.memberOpen;
    state.expandedMemberId = state.expandedMemberId === id ? "" : id;
    renderModels();
  }));
  grid.querySelectorAll("[data-copy-member]").forEach((button) => button.addEventListener("click", () => {
    const member = (state.run?.members || []).find((item) => item.id === button.dataset.copyMember);
    const phase = button.dataset.copyPhase;
    const review = phase === "round-two" ? member?.roundTwo : member?.roundOne;
    copyText(reviewCopyText(member || {}, review, phase), button);
  }));
}

function renderModelPicker() {
  const select = $("#decisionModelSelect");
  const note = $("#decisionModelNote");
  if (!select || !note) return;
  const profiles = selectedModelProfiles();
  select.textContent = profiles.length ? `${profiles.length} 位模型 PDC 已加入` : "请选择至少一位模型 PDC";
  note.textContent = profiles.length
    ? profiles.map((profile) => profile.label).join("、")
    : "未配置模型";
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
  const runStrip = $(".decision-run-strip");
  const button = $("#generateDecision");
  const testButton = $("#testDecision");
  const refreshButton = $("#refreshMarketData");
  const refreshLink = $("#manualRefreshWorkflow");
  const runId = $("#runId");
  const mode = $("#decisionMode");
  const copyRunButtons = document.querySelectorAll("[data-copy-run], #copyDecisionPacket");
  const run = state.run;

  if (runId) runId.textContent = run?.id ? run.id.slice(0, 8).toUpperCase() : "等待生成";
  const marketRefreshPending = state.refreshingMarketData || Boolean(state.marketRefreshMessage);
  if (runStrip) runStrip.hidden = !(state.running || state.testing || marketRefreshPending || state.marketRefreshError || state.error || run);
  if (snapshot) snapshot.textContent = marketRefreshPending ? "刷新已提交 · 旧快照不可用" : state.error && !run ? "FAILED · 未锁定" : state.completed > 0 ? `${run?.date || ""} 已锁定` : "尚未锁定";
  if (status) status.textContent = state.marketRefreshError || state.error ? "FAILED" : state.marketRefreshManualOnly ? "待 GitHub 手动启动" : marketRefreshPending ? "等待市场刷新" : state.testing ? "Test 中" : state.running ? "生成中" : state.completed === steps.length ? "等待发布" : "准备就绪";
  if (count) count.textContent = state.marketRefreshError || state.error ? "已阻断" : state.refreshingMarketData ? "正在提交" : state.marketRefreshManualOnly ? "需手动启动" : state.marketRefreshMessage ? "刷新已提交" : state.running ? "生成中" : state.completed === steps.length ? "本轮完成" : state.run ? `已完成 ${state.completed} 步` : "等待运行";
  if (mode) {
    const profiles = run?.committeeMode ? run.members : selectedModelProfiles();
    mode.textContent = profiles?.length ? `${profiles.length} 位${IS_DEMO_MODE ? "Mini" : "模型"} PDC · 同一事实包` : "未配置模型";
  }
  if (copy) copy.textContent = state.marketRefreshError
    ? `市场数据刷新未提交：${state.marketRefreshError}`
    : state.refreshingMarketData
    ? "正在提交手动市场数据刷新；不会调用模型、不会自动发布 PDC 决策。"
    : state.marketRefreshMessage
    ? state.marketRefreshMessage
    : state.error
    ? state.run
      ? `本轮暂停在${steps.find((step) => step.id === state.activeStep)?.title || "当前阶段"}：${state.error}。已返回的模型结论已保留。`
      : `本轮尚未开始：${state.error}。可先重新运行对话 Test，或稍后再开始生成。`
    : state.testing
    ? "正在进行轻量对话 Test：不读取股票数据、不做评分、不创建 Run。"
    : state.running
    ? `正在执行：${steps.find((step) => step.id === state.activeStep)?.title || "准备任务"}`
    : state.completed === steps.length
      ? IS_DEMO_MODE
        ? "Mini Demo Run 已完成。可复制整包给 GPT 继续讨论；结果不会写入正式 PDC。"
        : "本次 Run 已完成。确认无误后，点击“发布到 PDC”才会追加当天正式记录。"
      : "开始后，这里会直接记录每一轮谁给出了什么结论，而不是只显示流程状态。";
  if (button) {
    button.disabled = state.running || state.testing || state.refreshingMarketData;
    button.textContent = state.running ? "正在生成…" : state.run ? "继续生成" : "开始生成";
  }
  if (testButton) {
    testButton.disabled = state.running || state.testing || state.refreshingMarketData;
    testButton.textContent = state.testing ? "Test 运行中…" : "对话 Test（不生成决策）";
  }
  if (refreshButton) {
    refreshButton.disabled = state.running || state.testing || state.refreshingMarketData;
    refreshButton.textContent = state.refreshingMarketData ? "正在提交刷新…" : "手动刷新市场数据";
  }
  if (refreshLink) {
    refreshLink.hidden = !state.marketRefreshWorkflowUrl;
    refreshLink.href = state.marketRefreshWorkflowUrl || "#";
  }
  copyRunButtons.forEach((copyRun) => {
    copyRun.disabled = !run || state.running;
  });
}

function renderResult() {
  const section = $("#decisionResult");
  const list = $("#resultList");
  const publish = $("#publishDecision");
  const note = $("#decisionResearchNote");
  if (!section || !list || !publish) return;
  const final = Array.isArray(state.run?.final) ? state.run.final : [];
  section.hidden = state.completed !== steps.length;
  publish.hidden = IS_DEMO_MODE || section.hidden || Boolean(state.run?.publishedAt) || state.run?.status === "NO_CANDIDATES";
  publish.disabled = state.running;
  if (note && IS_DEMO_MODE) note.textContent = "Mini Demo 只用于研究和模型对比，不构成交易指令，也不会写入正式 PDC 历史。";
  if (section.hidden) return;
  list.innerHTML = state.run?.status === "NO_CANDIDATES"
    ? `<div class="stock-empty">本次鹰眼已完整执行，但没有股票同时满足“总市值 &gt; 300 亿”和“近 60 个交易日收益 &gt; 0”。系统未调用任何 PDC 模型，结果已保存为 NO_CANDIDATES。</div>`
    : final.length ? final.map((row) => `
    <div class="decision-placeholder-row">
      <strong>#${escapeHtml(row.rank)}</strong>
      <span>${escapeHtml(row.name)} <small>${escapeHtml(row.ticker)}</small></span>
      <small>${escapeHtml(row.consensusScore)} 分 · ${escapeHtml(row.buyVotes ?? 0)}/${escapeHtml(row.requiredSupport || "—")} BUY 共识 · 5D↑&gt;+2% ${escapeHtml(row.forwardPrediction?.prob5dUpGt2Pct ?? "N/A")}%</small>
    </div>
  `).join("") : `<div class="stock-empty">本轮没有股票获得足够的短期 BUY 共识；NO BUY 是正常结果。</div>`;
}

function render() {
  try {
    if (state.run?.id && !state.run.publishedAt) sessionStorage.setItem(RUN_STORAGE_KEY, state.run.id);
    else if (state.run?.publishedAt) sessionStorage.removeItem(RUN_STORAGE_KEY);
  } catch {
    // The decision flow still works when browser storage is unavailable.
  }
  renderWorkflow();
  renderSteps();
  renderDataContract();
  renderModelPicker();
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
  if (!response.ok) {
    const caught = new Error(payload.error || `Decision API error (${response.status})`);
    caught.status = response.status;
    caught.payload = payload;
    throw caught;
  }
  return payload;
}

async function latestSnapshot() {
  const response = await fetch("/stock-pdc/hawkeye/latest.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load the current Hawkeye Radar snapshot.");
  const data = await response.json();
  const candidates = Array.isArray(data.candidates) ? data.candidates : [];
  if (data.availability !== "ACTIVE") {
    throw new Error(`Hawkeye Radar is not ready: ${(data.validationErrors || []).join(" ") || "unknown validation failure"}`);
  }
  const expectedSchema = "stock-pdc-hawkeye-v2";
  const expectedMarketCap = 30_000_000_000;
  const expectedReturn60d = 0;
  const marketDataProvider = String(data.marketDataProvider || "").trim().toLowerCase();
  if (data.schemaVersion !== expectedSchema) {
    throw new Error("Hawkeye Radar snapshot predates full-market accounting. Regenerate it from the API market snapshot.");
  }
  if (!["eastmoney", "sina"].includes(marketDataProvider)) {
    throw new Error("Hawkeye Radar does not identify one verified full-market data provider.");
  }
  if (data.rules?.minMarketCapCny !== expectedMarketCap || data.rules?.minReturn60dPct !== expectedReturn60d) {
    throw new Error("Hawkeye Radar rules do not match the fixed market-cap and 60-day-return policy.");
  }
  const checkedCount = Number(data.checkedCount);
  const marketUniverseCount = Number(data.marketUniverseCount);
  const rejectedCount = Number(data.rejectedCount);
  const dataFailedCount = Number(data.dataFailedCount);
  const universeExcludedCount = Number(data.universeExcludedCount);
  const passedCount = Number(data.passedCount);
  const dataIntegrity = data.dataIntegrity || {};
  const requiredCoverageRate = Number(dataIntegrity.requiredCoverageRate);
  const coverageRate = Number(dataIntegrity.coverageRate);
  if (![checkedCount, marketUniverseCount, rejectedCount, dataFailedCount, universeExcludedCount, passedCount].every(Number.isInteger)
    || marketUniverseCount !== checkedCount
    || passedCount + rejectedCount + dataFailedCount + universeExcludedCount !== checkedCount) {
    throw new Error("Hawkeye Radar market-universe accounting is incomplete.");
  }
  if (Number.isFinite(requiredCoverageRate) && Number.isFinite(coverageRate) && coverageRate < requiredCoverageRate) {
    throw new Error("Hawkeye Radar market-data coverage is below its required completion threshold.");
  }
  if (!data.asOfDate || candidates.length !== passedCount || Number(data.dispatchedCount) !== passedCount
    || candidates.some((row) => row?.status !== "HAWKEYE_PASSED"
      || !Number.isFinite(row?.facts?.marketCapCny)
      || row.facts.marketCapCny <= expectedMarketCap
      || !Number.isFinite(row?.facts?.return60dPct)
      || row.facts.return60dPct <= expectedReturn60d)) {
    throw new Error("Hawkeye Radar did not provide every passed candidate.");
  }
  const provenance = {
    snapshotId: `hawkeye-${data.asOfDate}-${data.sourceGeneratedAt || data.generatedAt}`,
    primarySourceId: `stock-pdc-${marketDataProvider}-market-snapshot`,
    primarySourceLabel: `Stock PDC ${marketDataProvider} 全市场快照`,
    sourceFile: data.sourceFiles?.candidateUniverse || "outputs/candidate_universe.csv",
    priceDataRun: data.asOfDate,
    marketDataProvider,
    backupPolicy: "完整全市场备用源只在主源失败时整体接管；不同源的股票行永不混合。",
    featureContract: "Deterministic Hawkeye facts, diversified PDC reasoning."
  };
  state.dataContract = {
    date: data.asOfDate,
    governance: { hawkeye: data.rules || {}, dispatchRule: data.dispatchRule || "", dataIntegrity },
    snapshot: { ...provenance, candidateCount: candidates.length, checkedCount, passedCount }
  };
  return {
    date: data.asOfDate,
    source: provenance.sourceFile,
    provenance,
    candidates: candidates.map((row) => ({
      ticker: row.ticker,
      name: row.name,
      rank: row.rank,
      score: row.score,
      status: row.status,
      mainReason: row.mainReason,
      mainRisk: row.mainRisk,
      signalDayChangePct: row.signalDayChangePct,
      scores: row.scores,
      facts: row.facts
    }))
  };
}

async function loadDataContract() {
  try {
    await latestSnapshot();
    state.error = "";
  } catch (caught) {
    state.error = caught?.message || "Hawkeye Radar is not ready.";
  } finally {
    render();
  }
}

async function loadModelProfiles() {
  try {
    const result = await api("/models", { headers: { accept: "application/json" } });
    if (Array.isArray(result.models) && result.models.length) {
      state.modelProfiles = result.models;
      state.selectedModelProfileIds = state.modelProfiles.map((profile) => profile.id);
    }
  } catch {
    // Keep the default PDC profile visible while the authenticated API is unavailable.
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
  if (state.run.status === "NO_CANDIDATES") {
    state.completed = steps.length;
    state.activeStep = null;
    return;
  }
  state.completed = 2;
  if (Array.isArray(state.run.modelVerification?.members)) {
    state.verification = Object.fromEntries(state.run.modelVerification.members.map((member) => [member.id, member]));
  }
  state.modelStates = Object.fromEntries((state.run.members || []).map((member) => [member.id, member.state || "idle"]));
  state.run.members?.forEach((member) => {
    state.modelStates[member.id] = member.state || "idle";
  });
  if (state.run.roundOneComplete) state.completed = 3;
  if (state.run.pool?.length) state.completed = 4;
  if (state.run.roundTwoComplete) state.completed = 5;
  if (state.run.secretary?.summary) state.completed = 6;
  if (state.run.status === "READY_TO_PUBLISH" || state.run.status === "PUBLISHED") state.completed = steps.length;
}

async function runReviewers(stage) {
  for (const member of state.run.members || []) {
    while (true) {
      const current = state.run.members.find((item) => item.id === member.id);
      const review = stage === "round-one" ? current?.roundOne : current?.roundTwo;
      const complete = review?.status === "COMPLETE" && review?.integrity?.status === "COMPLETE";
      if (complete) break;
      const beforeCount = Number(review?.integrity?.validCount || 0);
      state.activeStep = stage;
      state.activeMemberId = member.id;
      state.modelStates[member.id] = "active";
      render();
      const result = await api(`/runs/${state.run.id}/${stage}/${member.id}`, { method: "POST", body: "{}" });
      state.run = result.run;
      const updated = state.run.members.find((item) => item.id === member.id);
      const updatedReview = stage === "round-one" ? updated?.roundOne : updated?.roundTwo;
      state.modelStates[member.id] = updated?.state || "complete";
      state.activeMemberId = "";
      render();
      if (result.ok === false) throw new Error(result.integrityError || "模型输出不完整，已阻断后续阶段。");
      const afterCount = Number(updatedReview?.integrity?.validCount || 0);
      if (!(updatedReview?.status === "COMPLETE" && updatedReview?.integrity?.status === "COMPLETE") && afterCount <= beforeCount) {
        throw new Error("模型分批复核未产生新的有效股票记录，已暂停以避免无效循环。");
      }
    }
  }
}

async function verifySelectedModels() {
  const profiles = selectedModelProfiles();
  state.activeStep = "verify";
  state.verification = Object.fromEntries(profiles.map((profile) => [profile.id, { checking: true }]));
  render();
  const result = await api("/verifications", {
    method: "POST",
    body: JSON.stringify({ modelProfileIds: state.selectedModelProfileIds })
  });
  const results = Array.isArray(result.verification?.members) ? result.verification.members : [];
  state.verification = Object.fromEntries(results.map((member) => [member.id, member]));
  render();
  const failed = results.find((member) => !member.ok);
  if (failed) throw new Error(`${failed.label || failed.id} 验证未通过：${failed.error || "请检查 API Key、实际型号或账户额度。"}`);
  if (results.length !== profiles.length + 1) throw new Error("模型或 Secretary 验证结果不完整，请重试。");
  completeThrough("verify");
  return result.verification?.id || "";
}

async function runDecisionFlow() {
  state.running = true;
  state.error = "";
  let verificationId = "";
  if (!state.run) {
    state.completed = 0;
    state.activeStep = "verify";
    state.modelStates = Object.fromEntries(selectedModelProfiles().map((member) => [member.id, "idle"]));
    state.verification = {};
  } else {
    syncRunProgress();
  }
  render();
  try {
    if (!state.run) {
      const snapshot = await latestSnapshot();
      state.activeStep = "snapshot";
      render();
      if (snapshot.candidates.length) verificationId = await verifySelectedModels();
      state.run = (await api("/runs", {
        method: "POST",
        body: JSON.stringify({ modelProfileIds: state.selectedModelProfileIds, verificationId })
      })).run;
      completeThrough("snapshot");
      render();
      if (state.run.status === "NO_CANDIDATES") {
        completeThrough("final");
        return;
      }
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
      state.modelStates = Object.fromEntries((state.run.members || []).map((member) => [member.id, member.state || "idle"]));
      await runReviewers("round-two");
      completeThrough("round-two");
      render();
    }

    if (!state.run.secretary?.summary) {
      state.activeStep = "secretary";
      render();
      state.run = (await api(`/runs/${state.run.id}/secretary`, { method: "POST", body: "{}" })).run;
      completeThrough("secretary");
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
    state.activeMemberId = "";
    render();
  }
}

async function runSmokeTest() {
  if (state.running || state.testing) return;
  state.testing = true;
  state.error = "";
  const profiles = selectedModelProfiles();
  state.smokeTests = Object.fromEntries(profiles.map((profile) => [profile.id, { checking: true }]));
  render();
  try {
    const members = await Promise.all(profiles.map(async (profile) => {
      try {
        const result = await api("/smoke-test", {
          method: "POST",
          body: JSON.stringify({ modelProfileIds: [profile.id] })
        });
        const member = Array.isArray(result.test?.members) ? result.test.members[0] : null;
        if (!member) throw new Error("模型没有返回 Test 记录。");
        state.smokeTests[profile.id] = member;
        render();
        return member;
      } catch (caught) {
        const member = { id: profile.id, label: profile.label, ok: false, reply: "", error: caught.message || "Test Run 未完成。" };
        state.smokeTests[profile.id] = member;
        render();
        return member;
      }
    }));
    const failed = members.find((member) => !member.ok);
    if (failed) state.error = `${failed.label || failed.id} Test 未通过：${failed.error || "模型未返回完整 PDC 评分。"}`;
    else {
      const copy = $("#progressCopy");
      if (copy) copy.textContent = `${members.length} 位模型已完成轻量对话 Test。未读取股票数据、未做评分、未创建 Run，也没有生成交易决策。`;
    }
  } catch (caught) {
    state.error = caught.message || "Test Run 未完成。";
  } finally {
    state.testing = false;
    render();
  }
}

async function refreshMarketData() {
  if (state.running || state.testing || state.refreshingMarketData) return;
  state.refreshingMarketData = true;
  state.marketRefreshMessage = "";
  state.marketRefreshError = "";
  state.marketRefreshWorkflowUrl = "";
  state.marketRefreshManualOnly = false;
  render();
  try {
    const result = await api("/data-refresh", { method: "POST", body: "{}" });
    state.marketRefreshWorkflowUrl = result.workflowUrl || "";
    state.marketRefreshMessage = "已提交手动全市场行情→Hawkeye 刷新。完成后刷新此页；当前旧快照仍不能用于 PDC。";
  } catch (caught) {
    if (caught.status === 503 && caught.payload?.code === "MANUAL_REFRESH_GITHUB_ONLY") {
      state.marketRefreshManualOnly = true;
      state.marketRefreshWorkflowUrl = caught.payload.workflowUrl || "";
      state.marketRefreshMessage = "无需配置。请打开下方 GitHub 页面，点击 Run workflow；完成后刷新此页。";
    } else {
      state.marketRefreshError = caught.message || "请稍后重试。";
    }
  } finally {
    state.refreshingMarketData = false;
    render();
  }
}

async function publishDecision() {
  if (IS_DEMO_MODE || !state.run?.id || state.running) return;
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

$("#testDecision")?.addEventListener("click", runSmokeTest);

$("#refreshMarketData")?.addEventListener("click", refreshMarketData);

$("#publishDecision")?.addEventListener("click", publishDecision);

$("#copyDecisionPacket")?.addEventListener("click", (event) => {
  copyText(fullRunCopyText(), event.currentTarget);
});

document.querySelectorAll("[data-copy-run]").forEach((button) => {
  button.addEventListener("click", (event) => copyText(fullRunCopyText(), event.currentTarget));
});

render();
loadModelProfiles();
loadDataContract();
restoreSavedRun();
