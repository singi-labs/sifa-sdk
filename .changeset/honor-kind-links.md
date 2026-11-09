---
'@singi-labs/sifa-sdk': patch
---

Add optional `kind` (open-set `id.sifa.defs#honor*` token) and `links` (array of artifact links, max 50) to `ProfileHonorRecordSchema`, `HonorWriteSchema` and the `ProfileHonor` type, plus a `ProfileHonorLink` type and an honor-kind taxonomy (`HONOR_KIND_OPTIONS`, `HONOR_KIND_LABELS`, `getHonorKindLabel`). Matches sifa-lexicons 0.15.8.
