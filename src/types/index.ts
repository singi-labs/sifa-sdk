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
  /**
   * Optional: omitted for self-employed / freelance / independent positions.
   * The lexicon and the record schema already make company optional.
   */
  company?: string;
  /**
   * Portable org entity identifier (Wikidata/ROR/LEI URI) written when the user
   * picks an organization from the resolver typeahead. Absent for free-text or
   * independent positions (#159).
   */
  entityRef?: string;
  /**
   * Resolved current canonical name of the durably-linked company (#240),
   * computed by the AppView at read time. Render this over `company` for a
   * linked position, so a name correction reaches every linked profile without
   * a PDS write. Absent for free-text or unresolved positions (fall back to
   * `company`).
   */
  entityName?: string;
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
  /**
   * Portable org entity identifier (Wikidata/ROR/LEI URI) written when the user
   * links the institution to a resolved organization (#159/#241). Absent for
   * free-text entries. Mirrors `ProfilePosition.entityRef`; the AppView sends it
   * for display (the "Linked" badge).
   */
  entityRef?: string;
  /**
   * Resolved current canonical name of the durably-linked institution (#252),
   * computed by the AppView at read time. Render this over `institution` for a
   * linked entry, so a name correction reaches every linked profile without a
   * PDS write. Absent for free-text or unresolved entries (fall back to
   * `institution`).
   */
  entityName?: string;
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
  /**
   * Freeform user-defined grouping label nested under `category` (e.g.
   * "Frontend", "Backend"). No known values; renderers decide the display
   * label. See `groupSkillsBySubCategory`.
   */
  subCategory?: string;
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
  /**
   * Issuing organization. The write contract names this field `authority`
   * everywhere (record schema, DB column, PDS record); the AppView read view
   * emits `authority` as the canonical field (#249). Optional during the
   * deprecation window while consumers migrate off the legacy `issuingOrg`
   * alias below.
   */
  authority?: string;
  /**
   * @deprecated Legacy read-view alias for {@link authority} (#249). Carries the
   * same value; will be dropped once web + SDK consumers read `authority`.
   */
  issuingOrg?: string;
  /**
   * Portable org entity identifier (Wikidata/ROR/LEI URI) linking the issuing
   * organization to a resolved entity (#159/#241). Absent for free-text entries.
   * Mirrors `ProfilePosition.entityRef`; the AppView sends it for display.
   */
  entityRef?: string;
  /**
   * Resolved current canonical name of the durably-linked issuing organization
   * (#252), computed by the AppView at read time. Render this over `authority`
   * for a linked entry. Absent for free-text or unresolved entries (fall back to
   * `authority`).
   */
  entityName?: string;
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
  subtitle?: string;
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
  /**
   * Portable org entity identifier (Wikidata/ROR/LEI URI) linking the
   * organization to a resolved entity (#159/#241). Absent for free-text entries.
   * Mirrors `ProfilePosition.entityRef`; the AppView sends it for display.
   */
  entityRef?: string;
  /**
   * Resolved current canonical name of the durably-linked organization (#252),
   * computed by the AppView at read time. Render this over `organization` for a
   * linked entry. Absent for free-text or unresolved entries (fall back to
   * `organization`).
   */
  entityName?: string;
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
  /**
   * Portable org entity identifier (Wikidata/ROR/LEI URI) linking the issuer to a
   * resolved entity (#159/#241). Absent for free-text entries. Mirrors
   * `ProfilePosition.entityRef`; the AppView sends it for display.
   */
  entityRef?: string;
  /**
   * Resolved current canonical name of the durably-linked issuer (#252),
   * computed by the AppView at read time. Render this over `issuer` for a linked
   * entry. Absent for free-text or unresolved entries (fall back to `issuer`).
   */
  entityName?: string;
  date?: string;
  description?: string;
  hidden?: boolean;
}

/**
 * One proof link on an involvement record, as served by the AppView. Mirrors
 * `id.sifa.defs#artifactLink`, plus the computed rung-2 verification signal.
 */
export interface ProfileInvolvementLink {
  url: string;
  kind?: string;
  label?: string;
  /**
   * Rung-2 cross-ref: true when the link host matches one of the owner's
   * *verified* `externalAccount` records (GitHub, GitLab, ORCID, ...).
   * Computed by the AppView; deterministic host match, no new primitive.
   */
  verified?: boolean;
  /**
   * Platform token of the matched verified external account (e.g.
   * `id.sifa.defs#platformGithub`), for the badge label. Absent when
   * `verified` is not true.
   */
  verifiedPlatform?: string;
}

/**
 * An involvement entry as served by the AppView: an `id.sifa.profile.involvement`
 * record, or a mapped legacy `id.sifa.profile.volunteering` record (`legacy`),
 * grouped in the UI by `kind` via the SDK's involvement-kind taxonomy.
 */
export interface ProfileInvolvement {
  rkey: string;
  /** Involvement-kind token; drives the display heading. Legacy rows map to charity. */
  kind: string;
  upstream?: string;
  upstreamDid?: string;
  upstreamUrl?: string;
  role?: string;
  description?: string;
  startedAt?: string;
  endedAt?: string;
  links?: ProfileInvolvementLink[];
  /**
   * Portable org entity identifier (Wikidata/ROR/LEI URI) written when the user
   * picks the upstream from the resolver typeahead. Absent for free-text or
   * one-off involvement.
   */
  entityRef?: string;
  /**
   * Resolved current canonical name of the durably-linked upstream, computed by
   * the AppView at read time. Render over `upstream` when present. Absent for
   * free-text or unresolved entries.
   */
  entityName?: string;
  location?: LocationValue | null;
  skills?: SkillRef[];
  /** Skill records resolved from `skills`, for display. */
  linkedSkills?: ProfileSkill[];
  /**
   * True when this row is a mapped legacy `id.sifa.profile.volunteering` record
   * (no `kind`), rendered under "Volunteering". Editing it backfills to an
   * `involvement` record and deletes the legacy one.
   */
  legacy?: boolean;
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
  /**
   * Portable org entity identifier (Wikidata/ROR/LEI URI) linking the institution
   * to a resolved entity (#159/#241). Absent for free-text entries. Mirrors
   * `ProfilePosition.entityRef`; the AppView sends it for display.
   */
  entityRef?: string;
  /**
   * Resolved current canonical name of the durably-linked institution (#252),
   * computed by the AppView at read time. Render this over `institution` for a
   * linked entry. Absent for free-text or unresolved entries (fall back to
   * `institution`).
   */
  entityName?: string;
  number?: string;
  /** rkey of the associated certification, resolved from the course's
   * `credential` at-uri. Used to join the course to a certification in the
   * same profile payload (for the linked-credential date and link). */
  credentialRkey?: string;
  /** Date the course was completed, as an RFC 3339 datetime. Optional; the
   * editor collects month granularity (YYYY-MM). */
  completedAt?: string;
  hidden?: boolean;
}

/** A related link on a presentation or delivery, as returned by the AppView. */
export interface PresentationLinkView {
  uri: string;
  label?: string;
  type?: string;
}

/**
 * A co-speaker on a delivery, hydrated from a stored DID to a profile card.
 * Any atproto account; `hasSifaProfile` is true when they have a claimed Sifa
 * profile (vs an unclaimed atproto account that still renders at /p/<handle>).
 */
export interface CoSpeaker {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  hasSifaProfile?: boolean;
}

/** An occasion on which a presentation was delivered (the AppView view-model). */
export interface ProfilePresentationDelivery {
  rkey: string;
  /** rkey of the parent presentation when this delivery references one. */
  presentationRkey?: string | null;
  /** Co-speakers at this occasion, hydrated from the stored DIDs. */
  coSpeakers?: CoSpeaker[];
  title?: string | null;
  role?: string | null;
  eventName?: string | null;
  /** Day-only date, YYYY-MM-DD. */
  date?: string | null;
  location?: string | null;
  locationCountry?: string | null;
  locationRegion?: string | null;
  locationLocality?: string | null;
  countryCode?: string | null;
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
  /** Resolved URL of the uploaded cover image, when present. */
  coverImageUrl?: string | null;
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

/**
 * A structured physical address on the org view. Mirrors
 * `community.lexicon.location.address`; every field is optional.
 */
export interface OrgAddressView {
  country: string | null;
  postalCode: string | null;
  region: string | null;
  locality: string | null;
  street: string | null;
  name: string | null;
}

/** A featured link on the org view. Both `name` and `url` are present. */
export interface OrgLinkView {
  name: string;
  url: string;
}

/**
 * The org-profile fields exposed on the profile resolve when the org rendering
 * floor is met. Narrow on purpose: `contact` is never included (not rendered
 * publicly); record URI/CID are internal. Mirrors sifa-api's `OrgProfileView`.
 */
export interface OrgProfileView {
  name: string;
  description: string | null;
  website: string | null;
  /** Blob CID (or resolved URL) of the org logo, when present. */
  logoBlob: string | null;
  entityRefs: string[] | null;
  addresses: OrgAddressView[] | null;
  /** Self-selected headcount range (declared bucket, never calculated). */
  companySize: string | null;
  links: OrgLinkView[] | null;
}

/**
 * A company entity recognized purely from the handle's registrable domain
 * (#160 auto-recognize), independent of any org record. Present on the verdict
 * when `recognized` is true. `domain` is the handle's registrable domain and
 * round-trips through `/c/<domain>`; `publicId` is nullable because entities
 * minted before the public_id backfill have none.
 */
export interface RecognizedEntity {
  publicId: string | null;
  domain: string;
  name: string;
}

/**
 * Server-computed org rendering-floor verdict (#160), carried on the profile
 * resolve so clients need no extra round-trip. Read it via the `useOrgProfile`
 * hook.
 *
 * `isOrg` is the CLAIMED floor: true when the account has an
 * `id.sifa.org.profile` record AND its handle is a custom registrable domain
 * (the authoritative, PSL-backed check lives server-side).
 *
 * `recognized` is INDEPENDENT of `isOrg`: true when the handle's registrable
 * domain resolves to a known, non-suppressed, non-natural-person company entity
 * in Sifa's DB, even with no org record yet (auto-recognize known-company
 * domains). A known company that has not yet claimed is
 * `recognized: true, isOrg: false`; a claimed recognized company is both true.
 * Use it to treat a recognized-but-unclaimed company account as a company
 * (company onboarding, `/c/` routing) before it claims.
 */
export interface OrgFloorVerdict {
  isOrg: boolean;
  orgProfile?: OrgProfileView;
  recognized: boolean;
  /**
   * Invariant (not encoded in the type, matching the flat wire shape the api
   * sends): present whenever `recognized` is true, absent when false. Callers
   * that read it after narrowing on `recognized === true` should still
   * defensively check, since the type does not enforce the pairing.
   */
  recognizedEntity?: RecognizedEntity;
}

export interface Profile {
  did: string;
  handle: string;
  /**
   * Org rendering-floor verdict (#160). Present on the profile resolve; absent
   * on payloads that predate the field. When `org.isOrg` is true the account
   * renders as an organization (`/c/`).
   */
  org?: OrgFloorVerdict;
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
  involvement?: ProfileInvolvement[];
  honors?: ProfileHonor[];
  languages?: ProfileLanguage[];
  courses?: ProfileCourse[];
  presentations?: ProfilePresentation[];
  presentationDeliveries?: ProfilePresentationDelivery[];
  externalAccounts?: ExternalAccount[];
}
