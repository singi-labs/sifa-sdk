export { CONTINENTS, getContinent, type ContinentCode } from './continents.js';
export { COUNTRIES } from './countries.js';
export {
  COMPANY_OPTIONAL_EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_GROUPS,
  EMPLOYMENT_TYPE_LABELS,
  ON_BEHALF_OF_EMPLOYMENT_TYPES,
  getEmploymentTypeLabel,
  isCompanyRequired,
  isOnBehalfOfApplicable,
  type EmploymentTypeGroup,
  type EmploymentTypeOption,
} from './employment-type.js';
export {
  INDUSTRY_OPTIONS,
  findIndustry,
  getIndustryLabelKey,
  type IndustryOption,
} from './industry-taxonomy.js';
export {
  OPEN_TO_OPTIONS,
  OPEN_TO_TOKENS,
  OPEN_TO_TOKEN_TO_VALUE,
  OPEN_TO_VALUE_TO_TOKEN,
  OPEN_TO_LEGACY_VALUE_ALIASES,
  getOpenToLabelKey,
  normalizeOpenTo,
  openToTokenToValue,
  openToValueToToken,
  type OpenToGroup,
  type OpenToOption,
} from './open-to.js';
export {
  WORKPLACE_TYPE_LABELS,
  WORKPLACE_TYPE_OPTIONS,
  WORKPLACE_TYPE_LEGACY_ALIASES,
  getWorkplaceTypeLabel,
  normalizeWorkplaceTypes,
  type WorkplaceTypeOption,
} from './workplace-type.js';
export {
  PLATFORM_LABELS,
  PLATFORM_OPTIONS,
  getFaviconUrl,
  getPlatformLabel,
  isKnownPlatform,
  normalizePlatformId,
  type PlatformId,
} from './platforms.js';
export {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  SKILL_CATEGORIES,
  type SkillCategory,
} from './skill-categories.js';
export {
  dedupeSkills,
  groupSkillsByCategory,
  groupSkillsBySubCategory,
  type MergedProfileSkill,
} from './skill-grouping.js';
export {
  groupSkillsForDisplay,
  type SkillDisplayGroups,
  type SkillDisplayGroupsOptions,
} from './skill-display-groups.js';
export {
  APP_CATEGORIES,
  APP_CATEGORY_IDS,
  getAppCategoryIcon,
  isAppCategory,
  type AppCategoryId,
} from './app-categories.js';
export {
  APP_CATEGORY_MAP,
  categoryForApp,
  isKnownAppId,
  type KnownAppId,
} from './app-category-map.js';
export {
  ACTIVITY_TIERS,
  getActivityTaxonomyVersion,
  getActivityTier,
  getLexiconEntry,
  getTierMeta,
  type ActivityTaxonomy,
  type ActivityTier,
  type LexiconEntry,
  type TierMeta,
} from './activity-tiers.js';
export {
  PRESENTATION_ROLE_LABELS,
  PRESENTATION_ROLE_OPTIONS,
  getPresentationRoleLabel,
  type PresentationRoleOption,
} from './presentation-role.js';
export {
  PRESENTATION_LINK_TYPE_LABELS,
  PRESENTATION_LINK_TYPE_OPTIONS,
  getPresentationLinkTypeLabel,
  type PresentationLinkTypeOption,
} from './presentation-link-type.js';
export {
  CALENDAR_EVENT_MODE_LABELS,
  CALENDAR_EVENT_STATUS_LABELS,
  getCalendarEventModeLabel,
  getCalendarEventStatusLabel,
} from './calendar-event.js';
export {
  INVOLVEMENT_KIND_HEADINGS,
  INVOLVEMENT_KIND_LABELS,
  INVOLVEMENT_KIND_OPTIONS,
  getInvolvementKindHeading,
  getInvolvementKindLabel,
  type InvolvementKindOption,
} from './involvement-kind.js';
export {
  ARTIFACT_LINK_KIND_LABELS,
  ARTIFACT_LINK_KIND_OPTIONS,
  getArtifactLinkKindLabel,
  type ArtifactLinkKindOption,
} from './artifact-link-kind.js';
export {
  VERIFICATION_PROVIDERS,
  getVerificationProvider,
  isKnownVerificationProvider,
  resolveVerifierProvider,
  primaryVerification,
  type AccountVerification,
  type VerificationProvider,
  type VerificationProviderId,
  type VerificationSource,
} from './verification-providers.js';
