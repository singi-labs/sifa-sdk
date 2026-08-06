---
'@singi-labs/sifa-sdk': patch
---

Add the governance and advisory employment types to the position taxonomy: `boardMember`, `boardObserver` and `advisor`. Mirrors sifa-lexicons#88. Board observer stays distinct from board member because an observer seat carries no vote. All three require a company name, since these roles are always at a named organization.
