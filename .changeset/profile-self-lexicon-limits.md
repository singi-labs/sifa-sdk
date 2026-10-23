---
'@singi-labs/sifa-sdk': patch
---

`ProfileSelfWriteSchema` now enforces the `id.sifa.profile.self` lexicon limits on `headline` (120 graphemes, 1,200 bytes), `about` (5,000 graphemes, 50,000 bytes), `givenName`, `familyName` and `namePronunciation` (64 graphemes, 640 bytes each), so accepted input is also valid against the lexicon. Add `ProfileOverrideWriteSchema` and `ProfileOverrideWriteInput` (`displayName`, `pronouns`, `headline`, `about`, all nullish) and the `maxBytes` helper next to `maxGraphemes`.
