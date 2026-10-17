---
'@singi-labs/sifa-sdk': patch
---

Profile and app-homepage fallback links are marked (`CardHealth.isProfileFallback`, `StreamCardVM.sourceUrlIsProfile`), and `isTimelineWorthy` no longer counts them as a link to the item. New `appLinksItems(appId)` reports whether an app can link a single item at all.
