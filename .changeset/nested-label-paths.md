---
'@singi-labs/sifa-sdk': patch
---

Label rules can read nested fields via dotted paths, and `id.sifa.profile.location` now uses them. The city lives under `address`, so the previous top-level-only lookup fell through to the collection leaf: the one item on a data-management page about where someone physically is showed them the bare word "location" and nothing else.
