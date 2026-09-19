---
'@singi-labs/sifa-sdk': patch
---

Resolve the person referenced by a follow (or any bare-DID subject) on the activity line. `ActivityItem` gains `subjectHandle` and `subjectDisplayName`, and `withResolvedSubjectMeta` now folds them onto a `person` subject, so the two-tier line can read "Followed {name}" and link to the profile instead of "Followed someone". sifa-api sets the fields by resolving the DID.
