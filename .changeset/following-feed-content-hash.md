---
'@singi-labs/sifa-sdk': patch
---

Following feed: builds carry `contentHash`, a fingerprint of their items. `isNewerFollowingFeed(shown, latest)` now takes the builds (`builtAt` and `contentHash`) and is only true when the newer build shows different items, so clients stop offering a rebuild that found nothing new. `useFollowingFeedVersion` returns `{ builtAt, contentHash }`.
