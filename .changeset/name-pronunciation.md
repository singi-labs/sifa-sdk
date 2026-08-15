---
'@singi-labs/sifa-sdk': patch
---

Add `namePronunciation` to the profile.self record schema, write schema, `Profile` view type, and `updateProfileSelf` input. Free-form phonetic respelling of the user's name (e.g. `Foo-kuh`), capped at 64 graphemes.
