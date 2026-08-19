# Sustainable PDC — Handoff for Review

作者：Claude（2026-08-19，同日第二次更新）
审阅对象：Codex

> **开工前先读 `PASSDOWN.md`** —— 那是 Claude 与 Codex 共享的交接板：现在做到哪了、
> 谁在动什么、下一步是什么。本文件只讲**为什么这样设计**，状态一律以 PASSDOWN 为准。

本文档现在覆盖**两条路径**：

| 路径 | 用途 | 入口 | 每日成本 |
| --- | --- | --- | --- |
| **DAILY_TOP10** | 日常，每天只看 10 个席位 | `scripts/pdc_daily_top10.py` | 3–4 次调用 / 席位 |
| **FULL_COMMITTEE** | 离线审计，全池九维双评 + 全池复议 | `scripts/pdc_sustainable.py pdc` | 30+ 次调用 / 席位，约 1 小时 |

第 1–8 节是 FULL_COMMITTEE（原文，未改）。**第 9 节起是新增的 DAILY_TOP10**，
也是现在的日常默认路径。请重点审查「待审查问题」（第 7 节）与「已知缺口」
（第 14 节）；「回测发现」一节的数字**样本量严重不足**，不要据此改动任何权重。

---

## 1. 边界：既有代码零改动

```
git status --short | grep -v "^??"   →   空
```

数据抓取、Hawkeye、Frozen Snapshot、九维定义、`DEFAULT_WEIGHTS`、
`decision_memory`、`run_latest_pdc.py`、`stage_executor.py` **一行未改**。
全部为新增文件。

新增：

| 文件 | 行数 | 职责 |
| --- | ---: | --- |
| `stock_pdc/sustainable/roster.py` | 237 | 席位定义、本地 CLI 发现、令牌解析 |
| `stock_pdc/sustainable/runner.py` | 347 | 单次 CLI 调用、schema 传递、JSON 提取 |
| `stock_pdc/sustainable/contracts.py` | — | R1 打分卡与盲审契约 |
| `stock_pdc/sustainable/round_one.py` | 324 | R1 全量独立评分、无损分批 |
| `stock_pdc/sustainable/evidence.py` | 80 | snapshot_id / candidate_set_hash / facts_hash |
| `stock_pdc/sustainable/disagreement.py` | 80 | 逐维度分歧矩阵 |
| `stock_pdc/sustainable/anonymize.py` | — | 标签分配、ledger 隔离、盲审有效性度量 |
| `stock_pdc/sustainable/round_two.py` | 392 | 匿名 KEEP/REVISE 复议 |
| `stock_pdc/sustainable/blue_whale.py` | 67 | 执行层：仅覆盖校验 + 展示切片 |
| `stock_pdc/sustainable/arbitration.py` | — | 确定性仲裁、Final Gate、验收报告 |
| `scripts/pdc_sustainable.py` | 516 | CLI 入口 |
| `scripts/fetch_a_share_sina.py` | 304 | 东财 502 的替代抓取器 |
| `tests/test_sustainable_*.py` | 1104 | 120 个测试，全通过 |

---

## 2. 为什么新增了一个抓取器

`push2.eastmoney.com/api/qt/clist/get`（全市场枚举）对本机网络稳定返回
**HTTP 502**，从沙盒和用户自己的终端都复现。东财**单只**行情接口正常，
所以更像是针对批量枚举的拦截，而不是服务宕机。

替代方案，输出格式与 `fetch_a_share_eastmoney.py` 完全一致：

- **名单 + 市值**：新浪 `Market_Center.getHQNodeData`，分页覆盖全市场 5543 支（含北交所），`mktcap`/`nmc` 单位为万元
- **日线**：腾讯 `fqkline`，与原脚本同一来源

`run_latest_pdc.py --skip-fetch --run-dir <dir>` 可直接消费其产物。

**两阶段抓取**：先按市值筛（5543 → 678），只给幸存者下载 K 线。市值判定不依赖
K 线，所以候选池与「全量下载再筛」逐字相同，只是省掉 4865 次请求。60 日收益
规则仍在 Hawkeye 层、在真实 K 线上运行。

---

## 3. 冻结规则与其守护测试

| 规则 | 实现 | 守护测试 |
| --- | --- | --- |
| Hawkeye N 只全部进入 AI，禁止 Top-N 预筛 | `round_one.build_input` 接收完整池 | `test_a_seat_that_dropped_a_candidate_is_rejected` |
| 分批只限制单次响应，不限制池 | `round_one.batches` + 合并后集合比对 | `test_batching_partitions_the_pool_exactly_once` |
| Top-N 仅为展示切片 | `blue_whale.display_slice` | `test_top_n_is_a_view_over_a_ranking_it_does_not_change` |
| Blue Whale 不做判断 | 模块仅导出 `assert_full_coverage` / `display_slice` | `test_blue_whale_exposes_no_way_to_ask_a_model_to_decide` |
| 模型不得自带 total_score | `contracts.validate_scorecards` 显式拒绝 `score` 字段 | `test_a_seat_supplied_total_is_rejected` |
| 总分由引擎固定权重计算 | `arbitration.canonical_weights` 直接 import `DEFAULT_WEIGHTS` | `test_weights_come_from_the_engine_not_from_here` |
| 复议只能改本轮争议维度 | `round_two.validate_revisions` | 三个拦截测试 |
| `from_score` 必须与 R1 记录一致 | 同上 | 同上 |
| 修订必须带 `evidence_refs` | 同上 | 同上 |
| `revisions: []` 是合法答案 | schema `minItems: 0` | `test_an_empty_revision_list_leaves_everything_standing` |
| 少数意见不被平均掉 | `arbitration.arbitrate` 保留 `seatDimensions`/`seatTotals` | `test_a_wide_split_survives_the_merge` |
| 无 Round 3 | 代码中不存在该入口 | — |

---

## 4. 已执行的运行

```
run_id      market-2026-08-17-spec
snapshot    snap-2026-08-17-f02cae8d8d85
数据日期     2026-08-17（周一收盘）
候选池       303（全市场 5543 → 市值>300亿 678 → Hawkeye 303）
```

R1：Sol 303/303（13 批），Claude 303/303（13 批）
逐维度分歧（阈值 2.0）：190 支需复议，6 支高分歧
Round 2：Sol 90 处修订（19 批），Claude 187 处修订（19 批），合计 277 处
仲裁后高分歧：0 支（复议收敛了全部 6 支）
Final Gate：**PASS** — PASS 101 / REVIEW_REQUIRED 79 / BLOCK 123

验收 12/12 全 PASS。产物在 `outputs/sustainable/market-2026-08-17-spec/`：
`snapshot.json` `r1/{input,frozen,hashes}.json` `disagreement.json`
`round2/{ledger,revisions,final-*}.json` `arbitration.json` `final-gate.json`
`acceptance.json`

---

## 5. 工程上踩过的坑（供审阅时留意）

1. **严格结构化输出要求 `required` 覆盖 `properties` 全部键。** 把 `note` 设为可选
   → HTTP 400 `invalid_json_schema`。现有 `StrictSchemaTest` 递归检查全部三个
   schema。
2. **两个 CLI 的 schema 传递方式不同**：codex 用 `--output-schema <路径>`，
   claude 用 `--json-schema <内联JSON>`，且后者不接受 `$schema` 元引用
   （需 strip）。`SchemaDeliveryTest` 锁住这个差异。
3. **两个 CLI 的工具都被禁用**，所以席位读不到工作区文件。冻结事实改为**内联进
   prompt**。这也顺带保证了两席位收到逐字相同的证据。
4. **Round 2 并行会触发速率限制。** 单批约 20k 输出 token / 187 秒；两席位并行
   跑 19 批必挂。现已改为**席位串行 + 批间 15 秒 + 重试 120/240 秒指数退避**。
   并行是纯工程优化，取消它不影响任何结果。
5. **Round 2 批缓存需配合 `--reuse-r1`。** R1 每次重跑分数略有不同 → 分歧矩阵变
   → 批次内容变 → 缓存键永不命中。

---

## 6. 回测发现 —— ⚠️ 样本量严重不足，勿据此调参

2026-08-17 收盘建仓 → 2026-08-19 收盘，**仅 2 个交易日，单一急跌行情**
（沪深300 −3.15%，候选池均值 −3.91%）。

### 6.1 信息系数（Spearman IC）

| 信号 | IC | 控制 ATR 后 |
| --- | ---: | ---: |
| ATR 波动率（反向） | **0.686** | — |
| 距 20 日均线（反向） | 0.629 | — |
| 20 日动量（反向） | 0.526 | — |
| 确定性引擎 | 0.421 | **0.295** |
| Sol | 0.065 | 0.101 |
| Claude | −0.005 | 0.069 |

**这两天的主导因子是波动率和乖离**：高波动、高乖离的股票跌得最惨。引擎因内置
过热审计与风险经理而部分捕捉到该因子，所以表面领先。控制 ATR 后引擎仍剩 0.295，
说明并非全是 beta；而两个 AI 席位在控制后反而**变好**（被更强的波动因子淹没）。

**一条 `sort by ATR` 的规则打败了整套 PDC。** 这可能只是急跌行情下的必然结果
（低波动短期抗跌，长期收益通常也更低），也可能说明尺度不匹配 —— 引擎与 AI 的
设计尺度是 20 个交易日。

### 6.2 逐成员 IC vs 现有权重

| 成员 | 现权重 | IC | 控波动后 | 与 ATR 相关性 |
| --- | ---: | ---: | ---: | ---: |
| Livermore 突破 | 0.17 | 0.596 | 0.289 | −0.663 |
| 风险经理 | 0.18 | 0.609 | 0.285 | −0.687 |
| **终审主席** | **0.03** | 0.473 | **0.269** | −0.440 |
| 趋势跟随 | 0.18 | −0.231 | 0.236 | 0.552 |
| 过热审计 | 0.11 | 0.497 | 0.144 | −0.617 |
| **市场状态** | **0.09** | **0.000** | **0.000** | 0.000 |
| **诸葛猎户** | **0.02** | **0.000** | **0.000** | 0.000 |
| 量价分析 | 0.14 | −0.265 | −0.079 | 0.359 |
| 蜡烛形态 | 0.08 | −0.236 | −0.088 | 0.238 |

三点观察（**均需 20 日以上数据验证**）：

- **市场状态与诸葛猎户 IC 恰为 0**：它们评的是大盘环境与个人状态，对同一天的
  所有个股给出相同分数，因此对**横截面排序**零贡献，却占 11% 权重。这是结构性
  问题而非样本问题 —— 建议改为**全局开关**（影响整体仓位）而非个股加权项。
- **终审主席权重 0.03 但控波动后 IC 排第三**，与前两名几乎持平。
- **风险经理 / Livermore / 过热审计三者与 ATR 相关性均在 −0.6 以上**，合计 46%
  权重高度共线，三票投同一件事。

---

## 7. 待审查问题

1. **模型不符**：规格指定 OpenAI 席位为 `gpt-5.6-sol`，codex CLI 实际使用
   `gpt-5.6-terra`（默认值，代码未指定）。是规格笔误，还是需要显式
   `--model gpt-5.6-sol`？
2. **市场状态 / 诸葛猎户的横截面权重**是否应移出九维加权，改为全局调节？
   这是结构性问题，不依赖回测样本量。
3. **共识分弱于 Sol 单独**（IC 0.032 vs 0.065）。等权平均是否合适？规格
   §8 规定「两席初始权重相等」—— 是否保留，还是留待长期表现数据后再定？
4. **Round 2 的成本**：190/303 触发复议，单批约 187 秒 / 20k 输出 token。
   全量复议约 1 小时、$12 等值订阅消耗。阈值 2.0 是否维持？
5. `logs/` 与 `Claude 登录.command` 为运行副产物与一次性工具，是否纳入 git 忽略。

---

## 8. 复现方式

```bash
# 抓数据（全市场 → 市值筛 → K线）
python3 scripts/fetch_a_share_sina.py \
  --data-dir "data_a_share_latest_runs/run_$(date +%Y%m%d_%H%M%S)" \
  --universe-csv outputs_a_share/a_share_universe.csv --bars 360

# Hawkeye + 九成员（既有脚本，未改动）
python3 scripts/run_latest_pdc.py --skip-fetch --run-dir <上一步目录> --top 20

# 双席位委员会（不要带 --allow-stale，新鲜度护栏是刻意的）
python3 scripts/pdc_sustainable.py pdc --scores-csv outputs/full_pdc_scores.csv

# 席位可用性自检
python3 scripts/pdc_sustainable.py doctor
```

全部输出为研究标签，`researchOnly: true` / `liveTrading: false` 贯穿所有契约。

---

# DAILY_TOP10 —— 日常路径（2026-08-19 新增）

## 9. 为什么要另开一条路径

FULL_COMMITTEE 一天的实际消耗是：R1 每席 13 批、R2 每席 19 批，合计 60+ 次调用、
约 1 小时。5 小时额度窗口撑不住这个节奏，而它产出的是 303 支的完整排名 ——
日常真正要看的只有 10 个席位。

DAILY_TOP10 把「谁值得细看」和「细看之后怎么排」拆成两件事：

```
硬资格检查 → 双模型各出 Top30（1 次调用）
           → 并集 30–60 只
           → 双模型九维详评（1 次，缺口才补第 2 次）
           → 初步 Top20
           → 双模型匿名交叉终审（1 次）
           → 确定性共识 → 最终 10 席位 / CASH
```

每席位 **3 次调用**（最差 4 次），实测 prompt 规模：发现轮 33.7k 字符、
详评轮 48.6k、终审轮 37.2k（2026-08-17 数据，硬资格后 297 支）。

## 10. 新增文件

| 文件 | 行数 | 职责 |
| --- | ---: | --- |
| `stock_pdc/sustainable/daily/__init__.py` | 22 | 运行模式常量与路径说明 |
| `stock_pdc/sustainable/daily/sources.py` | 220 | 读评分 CSV / 全市场名单 / K 线并按 ticker 合并 |
| `stock_pdc/sustainable/daily/facts.py` | 291 | 冻结事实表、fact_id 注册表、三种投影渲染 |
| `stock_pdc/sustainable/daily/eligibility.py` | 163 | 硬资格：ST / 停牌 / 流动性 / 新鲜度 / K 线完整性 |
| `stock_pdc/sustainable/daily/contracts.py` | 380 | 三轮严格 schema 与校验器 |
| `stock_pdc/sustainable/daily/quota.py` | 180 | 调用预算与账本（次数 / 字符 / 耗时） |
| `stock_pdc/sustainable/daily/discovery.py` | 234 | 第一轮：独立 Top30 + 并集 |
| `stock_pdc/sustainable/daily/detail.py` | 213 | 第二轮：九维详评 + 只补缺口 |
| `stock_pdc/sustainable/daily/review.py` | 258 | 第三轮：匿名交叉终审 |
| `stock_pdc/sustainable/daily/consensus.py` | 119 | 复用仲裁层 + UNRESOLVED 标记 |
| `stock_pdc/sustainable/daily/selection.py` | 373 | 最终门槛、10 席位、CASH、仓位 |
| `stock_pdc/sustainable/daily/report.py` | 287 | `daily_top10.csv` / `.html` / 历史与昨日名次 |
| `stock_pdc/sustainable/daily/orchestrator.py` | 419 | 串起全流程与降级阶梯 |
| `scripts/pdc_daily_top10.py` | 301 | CLI：`plan` / `run` / `show` |
| `tests/test_daily_*.py` | 1782 | 144 个新增守护测试 |

**复用而非重写**：九维定义、`RISK_FLAGS`、`DECISIONS`、打分卡 schema 与其校验器、
`DEFAULT_WEIGHTS`、逐维度分歧矩阵、确定性仲裁、匿名包与盲审校验、`_technical_stop`
/ `_breakout_trigger`、`indicators.*`、`data_loader` 全部直接 import。

## 11. 既有代码的三处改动（第 1 节的「零改动」到此为止）

1. `stock_pdc/sustainable/round_one.py::consensus()` 原先读 `card["score"]`，
   但 `validate_scorecards` 明确**拒绝**模型自带 `score` —— 该函数（以及
   `pdc_sustainable.py r1` 子命令）对任何真实数据都会 `KeyError`。已改为用
   `arbitration.canonical_total` 从九维按引擎权重本地计算。
2. 同文件 R1 prompt 要求模型给出 `an overall score` 和 `rationale` 两个 schema
   里并不存在的字段（严格结构化输出会直接拒收）。已改为要求 `note` 并明确说明
   总分由本地计算。
3. `tests/test_sustainable_round_one.py` 的 `card()` fixture 造了带 `score` 的
   打分卡 —— 正因如此上面的 bug 一直没被测出来。已改为符合真实契约的形状，并加了
   一条回归测试。

`scripts/pdc_sustainable.py` 另加了一行 banner，声明它是 FULL_COMMITTEE 离线审计
模式。数据抓取、Hawkeye、九维定义、`DEFAULT_WEIGHTS`、`decision_memory`、
`run_latest_pdc.py`、`stage_executor.py` 仍然一行未改。

## 12. 冻结规则与其守护测试

| 规则 | 实现 | 守护测试 |
| --- | --- | --- |
| 每模型每天最多 4 次调用 | `quota.ROUND_BUDGET` + `guarded_invoke` | `test_a_round_that_exceeds_its_budget_raises_instead_of_skipping` |
| 正常一天 = 每席 3 次 | 三轮各 1 次 | `test_a_normal_day_costs_three_calls_per_model` |
| 第二轮失败只补缺口，不整轮重跑 | `detail.score_one` 的 `outstanding` 循环 | `test_a_truncated_answer_re_asks_only_for_what_is_missing` |
| 第二轮最多 2 次 | `ROUND_BUDGET["detail"] = 2` | `test_the_round_never_costs_more_than_two_calls_per_seat` |
| 两席位必须覆盖完全相同的 ticker 集合 | `detail.assert_identical_coverage` | `test_both_seats_must_cover_exactly_the_same_names` |
| 并集 30–60，不投票不配额 | `discovery.union_of` | `test_the_union_is_every_name_either_seat_nominated` |
| 提名必须恰好 30 个且 rank 为 1..30 排列 | `contracts.validate_picks` | 4 条拦截测试 |
| 模型不得自带 total_score | 复用 `validate_scorecards` | `test_a_seat_supplied_total_is_still_rejected` |
| 终审只能引用已有 fact_id | `contracts.validate_assessments` | `test_a_revision_must_cite_a_fact_id_that_exists` |
| 终审 `from_score` 必须与第二轮一致 | 同上 | `test_from_score_must_match_the_detail_round` |
| 终审不得重新生成整套评分 | schema 无该字段 + 上面两条 | `test_a_revision_that_changes_nothing_is_rejected` |
| 空修改列表是合法答案 | schema `minItems: 0` | `test_an_empty_revision_list_is_a_complete_answer` |
| 席位看不到公司名 | `facts` 只带 ticker + 数值 | `test_no_company_name_reaches_a_seat` |
| 席位看不到引擎结论 | 事实表不含 score/rank/status | `test_no_engine_score_rank_or_verdict_reaches_a_seat` |
| 两席位收到逐字相同的证据 | 同一个 payload 对象 | `test_the_discovery_prompt_is_byte_identical_for_both_seats` |
| 终审匿名 | 复用 `build_peer_packet` + `assert_packet_is_blind` | `test_a_seat_never_learns_who_wrote_the_other_scores` |
| BLOCKED 标的永不进入任何轮次 | 硬资格在第一轮之前 | `test_a_blocked_candidate_never_appears_in_any_seat_payload` |
| 最终恰好 10 个席位 | `selection.select` 补 CASH | `test_a_full_day_fills_exactly_ten_seats` |
| 不得用较差标的凑满 10 个 | 空席位 = CASH | `test_nothing_below_the_gate_is_promoted_to_reach_ten` |
| UNRESOLVED 不得买入，由下一名递补 | `consensus` 标记 + `gate_candidate` | `test_the_next_name_takes_the_seat` |
| 市场/姿态只调敞口，不调排序 | `exposure_factor` 只进 `allocate` | `test_exposure_never_reorders_the_cross_section` |
| 同日重跑不算「昨日」 | `report.load_previous` 只取更早交易日 | `test_rerunning_the_same_session_is_not_treated_as_a_new_day` |
| DAILY_TOP10 不进旧的全池 Round 2 | 独立子包 | `test_the_daily_path_never_enters_the_full_pool_round_two` |
| 权重仍来自引擎 | `canonical_weights()` | `test_the_committee_weights_still_come_from_the_engine` |

## 13. 降级阶梯

| 触发 | 状态码 | 行为 |
| --- | --- | --- |
| 任一席位第一轮失败 | `R1_SEAT_FAILED_CARRY_FORWARD` | 不产生任何新 BUY；沿用昨日名单（逐个重新过硬资格），不足补 CASH |
| 任一席位第二轮失败 | `R2_SEAT_FAILED_CARRY_FORWARD` | 同上。单模型结果**不得**独自产出日常清单 |
| 昨日无名单且发生上述降级 | 同上 | 10 个席位全部 CASH |
| 终审轮额度不足 | `R3_SKIPPED_QUOTA` | 安全降级为第二轮共识，仍可产生 BUY |
| 终审轮任一席位失败 | `R3_FAILED_USED_R2` | 同上 |
| 两席位终审后总分差 > 阈值（默认 1.5） | 该股 `UNRESOLVED_DISAGREEMENT` | 不得进入 BUY，席位由下一名递补 |
| 数据超过 4 天 | 直接拒绝运行 | 需显式 `--allow-stale` |

## 14. 最终 10 席位的门槛

按顺序应用（全部为确定性规则，无模型参与）：

1. **硬资格**（在第一轮之前）：K 线缺失/不足 200 根、bar 日期或行情日期 ≠ 分析日、
   ST/*ST/退市、成交额为 0（停牌）、成交额 < 5000 万（流动性）
2. **风险硬底**：`risk_score ≤ 3.5` 或引擎 `final_status == Remove` → 不得占席位
3. **未解决分歧**：`UNRESOLVED_DISAGREEMENT` → 不得买入
4. **入场门槛**：共识总分 ≥ 6.0、`risk_score ≥ 5.0`、`overheat_score ≥ 3.0`、
   收盘距技术止损 ≤ 12%（缺止损即不得新买）
5. **行业集中度**：单行业最多 3 席（**需要行业映射文件，缺失时报
   `INACTIVE_MISSING_DATA`，不用代码前缀假装行业**）
6. **换手缓冲**：昨日持仓名次滑到 10+3 以内保留席位（HOLD）；仍在名单但不满足
   入场门槛记 PAUSE（不加仓也不强制卖）；滑出缓冲或变得不可交易则让出席位
7. **补位**：剩余席位从排名顶部依次填 BUY；填不满就是 CASH

仓位：10 个等权席位 × 敞口系数。敞口系数 = 市场状态档位 × 个人姿态系数，
只影响投多少，不影响谁排前面。2026-08-17 的 `market_regime_score = 6.5` →
档位 0.9，姿态未设 → 1.0，故每个股票席位 9%，现金储备 10%。

## 15. 产物

日常主产物（唯一需要看的）：

```
outputs/daily_top10.csv
outputs/daily_top10.html
outputs/daily_top10_history.csv      # 昨日名次与 rank_change 的来源
```

CSV 字段固定为：`rank, ticker, name, action, allocation_pct, main_reason,
main_risk, technical_stop_reference, previous_rank, rank_change,
as_of_trade_date, data_freshness_status, runtime_mode`。

审计产物在 `outputs/sustainable/daily/<run_id>/`：

```
eligibility.json   snapshot.json     facts.json
d1-input.json      d1-discovery.json d1-union.json
d2-detail.json     d2-consensus.json
d3-preliminary.json d3-review.json   d3-ledger.json  d3-consensus.json
d3-final-<席位>.json                 # 终审后的矩阵；改前矩阵在 d2-detail.json
selection.json     quota.json        run.json
daily_top10.csv    daily_top10.html
```

## 16. 命令

```bash
# 0. 离线预检：只读文件，不调用任何模型，打印候选数与三轮 prompt 规模
python3 scripts/pdc_daily_top10.py plan

# 1. 抓数据（东财 502 的替代抓取器）
python3 scripts/fetch_a_share_sina.py \
  --data-dir "data_a_share_latest_runs/run_$(date +%Y%m%d_%H%M%S)" \
  --universe-csv outputs_a_share/a_share_universe.csv --bars 360

# 2. Hawkeye + 九成员（既有脚本，未改动）
python3 scripts/run_latest_pdc.py --skip-fetch --run-dir <上一步目录> --top 20

# 3. 席位自检
python3 scripts/pdc_sustainable.py doctor

# 4. 受控真实验收：一天，两个席位各 3 次调用
python3 scripts/pdc_daily_top10.py run --run-id acceptance-$(date +%Y%m%d)

# 5. 只看结果
python3 scripts/pdc_daily_top10.py show
```

离线测试（不调用任何模型）：

```bash
for f in tests/test_*.py; do PYTHONPATH=. python3 "$f" || echo "FAILED: $f"; done
```

## 17. 已知缺口 / 待审查

1. **行业集中度目前是空规则**。仓库里没有任何行业字段（新浪 universe CSV 也没有），
   所以默认 `INACTIVE_MISSING_DATA`。要启用需提供 `{ticker: 行业}` 的 JSON 并用
   `--sector-map` 传入。**没有用代码前缀（300/688/BJ）冒充行业** —— 那是交易所和板块，
   不是行业。
2. **敞口档位（0.5/0.7/0.9/1.0）与姿态系数是新引入的策略常量**，不来自任何回测。
   它们只影响仓位不影响排序，但仍应由你确认数值。
3. **止损距离上限 12%、换手缓冲 3 名、单行业 3 席、分歧阈值 1.5** 同样是新常量，
   全部可通过 CLI 覆盖，默认值需要你的判断。
4. **引擎 `final_status == Remove` 默认不在硬资格阶段剔除**（2026-08-17 数据里那会
   在任何模型看之前砍掉 303 中的 122 支）。它仍在最终门槛处拦截。如果你认为日常路径
   应该更省，`--block-engine-remove` 可以打开。
5. **`main_reason` 取两席位中 confidence 较高者的 note**，平手按 member_id 字典序。
   `main_risk` 是引擎 `main_risk` 加两席位风险标记的并集。这是可讨论的选择。
6. **尚未做真实模型跑通**。本阶段只完成代码、离线测试与复现命令；144 个新测试全部
   用假席位驱动，真实 CLI 的 schema 传递差异沿用 FULL_COMMITTEE 已验证的方式
   （codex `--output-schema` 文件、claude 内联 `--json-schema` 且需 strip `$schema`）。
7. **第三轮两席位并行**。FULL_COMMITTEE 的教训是并行 R2 会触发速率限制，但那是
   19 批 × 20k 输出 token；这里是每席 1 次、输出约 20 条断言。若真实运行仍触发限流，
   改成串行不影响任何结果。
