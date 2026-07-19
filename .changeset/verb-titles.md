---
"@singi-labs/sifa-sdk": patch
---

Cleaner activity-stream titles. Post-type verbs drop the redundant app name (the source already shows it), so `title` reads "Posted" / "Reposted" instead of "Posted on Bluesky network". Adds a `reviewed` verb (maps `social.popfeed.feed.review` and `buzz.bookhive.book`) so reviews read "Reviewed on {app}" instead of the generic "Created a record on {app}", and the generic fallback now reads "Shared on {app}".
