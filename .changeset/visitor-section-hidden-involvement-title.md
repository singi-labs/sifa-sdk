---
'@singi-labs/sifa-sdk': patch
---

`isSectionPopulated` no longer counts items the owner hid, so a section whose only entries are hidden drops out of the visitor view (nav, `getVisibleSectionIds`, exports). The involvement highlight tile without a role now shows the kind's readable heading (for example "Volunteering") instead of the raw lexicon token.
