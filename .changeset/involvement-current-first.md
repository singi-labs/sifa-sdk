---
'@singi-labs/sifa-sdk': patch
---

Sort ongoing involvement entries first within each heading group. `groupInvolvementByHeading` now floats entries with no end date to the top (then by end date, then start date), matching the current-first ordering used by positions and education. Previously a recently-ended role could sort above a long-running current one.
