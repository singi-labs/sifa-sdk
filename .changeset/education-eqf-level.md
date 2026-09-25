---
'@singi-labs/sifa-sdk': patch
---

Add a structured education level anchored to the European Qualifications Framework. `eqfLevel` (1 to 8) is now on the education record schema, the education write schema, and the education types. New taxonomy exports: `EQF_LEVEL_OPTIONS` and `EQF_LEVEL_LABELS` with plain-language labels, `getEqfLevelLabel`, `readEqfLevel` to narrow untrusted record data, and `suggestEqfLevelFromDegree` to suggest a level from a free-text degree such as "PhD", "doctoraat", or "MSc".
