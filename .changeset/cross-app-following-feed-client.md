---
'@singi-labs/sifa-sdk': minor
---

Cross-app following feed client. `fetchFollowingFeed` + `useFollowingFeed` now call the reworked `/api/following/feed` (the cross-app aggregate of what other apps your connections use; Bluesky is excluded server-side) and return an `ActivityFeedResponse`. Adds `SifaApiConfig.getAuthToken`, which native clients supply to attach an AT Protocol service-auth Bearer (web keeps using its session cookie), and author fields (`authorHandle` / `authorDisplayName` / `authorAvatar`) on `ActivityItem` so multi-author feeds can show who posted. Replaces the deprecated `getFollowingFeed` fetcher and the old infinite-query `useFollowingFeed`, which pointed at the reverted endpoint.
