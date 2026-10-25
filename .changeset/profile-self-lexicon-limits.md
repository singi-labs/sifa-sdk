---
'@singi-labs/sifa-sdk': minor
---

Narrow validation of `id.sifa.profile.self` text fields to the lexicon limits. Over-limit values are now rejected, in both graphemes and UTF-8 bytes: `headline` (120 graphemes, 1,200 bytes; was 300 UTF-16 units in the write schema), `about` (5,000 / 50,000), `givenName`, `familyName`, `namePronunciation` and `displayName` (64 / 640), `pronouns` (20 / 200). `ProfileSelfWriteSchema` and `ProfileSelfRecordSchema` share these field schemas, and `ProfileSelfRecordSchema` gains optional `displayName` and `pronouns`. Add `ProfileOverrideWriteSchema` and `ProfileOverrideWriteInput` (`displayName`, `pronouns`, `headline`, `about`, all nullish; `UpdateProfileOverrideInput` is now an alias of it) and the `maxBytes` helper next to `maxGraphemes`.
