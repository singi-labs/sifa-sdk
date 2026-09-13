---
'@singi-labs/sifa-sdk': patch
---

Add an `includeBluesky` opt-in to `fetchFollowingFeed` and `useFollowingFeed` (default off). When true the fetcher sends `?includeBluesky=true`, and the flag is part of the query key so the two variants cache independently.
