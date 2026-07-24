---
'@singi-labs/sifa-sdk': patch
---

Render Bluesky image and GIF/link embeds in the activity-stream view-model.

`toStreamCardVM` now reads the AppView-hydrated `#view` embed shape that the
activity feed actually carries: `app.bsky.embed.images#view` items become
resolved-URL media (preferring the feed-sized `thumb`), `external#view` embeds
carry their resolved `thumb`, and `recordWithMedia#view` is unwrapped alongside
the raw variant. Previously only the raw blob-ref shape was handled, so
hydrated image posts produced no media and external/GIF embeds rendered as a
bare link with no poster on `page.sifa.id/{handle}/now`.
