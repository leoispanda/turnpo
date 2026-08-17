# Local PDC Gateway Implementation

> 当前权威版本：根目录 `LOCAL_PROVIDER_HANDOFF.md` 与 `reports/api/PROVIDER_SERVICE_AUDIT.md`。本文件保留此前 PDC-specific shadow gateway 的施工记录；当前通用 gateway 使用 `pdc-provider-v1`，不是本文下方旧的 scorecard request envelope。

版本：`provider-execution-v1`  
PDC AI schema：`pdc-ai-contract-v1`  
Publish schema：`pdc-run-publish-v1`  
默认安全原则：没有 server-side 配置就不调用 Provider；没有严格 JSON 就不产生 scorecard；没有 finalized package 就不进入 Run storage。

## 1. Endpoint map

| Endpoint | 认证 | 用途 | 当前状态 |
| --- | --- | --- | --- |
| `POST /api/v1/pdc/gateway` | `Authorization: Bearer <LOCAL_PDC_AI_TOKEN>` | Local PDC canonical AI execution gateway | 代码已实施，需部署验收 |
| `GET /api/v1/provider/health` | `LOCAL_PDC_AI_TOKEN` | Provider Registry 配置态健康检查 | 代码已实施，不主动 smoke call |
| `POST /api/v1/provider/smoke` | `Authorization: Bearer <LOCAL_PDC_AI_TOKEN>` | OpenAI 最小 REAL_SHADOW 链路验收 | 代码已实施，Preview route/token/allowlist 已验证；Preview OpenAI credential 未配置 |
| `POST /api/v1/pdc/evaluate/shadow` | 新 token 优先，也兼容旧 `TURNPO_PDC_SERVICE_TOKEN` | 第一阶段 shadow compatibility route | 已实施 |
| `POST /api/v1/pdc/runs/publish` | `Authorization: Bearer <LOCAL_PDC_PUBLISH_TOKEN>` | 接收 local finalized research package | 代码已实施，需 storage binding |
| `GET /api/v1/pdc/runs/{run_id}` | `LOCAL_PDC_PUBLISH_TOKEN` | 读取 shadow/production namespace 中的已发布 package | 代码已实施，production read 默认关闭 |

Gateway 和 Publish 是两条不同权限边界：AI token 不能 publish，publish token 不能调用 provider。

## 2.1 OpenAI smoke gate

`POST /api/v1/provider/smoke` 是隔离的 OpenAI provider smoke 入口，不接收股票数据，不调用 Stock PDC stages，也不写 production Run/UI。请求必须精确为：

```json
{"provider_test":true}
```

服务端要求显式 `REAL_SHADOW`、`PDC_OPENAI_SMOKE_ENABLED=true`、server-side OpenAI credential、server-side model allowlist 和 smoke model 命中 allowlist。它使用现有 `functions/api/ai/_openai.js` transport，固定 strict JSON schema，只接受：

```json
{"provider_test":true,"score":7}
```

Markdown、narrative、缺字段、额外字段、错误 score、超 budget、timeout 或 provider failure 都 fail closed。response/log 只保留脱敏的 status、validation、attempts、retry、latency、usage、cost 和 error code，不返回 raw provider response 或 secret。

Smoke code 默认 provider timeout 8 秒、上限 12 秒，最多 2 次 attempt（最多 1 次 transient retry），并在 fetch 前执行 request budget、run/provider budget 和 rate gate。当前 Preview route、`LOCAL_PDC_AI_TOKEN` 和单模型 allowlist 已验证；OpenAI provider binding、REAL_SHADOW enable flags 和真实 smoke 仍未完成，不得将本地 mock 结果写成 real PASS。

## 3. Gateway request contract

Canonical Gateway 不创建第二套输入协议，直接复用 `contracts/provider-execution-v1.schema.json` 中的 request，以及 `contracts/pdc-ai-contract-v1.schema.json` 中的 input。

最小结构：

```json
{
  "run_id": "local-shadow-001",
  "snapshot_id": "snapshot-2026-08-13",
  "task_type": "ranking_scorecard",
  "candidates": [{"ticker": "600519.SH", "rank": 1}],
  "frozen_facts": {
    "package_sha256": "<sha256>",
    "market_data_date": "2026-08-13",
    "rules_version": "hawkeye-fixed-v1",
    "source_scope": "full_a_share_market",
    "data": {}
  },
  "evaluation_schema_version": "pdc-ai-contract-v1",
  "model_selection": {"provider": "openai", "model": "<server-allowlisted-model>"},
  "budget": {"max_output_tokens": 4000, "max_total_tokens": 12000, "max_cost_usd": 1},
  "timeout_ms": 12000,
  "retry": {"max_attempts": 1}
}
```

服务端强制：

- 顶层 exact keys，拒绝 uncontrolled fields；
- body 最大 256 KiB；candidates 最大 100；frozen facts 深度、大小和 JSON 类型受限；
- `api_key`、`secret`、`password`、`credential`、`private_key` 等 secret-like fields 被拒绝；
- `evaluation_schema_version` 必须精确为 `pdc-ai-contract-v1`；
- timeout 为 1–30 秒；retry 为 1–3 次；output token 和 total token 有上限；
- request 声明 `max_total_tokens` 或 `max_cost_usd` 时，如果上游没有返回可计量 usage/cost，服务拒绝该结果，不把未知成本当成预算通过；
- provider 只能是五个协议 ID，真实执行仍须通过 Registry adapter；
- model 必须在 server-side Provider allowlist，未配置 allowlist 时 OpenAI real call fail closed；
- client 不能通过 body 选择 execution mode，mode 只来自 server-side environment。

## 4. Gateway response contract

```json
{
  "api_version": "provider-execution-v1",
  "evaluation_schema_version": "pdc-ai-contract-v1",
  "request_id": "server-generated-id",
  "mode": "REAL_SHADOW",
  "run_id": "local-shadow-001",
  "provider_results": [
    {
      "provider": "openai",
      "model": "server-allowlisted-model",
      "status": "COMPLETED",
      "attempts": 1,
      "validation_status": "VALID",
      "error_code": "",
      "usage": {"input_tokens": 100, "output_tokens": 40, "total_tokens": 140, "retry_count": 0},
      "cost": {
        "currency": "USD",
        "estimated_usd": null,
        "pricing_status": "NOT_CONFIGURED",
        "tracking_status": "LOGGED_ONLY"
      }
    }
  ],
  "scorecards": [
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
  ],
  "usage": {"input_tokens": 100, "output_tokens": 40, "total_tokens": 140, "retry_count": 0},
  "cost": {"currency": "USD", "estimated_usd": null, "pricing_status": "NOT_CONFIGURED", "tracking_status": "LOGGED_ONLY"},
  "validation_status": "VALID"
}
```

以下情况绝不返回 fake scorecard：Provider 未配置、模型不在 allowlist、upstream timeout、schema-invalid output、超 budget、未注册 adapter。此时 `scorecards` 为空，并返回明确 `error_code`。

## 5. Provider Registry

Registry 文件：`functions/api/v1/pdc/_provider-registry.js`。

| protocol id | Cloudflare/native 对应 | adapter | secret reference | model allowlist |
| --- | --- | --- | --- | --- |
| `openai` | OpenAI | `openai_responses` | `OPENAI_API_KEY` 或未来 Cloudflare BYOK 绑定 | `PDC_OPENAI_ALLOWED_MODELS` |
| `claude` | Anthropic | 无 | `ANTHROPIC_API_KEY` 仅作为未来 binding reference | `PDC_CLAUDE_ALLOWED_MODELS` |
| `gemini` | Google AI Studio | 无 | `GEMINI_API_KEY` / `GOOGLE_API_KEY` 仅作为未来 binding reference | `PDC_GEMINI_ALLOWED_MODELS` |
| `deepseek` | DeepSeek | 无 | `DEEPSEEK_API_KEY` 仅作为未来 binding reference | `PDC_DEEPSEEK_ALLOWED_MODELS` |
| `kimi` | 当前不假定 native slug | 无 | `KIMI_API_KEY` / `MOONSHOT_API_KEY` 仅作为未来 binding reference | `PDC_KIMI_ALLOWED_MODELS` |

“secret reference”是 binding 名称，不是 secret value。未实现项不含 upstream URL，不会因为请求写了 provider id 就触发猜测式转发。

## 6. Execution modes

| mode | 服务端行为 | 是否产生 Provider 成本 | 是否进入生产 UI |
| --- | --- | --- | --- |
| `OFFLINE_TEST` | 校验 auth/request/contract，不发 outbound call，返回 `NOT_RUN` | 否 | 否 |
| `REAL_SHADOW` | 调用已注册且已配置的 adapter，做 strict validation、usage/cost tracking | 可能 | 否 |
| `PRODUCTION` | Gateway 当前拒绝；publish production 也默认关闭 | 否 | 否 |

代码默认 `OFFLINE_TEST`。专用 Local Gateway 测试环境可以显式设置 `LOCAL_PDC_GATEWAY_MODE=REAL_SHADOW`；这不是生产自动切换，也不会由 caller body 控制。

## 7. Auth、timeout、retry、budget、rate limit

### Auth

- Gateway：`LOCAL_PDC_AI_TOKEN`；旧 shadow route 兼容 `TURNPO_PDC_SERVICE_TOKEN`；
- Publish：仅 `LOCAL_PDC_PUBLISH_TOKEN`；
- token 只在 server-side binding 中；不进 request JSON、query string、日志或 response；
- constant-time comparison；错误只返回 generic message。

### Timeout/retry

- caller timeout 1–30 秒，服务端传给 provider transport；
- transient HTTP 状态（408/409/425/429/5xx）才可能有限 retry；
- schema-invalid output 不盲目重试；
- Local 推荐 `max_attempts=1`，由 Local stage/checkpoint/recovery 负责更高层 retry。

### Rate limit

可选 `PDC_RATE_KV`：

- 默认 per-token+client identity 每分钟 30 次；
- 可配置 `PDC_RATE_LIMIT_PER_MINUTE`、`PDC_RATE_LIMIT_PER_RUN`、`PDC_RATE_LIMIT_PER_DAY`；
- token 和 IP 只参与 hash 后的 key；
- KV 读写计数是 best-effort，不是强一致 global quota；生产应叠加 Cloudflare AI Gateway/edge rate limit 或 Durable Object。

### Budget

可选 `PDC_BUDGET_KV`（没有时兼容 `PDC_COST_KV`）：

- `PDC_DAILY_TOTAL_BUDGET_USD`；
- `PDC_DAILY_PROVIDER_BUDGET_USD`；
- `PDC_RUN_BUDGET_USD`；
- 配置任一硬预算时，request 必须给 `budget.max_cost_usd`；
- pricing 未配置时不猜价格，实际 cost 为 `null`，预算按请求上限保守计数；
- KV 预算计数同样不是 atomic reservation，不能替代正式强一致配额组件。

## 8. Provider health

`GET /api/v1/provider/health` 是配置态检查，不默认对每个 provider 发真实 smoke call。每项返回：

- provider id/display name；
- `adapter_registered`；
- `credential_configured`（布尔 presence，不返回 value）；
- `model_allowlist_configured` 和允许的 model IDs；
- `status`：`READY`、`UNKNOWN`、`NOT_CONFIGURED`、`NOT_IMPLEMENTED` 或 `DISABLED`；
- `health_attestation`：`OPERATOR_ATTESTED` 或 `CONFIGURATION_ONLY`。

`READY` 只能由部署方显式提供已完成 smoke verification 的 operator attestation，不能由“代码里有一个 provider 名称”自动推导。

## 9. Run publish

Publish 文件：`contracts/pdc-run-publish-v1.schema.json` 与 `functions/api/v1/pdc/runs/publish.js`。

只接收：

- `status=FINALIZED`；
- `validation_status=PASS`；
- `execution_summary.research_only=true`；
- `execution_summary.live_trading=false`；
- strict `provider_results`、`final_rankings`、`decisions`、`risk_flags`、cost summary、artifact hashes；
- `config_hash`、`code_hash`、snapshot/run metadata；
- 不接收 narrative text、raw provider output、secret 或 uncontrolled fields。

`REAL_SHADOW`/`OFFLINE_TEST` 写入 `shadow` namespace。`PRODUCTION` 必须再通过 `LOCAL_PDC_PUBLISH_PRODUCTION_ENABLED=true` 显式部署 gate，否则返回 `PRODUCTION_PUBLISH_DISABLED`。

Run ID 冲突返回 409；同一 canonical package 重发返回 `IDEMPOTENT`。当前实现使用 KV，故生产 exactly-once 仍需 Durable Object/D1/数据库层验收。

## 10. 部署前 checklist

- [x] 配置 Preview 专用 `LOCAL_PDC_AI_TOKEN`，仅发给 `stock-pdc-local`；
- [ ] 配置 `LOCAL_PDC_PUBLISH_TOKEN`，仅发给 Local publish client；
- [ ] 配置独立 `PDC_PUBLISH_KV`；不要把 publish state 复用为 Stock PDC stage state；
- [ ] 配置 `PDC_RATE_KV` 与 Cloudflare edge rate limit；
- [ ] 配置 `PDC_BUDGET_KV`、pricing 和 daily/run limits；
- [x] 配置 Preview `PDC_OPENAI_ALLOWED_MODELS=gpt-4o-mini` 单模型 allowlist；
- [ ] 配置独立 Preview OpenAI Provider binding/BYOK；
- [ ] 在非生产环境配置代码要求的 REAL_SHADOW enable flags，验证 `/api/v1/provider/smoke` 的 JSON route，再运行一次最小真实 OpenAI smoke；
- [ ] 对每个 Provider 做真实 smoke test 后再将 health attestation 标为 READY；
- [ ] 默认保持 `OFFLINE_TEST`，shadow 环境再显式设置 `REAL_SHADOW`；
- [ ] 不设置 production execution/publish gate，直到迁移委员会批准；
- [ ] 用 frozen fixture 做 Local first/second acceptance；
- [ ] 确认现有 Stock PDC 页面 diff 为零。

## 11. 当前实现状态

代码已具备可运行的 thin gateway skeleton；部署、五 Provider 实现、真实 smoke evidence、Local actual call 和 production approval 尚未完成。因此本文件不宣称 READY_FOR_LOCAL_INTEGRATION。
