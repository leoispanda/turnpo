/* November 2026 learning planner. Canvas sources; suggested preparation sequence. */
const NOVEMBER_STUDY_UI = {
  module: novemberInitialModule(),
  day: 0,
  disclosures: {},
  pdf: ""
};

const NOVEMBER_PRIVATE_FILES = { status: "idle", entries: {}, promise: null };

function novemberInitialModule() {
  const requested = typeof window === "undefined" ? "" : new URLSearchParams(window.location?.search || "").get("study");
  return ["pre-study", "post-study", "resources"].includes(requested) ? requested : "pre-study";
}

const NOVEMBER_STUDY_SOURCES = {
  preparation: ["Canvas · Preparation materials", "https://canvas.maastrichtuniversity.nl/courses/28848/pages/preparation-materials"],
  case: ["Canvas · FD Mediagroep Business Challenge", "https://canvas.maastrichtuniversity.nl/courses/28848/pages/preparation-business-challenge-fd-mediagroep"],
  assessment: ["Corporate Innovator Assessment · 自测", "https://docs.google.com/forms/d/e/1FAIpQLScRdOiYv5JCW-AN0b33QLAxMtKgdGYuAiNzbQWd8RvVvlM4jg/viewform?usp=sf_link"],
  customer: ["Customer-centric Design", "https://youtu.be/j6zYQfcZNIs"],
  strategy: ["Strategic Planning and Doing", "https://youtu.be/lHeWfmICMnQ"],
  businessModel: ["Building Future-proof Business Models", "https://youtu.be/V4K_dueWn8o"],
  empathic: ["Spark Innovation Through Empathic Design", "6794064"],
  designWorks: ["Why Design Thinking Works", "6794094"],
  designAge: ["Design Thinking Comes of Age", "6794098"],
  storytelling: ["How storytelling can drive strategic change", "6794219"],
  challenge: ["FD Mediagroep · Business Challenge PDF", "6749932"],
  truth: ["Who will monetize truth", "6749945"],
  mckinsey: ["McKinsey · AI / data readiness", "6749946"],
  reutersReport: ["Reuters · Digital News Report 2026", "6749955"],
  reutersTrends: ["Reuters · Trends and Predictions 2026", "6749949"],
  wanifRa: ["WAN-IFRA · WPT 2025–26", "6749951"],
  wef: ["WEF · CSO September 2026", "6749947"],
  bnr: ["BNR · Infographic", "6749958"],
  dms: ["DMS · Infographic", "6749961"],
  fdp: ["FDP · Infographic", "6749964"],
  fd: ["FD · Infographic", "6749965"],
  rick: ["Persona · Rick", "6749970"],
  wendy: ["Persona · Wendy", "6749972"],
  tess: ["Persona · Tess", "6749973"],
  groupPowerpoint: ["Group Assignment – powerpoint", "https://canvas.maastrichtuniversity.nl/courses/28848/modules/items/1130177"],
  groupPresentation: ["Group Assignment – presentation", "https://canvas.maastrichtuniversity.nl/courses/28848/modules/items/1130178"],
  individual: ["Individual Assignment", "https://canvas.maastrichtuniversity.nl/courses/28848/modules/items/1130179"],
  assignments: ["Canvas · Assignments", "https://canvas.maastrichtuniversity.nl/courses/28848/assignments"]
};

const NOVEMBER_STUDY_DAYS = [
  { day: "周一", date: "2026-11-02", title: "客户洞察与同理心", goal: "从客户的真实处境出发，区分观察、假设与需求。", question: "我认为客户需要的，和客户实际遇到的困难，有什么差别？" },
  { day: "周二", date: "2026-11-03", title: "设计思维与战略沟通", goal: "先把问题定义清楚，再把改变的理由、证据与行动讲清楚。", question: "如果换一种问题定义，我们的解决方向会怎样改变？" },
  { day: "周三", date: "2026-11-04", title: "FD 案例与人物画像", goal: "把行业材料与人物画像连接起来，为案例讨论准备证据。", question: "哪些判断已有材料支持，哪些还只是我们对读者的猜测？" },
  { day: "周四", date: "2026-11-05", title: "战略与商业模式", goal: "把客户价值、战略选择与商业模式中的关键假设连起来。", question: "这个商业模式最依赖哪条尚未验证的假设？" },
  { day: "周五", date: "2026-11-06", title: "整合、讨论与作业准备", goal: "整理预习中的证据、问题与初步想法，准备课堂和小组讨论。", question: "哪一个问题最值得带到课堂，让老师或小组帮助验证？" }
];

const NOVEMBER_LEARNING_LEVELS = [
  { id: "foundation", title: "零基础版", hint: "从零开始，用白话和具体例子理解今天的问题。" },
  { id: "detailed", title: "详细讲解版", hint: "讲清概念、原理、操作步骤和适用边界。" },
  { id: "seminar", title: "专家研讨版", hint: "分析证据、争议、替代解释与战略取舍。" }
];

const NOVEMBER_STUDY_VIDEOS = [
  { duration: "6:16", notebook: "87aa25ce-43a2-4676-bd60-6e800421dadf" },
  { duration: "6:31", notebook: "dfbbc6fe-4a66-4d67-b62c-7856d7609118" },
  { duration: "8:11", notebook: "a8a6fc68-84a2-4e71-8e21-29ed3c9a9330" },
  { duration: "9:12", notebook: "2ca5b90b-b5f7-4e14-aaa7-737820baa9e6" },
  { duration: "7:56", notebook: "fce541fc-d91f-46bd-9546-d710fa8aa583" }
];

function renderNovemberLearningVideo(index) {
  const day = NOVEMBER_STUDY_DAYS[index];
  const video = NOVEMBER_STUDY_VIDEOS[index];
  if (!day || !video) return "";
  const title = `第 ${index + 1} 天 · ${day.title}`;
  return `<section class="emba-november-video" aria-labelledby="november-video-heading-${index}" tabindex="-1">
    <div class="emba-november-video-heading"><div><span class="emba-month-kicker">本日学习视频</span><h4 id="november-video-heading-${index}">${escapeHtml(title)}</h4></div><span class="emba-november-video-duration">中文 · ${video.duration}</span></div>
    <video controls playsinline preload="metadata" aria-label="${escapeHtml(title)} · 中文学习视频" src="/api/emba/video/${day.date}">你的浏览器暂不支持页内视频，请使用下方链接观看。</video>
    <p>白话入门 → 机制与应用 → 研讨问题 → 五步学习法</p>
    <a href="https://notebook.google.com/notebook/${video.notebook}" target="_blank" rel="noopener noreferrer">在 NotebookLM 查看视频与来源 ↗</a>
  </section>`;
}

function renderNovemberVideoDirectory() {
  return `<section class="emba-november-learning-guide" aria-labelledby="november-video-directory"><span class="emba-month-kicker">NotebookLM · 中文讲解</span><h4 id="november-video-directory">五天学习视频 · 共约 38 分钟</h4><div class="emba-november-video-directory">${NOVEMBER_STUDY_DAYS.map((day, index) => `<button class="emba-file-link" type="button" data-november-video-index="${index}"><span>第 ${index + 1} 天 · ${escapeHtml(day.title)}</span><small>${NOVEMBER_STUDY_VIDEOS[index].duration} · 播放 →</small></button>`).join("")}</div></section>`;
}

function novemberLearningButton(index, level, compact = false) {
  const day = NOVEMBER_STUDY_DAYS[index];
  const file = `/emba/content/2026/11_November/pre-study/${day.date}-${level.id}.md`;
  const title = `第 ${index + 1} 天 · ${level.title}`;
  return `<button class="${compact ? "emba-file-link" : "emba-november-level-link"}" type="button" data-november-learning-level="${level.id}" data-material-open="${escapeHtml(file)}" data-material-title="${escapeHtml(title)}">${compact ? `${escapeHtml(level.title)} →` : `<strong>${escapeHtml(level.title)} <span aria-hidden="true">→</span></strong><span>${escapeHtml(level.hint)}</span>`}</button>`;
}

function renderNovemberLearningGuide(index) {
  return `<section class="emba-november-learning-guide" aria-labelledby="november-learning-heading-${index}"><span class="emba-month-kicker">三种讲解深度</span><h4 id="november-learning-heading-${index}">选择适合你的版本</h4><p><strong>今天的问题：</strong>${escapeHtml(NOVEMBER_STUDY_DAYS[index].question)}</p><p>完全陌生，从零基础版开始；略懂一点，读详细讲解；已有经验，进入专家研讨。三个版本都能独立阅读，最后附五步学习与当天练习。</p><div class="emba-november-levels">${NOVEMBER_LEARNING_LEVELS.map(level => novemberLearningButton(index, level)).join("")}</div></section>`;
}

function renderNovemberLearningDirectory() {
  return `<section class="emba-november-learning-guide" aria-labelledby="november-learning-directory"><span class="emba-month-kicker">五天学习讲解 · 15 个版本</span><h4 id="november-learning-directory">零基础、详细讲解与专家研讨</h4><div class="emba-november-learning-directory">${NOVEMBER_STUDY_DAYS.map((day, index) => `<div><h5>第 ${index + 1} 天 · ${escapeHtml(day.title)}</h5><div class="emba-study-utility-links">${NOVEMBER_LEARNING_LEVELS.map(level => novemberLearningButton(index, level, true)).join("")}</div></div>`).join("")}</div></section>`;
}

function isNovemberStudy(month) {
  return month?.month === "2026-11" || month?.id === "2026-11";
}

function novemberDisclosureAttrs(key) {
  return `data-november-disclosure="${escapeHtml(key)}"${NOVEMBER_STUDY_UI.disclosures[key] ? " open" : ""}`;
}

function novemberSourceLink(id) {
  const source = NOVEMBER_STUDY_SOURCES[id];
  if (!source) return "";
  const [title, location] = source;
  const url = /^\d+$/.test(location)
    ? `https://canvas.maastrichtuniversity.nl/courses/28848/files/${location}?wrap=1`
    : location;
  const privateFile = NOVEMBER_PRIVATE_FILES.entries[location];
  if (privateFile) {
    return `<div class="emba-november-source"><button class="emba-post-source" type="button" data-november-pdf-open="${escapeHtml(location)}"><span>${escapeHtml(privateFile.title || title)}<small class="emba-november-file-meta">${escapeHtml(novemberFileMeta(privateFile))}</small></span><span aria-hidden="true">阅读 →</span></button><a class="emba-november-provenance" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Canvas 来源 ↗</a></div>`;
  }
  return `<a class="emba-post-source" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(title)}</span><span aria-hidden="true">↗</span></a>`;
}

function novemberFileMeta(file) {
  const parts = ["PDF"];
  if (Number.isInteger(file.pages) && file.pages > 0) parts.push(`${file.pages} 页`);
  if (Number.isFinite(file.bytes) && file.bytes > 0) {
    parts.push(file.bytes >= 1024 * 1024 ? `${(file.bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.ceil(file.bytes / 1024)} KB`);
  }
  return parts.join(" · ");
}

function normalizeNovemberManifest(manifest) {
  const files = manifest?.files || manifest || {};
  const candidates = Array.isArray(files)
    ? files.map((file) => [file?.canvasId || file?.canvas_id || file?.id, file])
    : Object.entries(files);
  const allowedIds = new Set(Object.values(NOVEMBER_STUDY_SOURCES).map((source) => source[1]).filter((id) => /^\d+$/.test(id)));
  const entries = {};
  for (const [rawId, file] of candidates) {
    const id = String(rawId || "");
    const url = String(file?.url || file?.file || "");
    if (!allowedIds.has(id) || !/^\/api\/emba\/file\/emba\/2026-11\/material\/[^?#\\]+\.pdf$/i.test(url) || url.includes("..")) continue;
    entries[id] = {
      url,
      title: String(file.title || ""),
      name: String(file.name || file.filename || ""),
      bytes: Number(file.bytes || 0),
      pages: Number(file.pages || 0)
    };
  }
  return entries;
}

function refreshNovemberStudy() {
  if (typeof selectedMonth !== "function" || typeof renderMonthDetail !== "function") return;
  const month = selectedMonth();
  if (isNovemberStudy(month)) renderMonthDetail(month);
}

function loadNovemberPrivateFiles(retry = false) {
  if (!retry && NOVEMBER_PRIVATE_FILES.promise) return NOVEMBER_PRIVATE_FILES.promise;
  NOVEMBER_PRIVATE_FILES.status = "loading";
  NOVEMBER_PRIVATE_FILES.promise = (async () => {
    try {
      const response = await fetch("/emba/november-files.json", { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error("File list unavailable");
      const entries = normalizeNovemberManifest(await response.json());
      if (!Object.keys(entries).length) throw new Error("File list empty");
      NOVEMBER_PRIVATE_FILES.entries = entries;
      NOVEMBER_PRIVATE_FILES.status = "loaded";
    } catch {
      NOVEMBER_PRIVATE_FILES.status = "error";
    }
    refreshNovemberStudy();
  })();
  return NOVEMBER_PRIVATE_FILES.promise;
}

function novemberPrivateFilesStatus() {
  const count = Object.keys(NOVEMBER_PRIVATE_FILES.entries).length;
  if (count === 18) return "18 份课程原文件已保存至私人 EMBA，可直接在本页阅读。";
  if (count) return `已保存 ${count} / 18 份原文件，可在本页阅读已保存资料。`;
  if (NOVEMBER_PRIVATE_FILES.status === "error") return '文件清单暂时无法读取。<button class="emba-file-link" type="button" data-november-files-retry>重新读取 →</button>';
  return "正在读取私人 EMBA 文件…";
}

function renderNovemberPdfReader() {
  const id = NOVEMBER_STUDY_UI.pdf;
  const file = NOVEMBER_PRIVATE_FILES.entries[id];
  if (!file) return "";
  const source = Object.values(NOVEMBER_STUDY_SOURCES).find((item) => item[1] === id);
  const title = file.title || source?.[0] || "课程 PDF";
  const canvasUrl = `https://canvas.maastrichtuniversity.nl/courses/28848/files/${id}?wrap=1`;
  return `<section class="emba-study-workspace emba-november-pdf-reader" data-block-panel="november-pdf-reader" aria-labelledby="november-pdf-title" tabindex="-1">
    <header class="emba-november-pdf-heading"><div><span class="emba-month-kicker">NOVEMBER · 课程原文件</span><h3 id="november-pdf-title">${escapeHtml(title)}</h3><p class="emba-november-file-meta">${escapeHtml(novemberFileMeta(file))}</p></div>
      <div class="emba-november-pdf-actions"><button class="emba-file-link" type="button" data-november-pdf-close>← 返回资料</button><a class="emba-file-link" href="${escapeHtml(file.url)}" target="_blank" rel="noopener noreferrer">新窗口打开 ↗</a><a class="emba-file-link" href="${escapeHtml(file.url)}" download="${escapeHtml(file.name || `${id}.pdf`)}">下载 PDF ↓</a></div>
    </header>
    <iframe class="emba-november-pdf-frame" src="${escapeHtml(file.url)}#view=FitH" title="${escapeHtml(title)} · PDF 阅读器" referrerpolicy="same-origin"></iframe>
    <p class="emba-post-context">如浏览器未显示 PDF，可选择“新窗口打开”或“下载 PDF”。<a class="emba-november-provenance" href="${escapeHtml(canvasUrl)}" target="_blank" rel="noopener noreferrer">Canvas 来源 ↗</a></p>
  </section>`;
}

function closeNovemberPdf() {
  const id = NOVEMBER_STUDY_UI.pdf;
  NOVEMBER_STUDY_UI.pdf = "";
  refreshNovemberStudy();
  document.querySelector(`[data-november-pdf-open="${id}"]`)?.focus({ preventScroll: true });
}

function novemberSourceGrid(ids) {
  return `<div class="emba-post-source-grid">${ids.map(novemberSourceLink).join("")}</div>`;
}

function novemberArchiveButtons(items) {
  return `<div class="emba-study-utility-links">${items.map(([id, title]) => `<button class="emba-file-link" type="button" data-block-toggle="${escapeHtml(id)}">${escapeHtml(title)} →</button>`).join("")}</div>`;
}

function renderNovemberStep(key, number, title, hint, body) {
  return `<details class="emba-plan-step" ${novemberDisclosureAttrs(key)}>
    <summary><span class="emba-plan-step-index">${number}</span><span class="emba-plan-step-copy"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(hint)}</small></span><span class="emba-plan-step-arrow" aria-hidden="true">+</span></summary>
    <div class="emba-plan-step-body">${body}</div>
  </details>`;
}

function renderNovemberDayHeader(day, post) {
  return `<header class="emba-plan-heading"><span class="emba-month-kicker">${escapeHtml(day.day)} · ${escapeHtml(day.date.replaceAll("-", "."))}</span><h3>${escapeHtml(day.title)}${post ? " · 复习框架" : ""}</h3><p>${post ? "课后根据实际课堂内容补充" : "建议预习顺序 · 请在 11 月 2 日开课前完成"}</p></header>
    <p class="emba-plan-goal"><span class="emba-plan-goal-label">${post ? "复习目标" : "预习目标"}</span>${post ? "核对真实课堂材料，保存自己的笔记、反思与后续行动。" : escapeHtml(day.goal)}</p>`;
}

function renderNovemberPreDay(day, index) {
  if (state.materialReader) return renderMaterialReader();
  const steps = [
    [
      ["完成创新者自测", "Corporate Innovator Assessment", `<p>按自己的实际情况完成自测，记下结果与一个想在课程中提升的方面。</p>${novemberSourceGrid(["assessment"])}`],
      ["看视频与阅读同理心设计", "Canvas 将此视频关联到 Day 1", `<p>观看 Customer-centric Design，并准备视频中的问题；再读同理心设计文章。</p>${novemberSourceGrid(["customer", "empathic"])}`],
      ["带着客户问题进课堂", "建议练习 · 观察与假设分开", `<p class="emba-plan-question">${escapeHtml(day.question)}</p><p>选一个熟悉的客户场景，分别写下已观察到的事实、自己的推断，以及还需要询问的问题。</p>`]
    ],
    [
      ["阅读设计思维文章", "问题定义、探索与验证", `<p>阅读两篇设计思维文章，记下它们怎样帮助团队重新理解问题。</p>${novemberSourceGrid(["designWorks", "designAge"])}`],
      ["阅读战略沟通文章", "让改变与听众关心的问题相连", `<p>阅读 storytelling 文章，关注怎样沟通战略方向、邀请讨论并落实行动。</p>${novemberSourceGrid(["storytelling"])}`],
      ["重新表述一个问题", "建议练习 · 形成可讨论的初稿", `<p class="emba-plan-question">${escapeHtml(day.question)}</p><p>用“谁遇到了什么困难、目前怎样应对、为什么值得改变”写一段问题描述，并标出仍需验证的部分。</p>`]
    ],
    [
      ["通读 FD Business Challenge", "负责任经营与 2030 战略选择", `<p>先读案例说明：独立高质新闻、负责任使用数据与信息、好雇主、减少碳足迹，哪些议题最值得成为 FDMG 面向 2030 的战略优先项？区分保护现有价值与创造新价值，再对照材料清单。</p>${novemberSourceGrid(["challenge", "case"])}`],
      ["整理行业背景证据", "背景报告与品牌信息图", `<p>按案例问题阅读，记录重要证据及其出处，区分行业趋势与针对 FD 的判断。</p><details class="emba-pre-media" ${novemberDisclosureAttrs("pre-3-reports")}><summary>背景报告 · 6 份</summary>${novemberSourceGrid(["truth", "mckinsey", "reutersReport", "reutersTrends", "wanifRa", "wef"])}</details><details class="emba-pre-media" ${novemberDisclosureAttrs("pre-3-infographics")}><summary>品牌信息图 · BNR / DMS / FDP / FD</summary>${novemberSourceGrid(["bnr", "dms", "fdp", "fd"])}</details>`],
      ["对照三个人物画像", "Rick · Wendy · Tess", `${novemberSourceGrid(["rick", "wendy", "tess"])}<p class="emba-plan-question">${escapeHtml(day.question)}</p><p>建议整理一张“人物、需求、材料证据、待验证问题”对照表。</p>`]
    ],
    [
      ["观看战略规划视频", "Canvas 将此视频关联到 Day 4", `<p>观看 Strategic Planning and Doing，准备视频提出的问题。</p>${novemberSourceGrid(["strategy"])}`],
      ["观看商业模式视频", "Canvas 将此视频关联到 Day 4", `<p>观看 Building Future-proof Business Models，准备视频提出的问题。</p>${novemberSourceGrid(["businessModel"])}`],
      ["把战略连接到 FD 案例", "建议练习 · 检查关键假设", `<p class="emba-plan-question">${escapeHtml(day.question)}</p><p>结合客户画像，写下一个价值主张，以及它对客户行为、收入或组织能力的依赖；把尚无证据的部分标为假设。</p>`]
    ],
    [
      ["整合全部预习", "自测 · 3 个视频 · 4 篇文章 · FD 案例", `<p>检查自测、三个视频及视频中的问题、四篇文章和 FD 案例材料是否已完成；把未理解的概念集中列出。</p>${novemberSourceGrid(["preparation", "case"])}`],
      ["查看小组与个人作业入口", "具体要求与截止时间以 Canvas 原页为准", `<p>打开作业原页，核对交付形式、评分说明及截止时间，再与小组协调。此处只提供已发布的作业入口。</p>${novemberSourceGrid(["groupPowerpoint", "groupPresentation", "individual", "assignments"])}`],
      ["准备讨论与课堂问题", "建议产出 · 一页预习摘要", `<p class="emba-plan-question">${escapeHtml(day.question)}</p><p>带上一页摘要：最有用的洞察、FD 案例的关键证据、尚未验证的假设，以及想请教老师或小组的问题。</p>`]
    ]
  ][index];
  return `<div class="emba-daily-plan" data-november-pre-day="${escapeHtml(day.date)}">${renderNovemberDayHeader(day, false)}${renderNovemberLearningVideo(index)}${renderNovemberLearningGuide(index)}<div class="emba-plan-steps">${steps.map(([title, hint, body], step) => renderNovemberStep(`pre-${index + 1}-${step + 1}`, String(step + 1).padStart(2, "0"), title, hint, body)).join("")}</div></div>`;
}

function renderNovemberPostDay(day, index) {
  if (state.materialReader) return renderMaterialReader();
  return `<div class="emba-daily-plan emba-post-day" data-november-post-day="${escapeHtml(day.date)}">${renderNovemberDayHeader(day, true)}
    ${renderNovemberLearningVideo(index)}
    <div class="emba-plan-steps">
      ${renderNovemberStep(`post-${index + 1}-sources`, "01", "回顾真实课堂材料", "课后补充 · 按老师实际授课内容整理", `<p>本日课件与课堂记录可在课后归档。在资料库上传，并在月度笔记中标注日期与来源。</p>${novemberArchiveButtons([["material", "课程资料与上传"]])}`)}
      ${renderNovemberStep(`post-${index + 1}-tasks`, "02", "核对作业与后续行动", "以 Canvas 最新要求为准", `<p>课后对照实际作业说明，记录待办、疑问与小组分工。</p>${novemberSourceGrid(["assignments"])}${novemberArchiveButtons([["markdown", "月度笔记"]])}`)}
      ${renderNovemberStep(`post-${index + 1}-notes`, "03", "记录自己的笔记与反思", "保存真实学习记录", `<p>在月度笔记和个人反思中按日期记录：学到了什么、哪些判断发生改变、下一步怎样验证。开启 Edit mode 后可编辑或上传照片。</p>${novemberArchiveButtons([["markdown", "月度笔记"], ["reflection", "个人反思"], ["memory", "课堂照片"]])}`)}
    </div>
  </div>`;
}

function renderNovemberResources(month) {
  if (state.materialReader) return `<div class="emba-study-workspace" data-block-panel="november-resources-reader">${renderMaterialReader()}</div>`;
  const groups = [
    ["articles", "课程文章 · 4 份", ["empathic", "designWorks", "designAge", "storytelling"]],
    ["challenge", "FD 案例说明 · 1 份", ["challenge"]],
    ["reports", "行业背景报告 · 6 份", ["truth", "mckinsey", "reutersReport", "reutersTrends", "wanifRa", "wef"]],
    ["infographics", "品牌信息图 · 4 份", ["bnr", "dms", "fdp", "fd"]],
    ["personas", "人物画像 · 3 份", ["rick", "wendy", "tess"]]
  ];
  const plan = Array.isArray(month?.materials) && month.materials.find((item) => item.type === "course_overview" && item.file?.includes("11_November"));
  const planFile = plan?.file || "/emba/content/2026/11_November/2026-11_EMBA_Future_Proof_Business_Models_Index.md";
  return `<div class="emba-study-workspace" data-block-panel="november-resources">
    <div class="emba-daily-plan">
      <header class="emba-plan-heading"><span class="emba-month-kicker">FUTURE-PROOF BUSINESS MODELS</span><h3>课程文件 · 18 份资料</h3><p role="status">${novemberPrivateFilesStatus()}</p></header>
      <div class="emba-study-utility-links"><button class="emba-file-link" type="button" data-material-open="${escapeHtml(planFile)}" data-material-title="11 月完整学习计划">打开完整学习计划 →</button></div>
      ${renderNovemberVideoDirectory()}${renderNovemberLearningDirectory()}
      <div class="emba-plan-steps" data-november-files>
        ${groups.map(([id, title, sources]) => `<section class="emba-plan-step" aria-labelledby="november-files-${id}"><div class="emba-plan-step-body"><h4 id="november-files-${id}">${escapeHtml(title)}</h4>${novemberSourceGrid(sources)}</div></section>`).join("")}
      </div>
      <section class="emba-plan-step" aria-labelledby="november-other-preparation"><div class="emba-plan-step-body"><h4 id="november-other-preparation">视频与自测</h4>${novemberSourceGrid(["customer", "strategy", "businessModel", "assessment"])}</div></section>
      <section class="emba-plan-step" aria-labelledby="november-canvas-entrances"><div class="emba-plan-step-body"><h4 id="november-canvas-entrances">Canvas 总入口</h4>${novemberSourceGrid(["preparation", "case", "assignments"])}</div></section>
    </div>
  </div>`;
}

function renderNovemberStudyModules(month) {
  const module = NOVEMBER_STUDY_UI.module;
  const post = module === "post-study";
  const resources = module === "resources";
  const index = NOVEMBER_STUDY_UI.day;
  const day = NOVEMBER_STUDY_DAYS[index] || NOVEMBER_STUDY_DAYS[0];
  const extras = post
    ? [["markdown", "月度笔记"], ["reflection", "个人反思"], ["material", "全部资料与上传"], ["memory", "课堂照片"]]
    : [["preparation", "预习资料库"], ["material", "全部资料"]];
  const archiveIds = new Set(["preparation", "markdown", "reflection", "material", "memory"]);
  const auxiliary = archiveIds.has(state.openBlockId);
  return `<div class="emba-study-planner" data-november-planner>
    <header class="emba-study-heading"><span class="emba-study-eyebrow">NOVEMBER / 2026</span><h2>11 月学习计划</h2><p>Future-proof Business Models · 11 月 2–6 日</p><span class="emba-study-month-mark" aria-hidden="true">11</span></header>
    <div class="emba-study-tabs" role="tablist" aria-label="11 月学习阶段">
      ${[["pre-study", "Pre Study", "课前预习"], ["post-study", "Post Study", "课后复习"], ["resources", "课程文件", "18 份资料"]].map(([id, title, subtitle]) => `<button type="button" role="tab" id="november-tab-${id}" aria-controls="november-module-panel" aria-selected="${module === id}" tabindex="${module === id ? 0 : -1}" data-november-module-select="${id}"><span>${title}</span><small>${subtitle}</small></button>`).join("")}
    </div>
    <section id="november-module-panel" role="tabpanel" aria-labelledby="november-tab-${module}" data-november-module="${module}">
      ${NOVEMBER_STUDY_UI.pdf ? renderNovemberPdfReader() : resources ? renderNovemberResources(month) : `<p class="emba-post-context">${post ? "以下为课后复习框架；课堂笔记、课件和反思由课程后据实补充。" : "全部预习请在 11 月 2 日开课前完成。周一至周五页签对应课程日期，内容按建议学习顺序组织；Canvas 仅明确将客户设计视频关联 Day 1、战略与商业模式视频关联 Day 4，其余不代表已确认的逐日课表。"}</p>
      <div class="emba-study-layout">
        <div class="emba-weekdays" role="tablist" aria-label="11 月学习日" aria-orientation="vertical">
          ${NOVEMBER_STUDY_DAYS.map((item, dayIndex) => `<button type="button" role="tab" id="november-day-${dayIndex}" aria-controls="november-day-panel" aria-selected="${index === dayIndex}" tabindex="${index === dayIndex ? 0 : -1}" data-november-day-select="${dayIndex}"><span class="emba-weekday-label"><strong>${escapeHtml(item.day)}</strong><small>11.${Number(item.date.slice(-2))}</small></span><span class="emba-weekday-topic">${escapeHtml(item.title)}</span></button>`).join("")}
        </div>
        <div class="emba-study-workspace" id="november-day-panel" role="tabpanel" aria-labelledby="november-day-${index}">
          ${auxiliary ? renderOpenBlockPanel(month) : `<div data-block-panel="november-${module}-day-${index + 1}">${post ? renderNovemberPostDay(day, index) : renderNovemberPreDay(day, index)}</div>`}
        </div>
      </div>
      <details class="emba-study-resources" ${novemberDisclosureAttrs(`${module}-extras`)}><summary>${post ? "资料与笔记归档" : "更多预习资料"}</summary>${novemberArchiveButtons(extras)}${post ? "" : novemberSourceGrid(["preparation", "case"])}</details>`}
    </section>
  </div>`;
}

const novemberDetail = document.getElementById("embaMonthDetail");

novemberDetail?.addEventListener("click", (event) => {
  const videoLink = event.target.closest("[data-november-video-index]");
  if (videoLink) {
    const index = Number(videoLink.dataset.novemberVideoIndex);
    if (!isNovemberStudy(selectedMonth()) || !Number.isInteger(index) || !NOVEMBER_STUDY_DAYS[index]) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    NOVEMBER_STUDY_UI.module = "pre-study";
    NOVEMBER_STUDY_UI.day = index;
    NOVEMBER_STUDY_UI.pdf = "";
    state.openBlockId = "";
    state.materialReader = null;
    renderMonthDetail(selectedMonth());
    document.querySelector(".emba-november-video")?.focus({ preventScroll: true });
    if (typeof scrollToMonthTarget === "function") scrollToMonthTarget(".emba-november-video");
    return;
  }
  const pdfOpen = event.target.closest("[data-november-pdf-open]");
  const pdfClose = event.target.closest("[data-november-pdf-close]");
  const filesRetry = event.target.closest("[data-november-files-retry]");
  if (pdfOpen || pdfClose || filesRetry) {
    if (!isNovemberStudy(selectedMonth())) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (filesRetry) {
      loadNovemberPrivateFiles(true);
      refreshNovemberStudy();
    } else if (pdfClose) {
      closeNovemberPdf();
    } else if (NOVEMBER_PRIVATE_FILES.entries[pdfOpen.dataset.novemberPdfOpen]) {
      NOVEMBER_STUDY_UI.pdf = pdfOpen.dataset.novemberPdfOpen;
      state.materialReader = null;
      refreshNovemberStudy();
      document.querySelector(".emba-november-pdf-reader")?.focus({ preventScroll: true });
      if (typeof scrollToMonthTarget === "function") scrollToMonthTarget(".emba-november-pdf-reader");
    }
    return;
  }
  const moduleTab = event.target.closest("[data-november-module-select]");
  const dayTab = event.target.closest("[data-november-day-select]");
  if (!moduleTab && !dayTab) return;
  if (!isNovemberStudy(selectedMonth())) return;
  if (moduleTab) {
    const module = moduleTab.dataset.novemberModuleSelect;
    if (!["pre-study", "post-study", "resources"].includes(module)) return;
    NOVEMBER_STUDY_UI.module = module;
  } else {
    const index = Number(dayTab.dataset.novemberDaySelect);
    if (!Number.isInteger(index) || !NOVEMBER_STUDY_DAYS[index]) return;
    NOVEMBER_STUDY_UI.day = index;
  }
  event.stopImmediatePropagation();
  state.openBlockId = "";
  state.materialReader = null;
  NOVEMBER_STUDY_UI.pdf = "";
  const focusId = (moduleTab || dayTab).id;
  renderMonthDetail(selectedMonth());
  document.getElementById(focusId)?.focus({ preventScroll: true });
});

novemberDetail?.addEventListener("toggle", (event) => {
  const detail = event.target;
  if (detail.isConnected && detail.matches("details[data-november-disclosure]")) {
    NOVEMBER_STUDY_UI.disclosures[detail.dataset.novemberDisclosure] = detail.open;
  }
}, true);

novemberDetail?.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && NOVEMBER_STUDY_UI.pdf && isNovemberStudy(selectedMonth())) {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeNovemberPdf();
    return;
  }
  const tab = event.target.closest("[data-november-module-select], [data-november-day-select]");
  const tablist = tab?.closest('[role="tablist"]');
  if (!tablist || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const current = tabs.indexOf(tab);
  const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1
    : (current + (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1) + tabs.length) % tabs.length;
  event.preventDefault();
  event.stopImmediatePropagation();
  tabs[next]?.click();
});

if (typeof fetch === "function") loadNovemberPrivateFiles();
