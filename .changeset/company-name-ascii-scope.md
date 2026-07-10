---
'@singi-labs/sifa-sdk': patch
---

Scope `formatCompanyName` to ASCII-Latin case-bearing strings: any name containing a non-ASCII letter (accented Latin, Cyrillic, Greek, CJK, Turkish dotted/dotless i, etc) is now returned unchanged instead of being title-cased with locale-unsafe casing. Add `normalizeCompanyKey`, a pure NFC-normalize + case-fold + diacritic-stripping helper for building a stable company dedup/prefix key.
