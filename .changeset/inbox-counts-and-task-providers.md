---
'@singi-labs/sifa-sdk': patch
---

Add the unified-inbox query layer: `fetchInboxCounts`/`useInboxCounts` (with the
`InboxCounts` type) for the header bell badge, plus `fetchUnlinkedPositions`/
`useUnlinkedPositions` and `fetchProfileCompleteness`/`useProfileCompleteness` for
the two new "open task" providers. Adds the `inbox.counts()`,
`position.unlinked()` and `profile.completeness()` query keys, `cookieHeader`
options on the pending/given confirmation and pending endorsement fetchers for RSC
server-side calls, and `inbox.counts()` cache invalidation on the confirmation and
endorsement mutation hooks so the bell badge stays in step with resolved tasks.
