---
'@singi-labs/sifa-sdk': patch
---

Add driver's license, right to work and nationality to the private export details. `ExportContact`, `ExportContactDraft`, `exportContactSchema`, `EXPORT_CONTACT_LIMITS`, `pickExportContact` and `normalizeExportContact` carry `driversLicense`, `rightToWork` and `nationality`. `profileToJsonResume` emits them as extra `basics` keys, and `profileToFunderCv` puts them on the ERC person.
