---
'@singi-labs/sifa-sdk': patch
---

Add `investments` to the profile section model: `ALL_SECTIONS`, `SECTION_LABELS` and the has-content predicate. It sits directly after `involvement` as its own section, so consumers get the anchor, ordering and export label without hand-maintaining a parallel list.
