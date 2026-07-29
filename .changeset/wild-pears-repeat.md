---
'@singi-labs/sifa-sdk': patch
---

Reconcile the activity taxonomy with the apps Sifa actually scans.

55 of the 79 collections sifa-api scans had no entry. `getActivityTier` defaults an unknown NSID to `filtered`, so those apps were classified as hidden while rendering normally in production, and anything generated from this file was missing most of what Sifa supports.

Adds entries for all 55, backfills the `app` attribution on 15 older entries that lacked it, and adds tests asserting every entry has a tier and an owning app and uses only the three declared tiers.
