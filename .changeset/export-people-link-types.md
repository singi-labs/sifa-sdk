---
'@singi-labs/sifa-sdk': patch
---

Export the people-link types from the root barrel.

`ActorCard`, `ProjectMemberCard`, `ProjectMemberView`, `ProjectRole`, and `PROJECT_ROLES` shipped in 0.12.45 defined but not re-exported. They appear in the signatures of exported interfaces -- `ProfileProject.members` is `ProjectMemberCard[]`, `ProjectView.members` is `ProjectMemberView[]` -- so a consumer could hold the values but never name the types.

Nothing caught it because the barrel tests only covered fetchers and hooks. `src/index.test.ts` now asserts each of these is nameable.
