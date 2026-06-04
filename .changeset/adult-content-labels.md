---
'@singi-labs/sifa-sdk': patch
---

Expose Bluesky content labels on activity items. Adds the optional
`labels?: ActivityLabel[]` field to `ActivityItem`, the
`ADULT_CONTENT_LABELS` constant (`porn`, `sexual`, `nudity`,
`graphic-media`), and the `hasAdultContent(item)` predicate. Use these in
clients to gate adult media without needing to know the Bluesky moderation
label set yourself.
