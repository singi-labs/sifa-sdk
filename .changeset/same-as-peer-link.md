---
'@singi-labs/sifa-sdk': patch
---

Add `sameAs`, the link to the same thing recorded on someone else's profile.

`projectRef` was documented as the link to a canonical `id.sifa.project.self` and then widened in 0.12.45 to also mean "another person's entry for the same work". Those are different relations, and the same trick could not be repeated on `presentationDelivery`, where `presentationRef` already means "an instance of that talk".

So one generic `sameAs` on both, for the same reason `id.sifa.confirmation` is one record type rather than four. `projectRef` goes back to the composition link it was documented as.

`externalRecordRef` rather than `strongRef`: the CID must be optional and advisory, because the other person keeps editing their record and that must not invalidate a link asserting the two describe one thing.

`ProfileProject.projectRef` and `ProjectView.projectRef` become `sameAs` in the view types. Those only ever carried the peer link, which the AppView added in 0.12.45 and has not shipped to production, so nothing is reading them yet.
