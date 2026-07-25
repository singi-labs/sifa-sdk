---
'@singi-labs/sifa-sdk': patch
---

Add `fetchWipePreview` and `useWipePreview`, which report the id.sifa.\* collections the current OAuth grant cannot delete. Delete-account UIs read this before the destructive step, since deleting an account destroys the session and a missing scope cannot be granted afterwards. A failed request throws rather than resolving to an empty gap list, so a caller never promises a clean wipe on the strength of a request that never arrived.
