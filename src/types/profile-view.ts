/**
 * Types for the `id.sifa.getProfileView` XRPC query: the aggregated public
 * professional profile view served by a Sifa AppView. This is a curated public
 * projection, viewer-specific and internal fields are not included and hidden
 * items are omitted. Mirrors the `id.sifa.getProfileView` lexicon in
 * @singi-labs/sifa-lexicons.
 */

import type { PresentationLinkView, PdsProviderInfo } from './index.js';

export type { PresentationLinkView, PdsProviderInfo };

export interface IndustryDomain {
  industry: string;
  domain?: string;
}

export interface ProfileLocationView {
  rkey: string;
  type?: string;
  label?: string;
  isPrimary?: boolean;
  locationCountry?: string;
  locationRegion?: string;
  locationLocality?: string;
  countryCode?: string;
  location?: string;
}

export interface PositionView {
  rkey: string;
  title: string;
  company?: string;
  companyDid?: string;
  entityRef?: string;
  entityName?: string;
  description?: string;
  employmentType?: string;
  workplaceType?: string;
  locationCountry?: string;
  locationRegion?: string;
  locationLocality?: string;
  countryCode?: string;
  location?: string;
  startedAt?: string;
  endedAt?: string;
  primary?: boolean;
  skillRkeys?: string[];
}

export interface EducationView {
  rkey: string;
  institution?: string;
  institutionDid?: string;
  entityRef?: string;
  degree?: string;
  fieldOfStudy?: string;
  activities?: string;
  description?: string;
  startedAt?: string;
  endedAt?: string;
}

export interface SkillView {
  rkey: string;
  name: string;
  category?: string;
  /** Freeform user-defined grouping label nested under `category` (#305). */
  subCategory?: string;
  positionRkeys?: string[];
}

export interface CertificationView {
  rkey: string;
  name: string;
  issuingOrg?: string;
  entityRef?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialUrl?: string;
}

export interface ProjectView {
  rkey: string;
  name: string;
  description?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  members?: ProjectMemberView[];
  /** AT-URI of the same project as recorded elsewhere, when this entry duplicates another. */
  /** AT-URI of the same record on another person's profile, when they keep one. */
  sameAs?: string;
}

/** A person named as a member of a project. Identity fields appear only once confirmed. */
export interface ProjectMemberView {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  confirmed?: boolean;
  confirmedStale?: boolean;
  role?: string;
  title?: string;
}

export interface VolunteeringView {
  rkey: string;
  organization: string;
  entityRef?: string;
  role?: string;
  cause?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface InvolvementLinkView {
  url: string;
  kind?: string;
  label?: string;
  verified?: boolean;
  verifiedPlatform?: string;
}

export interface InvolvementView {
  rkey: string;
  kind?: string;
  upstream?: string;
  upstreamDid?: string;
  upstreamUrl?: string;
  role?: string;
  description?: string;
  startedAt?: string;
  endedAt?: string;
  links: InvolvementLinkView[];
  legacy: boolean;
}

export interface ContributorView {
  name: string;
  orcidId?: string;
  did?: string;
  handle?: string;
}

export interface PublicationView {
  rkey: string;
  title: string;
  subtitle?: string;
  publisher?: string;
  date?: string;
  url?: string;
  description?: string;
  doi?: string;
  type?: string;
  typeLabel?: string;
  contributors?: ContributorView[];
  verified: boolean;
  verifiedVia?: string;
  orcidCorroborated?: boolean;
  publicationUri?: string;
  publicationUrl?: string;
  publicationName?: string;
  image?: string;
}

export interface CourseView {
  rkey: string;
  name: string;
  number?: string;
  institution?: string;
  entityRef?: string;
  credentialRkey?: string;
}

export interface DurationView {
  minMinutes: number;
  maxMinutes?: number;
}

/**
 * A co-speaker on a presentation delivery.
 *
 * `displayName` and `avatar` are served only once `confirmed` is true. The
 * lexicon also declares an unlinked free-text `name`, which the AppView has
 * never emitted -- the record field is `format: did`, so there is nothing to
 * emit it from.
 */
export interface CoSpeakerView {
  did?: string;
  handle?: string;
  displayName?: string;
  avatar?: string;
  hasSifaProfile?: boolean;
  confirmed?: boolean;
  confirmedStale?: boolean;
  name?: string;
}

export interface PresentationDeliveryView {
  rkey: string;
  presentationRkey?: string;
  title?: string;
  role?: string;
  eventName?: string;
  date?: string;
  location?: string;
  locationCountry?: string;
  locationRegion?: string;
  locationLocality?: string;
  countryCode?: string;
  mode?: string;
  status?: string;
  links?: PresentationLinkView[];
  eventUri?: string;
  coSpeakers?: CoSpeakerView[];
  /** AT-URI of the same session as recorded on another person's profile. */
  sameAs?: string;
}

export interface PresentationView {
  rkey: string;
  title: string;
  description?: string;
  duration?: DurationView;
  intendedAudiences?: string[];
  links?: PresentationLinkView[];
  writeupUri?: string;
  coverImageUrl?: string;
  deliveries: PresentationDeliveryView[];
}

export interface HonorView {
  rkey: string;
  title: string;
  issuer?: string;
  entityRef?: string;
  description?: string;
  date?: string;
}

export interface LanguageView {
  rkey: string;
  language: string;
  proficiency?: string;
}

export interface ExternalAccountView {
  rkey: string;
  platform?: string;
  url: string;
  label?: string;
  feedUrl?: string;
  verifiable?: boolean;
  verified?: boolean;
  verifiedVia?: string;
  primary?: boolean;
}

export interface ActiveAppView {
  id: string;
  name: string;
  category?: string;
  recentCount?: number;
  latestRecordAt?: string;
}

export interface AtfundLinkView {
  url: string;
  label?: string;
}

/** Aggregated public professional profile view (`id.sifa.getProfileView#profileView`). */
export interface ProfileView {
  did: string;
  handle: string;
  displayName?: string;
  givenName?: string;
  familyName?: string;
  avatar?: string;
  pronouns?: string;
  headline?: string;
  about?: string;
  industries?: IndustryDomain[];
  locationCountry?: string;
  locationRegion?: string;
  locationLocality?: string;
  countryCode?: string;
  location?: string;
  locations?: ProfileLocationView[];
  website?: string;
  openTo?: string[];
  preferredWorkplace?: string[];
  availableFromUtc?: number;
  availableToUtc?: number;
  langs?: string[];
  createdAt?: string;
  positions?: PositionView[];
  education?: EducationView[];
  skills?: SkillView[];
  certifications?: CertificationView[];
  projects?: ProjectView[];
  volunteering?: VolunteeringView[];
  involvement?: InvolvementView[];
  publications?: PublicationView[];
  courses?: CourseView[];
  presentations?: PresentationView[];
  presentationDeliveries?: PresentationDeliveryView[];
  honors?: HonorView[];
  languages?: LanguageView[];
  externalAccounts?: ExternalAccountView[];
  atfundContribute?: AtfundLinkView;
  followersCount?: number;
  followingCount?: number;
  connectionsCount?: number;
  metInPersonCount?: number;
  atprotoFollowersCount?: number;
  blueskyVerified?: boolean;
  blueskyVerifiedAt?: string;
  activeApps?: ActiveAppView[];
  pdsProvider?: PdsProviderInfo;
  claimed?: boolean;
}
