---
id: emba-master-index
title: EMBA Master Index
type: master_index
program: EMBA
school: Maastricht University
date: 2026-07-09
year: 2026
month:
visibility: private
status: active
tags:
  - emba
  - learning-system
  - knowledge-base
keywords:
  - monthly index
  - searchable markdown
  - source files
  - future RAG
summary: Master index for the private EMBA knowledge base. It links monthly learning indexes, converted Markdown mirrors, original files, and theme pages.
related_topics:
  - leadership
  - strategy
  - finance
  - ai-and-digital-transformation
  - decision-making
  - personal-growth
rag_include: true
created_at: 2026-07-09
updated_at: 2026-07-09
---

# EMBA Master Index

This is the private top-level map for Leo's EMBA learning system inside Turnpo.

The rule is simple:

- Original files stay available as source material.
- Markdown files act as searchable mirrors and AI-readable learning records.
- Monthly indexes organize each month's learning.
- Theme pages connect ideas across months and courses.
- `knowledge-index.json` powers the website search UI.

## Monthly Indexes

| Month | Index | Main topics | Notes |
| --- | --- | --- | --- |
| 2026-06 | [June 2026 EMBA Preparation Index](./2026/06_June/2026-06_EMBA_Preparation_Index.md) | admission, enrolment, onboarding, programme planning, fees, electives | Preparation-stage document analysis plus source-document mirrors for the main June MBA preparation PDFs. |
| 2026-07 | [July 2026 EMBA Learning Index](./2026/07_July/2026-07_EMBA_Learning_Index.md) | leadership, learning, coaching, AI, inclusion, organizational learning | Official Leading in Learning programme mirror plus handwritten notes converted into searchable Markdown. |

## Current Corpus

| Month | Searchable Markdown | Original-source status | Retrieval role |
| --- | --- | --- | --- |
| 2026-06 | One monthly index, one preparation document analysis, and eight source-document mirrors | Eight June source PDFs are uploaded to private R2 under `emba/2026-06/material/` and served through `/api/emba/file/...`; Markdown mirrors remain the searchable retrieval layer | Admission, enrolment, onboarding, fees, programme structure, elective strategy, strategic thinking, alternative-MBA comparison |
| 2026-07 | One monthly index, one official programme mirror, one overall handwritten-note analysis, 13 per-image Markdown notes, one questions/reflections review queue, and one original personal-marker extract | Original handwritten images remain under `/emba/materials/2026-07/handwritten-notes/images/`; the official programme PDF is uploaded to private R2 under `emba/2026-07/material/` and served through `/api/emba/file/...` | Official July schedule, leadership practice, listening, coaching, organizational learning, AI, inclusion, personal review, original Leo/I see/question/star markers |

## Courses And Sessions

| Course or session | Month | Notes |
| --- | --- | --- |
| EMBA Preparation | 2026-06 | [EMBA Preparation Documents Analysis](./2026/06_June/converted-md/2026-06-emba-preparation-documents-analysis.md) |
| EMBA Preparation Source Documents | 2026-06 | [June source-document mirrors](./2026/06_June/converted-md/source-documents/2026-06-maastricht-curriculum-elective-modules.md) and sibling files |
| Lead in Learning Official Programme | 2026-07 | [MaastrichtMBA Leading In Learning Programme - July 2026](./2026/07_July/converted-md/source-documents/2026-07-leading-in-learning-programme.md) |
| Lead in Learning | 2026-07 | [EMBA July 2026 Handwritten Notes Analysis](./2026/07_July/converted-md/2026-07-01-leadership-learning-handwritten-notes.md) |
| Personal Review Queue | 2026-07 | [July 2026 Questions And Reflections Review Queue](./2026/07_July/reflections/2026-07-questions-and-reflections-review.md) |
| Personal Marker Extract | 2026-07 | [July 2026 Personal Marker Original Extract](./2026/07_July/reflections/2026-07-personal-marker-original-extract.md) |

## Content Types

| Type | Folder |
| --- | --- |
| Original source files | `originals/` |
| Converted Markdown mirrors | `converted-md/` |
| Course notes | `course-notes/` |
| Reading summaries | `readings/` |
| Case studies | `cases/` |
| Assignments | `assignments/` |
| Personal reflections | `reflections/` |
| Work applications | `work-applications/` |

## Theme Pages

- [Leadership](./themes/leadership.md)
- [Strategy](./themes/strategy.md)
- [Finance](./themes/finance.md)
- [AI and Digital Transformation](./themes/ai-and-digital-transformation.md)
- [Decision Making](./themes/decision-making.md)
- [Personal Growth](./themes/personal-growth.md)

## Future RAG Notes

When RAG is added, use Markdown files with `rag_include: true`, split content by headings, and keep chunk metadata:

- title
- course
- date
- month
- tags
- keywords
- source file
- Markdown file path
- section heading

If retrieved content is insufficient, the assistant should say the EMBA knowledge base does not contain enough information instead of guessing.

## Operating Rule For New Documents

Every future PDF, PPT, Word document, image set, assignment, or note should produce two durable layers:

- The original file remains available in the right private location, preferably R2 via `/api/emba/file/...` when it should be clickable on the EMBA site.
- A Markdown mirror is created in the month folder, usually under `converted-md/source-documents/`, so search, future RAG, and human review can find it quickly.
- The monthly index is updated with the file, summary, concepts, work applications, and retrieval keywords.
- `knowledge-index.json` is updated only with private, search-safe metadata and paths.
- `emba/materials.json` is updated with the private original-file URL for EMBA timeline Material clicks, while notes can point back to the Markdown mirror.
