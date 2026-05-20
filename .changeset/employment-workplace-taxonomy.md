---
'@singi-labs/sifa-sdk': patch
---

Add `EMPLOYMENT_TYPE_LABELS` / `EMPLOYMENT_TYPE_GROUPS` / `getEmploymentTypeLabel` and `WORKPLACE_TYPE_LABELS` / `WORKPLACE_TYPE_OPTIONS` / `getWorkplaceTypeLabel` taxonomies covering every `id.sifa.defs#employmentType` and `id.sifa.defs#workplaceType` lexicon `knownValue`. Tests anchor the taxonomies against the lexicon to catch future drift.
