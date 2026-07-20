---
'@singi-labs/sifa-sdk': patch
---

Make ingested Fediverse posts (`fediverse.post`) render as a clickable card. Its permalink now becomes the card `sourceUrl` instead of an `externalLink`, so the whole card links to the post and the raw URL is no longer shown as text.
