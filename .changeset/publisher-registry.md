---
'@singi-labs/sifa-sdk': patch
---

Add publisher registry as the single source of truth for apps that publish through the shared `site.standard.*` namespace (Leaflet, Pckt, Offprint, WhiteWind, Unthread, Blento). Exposes `PUBLISHERS`, `Publisher`, `STANDARD_PUBLISHER_ID`, and helpers `getPublisherById`, `getPublisherByHost`, `getPublisherFromSiteUrl`. Additive only — no behaviour change for existing consumers.
