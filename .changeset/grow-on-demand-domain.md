---
'@singi-labs/sifa-sdk': patch
---

Add the domain grow-on-demand client: `resolveEntityDomain` / `mintEntityDomain` fetchers, the `useResolveEntityDomain` / `useMintEntityDomain` hooks, their request/response schemas, and a `looksLikeDomain` predicate so a typeahead can fire the domain lookup on a domain-shaped local miss.

Also declare `entityRef` on the `ProfileEducation`, `ProfileCertification`, `ProfileCourse`, `ProfileHonor`, and `ProfileVolunteering` view interfaces (mirroring `ProfilePosition`), so consumers can render the linked-organization state the AppView already returns for those sections.
