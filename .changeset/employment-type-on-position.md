---
'@singi-labs/sifa-sdk': minor
---

Add `employmentType?: string` to `ProfilePosition`. Mirrors the existing `id.sifa.defs#employmentType` lexicon field that the AppView has been indexing and returning for some time. Values are `id.sifa.defs#*` token URIs (e.g. `id.sifa.defs#fullTime`, `id.sifa.defs#fellowship`).

Refs singi-labs/sifa-workspace#176.
