---
'@singi-labs/sifa-sdk': patch
---

Add `getAdminReviewQueues` fetcher and `useAdminReviewQueues` hook for the open counts of the three admin review queues (ideas, name corrections, pending companies) plus their total. Backed by `GET /api/admin/stats/review-queues`; shared query key means the admin nav pill and the review-queues page render from one request.
