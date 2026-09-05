export {
  ALL_SECTIONS,
  SECTION_GROUPS,
  SECTION_LABELS,
  filterHidden,
  getVisibleSectionIds,
  isSectionPopulated,
  visibleItems,
  type SectionGroupId,
  type SectionId,
} from './section-model.js';

export {
  hoistPrimary,
  sortCertifications,
  sortEducation,
  sortHonors,
  sortLanguages,
  sortPositions,
  sortProjects,
  sortPublications,
} from './section-sorts.js';

export { sortByActiveDateRange } from './range-sort.js';
export { sortLanguagesByProficiency } from './language-sort.js';
export { isRoleLineRedundant } from './headline-role-dedupe.js';

export {
  INVOLVEMENT_HEADING_ORDER,
  groupInvolvementByHeading,
  type InvolvementGroup,
} from './involvement-grouping.js';

export {
  buildProfileHighlights,
  shouldRenderHighlights,
  formatSpanDate,
  formatSingleDate,
  formatEventDate,
  type ProfileHighlightsInput,
  type ProfileHighlightSection,
  type ProfileHighlightStatus,
  type ProfileHighlightTile,
  type BuildProfileHighlightsOptions,
} from './highlights.js';
