---
'@singi-labs/sifa-sdk': patch
---

Add `validateTalksImport`: per-row checks for the Talks & sessions CSV import (missing title, invalid URL or date, session date more than 12 months ahead, session with no title or event, unknown role, mode or presentation_key), so a preview can list skipped rows and import the rest.
