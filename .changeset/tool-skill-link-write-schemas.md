---
'@singi-labs/sifa-sdk': patch
---

Add `tools` (array of `toolRefSchema`, max 50) to `ProjectWriteSchema`, `EducationWriteSchema`, `InvolvementWriteSchema`, and `SkillWriteSchema`. Add `skills` (max 50) to `ProjectWriteSchema` and `EducationWriteSchema`, `contexts` (max 2, open set) to `SkillWriteSchema`, and export `toolRefSchema`. Matches sifa-lexicons 0.15.7.
