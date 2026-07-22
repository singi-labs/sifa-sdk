---
'@singi-labs/sifa-sdk': patch
---

Add `summarizeProfileView` and `fetchProfileSummary` for compact profile summaries. Third-party surfaces (badges, maintainer cards, bylines) can now get identity, headline, current role/employer, and top skills without handling the full `getProfileView` payload. `summarizeProfileView` is a pure transform; `fetchProfileSummary` fetches and reduces in one call.
