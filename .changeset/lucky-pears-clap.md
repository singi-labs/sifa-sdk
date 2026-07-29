---
'@singi-labs/sifa-sdk': patch
---

Add the optional `endorserHandle` to `PendingEndorsement`, matching the
AppView. Absent when the endorser has no Sifa profile yet, since an endorsement
can come from any AT Protocol app.
