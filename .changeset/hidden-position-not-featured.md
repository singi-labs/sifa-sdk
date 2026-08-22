---
'@singi-labs/sifa-sdk': patch
---

`pickPrimaryPosition` now excludes hidden positions. A role the user hid from
their public profile is no longer surfaced as the featured "current position"
on profile cards, OG images, and JSON-LD. Hidden wins over `primary`, so a role
flagged both hidden and primary is excluded rather than featured.
