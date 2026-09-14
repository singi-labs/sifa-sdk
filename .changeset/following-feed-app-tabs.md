---
'@singi-labs/sifa-sdk': patch
---

Following feed: source-tab support. `fetchFollowingFeed` / `useFollowingFeed` accept `app` to restrict the page to one app, and the response now carries `apps` (the apps the viewer's network is actually active on, most active first) plus `reason` when the page is empty. A selected app drops `includeBluesky`, since a tab decides that on its own, and `app` is part of the query key so each tab caches separately. Adds `FollowingFeedResponse`, `FollowingFeedApp` and `FollowingFeedEmptyReason`.
