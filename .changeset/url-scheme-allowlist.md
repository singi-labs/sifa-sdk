---
"@singi-labs/sifa-sdk": patch
---

Restrict URL schemes in `optionalUrl()` and `formatDisplayUrl()` to http(s) plus a known-safe non-web set (`mailto:`, `tel:`, `dns:`). `optionalUrl()` now drops any other scheme via `httpUrlOrNull` instead of storing anything `new URL()` can parse, and `formatDisplayUrl()` returns an empty `href` for a scheme outside that set so a non-web scheme is never surfaced as a navigable link.
