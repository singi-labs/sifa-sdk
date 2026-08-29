/**
 * JSON Resume v1.0.0 emitter for a Sifa profile.
 *
 * https://jsonresume.org/schema/
 *
 * One pure function, no fetching, no DOM, no framework -- the same shape as the
 * JSON-LD emitter next door, and for the same reason: sifa.id, page.sifa.id and
 * any future consumer should emit one document from one implementation.
 *
 * Why this format earns its place: it is the lingua franca of CV tooling, so
 * emitting it hands a user every JSON Resume theme, and the Typst CV templates
 * on Typst Universe, without Sifa writing a renderer for any of them.
 *
 * Fields Sifa holds that JSON Resume has no slot for -- endorsements,
 * confirmations, involvement, investments, presentations, courses -- are
 * dropped rather than smuggled into a nearby field. The loss is documented for
 * the user at the point of download.
 */

import { formatStructuredName } from '../format/pds-utils.js';
import { filterHidden } from '../profile/section-model.js';
import type {
  ExternalAccount,
  LanguageProficiency,
  LocationValue,
  ProfileCertification,
  ProfileEducation,
  ProfileHonor,
  ProfileLanguage,
  ProfilePosition,
  ProfileProject,
  ProfilePublication,
  ProfileSkill,
  ProfileVolunteering,
} from '../types/index.js';
import { normaliseBaseUrl, profileUrl } from '../jsonld/url.js';

export type Sanitizer = (input: string) => string;

export interface JsonResumeOptions {
  /** Canonical origin for the profile URL. Defaults to `https://sifa.id`. */
  readonly baseUrl?: string;
  /** Applied to every user-authored string. Defaults to identity. */
  readonly sanitize?: Sanitizer;
  /**
   * Absolute URL of the profile this resume describes. Defaults to
   * `${baseUrl}/p/${handle}`. A personal site served from a custom domain is
   * not at that path.
   */
  readonly canonicalUrl?: string;
}

/**
 * The subset of `Profile` this emitter reads. Deliberately structural rather
 * than the full `Profile`, so a caller holding a partially hydrated profile --
 * or a test -- does not have to invent forty unrelated fields.
 */
export interface JsonResumeProfileInput {
  readonly handle: string;
  readonly displayName?: string;
  readonly givenName?: string;
  readonly familyName?: string;
  readonly avatar?: string;
  readonly headline?: string;
  readonly about?: string;
  readonly website?: string;
  readonly location?: LocationValue | null;
  readonly positions?: ProfilePosition[];
  readonly education?: ProfileEducation[];
  readonly skills?: ProfileSkill[];
  readonly certifications?: ProfileCertification[];
  readonly projects?: ProfileProject[];
  readonly publications?: ProfilePublication[];
  readonly volunteering?: ProfileVolunteering[];
  readonly honors?: ProfileHonor[];
  readonly languages?: ProfileLanguage[];
  readonly externalAccounts?: ExternalAccount[];
}

export interface JsonResumeLocation {
  readonly city?: string;
  readonly region?: string;
  readonly countryCode?: string;
  readonly postalCode?: string;
}

export interface JsonResumeProfileLink {
  readonly network: string;
  readonly username?: string;
  readonly url: string;
}

export interface JsonResumeBasics {
  readonly name: string;
  readonly label?: string;
  readonly image?: string;
  readonly url?: string;
  readonly summary?: string;
  readonly location?: JsonResumeLocation;
  readonly profiles?: JsonResumeProfileLink[];
}

export interface JsonResumeWork {
  readonly name?: string;
  readonly position: string;
  readonly summary?: string;
  readonly startDate?: string;
  readonly endDate?: string;
}

export interface JsonResumeVolunteer {
  readonly organization: string;
  readonly position?: string;
  readonly summary?: string;
  readonly startDate?: string;
  readonly endDate?: string;
}

export interface JsonResumeEducation {
  readonly institution: string;
  readonly area?: string;
  readonly studyType?: string;
  readonly startDate?: string;
  readonly endDate?: string;
}

export interface JsonResumeAward {
  readonly title: string;
  readonly date?: string;
  readonly awarder?: string;
  readonly summary?: string;
}

export interface JsonResumeCertificate {
  readonly name: string;
  readonly date?: string;
  readonly issuer?: string;
  readonly url?: string;
}

export interface JsonResumePublication {
  readonly name: string;
  readonly publisher?: string;
  readonly releaseDate?: string;
  readonly url?: string;
  readonly summary?: string;
}

export interface JsonResumeSkill {
  readonly name: string;
}

export interface JsonResumeLanguage {
  readonly language: string;
  readonly fluency?: string;
}

export interface JsonResumeProject {
  readonly name: string;
  readonly description?: string;
  readonly url?: string;
  readonly startDate?: string;
  readonly endDate?: string;
}

export interface JsonResumeMeta {
  readonly canonical: string;
  readonly version: string;
  readonly lastModified?: string;
}

export interface JsonResume {
  readonly basics?: JsonResumeBasics;
  readonly work?: JsonResumeWork[];
  readonly volunteer?: JsonResumeVolunteer[];
  readonly education?: JsonResumeEducation[];
  readonly awards?: JsonResumeAward[];
  readonly certificates?: JsonResumeCertificate[];
  readonly publications?: JsonResumePublication[];
  readonly skills?: JsonResumeSkill[];
  readonly languages?: JsonResumeLanguage[];
  readonly projects?: JsonResumeProject[];
  readonly meta?: JsonResumeMeta;
}

/** Schema version this emitter targets, as JSON Resume writes it in `meta`. */
const SCHEMA_VERSION = 'v1.0.0';

/**
 * A date JSON Resume will accept: `YYYY`, `YYYY-MM` or `YYYY-MM-DD`. Sifa
 * stores RFC 3339 for some fields, and a full timestamp pasted into a CV
 * template renders as `2020-03-04T00:00:00.000Z` on the page.
 */
const RESUME_DATE_RE = /^(\d{4})(-\d{2})?(-\d{2})?/;

export function toResumeDate(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const match = RESUME_DATE_RE.exec(trimmed);
  return match ? match[0] : undefined;
}

/**
 * JSON Resume's `fluency` is free text, so these are display labels rather
 * than a mapped vocabulary. Kept in one place so export and a future import
 * agree on the spelling.
 */
const FLUENCY_LABELS: Record<LanguageProficiency, string> = {
  elementary: 'Elementary',
  limited_working: 'Limited working',
  professional_working: 'Professional working',
  full_professional: 'Full professional',
  native: 'Native or bilingual',
};

const identity: Sanitizer = (input) => input;

/** Drops keys whose value is undefined, so the document carries no empty slots. */
function compact<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

/** Omits the key entirely when the mapped list came out empty. */
function section<K extends string, T>(key: K, items: T[]): Record<K, T[]> | undefined {
  return items.length > 0 ? ({ [key]: items } as Record<K, T[]>) : undefined;
}

function mapLocation(
  location: LocationValue | null | undefined,
  s: Sanitizer,
): JsonResumeLocation | undefined {
  if (!location) return undefined;
  const mapped = compact({
    city: text(location.locality ?? location.city, s),
    region: text(location.region, s),
    countryCode: text(location.countryCode, s),
    postalCode: text(location.postalCode, s),
  });
  return Object.keys(mapped).length > 0 ? mapped : undefined;
}

/** Trimmed, sanitised, and undefined when there is nothing left. */
function text(value: string | undefined, s: Sanitizer): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? s(trimmed) : undefined;
}

/**
 * The name to print for a linked organization. `entityName` is the AppView's
 * resolved current name and wins when present, matching how the profile itself
 * renders these.
 */
function orgName(
  entityName: string | undefined,
  stored: string | undefined,
  s: Sanitizer,
): string | undefined {
  return text(entityName, s) ?? text(stored, s);
}

/**
 * Build a JSON Resume v1.0.0 document from a Sifa profile.
 *
 * Hidden records are dropped. Keys are omitted rather than emitted empty, so a
 * profile with no publications produces a document with no `publications` key
 * instead of one a reader has to interpret.
 */
export function profileToJsonResume(
  profile: JsonResumeProfileInput,
  options: JsonResumeOptions = {},
): JsonResume {
  const s = options.sanitize ?? identity;
  const baseUrl = normaliseBaseUrl(options.baseUrl);
  const canonical = options.canonicalUrl ?? profileUrl(baseUrl, profile.handle);

  const name =
    formatStructuredName(profile.givenName, profile.familyName) ??
    text(profile.displayName, s) ??
    profile.handle;

  const profiles = filterHidden(profile.externalAccounts).map((account) =>
    compact<JsonResumeProfileLink>({
      network: s(account.platform),
      username: text(account.label, s),
      url: account.url,
    }),
  );

  const basics = compact<JsonResumeBasics>({
    name,
    label: text(profile.headline, s),
    image: profile.avatar,
    url: text(profile.website, s) ?? canonical,
    summary: text(profile.about, s),
    location: mapLocation(profile.location, s),
    ...section('profiles', profiles),
  });

  const work = filterHidden(profile.positions).map((position) =>
    compact<JsonResumeWork>({
      name: orgName(position.entityName, position.company, s),
      position: s(position.title),
      summary: text(position.description, s),
      startDate: toResumeDate(position.startedAt),
      endDate: toResumeDate(position.endedAt),
    }),
  );

  const volunteer = filterHidden(profile.volunteering).map((entry) =>
    compact<JsonResumeVolunteer>({
      organization: orgName(entry.entityName, entry.organization, s) ?? '',
      position: text(entry.role, s),
      summary: text(entry.description, s),
      startDate: toResumeDate(entry.startDate),
      endDate: toResumeDate(entry.endDate),
    }),
  );

  const education = filterHidden(profile.education).map((entry) =>
    compact<JsonResumeEducation>({
      institution: orgName(entry.entityName, entry.institution, s) ?? '',
      area: text(entry.fieldOfStudy, s),
      studyType: text(entry.degree, s),
      startDate: toResumeDate(entry.startedAt),
      endDate: toResumeDate(entry.endedAt),
    }),
  );

  const awards = filterHidden(profile.honors).map((honor) =>
    compact<JsonResumeAward>({
      title: s(honor.title),
      date: toResumeDate(honor.date),
      awarder: orgName(honor.entityName, honor.issuer, s),
      summary: text(honor.description, s),
    }),
  );

  const certificates = filterHidden(profile.certifications).map((cert) =>
    compact<JsonResumeCertificate>({
      name: s(cert.name),
      date: toResumeDate(cert.issueDate),
      // `issuingOrg` is the deprecated read-view alias for `authority`; records
      // indexed before the rename carry only the alias.
      issuer: orgName(cert.entityName, cert.authority ?? cert.issuingOrg, s),
      url: text(cert.credentialUrl, s),
    }),
  );

  const publications = filterHidden(profile.publications).map((publication) =>
    compact<JsonResumePublication>({
      name: s(publication.title),
      publisher: text(publication.publisher, s),
      releaseDate: toResumeDate(publication.date),
      url: text(publication.url, s),
      summary: text(publication.description, s),
    }),
  );

  // One entry per skill rather than JSON Resume's grouped shape: Sifa stores one
  // record per skill, and keeping the two symmetric is what makes a round-trip
  // through a third-party editor safe. Category and endorsement counts have no
  // JSON Resume slot and are dropped. Skill records carry no `hidden` flag, so
  // there is nothing to filter here.
  const skills = (profile.skills ?? []).map((skill) => ({ name: s(skill.name) }));

  const languages = filterHidden(profile.languages).map((language) =>
    compact<JsonResumeLanguage>({
      language: s(language.language),
      fluency: language.proficiency ? FLUENCY_LABELS[language.proficiency] : undefined,
    }),
  );

  const projects = filterHidden(profile.projects).map((project) =>
    compact<JsonResumeProject>({
      name: s(project.name),
      description: text(project.description, s),
      url: text(project.url, s),
      startDate: toResumeDate(project.startDate),
      endDate: toResumeDate(project.endDate),
    }),
  );

  return {
    basics,
    ...section('work', work),
    ...section('volunteer', volunteer),
    ...section('education', education),
    ...section('awards', awards),
    ...section('certificates', certificates),
    ...section('publications', publications),
    ...section('skills', skills),
    ...section('languages', languages),
    ...section('projects', projects),
    meta: { canonical, version: SCHEMA_VERSION },
  };
}
