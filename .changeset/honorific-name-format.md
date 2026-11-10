---
'@singi-labs/sifa-sdk': patch
---

`formatNameWithHonorifics` joins the suffix with a space (`Jane Doe PhD`, `John Smith OBE`) instead of always adding a comma; a suffix that starts with a comma (`, PhD`) is attached as typed. Honorifics the name already starts or ends with are not repeated (`Dr. Jane Doe` with prefix `Dr.` stays `Dr. Jane Doe`). Affects the JSON Resume name.
