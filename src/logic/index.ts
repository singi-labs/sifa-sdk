export {
  COMPLETENESS_MAX_SCORE,
  completenessPercent,
  completenessScore,
  type ProfileCompletion,
} from './profile-completeness.js';

export {
  DIMENSIONS_MAX_SCORE,
  MIN_SKILLS,
  countFilledDimensions,
  dimensionsFromInputs,
  getFilledDimensionsMap,
  profileToDimensionInputs,
  type DimensionKey,
  type DimensionMap,
  type ProfileDimensionInputs,
} from './profile-dimensions.js';

export { pickPrimaryPosition, type PrimaryPositionCandidate } from './primary-position.js';

export {
  summarizeProfileView,
  type ProfileSummary,
  type SummarizeProfileViewOptions,
} from './profile-summary.js';

export { isPseudoEmployer } from './pseudo-employer.js';
export { looksLikeDomain } from './domain-detect.js';
export {
  entityDisambiguationLabel,
  searchResultDisambiguation,
  entityResultKey,
  type DisambiguationFields,
} from './entity-disambiguation.js';
export {
  classifyEntityRef,
  isLinked,
  ENTITY_REF_ANCHORS,
  type EntityRefAnchor,
} from './entity-ref-anchor.js';
export {
  qualifiesAsOrg,
  isRegistrableDomainHandle,
  hasPersonalProfileContent,
  rendersPersonalProfile,
  rendersCompanyProfile,
  resolveAccountFacetMode,
} from './org-floor.js';
export type { PersonalFacetContent } from './org-floor.js';
export {
  isCompanyPageIndexable,
  COMPANY_PAGE_MIN_FIRMOGRAPHIC_FIELDS,
  type CompanyFirmographics,
} from './company-page-indexable.js';
export { countRecentActivity, type DailyActivityCount } from './recent-activity.js';
