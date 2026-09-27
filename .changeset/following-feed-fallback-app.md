---
'@singi-labs/sifa-sdk': patch
---

Add `followingFeedFallbackApp`: when the default following feed comes back empty, it returns the busiest app the network is active on, so web and app clients can show that app's activity instead of an empty state.
