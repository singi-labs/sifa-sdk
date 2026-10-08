---
'@singi-labs/sifa-sdk': patch
---

`fetchSearchProfiles` accepts an `offset` filter so callers can page past the first result set. A bare `limit` or `offset` with no real filter no longer triggers a network call.
