---
'@singi-labs/sifa-sdk': patch
---

Make `ProfilePosition.company` optional in the type, aligning it with the record schema (`ProfilePositionRecordSchema.company` is already `.optional()`) and the lexicon. Lets consumers represent self-employed / freelance / independent positions that omit a company name.
