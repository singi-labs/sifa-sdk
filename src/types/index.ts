export interface LocationValue {
  city?: string;
  /** community.lexicon.location.address field -- preferred over `city`. */
  locality?: string;
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
  hidden?: boolean;
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
  hidden?: boolean;
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
  /** Legacy alias for `locationLocality`; emitted by sifa-api during the additive response window. */
  locationCity?: string | null;
  /** community.lexicon.location.address field name -- prefer over `locationCity`. */
  locationLocality?: string | null;
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
  hidden?: boolean;
}

export interface ProfileProject {
  rkey: string;
  name: string;
  description?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  hidden?: boolean;
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
  /**
   * AT-URI of the parent `site.standard.publication` for Standard.site
   * articles — the subscribable unit. Used to group articles by publication
   * on the profile. Undefined for Sifa/ORCID publications.
   */
  publicationUri?: string | null;
  /** Canonical publication origin — the subscribe / link-out target. */
  publicationUrl?: string | null;
  /** Publication display name for the group header (falls back to host). */
  publicationName?: string | null;
  /**
   * Cover image URL for Standard.site articles — the document's `coverImage`
   * blob (CDN-served), falling back to the article page's og:image. Undefined
   * for Sifa/ORCID publications, null when none could be resolved.
   */
  image?: string | null;
}

export interface ProfileVolunteering {
  rkey: string;
  organization: string;
  role?: string;
  cause?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  hidden?: boolean;
}

export interface ProfileHonor {
  rkey: string;
  title: string;
  issuer?: string;
  date?: string;
  description?: string;
  hidden?: boolean;
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
  hidden?: boolean;
}

export interface ProfileCourse {
  rkey: string;
  name: string;
  institution?: string;
  number?: string;
  /** rkey of the associated certification, resolved from the course's
   * `credential` at-uri. Used to join the course to a certification in the
   * same profile payload (for the linked-credential date and link). */
  credentialRkey?: string;
  hidden?: boolean;
}

/** A related link on a presentation or delivery, as returned by the AppView. */
export interface PresentationLinkView {
  uri: string;
  label?: string;
  type?: string;
}

/** An occasion on which a presentation was delivered (the AppView view-model). */
export interface ProfilePresentationDelivery {
  rkey: string;
  /** rkey of the parent presentation when this delivery references one. */
  presentationRkey?: string | null;
  title?: string | null;
  role?: string | null;
  eventName?: string | null;
  /** Day-only date, YYYY-MM-DD. */
  date?: string | null;
  location?: string | null;
  /** Full community.lexicon.calendar.event mode token. */
  mode?: string | null;
  /** Full community.lexicon.calendar.event status token. */
  status?: string | null;
  links?: PresentationLinkView[];
  /** at-uri of the linked calendar event, when present. */
  eventUri?: string | null;
  hidden?: boolean;
}

/** A reusable presentation with its deliveries grouped underneath (AppView view-model). */
export interface ProfilePresentation {
  rkey: string;
  title: string;
  description?: string | null;
  /** Duration in minutes: a fixed value (min only) or a range. */
  duration?: { minMinutes: number; maxMinutes?: number } | null;
  intendedAudiences?: string[];
  links?: PresentationLinkView[];
  /** at-uri of a long-form write-up (Leaflet / site.standard document). */
  writeupUri?: string | null;
  hidden?: boolean;
  deliveries?: ProfilePresentationDelivery[];
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
  source?: 'sifa' | 'keytrace' | 'keyoxide' | 'marque';
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
  /**
   * Given (first) name from `id.sifa.profile.self.givenName`. Schema.org
   * `Person.givenName`. Optional; absent for users who haven't filled in
   * structured name fields. Consumers wanting a rendered name should use
   * `formatStructuredName(givenName, familyName) ?? displayName ?? handle`.
   */
  givenName?: string;
  /**
   * Family (last) name from `id.sifa.profile.self.familyName`. Schema.org
   * `Person.familyName`. See `givenName` for fallback guidance.
   */
  familyName?: string;
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
  /**
   * @deprecated Flat location field emitted at the response root during the
   * additive response window for `community.lexicon.location.address`.
   * Prefer the structured `locations[]` array (use the entry where
   * `isPrimary` is true).
   */
  locationCountry?: string | null;
  /**
   * @deprecated See `locationCountry`. Prefer `locations[].locationRegion`.
   */
  locationRegion?: string | null;
  /**
   * @deprecated Legacy alias for `locationLocality`; emitted alongside it
   * during the additive response window. Prefer `locations[].locationLocality`.
   */
  locationCity?: string | null;
  /**
   * @deprecated community.lexicon.location.address field name. Prefer
   * `locations[].locationLocality`.
   */
  locationLocality?: string | null;
  /**
   * @deprecated See `locationCountry`. Prefer `locations[].countryCode`.
   */
  countryCode?: string | null;
  website?: string;
  openTo?: string[];
  preferredWorkplace?: string[];
  availableFromUtc?: number;
  availableToUtc?: number;
  pdsProvider?: PdsProviderInfo | null;
  claimed: boolean;
  /**
   * User-set opt-out flag from `id.sifa.profile.self.discoverable`. When
   * `false`, the rendering app emits `noindex` and excludes the page from
   * sitemaps. Absent means default-true (current behavior for existing
   * records that predate this field).
   */
  discoverable?: boolean;
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
  presentations?: ProfilePresentation[];
  presentationDeliveries?: ProfilePresentationDelivery[];
  externalAccounts?: ExternalAccount[];
}
