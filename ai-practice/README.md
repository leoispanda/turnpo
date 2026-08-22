# AI Practice

This folder powers the private Turnpo AI Practice page at `/ai-practice/`.

On Cloudflare Pages, `/ai-practice/*` is protected by `functions/ai-practice/[[path]].js`. The page form posts to the server gate and uses:

```text
AI_PRACTICE_ACCESS_CODE
```

`AI_PRACTICE_ACCESS_CODE` is preferred, with `EMBA_ACCESS_CODE` as an explicit shared environment configuration option. If neither is set, access fails closed with a configuration error. No access code is shipped in the browser bundle.
