---
"@singi-labs/sifa-sdk": patch
---

Add the shared profile section model (`src/profile/`): section list + order (`ALL_SECTIONS`, `SECTION_GROUPS`, `SECTION_LABELS`), visibility predicates (`isSectionPopulated`, `getVisibleSectionIds`, `filterHidden`, `visibleItems`), per-section sorts (`sortPositions`, `sortEducation`, `sortProjects`, `sortPublications`, `sortCertifications`, `sortHonors`, `sortLanguages`, `sortByActiveDateRange`, `sortLanguagesByProficiency`, `hoistPrimary`), and involvement grouping (`groupInvolvementByHeading`, `INVOLVEMENT_HEADING_ORDER`). Adds timeline date formatters (`formatTimelineDate`, `formatDateRange`) under `format`. Moved out of sifa-web so every profile surface (HTML page, Markdown/DOCX/print exports, and the personal-site renderer) renders sections from one source of truth.
