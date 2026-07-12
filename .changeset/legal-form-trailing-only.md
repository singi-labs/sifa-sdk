---
"@singi-labs/sifa-sdk": patch
---

Restrict `normalizeLegalForm` to the trailing designator token only. A leading designator token is almost always part of the brand ("INC Research", "AG Innovations") rather than a legal form, so recasing it would corrupt the name. Trailing-only removes that class of false positive.
