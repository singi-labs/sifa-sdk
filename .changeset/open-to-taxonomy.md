---
'@singi-labs/sifa-sdk': patch
---

Add `OPEN_TO_OPTIONS` and `getOpenToLabelKey` covering all 8 `id.sifa.defs#openToWorkStatus` lexicon `knownValue`s, including the `commissions` token introduced in sifa-lexicons #41. Mirrors the `INDUSTRY_OPTIONS` `{ value, labelKey }` shape so consumers can run the `labelKey` through their own i18n layer. Resolves the legacy `id.sifa.defs#mentoring` alias to `mentoringOthers` for backward compatibility with records written before the lexicon migration. Lexicon-anchored tests catch future drift.
