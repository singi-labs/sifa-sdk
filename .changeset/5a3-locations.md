---
'@singi-labs/sifa-sdk': patch
---

Phase 5A.3 locations -- profile locations + external accounts + endorsements + keytrace claims.

### Profile locations

- `createProfileLocation`, `updateProfileLocation`, `deleteProfileLocation` and matching hooks.
- `ProfileLocationAddress` payload accepts both `{country, locality}` (community.lexicon.location.address) and `{countryCode, city}` (legacy) during the migration; sifa-api's union schema resolves either.

### External accounts

- `fetchExternalAccounts` / `useExternalAccounts` -- the read endpoint from `sifa-web/src/lib/profile-api.ts` (leftover from 5A.2b).
- `createExternalAccount` / `useCreateExternalAccount` -- returns `rkey` AND the server-resolved `feedUrl` (sifa-api inspects the target for RSS feeds).
- `updateExternalAccount`, `deleteExternalAccount` and matching hooks.
- `setExternalAccountPrimary`, `unsetExternalAccountPrimary` and matching hooks.
- `verifyExternalAccount` / `useVerifyExternalAccount` -- triggers server-side keytrace verification; returns `{ verified, verifiedVia }` on success.
- New query key: `sifaQueryKeys.profile.externalAccounts(handleOrDid)`. External-account mutations invalidate both this key and `sifaQueryKeys.profile.byHandle`.

### Endorsements

- `createEndorsement` / `useCreateEndorsement`. The hook takes the endorsed user's handle/DID (not the endorser's) so it can invalidate the right profile + endorsement-count caches.

### Keytrace claims

- `hideKeytraceClaim`, `unhideKeytraceClaim` and matching hooks.

### Versioning

Patch bump. PR 3 of 5 in the Phase 5A.3 sweep.
