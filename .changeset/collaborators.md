---
'@singi-labs/sifa-sdk': patch
---

Add involvement `collaborators` and `sameAs`.

Involvement is the fourth record type that can name another person, and it reuses `projectMemberRef` rather than a parallel def differing only in name: it is the same relation, people you did this with.

`sameAs` lands on involvement and publication too, so a confirmed collaborator or author can keep their own entry for the same work without it being a second, unrelated one. Project and presentationDelivery already had it.
