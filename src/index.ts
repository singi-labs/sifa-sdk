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
