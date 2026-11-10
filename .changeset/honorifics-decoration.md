---
'@singi-labs/sifa-sdk': patch
---

Add optional `honorificPrefix` and `honorificSuffix` (64 graphemes) to the profile self record and write schemas, `PROFILE_TEXT_LIMITS` and the `Profile` type, plus `formatNameWithHonorifics`. JSON-LD emits `honorificPrefix`/`honorificSuffix`, JSON Resume puts them around the name. Adds `Decoration` (`id.sifa.defs#honorDecoration`) to `HONOR_KIND_OPTIONS`, and `getHonorKindLabel` ignores inherited object keys. Matches sifa-lexicons 0.15.10.
