---
'@singi-labs/sifa-sdk': patch
---

Add `tools` (array of `toolRefSchema`, max 50) to `ProjectWriteSchema`, `EducationWriteSchema`, `InvolvementWriteSchema`, and `SkillWriteSchema`, plus `skills` (max 50) to project and education write schemas and `contexts` (max 2) to `SkillWriteSchema`. Mirror all three on the corresponding record schemas and export `toolRefSchema` from root and write. Matches sifa-lexicons 0.15.7.
