---
"@singi-labs/sifa-sdk": patch
---

Add optional freeform `subCategory` to the skill read and write schemas, the `ProfileSkill` and `SkillView` types, and a `groupSkillsBySubCategory` helper. Renderers can now present skills in the user's own groups (Frontend, Backend, and so on) nested under the broad `category`.
