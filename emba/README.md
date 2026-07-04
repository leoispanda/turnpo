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

- `functions/api/emba/library.js` stores month structure, reflections, material metadata, and memory captions in D1.
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
4. Open `Material` to upload class files or add links/notes.

Uploaded files are stored in R2 and referenced by private `/api/emba/file/...` URLs.
