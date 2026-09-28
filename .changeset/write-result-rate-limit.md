---
'@singi-labs/sifa-sdk': patch
---

Failed writes now report `status` on `WriteResult`, plus `retryAfterSeconds` on a rate-limited (429) write, read from the `Retry-After` header with `x-ratelimit-reset` as fallback. The error text falls back to `body.error` when the server sends no `message`, so a 429 no longer collapses to "Request failed (429)". `ExternalAccountWriteSchema` now trims `label` and drops a blank one instead of passing it through.
