# Turnpo Change Log

This file records human-readable product and code changes for Turnpo.

Future updates should be appended at the top with the same structure:

- Date
- Version
- Commit, when available
- What changed
- Verification

## 2026-06-07 - v0.1.115

Commit: this commit - `Require explicit public approval`

### Changed

- Made public content deny-by-default: content only becomes public when `status` is explicitly `published` and `userApproved` is explicitly `true`.
- Changed missing or unknown content status to normalize as `hidden` instead of `published`.
- Changed published content without explicit approval to remain private.
- Removed the profile normalization exception that made Leo public without an explicit published profile status.
- Made new owner-created content default to `Hidden` so publishing requires an explicit status choice.
- Bumped frontend cache/version references to `v0.1.115`.

### Verified

- Ran `node --check script.js`.
- Verified missing `userApproved`, missing `status`, and draft content do not pass public checks.
- Verified explicit `published + userApproved: true` story and AI work records pass public checks.
- Verified public visitor profile still renders 41 curated stories and 4 AI works with no hidden/deleted/private cards.
- Checked browser console warnings/errors.

## 2026-06-07 - v0.1.114

Commit: this commit - `Filter imported LinkedIn noise from public stories`

### Changed

- Added a public-only curated story gate on top of published/user-approved status.
- Hid low-value LinkedIn imports from visitor-facing timeline, including `LinkedIn share`, `LinkedIn update`, source-only posts, hiring/job/career referrals, and ASML promo/link posts.
- Kept these imported records available in owner mode for future editing, publishing decisions, or cleanup.
- Bumped frontend cache/version references to `v0.1.114`.

### Verified

- Ran `node --check script.js`.
- Verified public story count drops from 72 published records to 41 curated public stories.
- Verified 2021 public timeline drops from 19 visible highlights to 4 curated highlights.
- Verified 2020 no longer appears publicly because its remaining records are LinkedIn share/source-only imports.
- Verified no hidden/deleted/private cards, source links, full source blocks, or LinkedIn noise terms render in public timeline.
- Checked browser console warnings/errors.

## 2026-06-07 - v0.1.113

Commit: this commit - `Keep public profiles out of owner mode`

### Changed

- Stopped existing owner sessions from automatically switching public profile URLs into owner mode.
- Kept direct `/u/<profile>` visits in visitor mode by default so only published stories render publicly.
- Made owner mode reset to the Visible timeline filter when entered or exited, keeping Hidden and Deleted views owner-only and explicit.
- Bumped frontend cache/version references to `v0.1.113`.

### Verified

- Ran `node --check script.js`.
- Verified desktop public profile opens with `ownerMode=false`, no hidden/deleted/private story cards, and no visible owner management controls.
- Verified mobile public profile opens with `ownerMode=false`, no hidden/deleted/private story cards, no visible owner management controls, and no horizontal overflow.
- Checked browser console warnings/errors.

## 2026-06-07 - v0.1.112

Commit: this commit - `Simplify public story cards`

### Changed

- Removed source links, raw source text expanders, and tag chips from visitor-facing story cards.
- Hid source-only URL summaries in public story cards so LinkedIn feed links do not appear as story details.
- Reused the cleaned story summary in public search, AI-readable Markdown, and structured data.
- Kept owner-mode source text, source links, and tags available for management.
- Bumped frontend cache/version references to `v0.1.112`.

### Verified

- Ran `node --check script.js`.
- Verified desktop public visitor timeline renders no story source links, source text blocks, tag rows, or raw LinkedIn summary links.
- Verified mobile public visitor timeline renders no story source links, source text blocks, tag rows, or raw LinkedIn summary links.
- Verified published story count remains visible and hidden/deleted/private cards remain excluded.
- Checked browser console warnings/errors.

## 2026-06-07 - v0.1.111

Commit: this commit - `Harden public visibility filtering`

### Changed

- Centralized public visibility filtering so visitor-facing stories and AI works both require `published` status and user approval.
- Synced hide, delete, publish, restore, and permanent-delete actions into `publicState` so hidden/deleted IDs stay excluded from public outputs.
- Kept hidden and deleted content out of public timeline, public AI works, AI-readable Markdown, and structured data paths.
- Bumped frontend cache/version references to `v0.1.111`.

### Verified

- Ran `node --check script.js`.
- Verified public visitor timeline renders no hidden, deleted, or private cards on desktop.
- Verified public AI works render no private cards.
- Verified `Open all` / `Close all` timeline controls work in public visitor mode.
- Verified mobile public visitor mode has no hidden, deleted, or private cards and no horizontal overflow.
- Checked browser console warnings/errors.

## 2026-06-07 - v0.1.110

Commit: pending - `Publish dishkai AI product`

### Changed

- Added `dishkai` to the committed AI products seed data.
- Marked `dishkai` as published and user-approved so it appears for public visitors.
- Bumped frontend cache/version references to `v0.1.110`.

### Verified

- Ran `node --check script.js`.
- Verified `dishkai` appears in public visitor AI products.
- Verified public AI products render `dishkai`, `Turnpo`, `MapKAI`, and `MapKAI PDC`.
- Verified public AI-readable Markdown includes `dishkai`.
- Verified owner-only controls remain hidden from public visitors.
- Checked browser console warnings/errors.

## 2026-06-07 - v0.1.108

Commit: pending - `Restore published public timeline records`

### Changed

- Removed the public story/work allowlist that incorrectly hid older published timeline records.
- Restored public rendering to show all content with `published` status and user approval.
- Kept `hidden` and `deleted` content excluded from visitor-facing timeline, AI works, search, and AI-readable Markdown.
- Bumped frontend cache/version references to `v0.1.108`.

### Verified

- Ran `node --check script.js`.
- Verified public timeline records were restored across all published years.
- Verified public timeline renders 72 published stories and all expected year filters.
- Verified no private, hidden, or deleted cards render for visitors.
- Verified owner-only controls remain hidden from public visitors.
- Checked browser console warnings/errors.

## 2026-06-07 - v0.1.106

Commit: pending - `Restrict public profile to approved content`

### Changed

- Added explicit public allowlists for Leo's visitor-visible timeline stories and AI works.
- Updated public timeline, AI-readable Markdown, search indexing, and AI works rendering to require both published status and public allowlist membership.
- Kept hidden and deleted IDs excluded even if a seed item still carries a published status.
- Bumped frontend cache/version references to `v0.1.106`.

### Verified

- Ran `node --check script.js`.
- Verified public visitor mode renders only the six allowlisted published timeline stories.
- Verified public visitor mode renders only the three allowlisted published AI works.
- Verified no hidden, deleted, or private timeline cards render in public visitor mode.
- Verified public AI-readable Markdown excludes non-allowlisted timeline years/content.
- Verified owner-only controls remain hidden from public visitors.
- Checked browser console warnings/errors.

## 2026-06-07 - v0.1.104

Commit: pending - `Restore public timeline controls`

### Changed

- Restored the public timeline `Open all` and `Close all` controls.
- Kept owner-only timeline filters hidden from public visitors.
- Bumped frontend cache/version references to `v0.1.104`.

### Verified

- Ran `node --check script.js`.
- Verified `Open all` and `Close all` are visible in public profile mode.
- Verified owner-only timeline filters remain hidden from public visitors.
- Verified `Open all` expands all timeline years and `Close all` collapses all timeline years.
- Checked browser console warnings/errors.

## 2026-06-07 - v0.1.102

Commit: pending - `Enlarge public AI Markdown preview`

### Changed

- Enlarged the public AI-readable Markdown strip so the preview area can show more content.
- Made the right-side Markdown preview wider and taller.
- Reduced the preview font size so visitors can immediately recognize it contains dense Markdown text.
- Bumped frontend cache/version references to `v0.1.102`.

### Verified

- Ran `node --check script.js`.
- Verified the public AI-readable Markdown preview at 1280px, 599px, and 390px browser widths.
- Verified the right-side Markdown preview is wider/taller and shows roughly seven visible lines.
- Verified no horizontal overflow at tested widths.
- Checked browser console warnings/errors.

## 2026-06-07 - v0.1.100

Commit: this commit - `Persist public timeline state`

### Changed

- Added a committed `publicState` layer for profile visibility overrides so hidden/deleted public content can be preserved outside a single browser origin.
- Applied `publicState` during profile normalization before public timeline, AI Markdown, and AI works rendering.
- Persisted the default public timeline collapsed-year state the first time a profile is rendered.
- Bumped frontend cache/version references to `v0.1.100`.

### Verified

- Ran `node --check script.js`.
- Verified public timeline defaults to 2026 open with older years collapsed after reload.
- Verified manual year open/collapse choices persist after reload once the default state has been applied.
- Verified public timeline renders no hidden/deleted/private cards when content state marks items non-public.
- Verified public owner/admin controls remain hidden.
- Checked browser console warnings/errors.

## 2026-06-07 - v0.1.97

Commit: this commit - `Refine public AI Markdown strip`

### Changed

- Reworked the public AI-readable Markdown card into a slimmer horizontal strip.
- Moved the copy control to the left as a compact icon button.
- Kept the AI-readable label and helper text in the middle.
- Moved the Markdown preview into a narrower document-style window on the right.
- Bumped frontend cache/version references to `v0.1.97`.

### Verified

- Ran `node --check script.js`.
- Verified the public AI-readable Markdown strip layout at 1280px, 599px, and 390px browser widths.
- Verified the strip keeps the copy icon on the left, the AI-readable label/helper in the middle, and the Markdown preview window on the right.
- Verified no horizontal overflow at tested widths.
- Checked browser console warnings/errors.
- Copy click could not be end-to-end verified in Browser comment mode because the Codex comment overlay intercepted pointer events; verified the hidden full Markdown source remains populated for the copy action.

## 2026-06-07 - v0.1.96

Commit: this commit - `Polish public AI Markdown card`

### Changed

- Restyled the public AI-readable profile widget into a compact Markdown context card.
- Added a clear `AI-readable Markdown` label, helper text, small copy button, and ultra-small structured preview.
- Kept the full Markdown source available for copy behavior while hiding raw textarea UI from public visitors.
- Bumped frontend cache/version references to `v0.1.96`.

### Verified

- Ran `node --check script.js`.
- Verified public desktop and mobile layouts in browser.
- Verified the copy button copies the full AI-readable Markdown.
- Verified the full owner AI-readable panel remains hidden in public mode.
- Checked browser console warnings/errors.

## 2026-06-07 - v0.1.95

Commit: this commit - `Move public AI profile preview into hero`

### Changed

- Moved the public AI-readable profile preview into the left hero intro area below the profile links.
- Replaced the standalone public AI panel with a compact horizontal strip.
- Added a square icon-only copy button on the left and a long preview textbox on the right.
- Kept the full AI-readable panel available only in owner/admin mode.
- Bumped frontend cache/version references to `v0.1.95`.

### Verified

- Ran `node --check script.js`.
- Verified public desktop strip is positioned under the hero links.
- Verified public desktop strip is `760px` wide with a `54px` square copy button and `696px` preview box.
- Verified public mobile strip is `336px` wide with a `48px` square copy button and `280px` preview box.
- Verified full AI-readable panel is hidden in public mode.
- Verified public owner/admin controls remain hidden.
- Verified no horizontal overflow on desktop or mobile.
- Checked browser console warnings/errors; none were reported.

## 2026-06-07 - v0.1.94

Commit: this commit - `Shrink public AI profile panel`

### Changed

- Reduced the public AI-readable profile panel from a large editor-like block into a compact copy/preview widget.
- Kept the larger AI-readable panel behavior available for owner/admin mode.
- Reduced public textarea height, font size, padding, copy button size, and panel width.
- Bumped frontend cache/version references to `v0.1.94`.

### Verified

- Ran `node --check script.js`.
- Verified public desktop AI panel is about `420px` wide and `257px` tall.
- Verified public mobile AI panel is about `335px` wide and `262px` tall.
- Verified public owner/admin controls remain hidden.
- Verified no horizontal overflow on desktop or mobile.
- Checked browser console warnings/errors; none were reported.

## 2026-06-07 - v0.1.93

Commit: this commit - `Polish public profile UI`

### Changed

- Refined the public profile hero spacing, background depth, portrait card shadow, link chips, and headline scale for a calmer premium first impression.
- Changed the public profile content flow so the timeline becomes the main story section and the AI-readable Markdown panel moves after it as supporting context.
- Hid public-mode timeline bulk controls while keeping owner-mode management controls intact.
- Added public-mode timeline defaults that expand only the newest year and collapse older years, preserving access while making the page easier to scan.
- Removed empty media placeholders from public timeline cards that do not have images.
- Polished public timeline cards with softer borders, cleaner spacing, and full-width text cards for no-media stories.
- Reworked AI works into a curated three-card portfolio layout on desktop and a readable single-column layout on mobile.
- Bumped frontend cache/version references to `v0.1.93`.

### Verified

- Captured before screenshots for desktop and mobile public profile.
- Captured final screenshots for desktop hero, timeline, AI works/AI-readable area, and mobile.
- Verified public owner/admin controls are not visible in public mode.
- Verified desktop public profile has no horizontal overflow.
- Verified mobile public profile has no horizontal overflow.
- Verified public timeline defaults to 6 visible latest-year cards with 10 older years collapsed.
- Verified no empty public timeline media placeholders remain visible.
- Verified AI works render as 3 portfolio cards on desktop and 1 column on mobile.
- Ran `node --check script.js`.
- Checked browser console warnings/errors; none were reported.
- Checked for Lighthouse CLI; it was not installed locally.

## 2026-06-07 - v0.1.91

Commit: this commit - `Add Turnpo changelog`

### Changed

- Added this `CHANGELOG.md` file as the human-readable Turnpo change record.
- Established the format for future updates: date, version, commit, changed items, and verification.
- Bumped frontend cache/version references to `v0.1.91`.

### Verified

- Confirmed no previous changelog file existed.
- Confirmed the file is committed as a standalone project record.

## 2026-06-07 - v0.1.90

Commit: `fde567b` - `Improve profile media controls`

### Changed

- Fixed AI work cards so the whole card is no longer a link containing owner action buttons.
- Added a separate `Open work` link action for each AI work card.
- Added owner controls for AI works: hide, publish, delete, restore, permanently delete, and edit.
- Added an avatar vertical position slider in the owner profile editor.
- Adjusted Leo's default profile avatar crop to show more headroom.
- Bumped frontend cache/version references to `v0.1.90`.

### Verified

- Ran `node --check script.js`.
- Verified the profile page renders in the browser.
- Verified AI work cards render with separate `Open work` links and no nested interactive elements.
- Verified the avatar crop uses `object-position: 50% 8%` on desktop and mobile.
- Verified no relevant browser console errors or warnings during local checks.
