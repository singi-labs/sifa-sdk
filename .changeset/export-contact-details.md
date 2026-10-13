---
'@singi-labs/sifa-sdk': patch
---

Add private contact details for exports. `@singi-labs/sifa-sdk/resume` exports `ExportContact`, `exportContactSchema`, `EXPORT_CONTACT_LIMITS`, `pickExportContact`, `normalizeExportContact` and `looksLikeEmail`. `profileToJsonResume` takes an optional `contact` and emits `basics.email`, `basics.phone` and `basics.location.address` from it. `profileToFunderCv` takes an optional `{ contact }` and puts it on the ERC person (new `ErcFunderCvPerson` type); NIH ignores it.
