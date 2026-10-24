---
'@singi-labs/sifa-sdk': patch
---

Validate date fields on the profile write schemas. Position, education, project, honor, publication, certification, volunteering, involvement, investment and course dates now accept only `YYYY`, `YYYY-MM` or a real `YYYY-MM-DD` day (or `null` to clear), through the shared `partialDateFieldSchema`.
