---
'@singi-labs/sifa-sdk': patch
---

Add `pickPrimaryPosition` helper that returns the user-flagged primary active position, falling back to the active position with the most recent `startedAt`. Use this in every surface that needs a single "current role" (profile hero, OG image, meta descriptions, JSON-LD) so they no longer diverge.
