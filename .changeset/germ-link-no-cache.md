---
'@singi-labs/sifa-sdk': patch
---

`fetchGermMessageLink` never caches (the answer depends on the viewer's device and each call counts as a shown button) and forwards the visitor's User-Agent via the new `viewerUserAgent` option.
