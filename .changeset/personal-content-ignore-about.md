---
'@singi-labs/sifa-sdk': patch
---

`hasPersonalProfileContent` no longer counts the about text. It is seeded from the Bluesky bio at sign-in, so organization accounts carry one too and the org claim flow treated them as having a personal profile to keep.
