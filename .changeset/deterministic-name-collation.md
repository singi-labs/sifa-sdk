---
'@singi-labs/sifa-sdk': patch
---

Skill and language name sorts (`groupSkillsByCategory`, `groupSkillsBySubCategory`, `sortLanguagesByProficiency`) now collate with a fixed locale. Before, they followed the runtime's default locale, so a server and a browser with different locales ordered mixed-script names differently and React discarded the server-rendered profile as a hydration mismatch.
