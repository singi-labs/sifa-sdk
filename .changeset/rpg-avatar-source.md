---
'@singi-labs/sifa-sdk': patch
---

Use an rpg.actor character as the Sifa avatar. `ProfileSelfRecordSchema` gains the optional `avatarSource` string from `id.sifa.profile.self`, and `ProfileSelfWriteSchema` / `UpdateProfileSelfInput` accept `avatarSource: 'actor.rpg.sprite'` (or `null` to turn it off). `Profile.avatarSource` says where the resolved `avatar` comes from. New: `RPG_AVATAR_SOURCE` in `./rpg`, and the `useRpgStatus` hook with the `rpg.status()` query key. Also resyncs `src/jsonld/term-mappings.json` with sifa-lexicons.
