# Turnpo MVP backend plan

Turnpo can stay on Cloudflare Pages while moving writes into a real backend.

## Recommended stack

- Cloudflare Pages for the static app.
- Cloudflare Worker for `/api/*`.
- Cloudflare D1 for profiles, timeline moments, markdown context, tags, and visibility.
- Cloudflare R2 for uploaded photos.
- Cloudflare Pages Functions + KV + Resend for owner email-code authentication.

## Owner login MVP

Turnpo now uses an email-code login path for owner mode:

- `POST /api/auth/request-code` requests a 6-digit one-time code.
- `POST /api/auth/verify-code` verifies the code and sets an `HttpOnly`, `Secure`, `SameSite=Lax` session cookie.
- `GET /api/auth/session` restores owner mode when the session cookie is valid.
- `POST /api/auth/logout` deletes the server session and clears the cookie.

Only approved owner emails can receive a working code. Approval is handled through Cloudflare environment variables, not public frontend code.

Cloudflare Pages configuration needed:

- KV binding: `AUTH_KV`
- Secret: `TURNPO_AUTH_SECRET`
- Secret: `RESEND_API_KEY`
- Variable: `TURNPO_AUTH_FROM_EMAIL`, for example `Turnpo <login@turnpo.com>`
- Variable: `TURNPO_APPROVED_OWNER_EMAILS`, comma-separated approved emails
- Optional variable: `TURNPO_DEFAULT_OWNER_PROFILE`, defaults to `leo`
- Optional variable: `TURNPO_OWNER_EMAIL_PROFILES`, comma-separated `email:profile` mappings for future multi-owner profiles

Do not commit real API keys, login secrets, or private owner email lists.

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
- `POST /api/uploads/sign` returns a short-lived R2 upload URL for the authenticated owner.

## Privacy rule

LinkedIn exports, messages, connections, and raw private files must remain ignored locally and should never be committed. Import scripts should map only approved profile fields and posts into D1 seed data.
