---
'@singi-labs/sifa-sdk': patch
---

Phase 5A.3 publications -- hide/unhide for ORCID, standard, and Sifa-authored publications + ORCID refresh.

### ORCID publications

- `hideOrcidPublication(config, putCode)` / `useHideOrcidPublication`
- `unhideOrcidPublication(config, putCode)` / `useUnhideOrcidPublication`
- `refreshOrcidPublications` / `useRefreshOrcidPublications` -- re-pulls the user's ORCID publications. Returns `{ added, removed }` counts. The server returns inline `{ error: '...' }` (not via HTTP status) on quota / linkage failures; the SDK folds that into `{ success: false, error }` to keep the contract consistent.

### Standard publications (auto-imported)

- `hideStandardPublication(config, uri)` / `useHideStandardPublication`
- `unhideStandardPublication(config, uri)` / `useUnhideStandardPublication`
- `bulkHideStandardPublications(config, uris[])` / `useBulkHideStandardPublications`
- `bulkUnhideStandardPublications(config, uris[])` / `useBulkUnhideStandardPublications`

### Sifa publications (`id.sifa.profile.publication`)

- `hideSifaPublication(config, rkey)` / `useHideSifaPublication`
- `unhideSifaPublication(config, rkey)` / `useUnhideSifaPublication`

All hooks accept an `ownerHandleOrDid` argument for cache invalidation and forward the TanStack v5 four-arg `onSuccess` signature.

### Versioning

Patch bump. PR 4 of 5 in the Phase 5A.3 sweep.
