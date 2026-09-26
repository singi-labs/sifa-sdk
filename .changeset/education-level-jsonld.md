---
'@singi-labs/sifa-sdk': patch
---

`buildPersonJsonLd` now states an education entry's EQF level. A degree credential in `hasCredential` gets `educationalLevel` as a schema.org `DefinedTerm` (plain-language name, EQF level as `termCode`, the EQF as `inDefinedTermSet`). An entry with a level but no degree text is now emitted too, named after its level. `JsonLdEducation` gains `eqfLevel`, and the vendored term mappings are resynced from sifa-lexicons.
