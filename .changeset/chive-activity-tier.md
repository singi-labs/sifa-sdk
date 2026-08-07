---
'@singi-labs/sifa-sdk': patch
---

Classify `pub.chive.eprint.submission` as a `creation` in the activity taxonomy. Without it `getActivityTier` reports Chive eprints as `filtered`, which fails sifa-api's taxonomy reconciliation check.
