---
'@singi-labs/sifa-sdk': patch
---

Phase 5A.3 sections -- generic record CRUD + positions/education/skills mutation surface.

### Generic record CRUD escape hatch

For sections without a dedicated endpoint (certifications, projects, publications, volunteering, honors, languages, courses):

- `createRecord(config, collection, data)` / `useCreateRecord`
- `updateRecord(config, collection, rkey, data)` / `useUpdateRecord`
- `deleteRecord(config, collection, rkey)` / `useDeleteRecord`

Routes to `POST|PUT|DELETE /api/profile/records/<collection>/<rkey?>`.

### Position mutations (new)

- `updatePosition`, `deletePosition` / `useUpdatePosition`, `useDeletePosition`
- `setPositionPrimary`, `unsetPositionPrimary` / `useSetPositionPrimary`, `useUnsetPositionPrimary`
- `linkSkillToPosition`, `unlinkSkillFromPosition` / `useLinkSkillToPosition`, `useUnlinkSkillFromPosition`. `link` is idempotent (no fetch when the skill is already linked) and strips `null` `location` from the PUT body so JSON.stringify drops it.

### Education mutations (new)

- `createEducation`, `updateEducation`, `deleteEducation` and matching hooks.

### Skill mutations (new)

- `createSkill`, `updateSkill`, `deleteSkill` and matching hooks.

### Hook contract

All mutation hooks accept an `ownerHandleOrDid` argument for cache invalidation and forward the TanStack v5 four-arg `onSuccess` signature. Position hooks invalidate both `sifaQueryKeys.profile.byHandle(owner)` and `sifaQueryKeys.position.byOwner(owner)`. Other section hooks invalidate the profile cache only.

### Versioning

Patch bump. PR 2 of 5 in the Phase 5A.3 sweep.
