# Day 1｜Financial Management

> **Monday 7 September｜08:30–19:00**
>
> 今天的核心问题：**当一个项目看起来能够创造价值时，公司如何融资、管理风险，并确保自己在坏情境下仍有能力把价值实现出来？**

## 第一部分｜今天讲什么

### 今天只解决一个管理决定

假设一家公司发现了一个看起来很赚钱的新项目。今天要解决的不是“NPV 是什么”“对冲是什么”这类彼此分开的知识点，而是一个完整决定：**这个项目是否真的创造价值，公司有没有能力把它做完，又应该怎样避免可转移的金融风险毁掉这个好项目？**

你会依次完成五步判断。第一步确认项目真正改变了哪些现金流；第二步理解投资者如何给风险定价，以及债务或股权会带来什么融资条件；第三步检查项目早期是否会造成现金短缺，使公司无法坚持到项目开始赚钱；第四步只处理那些可能破坏投资能力、又可以低成本转移的金融风险；第五步把项目放回公司全部投资中，检查多个好项目合在一起是否仍然安全。

学完后，你应该能够把上述判断讲成一段连续的管理逻辑，而不是分别背诵几个金融术语。

### Syllabus 范围｜今天只学 Financial Management

以下内容直接来自 Syllabus 的 Financial Management component-specific learning outcomes。Day 1 必须围绕它们展开：

1. 理解企业在实践中如何作出 **investment decisions（投资决定）** 与 **financing decisions（融资决定）**；
2. 分析投资与融资如何相互影响；
3. 理解 **financial markets（金融市场）** 与 **investor expectations（投资者预期）** 的作用；
4. 应用 discounting、risk-return trade-off 与 diversification；
5. 了解 financial risk management 与 derivatives 的当代应用。

Monday 的指定阅读只有三项：Berk 指定章节、Stulz (1996)、Nocco & Stulz (2006)。因此，今天出现的核心结论必须能够回到这三项材料或上述五个 outcomes。

### 今日边界｜避免与 Day 2–4 重叠

| 今天必须掌握 | 今天只作桥接 | 留到后续课程深入 |
|---|---|---|
| 投资、融资、现金流、discounting、financial markets、risk-return、diversification、derivatives、financial risk management | Nocco & Stulz 如何把金融风险管理连接到企业整体价值和 capital allocation | **Day 2**：Compliance、VW/ING、sustainability/ESRS；**Day 3**：Financial Accounting、COSO ERM、风险分类、risk appetite、governance 与 risk framework；**Day 4**：management accounting、performance control、innovation control 与 purpose |

Nocco & Stulz 虽然标题包含 ERM，但它是 Monday 的指定阅读。Day 1 只要求理解它的 financial-management message：企业要从整体风险组合保护融资能力，并把风险—回报放入资本配置。COSO components、完整 governance structure 和 ERM implementation 留到 Wednesday。

### 知识地图｜只负责导航，不要求现在回答

先看五个区域及其顺序，暂时不背结论：

| 区域 | 今天会学什么 | 对应 Syllabus outcome |
|---|---|---|
| **A. Investment value** | incremental cash flow、time value of money、NPV、valuation | 投资决定、discounting |
| **B. Markets & financing** | investor expectations、risk-return、diversification、bond/equity financing | 金融市场；融资与投资互动 |
| **C. Liquidity & flexibility** | short-term planning、covenant、real options | 融资选择如何影响投资 |
| **D. Financial risk management** | exposure、derivatives、hedging、core/non-core risk | risk management、derivatives |
| **E. Enterprise bridge** | investment capacity、macro/micro ERM、portfolio effect | Nocco & Stulz 对整体价值的连接 |

学习顺序是 A → B → C → D → E。第一部分负责把这条主线讲清楚；第二部分再告诉你每一段逻辑来自哪一篇指定阅读。

### 第一步｜先判断项目是否创造价值

第一步不是看 accounting profit（会计利润），而是找 **incremental cash flow（增量现金流）**：与“不做这个项目”相比，哪些现金流因为接受项目才发生变化。

需要排除：

- sunk cost（沉没成本）：已经发生且无法收回的成本；
- 与决定无关的共同成本；
- 只改变会计呈现、没有改变现金的项目。

需要加入：

- opportunity cost（机会成本）；
- cannibalization（新产品蚕食旧产品销售）；
- working capital（营运资本）；
- tax（税）与 capex（资本性支出）；
- 项目结束时的回收现金流。

然后使用 time value of money（资金时间价值）把不同时间的现金流放到同一个价值时点：

> **NPV = − Initial investment + Σ [Incremental FCFₜ ÷ (1 + r)ᵗ]**

NPV > 0 表示：在当前现金流和折现率假设下，项目预计创造超过资本机会成本的价值。但它只是判断起点，因为 base case（基准情境）可能没有充分反映融资限制、tail scenario（尾部情境）和 managerial flexibility（管理灵活性）。

### 第二步｜理解金融市场如何给风险定价

Syllabus 明确要求理解 financial markets 和 investor expectations。金融市场的作用不只是“买卖股票”，而是把不同投资者对未来 cash flow、risk 和 required return 的判断反映到 securities prices 与 financing terms 中。

这形成三项连接：

1. **Investor expectations → opportunity cost of capital**：投资者对同等风险要求多少回报，会影响项目 discount rate；
2. **Financing choice → future commitments**：债务形成 coupon、principal 和 covenant，股权则分享 residual cash flow 与 control；
3. **Financing capacity → investment choice**：融资成本、到期结构与财务弹性会决定企业能否启动或继续投资。

Risk-return trade-off（风险—回报权衡）不是“风险越大，实际回报一定越高”，而是投资者通常会对无法轻易消除的风险要求更高 expected return。Expected return 是要求或预期，不是保证结果。

Diversification（分散化）通过把不完全同步变化的资产放在一起，降低 company-specific / idiosyncratic risk（公司特有风险）。它不能自动消除影响整个市场的 systematic risk（系统性风险）。这个区别也会引出 Stulz 的问题：既然股东可以自行分散公司特有风险，公司为什么还需要管理风险？

今天对金融市场的掌握标准是：能说明 investor expectations 如何进入 discount rate，bond/equity financing 如何改变现金承诺，以及 diversification 能消除什么、不能消除什么。

### 第三步｜判断公司能否坚持到项目创造现金的那一天

长期 NPV 为正，不代表短期不会出现 liquidity problem（流动性问题）。项目早期现金流为负时，公司可能：

- 需要昂贵的 external financing（外部融资）；
- 违反债务 covenant（契约条款）；
- 被迫削减其他必要投资；
- 放弃后来出现的正 NPV 项目。

所以 valuation（估值）之后还要检查：

- 最低 cash balance（现金余额）；
- liquidity buffer（流动性缓冲）；
- covenant headroom（契约余量）；
- 债务 maturity（到期时间）是否与项目 cash generation（现金创造时间）匹配；
- 缺口是 temporary（暂时性）还是 structural（结构性）。

如果不确定性很高，公司也不一定只能“立刻全部投资”或“完全不投资”。它可以 delay（延迟）、stage（分阶段）、expand（扩张）、contract（收缩）、switch（转换）或 abandon（退出）。这些选择构成 real options（实物期权）。

### 第四步｜只管理可能破坏投资能力的金融风险

如果股东可以自行分散投资，公司为什么还要花钱管理风险？Stulz 的关键回答是：现实世界存在 financing frictions（融资摩擦）。

风险管理创造价值的路径是：

> **风险敞口 → 严重现金损失 → 融资受限 → 放弃好项目 → 长期价值损失**

因此，风险管理的目标不是让利润曲线最平滑，而是避免 downside（下行情境）和 tail risk（尾部风险）破坏公司的 investment capacity（投资能力）。

企业还要区分：

- **Core business risk（核心经营风险）**：企业依靠知识、能力和战略优势承担并获得回报的风险；
- **Transferable / non-core risk（可转移／非核心风险）**：企业没有特别优势，但可通过市场工具、保险或合同转移的风险。

Derivative（衍生品）是价值取决于某项 underlying variable（标的变量）的合同。企业常见的金融风险管理工具包括 forward（远期）、future（期货）、option（期权）和 swap（互换）。Day 1 不要求完成复杂定价，但必须理解：工具只是重塑 exposure 的方法，是否创造价值取决于它保护了什么 cash-flow threshold 和 investment capacity。

Hedging（对冲）是降低已经存在的 exposure（敞口）；speculation（投机）则是因为市场方向判断而主动增加风险。一个交易是否属于对冲，取决于它相对什么 exposure 和 policy benchmark，而不是取决于它用了哪一种金融工具。

### 第五步｜把单个项目放回公司整体风险组合

Nocco & Stulz 进一步说明：即使 CFO 正确决定了某个 hedge ratio（对冲比例），不同部门仍可能各自优化、合起来却让公司承担过多集中风险。

今天只学习它与 Financial Management 直接相关的两层价值：

- **Macro level（公司整体层面）**：保护资本、流动性、信用和战略执行能力；
- **Micro level（业务决定层面）**：让项目评价同时考虑 expected return 与它对公司整体 exposure、financing capacity 和 capital allocation 的影响。

Day 1 需要知道 portfolio effect（组合效应）：多个项目可能共同依赖 USD、利率或同一客户，单独看都合理，合起来却形成 concentration。详细的 risk appetite、CRO/board governance、risk categories、COSO framework 与 implementation 不在今天展开，它们属于 Day 3。

## 第二部分｜指定阅读：原文、框架及概述

三份阅读必须按这个顺序理解：

> **Berk：价值怎样形成 → Stulz：风险管理为什么创造价值 → Nocco & Stulz：怎样把判断变成企业系统**

### 阅读一｜Berk, DeMarzo & Harford (2025)

#### 原文与状态

- 指定教材：*Fundamentals of Corporate Finance*, 6th Global Edition。
- ISBN 9781292470047；eISBN 9781292738048。
- **原文待补**：目前没有本地教材全文，需要从 Maastricht University Library、Canvas 或 Pearson 获取。
- [打开现有指定章节学习包](../readings/summaries/berk-demarzo-harford-2025-reading-roadmap.md)
- [Pearson 版本页面](https://www.pearson.com/en-gb/subject-catalog/p/fundamentals-of-corporate-finance-global-edition/P200000012454/9781292470030)

#### Syllabus 指定范围

- Ch. 1：只读 §§1.3–1.5；
- Ch. 3：只读 §§3.3–3.4；
- Ch. 4；
- Ch. 6：只读 §§6.1–6.2；
- Ch. 7：只读 §7.1；
- Chs. 10、20、21。

这些是 preparatory reading 的精确范围；Monday 课堂的 component outcomes 还明确包括 financial markets、investor expectations、risk-return、diversification 和 derivatives。它们可能横跨教师讲授与三篇阅读，不能因为某个关键词没有出现在章节标题里就从 Day 1 删除。

#### 阅读框架

1. **Decision owner**：financial manager 在企业中为哪些投资、融资和现金决定负责？
2. **Cash-flow valuation**：如何识别增量现金流并进行 discounting？
3. **Markets & expectations**：investor expectations 如何进入 required return、security prices 和 financing terms？
4. **Risk-return & diversification**：分散化能降低什么风险，不能消除什么风险？
5. **Financial claims**：bond、equity 与 enterprise value 如何连接？
6. **Short-term survival**：长期价值与短期 liquidity 如何同时判断？
7. **Flexibility & derivatives**：real options 保留什么选择权，financial derivatives 如何重塑 exposure？

#### 内容概述

Berk 提供的是 Day 1 的基础语言。企业价值来自未来现金流，不来自单纯的会计利润；不同时间的现金流必须经过折现才能比较；债券和股票只是对未来现金流拥有不同优先级的 claims；项目估值还必须与短期资金规划相连，因为公司可能在长期价值出现前就发生 liquidity shortfall。Option Applications 则提醒管理者，不确定性不只通过更高折现率处理，也可以通过分阶段投资和保留选择权来管理。

#### 必懂词汇

| 词汇 | 音标 | 白话解释 |
|---|---|---|
| **increment** | /ˈɪŋkrəmənt/ | 名词：一次增加量；复数为 increments。 |
| **incremental** | /ˌɪŋkrəˈmentl/ | 形容词：增量的，即因为决定才新增或减少的。 |
| **incrementally** | /ˌɪŋkrəˈmentəli/ | 副词：逐步地、小幅增加地。 |
| **incremental cash flow** | /ˌɪŋkrəˈmentl kæʃ fləʊ/ | 与不做项目相比，真正改变的现金流。 |
| **accounting profit** | /əˈkaʊntɪŋ ˈprɒfɪt/ | 会计利润；不等于实际现金变化。 |
| **sunk cost** | /ˌsʌŋk ˈkɒst/ | 已发生且无法收回，不应影响下一步决定。 |
| **opportunity cost** | /ˌɒpəˈtjuːnəti kɒst/ | 使用资源时放弃的最佳替代价值。 |
| **cannibalization** | /ˌkænɪbəlaɪˈzeɪʃn/ | 新产品抢走旧产品销售。 |
| **working capital** | /ˈwɜːkɪŋ ˌkæpɪtl/ | 库存、应收、应付等经营资金占用。 |
| **capex** | /ˈkæpeks/ | 资本性支出，如厂房与设备投资。 |
| **present value** | /ˈpreznt ˈvæljuː/ | 未来现金流折算到今天的价值。 |
| **discount rate** | /ˈdɪskaʊnt reɪt/ | 同等风险资本要求的回报率。 |
| **net present value** | /net ˈpreznt ˈvæljuː/ | 增量现金流现值减去初始投资。 |
| **free cash flow** | /friː kæʃ fləʊ/ | 经营与必要投资后可供资本提供者分配的现金。 |
| **bond** | /bɒnd/ | 债券。 |
| **coupon** | /ˈkuːpɒn/ | 债券定期支付的票息。 |
| **principal** | /ˈprɪnsəpl/ | 本金；注意不是 principle（原则）。 |
| **claim** | /kleɪm/ | 对现金流的合同或所有权请求权。 |
| **equity** | /ˈekwəti/ | 扣除债务后归属于股东的权益。 |
| **debt** | /det/ | 债务，字母 b 不发音。 |
| **enterprise value** | /ˈentəpraɪz ˌvæljuː/ | 公司经营资产整体产生未来现金流的价值。 |
| **valuation multiple** | /ˌvæljuˈeɪʃn ˈmʌltɪpl/ | 价值相对于利润、销售等指标的倍数。 |
| **liquidity** | /lɪˈkwɪdəti/ | 及时取得现金、履行到期义务的能力。 |
| **covenant** | /ˈkʌvənənt/ | 债务协议中的限制条款。 |
| **maturity** | /məˈtʃʊərəti/ | 债务到期时间。 |
| **real option** | /ˌriːəl ˈɒpʃn/ | 延迟、扩张、收缩或退出真实项目的选择权。 |
| **base case** | /beɪs keɪs/ | 当前认为最合理的基准情境，不代表确定结果。 |
| **forecast** | /ˈfɔːkɑːst/ | 对未来数字的预测。 |
| **assumption** | /əˈsʌmpʃn/ | 分析暂时接受、但需要验证的前提。 |
| **financial market** | /faɪˈnænʃl ˈmɑːkɪt/ | 资金提供者与需求者交易 financial claims 的市场。 |
| **investor expectation** | /ɪnˈvestə ˌekspekˈteɪʃn/ | 投资者对未来 cash flow、risk 与 return 的判断。 |
| **security** | /sɪˈkjʊərəti/ | 可交易的金融权利，如股票或债券；这里不是“安全”的意思。 |
| **required return** | /rɪˈkwaɪəd rɪˈtɜːn/ | 投资者承担某种风险所要求的最低预期回报。 |
| **expected return** | /ɪkˈspektɪd rɪˈtɜːn/ | 根据概率和情境估计的预期回报，不是保证收益。 |
| **risk-return trade-off** | /rɪsk rɪˈtɜːn ˈtreɪd ɒf/ | 风险与要求回报之间的权衡。 |
| **diversification** | /daɪˌvɜːsɪfɪˈkeɪʃn/ | 通过组合不完全同步变化的资产降低集中风险。 |
| **idiosyncratic risk** | /ˌɪdiəsɪŋˈkrætɪk rɪsk/ | 公司特有风险，可通过充分分散显著降低。 |
| **systematic risk** | /ˌsɪstəˈmætɪk rɪsk/ | 影响整个市场的共同风险，不能靠普通分散完全消除。 |
| **derivative** | /dɪˈrɪvətɪv/ | 价值取决于另一项标的变量的金融合同。 |
| **underlying variable** | /ˌʌndəˈlaɪɪŋ ˈveəriəbl/ | 决定衍生品价值的标的变量，如汇率、利率或商品价格。 |
| **forward** | /ˈfɔːwəd/ | 远期合同；约定未来按固定条件交易。 |
| **future** | /ˈfjuːtʃə/ | 期货；标准化并通常在交易所交易的未来合同。 |
| **option** | /ˈɒpʃn/ | 期权；给予权利而非义务，在条件满足时交易。 |
| **swap** | /swɒp/ | 互换；双方交换不同现金流，如固定与浮动利息。 |

#### 这篇阅读在今天的作用

Berk 为今天的前半段提供基础。它先教你辨认项目真正改变的现金流，再用折现判断这些现金流今天值多少钱；随后解释债务、股权和短期资金安排为什么会影响项目能否完成。读完这一部分，你应该形成一个清楚的认识：**正 NPV 只说明项目在给定假设下可能创造价值，并不保证公司一定有足够现金把价值实现出来。**

### 阅读二｜Stulz (1996), “Rethinking Risk Management”

#### 原文与状态

- **原文已有**：[打开 Stulz (1996) PDF](../readings/Rethinking-Risk-Management-1cnhar7.pdf)
- [打开中文学习卡](../readings/summaries/stulz-1996-rethinking-risk-management.md)
- 正式引用：*Journal of Applied Corporate Finance*, 9(3), 8–24。

#### 阅读框架

1. **The puzzle**：股东能自己分散风险，公司为何还需要风险管理？
2. **The value mechanism**：风险怎样通过 financing constraint 和 underinvestment 破坏价值？
3. **Risk selection**：公司应承担哪些 core risks、转移哪些 non-core risks？
4. **Hedge governance**：怎样区分 hedging 与 speculation？
5. **Decision threshold**：什么损失会真正威胁投资能力？

#### 内容概述

Stulz 不把风险管理理解为“降低所有波动”。如果 downside loss 让公司内部资金不足，而外部融资昂贵或不可得，公司可能被迫放弃本来具有正 NPV 的投资。风险管理因此可以通过保护 investment capacity 创造价值。公司应保留自己具有比较优势的经营风险，并低成本转移没有优势承担的金融风险。选择性对冲如果根据市场观点改变 hedge ratio，就可能从 risk reduction 变成 active market bet，必须接受 mandate、benchmark、limit 和风险调整后的绩效评价。

#### 必懂词汇

| 词汇 | 音标 | 白话解释 |
|---|---|---|
| **risk exposure** | /rɪsk ɪkˈspəʊʒə/ | 某变量变化会让现金流或价值改变多少。 |
| **downside** | /ˈdaʊnsaɪd/ | 结果比预期差的一面。 |
| **tail risk** | /teɪl rɪsk/ | 概率低但破坏性很大的结果。 |
| **diversified portfolio** | /daɪˈvɜːsɪfaɪd pɔːtˈfəʊliəʊ/ | 通过多种资产分散单一风险的投资组合。 |
| **financing friction** | /ˈfaɪnænsɪŋ ˈfrɪkʃn/ | 外部资金不是随时、无成本获得的现实限制。 |
| **financing constraint** | /ˈfaɪnænsɪŋ kənˈstreɪnt/ | 无法以合理条件获得所需资金。 |
| **underinvestment** | /ˌʌndərɪnˈvestmənt/ | 因资金不足而放弃能创造价值的投资。 |
| **investment capacity** | /ɪnˈvestmənt kəˈpæsəti/ | 公司继续为好项目投入资金的能力。 |
| **core risk** | /kɔː rɪsk/ | 与竞争优势和价值创造直接相关的风险。 |
| **non-core risk** | /ˌnɒn ˈkɔː rɪsk/ | 公司没有特别优势承担的风险。 |
| **transferable risk** | /trænsˈfɜːrəbl rɪsk/ | 可通过保险、合同或市场工具转移的风险。 |
| **comparative advantage** | /kəmˈpærətɪv ədˈvɑːntɪdʒ/ | 相对于市场更有能力理解或承担某种风险。 |
| **hedge / hedging** | /hedʒ/；/ˈhedʒɪŋ/ | 降低已有风险敞口。 |
| **speculation** | /ˌspekjuˈleɪʃn/ | 根据方向判断主动增加市场风险。 |
| **hedge ratio** | /hedʒ ˈreɪʃiəʊ/ | 被对冲的 exposure 占总 exposure 的比例。 |
| **benchmark** | /ˈbentʃmɑːk/ | 比较策略或绩效的参考基准。 |
| **mandate** | /ˈmændeɪt/ | 一个岗位或团队被允许采取行动的范围。 |
| **risk limit** | /rɪsk ˈlɪmɪt/ | 不允许超过的暴露或损失边界。 |
| **residual risk** | /rɪˈzɪdʒuəl rɪsk/ | 采取应对以后仍由公司承担的风险。 |
| **natural hedge** | /ˈnætʃrəl hedʒ/ | 通过收入、成本或债务币种匹配降低风险。 |
| **counterparty risk** | /ˈkaʊntəpɑːti rɪsk/ | 合同另一方不能履约的风险。 |

#### 这篇阅读在今天的作用

Stulz 接在 Berk 之后，解释为什么一个原本有价值的项目仍可能因为风险而失败。关键不在于公司是否出现波动，而在于坏情境是否会造成严重现金损失，使外部融资变得昂贵或无法取得，最终迫使公司放弃好项目。因此，风险管理的价值来自保护公司继续投资的能力，而不是让每一期利润都保持平稳。

### 阅读三｜Nocco & Stulz (2006), “Enterprise Risk Management: Theory and Practice”

#### 原文与状态

- **正式 journal version 已有**：[打开 Nocco & Stulz (2006) PDF](../readings/Nocco-Stulz-2006-Enterprise-Risk-Management-Journal.pdf)
- [打开中文学习卡](../readings/summaries/nocco-stulz-2006-erm-theory-practice.md)
- 另有 author-hosted accessible version：`184_nocco-u7sc9u.pdf`。

#### 阅读框架

1. **Macro ERM**：怎样保护公司整体资本、融资和战略执行能力？
2. **Micro ERM**：怎样让业务经理在每个决定中考虑风险？
3. **Portfolio view**：多个单独看来合理的项目，合起来是否依赖同一种风险？
4. **Capital allocation**：公司的现金和融资能力有限时，应该优先支持哪些项目？

#### 内容概述

Nocco & Stulz 把视角从“某一个风险是否需要对冲”提高到“公司所有项目合在一起是否仍然安全”。宏观层面，企业要保护整体资本和融资能力；微观层面，每个项目除了看自己的回报，还要说明它会占用多少公司整体的风险承受能力。多个部门可能分别作出合理决定，却共同依赖同一个货币、客户或供应商。Portfolio view 的作用，就是发现这种单项目分析看不到的集中风险，并帮助公司把有限资本优先配置给最值得承担的风险。

**Day 1 的停止点**：理解 enterprise view 为什么改善 financing capacity 与 capital allocation，即可。Risk appetite 的正式设计、风险类别、COSO components、board/CRO governance 和 ERM implementation 将在 Day 3 结合 COSO、Grant Thornton、Deloitte 与 DSM 深入学习；今天不提前替代那一课。

#### 词汇｜Day 1 必须掌握

| 词汇 | 音标 | 白话解释 |
|---|---|---|
| **enterprise risk management** | /ˈentəpraɪz rɪsk ˈmænɪdʒmənt/ | 将风险—回报判断嵌入战略和经营决定。 |
| **macro level** | /ˈmækrəʊ ˈlevl/ | 从公司整体资本与风险组合看问题。 |
| **micro level** | /ˈmaɪkrəʊ ˈlevl/ | 从单个业务或项目决定看问题。 |
| **risk capacity** | /rɪsk kəˈpæsəti/ | 企业客观上最多能承受多少风险。 |
| **portfolio view** | /pɔːtˈfəʊliəʊ vjuː/ | 把不同风险放在公司整体一起观察。 |
| **concentration** | /ˌkɒnsnˈtreɪʃn/ | 风险过度依赖同一客户、货币或供应商。 |
| **correlation** | /ˌkɒrəˈleɪʃn/ | 多项风险是否容易同时变化。 |
| **capital allocation** | /ˈkæpɪtl ˌæləˈkeɪʃn/ | 决定有限资本投入哪些业务或项目。 |
| **risk-adjusted capital** | /rɪsk əˈdʒʌstɪd ˈkæpɪtl/ | 根据风险大小调整后用于评价或配置的资本。 |
| **liquidity buffer** | /lɪˈkwɪdəti ˈbʌfə/ | 为意外情况保留的现金或融资额度。 |
| **covenant headroom** | /ˈkʌvənənt ˈhedruːm/ | 距离违反债务条款还剩多少空间。 |

Risk appetite、risk ownership、CRO、limits 和完整 governance framework 虽然在文章中出现，但属于 Day 3 的重点。Day 1 先不展开，避免把“金融管理为什么创造价值”与“风险治理体系怎样落地”混成一课。

#### 这篇阅读在今天的作用

Nocco & Stulz 完成今天的最后一步：一个项目不能只证明自己 NPV 为正，还要说明它是否与其他项目共同依赖同一种风险，以及它会占用多少公司的现金、借款能力和风险承受空间。这就是从单项目估值进入企业整体资本配置，但今天不延伸到 Day 3 的 COSO 和治理设计。

### 最后把三篇阅读连成一条主线

三篇阅读不是三个平行主题。Berk 先帮助公司判断项目是否创造价值，并看清完成项目需要多少资金；Stulz 接着解释，某些金融风险为什么会通过现金短缺和融资困难，使公司失去完成好项目的能力；Nocco & Stulz 最后提醒，管理层还要把这个项目放回公司全部项目中，检查共同风险和有限资本应该如何分配。

因此，Day 1 最重要的逻辑只有一句话：**先确认价值，再确认公司能否为价值持续提供资金；随后管理那些会破坏这种能力的风险，最后检查单个好决定放到公司整体以后是否仍然合理。**

### 跨文章证据地图｜每个结论应该回到哪里

| 你要写的结论 | 首要资料 | 资料状态 | 不能犯的错误 |
|---|---|---|---|
| 项目现金流、折现、债券/股票估值、短期资金规划、real options | Berk 指定章节 | 原书待补；现有 study guide | 不要把学习卡当作教材原文引用。 |
| 为什么公司风险管理能够创造价值 | Stulz (1996) | 原文 PDF 已有 | 不要只写“降低波动”，要写融资约束与投资不足。 |
| 为什么应保留 core risk、转移 non-core risk | Stulz (1996) | 原文 PDF 已有 | 不要把风险类别视为永久标签，要结合企业能力。 |
| Enterprise view 的 macro/micro benefits | Nocco & Stulz (2006) | Journal PDF 已有；Day 1 bridge | 今天聚焦 financing capacity 与 value，不提前替代 Day 3 COSO。 |
| Portfolio view 与 risk-adjusted capital allocation | Nocco & Stulz (2006) | Journal PDF 已有；Day 1 bridge | 不要只看单项风险，要检查 concentration 与 correlation。 |

这张表的目的，是防止 AI 把看似合理但来源不清的内容混入答案。正式作业中，每个关键判断都应能回到具体 reading、case fact 或额外可靠资料。
