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

中文意思是：

> **增量现金流 → 现值 → 融资需求 → 风险敞口 → 现金缺口 → 投资不足 → 风险应对 → 投资能力**

### 本页的英语辅助规则

你不需要离开页面查词。重要术语第一次出现时会直接给中文解释；页面后部的“Day 1 全量重点词汇表”按知识链收录词形、音标和白话含义。遇到不认识的词时，先继续理解句子的因果关系，再回到词汇表确认，不把学习主线切断。

学完后，你不只要会说“项目 NPV 为正”，还要能够完成一个更高级的判断：

> The project creates value in the base case, but the company should proceed only with a financing and risk design that preserves its ability to invest under adverse conditions.

---

## 第一章｜先建立价值：Berk 提供的是一套决策语言

### 1. 从 accounting profit（会计利润）切换到 incremental cash flow（增量现金流）

企业不是因为某项投资“看起来盈利”就获得价值。第一步要问：**如果接受这个决定，哪些未来现金流会因此改变？**

这就是 **incremental cash flow** /ˌɪnkrəˈmentl kæʃ fləʊ/，即“因这项决定而新增或减少的现金流”。

分析时要剔除：

- 已经发生、无论是否投资都无法收回的 **sunk cost（沉没成本）**；
- 本来就会发生、与决定无关的共同成本；
- 只改变会计分类但不改变现金流的项目。

同时要加入：

- 被项目占用的土地、设备或管理时间的 **opportunity cost（机会成本）**；
- 项目挤压现有产品销售形成的 **cannibalization（内部蚕食）**；
- **working capital（营运资本）**、tax（税）、maintenance capex（维护性资本开支）和结束项目时的回收现金流。

高级学习者的判断标准不是“我会列现金流”，而是能解释：**为什么这笔现金流只有在接受项目时才存在。**

### 2. 把不同时间的现金流放到同一个价值时点

今天的一欧元与五年后的一欧元不可直接相加，因为今天的资金可以投资，未来现金流也带有不确定性。Berk 的 **time value of money（资金时间价值）** 内容要求你先画 timeline（时间线），再进行 discounting（折现）。

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

**NPV > 0** 表示：在给定现金流和风险假设下，项目预计创造超过资本机会成本的价值。但它不是让管理层停止思考的按钮，因为 **base-case forecast（基准情境预测）** 可能尚未充分纳入融资限制、tail scenario（尾部情境）和 real options（实物期权）。

### 3. 从项目价值走到债券、股票与公司价值

Berk 的指定范围并不只讲 project valuation，还要求理解 Bonds、Stock Valuation 和 Stock Valuation: A Second Look。它们都建立在同一原则上：**金融资产价值等于投资者未来可获得现金流的现值。**

- **Bond（债券）** 是对 coupon（票息）和 principal（本金）的合约性请求权；市场利率上升时，既有固定现金流的 present value（现值）通常下降。
- **Equity（股权）** 是扣除其他请求权后对剩余现金流和增长机会的请求权；其价值取决于未来 cash generation（现金创造能力），而不是过去利润。
- **Enterprise value（企业价值）** 是经营资产未来 free cash flows（自由现金流）的价值；从 enterprise value 调整 debt（债务）、cash（现金）等项目后，才能连接到 equity value（股权价值）。
- **Comparable multiples（可比公司估值倍数）** 可以作为估值 sanity check（合理性检查），但同行的 growth（增长）、risk、accounting policy（会计政策）和 capital intensity（资本密集度）不同，不能把平均倍数当作事实。

这一步建立一个重要连接：一个投资项目的 NPV，会通过改变未来 free cash flow 影响 enterprise value；但如果项目迫使公司在坏时点出售资产、紧急融资或放弃其他好项目，最初的价值估计就可能过度乐观。

### 4. 长期有价值，不等于短期活得下来

Chapter 20 的 **Short-Term Financial Planning（短期财务规划）** 要求你同时看 **价值** 与 **liquidity（流动性）**。

一个项目可以长期 NPV 为正，却在第二年造成现金余额低于经营所需底线。此时公司可能需要：

- 以很高成本紧急融资；
- 违反债务 **covenant** /ˈkʌvənənt/；
- 延迟供应商付款或削减必要维护；
- 放弃另一个后来出现、价值更高的项目。

因此，完成 valuation（估值）后必须再做 cash forecast（现金预测）：什么时候出现资金缺口？缺口是 temporary（暂时性）、seasonal（季节性），还是 business model 本身造成的 structural gap（结构性缺口）？可用融资的 maturity（到期期限）与项目 cash generation 是否匹配？

### 5. 不确定性不只需要更高折现率，也可能需要 flexibility

Chapter 21 的 **Option Applications（期权应用）** 把管理者的选择权放回估值：面对高度不确定的项目，公司可以 delay（延迟）、stage（分阶段）、expand（扩张）、contract（收缩）、switch（转换）或 abandon（退出）。

例如，公司不必今天一次投入 EUR 80m；可以先投入 EUR 25m 验证需求，再在订单、汇率和 liquidity 达到 threshold 时追加资本。这种 flexibility 可能有价值，因为 downside 被限制，而 upside 仍然保留。

到这里，Berk 留下了 Day 1 的第一个关键问题：

> 如果一个项目 NPV 为正，但汇率、利率或商品价格变化可能让公司在最需要资金时发生 cash shortfall，公司是否应该对冲？

这正是 Stulz 的起点。

---

## 第二章｜为什么公司需要管理风险：Stulz 解释价值机制

### 1. 先理解一个表面矛盾

如果股东持有 **diversified portfolio（分散化投资组合）**，他们可以自行分散公司特有风险。公司花钱降低波动，为什么会创造价值？

Stulz 的回答不是“股东不喜欢风险”，而是：现实市场存在 **financing frictions（融资摩擦）**。严重 downside（下行情境）可能让公司内部现金不足，而 external financing（外部融资）又昂贵或无法及时获得，于是公司被迫放弃正 NPV 项目。这就是 **underinvestment（投资不足）** /ˌʌndərɪnˈvestmənt/。

风险管理创造价值的因果链是：

> Exposure → severe cash-flow loss → financing constraint → cancelled positive-NPV investment → lost long-term value

所以真正需要保护的不是季度利润的平滑，而是 **investment capacity（投资能力）**：企业在坏情境下仍有能力执行好战略的能力。

### 2. 风险管理不等于消除所有风险

企业通过承担风险获得回报。若一家汽车企业不愿承担产品创新、品牌定位和市场需求风险，它也失去了竞争优势的来源。

更合理的区分是：

- **Core business risk（核心经营风险）**：企业有知识、能力或战略优势，必须主动承担并管理的风险；
- **Transferable / non-core risk（可转移／非核心风险）**：企业没有预测优势，但可以通过市场工具、合同或保险低成本转移的风险。

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

**Enterprise Risk Management, ERM（企业风险管理）** 的价值在于把 risk-return trade-off（风险—回报权衡）嵌入 strategy（战略）、capital allocation（资本配置）和 daily decisions（日常决策）。它不追求每项风险最小，而是让企业整体风险组合与价值创造目标一致。

两个层面必须同时存在：

- **Macro level**：公司保持足够资本、流动性和市场信任，避免重大 shortfall 破坏战略；
- **Micro level**：每个 business decision 都考虑它对企业整体风险的边际贡献，而不是只看本部门利润。

### 2. Risk appetite（风险偏好）要进入真实决定

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

### 4. Portfolio view（组合视角）改变单个项目的评价

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

## Day 1 全量重点词汇表｜不用离开页面搜索

这不是额外需要背诵的 Session，而是随时回看的语言支持层。先掌握“这个词在决策中做什么”，再记发音。

### 先解决你提到的 increment

| 词形 | 音标 | 最简单的意思 |
|---|---|---|
| **increment** | /ˈɪŋkrəmənt/ | 名词：一次增加量、增量。复数是 **increments**。例如 revenue increases in small increments，收入小幅逐次增加。 |
| **incremental** | /ˌɪŋkrəˈmentl/ | 形容词：增量的，即“因为这个决定才新增或减少的”。 |
| **incrementally** | /ˌɪŋkrəˈmentəli/ | 副词：逐步地、小幅增加地。 |
| **incremental cash flow** | /ˌɪŋkrəˈmentl kæʃ fləʊ/ | 增量现金流：接受项目与不接受项目相比，真正发生变化的现金流。 |

记忆方式：**increment 是“增加量”这个东西；incremental 描述“与增加量有关”；incremental cash flow 是财务分析对象。**

### A｜价值与现金流

| 术语 | 音标 | 白话解释 |
|---|---|---|
| **accounting profit** | /əˈkaʊntɪŋ ˈprɒfɪt/ | 会计利润；受收入确认、折旧等规则影响，不等于实际现金变化。 |
| **cash flow** | /ˈkæʃ fləʊ/ | 现金流；真实流入或流出公司的现金。 |
| **sunk cost** | /ˌsʌŋk ˈkɒst/ | 沉没成本；已经发生且无法收回，不应影响下一步选择。 |
| **opportunity cost** | /ˌɒpəˈtjuːnəti kɒst/ | 机会成本；把资源用于本项目时，放弃的最佳替代价值。 |
| **cannibalization** | /ˌkænɪbəlaɪˈzeɪʃn/ | 内部蚕食；新产品抢走公司原有产品的销售。 |
| **working capital** | /ˈwɜːkɪŋ ˌkæpɪtl/ | 营运资本；库存、应收、应付等日常经营占用或释放的资金。 |
| **tax** | /tæks/ | 税；项目现金流必须考虑真实税后影响。 |
| **capex** | /ˈkæpeks/ | Capital expenditure 的缩写，资本性支出，如购买设备或建厂。 |
| **time value of money** | /taɪm ˈvæljuː əv ˈmʌni/ | 资金时间价值；今天的一欧元通常比未来的一欧元更值钱。 |
| **timeline** | /ˈtaɪmlaɪn/ | 时间线；标出每笔现金流在第几年发生。 |
| **discounting** | /ˈdɪskaʊntɪŋ/ | 折现；把未来现金流转换成今天的价值。 |
| **present value** | /ˈpreznt ˈvæljuː/ | 现值；未来现金流折算到今天值多少。 |
| **future value** | /ˈfjuːtʃə ˈvæljuː/ | 终值／未来值；今天的钱增长到未来值多少。 |
| **discount rate** | /ˈdɪskaʊnt reɪt/ | 折现率；同等风险资本要求的回报率。 |
| **nominal** | /ˈnɒmɪnl/ | 名义的；包含通胀影响的金额或利率。 |
| **real** | /ˈriːəl/ | 实际的；剔除通胀影响后的金额或利率。 |
| **net present value, NPV** | /net ˈpreznt ˈvæljuː/ | 净现值；未来增量现金流现值减去初始投资。 |
| **free cash flow, FCF** | /friː kæʃ fləʊ/ | 自由现金流；经营和必要投资后，可供资本提供者分配的现金。 |
| **initial investment** | /ɪˈnɪʃl ɪnˈvestmənt/ | 初始投资；项目开始时投入的现金。 |
| **base case** | /beɪs keɪs/ | 基准情境；管理层当前认为最合理的一组假设，不代表一定发生。 |
| **forecast** | /ˈfɔːkɑːst/ | 预测；根据假设估计未来数字。 |
| **assumption** | /əˈsʌmpʃn/ | 假设；分析暂时接受、但需要验证的前提。 |
| **scenario** | /səˈnɑːriəʊ/ | 情境；一组可能同时发生的未来条件。 |
| **terminal assumption** | /ˈtɜːmɪnl əˈsʌmpʃn/ | 终值假设；预测期结束后增长或价值怎样延续。 |

### B｜融资、估值与灵活性

| 术语 | 音标 | 白话解释 |
|---|---|---|
| **financing** | /ˈfaɪnænsɪŋ/ | 融资；公司取得资金的安排。 |
| **financing need** | /ˈfaɪnænsɪŋ niːd/ | 融资需求；内部现金不够时需要筹集的金额。 |
| **financing cost** | /ˈfaɪnænsɪŋ kɒst/ | 融资成本；取得债务或股权资金付出的代价。 |
| **bond** | /bɒnd/ | 债券；公司承诺按条件支付利息和本金的融资工具。 |
| **coupon** | /ˈkuːpɒn/ | 票息；债券定期支付的利息。 |
| **principal** | /ˈprɪnsəpl/ | 本金；债券到期需要偿还的原始金额。注意不是 principle（原则）。 |
| **claim** | /kleɪm/ | 请求权；投资者依据合同或所有权对现金流拥有的权利。 |
| **equity** | /ˈekwəti/ | 股权；扣除债务等请求权后属于股东的剩余权益。 |
| **debt** | /det/ | 债务；注意字母 b 不发音。 |
| **enterprise value** | /ˈentəpraɪz ˌvæljuː/ | 企业价值；公司经营资产整体产生未来现金流的价值。 |
| **equity value** | /ˈekwəti ˌvæljuː/ | 股权价值；归属于普通股东的价值。 |
| **valuation** | /ˌvæljuˈeɪʃn/ | 估值；判断资产、项目或公司值多少。 |
| **comparable firm** | /ˈkɒmpərəbl fɜːm/ | 可比公司；业务和风险相近、可用于比较估值的公司。 |
| **valuation multiple** | /ˌvæljuˈeɪʃn ˈmʌltɪpl/ | 估值倍数；企业价值或股价相对于利润、销售等指标的倍数。 |
| **sanity check** | /ˈsænəti tʃek/ | 合理性检查；快速检查结果是否明显不合常理。 |
| **growth** | /ɡrəʊθ/ | 增长；收入、现金流或规模上升，不一定自动创造价值。 |
| **accounting policy** | /əˈkaʊntɪŋ ˈpɒləsi/ | 会计政策；公司确认和计量报表项目采用的规则。 |
| **capital intensity** | /ˈkæpɪtl ɪnˈtensəti/ | 资本密集度；创造收入需要投入多少厂房、设备等资本。 |
| **liquidity** | /lɪˈkwɪdəti/ | 流动性；公司能否及时获得现金支付到期义务。 |
| **liquidity buffer** | /lɪˈkwɪdəti ˈbʌfə/ | 流动性缓冲；为了应付意外保留的现金或可用额度。 |
| **cash shortfall** | /kæʃ ˈʃɔːtfɔːl/ | 现金缺口；可用现金低于需要支付的金额。 |
| **covenant** | /ˈkʌvənənt/ | 债务契约条款；贷款人要求企业遵守的财务或行为限制。 |
| **covenant headroom** | /ˈkʌvənənt ˈhedruːm/ | 契约余量；距离违反债务条款还剩多少缓冲。 |
| **maturity** | /məˈtʃʊərəti/ | 到期期限；债务需要偿还的时间。 |
| **cash generation** | /kæʃ ˌdʒenəˈreɪʃn/ | 现金创造能力；业务把经营活动转化为现金的能力。 |
| **structural gap** | /ˈstrʌktʃərəl ɡæp/ | 结构性缺口；不是暂时问题，而是业务模式长期形成的资金缺口。 |
| **flexibility** | /ˌfleksəˈbɪləti/ | 灵活性；新信息出现后调整决定的能力。 |
| **real option** | /ˌriːəl ˈɒpʃn/ | 实物期权；对真实项目延迟、扩张、收缩或退出的选择权。 |
| **delay** | /dɪˈleɪ/ | 延迟；等待更多信息后再投资。 |
| **stage** | /steɪdʒ/ | 分阶段投入；达到证据门槛后才释放下一笔资本。 |
| **expand** | /ɪkˈspænd/ | 扩张；好情境出现时增加投资或产能。 |
| **contract** | /kənˈtrækt/ | 收缩；减少规模。作名词“合同”时重音不同：/ˈkɒntrækt/。 |
| **switch** | /swɪtʃ/ | 转换；改变技术、投入品、市场或运营方式。 |
| **abandon** | /əˈbændən/ | 放弃／退出；停止项目并尽可能回收价值。 |

### C｜风险、对冲与 Stulz

| 术语 | 音标 | 白话解释 |
|---|---|---|
| **risk exposure** | /rɪsk ɪkˈspəʊʒə/ | 风险敞口；某个变量变化会让公司现金流或价值改变多少。 |
| **downside** | /ˈdaʊnsaɪd/ | 下行风险；结果比预期差的一面。 |
| **tail risk** | /teɪl rɪsk/ | 尾部风险；概率较低但破坏性很大的结果。 |
| **diversified portfolio** | /daɪˈvɜːsɪfaɪd pɔːtˈfəʊliəʊ/ | 分散化投资组合；持有多种资产以减少单一风险影响。 |
| **financing friction** | /ˈfaɪnænsɪŋ ˈfrɪkʃn/ | 融资摩擦；外部资金不是随时、无成本获得的现实限制。 |
| **external financing** | /ɪkˈstɜːnl ˈfaɪnænsɪŋ/ | 外部融资；从银行、债券或新股等企业外部取得资金。 |
| **financing constraint** | /ˈfaɪnænsɪŋ kənˈstreɪnt/ | 融资约束；公司无法以合理条件获得所需资金。 |
| **underinvestment** | /ˌʌndərɪnˈvestmənt/ | 投资不足；因资金受限而放弃本来能创造价值的项目。 |
| **investment capacity** | /ɪnˈvestmənt kəˈpæsəti/ | 投资能力；公司在不同情境下继续为好项目提供资金的能力。 |
| **core business risk** | /kɔː ˈbɪznəs rɪsk/ | 核心经营风险；与竞争优势和价值创造直接相关、必须承担的风险。 |
| **non-core risk** | /ˌnɒn ˈkɔː rɪsk/ | 非核心风险；公司没有特别优势承担的风险。 |
| **transferable risk** | /trænsˈfɜːrəbl rɪsk/ | 可转移风险；可以通过保险、合同或市场工具交给其他方的风险。 |
| **comparative advantage** | /kəmˈpærətɪv ədˈvɑːntɪdʒ/ | 比较优势；公司相对于市场更有能力理解或承担某类风险。 |
| **hedge / hedging** | /hedʒ/；/ˈhedʒɪŋ/ | 对冲；降低已有风险敞口，不是猜测市场方向。 |
| **speculation** | /ˌspekjuˈleɪʃn/ | 投机；基于方向判断主动增加市场风险。 |
| **benchmark** | /ˈbentʃmɑːk/ | 基准；用来比较策略或业绩的参考标准。 |
| **mandate** | /ˈmændeɪt/ | 授权范围；一个岗位或团队被允许做什么。 |
| **risk limit** | /rɪsk ˈlɪmɪt/ | 风险限额；不允许超过的暴露或损失边界。 |
| **risk-adjusted performance** | /rɪsk əˈdʒʌstɪd pəˈfɔːməns/ | 风险调整后绩效；把获得回报时承担的风险也纳入评价。 |
| **residual risk** | /rɪˈzɪdʒuəl rɪsk/ | 剩余风险；采取应对措施后仍由公司承担的部分。 |
| **cash-flow-at-risk** | /kæʃ fləʊ ət rɪsk/ | 风险现金流；在给定置信度和期间内，现金流可能下降到什么程度。 |
| **natural hedge** | /ˈnætʃrəl hedʒ/ | 自然对冲；用收入、成本或债务币种匹配来降低风险，而非只用衍生品。 |
| **counterparty risk** | /ˈkaʊntəpɑːti rɪsk/ | 交易对手风险；合同另一方无法履约的风险。 |

### D｜ERM、治理与执行

| 术语 | 音标 | 白话解释 |
|---|---|---|
| **enterprise risk management, ERM** | /ˈentəpraɪz rɪsk ˈmænɪdʒmənt/ | 企业风险管理；把风险—回报判断嵌入战略、资本配置和经营决定。 |
| **macro level** | /ˈmækrəʊ ˈlevl/ | 宏观层面；从公司整体资本、流动性和风险组合看问题。 |
| **micro level** | /ˈmaɪkrəʊ ˈlevl/ | 微观层面；从单个业务或项目的具体决定看风险。 |
| **risk appetite** | /rɪsk ˈæpɪtaɪt/ | 风险偏好；企业为实现战略愿意承担的风险范围。 |
| **boundary** | /ˈbaʊndri/ | 边界；一旦触及就必须限制、升级或停止的界线。 |
| **threshold** | /ˈθreʃhəʊld/ | 阈值；达到某个数字后触发预先规定的行动。 |
| **risk owner** | /rɪsk ˈəʊnə/ | 风险负责人；对识别、应对和报告某项风险承担责任的人。 |
| **portfolio view** | /pɔːtˈfəʊliəʊ vjuː/ | 组合视角；把不同风险放在全公司一起看。 |
| **concentration** | /ˌkɒnsnˈtreɪʃn/ | 集中度；过多风险依赖同一客户、货币、地区或供应商。 |
| **correlation** | /ˌkɒrəˈleɪʃn/ | 相关性；多个风险是否容易同时向同一方向变化。 |
| **stress scenario** | /stres səˈnɑːriəʊ/ | 压力情境；用于检验公司在严重但合理坏情境下能否承受。 |
| **risk capacity** | /rɪsk kəˈpæsəti/ | 风险承受能力；公司客观上最多能承受多少风险而不失去生存或战略能力。 |
| **capital allocation** | /ˈkæpɪtl ˌæləˈkeɪʃn/ | 资本配置；决定有限资金投入哪些业务或项目。 |
| **risk-adjusted capital allocation** | /rɪsk əˈdʒʌstɪd ˈkæpɪtl ˌæləˈkeɪʃn/ | 风险调整资本配置；同时比较项目回报与占用的企业风险能力。 |
| **owner** | /ˈəʊnə/ | 负责人；不是“资产所有者”，而是对行动和结果负责的人。 |
| **metric** | /ˈmetrɪk/ | 衡量指标；用于观察结果或风险变化的数字。 |
| **escalation** | /ˌeskəˈleɪʃn/ | 升级报告；风险越界时把决定提交给更高权限处理。 |
| **review date** | /rɪˈvjuː deɪt/ | 复核日期；预先约定重新检查决定的时间。 |
| **committed order** | /kəˈmɪtɪd ˈɔːdə/ | 已承诺订单；客户已有较强合同义务的订单，不只是销售预测。 |
| **cash burn** | /kæʃ bɜːn/ | 现金消耗速度；项目或公司在一段时间内净花掉多少现金。 |
| **re-approval** | /ˌriː əˈpruːvl/ | 重新审批；条件改变或越界后，原决定必须再次获得批准。 |

### E｜课堂问题中常见的指令词

| 词 | 音标 | 老师真正要求你做什么 |
|---|---|---|
| **explain** | /ɪkˈspleɪn/ | 解释因果，不只是给定义。 |
| **calculate** | /ˈkælkjuleɪt/ | 用数据和公式计算，并说明结果含义。 |
| **assess** | /əˈses/ | 根据标准评价严重性或质量。 |
| **compare** | /kəmˈpeə/ | 指出共同点、差异及为什么差异重要。 |
| **diagnose** | /ˌdaɪəɡˈnəʊz/ | 找到表面现象背后的真正机制。 |
| **recommend** | /ˌrekəˈmend/ | 给出具体选择，并用证据和权衡支持。 |
| **justify** | /ˈdʒʌstɪfaɪ/ | 说明为什么这个选择比替代方案更合理。 |
| **challenge** | /ˈtʃælɪndʒ/ | 质疑假设，寻找可能推翻结论的证据。 |
| **implement** | /ˈɪmplɪment/ | 把建议转成 owner、步骤、资源、指标和时间。 |
| **preserve** | /prɪˈzɜːv/ | 保护并保留下来；如 preserve investment capacity。 |
| **proceed** | /prəˈsiːd/ | 继续执行决定；如 proceed with the investment。 |
| **trigger** | /ˈtrɪɡə/ | 触发；达到条件后自动引发某个行动。 |

词汇的最终检验不是“见过”，而是能放回句子：

> The hedge reduces **currency exposure（货币风险敞口）**, but **volume risk（销量风险）** remains as a **residual risk（剩余风险）**.

> If the **liquidity buffer（流动性缓冲）** falls below the **threshold（阈值）**, the project requires **re-approval（重新审批）**.

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
