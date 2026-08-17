# Turnpo → stock-pdc-local Provider Gateway Handoff

状态：`LOCAL_PROVIDER_GATEWAY_PARTIALLY_READY`  
契约：`pdc-provider-v1`  
本 handoff 不包含任何 token、API key 或 secret value。

## 1. Gateway

Canonical route:

```text
POST /api/v1/pdc/gateway
```

Repository implementation:

```text
functions/api/v1/pdc/gateway.js
functions/api/v1/pdc/_provider-gateway-handler.js
functions/api/v1/pdc/_provider-execution-service.js
functions/api/v1/pdc/_provider-registry.js
functions/api/v1/pdc/_provider-adapters.js
```

Last audited Preview deployment URL:

```text
https://ef5f932e.turnpo.pages.dev/api/v1/pdc/gateway
```

Important: that audited Preview deployment predates the final `pdc-provider-v1` gateway changes and has no Preview provider credential. Do not use it as a successful local integration endpoint until the current code is deployed and the smoke gate below passes.

Health endpoint:

```text
GET /api/v1/provider/health
Authorization: Bearer $LOCAL_PDC_AI_TOKEN
```

## 2. Authentication

Local sends only:

```http
Authorization: Bearer $LOCAL_PDC_AI_TOKEN
Content-Type: application/json
```

`LOCAL_PDC_AI_TOKEN` is configured on the Turnpo server side. `stock-pdc-local` must not store or receive provider keys. Missing or invalid local token returns `401 AUTH_FAILED` and makes zero upstream provider calls.

## 3. Request contract

```json
{
  "contract_version": "pdc-provider-v1",
  "request_id": "uuid",
  "run_id": "uuid",
  "provider_id": "openai",
  "model_id": "server-allowlisted-model",
  "task_type": "SCORE",
  "system_instruction": "Caller-owned instruction. Turnpo forwards it and does not generate an investment prompt.",
  "payload": {},
  "response_schema": {
    "type": "object",
    "additionalProperties": false,
    "required": ["result"],
    "properties": { "result": { "type": "string" } }
  },
  "timeout_ms": 12000,
  "max_retries": 1,
  "budget": {
    "max_cost_usd": 1,
    "max_output_tokens": 2048
  }
}
```

Allowed `task_type` values:

```text
SCORE | CHALLENGE | SMOKE
```

The request must contain a strict object `response_schema` with `additionalProperties:false`. The gateway rejects unsupported fields, secret-like payload keys, oversized/nested payloads, wildcard model IDs and unknown task types.

For the local Stock PDC scorecard, use the caller-owned schema in:

```text
contracts/pdc-ai-scorecard-output-v1.schema.json
```

The gateway does not own the meaning of `ticker`, dimensions, score, confidence, risk flags or decision; local PDC supplies the schema and task instruction.

## 4. Response contract

Success:

```json
{
  "contract_version": "pdc-provider-v1",
  "request_id": "uuid",
  "run_id": "uuid",
  "provider_id": "openai",
  "model_id": "gpt-4o-mini",
  "task_type": "SCORE",
  "status": "SUCCESS",
  "output": {},
  "usage": {
    "input_tokens": 100,
    "output_tokens": 40,
    "total_tokens": 140,
    "retry_count": 0
  },
  "cost": {
    "currency": "USD",
    "usd": "UNAVAILABLE",
    "pricing_status": "NOT_CONFIGURED",
    "tracking_status": "LOGGED_ONLY"
  },
  "latency_ms": 820,
  "error_code": "SUCCESS"
}
```

Failure keeps the same envelope with `status:"FAIL"`, `output:"UNAVAILABLE"`, and a failure code. Unavailable usage, cost or latency values are explicitly `UNAVAILABLE`; Turnpo never fabricates them.

Failure codes include:

```text
AUTH_FAILED
PROVIDER_NOT_CONFIGURED
PROVIDER_DISABLED
MODEL_NOT_ALLOWED
TIMEOUT
RATE_LIMITED
BUDGET_BLOCKED
NETWORK_ERROR
PROVIDER_ERROR
INVALID_JSON
SCHEMA_FAILED
TASK_NOT_ALLOWED
INVALID_REQUEST
```

## 5. Provider matrix

| Provider ID | Runtime credential reference | Production credential | Preview credential | Adapter | Model status | Gateway status |
| --- | --- | --- | --- | --- | --- | --- |
| `openai` | `OPENAI_API_KEY` | `PRESENT` | `MISSING` | `openai_responses` | Preview `gpt-4o-mini`; production allowlist not verified | `UNVERIFIED` |
| `anthropic` | `claude_api_pdc` | `PRESENT` | `MISSING` | `anthropic_messages` | `MISSING` | `MODEL_ALLOWLIST_MISSING` |
| `gemini` | `Gemini API Key pdc` | `PRESENT` | `MISSING` | `gemini_generate_content` | `MISSING` | `MODEL_ALLOWLIST_MISSING` |
| `deepseek` | `deepseek api pdc` | `PRESENT` | `MISSING` | `deepseek_chat_completions` | `MISSING` | `MODEL_ALLOWLIST_MISSING` |
| `kimi` | `kimi pdc` | `PRESENT` | `MISSING` | `kimi_chat_completions` | `MISSING` | `MODEL_ALLOWLIST_MISSING` |

The credential references above are binding names only. Values were not read or copied.

## 6. Operational controls

- Default mode: `OFFLINE_TEST`; no provider call.
- Real call mode: explicit server-side `REAL_SHADOW` only.
- `PRODUCTION` is blocked by this gateway implementation.
- Timeout: request bounded to 1–30 seconds and capped by Registry.
- Retry: maximum one retry, only for 429, 5xx or network errors.
- Rate/budget: existing KV controls; KV is a best-effort soft counter, not exactly-once accounting.
- Logs: request/run/provider/model/task/time/status/latency/usage/cost only; no prompt, payload, schema, raw output or secret.

## 7. Readiness gate

Do not mark a provider `READY` from configuration alone. For each configured provider:

1. Set one explicit model allowlist in the target non-production runtime.
2. Confirm the server-side credential binding is present without exposing its value.
3. Run one `SMOKE` request whose payload is exactly `{ "provider_test": true }`.
4. Require exact output `{ "provider_test": true, "score": 7 }`.
5. Record the health attestation without recording raw response or secret.

Current gate result: no real `pdc-provider-v1` gateway smoke has been completed in the audited Preview runtime. Local can implement against the contract, but the live endpoint is not yet accepted for integration.

## 8. Scope boundary

`stock-pdc-local` owns candidate screening, frozen facts, task semantics, prompt content, PDC orchestration, scorecard semantics and local research artifacts.

Turnpo owns server-side provider credentials, provider transport, model allowlists, timeout/retry, auth, budget/rate controls, strict JSON validation and usage/cost/latency metadata.

This handoff does not authorize production deployment, UI changes, brokerage connections or automatic trading publication.

最终判定：`DESIGN_COMPLETE_NOT_IMPLEMENTED`。
