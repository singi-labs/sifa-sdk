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
 * Involvement, talks and courses taken have no JSON Resume key of their own and
 * go into the nearest standard section: involvement next to volunteering, talks
 * as publications of type "Talks", courses as certificates of type "Courses".
 * Strict consumers such as altacv refuse any unknown top-level key, so nothing
 * new is added there. Fields with no reasonable slot -- endorsements, confirmations,
 * investments, courses someone taught -- are dropped. The loss is documented
 * for the user at the point of download.
 */

import { formatLocation, parseLocationString } from '../format/location-utils.js';
import { formatStructuredName } from '../format/pds-utils.js';
import { filterHidden } from '../profile/section-model.js';
import {
  sortCertifications,
  sortEducation,
  sortHonors,
  sortLanguages,
  sortPositions,
  sortProjects,
  sortPublications,
} from '../profile/section-sorts.js';
import { sortByActiveDateRange } from '../profile/range-sort.js';
import { isTeachingCourse } from '../taxonomy/course-role.js';
import { getInvolvementKindLabel } from '../taxonomy/involvement-kind.js';
import { CATEGORY_LABELS } from '../taxonomy/skill-categories.js';
import { groupSkillsByCategory } from '../taxonomy/skill-grouping.js';
import type {
  ExternalAccount,
  LanguageProficiency,
  LocationValue,
  ProfileCertification,
  ProfileCourse,
  ProfileEducation,
  ProfileHonor,
  ProfileInvolvement,
  ProfileLanguage,
  ProfileLocation,
  ProfilePosition,
  ProfilePresentation,
  ProfilePresentationDelivery,
  ProfileProject,
  ProfilePublication,
  ProfileSkill,
  ProfileVolunteering,
} from '../types/index.js';
import { normaliseBaseUrl, profileUrl } from '../jsonld/url.js';
import { normalizeExportContact, type ExportContact } from './export-contact.js';

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
  /**
   * Email, phone and postal address to print. Sifa holds none of these; the
   * owner types them on the export page. Without it the resume has no
   * `email`, `phone` or `location.address`. Personal details in the same object
   * (driver's license, right to work, nationality) are left out: JSON Resume
   * has no field for them, and strict consumers such as altacv refuse a file
   * with an unknown key.
   */
  readonly contact?: ExportContact;
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
  /**
   * The structured location. The profile API sends a display string here
   * instead; the emitter then reads the primary entry of `locations`.
   */
  readonly location?: LocationValue | string | null;
  readonly locations?: ProfileLocation[];
  readonly positions?: ProfilePosition[];
  readonly education?: ProfileEducation[];
  readonly skills?: ProfileSkill[];
  readonly certifications?: ProfileCertification[];
  readonly projects?: ProfileProject[];
  readonly publications?: ProfilePublication[];
  readonly volunteering?: ProfileVolunteering[];
  readonly involvement?: ProfileInvolvement[];
  readonly courses?: ProfileCourse[];
  readonly presentations?: ProfilePresentation[];
  /** Deliveries not tied to a presentation record are listed here only. */
  readonly presentationDeliveries?: ProfilePresentationDelivery[];
  readonly honors?: ProfileHonor[];
  readonly languages?: ProfileLanguage[];
  readonly externalAccounts?: ExternalAccount[];
}

export interface JsonResumeLocation {
  /** Street address; lines are separated by `\n`, as the schema asks. */
  readonly address?: string;
  readonly city?: string;
  readonly region?: string;
  readonly countryCode?: string;
  readonly postalCode?: string;
}

export interface JsonResumeProfileLink {
  readonly network: string;
  readonly username?: string;
  readonly url?: string;
}

export interface JsonResumeBasics {
  readonly name: string;
  readonly label?: string;
  readonly image?: string;
  readonly url?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly summary?: string;
  readonly location?: JsonResumeLocation;
  readonly profiles?: JsonResumeProfileLink[];
}

export interface JsonResumeWork {
  readonly name?: string;
  readonly position: string;
  /** The position's location as one display line ("Kyiv, Ukraine"). */
  readonly location?: string;
  readonly summary?: string;
  readonly startDate?: string;
  readonly endDate?: string;
}

export interface JsonResumeVolunteer {
  /**
   * Omitted when the record carries no organization name at all. Emitting an
   * empty string would render as a blank organization line in a CV template.
   */
  readonly organization?: string;
  readonly position?: string;
  readonly summary?: string;
  readonly startDate?: string;
  readonly endDate?: string;
}

export interface JsonResumeEducation {
  /** Omitted when the record carries no institution name. See volunteer. */
  readonly institution?: string;
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
  /** Expiry date. Not in the JSON Resume schema, which allows extra fields. */
  readonly endDate?: string;
  readonly issuer?: string;
  readonly url?: string;
  /**
   * "Courses" for a course taken, which has no JSON Resume section of its own.
   * Not in the JSON Resume schema, which allows extra fields; sifa-api's
   * typeset CV lists these under their own "Courses" heading.
   */
  readonly type?: string;
  /** A course's number ("CTFL-01"). Not in the schema either; see `type`. */
  readonly number?: string;
}

export interface JsonResumePublication {
  readonly name: string;
  readonly publisher?: string;
  readonly releaseDate?: string;
  readonly url?: string;
  readonly summary?: string;
  /**
   * "Talks" for a talk. Not in the JSON Resume schema, which allows extra
   * fields; CV templates such as altacv group publications by it.
   */
  readonly type?: string;
}

/** A skill category, with the skills in it as keywords. */
export interface JsonResumeSkill {
  readonly name: string;
  readonly keywords: string[];
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

/** Adds the owner's street address to the profile's location. */
function withAddress(
  location: JsonResumeLocation | undefined,
  address: string | undefined,
): JsonResumeLocation | undefined {
  return address ? { address, ...location } : location;
}

/** Omits the key entirely when the mapped list came out empty. */
function section<K extends string, T>(key: K, items: T[]): Record<K, T[]> | undefined {
  return items.length > 0 ? ({ [key]: items } as Record<K, T[]>) : undefined;
}

/**
 * The first of these that yields anything: the structured `location` object;
 * the primary entry of `locations` (or the first entry when none is marked
 * primary), which is what the profile API sends; a display-string `location`,
 * split into city and region. JSON Resume has no field for a country name, so a
 * country-only location maps to nothing.
 */
function mapLocation(
  profile: Pick<JsonResumeProfileInput, 'location' | 'locations'>,
  s: Sanitizer,
): JsonResumeLocation | undefined {
  const fromValue = (location: LocationValue | null | undefined) =>
    location
      ? compact<JsonResumeLocation>({
          city: text(location.locality || location.city, s),
          region: text(location.region, s),
          countryCode: text(location.countryCode, s),
          postalCode: text(location.postalCode, s),
        })
      : {};
  const entry = profile.locations?.find((l) => l.isPrimary) ?? profile.locations?.[0];
  const candidates: JsonResumeLocation[] = [
    typeof profile.location === 'object' ? fromValue(profile.location) : {},
    entry
      ? compact<JsonResumeLocation>({
          city: text((entry.locationLocality || entry.locationCity) ?? undefined, s),
          region: text(entry.locationRegion ?? undefined, s),
          countryCode: text(entry.countryCode ?? undefined, s),
        })
      : {},
    typeof profile.location === 'string' ? fromValue(parseLocationString(profile.location)) : {},
  ];
  return candidates.find((c) => Object.keys(c).length > 0);
}

/**
 * A link field as a valid URI. A bare domain ("example.com") gets `https://`;
 * anything else that does not parse is left out. JSON Resume declares these as
 * URIs, and strict consumers such as altacv refuse the whole file otherwise.
 */
function link(value: string | undefined, s: Sanitizer): string | undefined {
  // No whitespace belongs in a link; a pasted space made altacv refuse a real
  // ORCID URL that the URL parser itself accepts.
  const t = value?.replace(/\s+/g, '');
  if (!t) return undefined;
  // Checked before sanitizing, so the sanitizer still sees every value.
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(t)) return URL.canParse(t) ? s(t) : undefined;
  const withScheme = `https://${t}`;
  return /^[^\s/]+\.[^\s/]+/.test(t) && URL.canParse(withScheme) ? s(withScheme) : undefined;
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

/** Event names a talk shows: the most recent ones, then how many more. */
const TALK_EVENTS_SHOWN = 3;

/** Newest first; undated last. */
function byDateDesc(a: { date?: string | null }, b: { date?: string | null }): number {
  return (b.date ?? '').localeCompare(a.date ?? '');
}

/**
 * Talks as publications of type "Talks": one per talk, with the events it was
 * given at (newest first) as the publisher and the latest date. A delivery not
 * tied to a talk record is a talk of its own. Newest first.
 */
function mapTalks(profile: JsonResumeProfileInput, s: Sanitizer): JsonResumePublication[] {
  const standalone = filterHidden(profile.presentationDeliveries).filter(
    (d) => !d.presentationRkey,
  );
  const talks = filterHidden(profile.presentations).map((talk) => {
    const deliveries = filterHidden(talk.deliveries).sort(byDateDesc);
    const events = [
      ...new Set(deliveries.map((d) => text(d.eventName ?? undefined, s)).filter(Boolean)),
    ] as string[];
    const shown = events.slice(0, TALK_EVENTS_SHOWN).join(', ');
    const more = events.length - TALK_EVENTS_SHOWN;
    return compact<JsonResumePublication>({
      name: s(talk.title),
      publisher: more > 0 ? `${shown} and ${more} more` : shown || undefined,
      releaseDate: toResumeDate(deliveries[0]?.date ?? undefined),
      url: link(talk.links?.[0]?.uri, s),
      summary: text(talk.description ?? undefined, s),
      type: 'Talks',
    });
  });
  const loose = standalone.map((d) =>
    compact<JsonResumePublication>({
      name: s(d.title?.trim() || d.eventName?.trim() || ''),
      publisher: text(d.eventName ?? undefined, s),
      releaseDate: toResumeDate(d.date ?? undefined),
      url: link(d.links?.[0]?.uri, s),
      type: 'Talks',
    }),
  );
  return [...talks, ...loose]
    .filter((t) => t.name)
    .sort((a, b) => byDateDesc({ date: a.releaseDate }, { date: b.releaseDate }));
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
  const contact = normalizeExportContact(options.contact ?? {});

  const name =
    formatStructuredName(profile.givenName, profile.familyName) ??
    text(profile.displayName, s) ??
    profile.handle;

  const profiles = filterHidden(profile.externalAccounts).map((account) =>
    compact<JsonResumeProfileLink>({
      network: s(account.platform),
      username: text(account.label, s),
      url: link(account.url, s),
    }),
  );

  const basics = compact<JsonResumeBasics>({
    name,
    label: text(profile.headline, s),
    image: text(profile.avatar, s),
    email: text(contact.email, s),
    phone: text(contact.phone, s),
    url: link(profile.website, s) ?? canonical,
    summary: text(profile.about, s),
    location: withAddress(mapLocation(profile, s), text(contact.address, s)),
    ...section('profiles', profiles),
  });

  // Same order as the profile page and the other exports: newest first.
  const work = sortPositions(filterHidden(profile.positions)).map((position) =>
    compact<JsonResumeWork>({
      name: orgName(position.entityName, position.company, s),
      position: s(position.title),
      location: text(formatLocation(position.location), s),
      summary: text(position.description, s),
      startDate: toResumeDate(position.startedAt),
      endDate: toResumeDate(position.endedAt),
    }),
  );

  // Involvement (open source, communities, civic roles) has no JSON Resume key
  // and sits next to volunteering, sorted together. The profile API also lists
  // each legacy volunteering record in `involvement`, marked `legacy` and under
  // the same rkey; that copy is left out when `volunteering` lists the record
  // as visible, since that copy also has the resolved organization name.
  const volunteeringRkeys = new Set(filterHidden(profile.volunteering).map((v) => v.rkey));
  const involvement = filterHidden(profile.involvement).filter(
    (entry) => !(entry.legacy && volunteeringRkeys.has(entry.rkey)),
  );
  const volunteer = sortByActiveDateRange([
    ...filterHidden(profile.volunteering).map((entry) => ({
      organization: orgName(entry.entityName, entry.organization, s),
      position: text(entry.role, s),
      summary: text(entry.description, s),
      startDate: toResumeDate(entry.startDate),
      endDate: toResumeDate(entry.endDate),
    })),
    ...involvement.map((entry) => ({
      organization: orgName(entry.entityName, entry.upstream, s),
      position: text(entry.role, s) ?? text(getInvolvementKindLabel(entry.kind), s),
      summary: text(entry.description, s),
      startDate: toResumeDate(entry.startedAt),
      endDate: toResumeDate(entry.endedAt),
    })),
  ]).map((entry) => compact<JsonResumeVolunteer>(entry));

  const education = sortEducation(filterHidden(profile.education)).map((entry) =>
    compact<JsonResumeEducation>({
      institution: orgName(entry.entityName, entry.institution, s),
      area: text(entry.fieldOfStudy, s),
      studyType: text(entry.degree, s),
      startDate: toResumeDate(entry.startedAt),
      endDate: toResumeDate(entry.endedAt),
    }),
  );

  const awards = sortHonors(filterHidden(profile.honors)).map((honor) =>
    compact<JsonResumeAward>({
      title: s(honor.title),
      date: toResumeDate(honor.date),
      awarder: orgName(honor.entityName, honor.issuer, s),
      summary: text(honor.description, s),
    }),
  );

  const certificates = sortCertifications(filterHidden(profile.certifications)).map((cert) =>
    compact<JsonResumeCertificate>({
      name: s(cert.name),
      date: toResumeDate(cert.issueDate),
      endDate: toResumeDate(cert.expiryDate),
      // `issuingOrg` is the deprecated read-view alias for `authority`; records
      // indexed before the rename carry only the alias.
      issuer: orgName(cert.entityName, cert.authority ?? cert.issuingOrg, s),
      url: link(cert.credentialUrl, s),
    }),
  );
  // Courses taken, after the certifications, marked as courses. A course whose
  // credential is already listed as a certification would print twice, and
  // courses someone taught are not certificates.
  const listedCredentials = new Set(filterHidden(profile.certifications).map((c) => c.rkey));
  for (const course of filterHidden(profile.courses)) {
    if (isTeachingCourse(course)) continue;
    if (course.credentialRkey && listedCredentials.has(course.credentialRkey)) continue;
    certificates.push(
      compact<JsonResumeCertificate>({
        name: s(course.name),
        date: toResumeDate(course.completedAt),
        issuer: orgName(course.entityName, course.institution, s),
        number: text(course.number, s),
        type: 'Courses',
      }),
    );
  }

  const publications = sortPublications(filterHidden(profile.publications)).map((publication) =>
    compact<JsonResumePublication>({
      name: s(publication.title),
      publisher: text(publication.publisher, s),
      releaseDate: toResumeDate(publication.date),
      url: link(publication.url, s),
      summary: text(publication.description, s),
    }),
  );
  publications.push(...mapTalks(profile, s));

  // JSON Resume's grouped shape: one group per category, in the profile's
  // category order, named as the profile names it. CV templates print the
  // group name as a label. Endorsement counts have no slot and are dropped.
  // Skill records carry no `hidden` flag, so there is nothing to filter here.
  const skills = groupSkillsByCategory(profile.skills ?? []).map(([category, items]) => ({
    name: CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category,
    keywords: items.map((skill) => s(skill.name)),
  }));

  const languages = sortLanguages(filterHidden(profile.languages)).map((language) =>
    compact<JsonResumeLanguage>({
      language: s(language.language),
      fluency: language.proficiency ? FLUENCY_LABELS[language.proficiency] : undefined,
    }),
  );

  const projects = sortProjects(filterHidden(profile.projects)).map((project) =>
    compact<JsonResumeProject>({
      name: s(project.name),
      description: text(project.description, s),
      url: link(project.url, s),
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
