export interface LocationValue {
  city?: string;
  region?: string;
  country: string;
  countryCode?: string;
  postalCode?: string;
  geonameId?: number;
}

export interface SkillRef {
  uri: string;
}

export interface ProfilePosition {
  rkey: string;
  company: string;
  title: string;
  description?: string;
  startedAt: string;
  endedAt?: string;
  location?: LocationValue | null;
  employmentType?: string;
  workplaceType?: string;
  skills?: SkillRef[];
  linkedSkills?: ProfileSkill[];
  primary?: boolean;
}

export interface ProfileEducation {
  rkey: string;
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  description?: string;
  activities?: string;
  startedAt?: string;
  endedAt?: string;
}

export interface ProfileSkill {
  rkey: string;
  name: string;
  category?: string;
  endorsementCount?: number;
  endorsed?: boolean;
  activityBacked?: boolean;
}

export interface SkillSuggestion {
  canonicalName: string;
  slug: string;
  category: string;
}

export interface Endorsement {
  endorserDid: string;
  endorserHandle: string;
  endorserDisplayName?: string;
  endorserAvatar?: string;
  comment?: string;
  relationshipContext?: string;
  createdAt: string;
}

export interface EndorsementData {
  skillRkey: string;
  comment?: string;
  relationshipContext?: string;
}

export interface ProfileLocation {
  rkey: string;
  type: string;
  label?: string | null;
  isPrimary: boolean;
  locationCountry?: string | null;
  locationRegion?: string | null;
  locationCity?: string | null;
  countryCode?: string | null;
  location?: string | null;
}

export interface ProfileCertification {
  rkey: string;
  name: string;
  issuingOrg: string;
  issueDate?: string;
  expiryDate?: string;
  credentialUrl?: string;
}

export interface ProfileProject {
  rkey: string;
  name: string;
  description?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
}

export interface PublicationContributor {
  name: string;
  orcidId?: string;
  did?: string;
  handle?: string;
}

export interface ProfilePublication {
  rkey: string;
  title: string;
  publisher?: string;
  date?: string;
  url?: string;
  description?: string;
  source?: 'sifa' | 'standard' | 'orcid';
  doi?: string;
  type?: string;
  typeLabel?: string;
  contributors?: PublicationContributor[];
  verified?: boolean;
  verifiedVia?: string;
  orcidPutCode?: number;
  hidden?: boolean;
  orcidCorroborated?: boolean;
  pendingVerification?: boolean;
  appId?: string;
}

export interface ProfileVolunteering {
  rkey: string;
  organization: string;
  role?: string;
  cause?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface ProfileHonor {
  rkey: string;
  title: string;
  issuer?: string;
  date?: string;
  description?: string;
}

export type LanguageProficiency =
  | 'elementary'
  | 'limited_working'
  | 'professional_working'
  | 'full_professional'
  | 'native';

export interface ProfileLanguage {
  rkey: string;
  language: string;
  proficiency?: LanguageProficiency;
}

export interface ProfileCourse {
  rkey: string;
  name: string;
  institution?: string;
  number?: string;
}

export interface TrustStat {
  key: string;
  label: string;
  value: number;
}

export interface ActiveApp {
  id: string;
  name: string;
  category: string;
  recentCount: number;
  latestRecordAt?: string | null;
}

export interface VerifiedAccount {
  platform: string;
  identifier: string;
  url?: string;
}

export interface ExternalAccountKeytraceClaim {
  rkey: string;
  claimedAt: string;
}

export interface ExternalAccount {
  rkey: string;
  platform: string;
  url: string;
  label?: string;
  feedUrl?: string;
  primary?: boolean;
  verifiable: boolean;
  verified: boolean;
  verifiedVia?: string | null;
  source?: 'sifa' | 'keytrace' | 'keyoxide';
  hidden?: boolean;
  keytraceVerified?: boolean;
  keytraceClaim?: ExternalAccountKeytraceClaim;
}

export interface FeedItem {
  title: string;
  excerpt: string;
  url: string;
  timestamp: string;
  source: string;
}

export interface PdsProviderInfo {
  name: string;
  host: string;
}

export interface ProfileIndustry {
  industry: string;
  domain?: string;
}

export interface ProfileOverrideSource {
  headline?: string;
  about?: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface Profile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  pronouns?: string;
  headline?: string;
  about?: string;
  hasHeadlineOverride?: boolean;
  hasAboutOverride?: boolean;
  hasDisplayNameOverride?: boolean;
  hasAvatarUrlOverride?: boolean;
  source?: ProfileOverrideSource;
  industries?: ProfileIndustry[];
  location?: LocationValue | null;
  locations?: ProfileLocation[];
  website?: string;
  openTo?: string[];
  preferredWorkplace?: string[];
  availableFromUtc?: number;
  availableToUtc?: number;
  pdsProvider?: PdsProviderInfo | null;
  claimed: boolean;
  isOwnProfile?: boolean;
  createdAt?: string;
  trustStats?: TrustStat[];
  verifiedAccounts?: VerifiedAccount[];
  activeApps?: ActiveApp[];
  blueskyVerified?: boolean;
  blueskyVerifiedAt?: string | null;
  followersCount: number;
  followingCount: number;
  connectionsCount: number;
  atprotoFollowersCount?: number;
  positions: ProfilePosition[];
  education: ProfileEducation[];
  skills: ProfileSkill[];
  certifications?: ProfileCertification[];
  projects?: ProfileProject[];
  publications?: ProfilePublication[];
  volunteering?: ProfileVolunteering[];
  honors?: ProfileHonor[];
  languages?: ProfileLanguage[];
  courses?: ProfileCourse[];
  externalAccounts?: ExternalAccount[];
}
