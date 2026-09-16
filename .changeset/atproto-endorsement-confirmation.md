---
'@singi-labs/sifa-sdk': patch
---

Add `createEndorsementConfirmation` to the `/atproto` write helpers: writes an `id.sifa.endorsement.confirmation` record directly to the endorsee's PDS, with an optional `skill` strong ref for the confirmed skill. Adds the `AtprotoRecordWriteAgent` structural agent type for custom-collection writes that the convenience methods do not cover.
