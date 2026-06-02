---
'@singi-labs/sifa-sdk': patch
---

Deprecate `FollowFeedItemSchema`, `SifaFeedItemSchema`, `AtmosphereFeedItemSchema`, `FollowFeedPageSchema`, `FetchFollowingFeedOptions`, `getFollowingFeed`, and `useFollowingFeed` (plus their inferred types). The `/api/following/feed` surface they consumed was reverted in sifa-api#674 after reconciliation against `decisions/activity-data-strategy.md` revealed the V5 feed conflicted with the live-PDS-read + Valkey-cache model and collapsed two distinct surfaces (Sifa Timeline + ATmosphere Stream) into one. Symbols remain exported to avoid a breaking change; scheduled for removal in the next major bump.
