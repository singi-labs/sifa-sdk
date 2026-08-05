---
'@singi-labs/sifa-sdk': patch
---

Add `buildMetaDescription`, moved from sifa-web.

It derives a profile page's meta description from the headline, the current position and the location. It shares `pickPrimaryPosition` with the JSON-LD emitters, so the description and the JSON-LD `jobTitle` can no longer disagree about which position is current. Owner-hidden positions are excluded, matching the `/jsonld` emitters.
