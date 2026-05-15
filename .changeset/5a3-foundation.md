---
'@singi-labs/sifa-sdk': patch
---

Phase 5A.3 foundation -- write-mutation helpers, profile-core mutations, and a `createPosition` endpoint fix.

### New foundation in `@singi-labs/sifa-sdk/query`

- **`apiWrite` / `apiWriteCreate` helpers** on the `client.js` module. Wrap `apiFetch` with the never-throws contract used by all sifa-web mutations: return a structured `WriteResult` (or `CreateResult`) on both success and failure, and preserve the `pdsHost` field when the AppView reports a PDS-side failure (issue #167).
- **`WriteResult` / `CreateResult` types moved to `client.js`** and re-exported from `positions.js` for backwards compatibility. Shared across every mutation in this phase.

### Bug fix: `createPosition`

- **Endpoint fixed:** was `POST /api/positions`, now correctly `POST /api/profile/position` (matches sifa-api).
- **Return shape fixed:** the fetcher used to throw on errors; it now returns `{ success: false, error, pdsHost? }` like every other mutation. The hook contract is unchanged (still resolves the mutation; consumers inspect `result.success`).
- The hook was unused in sifa-web, so this is not a breaking change in practice.

### New profile-core mutations (in `fetchers/profile-mutations.js`)

- **`updateProfileSelf` / `useUpdateProfileSelf`** -- update the authenticated user's `id.sifa.profile.self` record (headline, about, industries, location, openTo, preferredWorkplace, availability).
- **`updateProfileOverride` / `useUpdateProfileOverride`** -- override aggregated profile fields with sifa-specific values; `null` clears the override.
- **`refreshPds` / `useRefreshPds`** -- re-pull `app.bsky.actor.profile` from the user's PDS. Returns freshly resolved `displayName` and `avatar`.
- **`uploadAvatar` / `useUploadAvatar`** -- multipart upload (accepts `File` or `Blob`). 30s default timeout.
- **`deleteAvatarOverride` / `useDeleteAvatarOverride`** -- revert to PDS avatar.

All five hooks accept an `ownerHandleOrDid` argument so they can invalidate the correct profile cache entry on success. Each forwards the TanStack v5 four-arg `onSuccess` signature (`data, variables, onMutateResult, context`).

### New read: `searchSkills`

- **`searchSkills` / `useCanonicalSkillSearch`** -- canonical-skill DB lookup at `/api/skills/search`. Distinct from the existing `fetchSkillSuggestions` (`/api/search/skills`), which is the profile-skill typeahead. Returns `[]` on empty input or any error.
- New query key entry: `sifaQueryKeys.search.canonicalSkills(query, limit)`.

### Versioning

Patch bump. This is PR 1 of 5 in the Phase 5A.3 mutation sweep; remaining PRs cover positions/education/skills, locations/external-accounts/endorsements, publications, and reactions/roadmap/destructive ops.
