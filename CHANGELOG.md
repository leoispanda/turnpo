# Turnpo Change Log

This file records human-readable product and code changes for Turnpo.

Future updates should be appended at the top with the same structure:

- Date
- Version
- Commit, when available
- What changed
- Verification

## 2026-06-11 - next after v0.1.141

Commit: pending - `Add admin owner mode switch`

### Changed

- Added a persistent `My profile` header action for logged-in owner sessions.
- Made admin users who also own a profile able to switch from Admin dashboard back into owner edit mode.
- Added an `owner-session` UI state so profile ownership and admin access can coexist cleanly.
- Kept the `Admin` action available for admin users so the same account can move between owner mode and admin mode.

### Verification

- Ran `node --check script.js`.
- Ran `node --check` across all `functions/api/**/*.js` files.
- Ran `git diff --check`.
- Verified the header contains the `My profile` owner-session action.
- Verified owner-session state is applied from login/session/registration profile data and cleared on expired sessions.
- Verified the local static page responds with `200 OK`.

## 2026-06-11 - v0.1.141

Commit: `88181dd` - `Simplify admin role model`

### Changed

- Simplified Turnpo's active role model to two roles: `admin` and `user`.
- Made `admin` the highest current role with all read-only management scopes, including account, profile, moderation, role audit, and future platform-owner scope.
- Removed active `owner_admin`, `moderator`, and `support` role resolution from the product for now.
- Kept the server-side scope structure so future admin sub-roles can be added later without changing the dashboard contract.
- Updated the Admin dashboard access check to treat only `admin` or `admin:read` scope as privileged.
- Updated backend documentation so Cloudflare setup only requires `TURNPO_ADMIN_EMAILS` for admin access.

### Verification

- Ran `node --check script.js`.
- Ran `node --check` across all `functions/api/**/*.js` files.
- Ran `git diff --check`.
- Verified a normal user session receives `403` from `/api/admin/summary`.
- Verified only an email in `TURNPO_ADMIN_EMAILS` receives admin access.
- Verified legacy `TURNPO_MODERATOR_EMAILS` and `TURNPO_SUPPORT_EMAILS` values no longer grant admin access.
- Verified admin access includes the current highest management scope payload.
- Verified inactive user records still do not restore as authenticated sessions.

## 2026-06-11 - v0.1.140

Commit: `3d49e59` - `Expand admin roles and scopes`

Note: This commit added a broader role/scopes foundation. The following update simplified the active product model back to `admin` and `user` only, while keeping scopes for future expansion.

### Changed

- Added a server-side role model for `owner_admin`, `admin`, `moderator`, `support`, and `user`.
- Added explicit management scopes including `admin:read`, `accounts:read`, `profiles:read`, `moderation:read`, `roles:read`, and `platform:owner`.
- Made Cloudflare environment variables the source of truth for privileged access, so removing an email from a role list removes access without editing KV user records.
- Extended auth session, login, registration, and admin API responses with role labels, scopes, management areas, and read-only status.
- Made session restoration reject inactive/disabled user records instead of treating an old cookie as authenticated.
- Updated the Admin dashboard to show the current viewer role, server scopes, and management range.
- Updated the Admin user table to show each account's resolved role and concise management scope.
- Adjusted admin profile counts to use user-linked profile usernames first, reducing confusing historical KV key over-counting.
- Updated backend documentation with admin role variables and scope boundaries.

### Verification

- Ran `node --check script.js`.
- Ran `node --check` across all `functions/api/**/*.js` files.
- Ran `git diff --check`.
- Verified a normal user session receives `403` from `/api/admin/summary`.
- Verified configured `admin`, `moderator`, and `support` emails resolve to the expected server-side scopes.
- Verified inactive user records do not restore as authenticated sessions.
- Verified the admin summary returns user-linked published profile counts and includes the current viewer role/scope payload.
- Verified the admin user list returns resolved roles and management areas without exposing private draft content.

## 2026-06-11 - next after v0.1.138

Commit: `c070250` - `Add login and admin MVP`

### Changed

- Added a KV-backed user registry using `user:email:{email}` and `user:id:{id}` records so Turnpo can track normal users, profile owners, and admin roles without a D1 migration.
- Extended email-code login sessions with `userId`, `email`, `profile`, and `role` while preserving existing profile owner access.
- Added server-side admin role resolution through `TURNPO_ADMIN_EMAILS` and `requireAdminSession()`.
- Added read-only admin APIs: `GET /api/admin/summary` and `GET /api/admin/users`.
- Added a visible `Log in` button in the header and an admin-only `Admin` entry point for authenticated admin users.
- Added a read-only `/admin` dashboard with account totals, new account counts, profile counts, disabled/deleted account count, and a basic user list.
- Added `/admin` SPA routing, noindex headers, and robots exclusion.
- Updated registration and login text to reflect the email-code account flow.
- Updated backend documentation with the KV user registry, admin dashboard routes, and required `TURNPO_ADMIN_EMAILS` setup.

### Verification

- Ran `node --check script.js`.
- Ran `node --check` across all `functions/api/**/*.js` files.
- Ran `git diff --check`.
- Verified a normal user session receives `403` from `/api/admin/summary`.
- Verified an admin email from `TURNPO_ADMIN_EMAILS` receives `200` from `/api/admin/summary` and can read `/api/admin/users`.
- Verified admin summary returns account, profile, draft, and disabled/deleted counts from KV without exposing draft content.
- Verified registration still requires email-code verification, creates a `user:id:*` record, returns role `user`, and stores only sanitized public profile data.

## 2026-06-10 - v0.1.137

Commit: this commit - `Add public profile consent gates`

### Changed

- Added `legal/docs/TURNPO_PUBLIC_PROFILE_TERMS_PRIVACY_DISCLAIMER_v0.2.md` as the Turnpo public-profile terms, privacy notice, and publication disclaimer.
- Added six separate required registration acknowledgements covering public-profile visibility, third-party indexing and copying risk, user content responsibility, confidential and third-party content restrictions, AI import review responsibility, and agreement to the legal notice.
- Enforced all registration acknowledgements in the registration API and recorded acceptance of legal notice version `0.2` with the new profile.
- Added a required AI import safety acknowledgement before source text can be submitted.
- Added an owner-only publish confirmation dialog with a required checkbox and the action text `Yes, publish publicly`.
- Required confirmation before publishing the full profile, saving content directly as Published, restoring content to Published, or using an item-level Publish action.
- Added a footer link to the legal notice and changed the remaining `PRIVATE PREVIEW` label to `PUBLIC PROFILES`.
- Preserved the existing owner/admin visibility rule so public visitors cannot see owner-only controls.

### Verified

- Ran `node --check script.js`.
- Ran `node --check functions/api/ai/import-profile.js`.
- Ran `node --check functions/api/auth/register.js`.
- Ran `git diff --check`.
- Verified the registration drawer renders six required acknowledgement checkboxes on desktop and mobile.
- Verified the AI import acknowledgement and publish confirmation checkbox are required and the publish button text is exact.
- Verified public visitor mode renders zero visible `.owner-only` controls.
- Verified the mobile registration drawer has no horizontal overflow.
- Checked browser console warnings and errors.

## 2026-06-10 - v0.1.136

Commit: this commit - `Split AI imports into separate Life drafts`

### Changed

- Changed the AI import response from a single draft object to a `drafts` array with support for up to 20 Life drafts per import.
- Instructed the AI to split source material when dates, locations, roles, events, headings, URLs, or topics indicate separate experiences.
- Added a short source excerpt to each AI result so its month can be validated against the relevant source section instead of the full multi-event input.
- Added multi-draft preview text, draft numbering, detected-title summaries, and a dynamic batch-add button.
- Made one action create every detected experience as a separate hidden Life draft with its own title, date, location, summary, meaning, and tags.
- Updated the AI import interface text to clarify that multiple posts, CV entries, notes, and experiences can be imported together.

### Verified

- Ran `node --check script.js`.
- Ran `node --check functions/api/ai/import-profile.js`.
- Ran `git diff --check`.
- Verified the server rejects an empty `drafts` collection and limits accepted results to 20.
- Verified the frontend remains compatible with the previous single-draft response shape.

## 2026-06-10 - v0.1.135

Commit: `cef1cf8` - `Fix AI import location and language`

### Changed

- Added a structured `location` field to AI-generated Life drafts.
- Made the AI extract the event location instead of always using the profile owner's home location.
- Added the profile location as a fallback only when the source does not identify an event location.
- Required non-English place names to be translated or romanized into their standard English names.
- Changed generated titles, summaries, meaning, tags, analysis, and document labels to natural English regardless of source language.
- Rebuilt the generated document from normalized structured fields so its location and date match the values saved to the Life draft.

### Verified

- Ran `node --check script.js`.
- Ran `node --check functions/api/ai/import-profile.js`.
- Ran `git diff --check`.
- Verified imported Life drafts use the AI-extracted location before the profile fallback.

## 2026-06-10 - v0.1.134

Commit: `7be03cd` - `Fix AI import month handling`

### Changed

- Added a required structured month field to AI import results.
- Added deterministic English and Chinese month parsing so values such as `7月` are normalized to `July`.
- Made the server prefer the month explicitly present in the user's source over an incorrect model response.
- Saved imported Life dates as complete month-and-year values instead of storing the year alone.
- Added the same month handling to the local fallback generator.

### Verified

- Ran `node --check script.js`.
- Ran `node --check functions/api/ai/import-profile.js`.
- Ran `git diff --check`.
- Verified an imported July event no longer falls back to the current month of June.

## 2026-06-10 - v0.1.132

Commit: `616a838` - `Clarify AI import fallback`

### Changed

- Kept the OpenAI-generated import as the primary workflow.
- Made the local text generator an explicit fallback shown only after the AI API fails.
- Clarified generated-document, hidden-draft, manual-image, and owner-review messaging.

### Verified

- Ran JavaScript syntax checks.
- Verified the fallback action remains hidden during a successful AI import.

## 2026-06-10 - v0.1.130

Commit: `a224058` - `Connect AI text import API`

### Changed

- Added the authenticated `/api/ai/import-profile` endpoint backed by the OpenAI Responses API.
- Added strict structured output for generated Turnpo Life draft fields.
- Connected the owner interface to the API and preserved a local fallback path.
- Kept imported content hidden until the owner reviews and explicitly publishes it.

### Verified

- Ran JavaScript syntax checks.
- Verified API errors are surfaced in the owner interface without automatically publishing content.

## 2026-06-10 - v0.1.128

Commit: `de97491` - `Add AI text import drafts`

### Changed

- Added the owner-only AI text import drawer and source-text workflow.
- Added generated document preview, copy, and hidden-Life-draft actions.
- Added local text analysis and draft generation as the initial import implementation.
- Kept image selection manual and required owner review before publishing.

### Verified

- Ran JavaScript syntax checks.
- Verified generated imports are added as hidden Life content.

## 2026-06-07 - v0.1.117

Commit: this commit - `Align public 2021 story count`

### Changed

- Tightened the public-only imported-story filter to exclude activity invite posts such as `welcome all` / `visit this AR booth`.
- Removed the 2021 TCCN booth invite from public visitor timeline while keeping it available in owner mode.
- Aligned public seed 2021 visible highlights with the owner draft count of 3.
- Bumped frontend cache/version references to `v0.1.117`.

### Verified

- Ran `node --check script.js`.
- Ran `git diff --check`.
- Verified public seed now renders 40 curated public stories.
- Verified public mode shows `2021 3 visible highlights`.
- Verified the excluded TCCN invite no longer appears in public timeline.
- Checked browser console warnings/errors.

## 2026-06-07 - v0.1.116

Commit: this commit - `Separate public seed from owner draft`

### Changed

- Separated visitor-facing public seed loading from owner localStorage draft loading.
- Made public profile routes always reload the committed published seed instead of saved local owner drafts.
- Made owner mode explicitly show `Viewing local owner draft`.
- Made public mode explicitly show `Viewing published public profile`.
- Renamed the owner-only reset action to `Reset local draft / restore public seed`.
- Kept the reset action inside Owner tools only and made it span the tool grid for readability.
- Bumped frontend cache/version references to `v0.1.116`.

### Verified

- Ran `node --check script.js`.
- Ran `git diff --check`.
- Verified public mode shows `Viewing published public profile`, hides Owner tools, renders 41 public story cards, and shows `2021 4 visible highlights`.
- Verified the reset button remains inside the owner-only tool grid.
- Reproduced the 2021 `4` vs `3` count difference: public seed has 4 curated 2021 stories, while a local owner draft with one 2021 story hidden would show 3 if public mode read localStorage.
- Checked browser console warnings/errors.

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
