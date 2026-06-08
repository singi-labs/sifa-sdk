---
'@singi-labs/sifa-sdk': patch
---

Add `normalizeWorkplaceTypes` and `normalizeOpenTo` taxonomy helpers. Each resolves legacy tokens to their canonical value (`id.sifa.defs#remote` → `id.sifa.defs#remoteGlobal`, `id.sifa.defs#mentoring` → `id.sifa.defs#mentoringOthers`), dedups, and preserves first-seen order while passing unknown tokens through untouched. Lets editors map a legacy token onto a real option (migrating the record forward on save) and lets display collapse a record carrying both the legacy and canonical token into a single badge. Also exports `WORKPLACE_TYPE_LEGACY_ALIASES` and `OPEN_TO_LEGACY_VALUE_ALIASES`.
