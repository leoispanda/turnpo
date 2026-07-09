# EMBA Timeline

This folder powers the private Turnpo EMBA timeline at `/emba/`.

The local page has a lightweight browser password gate. Current local password:

```text
emba2026
```

On Cloudflare Pages, `/emba/*` is protected by `functions/emba/[[path]].js`. Set the Pages environment variable:

```text
EMBA_ACCESS_CODE=emba2026
```

## Cloud Sync

EMBA edits sync through Pages Functions:

- `functions/api/emba/library.js` stores month structure, reflections, searchable Markdown notes, material metadata, and memory captions in D1.
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
```

If either binding is missing, the page still works locally using browser storage, but edits will not sync to the cloud.

## Editing

After entering the access code:

1. Hover the monthly timeline to select a month.
2. Open `Memory Moment` to upload photos and captions.
3. Open `Reflection` to write notes.
4. Open `Markdown` to keep searchable monthly notes in plain Markdown.
5. Open `Material` to upload class files or add links/notes.

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

Original PDF, PPT, Word, image, and case files should stay in `originals/` or the existing private material folder. Their Markdown mirrors should live in `converted-md/` with frontmatter that points back to the original file through `source_file` or `source_files`.

`knowledge-index.json` is the machine-readable search index for the website. Update it whenever a new Markdown note is added so the page can search by year, month, course, type, tag, keyword, and summary. Later this same structure can feed a RAG pipeline by chunking Markdown files where `rag_include: true`.
