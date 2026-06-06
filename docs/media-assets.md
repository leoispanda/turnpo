# Turnpo media assets

Turnpo profile media should be stored under a profile-owned media namespace.

## Current static-site convention

- Leo profile media lives in `assets/profile-media/leo/`.
- Imported LinkedIn post images are copied into that folder and referenced from profile data as `/assets/profile-media/leo/<file>.jpg`.
- Owner-mode single-image edits use the image picker, drag-and-drop, or paste flow. In the static prototype, those images are optimized in the browser and stored with the local edited profile data.
- Posts without an available image should keep `image: ""` so the UI renders the empty media placeholder.
- Do not keep `media.licdn.com` or other temporary CDN URLs in committed profile data when the image is meant to be part of the Turnpo page.

## Future upload convention

When the backend upload flow is added, manually uploaded photos should use the same profile-owned logic:

- Save the file to the site's controlled media storage, planned as Cloudflare R2.
- Store only the resulting Turnpo-controlled public URL in the profile or moment record.
- Keep the current drag/drop/paste/choose-file editor UI, and replace only the storage implementation behind it.
- Keep the source export files, raw LinkedIn archive, private messages, and private account data out of the repository.

This keeps imported media and owner-uploaded media manageable in the same mental model: each profile owns a media folder or storage prefix, and profile data points to those controlled assets.
