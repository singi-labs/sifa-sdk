---
'@singi-labs/sifa-sdk': patch
---

Add nine app-specific `StreamCardBody` variants to the activity-stream view-model (`github-pr`, `book`, `media-review`, `event-rsvp`, `verification`, `membership`, `location`, `travel`, `standard-site`) and enrich `toStreamCardVM` to populate each from its collection's raw record. Also widens `subject` population: `at.youandme.connection` yields a `person` subject and `fyi.asq.answer` a `record` subject. The transform stays pure — media rides as blob refs, colors as validated RGB, and no URLs are built.
