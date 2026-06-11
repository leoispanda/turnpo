# Turnpo MVP backend plan

Turnpo can stay on Cloudflare Pages while moving writes into a real backend.

## Recommended stack

- Cloudflare Pages for the static app.
- Cloudflare Worker for `/api/*`.
- Cloudflare D1 for profiles, timeline moments, markdown context, tags, and visibility.
- Cloudflare R2 for uploaded photos.
- Cloudflare Pages Functions + KV + Resend for owner email-code authentication.

## Login and admin MVP

Turnpo uses an email-code login path for normal users, profile owners, and admins:

- `POST /api/auth/request-code` requests a 6-digit one-time code.
- `POST /api/auth/verify-code` verifies the code and sets an `HttpOnly`, `Secure`, `SameSite=Lax` session cookie.
- `GET /api/auth/session` restores the logged-in account, profile ownership, and role when the session cookie is valid.
- `POST /api/auth/logout` deletes the server session and clears the cookie.

Registered Turnpo users can request a working code. Legacy approved owner emails can also receive a working code so existing owner access keeps working. Unknown emails receive the same generic response but no code is sent.

Turnpo keeps the first account/admin model in Cloudflare KV, not D1, to avoid a large migration. User records are stored as:

- `user:email:{email}` -> user id
- `user:id:{id}` -> `{ id, email, username, displayName, profile, role, status, createdAt, updatedAt, lastLoginAt }`

Privileged admin access is resolved from Cloudflare environment variables on every request. This makes the environment the source of truth: removing an email from the admin list removes access without editing KV.

Role model:

- `admin`: highest current role. Full read-only account, profile, moderation, role audit, and platform-owner access. Configure with `TURNPO_ADMIN_EMAILS`.
- `user`: own-profile access only.

Management scopes:

- `admin:read`: can enter the Admin dashboard.
- `accounts:read`: can view account metadata, status, creation time, and last login time.
- `profiles:read`: can view public profile links and visibility state.
- `moderation:read`: can review moderation/status signals.
- `roles:read`: can view resolved roles and access scopes.
- `platform:owner`: admin configuration scope for future platform controls.

Admin permission is enforced server-side through `requireAdminSession(request, env, requiredScope)` in admin API routes. The frontend only hides or shows entry points for convenience.

Cloudflare Pages configuration needed:

- KV binding: `AUTH_KV`
- Optional KV binding: `PROFILE_KV` for online profile draft/published JSON. If omitted, `AUTH_KV` is reused.
- R2 binding: `PROFILE_MEDIA_R2` for uploaded owner images. `MEDIA_R2` or `TURNPO_MEDIA_R2` also work as fallback binding names.
- Secret: `TURNPO_AUTH_SECRET`
- Secret: `RESEND_API_KEY`
- Variable: `TURNPO_AUTH_FROM_EMAIL`, for example `Turnpo <login@turnpo.com>`
- Variable: `TURNPO_ADMIN_EMAILS`, comma-separated admin account emails. Add Leo's login email here to make Leo admin.
- Variable: `TURNPO_APPROVED_OWNER_EMAILS`, comma-separated approved emails
- Optional variable: `TURNPO_DEFAULT_OWNER_PROFILE`, defaults to `leo`
- Optional variable: `TURNPO_OWNER_EMAIL_PROFILES`, comma-separated `email:profile` mappings for future multi-owner profiles
- Built-in owner mapping: `cxin7699nl23@gmail.com` logs into the `cindy` profile. Override or extend with `TURNPO_OWNER_EMAIL_PROFILES`.

Do not commit real API keys, login secrets, or private owner email lists.

## Read-only admin dashboard

The first admin dashboard is intentionally read-only:

- Frontend route: `/admin`
- API summary: `GET /api/admin/summary`
- API user list: `GET /api/admin/users`

Both admin APIs require a valid session whose resolved user has the required management scope. The dashboard shows the current viewer role, management scope, account statistics, profile counts, disabled/deleted account counts, and a basic user list. It does not expose private drafts or unpublished story content.

To test admin access:

1. Configure `TURNPO_ADMIN_EMAILS` in Cloudflare with Leo's account email.
2. Log in with that email through the visible `Log in` button.
3. Open `/admin` or the `Admin` button.
4. A non-admin logged-in user should receive `Admin access required.` from `/api/admin/*`.

## Online profile persistence bridge

Before the full D1/R2 backend exists, Turnpo stores the current full profile JSON in Cloudflare KV:

- `GET /api/profiles/:username` returns the latest online published profile.
- `GET /api/profiles/:username/draft` returns the authenticated owner's online draft.
- `PUT /api/profiles/:username/draft` saves the authenticated owner's current profile as an online draft.
- `POST /api/profiles/:username/publish` writes the authenticated owner's current profile to both online draft and online published storage.

This makes saved/published owner edits visible across devices once they are published online. Browser `localStorage` remains as a fallback draft cache.

Uploaded owner images are stored in Cloudflare R2 through the authenticated upload endpoint:

- `POST /api/profiles/:username/uploads` accepts a compressed image data URL from the authenticated owner, writes the image to R2, and returns a public app URL.
- `GET /api/profiles/:username/media/:mediaId` reads the public image from R2.

The profile JSON stores only the returned image URL. If R2 is not configured, the browser keeps using the local data URL fallback so editing does not break, but those fallback images remain inside the profile JSON and are not suitable for long-term online storage.

## Data model

Profiles:
- `id`
- `slug`
- `display_name`
- `headline`
- `location`
- `markdown_context`
- `owner_user_id`

Moments:
- `id`
- `profile_id`
- `year`
- `date_label`
- `title`
- `note`
- `visibility`
- `sort_order`
- `created_at`
- `updated_at`

Moment photos:
- `id`
- `moment_id`
- `r2_key`
- `public_url`
- `alt_text`
- `sort_order`

Moment tags:
- `moment_id`
- `tag`

## API surface

- `GET /api/profiles/:slug` returns only public moments unless the request is authenticated as the owner.
- `POST /api/profiles/:slug/moments` creates a moment for the authenticated owner.
- `PUT /api/moments/:id` updates title, date, year, note, tags, photos, and visibility.
- `DELETE /api/moments/:id` deletes a moment for the authenticated owner.
- `POST /api/profiles/:slug/uploads` stores an authenticated owner image in R2 and returns the app media URL.

## Privacy rule

LinkedIn exports, messages, connections, and raw private files must remain ignored locally and should never be committed. Import scripts should map only approved profile fields and posts into D1 seed data.
