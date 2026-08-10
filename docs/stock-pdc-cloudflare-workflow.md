# Stock PDC Cloudflare background Workflow

The Stock PDC page now supports a background execution path. The browser creates a run and polls it; all five model verifications and every 30-stock review batch run in a durable Cloudflare Workflow. This avoids treating a browser/Pages HTTP timeout as a completed PDC decision.

It is intentionally **not active** until the bindings below are added. Until then, the existing Pages flow remains unchanged.

## One-time Cloudflare setup

1. Deploy the Worker from this repository:

   ```bash
   cd stock-pdc-orchestrator
   npx wrangler login
   npx wrangler deploy
   ```

2. In the deployed Worker’s **Settings → Bindings**, add the same KV namespace currently used by the Pages project under the exact name `AUTH_KV` (or use `STOCK_PDC_KV` in both projects).

3. Add the same model secrets and model-name variables that the Pages PDC already uses: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `KIMI_API_KEY`, plus any existing `*_STOCK_MODEL` variables. Do not add placeholder keys.

4. Create a long random Worker secret named `ORCHESTRATOR_SHARED_SECRET`.

5. In **Pages → turnpo → Settings → Functions → Service bindings**, bind the deployed Worker as `STOCK_PDC_ORCHESTRATOR`. Add the identical `ORCHESTRATOR_SHARED_SECRET` as a Pages secret.

6. Deploy the Pages project from `main`. The page will detect the binding automatically. No cron or scheduled trigger is used.

## Runtime guarantees

- The worker can only be started through the Pages service binding authenticated by the shared secret.
- Each model request and each 30-stock batch is its own durable Workflow step.
- A batch only advances if the existing exact-ticker integrity check returns `COMPLETE`.
- Any API failure, partial response, or malformed score leaves the run `WORKFLOW_BLOCKED` with the original per-stage audit; no score or model response is synthesized.
- The worker never publishes a decision. Formal publication remains a deliberate website action.
