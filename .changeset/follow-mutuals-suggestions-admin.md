---
'@singi-labs/sifa-sdk': patch
---

Add SDK layer for the follow-graph follow-ups landing in `sifa-api#674`.

Schemas: `FollowProfileSchema` + `FollowProfilePageSchema` (the
`{ items, cursor }` page shape shared by mutuals + bluesky-suggestions),
`FeatureAllowlistEntrySchema`, and the `FEATURE_FLAGS` const tuple.

Fetchers (`/query/fetchers`): `getMutuals`, `getBlueskySuggestions`,
`listFeatureAllowlist`, `addFeatureAllowlist`, `removeFeatureAllowlist`.

Hooks (`/query/hooks`): `useMutuals` + `useBlueskySuggestions` (infinite
queries), `useFeatureAllowlist` (read) + `useAddFeatureAllowlist` /
`useRemoveFeatureAllowlist` (mutations with optimistic cache updates and
rollback on failure).

Query keys: `sifaQueryKeys.follow.mutuals(handle)`,
`sifaQueryKeys.follow.blueskySuggestions()`,
`sifaQueryKeys.admin.featureAllowlist(flag)`.

Consumes the `sifa-api#674` contract; that API PR is still open at time of
publish — SDK ships independently and `sifa-web` will swap to real endpoints
once `api#674` lands.
