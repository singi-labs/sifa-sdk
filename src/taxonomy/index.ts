export { CONTINENTS, getContinent, type ContinentCode } from './continents.js';
export { COUNTRIES } from './countries.js';
export {
  EMPLOYMENT_TYPE_GROUPS,
  EMPLOYMENT_TYPE_LABELS,
  getEmploymentTypeLabel,
  type EmploymentTypeGroup,
  type EmploymentTypeOption,
} from './employment-type.js';
export {
  INDUSTRY_OPTIONS,
  findIndustry,
  getIndustryLabelKey,
  type IndustryOption,
} from './industry-taxonomy.js';
export { OPEN_TO_OPTIONS, getOpenToLabelKey, type OpenToOption } from './open-to.js';
export {
  WORKPLACE_TYPE_LABELS,
  WORKPLACE_TYPE_OPTIONS,
  getWorkplaceTypeLabel,
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
