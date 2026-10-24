---
'@singi-labs/sifa-sdk': minor
---

Validate date fields on the profile write schemas. Position, education, project, honor, publication, certification, volunteering, involvement, investment and course dates now accept only `YYYY`, `YYYY-MM` or a real `YYYY-MM-DD` day, through the shared `partialDateFieldSchema`. `null` clears a date and an empty string is still accepted. An RFC 3339 datetime is shortened to its `YYYY-MM-DD` day. Any other value, which these schemas used to accept, is now rejected.
