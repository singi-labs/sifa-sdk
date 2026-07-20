---
'@singi-labs/sifa-sdk': patch
---

Add the `recognized` signal to `OrgFloorVerdict` (#160 auto-recognize): a new `RecognizedEntity` type plus `recognized: boolean` and `recognizedEntity?` on the verdict. `recognized` is true when the handle's registrable domain resolves to a known company entity in Sifa's DB, independent of whether an org record exists, so a recognized-but-unclaimed company can be treated as a company before it claims.
