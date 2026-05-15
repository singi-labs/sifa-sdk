/**
 * Sifa SDK -- public client library for the Sifa AppView on AT Protocol.
 *
 * Pre-1.0: the public API is unstable and may change in any minor release.
 *
 * @see https://github.com/singi-labs/sifa-sdk
 */

declare const __SIFA_SDK_VERSION__: string;

export const SIFA_SDK_VERSION: string = __SIFA_SDK_VERSION__;

export type {
  ActiveApp,
  Endorsement,
  EndorsementData,
  ExternalAccount,
  ExternalAccountKeytraceClaim,
  FeedItem,
  LanguageProficiency,
  LocationValue,
  PdsProviderInfo,
  Profile,
  ProfileCertification,
  ProfileCourse,
  ProfileEducation,
  ProfileHonor,
  ProfileIndustry,
  ProfileLanguage,
  ProfileLocation,
  ProfileOverrideSource,
  ProfilePosition,
  ProfileProject,
  ProfilePublication,
  ProfileSkill,
  ProfileVolunteering,
  PublicationContributor,
  SkillRef,
  SkillSuggestion,
  TrustStat,
  VerifiedAccount,
} from './types/index.js';

export {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CONTINENTS,
  COUNTRIES,
  INDUSTRY_OPTIONS,
  findIndustry,
  getIndustryLabelKey,
  PLATFORM_LABELS,
  PLATFORM_OPTIONS,
  SKILL_CATEGORIES,
  dedupeSkills,
  getContinent,
  getFaviconUrl,
  getPlatformLabel,
  groupSkillsByCategory,
  isKnownPlatform,
  type ContinentCode,
  type IndustryOption,
  type MergedProfileSkill,
  type PlatformId,
  type SkillCategory,
} from './taxonomy/index.js';

export {
  certDateExtractor,
  contrastRatio,
  countryCodeToFlag,
  dateRangeExtractor,
  detectPdsProvider,
  formatDistanceToNow,
  formatLocation,
  formatRelativeTime,
  getDisplayLabel,
  getHandleStem,
  getPdsDisplayName,
  isValidRgbColor,
  lexiconDateExtractor,
  meetsContrastAA,
  parseLocationString,
  pdsProviderFromApi,
  relativeLuminance,
  rgbToString,
  sanitizeHandleInput,
  singleDateExtractor,
  sortByDateDesc,
  truncateGraphemes,
  type PdsProvider,
  type RgbColor,
} from './format/index.js';
