# Turnpo MVP backend plan

Turnpo can stay on Cloudflare Pages while moving writes into a real backend.

## Recommended stack

- Cloudflare Pages for the static app.
- Cloudflare Worker for `/api/*`.
- Cloudflare D1 for profiles, timeline moments, markdown context, tags, and visibility.
- Cloudflare R2 for uploaded photos.
- Cloudflare Access or a passkey provider for owner authentication.

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
