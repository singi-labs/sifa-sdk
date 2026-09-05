---
'@singi-labs/sifa-sdk': patch
---

Inbox polish: add `endorserDisplayName` and `endorserAvatar` to `PendingEndorsement`
so the endorsement inbox can render a person rather than a bare handle, and add
`dismissUnlinkedPosition` + `useDismissUnlinkedPosition` for dismissing an
unlinked-company task (invalidates the unlinked-positions list and the inbox
counts on success).
