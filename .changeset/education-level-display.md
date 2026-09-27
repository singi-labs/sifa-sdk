---
'@singi-labs/sifa-sdk': patch
---

Add `getEducationLevelDisplay`, the one rule for showing an education level next to the degree: it returns the plain-language level label, or undefined when there is no valid level or the degree text already names it. With no degree text, the label stands in for it.
