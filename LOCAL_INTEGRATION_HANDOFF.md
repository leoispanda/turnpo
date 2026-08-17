# Turnpo → stock-pdc-local Integration Handoff

> Historical handoff. 当前 generic Provider Gateway handoff 是根目录 `LOCAL_PROVIDER_HANDOFF.md`；本文件保留此前 PDC-specific publish/scorecard integration notes。

状态：`OPENAI_REAL_SHADOW_PARTIALLY_READY`  
目标：给 Local PDC 一个不持有 Provider secret、可版本化、可机器调用的 Turnpo 接入说明。

## 1. 固定边界

```text
stock-pdc-local
  ├─ market data / Hawkeye / frozen snapshot
  ├─ stages / Provider Registry / Round 1 / Round 2
  ├─ minority protection / Red Team / Secretary / Final Chair
  ├─ risk gate / decision / checkpoint / replay / performance
  └─ calls Turnpo Gateway and Publish API

Turnpo
  ├─ authenticate and validate
  ├─ execute only registered provider adapter
  ├─ enforce timeout / retry / usage / cost / rate / budget guard
  ├─ receive strict finalized package
  └─ store/version/display shadow result
```

Turnpo 不重算 Local 的 PDC，不改变 Local weights，不运行 Local stage，不接券商，不自动发布交易结果。

## 2. Endpoints

Deployment origin 由环境提供，不在代码仓库内硬编码。Local 只拼接以下 path：

```text
TURNPO_GATEWAY_BASE_URL + /api/v1/pdc/gateway
TURNPO_GATEWAY_BASE_URL + /api/v1/provider/health
TURNPO_GATEWAY_BASE_URL + /api/v1/provider/smoke
TURNPO_GATEWAY_BASE_URL + /api/v1/pdc/runs/publish
TURNPO_GATEWAY_BASE_URL + /api/v1/pdc/runs/{run_id}
```

例如，`TURNPO_GATEWAY_BASE_URL` 应是实际 Turnpo Production origin；不要把示例 origin 当成已验证的生产地址。

### Token separation

| Local secret name | 用途 | 能做什么 | 不能做什么 |
| --- | --- | --- | --- |
| `LOCAL_PDC_AI_TOKEN` | Gateway/health | 调用 Provider execution、读取 health | publish finalized run |
| `LOCAL_PDC_PUBLISH_TOKEN` | Publish/read | 发布/读取 finalized shadow package | 调用 Provider |

Local 不保存：OpenAI、Anthropic、Gemini、DeepSeek、Kimi/Moonshot API key；也不保存 Cloudflare admin token。

## 3. OpenAI REAL_SHADOW smoke gate

OpenAI 真实链路使用单独的最小成本 smoke 入口，不复用股票候选、冻结事实或生产 ranking 流程：

```http
POST /api/v1/provider/smoke
Authorization: Bearer <LOCAL_PDC_AI_TOKEN>
Content-Type: application/json
```

请求 body 必须精确为：

```json
{"provider_test":true}
```

服务端只有在以下条件同时满足时才会发 OpenAI request：

- server-side mode 明确为 `REAL_SHADOW`；
- `PDC_OPENAI_SMOKE_ENABLED=true`；
- `OPENAI_API_KEY` 或已验证的 Cloudflare provider binding 存在；
- `PDC_OPENAI_ALLOWED_MODELS` 已配置，且 `PDC_OPENAI_SMOKE_MODEL` 命中 allowlist；
- request/run/provider budget 与 rate gate 允许执行。

OpenAI provider 必须返回严格 JSON `{ "provider_test": true, "score": 7 }`。Markdown、narrative text、缺字段、额外字段、错误 score 或 provider failure 都不会生成通过结果。response 只返回脱敏后的 provider output、validation、attempts、retry、latency、usage、cost 和 error code，不返回 raw provider response。

当前部署的 binding、allowlist、REAL_SHADOW mode 和实际 smoke 结果均为 `UNVERIFIED`；公开 origin 的新 JSON Function route 尚未被证明部署。因此 Local 不得把本节当成真实 OpenAI 已可用的证明，也不得自行猜测 model ID。

## 4. API versions

```text
API envelope: provider-execution-v1
AI input/output: pdc-ai-contract-v1
Run publish: pdc-run-publish-v1
```

Canonical files in this repository：

- `contracts/provider-execution-v1.schema.json`
- `contracts/pdc-ai-contract-v1.schema.json`
- `contracts/pdc-run-publish-v1.schema.json`

不要根据接口返回自由增加字段；unknown fields 应由 Local 自己拒绝或忽略在版本化 adapter 内，不要静默改变 canonical object。

## 5. Gateway request rules

Local POST 时：

```http
Authorization: Bearer <LOCAL_PDC_AI_TOKEN>
Content-Type: application/json
```

Request 必须包含：

```json
{
  "run_id": "local-shadow-001",
  "snapshot_id": "snapshot-2026-08-13",
  "task_type": "ranking_scorecard",
  "candidates": [{"ticker": "600519.SH", "rank": 1, "fact_ids": ["fact-1"]}],
  "frozen_facts": {
    "package_sha256": "<64 hex sha256>",
    "market_data_date": "2026-08-13",
    "rules_version": "hawkeye-fixed-v1",
    "source_scope": "full_a_share_market",
    "data": {}
  },
  "evaluation_schema_version": "pdc-ai-contract-v1",
  "model_selection": {"provider": "openai", "model": "<allowlisted model>"},
  "budget": {"max_output_tokens": 4000, "max_total_tokens": 12000, "max_cost_usd": 1},
  "timeout_ms": 12000,
  "retry": {"max_attempts": 1}
}
```

注意：

- `frozen_facts.data` 只能放冻结研究事实；禁止 API key、token、password、secret、credential、private key；
- `model_selection.model` 必须由 Turnpo server allowlist 验证；不要假设某个 model id 永远存在；
- caller 不能在 body 选择 `OFFLINE_TEST`/`REAL_SHADOW`/`PRODUCTION`；mode 来自 Turnpo deployment；
- Local 自己负责在请求前冻结 snapshot，在响应后核对 run/snapshot/hash/coverage。

## 6. Gateway response handling

只把以下结果当成可用 Provider result：

```text
HTTP success
provider_results[].status == COMPLETED
provider_results[].validation_status == VALID
validation_status == VALID
scorecards exactly cover candidates
每个 scorecard 有 ticker/dimensions/score/confidence/risk_flags/decision
```

Scorecard 字段：

```json
{
  "ticker": "600519.SH",
  "dimensions": {
    "market_regime": 6,
    "trend": 7,
    "livermore_breakout": 5,
    "volume_price": 6,
    "candlestick": 5,
    "overheat": 6,
    "risk": 7,
    "zhuge_orion": 5,
    "final_chair": 6
  },
  "score": 6,
  "confidence": 0.72,
  "risk_flags": [],
  "decision": "WATCH"
}
```

允许的 decision：`BUY`、`WATCH`、`HOLD`、`SELL`。这些是 research labels，不是订单指令。不得从 Gateway response 直接下单。

常见 failure：

| error_code | Local 行为 |
| --- | --- |
| `SERVICE_NOT_CONFIGURED` | 停止 real call，记录配置缺口 |
| `UNAUTHORIZED` | 不重试 token 错误 |
| `INVALID_REQUEST` | 修正 frozen request，不重试相同 payload |
| `PROVIDER_NOT_CONFIGURED` | 标记 provider unavailable，不 fake completion |
| `MODEL_NOT_ALLOWED` | 从 health/部署配置读取允许模型，不猜模型 |
| `UPSTREAM_TIMEOUT` | 按 Local stage/recovery policy 处理 |
| `INVALID_PROVIDER_OUTPUT` | 丢弃 scorecard，记录 validation failure |
| `RATE_LIMITED` / `BUDGET_BLOCKED` | 等待/降频/结束当前 run，不自行提高预算 |
| `PRODUCTION_MODE_NOT_AVAILABLE` | 保持 shadow/offline，不绕过 gate |

Gateway 默认 mode 是 `OFFLINE_TEST`。只有 Turnpo 测试部署显式设置 `REAL_SHADOW` 后，才可能产生真实 provider cost。

控制层的时间与重试边界必须保持分层：Smoke provider timeout 默认 8 秒、上限 12 秒；canonical Gateway request 的 `timeout_ms` 为 1–30 秒。Local 应设置大于 Gateway timeout 的 client deadline（当前建议 15 秒），不要在 Local SDK 叠加无界重试。Smoke 最多 2 次 attempt，即最多 1 次 transient retry；canonical Gateway caller 默认建议 `max_attempts=1`，更高层恢复由 Local checkpoint/recovery policy 管理。

## 7. Provider health usage

```http
GET /api/v1/provider/health
Authorization: Bearer <LOCAL_PDC_AI_TOKEN>
```

Health 是配置态信息，不保证每个 provider 已完成真实 smoke test。Local 应只选择：

```text
adapter_registered == true
status == READY
model_allowlist_configured == true
```

当前仓库代码只有 OpenAI adapter；Claude/Gemini/DeepSeek/Kimi 仍应按不可调用处理，直到后续 adapter 和 smoke evidence 合入。

## 8. Publish finalized run

Local 先完成所有自身 PDC stages、risk gate、checkpoint 和 recovery，然后 POST：

```http
POST /api/v1/pdc/runs/publish
Authorization: Bearer <LOCAL_PDC_PUBLISH_TOKEN>
Content-Type: application/json
```

Payload 必须符合 `pdc-run-publish-v1`，重点要求：

```text
schema_version == pdc-run-publish-v1
status == FINALIZED
validation_status == PASS
execution_summary.research_only == true
execution_summary.live_trading == false
config_hash/code_hash/snapshot metadata present
provider_results/final_rankings/decisions/risk_flags strict
```

Publish package 只能包含结构化结果、usage/cost summary 和 artifact reference/hash；不要放 prompt、raw model response、API key、token 或 narrative completion。

`REAL_SHADOW` 和 `OFFLINE_TEST` 写入 shadow namespace。production publish 默认关闭；收到 `PRODUCTION_PUBLISH_DISABLED` 时不要绕过。

同一个 `run_id`：

- 相同 canonical package：`IDEMPOTENT`；
- 不同 package：409 `RUN_ID_CONFLICT`；
- 不会自动覆盖旧 run。

## 9. First / second acceptance

### First acceptance：Gateway

1. Local 用无 provider secret 的 fixture 调用 `OFFLINE_TEST`；
2. 确认无 outbound provider call、response 是 `NOT_RUN`；
3. 提交 unknown field/secret-like frozen fact，确认 422；
4. 在 Turnpo 测试环境确认 `/api/v1/provider/smoke` 返回 JSON Function response；
5. 明确开启 `REAL_SHADOW`、smoke gate、allowlist、低 budget/rate 后，执行一次真实 OpenAI smoke；
6. 记录 smoke response 的 validation、latency、attempts、usage、cost 和 request id；
7. 确认 raw response、token、provider key 没有出现在 response/log；
8. 确认现有 Stock PDC 页面/Run 未变化。

### Second acceptance：Publish

1. Local 生成 finalized shadow fixture；
2. 用 publish token POST；
3. 确认返回 `PUBLISHED`，GET 能读到 shadow package；
4. 同 package 重试返回 `IDEMPOTENT`；
5. 同 run_id 改内容返回 409；
6. `PRODUCTION` package 默认返回 disabled；
7. 确认 package 没有 raw provider output、secret 或交易执行字段。

## 10. Do not do

- 不在 Local repo 写 provider API key；
- 不把 AI token 和 publish token 合并；
- 不把 Gateway 当成 PDC orchestrator；
- 不把 `claude/gemini/deepseek/kimi` 协议 ID 当成已可调用能力；
- 不把 `OFFLINE_TEST` 的 `NOT_RUN` 当成模型通过；
- 不把 `BUY` label 发送给券商；
- 不打开 production mode/publish gate；
- 不修改现有生产页面展示逻辑作为接入前提。

## 11. Handoff decision

目前可以交给 Local 团队进行 contract/offline implementation，并使用已验证的 Preview JSON route 做负向联调；真实联网接入仍必须等 Preview gateway/provider binding、OpenAI real smoke evidence 和 dedicated publish storage 完成后再通过 readiness gate。当前 OpenAI REAL_SHADOW 已完成部署路由验证，但仍被 Preview credential/config 阻断。

```text
OPENAI_REAL_SHADOW_PARTIALLY_READY
```
