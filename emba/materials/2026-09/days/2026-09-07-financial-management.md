# Day 1｜Financial Management

> **Monday 7 September｜08:30–19:00**
>
> 今天的核心问题：**这项投资是否值得做，公司能否撑到价值实现，以及哪些风险应该自己承担、哪些应该转移？**

## 第一部分｜今天讲什么

### 知识寓言｜《第二张航海表》

灰港的商会准备建一艘北海货船。造船师把五年后的收入画成一座银币山：只要航线开通，赚回的钱远远超过木料和人工。桌边的人很快举手同意，只有记账官伊莱没有签字。

第二天，他带来两张表。第一张只比较“造船”和“不造船”之后真正改变的现金：已经花掉的勘探费被划去，占用旧船坞失去的修船收入却被补了回来；木料、船员、库存和船体残值都落在各自发生的年份。把远期银币折回今天以后，项目仍然值得做。

伊莱随后展开第二张表。上面没有利润，只有日期：什么时候付木料款、什么时候发工资、什么时候偿还债主、什么时候第一批货款才能到账。大家这才看见，货船虽然第五年很赚钱，船坞却可能在第二个冬天先没钱。债主提出增加贷款，但三艘旧船的订单也都来自同一座北方城市；一场封港会让所有收入同时停下。

商会最初想把未来五年的货物全部锁价。伊莱只圈出已经签约、数量明确的订单。没有订单支撑的部分若也锁定，一旦销量不足，原本的保护就会变成另一场押注。船型、客户和航线选择则没有交给保险商，因为那正是船坞必须凭能力承担、也靠它获得回报的事情。

最后，他们把建造拆成两期：先造能独立航行的船体，第一批订单兑现后再扩建货舱；同时保留不准分红的现金，并把一部分货物改走南港。第三年，北海封航六周。利润下降了，锁价合同也没有消除全部损失，但工资照常发放，债务没有违约，下一艘船的龙骨仍在清晨被吊上支架。

灰港没有学会预测每一场风暴。它学会的是：先证明一艘船值得造，再安排一条能活到完工的资金路径；只转移会摧毁这条路径、又不值得自己承担的风险。后来，人们把这种把投资、融资与风险放进同一个决定的做法称为 **Financial Management（财务管理）**。

### 今天真正要学会的判断

财务管理不是依次背诵 NPV、债务和对冲工具，而是回答一个完整问题：**在什么假设下值得投资，怎样融资才能完成投资，坏到什么程度必须调整或停止？**

### Syllabus 边界｜今天学什么，不学什么

| 今天必须完成 | 今天只作连接 | 留到后面深入 |
|---|---|---|
| investment/financing decisions、financial markets、investor expectations、discounting、risk-return、diversification、derivatives 与 financial risk management | Nocco & Stulz 如何用企业整体视角保护 financing capacity 与 capital allocation | Day 2 的 compliance/ESG；Day 3 的 COSO、risk appetite 与 governance；Day 4 的 management control |

Monday 只有 Berk、Stulz、Nocco & Stulz 三项指定阅读。Nocco & Stulz 虽然讨论 ERM，今天只取它与财务决策直接相关的部分，不提前学习 Wednesday 的完整治理框架。

### 五步知识链｜一个投资决定怎样走到可执行建议

> **定义决定 → 判断价值 → 安排资金 → 分配风险 → 回到公司整体作结论**

#### 01｜先定义“做”与“不做”究竟差在哪里

**要回答：** 哪些现金流真的由这个决定引起？

只计算 incremental cash flow。排除已经无法收回的 sunk cost，加入 opportunity cost、cannibalization、working capital、tax、capex 和终值。Accounting profit 可以提供线索，但不能替代现金流。

**完成标志：** 你能画出一条项目 timeline，并解释每一笔现金为什么属于这个决定。

#### 02｜把现金流换算成今天的价值

**要回答：** 这些未来现金流是否足以补偿时间与风险？

用 discounting 把不同年份的现金流放到同一时点。Discount rate 来自同等风险资本的 required return，而不是为了得到想要的结论随意选择。NPV 大于零只表示在当前假设下创造价值；它仍需接受情境和敏感性检查。

**完成标志：** 你能指出最可能让 NPV 由正转负的两个假设。

#### 03｜安排一条能够活到回款的融资路径

**要回答：** 公司会不会在好项目开始赚钱以前先失去现金或信用？

Debt 会形成固定偿付、到期日和 covenant；equity 会分享剩余收益与控制权。把融资承诺压到现金流时间线上，检查最低现金余额、covenant headroom 和 refinancing need。不确定性很高时，可用 delay、stage、expand 或 abandon 保留 real option。

**完成标志：** 你能说清资金缺口何时出现，以及用什么融资或阶段安排解决。

#### 04｜只转移会破坏投资能力的非核心风险

**要回答：** 哪些风险值得公司承担，哪些只是没有报酬的干扰？

公司应保留与产品、客户和能力优势相连的 core risk；对利率、汇率或商品价格等 non-core exposure，可在成本合理时使用 forward、option、swap、保险或自然对冲。Hedging 的对象必须是已经存在且可描述的 exposure，否则容易滑向 speculation。

**完成标志：** 你能写出“暴露—损失路径—阈值—工具—剩余风险”，而不是只报工具名称。

#### 05｜把项目放回企业组合，再给建议

**要回答：** 一个单独合理的项目，加入现有业务后仍然合理吗？

检查多个项目是否共同依赖同一客户、币种、利率、供应商或融资来源。Portfolio view 关注 concentration 与共同坏情景；最终建议必须同时说明 value creation、financing capacity、关键假设和会改变决定的 threshold。

**完成标志：** 你能给出 invest、stage、delay 或 reject 的明确建议，并说明什么新证据会改变它。

### 寓言对应｜只记住五个动作

| 故事动作 | 今天的金融判断 |
|---|---|
| 第一张表只记录真正改变的现金 | incremental cash flow 与 NPV |
| 第二张表把付款和回款放到日期上 | liquidity、maturity 与 financing constraint |
| 只为已签订单锁价 | exposure、hedging 与 speculation 的边界 |
| 分两期造船并保留现金 | real options 与 investment capacity |
| 三艘船依赖同一北方城市 | concentration 与 portfolio view |

### 类比边界

船坞能帮助你看见价值、资金和风险之间的顺序，但不能替代现金流预测、资本成本估计、合同分析或衍生品定价。现实中的相关性会变化，对冲也有成本、basis risk 与 counterparty risk。

### 应用到自己的公司｜完成一张决策卡

选择一项真实投资，只写五行：

1. **Decision**：公司现在究竟在决定什么？
2. **Value**：哪三个增量现金流决定它是否创造价值？
3. **Survival**：最早可能出现现金或 covenant 压力的时间点是什么？
4. **Risk ownership**：一个必须保留的核心风险和一个可以转移的风险是什么？
5. **Threshold**：坏到什么程度，公司应该 stage、delay 或 stop？

## 第二部分｜指定阅读：原文、框架及概述

三份阅读必须按这个顺序理解：

> **Berk：价值怎样形成 → Stulz：风险管理为什么创造价值 → Nocco & Stulz：怎样把判断变成企业系统**

### 阅读一｜Berk, DeMarzo & Harford (2025)

#### 原文与状态

- 指定教材：*Fundamentals of Corporate Finance*, 6th Global Edition。
- ISBN 9781292470047；eISBN 9781292738048。
- **原文待补**：目前没有本地教材全文，需要从 Maastricht University Library、Canvas 或 Pearson 获取。
- [进入 Berk 指定章节结构化学习页](/emba/reading.html?reading=berk-corporate-finance)
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
- [进入 Stulz 结构化学习页](/emba/reading.html?reading=stulz-risk-management)
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
- [进入 Nocco & Stulz 结构化学习页](/emba/reading.html?reading=nocco-stulz-erm)
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
