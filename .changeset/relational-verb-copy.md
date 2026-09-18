---
'@singi-labs/sifa-sdk': patch
---

Relational verb copy for the two-tier line. Adds `commented`, `replied`, `rsvped`, `liked`, `followed`, and `bookmarked` verbs, and a connector-aware title so a relational item reads as a sentence with the subject the line renders after it ("Commented on {doc}", "RSVP'd to {event}", "Joined {community}"). The connector is dropped when no subject is referenced, so the phrase never dangles. Memberships now read "Joined {app}" instead of "Shared on {app}", and a YouAndMe connection reads "Followed" rather than "Joined".
