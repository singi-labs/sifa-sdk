---
'@singi-labs/sifa-sdk': patch
---

Classify the Locale and pckt records Sifa scans in the activity taxonomy: `at.locale.project`, `at.locale.translation` and `blog.pckt.mini.post` are all `creation`. Without these entries `getActivityTier` defaults them to `filtered`, which contradicts the sifa-api registry scanning them.
