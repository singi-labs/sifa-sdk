---
'@singi-labs/sifa-sdk': patch
---

Drop the app name from activity verb titles ("Shipped on Tangled" becomes "Shipped", "Shared on X" becomes "Shared", etc.). The two-tier line already shows the app in its source pill, so repeating it was redundant and truncated to "Shipped on..." on narrow mobile screens. Relational verbs keep their preposition, which points at the subject the line renders after them ("Commented on {doc}"), not the app.
