---
"@singi-labs/sifa-sdk": patch
---

Add `duplicateOrgs` to `AdminReviewQueues` (the `/api/admin/stats/review-queues` count), for the new duplicate-organisations admin review queue. Defaults to 0 and is folded into the derived `total`.
