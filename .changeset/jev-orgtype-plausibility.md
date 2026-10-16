---
'@singi-labs/sifa-sdk': patch
---

Add `isInferredOrgTypePlausible` and `SECTOR_ORG_TYPE_INDUSTRY_HINTS` to `/jev`: sector-bound inferred org types (healthcare provider, educational, government, research institute, religious, political) now require an org description and a matching industry. Also adds `INFERRED_FACT_FIELDS` (the Jev-inferred company facts a visitor can report) and an `inferredFactReports` count on `AdminReviewQueues`.
