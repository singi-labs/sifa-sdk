---
'@singi-labs/sifa-sdk': patch
---

Add Crate (`social.crate.*`) to the app taxonomy: category mapping (Articles), `social.crate.*` → `crate` collection resolution, and a `resolveCardUrl` rule that links `social.crate.content` cards to their `canonicalUrl` (notes render non-clickable, since Crate has no public per-record viewer).
