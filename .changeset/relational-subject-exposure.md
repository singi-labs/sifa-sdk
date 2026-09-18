---
'@singi-labs/sifa-sdk': patch
---

Expose a subject for relational lines so connector verbs never dangle. The RSVP transform now sets the event as the view model's subject (so "RSVP'd to {event}" reads as a sentence), reply records resolve their `reply.parent` as the subject, and the api-resolved `subjectTitle` / `subjectUrl` fold onto a record subject (with a new optional `url`) so a comment reads "Commented on {doc}" and links to it. Adds `subjectTitle` / `subjectUrl` to `ActivityItem`.
