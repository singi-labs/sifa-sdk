---
'@singi-labs/sifa-sdk': patch
---

Add the shared activity-stream view-model (M1): `StreamCardVM` + Zod schema, a `StreamVerb` layer with a `verbForCollection` accessor over a versioned `verbs.json`, and the pure `toStreamCardVM` / `toStreamCardVMs` transforms. Reference implementations cover the generic case, Bluesky posts (text, image blob refs, external embeds), and reposts (subject normalized recursively). Media carries raw blob refs so each surface builds its own URL; per-item RGB `theme` and a `post | person | record` subject union are part of the base contract.
