---
'@singi-labs/sifa-sdk': patch
---

Add `claimed` to actor cards (`ActorCard`, `CoSpeakerView`, `ProjectMemberView`) and an `actorShowsIdentity(actor)` predicate. A person named on someone's record shows their name and profile link when confirmed or when they hold a claimed Sifa account; otherwise it stays a bare handle.
