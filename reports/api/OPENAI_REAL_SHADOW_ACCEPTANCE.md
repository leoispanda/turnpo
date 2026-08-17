# OpenAI REAL_SHADOW Acceptance

验收日期：2026-08-14  
范围：只验收 OpenAI；Claude、Gemini、DeepSeek、Kimi 本轮不实施。  
真实调用策略：没有真实 Cloudflare route/binding 证据前不发 OpenAI request；本地 mock test 不计为 real smoke PASS。本次已配置并验证 Preview 专用 token/allowlist，但 Preview 没有独立 OpenAI provider credential；同时 REAL_SHADOW enable flags 不在本轮允许修改的三个变量内，因此未发起 OpenAI request。

## 1. Deployment

```text
Cloudflare deployment: PREVIEW_DEPLOYED / ROUTES_VERIFIED
Preview deployment: https://ef5f932e.turnpo.pages.dev
Gateway endpoint: https://ef5f932e.turnpo.pages.dev/api/v1/pdc/gateway
Smoke endpoint: https://ef5f932e.turnpo.pages.dev/api/v1/provider/smoke
Authentication: LOCAL_PDC_AI_TOKEN (Preview configured)
Provider credential: OPENAI_API_KEY missing in Preview; no production credential copied
Model allowlist: PDC_OPENAI_ALLOWED_MODELS = gpt-4o-mini
Mode: REAL_SHADOW code path deployed; required mode/smoke-enable flags are not configured
```

Preview probes returned the new JSON Worker responses. Unauthenticated and invalid-token smoke requests returned `401 UNAUTHORIZED` before any provider request. The production origin was not changed, and no actual OpenAI request was attempted.

## 2. OpenAI acceptance

| Check | Status | Evidence |
| --- | --- | --- |
| Credential | `BLOCKED` | Preview `OPENAI_API_KEY` is missing; the Production key was not copied |
| Adapter | `PASS` in repository | Reuses existing `fetchOpenAiResponses()` transport |
| Model | `PASS` | `gpt-4o-mini`, the existing Turnpo code fallback, is the sole Preview allowlisted model |
| Allowlist | `PASS` Preview | `PDC_OPENAI_ALLOWED_MODELS` is configured server-side; Local cannot choose a model |
| Smoke request | `BLOCKED` | Preview provider credential and required REAL_SHADOW enable flags are absent |
| Smoke output | `SKIPPED` real / `PASS` mock | Mock accepts only `{provider_test:true,score:7}` |
| Latency | `SKIPPED` real | Mock path records `latency_ms`; no live measurement |
| Usage | `SKIPPED` real | Mock path parses input/output/total tokens |
| Cost | `SKIPPED` real | Mock path calculates cost only when pricing is configured |

## 3. Security acceptance

| Check | Status | Evidence |
| --- | --- | --- |
| No Local OpenAI master key | `PASS` code/documentation | Local only receives `LOCAL_PDC_AI_TOKEN` name; no value stored |
| No token in logs | `PASS` automated test | Smoke safe-log regression test |
| No key in responses | `PASS` automated test | Response/log redaction assertions |
| Unauthorized request | `PASS` local / `PASS` Preview | Preview returned `401 UNAUTHORIZED` |
| Invalid token | `PASS` local / `PASS` Preview | Preview returned `401 UNAUTHORIZED`; provider call was not reached |
| Rate limit | `PASS` mock | Second request returns `RATE_LIMITED` without provider fetch |
| Request budget | `PASS` mock | Preflight max-cost test returns `BUDGET_BLOCKED` before fetch |
| Run/provider daily budget | `PASS` mock | Shared budget gate blocks before fetch |
| Timeout | `PASS` code/mock coverage | Provider timeout is bounded; real latency not measured |
| Retry | `PASS` mock | At most one smoke retry; no SDK retry is added |

## 4. Contract acceptance

| Check | Status |
| --- | --- |
| Request exact body `{provider_test:true}` | `PASS` |
| OpenAI Structured Outputs strict schema | `PASS` code/mock |
| Markdown + JSON rejected | `PASS` |
| Missing fields rejected | `PASS` runtime schema guard |
| Extra fields rejected | `PASS` runtime schema guard |
| Score must equal 7 for smoke | `PASS` |
| Raw provider response returned | `FAIL CLOSED` / not returned |
| Fake completion on provider failure | `FAIL CLOSED` / not returned |

## 4.1 Requested Preview acceptance fields

| Check | Result | Evidence |
| --- | --- | --- |
| `LOCAL_PDC_AI_TOKEN` | `CONFIGURED` | Preview-only secret binding; value never returned or written |
| `OPENAI_API_KEY` binding | `MISSING` | Preview project configuration has no binding; Production key was not copied |
| Model allowlist | `PASS` | Exactly `gpt-4o-mini` configured server-side |
| Unauthorized request | `BLOCKED` | Preview returned HTTP 401 before provider routing |
| Invalid token | `BLOCKED` | Preview returned HTTP 401 before provider routing |
| Invalid model | `BLOCKED` | Not reached because the required REAL_SHADOW/provider configuration gate is incomplete |
| Real OpenAI invocation | `FAIL / NOT EXECUTED` | No upstream request was allowed without Preview credential and enable flags |
| Strict JSON | `PASS` code/mock; real `NOT RUN` | No mock result is promoted to real PASS |
| Usage | `UNAVAILABLE` | No real upstream response |
| Cost | `UNAVAILABLE` | No real upstream response/pricing evidence |
| Latency | `UNAVAILABLE` | No real upstream request |
| Secret exposure | `NONE` | No key/token value appeared in report, response, or repository |
| Production impact | `NONE` | Production PDC/UI/secrets/publish/trading unchanged |

## 5. Isolation

```text
Production PDC impacted: NO
Production ranking impacted: NO
Production UI impacted: NO
Production storage impacted: NO
Production mode enabled: NO
Production publish enabled: NO
Workflow PDC used: NO
KV stage orchestration used: NO
Broker/trading connected: NO
```

Smoke calls use no stock data and the code path does not call Hawkeye, ranking, Round 1/2, Secretary, Final Chair, risk gate, checkpoint or production UI.

## 6. Automated test record

| Test group | Result |
| --- | --- |
| OpenAI smoke mock | PASS |
| Provider Gateway | PASS |
| Authentication negative paths | PASS |
| Model allowlist | PASS |
| Request/run budget gate | PASS |
| Rate limit | PASS |
| Timeout/retry code paths | PASS |
| Strict JSON/schema | PASS |
| Secret redaction | PASS |
| Health | PASS locally; Preview deployment verified |
| Publish isolation | PASS |
| Existing Stock PDC tests | PASS |
| Full Node test suite | One unrelated pre-existing EMBA content failure |
| Stock PDC Python suite | 45 passed |
| Real OpenAI smoke | BLOCKED before provider call |

## 7. Final status matrix

| Check | Status |
| --- | --- |
| Cloudflare deployment | `PASS` Preview / production unchanged |
| Gateway reachable as JSON Function | `PASS` Preview fail-closed response |
| Gateway auth | `PASS` locally / `PASS` Preview gate |
| OpenAI secret binding | `BLOCKED` Preview `OPENAI_API_KEY` missing |
| OpenAI real request | `BLOCKED` Preview credential/mode gate |
| Model allowlist | `PASS` Preview (`gpt-4o-mini`) |
| Strict JSON | `PASS` locally |
| Schema validation | `PASS` locally |
| Timeout | `PASS` code/mock / live unverified |
| Retry | `PASS` locally |
| Rate limit | `PASS` locally |
| Budget gate | `PASS` locally |
| Usage logging | `PASS` code/mock / live unverified |
| Cost logging | `PASS` code/mock / live unverified |
| Secret redaction | `PASS` |
| Shadow isolation | `PASS` code |
| Publish isolation | `PASS` code/mock |

## 8. Acceptance decision

The Preview deployment, dedicated gateway token, model allowlist, and fail-closed authentication gate are proven. The real OpenAI → strict JSON → usage/cost leg is not proven because Preview lacks a separately provisioned OpenAI credential; the code also requires REAL_SHADOW/enable flags that were outside the three-variable scope. The correct current status is:

```text
OPENAI_REAL_SHADOW_PARTIALLY_READY
```

Next action requires a separately provisioned Preview/Shadow OpenAI credential and an explicit decision to configure the existing code-required REAL_SHADOW/enable flags. No production binding is to be copied or changed.
