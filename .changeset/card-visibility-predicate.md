---
'@singi-labs/sifa-sdk': patch
---

Add `isVisibleActivityItem(collection, record)` and the `ACTIVITY_VISIBILITY_RULES` registry. These let sifa-api and sifa-web share a single source of truth for "this record carries no card-worthy content" rules — e.g. BookHive shelf-adds without a review or stars, BeaconBits pins without a shout, Margin bookmarks without a source, Margin annotations without body text. Unknown collections default to visible, so the rule set is additive.
