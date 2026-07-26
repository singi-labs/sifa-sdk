---
'@singi-labs/sifa-sdk': patch
---

Add `groupSkillsForDisplay`, which returns a category's sub-groups plus whether labels carry information (withheld below two distinct sub-categories). `ungroupedFirst` hoists the unlabelled bucket for linear documents, where trailing it would read as belonging to the sub-heading above. Shared so the profile, print, markdown and docx surfaces group identically.
