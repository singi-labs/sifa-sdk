---
"@singi-labs/sifa-sdk": patch
---

Normalize Fediverse platform synonyms (`activitypub`, `mastodon`) to the canonical `fediverse` code in `normalizePlatformId`, so keytrace-verified and third-party-written accounts are recognized instead of falling through as unknown platforms.
