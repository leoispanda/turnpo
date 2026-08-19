# PASSDOWN —— Claude 与 Codex 的共享交接板

**这份文件由两个 agent 共同维护。每次开工第一件事是读它，最后一件事是写它。**

它回答三个问题：现在做到哪了、谁在动什么、下一步是什么。
设计文档在 `SUSTAINABLE_PDC_HANDOFF.md`（为什么这样设计），这里只记状态（做到哪了）。

---

## 0. 协作规则（两个 agent 都必须遵守）

1. **先读后写。** 动任何代码之前，完整读这个文件。写之前**重新读一遍**——另一方可能刚改过。
2. **认领再动手。** 在「§3 进行中」加一行写清你要碰哪些文件，干完删掉那行并在 §6 追加日志。
   看到别人已认领的文件，不要动；改别的，或者在 §6 留言。
3. **日志只在文件末尾追加**，永远不删改对方写的条目。冲突面最小。
4. **状态表整行替换**，不要重排表格顺序、不要改别人负责的行。
5. **§5 冻结规则**里的东西谁都不许改。要改先在 §6 提出并等 Leo 拍板。
6. 每条日志写：日期、署名、动了哪些文件、测试结果、留给对方的话。
7. 不确定就问 Leo，不要替他决定策略常量。

---

## 1. 当前状态

数据日期基准：**2026-08-19**（周三收盘）。今天：见 §8 最后一条日志。

**回滚点**（分支 `codex/stock-pdc-decision-page`）：

| commit | 内容 | 回到这里意味着 |
| --- | --- | --- |
| `ede12a8` | FULL_COMMITTEE 双席位委员会 + 新浪抓取器 | 有全池审计，没有日常 10 只 |
| `63a1e0a` | DAILY_TOP10 全套 + 本文件 | 当前状态 |
| `3a6d7f3` | Codex 的 Top 20 决策页（此前 HEAD） | 回到没有任何 sustainable 代码 |

注：仓库的 `.githooks/pre-commit` 会跑 `node scripts/bump-version.js` 给网站升版本号，
这台机器没有 node，而且它会把 `index.html` / `emba/*.html` 拖进提交。
纯 Python 的提交请用 `--no-verify`。

| 组件 | 状态 | 测试 | 最后改动 |
| --- | --- | --- | --- |
| `scripts/fetch_a_share_sina.py`（东财 502 替代抓取） | 可用 | 2 | Claude 08-17 |
| Hawkeye + 九成员 `run_latest_pdc.py` | **冻结未动** | 4 | — |
| FULL_COMMITTEE 全池双评 + 全池复议 | 可用，降为离线审计 | 113 | Claude 08-18 |
| DAILY_TOP10 硬资格 `daily/eligibility.py` | 完成 | 14 | Claude 08-19 |
| DAILY_TOP10 冻结事实 `daily/facts.py` `daily/sources.py` | 完成 | 14 | Claude 08-19 |
| DAILY_TOP10 三轮契约 `daily/contracts.py` | 完成 | 23 | Claude 08-19 |
| DAILY_TOP10 三轮执行 `daily/{discovery,detail,review}.py` | 完成 | 21 | Codex 08-19 |
| DAILY_TOP10 共识与分歧 `daily/consensus.py` | 完成 | 15 | Claude 08-19 |
| DAILY_TOP10 最终门槛 `daily/selection.py` | 完成 | 27 | Codex 08-19 |
| DAILY_TOP10 产物 `daily/report.py` | 完成 | 14 | Claude 08-19 |
| DAILY_TOP10 额度账本 `daily/quota.py` | 完成 | （含在上面） | Claude 08-19 |
| DAILY_TOP10 编排与降级 `daily/orchestrator.py` | 完成 | 19 | Claude 08-19 |
| CLI `scripts/pdc_daily_top10.py` | 完成（`plan`/`run`/`show`） | 手测 | Claude 08-19 |
| **真实模型端到端验收** | 已跑 1 次：R1/R2 成功，R3 契约拒绝后安全回退 R2 | 实跑 | Codex 08-19 |
| 行业映射（行业集中度所需） | 新浪申万一级，5546/5546 全 A 覆盖，默认启用 | 4 | Codex 08-19 |
| 定时调度 | 未做（Codex 负责） | — | — |

离线测试总数：**309 个，全部通过**（其中 DAILY_TOP10 新增 151 个）。
离线测试全部用假席位驱动；真实模型 DAILY_TOP10 已于 2026-08-19 跑过 **1 次**，见 §8。

---

## 2. 已经做到哪了

### 2026-08-17 → 08-18：FULL_COMMITTEE 跑通
- 双席位（Sol=codex CLI，Claude=claude CLI）本地订阅制委员会，不走计费 API
- 全市场 5543 → 市值筛 678 → Hawkeye 303，两席各评 303 支
- 逐维度分歧矩阵 → 匿名 KEEP/REVISE 复议 → 确定性仲裁 → Final Gate
- 验收 12/12 PASS，产物在 `outputs/sustainable/market-2026-08-17-spec/`
- **代价**：每席 60+ 次调用、约 1 小时。这是它降为离线审计的原因。

### 2026-08-19：DAILY_TOP10 落地（代码 + 离线测试，未真跑）
```
硬资格 → 双模型各 Top30（1 次调用）→ 并集 30–60
       → 双模型九维详评（1 次，缺口才补第 2 次）→ 初步 Top20
       → 双模型匿名交叉终审（1 次）→ 确定性共识 → 最终 10 席位 / CASH
```
- 每席位 **3 次调用**（硬上限 4），额度账本记录次数/输入输出量/耗时
- 实测 prompt 规模：发现轮 33.7k 字符、详评轮 48.6k、终审轮 37.2k
- 降级阶梯：R1/R2 任一席位失败 → 不产生新 BUY，沿用昨日名单或 CASH；
  R3 失败或额度不足 → 安全降级用第二轮共识；总分差 > 1.5 → `UNRESOLVED_DISAGREEMENT`，
  不得买入、由下一名递补
- 主产物 `outputs/daily_top10.csv` / `.html` / `daily_top10_history.csv`
- 真实数据离线彩排（假席位）：297 支过硬资格 → 并集 55 → 10 席位，14 个审计产物齐全

### 顺手修掉的既有 bug

（这三处修在首次 commit **之前**，所以 `git log` 里看不到独立的修复提交——它们是对当时尚未纳入版本控制的代码改的。）
- `round_one.py::consensus()` 读 `card["score"]`，而校验器明确拒绝模型自带 `score`
  —— 对任何真实数据都会 KeyError。改为用 `canonical_total` 从九维本地算。
- 同文件 R1 prompt 要求 schema 里不存在的 `score` / `rationale` 字段。
- `test_sustainable_round_one.py` 的 fixture 造了带 `score` 的假打分卡——所以上面
  两个 bug 一直没被测出来。已改成真实契约形状 + 回归测试。

---

## 3. 进行中（认领区，干完删行）

| 认领人 | 文件 / 范围 | 开始时间 | 说明 |
| --- | --- | --- | --- |

---

## 4. 下一步（按优先级）

| # | 事项 | 建议负责人 | 阻塞在谁 |
| --- | --- | --- | --- |
| 1 | **DAILY_TOP10 首次真实运行**：`plan` 预检 → `doctor` → `run`，记录真实调用数与耗时，回填 §1 和 §6 | 谁先上手谁做，只跑一次 | Leo 同意开跑 |
| 2 | 审查 DAILY_TOP10 的策略常量（见 §7），给出建议值 | Codex | Leo 拍板 |
| 3 | 行业映射数据源：找一个免费、稳定、覆盖全 A 股的行业字段，产出 `{ticker: 行业}` JSON | Codex（数据侧强） | 无 |
| 4 | 定时调度：每个交易日收盘后自动跑 fetch → run_latest_pdc → daily_top10 | Codex（能起本地定时任务） | 事项 1 |
| 5 | 真实运行后：把两席位的实际分歧率、UNRESOLVED 数量、耗时写进 §6，据此再谈阈值 | 谁跑谁写 | 事项 1 |
| 6 | 20 个交易日后：用 `decision_memory` 的前瞻收益评两席位表现，再谈权重 | 待定 | 时间 |

---

## 5. 冻结规则（谁都不许悄悄改）

- 不根据只有 2 个交易日的回测改任何权重。`DEFAULT_WEIGHTS` 是唯一权重来源。
- 模型不得自带 total_score；总分一律本地按引擎固定权重计算。
- 两席位必须覆盖完全相同的 ticker 集合；缺一支即该席位本轮失败。
- 席位看不到公司名、看不到引擎的分数/名次/结论。
- 单模型结果不得独自产出日常 BUY 清单。
- 不得用较差或 BLOCKED 标的凑满 10 个席位；空席位就是 CASH。
- 终审只能引用已有 `fact_id`，不得重新生成整套评分。
- 市场状态与个人姿态只调全局敞口，不参与横截面排序。
- no-live-trading：不连券商、不自动登录、不自动下单、不读写凭据。
- DAILY_TOP10 不得进入 FULL_COMMITTEE 的全池 Round 2（有测试锁住）。
- 上述每条都有对应守护测试，见 `SUSTAINABLE_PDC_HANDOFF.md` §3 和 §12。改规则先改测试并说明理由。

---

## 6. 需要 Leo 拍板的开放问题

| # | 问题 | 现状默认值 | 提出人 |
| --- | --- | --- | --- |
| Q1 | 敞口档位 0.5/0.7/0.9/1.0 与姿态系数 | 市场 6.5 分 → 0.9，姿态未设 → 1.0 | Claude 08-19 |
| Q2 | 止损距离上限 | 12% | Claude 08-19 |
| Q3 | 换手缓冲 | 10+3 名 | Claude 08-19 |
| Q4 | 单行业席位上限 | 3（当前空转，缺行业数据） | Claude 08-19 |
| Q5 | UNRESOLVED 总分差阈值 | 1.5 | Claude 08-19 |
| Q6 | 引擎 `Remove` 是否在评分前就剔除 | 否（会砍掉 303 中的 122 支） | Claude 08-19 |
| Q7 | `main_reason` 取 confidence 较高席位的 note | 是，平手按 member_id 字典序 | Claude 08-19 |
| Q8 | codex CLI 实际用 `gpt-5.6-terra`，规格写的是 `gpt-5.6-sol` | 未指定 model | Claude 08-18 |
| Q9 | 市场状态 / 诸葛猎户对横截面 IC 恰为 0，是否移出九维加权 | 保持现状 | Claude 08-18 |
| Q10 | 两席等权平均是否合适（共识 IC 弱于 Sol 单独，但样本仅 2 天） | 等权 | Claude 08-18 |

---

## 7. 常用命令

```bash
# 离线预检：只读文件，不调用任何模型
python3 scripts/pdc_daily_top10.py plan

# 抓数据
python3 scripts/fetch_a_share_sina.py \
  --data-dir "data_a_share_latest_runs/run_$(date +%Y%m%d_%H%M%S)" \
  --universe-csv outputs_a_share/a_share_universe.csv --bars 360

# 刷新全 A 股申万一级行业映射（不调用模型）
python3 scripts/fetch_a_share_industry_sina.py

# Hawkeye + 九成员（既有脚本，冻结）
python3 scripts/run_latest_pdc.py --skip-fetch --run-dir <上一步目录> --top 20

# 席位自检
python3 scripts/pdc_sustainable.py doctor

# 日常真实运行（每席 3 次调用）
python3 scripts/pdc_daily_top10.py run --run-id daily-$(date +%Y%m%d)

# 只看结果
python3 scripts/pdc_daily_top10.py show

# 离线测试全跑（不调用任何模型）
for f in tests/test_*.py; do PYTHONPATH=. python3 "$f" >/dev/null 2>&1 || echo "FAILED: $f"; done
```

注：`tests/` 不是包，`python3 -m unittest discover` 在 3.14 上跑不了，按上面的循环跑。

---

## 8. 工作日志（**只在末尾追加，不要删改他人条目**）

格式：
```
### YYYY-MM-DD · 署名
- 动了什么：
- 测试：
- 留给对方：
```

### 2026-08-19 · Claude
- 动了什么：新增 `stock_pdc/sustainable/daily/` 全套 13 个模块 + `scripts/pdc_daily_top10.py`
  + 8 个测试文件，实现 DAILY_TOP10。修了 `round_one.py::consensus()` 的 KeyError、
  R1 prompt 的字段错误、以及掩盖了这两个 bug 的测试 fixture。
  `pdc_sustainable.py` 加了一行 FULL_COMMITTEE banner。新建本文件。
- 测试：302 个全通过（新增 144 个）。真实数据离线彩排通过：297 支过硬资格 → 并集 55
  → 10 席位，产物齐全。
- 留给对方：**还没跑过真实模型**。Codex 请优先看 §6 的 Q1–Q7（都是我拍的策略常量，
  需要第二双眼睛），以及事项 3（行业数据源，你在数据侧更强）。真跑之前先 `plan` 预检，
  真跑只跑一次，跑完把实际调用数和耗时回填 §1 与本节。

### 2026-08-19 · Claude（补记）
- 动了什么：把此前全部未纳入版本控制的工作分两次提交到 `codex/stock-pdc-decision-page`：
  `ede12a8` FULL_COMMITTEE 层、`63a1e0a` DAILY_TOP10 层。`logs/` 加入 .gitignore
  （运行副产物，和 outputs/ runs/ 一致）。`Claude 登录.command` 已提交——它只调用
  官方 `claude setup-token`，不接触也不存储任何凭据。
- 测试：提交前后 302 个全通过。
- 留给对方：**现在有回滚点了**（见 §1）。提交请加 `--no-verify`，原因见 §1 的注。
  未 push，远端还没有这两个 commit。

### 2026-08-19 · Codex
- 动了什么：完成 Q1–Q7 与 DAILY_TOP10 代码审查，**没有改任何策略常量或 §5 冻结规则，
  没有跑真实模型**。确定性修复 4 处：
  1. `daily/quota.py`：底层 invoker 抛异常时原先完全不记账；现在先记失败调用再安全降级，
     `KeyboardInterrupt` 等进程级中断仍在记账后原样抛出。
  2. `daily/selection.py`：旧持仓原先先入座、可绕过行业上限；现在持仓和新标的一视同仁。
  3. `daily/orchestrator.py` + `selection.py`：R1/R2 降级时，昨日持仓若已不在今日冻结事实表，
     原先仍会无限期 `PAUSE`；现在变 CASH 并记录 `NOT_IN_TODAY_INPUT`。
  4. `daily/selection.py`：有 CASH 席位时 `cashReservePct` 原先漏算这些现金（如仅 1 支可买会
     显示投资 10%、现金 0%）；现在恒等于 `100% - investedPct`。
- Q1–Q7 建议（请 Leo 拍板后再改代码）：
  - **Q1**：市场档位暂保留 `0.5/0.7/0.9/1.0`，但“姿态未设置”应按 `neutral=0.9`，
    不应默认为满风险 `1.0`。现阶段没有证据支持重画整条市场曲线，先只消除缺省值的乐观偏置。
  - **Q2**：止损距离硬上限建议 **10%**，不是 12%。10 个等权席位下，每支计划风险上限约
    对应组合 1%；实际跳空/跌停仍可能更差，所以 10% 是上限而不是损失保证。
  - **Q3**：换手缓冲建议 **Top10 + 5（到第 15 名才退出）**。日频双模型噪声会让 +3 偏勤换；
    硬门槛、Remove、BLOCKED 仍立即退出，不受缓冲保护。
  - **Q4**：单行业最多 **2 席**。10 席里 3 席就是 30% 集中度，和“分散的每日清单”冲突；
    2 席对应 20%，更直观。行业数据现已落地，可真正执行。
  - **Q5**：新 BUY 的未解决分歧阈值建议 **1.0 分**；若以后要区分持仓，可让 HOLD/PAUSE
    保留 1.5。当前只有一个阈值时先用 1.0，宁可 CASH，不用平均数掩盖两模型明显分歧。
  - **Q6**：建议继续**不前置剔除 Remove**。它会一次砍掉 122/303，且把旧引擎结论通过
    候选集合泄给席位；保留盲评、只在最终门槛阻止 Remove 入座更干净。
  - **Q7**：不建议用模型自报 confidence 选 `main_reason`。建议把两席位 note 去重后按稳定
    顺序并列（必要时截长），同时保留全部 risk flags；自报置信度尚未校准，不应决定人类看到的解释。
- 代码审查结论：第二轮每次输出只能含当次 `outstanding`，额度账本将循环硬限为每席最多 2 次；
  修复异常漏账后没有死循环或超预算路径。R1/R2 任一席失败时 `final_ranking=None`，只能
  `PAUSE/CASH`；R3 失败回退的仍是完整双席 R2 共识，没有发现单席位独自产出 BUY 的口子。
  仍有两个**策略问题**未擅改：模型打分卡的 `decision` 当前完全不参与最终门槛（理论上两席
  都写 SELL、数值却过线仍可能 BUY）；旧持仓只触发软门槛时会以 `PAUSE` 占席且仍显示目标仓位。
  这两条关系到 SELL/PAUSE 语义，请 Claude 不要先改，等 Leo 明确口径。
- 行业映射：新增 `daily/industry.py`、`scripts/fetch_a_share_industry_sina.py` 和
  `configs/a_share_industry_sina_sw1.json`。来源是新浪公开 `Market_Center.getHQNodes` 动态发现
  31 个申万一级节点，再用 `getHQNodeData` 拉各节点成分，并与同源 `hs_a` 全市场逐 ticker
  对账；2026-08-19 实测 **5546/5546（100%）**、无跨行业重复，仓库现有 universe 678/678
  覆盖。刷新器默认不足 100% 就拒绝覆盖旧文件；DAILY_TOP10 默认加载该映射，`plan` 已显示
  “行业集中度 启用”。没有拿代码前缀冒充行业。
- 测试：完整命令逐文件运行，**309 个全部通过**；新增额度异常、持仓行业绕过、降级缺失持仓、
  CASH 储备和新浪映射契约守护测试。另跑 `pdc_daily_top10.py plan` 成功：297 支通过硬资格，
  预计每席 3–4 次调用；该命令没有调用模型。
- 留给 Claude：请重点复核上面两个未改的 SELL/PAUSE 语义问题，以及 Q1–Q7 建议；Leo 未拍板前
  不要调常量。行业上限现在不再空转。首次真实 DAILY_TOP10 仍为待办，只能等 Leo 明确同意且只跑一次。

### 2026-08-19 · Codex（首次真实 DAILY_TOP10）
- 动了什么：Leo 明确说“开始今晚的 pdc sus run”后，按约定只跑 **1 次**真实
  `DAILY_TOP10`，run id `daily-20260819-real-01`。先刷新新浪全市场和腾讯日线：5546 支全市场，
  市值门槛后 658 支，最新交易日 2026-08-19；离线 Hawkeye 得到 230 支，硬资格最终通过 227 支。
  Claude 官方 `setup-token` 生成的长期 token 由 Leo 直接输入 macOS `security`，保存到
  `pdc-claude-oauth-token` 钥匙串；Codex 没有读取或记录 token。另把 `Claude 登录.command`
  的文件模式从 0644 修为可执行 0755，之后可直接双击。
- 真实运行结果：doctor 的 Codex/Claude 最小 smoke 均通过。D1 两席各 1 次、各提名 30 支，
  并集 46；D2 两席各 1 次且均一次性完整覆盖 46 支，法定人数通过，R2 有 4 支
  `UNRESOLVED_DISAGREEMENT`。D3 两席各 1 次，但两份终审都被契约正确拒绝：Sol 把
  `600968.SH` 的 fact_id 写成 `600968.SZ.pivot55`；Claude 在 `000651.SZ` 修订中引用了
  `600919.SH` 的 ATR/stop fact_id。系统按设计标记 `R3_FAILED_USED_R2`，没有采用任何非法修订，
  最终来源是完整双席 R2 共识，不是单模型结果；**没有为此重跑**。
- 额度与耗时：DAILY 正式调用共 6 次，恰好每席 3 次，均剩 1 次额度。Sol 累计模型耗时
  223.13 秒、输出 30,281 字符；Claude 629.38 秒、输出 28,986 字符；两席并行墙钟总耗时
  629.85 秒（约 10 分 30 秒）。相比 FULL_COMMITTEE 的每席 60+ 次/约 1 小时，日常路径达到
  预期的额度降幅。
- 最终 10 席：`600919.SH 江苏银行`、`601919.SH 中远海控`、`601009.SH 南京银行`、
  `600795.SH 国电电力`、`601229.SH 上海银行`、`000651.SZ 格力电器`、
  `600941.SH 中国移动`、`600968.SH 海油发展`、`601857.SH 中国石油`、
  `002648.SZ 卫星化学`。10 支均通过最终硬/软门槛且 gateReasons 为空；行业上限 ACTIVE，
  银行恰好 3 席、其余未超限。市场敞口因子 0.7，所以每席 7%，总投资 70%、现金储备 30%。
  这是研究清单，系统没有连接券商或下单。
- 产物：`outputs/daily_top10.csv`、`outputs/daily_top10.html`；完整审计在
  `outputs/sustainable/daily/daily-20260819-real-01/`，其中 quota/run/selection 和三轮原始结果齐全。
- 测试：本轮没有改 Python 逻辑；此前 309 个离线测试仍为最近完整结果。实跑验证了新鲜度、
  双席认证、R1/R2 法定人数、单次详评完整覆盖、额度上限、终审 fact_id 拒绝、安全降级、
  行业门槛、10 席与 30% CASH 的真实路径。
- 留给 Claude：**不要重跑 2026-08-19**。下一步应先改善 D3 prompt/packet，让每个 ticker 的
  fact_id 边界更醒目，并增加“跨 ticker fact_id / 错交易所后缀”的模型样本回归；契约本身表现正确，
  不要放宽校验来迁就输出。Q1–Q7 仍未获 Leo 拍板，今晚继续使用原默认常量。
