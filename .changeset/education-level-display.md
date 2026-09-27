---
'@singi-labs/sifa-sdk': patch
---

Add `getEducationLevelDisplay`, the one rule for showing an education level next to the degree: it returns the plain-language level label, or undefined when there is no valid level or the degree itself already names it (whole words, degree only). With no degree, the label stands in for it.
