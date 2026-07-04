# AI Practice

This folder powers the private Turnpo AI Practice page at `/ai-practice/`.

The local page has a lightweight browser password gate. Current local password: `emba2026`.

On Cloudflare Pages, `/ai-practice/*` is protected by `functions/ai-practice/[[path]].js`. It uses:

```text
AI_PRACTICE_ACCESS_CODE
```

If `AI_PRACTICE_ACCESS_CODE` is not set, it falls back to:

```text
EMBA_ACCESS_CODE=emba2026
```

This keeps the AI Practice password aligned with the EMBA page while still allowing a separate password later if needed.
