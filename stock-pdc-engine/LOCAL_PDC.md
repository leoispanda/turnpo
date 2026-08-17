# 选股神器

这是股票 PDC 的本地应用「选股神器」：它提供一个只绑定本机回环地址的 Dashboard，并允许页面安全地打开当前 PDC 工程的 Codex 工作区。1–9 个确定性 Stage、Attempt、Checkpoint 和 STALE 追踪均在本机运行。

## 启动

推荐双击：

```text
选股神器.app
```

如果 Finder 没有直接显示 App，也可以双击：

```text
选股神器.command
```

注意：不要在 Codex 的文件树里点击这两个文件。Codex 会把它们当作源码打开；请在 Finder 中右键工程目录，选择“在 Finder 中显示”，再双击启动器。

也可以在项目目录执行：

```bash
python3 scripts/start_pdc_local.py
```

服务启动后会自动打开：

```text
http://127.0.0.1:8765
```

不希望自动打开浏览器时：

```bash
python3 scripts/start_pdc_local.py --no-browser
```

## 当前功能边界

- 显示本地服务、Codex 和 PDC Core 状态。
- 显示 1–9 Stage 的 Run 状态：`NOT_STARTED`、`CANDIDATE`、`VALID`、`STALE`。
- 当 Stage 09 已选定时，在页面直接显示研究候选、观察与排除数量，以及前 12 条最终研究结论和主要风险。
- 页面中的「逐 Stage 文件审计」支持访问每个 Stage 的每个历史 Attempt；可完整读取 `input.json`、`config.json`、`output.json`、`validation.json`、`checkpoint.json`、`audit.json`，并显示文件大小和 SHA256。
- 新建本地 Run，并将 Run/Attempt/Checkpoint 保存到 `runs/<run-id>/`。
- 创建 schema-only Attempt、校验 Checkpoint、选择当前版本；替换上游版本后，下游自动标记为 `STALE`。
- 查看 Resume 计划和两个 Attempt 的结构化 Diff。
- 显示已有可信 Run 的基本索引（如果存在）。
- 通过固定白名单动作打开 Codex，并固定进入 `stock-pdc-engine` 工作区。
- 对 Stage 03、05、06、07、08、09 可按页面按钮启动一次独立的 Codex 只读复核。复核工作区只含已选择的上游输出和固定 JSON 契约；页面不能传入提示词、路径或命令。
- Codex 复核状态、原始本地事件和结果保存于 `runs/<run-id>/codex-jobs/<job-id>/`。复核是审计证据，永远不会自动选择或改写任何 Checkpoint。
- 不接受页面传入任意路径或任意系统命令。
- 已接入本地确定性 Stage 执行：每次运行都会创建新的 Attempt，默认不自动选择，页面可先检查再选择 Checkpoint。
- 当前执行读取工程内的历史 OHLCV/元数据文件，不调用外部模型 API。只有用户点击「使用 Codex 复核（只读）」时，才会发起一次 Codex 作业。
- 本地 Stage 和 Codex 复核输出均明确标记为研究模式；它们不是投资建议。
- 实盘交易始终关闭。

## 本地状态接口

Dashboard 已经使用以下本机接口；它们只接受 `127.0.0.1` / `::1` 请求：

```text
GET  /api/health
GET  /api/system/status
GET  /api/runs
POST /api/runs
GET  /api/runs/<run-id>
POST /api/runs/<run-id>/resume
POST /api/runs/<run-id>/stages/<stage-id>/execute
POST /api/runs/<run-id>/stages/<stage-id>/codex-review
POST /api/runs/<run-id>/stages/<stage-id>/attempts
GET  /api/runs/<run-id>/stages/<stage-id>/attempts/<attempt-id>
GET  /api/runs/<run-id>/stages/<stage-id>/attempts/<attempt-id>/files
GET  /api/runs/<run-id>/stages/<stage-id>/attempts/<attempt-id>/files/<input.json|config.json|output.json|validation.json|checkpoint.json|audit.json>
POST /api/runs/<run-id>/stages/<stage-id>/attempts/<attempt-id>/validate
POST /api/runs/<run-id>/stages/<stage-id>/select
GET  /api/runs/<run-id>/stages/<stage-id>/diff?left=attempt-001&right=attempt-002
GET  /api/runs/<run-id>/codex-jobs/<job-id>
POST /api/runs/<run-id>/codex-jobs/<job-id>/cancel
POST /api/codex/open
POST /api/server/stop
```

例如，页面上的“新建本地 Run”只会创建状态容器，不会触发模型调用或交易动作。点击 Stage 的“运行”会调用本地确定性 Core，生成新的 Attempt；只有被选择并通过校验的 Attempt 才能成为当前 Checkpoint。上游替换会让依赖它的下游自动失效，Resume 会从最早失效 Stage 继续。

Run 可以在创建时携带执行配置：

```json
{
  "metadata": {
    "executionConfig": {
      "dataDir": "data_a_share_latest_runs/run_20260809_171554",
      "metadataCsv": "outputs_a_share_latest_runs/run_20260809_171554/a_share_universe.csv",
      "topN": 20,
      "asOf": "2026-08-11"
    }
  }
}
```

Stage 1 会把输入事实冻结到自己的 Attempt；Stage 2–9 只读取当前有效的上游 Checkpoint。Stage 3/5 当前使用本地确定性成员评分，Stage 9 只输出研究候选、观察或排除，不产生下单动作。

## CLI

Dashboard 之外也可以使用同一套本地状态引擎：

```bash
python3 scripts/pdc_local.py run
python3 scripts/pdc_local.py run --run <run-id> --stage 5 --select
python3 scripts/pdc_local.py validate --run <run-id> --stage 5 --attempt attempt-002
python3 scripts/pdc_local.py diff --run <run-id> --stage 5 --attempt attempt-001 attempt-002
python3 scripts/pdc_local.py resume --run <run-id>
python3 scripts/pdc_local.py show --run <run-id>
```

CLI 的完整 `run` 会在每一步自动选择新 Attempt 以推进 1–9；Dashboard 的“运行”按钮则保持先生成、后人工选择的检查优先模式。

## 目录约定

```text
runs/<run-id>/
  run.json
  events.ndjson
  stages/stage-XX/attempt-YYY/
    input.json
    config.json
    output.json
    validation.json
    checkpoint.json
    audit.json
```

`runs/` 已加入忽略规则，适合保存本机运行记录；如果需要交付某次结果，应另行导出经过最终 Gate 的报告，而不是直接把临时 Attempt 当成结论。

## 停止

在启动窗口按 `Ctrl-C`，或后续在 Dashboard 中使用停止服务按钮。
