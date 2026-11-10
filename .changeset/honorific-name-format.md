---
'@singi-labs/sifa-sdk': minor
---

Behaviour change in `formatNameWithHonorifics`: the suffix is joined with a space (`Jane Doe PhD`, `John Smith OBE`) instead of always with a comma; a suffix that starts with a comma (`, PhD`) keeps it. Honorifics the name already starts or ends with are not repeated, comparing loosely (`Dr` / `Dr.`, `PhD` / `Ph.D.`). The name is trimmed and an empty name stays empty. JSON Resume no longer puts honorifics around a bare handle. Callers that expect `Dr. Jane Doe, PhD` need updating.
