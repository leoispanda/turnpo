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
- Optional KV binding: `PROFILE_KV` for online profile draft/published JSON. If omitted, `AUTH_KV` is reused.
- R2 binding: `PROFILE_MEDIA_R2` for uploaded owner images. `MEDIA_R2` or `TURNPO_MEDIA_R2` also work as fallback binding names.
- Secret: `TURNPO_AUTH_SECRET`
- Secret: `RESEND_API_KEY`
- Variable: `TURNPO_AUTH_FROM_EMAIL`, for example `Turnpo <login@turnpo.com>`
- Variable: `TURNPO_APPROVED_OWNER_EMAILS`, comma-separated approved emails
- Optional variable: `TURNPO_DEFAULT_OWNER_PROFILE`, defaults to `leo`
- Optional variable: `TURNPO_OWNER_EMAIL_PROFILES`, comma-separated `email:profile` mappings for future multi-owner profiles

Do not commit real API keys, login secrets, or private owner email lists.

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
