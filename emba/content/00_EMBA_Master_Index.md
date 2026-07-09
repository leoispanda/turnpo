---
id: emba-master-index
title: EMBA Master Index
type: master_index
program: EMBA
school: Maastricht University
date: 2026-07-09
year: 2026
month: 2026-07
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
| 2026-07 | [July 2026 EMBA Learning Index](./2026/07_July/2026-07_EMBA_Learning_Index.md) | leadership, learning, coaching, AI, inclusion, organizational learning | First EMBA handwritten notes converted into searchable Markdown. |

## Courses And Sessions

| Course or session | Month | Notes |
| --- | --- | --- |
| Lead in Learning | 2026-07 | [EMBA July 2026 Handwritten Notes Analysis](./2026/07_July/converted-md/2026-07-01-leadership-learning-handwritten-notes.md) |

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
