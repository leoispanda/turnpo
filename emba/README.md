# EMBA Timeline

This folder powers the Turnpo EMBA timeline page at `/emba/`.

The local page has a lightweight browser password gate. Current local password: `emba2026`.

On Cloudflare Pages, `/emba/*` is protected by `functions/emba/[[path]].js`. Set the Pages environment variable:

```text
EMBA_ACCESS_CODE=emba2026
```

The Function sets an authenticated cookie after the correct access code is submitted, so `/emba/` and files under `/emba/materials/` are both protected on Cloudflare.

## Add a learning day

1. Put the file in `emba/materials/`.
2. Add or update one day in `emba/materials.json`.
3. Add documents, personal notes, and GPT study records under that day.
4. Keep sensitive or copyrighted files out of the public site unless you have permission to publish them.

Example:

```json
{
  "id": "2026-07-04-strategy-case-day",
  "date": "2026-07-04",
  "title": "Strategy case discussion",
  "module": "strategy",
  "type": "class",
  "summary": "Class discussion about competitive advantage and trade-offs.",
  "tags": ["case", "competitive advantage"],
  "documents": [
    {
      "title": "Strategy case notes - Module 1",
      "type": "note",
      "file": "/emba/materials/strategy-case-notes-module-1.pdf",
      "notes": "Personal notes and key questions for class discussion."
    }
  ],
  "notes": [
    {
      "title": "My reflection",
      "body": "The most useful idea today was that strategy is choosing what not to do.",
      "bullets": ["Apply this to product roadmap decisions", "Compare with MapKAI positioning"]
    }
  ],
  "gptRecords": [
    {
      "title": "GPT study record",
      "prompt": "Turn my notes into a study summary with key ideas and application questions.",
      "summary": "GPT synthesis of the day.",
      "takeaways": ["Key concepts", "Case logic", "Action questions"]
    }
  ]
}
```
