---
id: emba-2026-09-post-day-1
title: "周一 Post Study · Financial Management · 价值与风险"
type: course_notes
month: 2026-09
date: 2026-09-21
visibility: private
source_file: 
rag_include: true
---

# 周一 Post Study · Financial Management · 价值与风险

Paulo Rodrigues · Dennis Bams

08:30–11:30 Paulo；12:30–15:30 Paulo / Dennis；16:00–19:00 Dennis。时间与讲师依据 syllabus 第 9 页。

## 课件和资料

- [Paulo Rodrigues · Corporate Finance（PPT，103 页）](/api/emba/file/emba/2026-09/material/post-study-rodrigues-6181f616bcd0.pptx)
- [Dennis Bams · Corporate Financial Risk（PDF，167 页）](/api/emba/file/emba/2026-09/material/post-study-bams-7891c600d996.pdf)
- [Maersk_risk_model.xlsx](/api/emba/file/emba/2026-09/material/post-study-maersk-model-3ef4575b69fa.xlsx)
- [Heineken_risk_model.xlsx](/api/emba/file/emba/2026-09/material/post-study-heineken-model-3680203ed0ce.xlsx)
- [Vestas_risk_model.xlsx](/api/emba/file/emba/2026-09/material/post-study-vestas-model-0a044a7a3df8.xlsx)
- [Atlantia_risk_model.xlsx](/api/emba/file/emba/2026-09/material/post-study-atlantia-model-0655358e1ff3.xlsx)
- [Final Assessment · 原始要求（7 页）](/api/emba/file/emba/2026-09/material/post-study-assignment-c6e414c7a282.pdf)
- [Syllabus · 课程安排与指定阅读](/api/emba/file/emba/2026-09/material/post-study-syllabus-65814bdace6e.pdf)

## 作业要求

本日没有独立的书面题；价值、风险与资本结构的内容为周三比率解释及周五小组作业提供基础。

用原始 Excel 对照 Scorecard 和 Merton 的输入、单位、时点与输出；不把课堂困境代理指标直接改名为真实违约。

建议整理产出：一页“价值 / 现金流 / 风险 / 生存能力”对照表，加一张模型输入与验证清单。

## 原始记录与补充分析

### 权重从哪里来：从像模型，走到有证据的模型

> 常数咋定的

原文时间（UTC）：2026-09-07T15:16:47.000Z；任务：规划Day 1后续学习 (5)；thread：01a07cc6-14e6-7943-afd1-d01e724ed8bf；turn：01a07c71-7bf6-7292-bca0-e97f1934ba8e。

> 这个和我的sus pdc很像啊

原文时间（UTC）：2026-09-07T15:17:29.000Z；任务：规划Day 1后续学习 (5)；thread：01a07cc6-14e6-7943-afd1-d01e724ed8bf；turn：01a07c72-1f97-7833-a958-45131af5e09f。

> 怎么就成了分数了

原文时间（UTC）：2026-09-07T15:19:28.000Z；任务：规划Day 1后续学习 (5)；thread：01a07cc6-14e6-7943-afd1-d01e724ed8bf；turn：01a07c73-f303-7711-a143-0efbc458a441。

当时在想什么（根据上下文归纳）：你在 Altman → Ohlson → 课堂 Scorecard 这一段，把老师的方法联系到自己的 SUS / PDC。

补充分析（Codex，2026-09-21）：你的问题指向模型的依据：指标为什么入选、权重如何估计、最终分数代表什么。课件第 61–65 页区分了 Altman 判别分数与 Ohlson 的逻辑回归概率。把指标加权成一个数，只完成了表达；用已知结果估计参数、在未见过的数据上检验，才开始建立预测证据。老师的 0–100 分也有特定定义，不能直接当成 PDC 的上涨概率。

下一步：为每个 PDC 维度补一行：目标、可观察指标、数据日期、权重依据、缺失值处理；再把“人工设定权重”和“经样本估计的权重”分开。

[课件依据：第 61–65 页](/api/emba/file/emba/2026-09/material/post-study-bams-7891c600d996.pdf)

### ROA 的分母：数字变好，经营是否真的变好？

> 为啥重资产公司反而高啊

原文时间（UTC）：2026-09-07T15:30:17.000Z；任务：规划Day 1后续学习 (5)；thread：01a07cc6-14e6-7943-afd1-d01e724ed8bf；turn：01a07c7d-d8b5-7152-a9f2-6a45e33f1758。

> 就是利润管理 比如10年后折旧完了 我可以依然算账吗

原文时间（UTC）：2026-09-07T15:33:40.000Z；任务：规划Day 1后续学习 (5)；thread：01a07cc6-14e6-7943-afd1-d01e724ed8bf；turn：01a07c80-f196-7d01-ba3b-39dd6d6d24e9。

> 岂不是可能0资产 巨额收益啊

原文时间（UTC）：2026-09-07T15:34:43.000Z；任务：规划Day 1后续学习 (5)；thread：01a07cc6-14e6-7943-afd1-d01e724ed8bf；turn：01a07c81-e8d3-7b81-9d6e-a83ff28a9ac7。

当时在想什么（根据上下文归纳）：在第 72–75 页财务比率讨论中，你追问了重资产公司、折旧和资产分母。

补充分析（Codex，2026-09-21）：你抓住的是“会计计量能否代表经济效率”。单台设备折旧至零仍可能继续生产，但这不代表公司总资产为零；现金、应收、存货等仍在。分母很小会放大 ROA，分母为零时比率无定义，不能解释为无限优秀。比较公司时，要同时看资产年龄、折旧政策、资本支出、利润率和现金流。仅凭某年 ROA 高，不能认定原因就是折旧，也不能为美化比率随意改会计估计。

下一步：做 ASML 比率表时给每个数字标注口径和年份；对看似很好的比率，补问“是否由分母变化造成”。需要判断折旧政策时回到年报附注。

[课件依据：第 72–75 页](/api/emba/file/emba/2026-09/material/post-study-bams-7891c600d996.pdf)

### 预测什么：财务困境与股价上涨是两个目标

> 和我们学的altman 和ohlson有啥区别啊。我们的差在哪里还是他们的差

原文时间（UTC）：2026-09-07T15:48:00.000Z；任务：规划Day 1后续学习 (5)；thread：01a07cc6-14e6-7943-afd1-d01e724ed8bf；turn：01a07c8e-0fb3-7fb2-abdb-abff1cf3b950。

> 我们如何改变成判断怎么上涨啊

原文时间（UTC）：2026-09-07T15:49:06.000Z；任务：规划Day 1后续学习 (5)；thread：01a07cc6-14e6-7943-afd1-d01e724ed8bf；turn：01a07c8f-12ec-7fd3-8f5b-ece091e0de2d。

> 他们那个是事后去判断吗 还是预测y偶没有问题啊

原文时间（UTC）：2026-09-07T15:51:19.000Z；任务：规划Day 1后续学习 (5)；thread：01a07cc6-14e6-7943-afd1-d01e724ed8bf；turn：01a07c91-1b2c-7903-99f4-ca7f0e0b2e6a。

当时在想什么（根据上下文归纳）：你从比较 Altman/Ohlson 与自己的系统，进一步问到事后解释和事前预测。

补充分析（Codex，2026-09-21）：核心不是把风险分数反过来就变成上涨分数，而是重新定义要预测的结果。课件第 65 页的课堂 Scorecard 把“未来十二个月账面权益转负”作为困境代理标签；它并不等同于实际法律违约事件。上涨研究还要定义持有期、比较基准、交易成本和最大回撤。低困境概率不保证高收益，因为估值与市场预期可能已反映安全性。

下一步：先固定一个可检验问题，例如“未来六个月是否跑赢指定基准”；保存当时可获得的数据，按时间划分训练与测试，禁止使用预测日之后的信息。

[课件依据：第 63–65 页](/api/emba/file/emba/2026-09/material/post-study-bams-7891c600d996.pdf)

### 你对 AI 分数的质疑：共识并不能代替实证

> 这些的打分其实都是盲估没有实际依据是不是 ai主动性很高

原文时间（UTC）：2026-09-07T16:25:54.000Z；任务：规划Day 1后续学习 (5)；thread：01a07cc6-14e6-7943-afd1-d01e724ed8bf；turn：01a07cb0-c5d8-77d3-9dba-b86ee844c224。

> 我的缺点是啥 帮我算一下 老师讲的课 对我的帮助是啥 给我说一下

原文时间（UTC）：2026-09-07T16:27:20.000Z；任务：规划Day 1后续学习 (5)；thread：01a07cc6-14e6-7943-afd1-d01e724ed8bf；turn：01a07cb2-14fe-7f21-bb02-855c9d70c761。

当时在想什么（根据上下文归纳）：把课堂模型接入九维框架时，你主动质疑 AI 是否在缺乏依据的情况下给出分数。

补充分析（Codex，2026-09-21）：这条质疑比继续增加维度更有价值：分数必须能追溯到事实、规则和误差。多个模型看同一份不完整材料，可能一致地犯错；不同模型也不意味着统计独立。可先把每一项拆成事实证据、解释、评分规则与不确定性，再用历史结果评价。不能仅从这段对话给你个人能力打分，也不能把此前 AI 给出的系统成熟度百分比当成测量结果。

下一步：抽取少量历史样本做盲评，锁定评分规则后再揭晓结果；记录分数稳定性、错误类型和缺失证据，再决定是否扩大回测。

[课件依据：第 59–65、75 页](/api/emba/file/emba/2026-09/material/post-study-bams-7891c600d996.pdf)

### 两个模型同意，是核对，不是完整验证

> 116 验证了一次 咋样啊

原文时间（UTC）：2026-09-07T16:30:26.000Z；任务：规划Day 1后续学习 (5)；thread：01a07cc6-14e6-7943-afd1-d01e724ed8bf；turn：01a07cb4-ea2a-7ba2-8231-243ddef75acb。

当时在想什么（根据上下文归纳）：你看到第 116 页 Maersk 的 Scorecard 与 Merton 对照，问“验证了一次”效果如何。

补充分析（Codex，2026-09-21）：第 116 页展示两个模型在 Maersk 上结论接近，却有更新频率和危机时点反应的差异。一个公司上的一致性是交叉核对，不能证明总体准确率。完整验证要覆盖困境与非困境公司，考察区分能力、概率校准和提前量；如果目标标签不同，还应先说明两者到底在比较什么。模型出现分歧时，先查数据时点、账面与市场口径、债务定义，再解释差异。

下一步：给 PDC 加一张验证表：样本外时间段、基准、真实结果、误报、漏报和各分数段的实际发生率。

[课件依据：第 116 页](/api/emba/file/emba/2026-09/material/post-study-bams-7891c600d996.pdf)

### 恒大与 BYD：先有可复算输入，再谈 PD

> 帮我用我的老师的方式 算一下中国的某一个公司 恒大集团吧 给我看看pd

原文时间（UTC）：2026-09-07T16:31:48.000Z；任务：规划Day 1后续学习 (5)；thread：01a07cc6-14e6-7943-afd1-d01e724ed8bf；turn：01a07cb6-2b40-75b0-b2be-f76e8deaf6b2。

> 恒大是从啥时候看出来已经高危 了啊

原文时间（UTC）：2026-09-07T16:47:02.000Z；任务：规划Day 1后续学习 (5)；thread：01a07cc6-14e6-7943-afd1-d01e724ed8bf；turn：01a07cc4-1d62-7010-a4c8-bc6fbb65798e。

> 135页这个可以帮我算一下byd和恒大吗

原文时间（UTC）：2026-09-07T16:49:26.000Z；任务：规划Day 1后续学习 (5)；thread：01a07cc6-14e6-7943-afd1-d01e724ed8bf；turn：01a07cc6-4ed7-7161-bc74-3d90b7925ebc。

当时在想什么（根据上下文归纳）：你想把老师的方法迁移到中国公司，接着追问高危信号出现的时间，以及第 135 页图形的应用。

补充分析（Codex，2026-09-21）：这一步从理解走向应用，但要先区分两个问题：Merton 信用风险模型与第 135 页的期权薪酬收益不对称图。后者不是 PD 计算器。复算某公司某日的模型结果，需要同日市值、股权波动率、债务门槛、期限及明确的模型假设；不能直接把股权波动率当成资产波动率，也不能把市场定价概率与真实世界违约频率混为一谈。此前讨论中的示意参数或假设概率尚无完整输入证据，不能作为恒大或 BYD 的实测结果归档。

下一步：保留这个案例任务；先选定历史观察日并建立有来源的输入表。画图时标“教学情景”或“历史数据估计”，再与当时公开信息及后续结果分开比较。

[课件依据：第 100–106、135 页](/api/emba/file/emba/2026-09/material/post-study-bams-7891c600d996.pdf)

### 把兴趣变成研究问题：向老师追问 paper

> 我找了老师 回头我要给他发邮件让他介绍我他的paper

原文时间（UTC）：2026-09-07T15:59:15.000Z；任务：规划Day 1后续学习 (5)；thread：01a07cc6-14e6-7943-afd1-d01e724ed8bf；turn：01a07c98-5d68-77f3-9077-a440bef0f23d。

当时在想什么（根据上下文归纳）：你说已经找了老师，希望之后通过邮件了解他的 paper；9 月 8 日又继续修改介绍自己模型的邮件草稿。

补充分析（Codex，2026-09-21）：这段记录说明你的问题已从“公式怎么用”走向“研究是怎么做出来的”。目前尚未核实具体论文题目，因此不把课堂 Scorecard 自动归属于某篇 paper。与 Dennis Bams 讨论时，可以聚焦目标标签、样本筛选、时间外验证和可迁移性，这比泛泛询问模型好不好更容易获得有效反馈。

下一步：保存待问问题：课堂模型对应哪篇研究？权益转负与法律违约如何区分？如何检验新行业、新市场和新时期的适用性？这里仅归档，未发送邮件。

[课件依据：第 59–65 页](/api/emba/file/emba/2026-09/material/post-study-bams-7891c600d996.pdf)




## 历史整理稿

以下为此前助理参与整理的知识回顾，不作为逐字个人原话。

- [周一课堂知识回顾 · 历史整理稿](/emba/content/2026/09_September/course-notes/day1-review-historical.md)
- [周一学习路径 · 历史思考整理稿](/emba/content/2026/09_September/course-notes/day1-reflection-historical.md)
