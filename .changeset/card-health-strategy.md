---
"@singi-labs/sifa-sdk": patch
---

Add `resolveCardHealth`, which returns both the card's clickable URL and a health-check `strategy` (`record` | `url` | `none`). First-party permalinks that render the record itself (Bluesky posts, tangled repos, smokesignal/atmo events, whitewind, frontpage, leaflet, spark, anisota, grain, pastesphere, kich/recipe.exchange) report `record`, so the sifa-api link-health scanner can verify them by record existence on the PDS instead of an HTTP probe of the rendering app — which false-positives permalinks whose app answers HEAD with 404/405. Foreign/derived targets (bookmarks, external publishers, other records' pages, profile pages) report `url`. `resolveCardUrl` is unchanged and now delegates to `resolveCardHealth(item).url`.
