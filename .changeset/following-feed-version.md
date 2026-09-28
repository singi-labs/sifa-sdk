---
'@singi-labs/sifa-sdk': patch
---

Following feed: the response now carries `builtAt` and `stale`, and a new empty reason `building` for a feed that is still being built. Add `fetchFollowingFeedVersion`, `useFollowingFeedVersion` and `isNewerFollowingFeed`, so a client showing a stale feed can offer the newer one. `useFollowingFeed` now reports a failed request as an error (retried by React Query) instead of succeeding with `null`.
