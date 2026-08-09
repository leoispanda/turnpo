# Stock PDC Engine

Turnpo 内统一维护的股票 PDC 研究与追踪系统。以后对筛选逻辑、PDC 成员和自动同步的修改均在此目录实施。

第一版只做本地分析、观察名单、纸面记录和复盘输出；不连接真实券商账户，不下真实订单。

## 架构

`股票大作手` 是主调度器，负责读取数据、循环调用 PDC 成员、汇总评分、生成 Top 20、保存历史记录和 HTML 报告。

Pre-PDC 选股 Skill：

- 鹰眼雷达：先从大股票池筛出候选池，避免 PDC 大海捞针。

PDC 成员：

1. Market Regime Judge
2. Trend Follower
3. Livermore Breakout Trader
4. Volume-Price Analyst
5. Candlestick Pattern Analyst
6. Overheat Auditor
7. Risk Manager
8. Zhuge Orion
9. Final Portfolio Chair

前七个成员分析市场和股票。Candlestick Pattern Analyst 读取日本蜡烛图形态，判断短线价格行为、入场时机和追高风险。Zhuge Orion 分析个人风险姿态，判断当前更适合激进、平衡还是保守。Final Portfolio Chair 读取前面所有结果，给出最终整合判断。股票大作手负责整个 loop 和输出。

鹰眼雷达只筛选两个条件：

- 总市值 > 300 亿人民币
- 近 60 日收益 > 0%

均线趋势、量价、突破、过热和下行风险都由 PDC 成员分析，不作为鹰眼的一票否决条件。每日流程仍然严格先运行鹰眼，再只对鹰眼候选池运行 PDC；候选不足 20 只时不用全市场股票补位。

## 安全规则

- `ENABLE_LIVE_ORDERS=false`
- 不连接真实券商账户。
- 不读取或保存券商密码、交易密码、短信码、UKey、cookie、证书或 API token。
- 不做屏幕自动化或 GUI 点击。
- 真实下单接口在本版本会直接报错。
- 输出只用于研究、观察名单、纸面记录和人工复核。

## 数据

默认读取：

```text
data/prices/
```

每个 CSV 至少包含：

```text
date, open, high, low, close, volume
```

示例：

```text
600519.SH.csv
000001.SZ.csv
300750.SZ.csv
```

也可以通过 `--universe` 或 `--data-dir` 指定其它目录。

鹰眼雷达还需要 ticker metadata，默认读取：

```text
outputs_a_share/a_share_universe.csv
```

其中必须有 `ticker` 和 `total_mcap`。如果 `total_mcap` 为空，股票不会通过总市值筛选。

## 运行

完整 PDC loop：

```bash
python scripts/run_pdc.py --top 20 --use-radar
```

只运行鹰眼雷达：

```bash
python main.py --radar-only
```

先用鹰眼雷达筛候选池，再跑 PDC：

```bash
python scripts/run_pdc.py --top 20 --use-radar
```

历史回推 Top 20 推荐和持仓规则：

```bash
python scripts/run_historical_replay.py --start 2025-08-01 --end 2026-06-26 --top 20 --hold-days 1,5,10,20 --trailing-stop-pct 10
```

历史回推会同时输出两种 Top 20 组合策略：

- `membership_portfolio_*`: 跌出 Top 20 后，次日卖出；新晋 Top 20 后，次日买入。
- `trailing_stop_portfolio_*`: 买入后不因为跌出 Top 20 自动卖出；只要持仓没有从买入后的确认最高价回撤到 `--trailing-stop-pct` 指定比例，就继续持有；若次日开盘低于止损线按开盘卖出，若盘中最低价触发止损线按止损线卖出。日线数据无法知道盘中先后顺序，因此这是基于日线 OHLC 的近似回测。

历史回推保留了旧版“前 30 / 20-20 宽度闸门”，仅用于保证已冻结回测的可比性；它不是正式每日流程的筛选规则。每日闸门状态会写入 `selection_gate_audit.csv`，逐股候选通过/拒绝原因会写入 `candidate_screen_audit.csv`。

正式每日 PDC 不使用 20/20 的凑数闸门：鹰眼通过的股票不足 20 只时，照常进入 PDC；每日购买清单最多 20 只，但只保留 `Strong Watch` 或 `Trial Position` 的即时买入候选。`Watch`、`Breakout Pending`、`Wait for Pullback`、`High Risk Watch` 和 `Remove` 只进入观察榜，不强买。没有即时买入候选时，系统仍生成观察榜和完整评分，但 `daily_purchase_instruction.csv` 为空，命令行会提示只关注已有仓位止损。历史回推的 20/20 宽度闸门保持不变，以保证已记录回测可比。

每日持仓目标等于 `daily_purchase_instruction.csv` 的即时买入名单。已有仓位不在目标名单时，默认在下一交易日开盘手动卖出；只有趋势分数至少 7.0，且现价仍在技术止损线上方，才标记为保留。跌出 Top 20 而趋势仍完整时同样可保留；趋势不完整则卖出。系统只生成手工计划与监控，不连接券商或自动下单。

## 股票大作手 A/B

从 2026-07-10 至 2026-07-17 收盘信号，系统把原有逻辑冻结为股票大作手 A，并以前瞻方式同时记录股票大作手 B1。该实验的算法、历史和信号保持冻结；不能用 2026-07-18 起生效的严格雷达规则回填或改写。

- 旧 A：当时的最终综合分 Top 20；截至 2026-07-17 的已冻结输出继续保留。
- B1：趋势百分位 45% + 突破百分位 35% + 量价百分位 20% 形成 Alpha 排名；新仓限 Alpha Top 15，并通过市场、风险、过热、K 线与止损距离门槛。
- B1 单票按净值 0.4% 风险预算确定仓位，单票不超过 5%，总仓位再受市场状态、当前组合回撤和 12% 年化波动目标约束；不用的仓位保留现金，不加杠杆。
- 跌出 Top 20 的持仓不会仅因掉榜自动卖出：冻结的未复权信号日收益为正时标记 `HOLD_DROPPED_UP_DAY`，非上涨或无法核验时标记 `SELL_REVIEW_DROPPED`。预先声明的独立风险止损仍可优先。
- Zhuge Orion 在 B1 只保留 shadow 分数，不能提高 Alpha 排名、仓位或覆盖市场、风险和过热否决。行业上限因当前数据缺少行业字段而明确标记为 `INACTIVE_MISSING_DATA`。

每日最新数据守卫流程默认运行上述两条规则的鹰眼后的前瞻 A 线。2026-07-10 启动的旧 A/B 实验保持冻结，不因新策略规则而改写；如需继续比较，必须另建新的前瞻实验版本：

```bash
python3 scripts/run_latest_pdc.py --top 20
```

只有在显式创建了兼容的新实验版本后，才应传入 `--variants a,b`；不能把当前鹰眼策略写入旧 A/B 历史。

当前鹰眼 A 线的显式运行方式为：

```bash
python3 scripts/run_latest_pdc.py --top 20 --variants a
```

A/B 正式账本只接受已验证的最新交易日，信号在收盘后冻结，并只在下一基准交易日开盘按相同费用、涨跌停、T+1 和缺失行情规则执行。同一市场日重复运行必须完全幂等；内容变化会被拒绝并要求创建 B2 或新实验，不能覆盖 B1。

收益比较同时保存两条线：

- `selection`：A、B 都用 Top 20、100% 等权，仅检验选股排序。
- `portfolio`：A 原组合政策对比 B 风险仓位与现金政策，检验最终收益和回撤。

至少积累 60 个共同交易日后，只有 B 扣除研究费用后的收益更高且最大回撤不劣于 A，才标记 `B_WIN`。当前账本是未复权实际价格的价格收益，已计模型费用但尚未计入现金分红，因此不是含红利总收益。

指定股票单个 skill：

```bash
python main.py --ticker 600519.SH --skill trend
python main.py --ticker 600519.SH --skill risk
python main.py --ticker 600519.SH --skill zhuge
```

指定股票全部 PDC 成员：

```bash
python main.py --ticker 600519.SH --all-skills
```

带个人风险姿态：

```bash
python main.py --ticker 600519.SH --all-skills --zhuge-posture conservative
python scripts/run_pdc.py --top 20 --zhuge-posture balanced
```

`--zhuge-bazi` 和 `--zhuge-fortune` 可作为 Zhuge Orion 的个人输入；如果未提供，Zhuge Orion 默认中性，不主动改变系统风格。

指定其它股票池：

```bash
python main.py --universe data_a_share --pdc-loop
```

## 输出

默认输出到 `outputs/`：

```text
outputs/a_share_top20.xlsx
outputs/candidate_universe.csv
outputs/full_pdc_scores.csv
outputs/hawkeye_radar_audit.csv
outputs/scoring_history.csv
outputs/pdc_report.html
outputs/leaderboard.html
outputs/daily_leaderboard_changes/leaderboard_changes_YYYY-MM-DD.csv
outputs/leaderboard_changes_history.csv
```

`candidate_universe.csv` 只包含通过鹰眼雷达的候选股票。`hawkeye_radar_audit.csv` 包含所有被检查股票及剔除原因。

## 网站可信 Run 产物

`scripts/run_latest_pdc.py` 成功完成全市场抓取、日期校验和 PDC 后，会把以下文件复制到不可变目录 `outputs/runs/<run-id>/`：

```text
candidate_universe.csv
hawkeye_radar_audit.csv
full_pdc_scores.csv
display.json
manifest.json
```

写入 `outputs/latest_ready_run.json` 只表示本地 Run 已验证，**不会**自动提交、部署或更新网站。`manifest.json` 记录每个产物的 SHA-256；`display.json` 是网站每日 Top 20 页面唯一可发布的展示载荷。网站发布服务必须先把该文件放到 `/stock-pdc/runs/<run-id>/display.json`，再携带其 SHA-256 回调并在页面中执行发布。浏览器不参与候选股票或筛选条件的传递。

## PDC Decision Memory 与绩效追踪

每次完整 PDC loop 成功后，系统会追加写入：

```text
logs/YYYY-MM-DD_PDC_DECISION.md
outputs/performance/pdc_performance.sqlite
outputs/performance/pdc_performance_report.md
```

审计日志保存执行时间、行情时间戳、完整股票池、鹰眼逐股结果、每只股票的全部角色评分及理由、BUY/SELL/HOLD 研究结论、置信等级和实际执行状态。实际执行状态固定为 `NOT_EXECUTED_RESEARCH_ONLY`；系统不连接券商。

SQLite 使用 `pdc_runs`、`role_predictions`、`model_runs` 与 `model_predictions` 四张表，保留未来真实模型接入和动态权重研究所需的独立模型/角色维度。当前 PDC 是确定性引擎，未调用 GPT、Claude 或其他模型，因此日志和报告明确显示没有模型预测，绝不伪造模型评分或摘要。

## 五模型 PDC 的追加审计层

既有的 01–07 多模型流程、Top 30/20/10、Round 2 和正式决策不被此层修改。每一个已验证 Run 会额外生成：

```text
outputs/runs/<run-id>/committee/02_market_data_package/
```

其中的 `market_data_package.json` 冻结并哈希鹰眼审计、候选池和确定性 PDC 全量评分；五个模型必须引用同一 `packageSha256`。受保护计算服务在已有阶段完成后，通过 `scripts/record_committee_stage.py` 追加记录 01、03、04、05、06 或 07 的真实输出。该命令拒绝覆盖已存在阶段；Round 1 和 Round 2 必须分别包含 GPT、Claude、Gemini、DeepSeek、Kimi 五个真实 `COMPLETED` 或 `FAILED` 回传，缺少密钥、超时或格式异常必须写为 `FAILED`，不得填补分析。

该审计层只保存和统计现有流程结果；不会改动鹰眼规则、PDC 权重、Top 30/20/10 或正式 BUY/WATCH/HOLD/SELL 结论。

角色绩效的固定观察窗口默认是预测后 20 个交易日：分数大于等于 6 记录为看多、分数小于等于 4 记录为看空，介于两者之间为中性。中性预测保留在审计中，但不计入胜率，避免通过模糊方向虚增准确率。后续行情尚不足 20 个交易日时保留 `PENDING`；缺少后续数据会记录 `FAILED`。该报告只记录证据，不会改变当前 PDC 权重。

B 与 A/B 评估严格使用独立路径：

```text
outputs_b/full_pdc_scores.csv
outputs_b/daily_watchlists/watchlist_YYYY-MM-DD.csv
outputs_b/daily_research_plan.csv
outputs_b/strategy_manifest.json

outputs_ab/experiment.json
outputs_ab/run_manifests/snapshot_YYYY-MM-DD.json
outputs_ab/signals/signal_YYYY-MM-DD.csv
outputs_ab/signal_history.csv
outputs_ab/price_observations.csv
outputs_ab/trades.csv
outputs_ab/daily_nav.csv
outputs_ab/comparison.csv
outputs_ab/summary.json
```

榜单变化输出会把当日 Top 20 和最近一个历史 Top 20 对比，标记：

- NEW: 新晋 Top 20
- DROPPED: 跌出 Top 20
- UP: 留榜且名次上升
- DOWN: 留榜且名次下降
- UNCHANGED: 留榜且名次不变

Top 20 Excel 包含：

- ticker
- rank
- final score
- final status
- 每个 PDC 成员分数：Market Regime、Trend、Livermore Breakout、Volume-Price、Candlestick、Overheat、Risk、Zhuge Orion、Final Chair
- main reason
- main risk
- suggested action status
- analysis date

每日推荐输出 `outputs/daily_purchase_instruction.csv` 最多生成 20 个、但不强求凑满；仅 `Strong Watch` 和 `Trial Position` 会进入手工购买计划，`instruction` 为 `BUY_PDC_APPROVED_MANUAL`。输出保留每个 PDC 成员分数、最终状态、技术止损和主要风险。命令行摘要会在每支推荐下方打印 `members:` 分数行。实盘下单仍然禁用，系统只输出研究和手工执行参考。

## 默认权重

- Market Regime Judge: 9%
- Trend Follower: 18%
- Livermore Breakout Trader: 17%
- Volume-Price Analyst: 14%
- Candlestick Pattern Analyst: 8%
- Overheat Auditor: 11%
- Risk Manager: 18%
- Zhuge Orion: 0%
- Final Portfolio Chair: 5%

Zhuge Orion 第一版默认不直接改变加权分数，而是作为个人节奏和状态约束信号。保守或防守姿态会限制过于激进的最终状态。

## 最终状态

- Strong Watch
- Watch
- Breakout Pending
- Wait for Pullback
- Trial Position
- High Risk Watch
- Remove

每日购买策略使用 `BUY_PDC_APPROVED_MANUAL` 表示 PDC 已确认的即时买入候选；榜单不足 20 只或没有买入候选均属正常，不会补位或强买。`final_status` 和 `main_risk` 仍用于人工风险复核。Live trading remains disabled.
