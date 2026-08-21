# EMBA Timeline

This folder powers the private Turnpo EMBA timeline and searchable learning archive at `/emba/`.

The static page keeps this browser-only code for local preview:

```text
emba2026
```

This browser constant is not production security. On Cloudflare Pages, `EMBA_ACCESS_CODE` can override the default for `/emba/*` and `/api/emba/*`:

```text
EMBA_ACCESS_CODE=emba2026
```

If the variable is temporarily unavailable, the original compatibility password `emba2026` remains available so the EMBA module is not locked out. Set `EMBA_ACCESS_CODE` in the Pages production environment to use a different password.

## Cloud Sync

EMBA edits sync through Pages Functions:

- `functions/api/emba/library.js` stores month structure, reflections, source-first thinking cards, personal Review/Follow-up/Reflection notes, searchable Markdown, material metadata, and memory captions in D1.
- `functions/api/emba/upload.js` stores photos and material files in R2.
- `functions/api/emba/file/[[key]].js` serves R2 files behind the same EMBA access cookie.

Use Cloudflare D1 for structured text and R2 for larger photos/PDF/PPT files. Do not store large binary files in D1.

Create these Cloudflare bindings for the Pages project:

```text
D1 database binding name: EMBA_DB
R2 bucket binding name: EMBA_BUCKET
```

The app creates this D1 table automatically on first use:

```sql
CREATE TABLE IF NOT EXISTS emba_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS emba_state_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT NOT NULL
);
```

Before each overwrite, the previous library state is copied into `emba_state_history`. The newest 50 snapshots are retained.

If either binding is missing, the page still works locally using browser storage, but edits will not sync to the cloud.

## Editing

After entering the access code:

1. Click a date on the monthly timeline; the selection stays fixed until another date is clicked.
2. Open `Reflection（我的思考）` for source-first personal reflections. Each detailed card contains only Leo's original words, the context in which they appeared, and Codex's completed argument.
3. Open `照片` to upload and review class memories.
4. Open `资料` for protected originals and their searchable Markdown mirrors.
5. Open `课堂笔记（完全内容整合版）` for the reviewed monthly learning record.
6. Turn on `Edit mode` only when changing personal notes or month content; changes save locally first and sync to D1 when available.

The page intentionally keeps only these four month cards. The knowledge section intentionally keeps one search input. That input searches index metadata, the full Markdown bodies, and current D1-backed Reflection and class-note text.

Uploaded files are stored in R2 and referenced by private `/api/emba/file/...` URLs.

## Knowledge Base

The private knowledge base lives under `emba/content/` and is loaded by the `/emba/` page after access is granted.

Use this structure for monthly EMBA material:

```text
emba/content/
├── 00_EMBA_Master_Index.md
├── knowledge-index.json
├── 2026/
│   └── 07_July/
│       ├── 2026-07_EMBA_Learning_Index.md
│       ├── originals/
│       ├── converted-md/
│       ├── course-notes/
│       ├── readings/
│       ├── cases/
│       ├── assignments/
│       ├── reflections/
│       └── work-applications/
├── themes/
└── templates/
```

Original PDF, PPT, Word, image, and case files should stay in private R2 when they need to be clickable on the site. Their Markdown mirrors should live in `converted-md/` with frontmatter that points back to the original through `source_file` or `source_files`; all clickable private originals use protected `/api/emba/file/...` URLs.

## Canonical Layers

Each piece of learning has one owner per layer:

- R2 original: authoritative evidence for PDFs, PPTs, Word files, images, and other binaries.
- `emba/content/**/*.md`: canonical searchable and future-RAG mirror; one substantive Markdown file is indexed once.
- `emba/materials.json`: shipped month structure and protected links, not a second prose archive.
- D1 `emba_state`: Leo's live month edits and uploaded-file references. Older reflection workflow fields remain in history but are not displayed as personal reflection content.
- `knowledge-index.json`: machine-readable discovery metadata; Markdown body text is loaded at search time.

Older duplicate notes may remain in the repository as an archive, but they should not appear as a separate Material card or a second `knowledge-index.json` entry.

`knowledge-index.json` is the machine-readable search index for the website. Update it whenever a new substantive Markdown note is added. Keep `md_file` unique, and keep `source_file` on protected `/api/emba/file/...` URLs for private originals. Later this same structure can feed a RAG pipeline by chunking Markdown files where `rag_include: true`.

For every new PDF or PPT:

1. Upload the original to private R2.
2. Create a search-safe Markdown mirror in the correct month.
3. Add the original and mirror link to `emba/materials.json`.
4. Add the Markdown exactly once to `knowledge-index.json`.
5. Update the monthly index and run `tests/emba-cloud-static.test.mjs`.
