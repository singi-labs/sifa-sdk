---
'@singi-labs/sifa-sdk': patch
---

Phase 5A.3 final -- reactions + roadmap + destructive mutations. Completes the sweep.

### Reactions

- `createReaction(targetUri, appId, targetCid?)` / `useCreateReaction`. Returns a discriminated-union result instead of the generic `WriteResult` shape because reactions have a distinct `scope_insufficient` failure that triggers an OAuth scope-upgrade flow rather than an error toast. The hook surfaces `requiredScope` on `403 ScopeInsufficient` so the caller can re-authorize.
- `deleteReaction(targetUri, appId)` / `useDeleteReaction` -- standard `WriteResult` shape.

Both mutation hooks invalidate `sifaQueryKeys.reactions.all()` on success (any cached `useReactionStatus` view containing the affected URI needs a refresh).

### Roadmap

- `castRoadmapVote(key)` / `useCastRoadmapVote`
- `retractRoadmapVote(key)` / `useRetractRoadmapVote`

Both invalidate `sifaQueryKeys.roadmap.all()` on success.

### Destructive operations

- `resetProfile(deletePdsData)` / `useResetProfile` -- wipes the user's Sifa profile. Invalidates `sifaQueryKeys.all()` on success.
- `deleteAccount(deletePdsData)` / `useDeleteAccount` -- deletes the account. Returns the deleted `handle` for confirmation UIs. Clears the entire query cache (`queryClient.clear()`) on success since the user is effectively logged out.

`deletePdsData: true` also deletes the corresponding records on the user's PDS; `false` leaves them intact for possible re-indexing.

### Note on `requestReactionScope`

`requestReactionScope` from `sifa-web/src/lib/reactions-api.ts` is **not** ported. It uses `sessionStorage` and `window.location` directly and is fundamentally browser-only; it stays in sifa-web's `web-internal-api.ts` when the 5B cleanup lands.

### Phase 5A.3 complete

With this PR, every mutation from `sifa-web/src/lib/{profile-api,reactions-api,roadmap-votes-api}.ts` lives in the SDK. Next milestone: **Phase 5B** -- TanStack Query Provider integration in sifa-web, then the consumer sweep, then cleanup.

### Versioning

Patch bump. PR 5 of 5 (final) in the Phase 5A.3 sweep.
