---
'@singi-labs/sifa-sdk': patch
---

`groupSkillsByCategory` now accepts the lexicon's own ref form for `category` (`id.sifa.defs#technical`) as well as the bare token, so a skill record written to spec is no longer bucketed under "Other". Adds the underlying `normalizeSkillCategory` helper. `knownValues` is advisory in AT Protocol, so both forms are legal and readers have to handle both.
