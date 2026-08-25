---
'@singi-labs/sifa-sdk': minor
---

Add Certified badge enrichment, and surface accepted badges the person received.

`CertifiedDetailsView` (badge title, description, icon, type, plus resolved recipient / issuer / group accounts) is added to the `ActivityItem` input and `StreamCardVM`, validated in `streamCardVMSchema`, and passed through the transform.

`app.certified.badge.response` gains an activity tier and a visibility rule. A badge response is the recipient's own accept or decline of a badge someone else awarded them: an accepted one is a credential the person holds and now renders, a rejected one stays hidden.

Taxonomy version 1.2.0 to 1.3.0.
