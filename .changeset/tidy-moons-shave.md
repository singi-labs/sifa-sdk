---
'@singi-labs/sifa-sdk': patch
---

Add the endorsement inbox query layer, and fix two bugs it surfaced.

New: `fetchPendingEndorsements` / `usePendingEndorsements` read endorsements
awaiting the signed-in user's decision, `confirmEndorsement` /
`useConfirmEndorsement` accept one, and `dismissEndorsement` /
`useDismissEndorsement` clear it from the inbox without publishing a rejection.

Fixed: `createEndorsement` posted to `/api/endorsements`, which does not exist
on the AppView, and omitted the `subjectDid`, `skillCid` and `skillName` fields
the real endpoint requires. It could never have succeeded; nothing consumed it
yet. Its test asserted the wrong URL, which is why the mismatch survived.

Fixed: `apiFetch` called `res.json()` on every successful response, so a 204
threw and `apiWrite` reported `success: false`. Roadmap unvote and remove
reaction both return 204 and were silently reporting failure on success.
