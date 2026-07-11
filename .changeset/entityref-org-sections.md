---
'@singi-labs/sifa-sdk': patch
---

Add optional `entityRef` to the education, volunteering, certification, course, and honor record schemas, mirroring the field on `ProfilePosition`. It carries a portable, app-neutral organization identifier (Wikidata/ROR/LEI URI), constrained to http(s), for durable org linking across the profile (#241).
