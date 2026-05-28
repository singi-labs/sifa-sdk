---
'@singi-labs/sifa-sdk': patch
---

Generalize the hide-item surface so consumers can hide any profile section item, not just publications and Keytrace claims.

- Adds `hidden?: boolean` to `ProfilePosition`, `ProfileEducation`, `ProfileCertification`, `ProfileProject`, `ProfileVolunteering`, `ProfileCourse`, `ProfileHonor`, `ProfileLanguage` (already on `ProfilePublication`, `ExternalAccount`).
- Adds new generic fetchers and hooks targeting the unified `/api/profile/items/hide` and `/api/profile/items/bulk-hide` endpoints: `hideProfileItem`, `unhideProfileItem`, `bulkHideProfileItems`, `bulkUnhideProfileItems`, plus the corresponding `useHideProfileItem`, `useUnhideProfileItem`, `useBulkHideProfileItems`, `useBulkUnhideProfileItems`. All accept `{ itemType, source, itemId | itemIds }` where `itemType` covers every section with individual items and `source` distinguishes `pds`, `standard`, and `orcid` origins so future credential and endorsement sources extend without API churn.
- Existing publication and Keytrace hide hooks are unchanged.
