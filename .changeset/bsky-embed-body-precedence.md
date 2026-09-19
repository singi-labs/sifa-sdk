---
'@singi-labs/sifa-sdk': patch
---

Fix Bluesky posts with a caption AND an embed rendering as a bare text box. `applyBskyPost` now lets the embed (image / external link) win the body kind over the caption text, carrying the caption on the media/link body's `text`. Previously a captioned photo or link post got a `text` body, so the stream dispatch rendered the caption alone and dropped the image or link preview.
