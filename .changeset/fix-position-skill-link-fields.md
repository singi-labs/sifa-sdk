---
"@singi-labs/sifa-sdk": patch
---

Fix: `linkSkillToPosition` and `unlinkSkillFromPosition` now carry `employmentType`, `workplaceType`, and `entityRef` through the position PUT body. Previously these were omitted, so the AppView merge cleared them from the position record on every skill link or unlink.
