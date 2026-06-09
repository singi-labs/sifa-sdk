export { CONTINENTS, getContinent, type ContinentCode } from './continents.js';
export { COUNTRIES } from './countries.js';
export {
  COMPANY_OPTIONAL_EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_GROUPS,
  EMPLOYMENT_TYPE_LABELS,
  getEmploymentTypeLabel,
  isCompanyRequired,
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
  type PlatformId,
} from './platforms.js';
export {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  SKILL_CATEGORIES,
  type SkillCategory,
} from './skill-categories.js';
export { dedupeSkills, groupSkillsByCategory, type MergedProfileSkill } from './skill-grouping.js';
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
