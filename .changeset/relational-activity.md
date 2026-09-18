---
'@singi-labs/sifa-sdk': patch
---

Add `isRelationalActivity(nsid)` and use it in the two-tier policy: a relational activity (comment, reply, RSVP, like, follow, endorsement, membership, bookmark) never renders as a rich card, even when it carries media, so the compact line shows what was acted on and links out instead of reproducing someone else's content. Kept as a curated code-level signal, so the public activity-tiers data and the profile surfaces that consume it are unaffected.
