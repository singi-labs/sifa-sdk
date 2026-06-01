---
'@singi-labs/sifa-sdk': patch
---

Add follow + V5 feed query layer.

Schemas: `makeGraphFollowRecordSchema(followerDid)` (self-follow refine),
`note` field on `GraphFollowRecordSchema`, `FollowFeedItemSchema`
(discriminated union of `SifaFeedItemSchema` + `AtmosphereFeedItemSchema`),
`FollowFeedPageSchema`, plus `encodeFeedCursor` / `decodeFeedCursor`
helpers for the composite `(indexedAt, source, id)` cursor.

Fetchers (`/query/fetchers`): `followUser`, `unfollowUser`, `getFollowers`,
`getFollowing`, `getFollowingFeed`. The legacy `fetchFollowing` stays for
back-compat.

Hooks (new `/query/hooks` subpath): `useFollow`, `useUnfollow` (mutations
with cache-invalidation rollback), `useFollowers`, `useFollowingList`,
`useFollowingFeed` (infinite queries).

Consumes the sifa-api#673 endpoints; the API contract is locked there.
