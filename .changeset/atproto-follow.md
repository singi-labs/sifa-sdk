---
'@singi-labs/sifa-sdk': patch
---

Add `followUser` and `unfollowUser` to the `/atproto` write helpers, alongside
the like/repost helpers. Same structural-agent pattern: the consumer passes its
authenticated agent, the SDK writes the follow (or deletes it) on the user's PDS.
