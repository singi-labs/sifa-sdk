---
'@singi-labs/sifa-sdk': patch
---

Add `website` and `websiteTier` to `EntitySelectResponse`. The AppView now returns the entity's trust-gated website alongside the display `domain`: it is derived from the highest-trust non-crawled domain, so clients can prefill it into a record field where the linked entity is the subject of that field. Both default to `null`, so an older AppView response still parses.
