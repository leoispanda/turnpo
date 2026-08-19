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

数据日期基准：**2026-08-17**（周一收盘）。今天：见 §6 最后一条日志。

| 组件 | 状态 | 测试 | 最后改动 |
| --- | --- | --- | --- |
| `scripts/fetch_a_share_sina.py`（东财 502 替代抓取） | 可用 | 2 | Claude 08-17 |
| Hawkeye + 九成员 `run_latest_pdc.py` | **冻结未动** | 4 | — |
| FULL_COMMITTEE 全池双评 + 全池复议 | 可用，降为离线审计 | 113 | Claude 08-18 |
| DAILY_TOP10 硬资格 `daily/eligibility.py` | 完成 | 14 | Claude 08-19 |
| DAILY_TOP10 冻结事实 `daily/facts.py` `daily/sources.py` | 完成 | 14 | Claude 08-19 |
| DAILY_TOP10 三轮契约 `daily/contracts.py` | 完成 | 23 | Claude 08-19 |
| DAILY_TOP10 三轮执行 `daily/{discovery,detail,review}.py` | 完成 | 20 | Claude 08-19 |
| DAILY_TOP10 共识与分歧 `daily/consensus.py` | 完成 | 15 | Claude 08-19 |
| DAILY_TOP10 最终门槛 `daily/selection.py` | 完成 | 25 | Claude 08-19 |
| DAILY_TOP10 产物 `daily/report.py` | 完成 | 14 | Claude 08-19 |
| DAILY_TOP10 额度账本 `daily/quota.py` | 完成 | （含在上面） | Claude 08-19 |
| DAILY_TOP10 编排与降级 `daily/orchestrator.py` | 完成 | 19 | Claude 08-19 |
| CLI `scripts/pdc_daily_top10.py` | 完成（`plan`/`run`/`show`） | 手测 | Claude 08-19 |
| **真实模型端到端验收** | **未做** | — | — |
| 行业映射（行业集中度所需） | **缺失，规则空转** | — | — |
| 定时调度 | 未做（Codex 负责） | — | — |

离线测试总数：**302 个，全部通过**（其中 DAILY_TOP10 新增 144 个）。
全部用假席位驱动，**至今没有跑过一次真实模型的 DAILY_TOP10**。

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
| （空） | | | |

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
