# Cloudflare REAL_SHADOW Deployment Audit

审计日期：2026-08-14  
目标：确认 Turnpo 的 OpenAI REAL_SHADOW Gateway 是否已在 Cloudflare 实际部署，并判断是否可以交给 `stock-pdc-local` 做真实联调。  
安全边界：没有读取、复制或输出任何 OpenAI key、Local token、Cloudflare admin token 或其它 secret value；没有发起真实 OpenAI 请求；没有修改 Production PDC/UI。

## 结论

新 Gateway 已在 Turnpo Cloudflare Pages 的 Preview deployment 中发布并验证路由。Preview 专用 token 和单模型 allowlist 已配置；生产 origin `https://www.turnpo.com` 保持不变。由于 Preview 没有独立 OpenAI credential，且本轮限定的三个变量不包含代码要求的 REAL_SHADOW/enable flags，尚未发起真实 OpenAI request。

本轮状态：

```text
OPENAI_REAL_SHADOW_PARTIALLY_READY
```

剩余阻断不是部署或路由问题，而是 Preview 的 authentication/provider credential/model configuration 尚未完成。

## 1. Deployment configuration audit

| 项目 | 仓库代码/约定 | 实际部署状态 |
| --- | --- | --- |
| Turnpo environment | Pages Functions under `functions/` | `PASS`：最新 Preview deployment `ef5f932e`，`https://ef5f932e.turnpo.pages.dev` |
| Public origin | `https://www.turnpo.com` | `PRESENT`：公开站点可访问 |
| Worker / Pages Function | `functions/api/v1/pdc/gateway.js`、`functions/api/v1/provider/smoke.js` | `PASS`：Preview 返回新 Worker JSON |
| Gateway endpoint | `POST /api/v1/pdc/gateway` | `PASS`：无 token 时返回结构化 `SERVICE_NOT_CONFIGURED` |
| Smoke endpoint | `POST /api/v1/provider/smoke` | `PASS`：无 token 时返回结构化 `SERVICE_NOT_CONFIGURED` |
| Health endpoint | `GET /api/v1/provider/health` | `PASS`：Preview 返回结构化 `SERVICE_NOT_CONFIGURED` |
| Publish endpoint | `POST /api/v1/pdc/runs/publish` | `PASS`：无 publish token 时返回结构化 `PUBLISH_NOT_CONFIGURED` |
| Authentication | `LOCAL_PDC_AI_TOKEN` | `PASS`：Preview 专用 token 已配置；未输出 value |
| OpenAI secret binding | Preview provider credential | `BLOCKED`：Preview `OPENAI_API_KEY` 缺失；没有复制生产 credential |
| OpenAI model allowlist | `PDC_OPENAI_ALLOWED_MODELS` | `PASS`：仅允许 `gpt-4o-mini` |
| Shadow mode | `LOCAL_PDC_GATEWAY_MODE=REAL_SHADOW` + `PDC_OPENAI_SMOKE_ENABLED=true` | `BLOCKED`：代码要求的 flags 不在本轮三个变量范围内 |
| Production mode | `PRODUCTION` explicitly rejected by code | `DISABLED_IN_CODE` |

本次使用 Cloudflare Pages deployment control 发布 Preview；没有读取或输出任何 secret value。失败的临时 Preview deployment 已删除；生产项目配置、生产页面和生产 binding 未修改。

## 2. Live route probes

探测只使用无认证 GET/POST，不携带 OpenAI key、Local token 或股票数据；没有触发真实 provider call。

| Probe | Live result | 解释 |
| --- | --- | --- |
| `GET /api/v1/provider/health` | `Preview JSON route` | 部署后的 Worker 路由已确认 |
| `POST /api/v1/pdc/gateway`，无 token | `401 application/json` | 认证在 provider routing 前拒绝 |
| `POST /api/v1/provider/smoke`，无 token/错误 token | `401 application/json` | 认证在 OpenAI call 前拒绝 |
| `POST /api/v1/pdc/runs/publish`，无 token | `503 application/json` | 返回 `PUBLISH_NOT_CONFIGURED`，未写入 publish storage |

因此不能把公开站点可达性等同于 Gateway 可达性。

## 3. Credential audit

只报告 presence 状态，不报告 value：

| Credential / binding | Status | Evidence |
| --- | --- | --- |
| Preview provider credential | `BLOCKED` | Preview route 已验证，但 `OPENAI_API_KEY` 未配置；没有复制生产 credential |
| `LOCAL_PDC_AI_TOKEN` | `PASS` | Preview 专用 token 已配置；value 未读取或输出 |
| `LOCAL_PDC_PUBLISH_TOKEN` | `BLOCKED` | Preview publish route 已验证，但未配置 token |
| Cloudflare deployment control | `PASS` | 已创建并验证最新 Preview deployment；没有输出 credential value |

`OPENAI_API_KEY=PRESENT` 只有在 Cloudflare 实际 binding/secret listing 被权限验证后才允许写入报告；当前不能使用 source reference、schema 或 `.env.example` 推导 PRESENT。

## 4. Runtime configuration expected by code

这些是部署 checklist，不是已确认的值：

| Capability | Server-side names |
| --- | --- |
| Local AI authentication | `LOCAL_PDC_AI_TOKEN` |
| OpenAI credential | `OPENAI_API_KEY` 或 Cloudflare BYOK/Secrets Store route |
| Model allowlist | `PDC_OPENAI_ALLOWED_MODELS` |
| Explicit smoke model | `PDC_OPENAI_SMOKE_MODEL`，且必须属于 allowlist |
| Gateway mode | `LOCAL_PDC_GATEWAY_MODE`，REAL_SHADOW only in test deployment |
| Smoke enable gate | `PDC_OPENAI_SMOKE_ENABLED=true` |
| Provider timeout | `PDC_OPENAI_SMOKE_TIMEOUT_MS`，code default 8s, capped 12s |
| Smoke output cap | `PDC_OPENAI_SMOKE_MAX_OUTPUT_TOKENS`，code default 256, capped 512 |
| Smoke attempts | `PDC_OPENAI_SMOKE_MAX_ATTEMPTS`，code default 2 = one retry |
| Smoke request budget | `PDC_OPENAI_SMOKE_REQUEST_BUDGET_USD` |
| Rate limit | `PDC_RATE_KV`/`AUTH_KV`, `PDC_RATE_LIMIT_PER_MINUTE`, optional per-run/per-day limits |
| Budget | `PDC_BUDGET_KV`/`PDC_COST_KV`, `PDC_RUN_BUDGET_USD`, `PDC_DAILY_PROVIDER_BUDGET_USD`, `PDC_DAILY_TOTAL_BUDGET_USD` |
| Usage/cost pricing | `PDC_OPENAI_INPUT_USD_PER_1M`, `PDC_OPENAI_OUTPUT_USD_PER_1M` |
| Cost log | optional `PDC_COST_KV` |
| Shadow publish storage | dedicated `PDC_PUBLISH_KV` or `PDC_RESULT_KV` |

## 5. Required deployment action before smoke

需要具有 Cloudflare Pages 项目权限的 operator：

1. 在目标非生产/REAL_SHADOW environment 发布包含本次 `functions/` 代码的 commit；
2. 配置独立 `LOCAL_PDC_AI_TOKEN`，只允许访问 Gateway/health/smoke；
3. 配置 OpenAI secret 或经验证的 Cloudflare BYOK route；
4. 配置 `PDC_OPENAI_ALLOWED_MODELS`，不得由 Local 任意提交 model；
5. 配置 smoke enable gate、低 request/run/provider budget、rate limit 和 timeout；
6. 确认部署后的 route 返回 JSON；
7. 只在 JSON route 验证通过后执行一次最低成本 smoke；
8. 真实 smoke 失败时保持失败码，不切换 production。

## 6. Security review at deployment boundary

代码层已通过：

- 未认证/错误认证在 provider routing 前拒绝；
- provider key 只读取 server-side binding；
- Local token 与 OpenAI key 分离；
- smoke body 只允许 `{ "provider_test": true }`；
- model 必须命中 allowlist；
- budget/rate gate 在 fetch 前检查；
- provider response 只接受严格 `{provider_test:true,score:7}`；
- log 不写 token/key/prompt/raw response；
- REAL_SHADOW 不写 production namespace；
- PRODUCTION mode 在代码中拒绝。

部署层尚未验证：secret rotation、实际 token scope、Cloudflare log retention/DLP、edge rate limit、实际 KV binding 和真实 OpenAI auth。

## 7. Audit verdict

```text
Cloudflare public site: reachable
Turnpo REAL_SHADOW JSON Gateway: Preview route verified
OpenAI credential binding: Preview `OPENAI_API_KEY` missing
Local PDC credential: Preview configured
Real OpenAI smoke test: BLOCKED before provider call
```

最终状态：

```text
OPENAI_REAL_SHADOW_PARTIALLY_READY
```
