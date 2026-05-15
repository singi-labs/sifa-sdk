export { CONTINENTS, getContinent, type ContinentCode } from './continents.js';
export { COUNTRIES } from './countries.js';
export {
  INDUSTRY_OPTIONS,
  findIndustry,
  getIndustryLabelKey,
  type IndustryOption,
} from './industry-taxonomy.js';
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
