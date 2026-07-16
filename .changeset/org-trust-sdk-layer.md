---
'@singi-labs/sifa-sdk': patch
---

Add the organization-trust SDK layer (#160): `id.sifa.org.profile` and `id.sifa.org.employmentAttestation` record schemas, the exact org claim/settings request schemas under `/schemas/write`, the pure `qualifiesAsOrg` rendering-floor predicate and `isCompanyPageIndexable` firmographic predicate under `/logic`, and the org query layer (`useOrgProfile`, `useOrgClaim`, `useUpdateOrgProfile`, org domain-challenge and notification-email hooks) under `/query`.
