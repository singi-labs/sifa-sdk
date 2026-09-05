---
'@singi-labs/sifa-sdk': patch
---

Add per-section primary selection for the profile Highlights block. New
`pickPrimaryFlagged` picker (shared, eligibility-parameterized), generic
`setSectionPrimary`/`unsetSectionPrimary` fetchers and `useSetSectionPrimary`/
`useUnsetSectionPrimary` hooks keyed by section, the `primary` field on the
education, publication, presentation, involvement, and project view types, and
`isPrimary` on their record schemas. Backs singi-labs/sifa-web#1983.
