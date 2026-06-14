# Turnpo Change Log

This file records human-readable product and code changes for Turnpo.

Future updates should be appended at the top with the same structure:

- Date
- Version
- Commit, when available
- What changed
- Verification

## 2026-06-14 - v0.1.169

Commit: `Show upper life atlas earth view`

### Changed

- Reframed the Life Atlas globe as a larger upper-hemisphere hero instead of a complete sphere.
- Let the Earth canvas extend across the section edges while keeping the copy and city list floating in readable foreground positions.
- Tuned the default Northern Hemisphere oblique angle so the Arctic sits near the upper edge rather than dominating the center, with the lower globe fading naturally into darkness.

### Verification

- Ran `node --check script.js`.
- Ran `git diff --check`.
- Verified Cindy's public profile locally in the in-app browser at desktop size: Life Atlas reaches `is-3d-ready`, the canvas spans the section from the left edge, copy and city cards float over the globe, no frame/border is present, no horizontal overflow appears, and no console warnings or errors are logged.
- Verified Cindy's public profile locally at 390px mobile width: Life Atlas reaches `is-3d-ready`, the layout stacks as copy, globe, then city list, no horizontal overflow appears, and no console warnings or errors are logged.

## 2026-06-14 - v0.1.168

Commit: `Float life atlas copy over full globe`

### Changed

- Reworked the Life Atlas section into a single immersive globe stage so the left copy and right city list float over the Earth instead of sitting in separate side columns.
- Pulled the 3D camera back slightly and recentered the globe so the Earth reads as a more complete sphere rather than a cropped close-up.
- Kept the mobile layout readable by reverting to a natural stack order: copy, globe, then city list.

### Verification

- Ran `node --check script.js`.
- Ran `git diff --check`.
- Verified Cindy's public profile locally with a fallback route server at desktop size: Life Atlas reaches `is-3d-ready`, copy and city cards overlay the globe stage, the canvas renders at 1281×778 CSS pixels with a 2562×1556 backing buffer, no horizontal overflow, and no console warnings or errors.
- Verified Cindy's public profile locally at 390px mobile width: Life Atlas reaches `is-3d-ready`, mobile order is copy, globe, then city list, no horizontal overflow, and no console warnings or errors.

## 2026-06-14 - v0.1.167

Commit: `Enlarge and sharpen life atlas globe`

### Changed

- Enlarged the Life Atlas globe area on desktop, tablet, and mobile so the Earth reads as a more immersive hero visual.
- Increased the Three.js globe render resolution cap, sphere geometry density, and texture anisotropy to reduce blur and sharpen the Earth surface.
- Adjusted the camera, globe radius, and fallback image scale so the globe feels larger while preserving the unframed cinematic composition.

### Verification

- Ran `node --check script.js`.
- Ran `git diff --check`.
- Verified Cindy's public profile locally in the in-app browser at desktop size: Life Atlas reaches `is-3d-ready`, canvas renders at 675×600 CSS pixels with a 1350×1200 backing buffer, no horizontal overflow, and no console warnings or errors.
- Verified Cindy's public profile locally at 390px mobile width via the search flow: Life Atlas reaches `is-3d-ready`, canvas renders at 335×420 CSS pixels, no horizontal overflow, and no console warnings or errors.

## 2026-06-13 - v0.1.166

Commit: `Show timeline tags to visitors`

### Fixed

- Restored timeline tags in visitor mode so public personal-experience cards show their tags again.
- Kept owner-mode timeline tags visible while removing the owner-only rendering gate from the tag row.

### Verification

- Ran `node --check script.js`.
- Ran `git diff --check`.
- Verified Cindy's public profile locally in the in-app browser: visitor mode renders 34 timeline tag rows and 82 timeline tags, the first tagged card is visible, tag rows no longer carry `owner-only`, and the console shows no warnings or errors.

## 2026-06-13 - v0.1.165

Commit: `Let profiles choose city marker levels`

### Changed

- Upgraded Life Atlas city markers so each profile can define a city as either `major` or `visited` instead of relying on a global major-city rule.
- Added backwards-compatible `travelPlaces` entries that can store `{ id, category }` while still reading older string-based city ids.
- Added an owner-mode city marker level control when adding a city, plus per-city `Visit` / `Life` controls so each city can be classified independently.
- Preserved city marker levels through the public profile sanitizer so published profiles keep each city's chosen tier.
- Kept Leo/Cindy's default city levels as profile-specific defaults, while other profiles treat cities as visited unless the owner promotes them.

### Verification

- Ran `node --check script.js`.
- Ran `node --check functions/api/auth/_utils.js`.
- Ran `git diff --check`.
- Verified Cindy's public profile locally in the in-app browser: Life Atlas still renders 27 cards, 5 major life-chapter cities, 22 visited cities, a ready Three.js canvas, no public owner controls, and no console warnings or errors.
- Confirmed the public profile sanitizer preserves old string city ids, new `{ id, category }` built-in city entries, and custom city entries with their category.
- Confirmed the owner-mode source now renders explicit per-city `Visit` / `Life` controls and saves city marker levels through `profile.travelPlaces` per city.

## 2026-06-13 - v0.1.164

Commit: `Split life atlas city markers`

### Changed

- Split Life Atlas city markers into major life-chapter cities and subtle visited-city footprints.
- Added the requested major and visited city lists so Leo/Cindy profiles can show the fuller Life Atlas by default without making every city a major anchor.
- Kept labels and soft halo treatment for major cities only; visited cities now render as smaller light dots with labels shown on hover or focus.
- Preserved the cinematic unframed globe direction with soft atmosphere, slow rotation, and a clean Northern Hemisphere focus.

### Verification

- Ran `node --check script.js`.
- Ran `git diff --check`.
- Confirmed the Life Atlas city list contains 5 major cities and 22 visited cities, with no missing ids in the city option table.
- Verified Cindy's profile locally in the in-app browser: Life Atlas renders 27 cards and markers, the 5 major cities appear first with `life chapter` labels, the 22 visited cities render as `visited city`, and default Leo/Cindy cities do not show owner remove controls.
- Confirmed the 3D globe reaches `is-3d-ready`, renders a Three.js canvas, keeps the globe container transparent with no border or rounded frame, shows major labels by default, hides visited labels by default, and reveals a visited label when the city is activated.
- Confirmed the local browser console showed no warnings or errors during the profile check.

## 2026-06-13 - v0.1.163

Commit: `Focus added life atlas cities`

### Changed

- Focuses the Life Atlas globe toward a newly added city so the new place is immediately visible instead of silently rotating on the far side of the Earth.
- Keeps the newly added city briefly active after the profile re-renders, including after the async Three.js globe finishes loading.
- Replaced the oversized gold signal glow with smaller, subtler city lights on the 3D globe, static fallback, and location cards.

### Verification

- Ran `node --check script.js`.
- Ran `git diff --check`.
- Confirmed the add-city path now stores the added city id, focuses the next Life Atlas globe render on that city, and re-applies active state after the async Three.js globe load.
- Confirmed city signal styling was reduced in `script.js` and `styles.css` from large glowing halos to smaller, subtler points for the 3D globe, static fallback, and location cards.
- Browser interaction QA was attempted locally, but the Browser plugin blocked search input automation with a virtual clipboard/read-only page limitation before the profile flow could be re-opened.

## 2026-06-13 - v0.1.162

Commit: `Light all life atlas city places`

### Changed

- Changed Life Atlas globe signals from a three-city hardcoded list to every visited or manually added city with valid latitude/longitude data.
- Updated the owner add-city control from free text/datalist entry to a true city selector so new places are added from available options.
- Kept compatibility with existing saved manual travel places while making built-in city selections the default path for new additions.

### Verification

- Ran `node --check script.js`.
- Ran `git diff --check`.
- Verified Cindy's public profile locally in the in-app browser: Life Atlas reaches `is-3d-ready`, Amsterdam/Eindhoven/Harbin/Shanghai all render as city signal markers from their latitude/longitude data, Germany remains a non-city card without a globe marker, no horizontal overflow is present, and console logs show no warnings or errors.
- Confirmed the owner add-city markup now renders a select/options control in source instead of the previous free-text datalist input.

## 2026-06-13 - v0.1.161

Commit: `Refine life atlas globe hero immersion`

### Changed

- Removed the visible Life Atlas globe panel treatment so the Earth no longer sits inside a bordered, rounded, rectangular map card.
- Enlarged and lowered the globe for a more immersive hero-style composition where the planet can naturally extend toward the lower edge instead of reading as a small complete icon.
- Replaced the hard blue outer ring with a softer atmospheric haze and reduced star noise for a more premium cinematic background.
- Adjusted the default globe angle away from a direct North Pole view toward an oblique Northern Hemisphere/Eurasia view, with calmer rotation.
- Tuned light, shadow, city lights, and signal glow so the visual feels more realistic and less like a default WebGL globe.

### Verification

- Ran `node --check script.js`.
- Ran `git diff --check`.
- Verified Cindy's public profile locally in the in-app browser: the Life Atlas globe reaches `is-3d-ready`, panel/canvas borders and backgrounds are transparent, the Earth renders as a larger immersive oblique Northern Hemisphere visual with no framed map card, desktop and mobile checks show no horizontal overflow, Harbin card activation syncs with the matching marker, and console logs show no warnings or errors.

## 2026-06-13 - v0.1.160

Commit: `Make life atlas globe polar and luminous`

### Changed

- Reframed the Life Atlas globe from a northern polar angle so the Earth reads less like a flat side-view map and more like a complete planet seen from above the Arctic.
- Pulled the camera back and reduced the globe radius so the sphere, atmosphere, and signal points fit inside the center visual without feeling cropped.
- Added a deep-blue starfield, stronger blue atmospheric rim, warm night-light overlay, and brighter place signals so the scene feels like a luminous Earth suspended in night sky.
- Updated the static fallback treatment to match the darker deep-space visual direction when WebGL is unavailable.

### Verification

- Ran `node --check script.js`.
- Ran `git diff --check`.
- Verified Cindy's public profile locally in the in-app browser: the Life Atlas globe reaches `is-3d-ready`, the fallback layer hides, the scene renders as a complete polar-view Earth in deep-blue night sky, Amsterdam/Eindhoven/Harbin/Shanghai/Germany cards remain visible, Harbin card activation syncs with the matching marker, desktop and mobile checks show no horizontal overflow, and console logs show no warnings or errors.

## 2026-06-13 - v0.1.159

Commit: `Anchor life atlas signals to rotating globe`

### Changed

- Replaced the static Life Atlas center image layer with a lightweight rotating Three.js Earth globe using real equirectangular Earth and night-light textures.
- Anchored Eindhoven, Shanghai, and Harbin signals to their latitude/longitude positions on the globe so the warm points rotate with the planet instead of floating over the background.
- Kept the existing left copy, center visual, and right location-card layout, with the NASA image retained as a WebGL fallback and card-to-globe signal highlighting preserved.

### Verification

- Ran `node --check script.js`.
- Ran `git diff --check`.
- Verified Cindy's public profile locally in the in-app browser: the Life Atlas map reaches `is-3d-ready`, the globe canvas is shown while the static fallback is hidden, Eindhoven/Shanghai/Harbin remain the three signal locations, no horizontal overflow was detected in the tested viewport, and console logs show no warnings or errors.

## 2026-06-13 - v0.1.158

Commit: `Use NASA image for life atlas map`

### Changed

- Replaced the Life Atlas center visual with a real NASA Blue Marble Eastern Hemisphere image cropped into a wide cinematic card.
- Removed the previous Three.js/custom-drawn globe layer, fake continent/cloud/city-light CSS treatments, and the unused night texture asset.
- Kept the existing left copy, center visual, and right location-card layout while overlaying warm personal signals for Eindhoven, Harbin, and Shanghai with existing card-to-dot hover/click sync.

### Verification

- Ran `node --check script.js`.
- Ran `git diff --check`.
- Verified Cindy's public profile locally in the in-app browser: the Life Atlas image loads from `/assets/life-atlas-earth.jpg`, only Eindhoven/Harbin/Shanghai signal markers render, previous custom globe/Three.js/fake visual nodes are absent, card click highlights the matching marker, light theme and mobile layouts keep the existing structure with no horizontal overflow, and console logs show no warnings or errors.

## 2026-06-13 - v0.1.157

Commit: `Add cinematic 3D life atlas globe`

### Changed

- Replaced the flat Life Atlas center visual with a lightweight Three.js globe layer while keeping the existing left copy, center map, and right location-card structure.
- Added a local optimized NASA Earth-at-night texture, deep-blue atmosphere lighting, warm location signals, and hover sync between globe points and location cards.
- Lazy-loads the 3D globe when the section approaches the viewport, respects reduced-motion preferences, and keeps a static Earth-horizon fallback when WebGL or the module load is unavailable.

### Verification

- Ran `node --check script.js`.
- Ran `git diff --check`.
- Verified Cindy's public profile locally in the in-app browser: the Life Atlas center visual lazy-loads into a 3D globe, the static fallback fades out after WebGL is ready, right-side cards remain, card click highlights the matching place, light theme keeps the dark cinematic globe, mobile has no horizontal overflow, and console logs show no warnings or errors.

## 2026-06-13 - v0.1.156

Commit: `Add earth horizon life atlas mode`

### Changed

- Reworked the Life Atlas center map into an original Earth-horizon visual inspired by orbital views, without using satellite imagery, Google Earth, paid APIs, backend services, or map tiles.
- Added deep-blue atmosphere, curved globe edge, soft clouds, sunrise glow, and subtle night-light layers while keeping the existing left copy, center map, and right city-card structure.
- Shifted the map projection toward Asia so China city markers sit more naturally in the horizon composition.

### Verification

- Ran `node --check script.js`.
- Ran `git diff --check`.
- Verified Cindy's public profile locally in the in-app browser: the Life Atlas center map renders with the Earth-horizon globe, sunrise, cloud, city-light, and marker layers; the light theme keeps the dark horizon map mode; desktop and mobile layouts keep 4 city markers and 5 cards with no horizontal overflow; console logs show no errors or warnings.

## 2026-06-13 - v0.1.155

Commit: `Add compact life atlas city editing`

### Changed

- Reduced Life Atlas map marker size and glow so dozens of cities can appear without overwhelming the map.
- Made the right-side location cards more compact for longer city lists.
- Added an owner-only compact city input in the right-side Life Atlas column, saving manual cities to the profile and preserving them in the public sanitized profile.

### Verification

- Ran `node --check script.js`.
- Ran `node --check functions/api/auth/_utils.js`.
- Ran `node --check functions/api/auth/register.js`.
- Ran `git diff --check`.
- Verified Cindy's public profile locally in the in-app browser: map markers render at 8px, compact location cards render at 46px height, desktop and mobile layouts keep 4 city markers and 5 cards with no horizontal overflow, and console logs show no errors or warnings.

## 2026-06-13 - v0.1.154

Commit: `Polish light life atlas map`

### Changed

- Refined the Life Atlas light theme so the map reads as a premium atlas instead of a washed-out white panel.
- Increased world-map contrast, softened the map canvas with pale atlas/ocean tones, and added more grounded warm marker styling.
- Improved light-theme location cards with clearer borders, depth, and active states while keeping the existing section structure.

### Verification

- Ran `node --check script.js`.
- Ran `git diff --check`.
- Verified Cindy's public profile locally in the in-app browser: light theme renders the Life Atlas with stronger map contrast, warmer canvas depth, clearer location cards, 4 city markers, 5 cards, no mobile horizontal overflow, and no console errors or warnings.

## 2026-06-13 - v0.1.153

Commit: `Replace life atlas map base`

### Changed

- Replaced the custom sci-fi Earth-view drawing with a local SimpleMaps Free SVG World Map base for a more realistic premium Life Atlas visual.
- Kept the existing left copy block, center map, and right location-card structure while softening the center map background.
- Added warm glowing city markers and hover/focus sync between location cards and matching map dots.

### Verification

- Ran `node --check script.js`.
- Ran `git diff --check`.
- Verified Cindy's public profile locally in the in-app browser: the SimpleMaps SVG base loads from the local asset, 4 city markers render over the map, 5 location cards remain on the right, Eindhoven marker/card focus sync works, the mobile layout has no horizontal overflow, and console logs show no errors or warnings.

## 2026-06-13 - v0.1.152

Commit: `Refine life atlas copy`

### Changed

- Reframed the Travel Map section as a Life Atlas about places that shape perspective rather than tourist-style places visited.
- Updated the section label, title, subtitle, supporting text, map accessibility labels, and place-list microcopy around quiet traces and lived influence.
- Lightly warmed marker and place-dot styling while preserving the existing Earth-view map structure and automatic place detection.

### Verification

- Ran `node --check script.js`.
- Ran `git diff --check`.
- Verified Cindy's public profile locally in the in-app browser: the Life Atlas copy renders on desktop and mobile, 5 places remain listed, the Earth-view map structure is preserved, there is no horizontal overflow on mobile, and console logs show no errors or warnings.

## 2026-06-13 - v0.1.151

Commit: `Polish visited places earth view`

### Changed

- Upgraded the Travel Map visual from a flat map into an original Earth-view style inspired by satellite maps.
- Added ocean, atmosphere, cloud, latitude/longitude, orbital, and marker-glow layers without depending on Google Earth or external imagery.
- Preserved the existing automatic place detection and visited-place list.

### Verification

- Ran `node --check script.js`.
- Ran `git diff --check`.
- Verified Cindy's public profile locally in the in-app browser: the Earth-view SVG layers render, 5 places remain lit up, and console logs show no errors or warnings.

## 2026-06-13 - v0.1.150

Commit: `Add visited places map`

### Changed

- Added a Travel Map section to profile pages, placed between the profile intro and the Life timeline.
- Automatically lights up known places from a profile's location, public timeline items, and public work locations.
- Added a lightweight built-in world map visual with highlighted visited-place markers and a matching place list.
- Added responsive styling for desktop and mobile, with dark and light theme support.

### Verification

- Ran `node --check script.js`.
- Ran `git diff --check`.
- Verified Cindy's public profile locally in the in-app browser: the map renders, 5 places are lit up, desktop and mobile layouts fit, and console logs show no errors or warnings.

## 2026-06-12 - v0.1.149

Commit: `Add public photo preview`

### Changed

- Kept secondary and additional Life photos as compact thumbnails so a second uploaded image does not stretch across the card.
- Added public photo preview: visitors can click profile photos to open the original image in a focused lightbox.
- Kept owner edit mode behavior unchanged so clicking a Life card still opens the editor.
- Added lightbox close controls through the close button, backdrop, and Escape key.

### Verification

- Ran `node --check script.js`.
- Ran `git diff --check`.
- Verified Cindy's public profile locally in the in-app browser: desktop extra thumbnails render around 116 by 82 pixels, mobile thumbnails around 102 by 74 pixels, the lightbox opens with the original photo, closes cleanly, and console logs show no errors or warnings.

## 2026-06-12 - v0.1.148

Commit: `Add light glass theme toggle`

### Changed

- Added a persistent theme toggle in the top bar so Turnpo can switch between the default dark interface and a new light interface.
- Added a premium white frosted-glass theme with lighter panels, softer borders, refined shadows, and high-tech cool neutral surfaces.
- Kept the current dark night interface as the default mood while preparing the UI for future black/white theme switching.
- Made theme storage tolerant of environments where localStorage is unavailable.

### Verification

- Ran `node --check script.js`.
- Ran `git diff --check`.
- Confirmed the local static server serves the updated theme HTML, CSS, and JS.

## 2026-06-12 - v0.1.147

Commit: `Simplify work editor fields`

### Changed

- Simplified the Work editor so Work uses the same lightweight field set as Life.
- Hid advanced project metadata fields from the Work form: Work type, Why I made it, Tools used, Human role, AI role, and Result.
- Kept existing hidden metadata preserved in the saved data so older project records do not lose information.

### Verification

- Ran `node --check script.js`.
- Ran `git diff --check`.

## 2026-06-12 - v0.1.146

Commit: `Fix owner work edits and timeline ordering`

### Changed

- Polished Cindy's starter profile copy across headline, current chapter, timeline cards, education, work history, and AI work entries.
- Fixed timeline ordering so items inside each year are sorted by month/date instead of original import order.
- Added an owner-only `Add Work` action directly in the Work / Projects section.
- Saved newly added Work / Projects into the project data source used by the Work / Projects grid.
- Added owner actions to Work / Projects cards so they can be edited, hidden, published, deleted, restored, or permanently deleted.
- Fixed profile text saves so the freshly edited profile is re-rendered immediately and is not overwritten by an older online draft reload.

### Verification

- Ran `node --check script.js`.
- Ran `git diff --check`.
- Verified Cindy and Leo timeline month ordering locally through the in-app browser.
- Confirmed the local static page loads with the updated script.

## 2026-06-11 - next after v0.1.143

Commit: pending - `Tighten owner session and polish controls`

### Changed

- Reviewed the current Turnpo page, owner/admin mode logic, and API permission boundaries.
- Hardened owner-only API session checks so inactive/disabled user records cannot keep saving or publishing through an old owner session.
- Added compact icons, stronger hover states, and consistent inline alignment to top-bar and Admin dashboard controls.
- Improved mobile header controls so they wrap as compact action chips instead of tall stacked buttons.
- Added a subtle hover state and clearer scope text treatment to the Admin user table.

### Verification

- Ran `node --check script.js`.
- Ran `node --check` across all `functions/api/**/*.js` files.
- Ran `git diff --check`.
- Verified inactive user records receive `403` from owner draft access instead of continuing through an old owner session.
- Verified the local homepage and profile route render without console errors in the in-app browser.
- Verified desktop and mobile header controls after the visual polish.

## 2026-06-11 - v0.1.143

Commit: `1a6913e` - `Harden admin owner mode switch`

### Changed

- Added a `My profile` action inside the Admin dashboard header so admins who own a profile can always return to owner edit mode from `/admin`.
- Hid home-only and owner-only controls while the Admin dashboard is open.
- Hid the footer founder tools on Admin pages so owner mode state cannot visually bleed into the dashboard.
- Reinforced owner-session state when entering Admin mode.

### Verification

- Ran `node --check script.js`.
- Ran `node --check` across all `functions/api/**/*.js` files.
- Ran `git diff --check`.
- Verified the Admin dashboard contains the `openAdminOwnerProfile` owner-mode switch.
- Verified Admin mode CSS hides home-only, owner-only, and footer founder tools.

## 2026-06-11 - v0.1.142

Commit: `e76cc0f` - `Add admin owner mode switch`

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
