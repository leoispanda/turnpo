# Day 1｜Financial Management：从“项目有价值”到“公司有能力实现价值”

> **Monday 7 September｜08:30–19:00**
>
> 指定阅读：[Berk, DeMarzo & Harford](../readings/summaries/berk-demarzo-harford-2025-reading-roadmap.md) → [Stulz (1996)](../readings/summaries/stulz-1996-rethinking-risk-management.md) → [Nocco & Stulz (2006)](../readings/summaries/nocco-stulz-2006-erm-theory-practice.md)

## 今天只解决一个问题

> **当一个投资项目看起来能够创造价值时，公司应该如何融资、管理风险，并确保自己在坏情境下仍有能力把价值实现出来？**

这是 Day 1 的唯一主线。三份阅读不是三个独立知识点：

- **Berk** 回答：项目和公司价值怎样被识别、计算与解释？
- **Stulz** 回答：如果股东可以自己分散风险，公司为什么还需要 risk management？
- **Nocco & Stulz** 回答：如何把一次对冲判断升级为董事会、CRO 和业务共同运行的 ERM system？

把整天内容记成一条因果链即可：

> **Incremental cash flow → present value → financing need → risk exposure → cash shortfall → underinvestment → risk response → investment capacity**

学完后，你不只要会说“项目 NPV 为正”，还要能够完成一个更高级的判断：

> The project creates value in the base case, but the company should proceed only with a financing and risk design that preserves its ability to invest under adverse conditions.

---

## 第一章｜先建立价值：Berk 提供的是一套决策语言

### 1. 从 accounting profit 切换到 incremental cash flow

企业不是因为某项投资“看起来盈利”就获得价值。第一步要问：**如果接受这个决定，哪些未来现金流会因此改变？**

这就是 **incremental cash flow** /ˌɪnkrəˈmentl kæʃ fləʊ/，即“因这项决定而新增或减少的现金流”。

分析时要剔除：

- 已经发生、无论是否投资都无法收回的 **sunk cost**；
- 本来就会发生、与决定无关的共同成本；
- 只改变会计分类但不改变现金流的项目。

同时要加入：

- 被项目占用的土地、设备或管理时间的 **opportunity cost**；
- 项目挤压现有产品销售形成的 cannibalization；
- working capital、tax、maintenance capex 和结束项目时的回收现金流。

高级学习者的判断标准不是“我会列现金流”，而是能解释：**为什么这笔现金流只有在接受项目时才存在。**

### 2. 把不同时间的现金流放到同一个价值时点

今天的一欧元与五年后的一欧元不可直接相加，因为今天的资金可以投资，未来现金流也带有不确定性。Berk 的 time value of money 内容要求你先画 timeline，再进行 discounting。

最小公式是：

> **NPV = − Initial investment + Σ [Incremental FCFₜ ÷ (1 + r)ᵗ]**

其中：

- **net present value (NPV)** /net ˈprezənt ˈvæljuː/：所有增量现金流折现后的净价值；
- **discount rate** /ˈdɪskaʊnt reɪt/：承担同等风险的投资者要求的回报；
- `t`：现金流发生的时间，而不是财务报表列示的顺序。

关键不是记住公式，而是避免三个常见错误：

1. 用贷款利率直接折现所有项目现金流；
2. 将 nominal cash flow 与 real discount rate 混用；
3. 在现金流里扣除 financing cost 后，又通过 discount rate 重复计算融资影响。

**NPV > 0** 表示：在给定现金流和风险假设下，项目预计创造超过资本机会成本的价值。但它不是让管理层停止思考的按钮，因为 base-case forecast 可能尚未充分纳入融资限制、tail scenario 和 real options。

### 3. 从项目价值走到债券、股票与公司价值

Berk 的指定范围并不只讲 project valuation，还要求理解 Bonds、Stock Valuation 和 Stock Valuation: A Second Look。它们都建立在同一原则上：**金融资产价值等于投资者未来可获得现金流的现值。**

- **Bond** 是对 coupon 和 principal 的合约性请求权；市场利率上升时，既有固定现金流的 present value 通常下降。
- **Equity** 是扣除其他请求权后对剩余现金流和增长机会的请求权；其价值取决于未来 cash generation，而不是过去利润。
- **Enterprise value** 是经营资产未来 free cash flows 的价值；从 enterprise value 调整 debt、cash 等项目后，才能连接到 equity value。
- **Comparable multiples** 可以作为估值 sanity check，但同行的 growth、risk、accounting policy 和 capital intensity 不同，不能把平均倍数当作事实。

这一步建立一个重要连接：一个投资项目的 NPV，会通过改变未来 free cash flow 影响 enterprise value；但如果项目迫使公司在坏时点出售资产、紧急融资或放弃其他好项目，最初的价值估计就可能过度乐观。

### 4. 长期有价值，不等于短期活得下来

Chapter 20 的 Short-Term Financial Planning 要求你同时看 **价值** 与 **流动性**。

一个项目可以长期 NPV 为正，却在第二年造成现金余额低于经营所需底线。此时公司可能需要：

- 以很高成本紧急融资；
- 违反债务 **covenant** /ˈkʌvənənt/；
- 延迟供应商付款或削减必要维护；
- 放弃另一个后来出现、价值更高的项目。

因此，完成 valuation 后必须再做 cash forecast：什么时候出现资金缺口？缺口是 temporary、seasonal，还是 business model 本身造成的 structural gap？可用融资的 maturity 与项目 cash generation 是否匹配？

### 5. 不确定性不只需要更高折现率，也可能需要 flexibility

Chapter 21 的 Option Applications 把管理者的选择权放回估值：面对高度不确定的项目，公司可以 delay、stage、expand、contract、switch 或 abandon。

例如，公司不必今天一次投入 EUR 80m；可以先投入 EUR 25m 验证需求，再在订单、汇率和 liquidity 达到 threshold 时追加资本。这种 flexibility 可能有价值，因为 downside 被限制，而 upside 仍然保留。

到这里，Berk 留下了 Day 1 的第一个关键问题：

> 如果一个项目 NPV 为正，但汇率、利率或商品价格变化可能让公司在最需要资金时发生 cash shortfall，公司是否应该对冲？

这正是 Stulz 的起点。

---

## 第二章｜为什么公司需要管理风险：Stulz 解释价值机制

### 1. 先理解一个表面矛盾

如果股东持有 diversified portfolio，他们可以自行分散公司特有风险。公司花钱降低波动，为什么会创造价值？

Stulz 的回答不是“股东不喜欢风险”，而是：现实市场存在 financing frictions。严重 downside 可能让公司内部现金不足，而外部融资又昂贵或无法及时获得，于是公司被迫放弃正 NPV 项目。这就是 **underinvestment** /ˌʌndərɪnˈvestmənt/。

风险管理创造价值的因果链是：

> Exposure → severe cash-flow loss → financing constraint → cancelled positive-NPV investment → lost long-term value

所以真正需要保护的不是季度利润的平滑，而是 **investment capacity**：企业在坏情境下仍有能力执行好战略的能力。

### 2. 风险管理不等于消除所有风险

企业通过承担风险获得回报。若一家汽车企业不愿承担产品创新、品牌定位和市场需求风险，它也失去了竞争优势的来源。

更合理的区分是：

- **Core business risk**：企业有知识、能力或战略优势，必须主动承担并管理的风险；
- **Transferable / non-core risk**：企业没有预测优势，但可以通过市场工具、合同或保险低成本转移的风险。

例如，对制造商而言，设计新产品可能是 core risk；随机押注美元方向通常不是。分类并非永久不变：cyber capability 对普通制造商可能是需要降低/转移的风险，对 cybersecurity company 却可能属于核心能力。

### 3. Hedging 与 speculation 的边界

**Exposure** /ɪkˈspəʊʒə(r)/ 是企业价值或现金流对某个风险因子的敏感程度。**Hedging** /ˈhedʒɪŋ/ 是降低已识别 exposure；**speculation** /ˌspekjuˈleɪʃn/ 则是因为市场方向观点而主动增加风险。

判断一个交易是 hedge 还是 speculation，不看它使用了什么工具，而看它相对哪个 exposure 和 policy benchmark：

- 公司有 USD receivable，卖出 USD forward，通常是在降低 exposure；
- 公司因为预测美元会升值而故意少对冲，已经加入 market view；
- 公司没有真实 USD exposure 却买入大量美元衍生品，则是在创造新风险。

“这次押对了”不能证明 decision quality 高。选择性对冲必须有 mandate、limit、benchmark 和 risk-adjusted performance evaluation，否则 treasury 的好运会被误认为能力。

### 4. 对冲决策的五步规则

面对“要不要 hedge”，依次回答：

1. **Identify exposure**：什么变量会通过什么机制影响 cash flow 或 covenant？
2. **Find the value threshold**：坏到什么程度会影响融资或迫使公司放弃好项目？
3. **Classify the risk**：公司对承担该风险是否有 comparative advantage？
4. **Compare responses**：accept、reduce、hedge、insure、contract、stage 或 abandon 各自成本是什么？
5. **Define residual risk**：采取措施后仍剩什么风险，由谁监控，何时复核？

这里的 **tail risk** /teɪl rɪsk/ 不是“发生概率低，所以不用管”，而是低概率但足以破坏战略执行能力的结果。

Stulz 又留下第二个问题：即使 CFO 正确决定了 hedge ratio，如何确保不同业务单元不会各自优化、合起来却让公司承担过多集中风险？

这就是 Nocco & Stulz 的起点。

---

## 第三章｜从一次对冲升级为 ERM：Nocco & Stulz 建立组织系统

### 1. ERM 不只是“所有风险放进一个表”

Enterprise Risk Management 的价值在于把 risk-return trade-off 嵌入 strategy、capital allocation 和 daily decisions。它不追求每项风险最小，而是让企业整体风险组合与价值创造目标一致。

两个层面必须同时存在：

- **Macro level**：公司保持足够资本、流动性和市场信任，避免重大 shortfall 破坏战略；
- **Micro level**：每个 business decision 都考虑它对企业整体风险的边际贡献，而不是只看本部门利润。

### 2. Risk appetite 要进入真实决定

**Risk appetite** /rɪsk ˈæpətaɪt/ 是企业为了实现战略愿意承担的风险范围。它不是“low / medium / high”的装饰性标签，而应转化为可以改变决定的 boundaries，例如：

- minimum liquidity buffer；
- maximum cash-flow-at-risk；
- net debt / EBITDA covenant headroom；
- maximum single-customer or single-currency concentration；
- stop-investment trigger。

如果指标越界后没有明确行动，risk appetite 就没有进入 management system。

### 3. 风险所有权不能全部交给 CRO

董事会、CRO 和业务负责人承担不同责任：

- **Board / senior management**：决定战略、risk appetite 和不可接受的 enterprise outcomes；
- **CRO / risk function**：建立共同语言、aggregate exposures、challenge assumptions，并报告组合风险；
- **Business owner**：在产品、定价、采购、投资和运营决定中真正拥有风险及应对结果。

CRO 可以提供 framework，但不能替业务部门作每一个 risk-return decision。否则业务可能把风险当成“风险部门的问题”，风险信息也无法进入资源配置。

### 4. Portfolio view 改变单个项目的评价

三个单独看都“可接受”的项目，可能同时依赖美元走强、低利率或同一个 cloud provider。单独审批会忽略 concentration 和 correlation。

ERM 因此追问：

- 新项目增加的是公司已经高度集中的 exposure，还是带来 diversification？
- stress scenario 下哪些风险会同时发生？
- 某业务的高 accounting return 是否只是因为占用了大量 enterprise risk capacity？
- 风险被转移后，释放的 capital capacity 应配置给哪个更有优势的项目？

这就是 **risk-adjusted capital allocation**：不是只奖励收益最高的项目，而是比较它创造的价值与占用的整体风险能力。

### 5. 把 ERM 变成一个循环

一个可运行的 ERM decision loop 可以写成：

1. 明确战略目标与 value driver；
2. 识别决定产生的 exposures 和 dependencies；
3. 评估 base、downside、tail scenarios 对 cash、covenant 和投资能力的影响；
4. 比较 risk response 的成本、收益和 residual risk；
5. 指定 owner、metric、limit、escalation 和 review date；
6. 将结果放回 enterprise portfolio 和 capital allocation 重新判断。

注意它是循环：新信息、事故或战略变化出现后，原决定必须可以重新打开。

---

## 第四章｜用一个贯穿案例完成整天学习

### 案例｜欧洲制造商的美国扩产

一家欧洲精密设备公司考虑投资 **EUR 80m** 在美国扩产。成本主要以 EUR 支付，未来收入主要为 USD。

- Base-case project NPV：**+EUR 14m**；
- 前两年为负 free cash flow；
- USD 贬值 15% 时，项目 NPV 仍略为正，但公司 liquidity buffer 会跌破 EUR 15m；
- 债务 covenant 要求 net debt / EBITDA 不超过 3.5×；
- 100% hedge 预计成本 EUR 1.8m，但第三至第五年收入尚未全部签约；
- 公司可以用 EUR 3m 获得一年后再决定是否扩大第二条产线的 option。

不要立即回答“投”或“不投”。沿整天的逻辑完成六步。

### Step 1｜Value：项目是否创造价值？

Base-case NPV 为正，只能说明在当前 cash-flow 与 discount-rate assumptions 下预计创造价值。先检查 incremental revenue、working capital、tax、capex、terminal assumptions，以及 USD cash flows 是否与所用 discount rate 一致。

### Step 2｜Capacity：什么会使价值无法实现？

真正的风险不是“USD 下降导致利润不好看”，而是 liquidity buffer 跌破底线、covenant headroom 消失，继而造成高成本融资或其他投资被取消。

因此关键 threshold 可以是：

> If forecast liquidity falls below EUR 15m or covenant headroom falls below 0.3×, the investment must be resized, delayed or re-approved.

### Step 3｜Risk classification：什么该承担，什么该转移？

- 产品需求、客户采用和生产 execution 是公司需要承担的 core business risks；
- 对美元方向的裸露押注不是制造商的比较优势，可被视为 transferable financial risk；
- 但未签约的远期销售量本身也不确定，100% hedge 可能造成 over-hedging。

### Step 4｜Risk response：不是“全对冲或不对冲”二选一

一个较成熟的方案是：

- 对已签约或高确定性的 USD cash flows 使用较高 hedge ratio；
- 对 forecast revenue 采用分层、随订单确认提高的 hedge programme；
- 保留 expansion option，不在第一天承诺全部资本；
- 通过 local sourcing、pricing clauses 或 matching USD debt 形成 operational/natural hedge；
- 明确 hedge cost 和剩余 volume、basis、counterparty risk。

### Step 5｜ERM：谁负责、看什么、何时改变决定？

- Business owner 负责 demand、margin 与 execution assumptions；
- Treasury 负责 currency exposure、hedge execution 与 counterparty limits；
- CFO 负责 liquidity、financing 和 capital allocation；
- Board / investment committee 批准 appetite、重大例外和 stop threshold；
- CRO 汇总项目与公司其他 USD、customer 和 financing exposures。

每月 dashboard 不需要几十个指标，只需能改变决定的少数变量：committed orders、USD exposure、project cash burn、liquidity buffer、covenant headroom 和 expansion-gate evidence。

### Step 6｜Recommendation：形成一个完整判断

> Proceed with the base investment, but stage the expansion and hedge the portion of USD cash flows that is sufficiently committed. The objective is not to eliminate currency volatility; it is to preserve liquidity and covenant headroom so that the firm can continue funding positive-NPV opportunities. Re-approval is required if forecast liquidity falls below EUR 15m, covenant headroom falls below 0.3×, or committed demand fails to reach the expansion gate.

这段 recommendation 同时包含 value、risk rationale、response、residual uncertainty 和 threshold，所以不是一般性的“加强风险管理”。

---

## 掌握度阶梯｜不是看完，而是能够迁移

### Level 1｜Explain：能用自己的话讲清楚

不看页面，用两分钟解释：

- 为什么 accounting profit 不等于 value；
- 为什么 positive NPV 项目仍可能造成管理问题；
- 为什么 diversified shareholders 不能替代 corporate risk management；
- 为什么 ERM 不等于降低所有风险。

### Level 2｜Calculate：能完成最小计算

给定 initial investment、三年 incremental free cash flows 和 discount rate，能够画 timeline 并计算 NPV；然后增加一个 downside scenario，检查最低 cash balance 和 covenant headroom。不要只重新算 NPV。

### Level 3｜Diagnose：能找出真正的价值破坏机制

看到“汇率波动很大”时，不停在 volatility。继续追问：它通过 revenue、margin、cash、debt service 还是 covenant 影响公司？什么结果会造成 underinvestment？

### Level 4｜Decide：能作出可执行、可复核的建议

Recommendation 必须包含：

> **Decision + value logic + risk classification + response + owner + threshold + residual risk**

### Level 5｜Challenge：能指出自己可能错在哪里

写出三个可能推翻建议的证据：例如订单并不 committed、hedge cost 被低估、USD debt 增加了 refinancing risk、不同项目存在相同 currency concentration。高级学习不是表现得确定，而是知道结论依赖什么。

---

## 语言工具｜只保留会进入课堂发言的词

- **incremental cash flow** /ˌɪnkrəˈmentl kæʃ fləʊ/：因决定而改变的现金流。
- **net present value** /net ˈprezənt ˈvæljuː/：风险匹配折现后的净价值。
- **opportunity cost of capital** /ˌɒpəˈtjuːnəti kɒst əv ˈkæpɪtl/：同等风险资本的替代回报。
- **exposure** /ɪkˈspəʊʒə(r)/：企业价值或现金流对风险因子的敏感度。
- **hedging** /ˈhedʒɪŋ/：降低既有 exposure，而非预测市场方向。
- **underinvestment** /ˌʌndərɪnˈvestmənt/：因资金受限而放弃本可创造价值的投资。
- **tail risk** /teɪl rɪsk/：概率较低但足以破坏战略执行能力的风险。
- **risk appetite** /rɪsk ˈæpətaɪt/：为了实现战略愿意承担的风险范围。
- **covenant headroom** /ˈkʌvənənt ˈhedruːm/：距离触发债务限制还剩的缓冲。
- **residual risk** /rɪˈzɪdʒuəl rɪsk/：采取应对后仍由企业承担的风险。

建议不要孤立背诵。每个词都用美国扩产案例造一句话。例如：

> The hedge reduces currency exposure, but volume risk remains as a residual risk.

---

## 最终学习产出｜一页 memo 足以检验整天知识

选择一家你熟悉的公司和一项真实投资，用不超过 300 字完成：

1. 这项投资如何创造价值，最关键的 incremental cash flows 是什么；
2. 一个公司应主动承担的 core risk；
3. 一个可以 hedge、insure 或 contractually transfer 的 non-core risk；
4. 哪一种 downside 会威胁 liquidity、covenant 或未来投资能力；
5. 推荐的 response、owner、cost、residual risk 与 measurable threshold；
6. 一条可能推翻你建议的新证据。

必须保留这句话，并用你的案例补完整：

> **The purpose of risk management is to protect the firm's ability to create value, not to eliminate all risk.**

## 完成 Day 1 的真正标准

如果你能够在一个陌生公司案例中，从 cash flows 开始，识别 financing constraint，区分 core 与 transferable risk，设计 hedge/staging/insurance 等组合方案，并把它转化为 ERM owner 和 threshold，那么 Day 1 才算真正掌握。

如果你只能分别解释 NPV、hedging 和 ERM，却不能说明三者之间的因果关系，就仍然处在“记住了碎片”而不是“形成了知识结构”的阶段。
