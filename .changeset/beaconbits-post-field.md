---
'@singi-labs/sifa-sdk': patch
---

Fix `isVisibleActivityItem` for `app.beaconbits.beacon`: the lexicon field for a linked Bluesky post is `record.post` (a strongRef), not `record.postRef`. Beacons with a linked post but no shout were being hidden incorrectly. Caught while wiring the predicate into sifa-web's BeaconBitsCard.
