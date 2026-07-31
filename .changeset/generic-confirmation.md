---
'@singi-labs/sifa-sdk': patch
---

Add `id.sifa.confirmation` support and project members.

Naming another person on your own record is a claim, not a fact. `ConfirmationRecordSchema` and the `/api/confirmation` fetchers and hooks cover the other half of it: the named person affirms the claim from their own repo, and only then does the AppView attach their display name, avatar, and profile link.

- `ConfirmationRecordSchema` + `CONFIRMATION_RELATIONS`. The subject strongRef carries no collection constraint, so one record type serves co-speaker credits, project membership, and later relations. `subjectName` snapshots what was confirmed, so a rename after the fact is detectable.
- `fetchPendingConfirmations`, `createConfirmation`, `dismissConfirmation`, `revokeConfirmation`, and the matching `usePendingConfirmations` / `useCreateConfirmation` / `useDismissConfirmation` / `useRevokeConfirmation` hooks.
- `ProfileProjectRecordSchema` and `ProjectWriteSchema` gain `members` (max 50) and `projectRef`.
- `ActorCard` replaces the co-speaker card shape and carries `confirmed` / `confirmedStale`; `CoSpeaker` stays as a deprecated alias so existing call sites keep compiling.
- `ProjectMemberCard`, `PROJECT_ROLES`, `ProjectRole`, `ProjectMemberView`, and `members` / `projectRef` on `ProfileProject` and `ProjectView`.

Fixes two drifts against the lexicon: `name` on a project record was capped at 100 graphemes where the lexicon allows 256, so the SDK rejected records a conforming PDS had accepted; and `projectRef` was missing from the record schema entirely.
