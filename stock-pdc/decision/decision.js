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
  smokeTests: {}
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

function renderSteps() {
  const list = $("#decisionSteps");
  if (!list) return;
  const run = state.run;
  if (!run) {
    list.innerHTML = `<li class="decision-run-empty">
      <strong>还没有本轮研究记录</strong>
      <p>先运行一次对话 Test 确认模型可用，或直接开始生成。完成后，这里会按轮次保留每位模型实际说了什么。</p>
    </li>`;
    return;
  }

  const members = run.members || [];
  const firstRound = members.filter((member) => member.roundOne?.rankings?.length).length;
  const secondRound = members.filter((member) => member.roundTwo?.rankings?.length).length;
  const verified = selectedModelProfiles().filter((profile) => state.verification[profile.id]?.ok).length;
  const final = Array.isArray(run.final) ? run.final : [];
  const active = state.activeStep;
  list.innerHTML = [
    archiveCard({
      id: "facts",
      number: "01",
      title: "本轮事实包与模型",
      meta: `${run.snapshot?.candidateCount || 0} 只候选 · ${verified}/${selectedModelProfiles().length} 已验证`,
      open: active === "verify" || active === "snapshot",
      content: archiveFactsMarkup(run)
    }),
    archiveCard({
      id: "round-one",
      number: "02",
      title: "第一轮：各模型独立初判",
      meta: `${firstRound}/${members.length} 位已返回 · 展开看摘要与 Top 3`,
      open: active === "round-one",
      content: archiveMemberMarkup(members, "roundOne", "第一轮尚未有模型返回。")
    }),
    archiveCard({
      id: "pool",
      number: "03",
      title: "共同复核池",
      meta: run.pool?.length ? `${run.pool.length} 只股票进入第二轮` : "等待第一轮汇总",
      open: active === "merge",
      content: archivePoolMarkup(run.pool)
    }),
    archiveCard({
      id: "round-two",
      number: "04",
      title: "第二轮：各模型复核意见",
      meta: `${secondRound}/${members.length} 位已返回 · 展开看最终立场`,
      open: active === "round-two",
      content: archiveMemberMarkup(members, "roundTwo", "第二轮复核尚未开始。")
    }),
    archiveCard({
      id: "final",
      number: "05",
      title: "共识与风险闸门",
      meta: state.completed === steps.length ? `${final.length} 个研究席位保留` : "等待复核完成后生成",
      open: active === "risk-check" || active === "final" || state.completed === steps.length,
      content: archiveFinalMarkup(final)
    })
  ].join("");
}

function archiveCard({ id, number, title, meta, content, open }) {
  return `<li class="decision-archive-card" data-archive="${escapeHtml(id)}">
    <details${open ? " open" : ""}>
      <summary>
        <span class="decision-archive-index">${escapeHtml(number)}</span>
        <span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(meta)}</small></span>
        <span class="decision-archive-open">查看</span>
      </summary>
      <div class="decision-archive-content">${content}</div>
    </details>
  </li>`;
}

function archiveFactsMarkup(run) {
  const verified = selectedModelProfiles().map((profile) => {
    const check = state.verification[profile.id];
    const status = check?.ok ? "已验证" : check?.ok === false ? "未通过" : "等待验证";
    return `<span class="decision-archive-chip" data-ok="${check?.ok === true}">${escapeHtml(profile.label)} · ${escapeHtml(status)}</span>`;
  }).join("");
  return `<div class="decision-archive-facts">
    <p><strong>冻结快照：</strong>${escapeHtml(run.date || "—")} · ${escapeHtml(run.snapshot?.candidateCount || 0)} 只候选。所有模型只读这一份事实包。</p>
    <div class="decision-archive-chips">${verified}</div>
  </div>`;
}

function archiveMemberMarkup(members, phase, emptyText) {
  const returned = members.filter((member) => member[phase]?.rankings?.length);
  if (!returned.length) return `<p class="decision-archive-empty">${escapeHtml(emptyText)}</p>`;
  return `<div class="decision-archive-members">${returned.map((member) => {
    const review = member[phase];
    const topThree = (review.rankings || []).slice(0, 3).map((row) => `<span>#${escapeHtml(row.rank || "—")} ${escapeHtml(row.name || row.ticker || "未知")} <small>${escapeHtml(row.ticker || "")} · ${escapeHtml(row.score ?? "—")}分</small></span>`).join("");
    return `<article class="decision-archive-member">
      <header><strong>${escapeHtml(member.label || member.id)}</strong><small>${escapeHtml(member.model || member.provider || "独立 PDC")}</small></header>
      <p>${escapeHtml(review.summary || "模型未提供文字摘要，请查看下方完整委员结论。")}</p>
      <div class="decision-archive-top">${topThree}</div>
    </article>`;
  }).join("")}</div>`;
}

function archivePoolMarkup(pool) {
  if (!Array.isArray(pool) || !pool.length) return `<p class="decision-archive-empty">第一轮完成后，系统会把值得再次研究的股票汇成同一份共同复核池。</p>`;
  return `<div class="decision-archive-chips">${pool.map((row, index) => `<span class="decision-archive-chip">#${index + 1} ${escapeHtml(row.name || row.ticker || "未知")} <small>${escapeHtml(row.ticker || "")}</small></span>`).join("")}</div>`;
}

function archiveFinalMarkup(final) {
  if (!final.length) return `<p class="decision-archive-empty">暂无股票通过共识与风险闸门。没有强行补足，是系统正常的保护机制。</p>`;
  return `<div class="decision-archive-final">${final.map((row) => `<article><strong>#${escapeHtml(row.rank)} ${escapeHtml(row.name)} <small>${escapeHtml(row.ticker)}</small></strong><span>${escapeHtml(row.consensusScore)} 分 · ${escapeHtml(row.buyVotes ?? 0)}/${escapeHtml(row.requiredSupport || "—")} BUY 支持</span></article>`).join("")}</div>`;
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
  const roundOneCount = members.filter((member) => member.roundOne?.rankings?.length).length;
  const roundTwoCount = members.filter((member) => member.roundTwo?.rankings?.length).length;
  if (step.id === "snapshot") return `${run.snapshot?.candidateCount || 0} 只候选已锁定；所有模型读取同一份事实包。`;
  if (step.id === "round-one") return `${roundOneCount}/${members.length} 位委员已独立交回首轮 Top 30 与风险判断。`;
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
  const title = phase === "round-two" ? "第二轮 · 最终复核结论" : "第一轮 · 独立盲评结论";
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
      <p>实际型号：${escapeHtml(member.model)}<br>独立覆盖趋势、量价、风险、过热与反方证伪。</p>
      <div class="decision-model-status">${escapeHtml(modelStatus(member))}</div>
      ${verificationReceiptMarkup(verification)}
      ${smokeTestMarkup(smokeTest)}
      ${!state.run ? `<button class="decision-member-toggle" type="button" data-member-toggle="${escapeHtml(member.id)}">${state.selectedModelProfileIds.includes(member.id) ? "已加入本轮" : "加入本轮"}</button>` : ""}
      ${review ? `<button class="decision-member-open" type="button" data-member-open="${escapeHtml(member.id)}">${expanded ? "收起结论" : "查看结论"}</button>` : ""}
      ${review && expanded ? `<div class="decision-member-conclusion">
        <p class="decision-member-hint">先看首轮的独立意见，再看最终复核是否改变。每一部分都能单独复制给 GPT。</p>
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
    ? `${profiles.map((profile) => profile.label).join("、")}。每次开始会先验证实际型号与 JSON 输出；密钥只保留在服务端。`
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
  const testButton = $("#testDecision");
  const runId = $("#runId");
  const mode = $("#decisionMode");
  const copyRun = $("#copyDecisionPacket");
  const run = state.run;

  if (runId) runId.textContent = run?.id ? run.id.slice(0, 8).toUpperCase() : "等待生成";
  if (snapshot) snapshot.textContent = state.completed > 0 ? `${run?.date || ""} 已锁定` : "尚未锁定";
  if (status) status.textContent = state.testing ? "Test 中" : state.running ? "生成中" : state.completed === steps.length ? "等待发布" : "准备就绪";
  if (count) count.textContent = state.running ? "生成中" : state.completed === steps.length ? "本轮完成" : state.run ? `已完成 ${state.completed} 步` : "等待运行";
  if (mode) {
    const profiles = run?.committeeMode ? run.members : selectedModelProfiles();
    mode.textContent = profiles?.length ? `${profiles.length} 位${IS_DEMO_MODE ? "Mini" : "模型"} PDC · 同一事实包` : "未配置模型";
  }
  if (copy) copy.textContent = state.error
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
    button.disabled = state.running || state.testing;
    button.textContent = state.running ? "正在生成…" : state.run ? "继续生成" : "开始生成";
  }
  if (testButton) {
    testButton.disabled = state.running || state.testing;
    testButton.textContent = state.testing ? "Test 运行中…" : "对话 Test（不生成决策）";
  }
  if (copyRun) copyRun.disabled = !run || state.running;
}

function renderResult() {
  const section = $("#decisionResult");
  const list = $("#resultList");
  const publish = $("#publishDecision");
  const note = $("#decisionResearchNote");
  if (!section || !list || !publish) return;
  const final = Array.isArray(state.run?.final) ? state.run.final : [];
  section.hidden = state.completed !== steps.length;
  publish.hidden = IS_DEMO_MODE || section.hidden || Boolean(state.run?.publishedAt);
  publish.disabled = state.running;
  if (note && IS_DEMO_MODE) note.textContent = "Mini Demo 只用于研究和模型对比，不构成交易指令，也不会写入正式 PDC 历史。";
  if (section.hidden) return;
  list.innerHTML = final.length ? final.map((row) => `
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
  state.completed = 1;
  if (Array.isArray(state.run.modelVerification?.members)) {
    state.verification = Object.fromEntries(state.run.modelVerification.members.map((member) => [member.id, member]));
  }
  state.modelStates = Object.fromEntries((state.run.members || []).map((member) => [member.id, member.state || "idle"]));
  state.run.members?.forEach((member) => {
    state.modelStates[member.id] = member.state || "idle";
  });
  if (state.run.roundOneComplete) state.completed = 2;
  if (state.run.pool?.length) state.completed = 3;
  if (state.run.roundTwoComplete) state.completed = 4;
  if (state.run.status === "READY_TO_PUBLISH" || state.run.status === "PUBLISHED") state.completed = steps.length;
}

async function runReviewers(stage) {
  for (const member of state.run.members || []) {
    const complete = stage === "round-one"
      ? member.roundOne?.rankings?.length
      : member.roundTwo?.rankings?.length;
    if (complete) continue;
    state.activeStep = stage;
    state.activeMemberId = member.id;
    state.modelStates[member.id] = "active";
    render();
    state.run = (await api(`/runs/${state.run.id}/${stage}/${member.id}`, { method: "POST", body: "{}" })).run;
    const updated = state.run.members.find((item) => item.id === member.id);
    state.modelStates[member.id] = updated?.state || "complete";
    state.activeMemberId = "";
    render();
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
  if (results.length !== profiles.length) throw new Error("模型验证结果不完整，请重试。");
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
      verificationId = await verifySelectedModels();
      const snapshot = await latestSnapshot();
      state.activeStep = "snapshot";
      render();
      state.run = (await api("/runs", {
        method: "POST",
        body: JSON.stringify({ snapshot, modelProfileIds: state.selectedModelProfileIds, verificationId })
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
      state.modelStates = Object.fromEntries((state.run.members || []).map((member) => [member.id, member.state || "idle"]));
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
    const result = await api("/smoke-test", {
      method: "POST",
      body: JSON.stringify({ modelProfileIds: state.selectedModelProfileIds })
    });
    const members = Array.isArray(result.test?.members) ? result.test.members : [];
    state.smokeTests = Object.fromEntries(members.map((member) => [member.id, member]));
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

$("#publishDecision")?.addEventListener("click", publishDecision);

$("#copyDecisionPacket")?.addEventListener("click", (event) => {
  copyText(fullRunCopyText(), event.currentTarget);
});

render();
loadModelProfiles();
loadDataContract();
restoreSavedRun();
