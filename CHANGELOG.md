# Turnpo Change Log

This file records human-readable product and code changes for Turnpo.

Future updates should be appended at the top with the same structure:

- Date
- Version
- Commit, when available
- What changed
- Verification

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
