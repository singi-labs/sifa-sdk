---
'@singi-labs/sifa-sdk': patch
---

Add `formatCompanyName`: best-effort title-case for company display names. PDL-sourced names are stored all-lowercase ("spryker"); this capitalizes them for display while leaving already-cased names (ROR/Wikidata) untouched.
