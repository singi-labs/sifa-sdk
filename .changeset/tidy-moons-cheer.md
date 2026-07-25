---
'@singi-labs/sifa-sdk': patch
---

Add `updateSkillSubCategories` and `useUpdateSkillSubCategories` for setting or clearing the sub-category on many skills in one request. Replaces a per-skill PUT fan-out that tripped the AppView's per-IP rate limit on sizeable profiles. An empty label clears the field; the result reports `updated`, `unchanged` and `skipped`.
