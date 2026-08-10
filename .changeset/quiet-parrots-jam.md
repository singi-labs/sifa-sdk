---
'@singi-labs/sifa-sdk': patch
---

Add `fetchReceivedEndorsements` and `useReceivedEndorsements`: confirmed
endorsements a DID has received, newest first, carrying the endorser's handle,
display name and avatar. `fetchEndorsementCount` already hit this endpoint and
threw the payload away; this returns it.
