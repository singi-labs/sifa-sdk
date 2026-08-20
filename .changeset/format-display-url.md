---
"@singi-labs/sifa-sdk": patch
---

Add `formatDisplayUrl(url, { path })` to the `format` module. Returns `{ display, href }`: a normalized display label (scheme, `www.`, query, hash and trailing slash removed, with a `full` | `firstSegment` | `none` path policy) and the full navigable URL. Guards `new URL()` (never throws, prepends `https://` for scheme-less input, keeps a `dns:` fallback). Truncation is left to the consumer (a view concern).
