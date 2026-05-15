---
'@singi-labs/sifa-sdk': minor
---

Add Zod schemas for all 15 `id.sifa.*` record types: `ProfileSelf`, `ProfilePosition`, `ProfileEducation`, `ProfileSkill`, `ProfileCertification`, `ProfileCourse`, `ProfileExternalAccount`, `ProfileHonor`, `ProfileLanguage`, `ProfileProject`, `ProfilePublication`, `ProfileVolunteering`, `Endorsement`, `EndorsementConfirmation`, `GraphFollow`. Plus shared helpers for AT Protocol formats (`didSchema`, `atUriSchema`, `cidSchema`, `datetimeSchema`, `languageTagSchema`, `uriSchema`, `strongRefSchema`, `selfLabelsSchema`) and a grapheme-aware `maxGraphemes` refinement that matches the lexicon `maxGraphemes` semantic.

Hand-written from the lexicon JSON. Each schema is exported from the main entry and via a new `./schemas` subpath. `knownValues` constraints are advisory per the lexicon spec -- unknown values are accepted.

Adds `zod@4.4.3` as a pinned runtime dependency.
