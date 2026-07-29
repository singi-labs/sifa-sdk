---
'@singi-labs/sifa-sdk': patch
---

Make the endorsement CID optional, matching the AppView.

`PendingEndorsement` gains an optional `cid`, and `confirmEndorsement` no
longer requires `endorsementCid`. The AppView resolves the CID itself when the
caller has none, reading the record from the endorser's PDS. An endorsement
written by another AT Protocol app can be indexed without its CID ever reaching
us, so callers must be able to confirm without one.
