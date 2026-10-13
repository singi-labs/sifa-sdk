---
'@singi-labs/sifa-sdk': patch
---

`profileToJsonResume` no longer emits `driversLicense`, `rightToWork` or `nationality` in `basics`. JSON Resume has no field for them, and strict consumers such as altacv refuse a file with an unknown key. The ERC funder CV still carries them.
