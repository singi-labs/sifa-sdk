---
'@singi-labs/sifa-sdk': patch
---

Add `cid`, `endorsementCount`, `endorsed`, and `endorsedAs` to `SkillView`. The AppView already serves these on each skill; TS consumers can now read the endorsement summary without casting.
