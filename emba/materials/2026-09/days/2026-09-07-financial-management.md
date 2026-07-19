# Day 1｜Financial Management

> **Monday 7 September｜08:30–19:00**
>
> 今天的核心问题：**当一个项目看起来能够创造价值时，公司如何融资、管理风险，并确保自己在坏情境下仍有能力把价值实现出来？**

## 第一部分｜今天讲什么

### 今天最终要形成的能力

今天不是分别学习 NPV、hedging 和 ERM，而是要把它们连接成一个完整的管理判断：

> **增量现金流 → 现值 → 融资需求 → 风险敞口 → 现金缺口 → 投资不足 → 风险应对 → 投资能力**

对应的英文逻辑是：

> **Incremental cash flow → present value → financing need → risk exposure → cash shortfall → underinvestment → risk response → investment capacity**

学完以后，你应该能够对一个陌生公司说清楚：

1. 这项投资为什么创造价值，融资选择如何反过来影响投资；
2. 金融市场与 investor expectations 如何影响 required return、价格和融资条件；
3. risk-return trade-off 与 diversification 的作用和边界；
4. 什么坏情境会让公司无法实现项目价值；
5. 哪些金融风险应该承担，哪些可以通过 derivatives、保险或合同转移。

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

学习顺序是 A → B → C → D → E。完成细节学习后，再归纳核心模型和争议；现在只需要知道每个概念将放在哪里。

### 逻辑一｜先判断项目是否创造价值

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

### 逻辑二｜理解金融市场、投资者预期与 risk-return

Syllabus 明确要求理解 financial markets 和 investor expectations。金融市场的作用不只是“买卖股票”，而是把不同投资者对未来 cash flow、risk 和 required return 的判断反映到 securities prices 与 financing terms 中。

这形成三项连接：

1. **Investor expectations → opportunity cost of capital**：投资者对同等风险要求多少回报，会影响项目 discount rate；
2. **Financing choice → future commitments**：债务形成 coupon、principal 和 covenant，股权则分享 residual cash flow 与 control；
3. **Financing capacity → investment choice**：融资成本、到期结构与财务弹性会决定企业能否启动或继续投资。

Risk-return trade-off（风险—回报权衡）不是“风险越大，实际回报一定越高”，而是投资者通常会对无法轻易消除的风险要求更高 expected return。Expected return 是要求或预期，不是保证结果。

Diversification（分散化）通过把不完全同步变化的资产放在一起，降低 company-specific / idiosyncratic risk（公司特有风险）。它不能自动消除影响整个市场的 systematic risk（系统性风险）。这个区别也会引出 Stulz 的问题：既然股东可以自行分散公司特有风险，公司为什么还需要管理风险？

今天对金融市场的掌握标准是：能说明 investor expectations 如何进入 discount rate，bond/equity financing 如何改变现金承诺，以及 diversification 能消除什么、不能消除什么。

### 逻辑三｜再判断公司能否活到价值实现的那一天

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

### 逻辑四｜理解 financial risk management 与 derivatives

如果股东可以自行分散投资，公司为什么还要花钱管理风险？Stulz 的关键回答是：现实世界存在 financing frictions（融资摩擦）。

风险管理创造价值的路径是：

> **风险敞口 → 严重现金损失 → 融资受限 → 放弃好项目 → 长期价值损失**

因此，风险管理的目标不是让利润曲线最平滑，而是避免 downside（下行情境）和 tail risk（尾部风险）破坏公司的 investment capacity（投资能力）。

企业还要区分：

- **Core business risk（核心经营风险）**：企业依靠知识、能力和战略优势承担并获得回报的风险；
- **Transferable / non-core risk（可转移／非核心风险）**：企业没有特别优势，但可通过市场工具、保险或合同转移的风险。

Derivative（衍生品）是价值取决于某项 underlying variable（标的变量）的合同。企业常见的金融风险管理工具包括 forward（远期）、future（期货）、option（期权）和 swap（互换）。Day 1 不要求完成复杂定价，但必须理解：工具只是重塑 exposure 的方法，是否创造价值取决于它保护了什么 cash-flow threshold 和 investment capacity。

Hedging（对冲）是降低已经存在的 exposure（敞口）；speculation（投机）则是因为市场方向判断而主动增加风险。一个交易是否属于对冲，取决于它相对什么 exposure 和 policy benchmark，而不是取决于它用了哪一种金融工具。

### 逻辑五｜Nocco & Stulz 的 enterprise bridge

Nocco & Stulz 进一步说明：即使 CFO 正确决定了某个 hedge ratio（对冲比例），不同部门仍可能各自优化、合起来却让公司承担过多集中风险。

今天只学习它与 Financial Management 直接相关的两层价值：

- **Macro level（公司整体层面）**：保护资本、流动性、信用和战略执行能力；
- **Micro level（业务决定层面）**：让项目评价同时考虑 expected return 与它对公司整体 exposure、financing capacity 和 capital allocation 的影响。

Day 1 需要知道 portfolio effect（组合效应）：多个项目可能共同依赖 USD、利率或同一客户，单独看都合理，合起来却形成 concentration。详细的 risk appetite、CRO/board governance、risk categories、COSO framework 与 implementation 不在今天展开，它们属于 Day 3。

### 学完细节后再归纳｜五个稳定的核心模型

这里的“核心模型”不是需要背诵的英文口号，而是五种可以反复用于真实决策的思考方式。它们是根据 Day 1 的 syllabus 和三项指定阅读归纳出的课程共识，并不表示所有学者在任何情境下都完全同意。

#### 模型一｜一项投资是否创造价值，要看“做”与“不做”之间的未来现金流差异

管理层不能因为项目会增加销售额或会计利润，就直接认定它值得投资。正确的比较是：如果公司接受项目，未来会多收到哪些现金、必须多支付哪些现金；如果拒绝项目，这些现金流是否仍会发生。已经无法收回的市场调研费通常不应影响今天的决定，但项目占用的厂房、增加的库存、对旧产品销售的蚕食和最终可回收的设备价值都可能影响判断。把这些增量现金流折现后，才能判断项目是否真正创造价值。

**掌握标准：** 面对一个新项目，你能从销售额和利润叙述中筛出真正相关的现金流，并解释为什么 NPV 是决策起点，而不是一个自动批准项目的按钮。主要依据：Berk。

#### 模型二｜金融市场把投资者对风险的判断，转化为公司必须达到的回报要求

投资者愿意为一项资产支付多少价格，取决于他们对未来现金流、风险以及替代投资机会的判断。风险越难通过持有其他资产来分散，投资者通常要求的 expected return 越高，公司用于估值的 discount rate 也会受到影响。分散化可以降低单一公司特有事件对投资组合的冲击，却不能自动消除整个市场共同面对的利率、经济衰退等系统性风险，也不能为一家缺现金的公司补回现金。

**掌握标准：** 你能用自己的话说明 investor expectations 如何影响 required return、security price 和 financing terms，也能说明 diversification 有什么作用、边界在哪里。主要依据：Syllabus 与 Berk，并由 Stulz 引出企业层面的边界。

#### 模型三｜投资与融资不是两个先后独立的决定

一个项目即使长期 NPV 为正，也可能因为前两年大量消耗现金而无法顺利完成。债务会带来固定利息、还本期限和 covenant；股权不会要求固定还本，却可能带来所有权稀释和控制权变化。因此，融资方式会改变公司在坏情境下能否继续投资，而项目的现金流时间、风险和资产性质也会反过来影响公司能够获得什么融资。好的投资分析必须同时检查价值、现金缺口、债务期限和财务弹性。

**掌握标准：** 你能解释“有价值”为什么不等于“现在就能安全地全部投入”，并能比较债务、股权、分阶段投资和延迟投资对项目的不同影响。主要依据：Syllabus 与 Berk。

#### 模型四｜风险管理的目的，是保护公司继续创造价值的能力

公司不需要消除所有波动，也不应该把所有风险都转移出去。真正需要关注的是：某个坏情境是否会让现金余额跌破安全水平、触发 covenant、迫使公司以很高成本融资，或放弃原本具有正 NPV 的项目。如果答案是肯定的，hedging、保险、合同安排或 natural hedge 才可能创造价值。公司应优先管理自己没有竞争优势、却可能破坏投资能力的风险，而保留与产品、客户和能力建设直接相关的核心经营风险。

**掌握标准：** 你能从一个具体的现金流危险点出发，说明要保护什么、为什么保护、使用什么工具，以及保护到什么程度，而不是笼统地说“对冲可以降低风险”。主要依据：Stulz。

#### 模型五｜单个项目看起来合理，不代表所有项目合在一起仍然安全

不同部门可能各自批准了回报不错的项目，但这些项目也许同时依赖美元汇率、同一个大客户、相同供应商或同一条融资渠道。一旦共同风险发生，多个项目可能同时恶化，并一起占用公司的现金和借款能力。因此，公司既要看每个项目自身的 expected return，也要看它给企业整体增加了什么集中风险，以及是否挤压其他更重要的投资机会。

**掌握标准：** 你能把单个项目放回 company-wide portfolio 中，检查共同风险因子、集中度和对 financing capacity 的占用。主要依据：Nocco & Stulz。

### 学完细节后再讨论｜三个关键争议

这些争议不是让你在还没有基础知识时猜答案，而是用来检查你是否已经能够识别假设、比较两方逻辑，并根据公司的具体处境作出有条件的判断。

#### 争议一｜只要项目 NPV 为正，公司是否就应该立即全部投资？

这个问题看似简单：既然 NPV 大于零代表项目预计创造价值，推迟投资似乎只会错失机会。但这个结论建立在现金流预测、折现率和融资条件都足够可靠，而且公司能够承受早期现金流出的前提上。现实中，项目可能长期有价值，却在短期耗尽现金、触发 covenant，或者让公司失去应对新机会的能力。等待更多信息或分阶段投入虽然可能延迟收益，却也能限制损失并保留选择权。

**你真正要判断的是：** 项目本身是否创造价值；公司现在是否有能力承担它；延迟或分阶段带来的信息价值，是否超过等待成本。Day 1 的结论不是“正 NPV 就投”或“有风险就等”，而是把 valuation、liquidity、financing constraint 和 real option 放在同一个决定中。主要依据：Berk。

#### 争议二｜既然股东可以自己分散风险，公司为什么还要花钱对冲？

反对企业对冲的一方认为，股东可以通过持有许多公司的股票降低单一公司的风险，公司再花钱平滑利润，可能只是重复工作。支持企业对冲的一方则指出，股东能够分散自己的财富，却不能在公司现金不足时自动把钱送回公司。汇率、利率或商品价格的剧烈变化可能导致公司违反债务条件、支付高昂融资成本，甚至放弃好项目；这些损失不能靠股东的投资组合消除。

**你真正要判断的是：** 该风险是否会通过现金短缺或融资摩擦破坏公司的投资能力。如果会，对冲可能创造价值；如果只是让报表数字更平滑，对冲理由就不充分。对冲比例也不是越高越好：尚未确定的 forecast revenue 若被 100% 对冲，实际销量不足时反而会产生新的风险。主要依据：Stulz。

#### 争议三｜每个部门分别管好自己的风险，是否就等于公司整体风险已经管好？

分项管理有明显优势：外汇、利率和商品风险需要不同专业知识，业务部门也最了解自己的客户和经营条件。但局部最优不一定形成整体最优。三个部门可能各自认为自己的美元敞口可以承受，合在一起却让公司对美元形成巨大集中风险；两个正 NPV 项目也可能在同一坏情境下同时需要资金，超过企业的融资能力。

**你真正要判断的是：** 单项风险之间是否相关、是否共同占用稀缺资本，以及一个项目是否挤压了其他更有价值的选择。Day 1 的结论是保留专业化管理，同时用 enterprise portfolio view 检查合计影响；谁负责、如何设定 risk appetite 和完整 governance framework 留到 Day 3。主要依据：Nocco & Stulz。

### 一个案例把今天全部知识连起来

一家欧洲设备公司考虑投资 **EUR 80m** 在美国扩产：

- Base-case NPV：+EUR 14m；
- 前两年 free cash flow 为负；
- 收入主要为 USD，成本主要为 EUR；
- USD 贬值 15% 时，项目 NPV 仍略为正，但公司 liquidity buffer 会低于 EUR 15m；
- 债务 covenant 要求 net debt / EBITDA 不超过 3.5×；
- 100% hedge 需要 EUR 1.8m，但第三至第五年的销量尚未完全签约；
- 公司可支付 EUR 3m，保留一年后再决定是否扩建第二条产线的 option。

按照今天的四层逻辑分析：

#### 1. Value

项目 base-case NPV 为正，但必须复核 incremental revenue、working capital、tax、capex、terminal value 和 discount-rate assumptions。

#### 2. Investment capacity

真正危险的不是“USD 下跌导致利润不好看”，而是 liquidity buffer 和 covenant headroom 消失，导致公司高成本融资或放弃其他好项目。

#### 3. Risk classification and response

- 产品需求、客户采用和生产执行属于公司需要主动管理的 core risks；
- 裸露的美元方向押注不是制造商的 comparative advantage，可以转移；
- 未签约销量仍不确定，因此 100% hedge 可能造成 over-hedging；
- 可对 committed revenue 使用较高 hedge ratio，对 forecast revenue 分阶段提高对冲；
- 可用 USD debt、local sourcing 或 pricing clause 建立 natural hedge；
- 保留第二条产线的 expansion option，避免第一天承诺全部资本。

#### 4. Governance and threshold

Business owner 负责 demand 和 margin assumptions；Treasury 负责 currency exposure；CFO 负责 liquidity 和 financing；CRO 汇总组合风险；investment committee 批准越界后的重新决策。

可使用明确触发点：

> If forecast liquidity falls below EUR 15m or covenant headroom falls below 0.3×, the investment must be resized, delayed or re-approved.

#### 完整建议

> Proceed with the base investment, but stage the expansion and hedge the portion of USD cash flows that is sufficiently committed. The objective is not to eliminate currency volatility; it is to preserve liquidity and covenant headroom so that the firm can continue funding positive-NPV opportunities.

### 今天怎样才算真正学会

你需要完成一页、不超过 300 字的 decision memo：

1. 选择一家企业与一项真实投资；
2. 写出最重要的 incremental cash flows；
3. 指出一个 core risk 和一个 transferable risk；
4. 说明哪种 downside 会威胁 liquidity、covenant 或未来投资；
5. 给出 response、owner、cost、residual risk 和 threshold；
6. 写出一条可能推翻建议的新证据。

必须能够解释这句话：

> **The purpose of risk management is to protect the firm's ability to create value, not to eliminate all risk.**

最终掌握标准分为五级：

- **Explain**：能用自己的话说明 NPV、hedging 与 ERM 的因果关系；
- **Calculate**：能计算 NPV，并在 downside scenario 中检查 cash 与 covenant；
- **Diagnose**：能从“汇率波动”追到真正的 value-destruction mechanism；
- **Decide**：能写出 decision、owner、response 和 threshold；
- **Challenge**：能指出自己的假设和可能推翻结论的证据。

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

#### 阅读后必须能回答

一个项目 NPV 为正，但第二年现金余额为负。为什么这不是“只要借钱就可以解决”的问题？你应同时讨论 financing cost、liquidity、covenant 和 real option。

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

#### 阅读后必须能回答

“股东已经分散投资，所以公司不需要管理总风险。”这句话错在哪里？答案必须包含 financing friction、underinvestment 和 investment capacity，而不是只说“公司怕亏损”。

### 阅读三｜Nocco & Stulz (2006), “Enterprise Risk Management: Theory and Practice”

#### 原文与状态

- **正式 journal version 已有**：[打开 Nocco & Stulz (2006) PDF](../readings/Nocco-Stulz-2006-Enterprise-Risk-Management-Journal.pdf)
- [打开中文学习卡](../readings/summaries/nocco-stulz-2006-erm-theory-practice.md)
- 另有 author-hosted accessible version：`184_nocco-u7sc9u.pdf`。

#### 阅读框架

1. **Macro ERM**：怎样保护公司整体资本、融资和战略执行能力？
2. **Micro ERM**：怎样让业务经理在每个决定中考虑风险？
3. **Risk appetite**：企业愿意承担多少风险，边界如何进入真实决定？
4. **Risk ownership**：Board、CRO、CFO 与 business owner 分别负责什么？
5. **Portfolio view**：多个风险合起来是否形成 concentration 和 correlation？
6. **Risk-adjusted allocation**：有限资本应配置给哪些风险—回报组合？

#### 内容概述

Nocco & Stulz 把 Stulz 的价值逻辑升级为组织系统。宏观层面，ERM 保护公司在坏情境下仍能获得资本并执行战略；微观层面，风险判断必须进入业务日常决定，而不能全部交给 CRO。Risk appetite 需要通过 limits、metrics 和 thresholds 进入资本预算与绩效评价。Portfolio view 则防止不同部门各自看起来合理、公司整体却集中依赖同一个货币、客户、利率或供应商。ERM 的目标不是降低所有风险，而是把有限 risk capacity 配置给公司最有优势的核心风险。

**Day 1 的停止点**：理解 enterprise view 为什么改善 financing capacity 与 capital allocation，即可。Risk appetite 的正式设计、风险类别、COSO components、board/CRO governance 和 ERM implementation 将在 Day 3 结合 COSO、Grant Thornton、Deloitte 与 DSM 深入学习；今天不提前替代那一课。

#### 必懂词汇

| 词汇 | 音标 | 白话解释 |
|---|---|---|
| **enterprise risk management** | /ˈentəpraɪz rɪsk ˈmænɪdʒmənt/ | 将风险—回报判断嵌入战略和经营决定。 |
| **macro level** | /ˈmækrəʊ ˈlevl/ | 从公司整体资本与风险组合看问题。 |
| **micro level** | /ˈmaɪkrəʊ ˈlevl/ | 从单个业务或项目决定看问题。 |
| **risk appetite** | /rɪsk ˈæpɪtaɪt/ | 企业为实现战略愿意承担的风险范围。 |
| **risk capacity** | /rɪsk kəˈpæsəti/ | 企业客观上最多能承受多少风险。 |
| **boundary** | /ˈbaʊndri/ | 不应越过的界线。 |
| **threshold** | /ˈθreʃhəʊld/ | 达到某个数字后触发行动的阈值。 |
| **risk owner** | /rɪsk ˈəʊnə/ | 对某项风险的识别、应对和报告负责的人。 |
| **CRO** | /ˌsiː ɑːr ˈəʊ/ | Chief Risk Officer，首席风险官。 |
| **portfolio view** | /pɔːtˈfəʊliəʊ vjuː/ | 把不同风险放在公司整体一起观察。 |
| **concentration** | /ˌkɒnsnˈtreɪʃn/ | 风险过度依赖同一客户、货币或供应商。 |
| **correlation** | /ˌkɒrəˈleɪʃn/ | 多项风险是否容易同时变化。 |
| **stress scenario** | /stres səˈnɑːriəʊ/ | 检验严重但合理坏情境的压力测试情境。 |
| **capital allocation** | /ˈkæpɪtl ˌæləˈkeɪʃn/ | 决定有限资本投入哪些业务或项目。 |
| **risk-adjusted capital** | /rɪsk əˈdʒʌstɪd ˈkæpɪtl/ | 根据风险大小调整后用于评价或配置的资本。 |
| **metric** | /ˈmetrɪk/ | 观察结果或风险变化的衡量指标。 |
| **escalation** | /ˌeskəˈleɪʃn/ | 风险越界后提交给更高权限处理。 |
| **review date** | /rɪˈvjuː deɪt/ | 预先确定重新检查决定的日期。 |
| **liquidity buffer** | /lɪˈkwɪdəti ˈbʌfə/ | 为意外情况保留的现金或融资额度。 |
| **covenant headroom** | /ˈkʌvənənt ˈhedruːm/ | 距离违反债务条款还剩多少空间。 |
| **cash-flow-at-risk** | /kæʃ fləʊ ət rɪsk/ | 在给定期间和置信水平下现金流可能下降的程度。 |
| **committed order** | /kəˈmɪtɪd ˈɔːdə/ | 客户已有较强合同义务的订单，不只是预测。 |
| **cash burn** | /kæʃ bɜːn/ | 项目或公司消耗现金的速度。 |
| **re-approval** | /ˌriː əˈpruːvl/ | 条件改变或越界后重新获得批准。 |

#### 阅读后必须能回答

为什么把项目放回 enterprise portfolio，会改变原本只看 NPV 的投资判断？答案应说明共同 exposure、concentration、financing capacity 和 capital allocation；不需要提前展开 Day 3 的完整 COSO governance。

### 三篇阅读合起来怎样使用

面对任何 Day 1 案例，按三个作者顺序写：

1. **Berk**：项目的 incremental cash flows、NPV、liquidity 和 flexibility 是什么？
2. **Stulz**：哪个 downside 会造成 financing constraint 和 underinvestment？风险应保留还是转移？
3. **Nocco & Stulz**：这个决定如何改变 enterprise portfolio、financing capacity 和 capital allocation？Risk appetite 与 ownership 在今天只识别概念，Day 3 再系统应用。

最终答案必须包含：

> **Decision + value logic + risk classification + response + owner + threshold + residual risk**

### 跨文章证据地图｜每个结论应该回到哪里

| 你要写的结论 | 首要资料 | 资料状态 | 不能犯的错误 |
|---|---|---|---|
| 项目现金流、折现、债券/股票估值、短期资金规划、real options | Berk 指定章节 | 原书待补；现有 study guide | 不要把学习卡当作教材原文引用。 |
| 为什么公司风险管理能够创造价值 | Stulz (1996) | 原文 PDF 已有 | 不要只写“降低波动”，要写融资约束与投资不足。 |
| 为什么应保留 core risk、转移 non-core risk | Stulz (1996) | 原文 PDF 已有 | 不要把风险类别视为永久标签，要结合企业能力。 |
| Enterprise view 的 macro/micro benefits | Nocco & Stulz (2006) | Journal PDF 已有；Day 1 bridge | 今天聚焦 financing capacity 与 value，不提前替代 Day 3 COSO。 |
| Portfolio view 与 risk-adjusted capital allocation | Nocco & Stulz (2006) | Journal PDF 已有；Day 1 bridge | 不要只看单项风险，要检查 concentration 与 correlation。 |

这张表的目的，是防止 AI 把看似合理但来源不清的内容混入答案。正式作业中，每个关键判断都应能回到具体 reading、case fact 或额外可靠资料。

### 反向测试｜10 道区分“理解”与“背诵”的问题

先关闭本页，用自己的话作答。每题写 3–6 句完整的话。不要只列术语：你需要说明事情为什么会发生、不同选择各自要付出什么代价，以及坏到什么程度时公司必须改变决定。完成后再看后面的答案锚点。

1. **识别真正相关的现金流。** 一家公司去年已经支付 EUR 2m 做市场调研，现在才决定是否建设新工厂。请判断这笔钱通常是否应该进入今天的投资分析，并说明判断标准。然后设想一种例外情形：今天的决定能够改变未来可收回的金额或现金流，此时你的处理为什么可能不同？
2. **区分“项目有价值”与“现在应该全部投入”。** 某项目的 base-case NPV 为正，但前两年需要持续投入现金，而且关键市场需求还没有得到验证。请说明管理层为什么仍可能选择延迟或分阶段投资，并比较等待获得新信息的价值与延迟收益的代价。
3. **选择与风险匹配的折现率。** 一家公司可以按 5% 的利率借款，于是管理层想用 5% 折现所有新项目。请解释这种做法为什么可能高估高风险项目，并说明项目风险、投资者要求的回报与贷款利率之间分别是什么关系。
4. **解释企业对冲为什么可能创造价值。** 假设股东已经持有充分分散的投资组合，公司仍计划为美元收入做外汇对冲。请不要只回答“降低波动”，而要完整说明汇率损失如何经过现金短缺、融资困难或投资不足，最终损害公司价值。
5. **区分好结果与好决定。** Treasury 因为预测美元会上升而降低了原定对冲比例，最后公司因此多赚了钱。请判断这个结果能否证明当初的决定正确，并说明你会使用哪些事前信息和政策标准评价决策质量。
6. **理解过度对冲。** 公司预计明年有 USD 100m 销售，因此提前对冲全部金额，但最终实际销售只有 USD 60m。请解释为什么剩余的 USD 40m 不再是对冲，而会变成新的市场头寸；再说明公司如何根据 committed revenue 与 forecast revenue 设计更合理的比例。
7. **说明分散化的能力与边界。** 一位股东通过持有很多股票降低了单一公司事件对个人财富的影响。请解释这种分散化能够降低哪类风险、不能消除哪类风险，以及为什么它不能直接解决某一家公司的 cash shortfall。
8. **把投资者预期连接到公司融资。** 如果投资者认为某行业未来现金流更不确定，他们要求的回报会发生什么变化？请沿着 investor expectations → required return → security price → financing terms 的顺序，完整解释这种变化如何影响公司的投资决定。
9. **从单个好项目转向企业组合。** 两个项目单独计算都有正 NPV，但它们的收入都依赖美元、同一个美国客户，而且在坏情境下会同时需要额外资金。请说明公司为什么可能延迟其中一个项目，并明确指出 portfolio view 比单项目 NPV 多看见了什么。
10. **形成一段可以执行的管理建议。** 回到美国扩产案例，写一段完整 recommendation。先说明是否投资及价值依据，再区分公司应承担的 core risk 与可转移的 non-core risk，最后写清 response、负责人、触发重新决策的 threshold，以及采取措施后仍然存在的 residual risk。不要只罗列这些英文词，要把它们写成一条连续的因果链。

#### 答案锚点｜用于纠错，不是标准范文

1. 已支付且不可收回通常是 sunk cost；只有当决定会改变未来可收回价值或后续现金流时才重新分析。
2. Base-case NPV 可能忽略 liquidity gap、covenant pressure 与新信息价值；staging 可以限制 downside 并保留 upside。
3. Discount rate 应匹配项目现金流风险；贷款利率只反映债务请求权与借款条件，且可能造成 financing effect 重复计算。
4. Financing friction 可能让 downside cash loss 造成 underinvestment；hedging 可保护 investment capacity。
5. 不能。结果好可能来自 market luck；需要按 mandate、benchmark、limit 和 risk-adjusted result 评价 decision quality。
6. 实际销量低于 forecast 时，hedge position 可能超过真实 exposure，原本的 hedge 会创造新的市场头寸。
7. Diversification 可以降低 company-specific risk，但不能自动消除 systematic risk，也不能把公司内部缺失的现金转回公司。
8. 投资者对 cash flow 与 risk 的预期影响 required return；required return 进入 discount rate，并通过市场定价和融资条件影响公司决定。
9. 两个项目可能共同依赖 USD、同一客户或供应商，在坏情境下同时恶化，形成 concentration 并占用相同 financing capacity。
10. 没有唯一答案；检查是否形成完整因果链，而不是只列术语。

### 错题闭环｜每错一题只做四步

1. **定位错误类型**：定义错、因果断裂、遗漏 trade-off、缺少 evidence，还是没有 threshold？
2. **回到原文**：找到 Berk、Stulz 或 Nocco & Stulz 中真正支持该判断的位置。
3. **重写答案**：不复制解释，用自己的公司案例重新回答。
4. **迁移一次**：换一个行业，检验同一逻辑是否仍成立，以及边界在哪里。

可以把下面这段直接交给 AI，当作纠偏提示词：

> 只依据 Day 1 的三份指定资料检查我的答案。不要直接给标准答案。先指出我遗漏的因果环节、混淆的概念和没有证据支持的推论；再问我一个追问，逼我自己修正。最后分别标记：原文事实、合理推论、仍需核实。

AI 的作用是指出知识漏洞，不是替你完成最后判断。真正的完成标准是：关闭页面后，你仍能用新的案例重建同一条逻辑。

### 课堂问题中的常见指令词

| 指令词 | 音标 | 老师真正要求你做什么 |
|---|---|---|
| **explain** | /ɪkˈspleɪn/ | 解释因果，不只是给定义。 |
| **calculate** | /ˈkælkjuleɪt/ | 完成计算并解释结果含义。 |
| **assess** | /əˈses/ | 根据标准评价严重性或质量。 |
| **compare** | /kəmˈpeə/ | 指出相同点、差异及差异为何重要。 |
| **diagnose** | /ˌdaɪəɡˈnəʊz/ | 找到表面现象背后的机制。 |
| **recommend** | /ˌrekəˈmend/ | 提出具体选择并用证据支持。 |
| **justify** | /ˈdʒʌstɪfaɪ/ | 说明为什么选择比替代方案合理。 |
| **challenge** | /ˈtʃælɪndʒ/ | 质疑假设并寻找反方证据。 |
| **implement** | /ˈɪmplɪment/ | 把建议转化为 owner、步骤、资源和时间。 |
| **preserve** | /prɪˈzɜːv/ | 保护并保留，如 preserve investment capacity。 |
| **proceed** | /prəˈsiːd/ | 继续执行，如 proceed with the investment。 |
| **trigger** | /ˈtrɪɡə/ | 达到条件后触发预先规定的行动。 |

如果你能在不回看页面的情况下，用三篇阅读依次解释美国扩产案例，并正确使用上述关键词，Day 1 才算从“看懂”进入“掌握”。
