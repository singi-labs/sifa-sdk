---
'@singi-labs/sifa-sdk': patch
---

Fix `ProfilePositionRecordSchema.skills` rejecting valid records. The lexicon
defines `id.sifa.profile.position#skills` as an array of `id.sifa.defs#skillRef`
(AT-URI only, no CID), but the schema validated entries against
`strongRefSchema`, which requires a CID. Records written by the SDK's own write
path (`PositionWriteSchema`, which correctly emits `{ uri }`) failed to parse.

Adds a `skillRefSchema` export mirroring `id.sifa.defs#skillRef`, and makes the
position record schema pass through unknown lexicon fields so `isPrimary` (and
any future additive lexicon field) is no longer silently stripped on parse.

Reported by [@bljohnson.dev](https://bsky.app/profile/bljohnson.dev).
