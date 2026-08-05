/**
 * Schema.org JSON-LD for the things a person made: talks, publications,
 * courses and projects.
 *
 * These collections carried no structured data before this module existed;
 * a talk page emitted a four-property `CreativeWork` and publications,
 * courses and projects emitted nothing at all. Term choices are recorded in
 * `./terms.js`.
 */

import { buildTalkSlug } from '../format/talk-slug.js';
import { filterHidden } from '../profile/section-model.js';
import { normaliseBaseUrl, profileUrl } from './url.js';

const DOI_RESOLVER = 'https://doi.org/';
const ORCID_RESOLVER = 'https://orcid.org/';

export interface WorksOptions {
  readonly baseUrl?: string;
  readonly sanitize?: (input: string) => string;
}

/** Minimal identity for the profile owner a work is attributed to. */
export interface WorkAuthor {
  readonly handle: string;
  readonly displayName?: string;
}

/**
 * A person named on somebody else's record. `confirmed` is load bearing: an
 * unconfirmed claim is a claim, not a fact, and must never be laundered into
 * structured data as a schema.org Person.
 */
interface NamedActor {
  readonly did?: string;
  readonly handle?: string;
  readonly displayName?: string;
  readonly confirmed?: boolean;
}

interface PersonNode {
  readonly '@type': 'Person';
  readonly name: string;
  readonly url?: string;
  readonly sameAs?: string[];
}

const identity = (input: string) => input;

function authorNode(author: WorkAuthor, baseUrl: string, s: (v: string) => string): PersonNode {
  return {
    '@type': 'Person',
    name: s(author.displayName ?? author.handle),
    url: profileUrl(baseUrl, author.handle),
  };
}

/**
 * Confirmed named actors only, mapped to Person nodes. Anyone unconfirmed is
 * dropped entirely rather than degraded to a bare handle, because even a handle
 * in structured data asserts the association.
 */
function confirmedActorNodes(
  actors: readonly NamedActor[] | undefined,
  baseUrl: string,
  s: (v: string) => string,
): PersonNode[] {
  return (actors ?? [])
    .filter((a) => a.confirmed === true && Boolean(a.handle))
    .map((a) => ({
      '@type': 'Person' as const,
      name: s(a.displayName ?? a.handle!),
      url: profileUrl(baseUrl, a.handle!),
    }));
}

/** `filterHidden` takes a mutable array; inputs here are readonly. */
function visible<T extends { hidden?: boolean }>(items: readonly T[] | undefined): T[] {
  return filterHidden(items ? [...items] : undefined);
}

// ---------------------------------------------------------------------------
// Presentations
// ---------------------------------------------------------------------------

/**
 * The community calendar known values are already one-to-one with the
 * schema.org enumerations. An unrecognised value is left off rather than
 * guessed: a wrong attendance mode is worse than a missing one.
 */
const ATTENDANCE_MODE: Readonly<Record<string, string>> = {
  'community.lexicon.calendar.event#inperson': 'https://schema.org/OfflineEventAttendanceMode',
  'community.lexicon.calendar.event#virtual': 'https://schema.org/OnlineEventAttendanceMode',
  'community.lexicon.calendar.event#hybrid': 'https://schema.org/MixedEventAttendanceMode',
};

/**
 * `#planned` is intentionally absent: schema.org has no equivalent, and mapping
 * it to EventScheduled would assert a commitment the record does not make.
 */
const EVENT_STATUS: Readonly<Record<string, string>> = {
  'community.lexicon.calendar.event#scheduled': 'https://schema.org/EventScheduled',
  'community.lexicon.calendar.event#cancelled': 'https://schema.org/EventCancelled',
  'community.lexicon.calendar.event#postponed': 'https://schema.org/EventPostponed',
  'community.lexicon.calendar.event#rescheduled': 'https://schema.org/EventRescheduled',
};

const LINK_SLIDES = 'id.sifa.defs#linkSlides';
const LINK_RECORDING = 'id.sifa.defs#linkRecording';

export interface PresentationLinkInput {
  readonly uri: string;
  readonly label?: string;
  readonly type?: string;
}

export interface PresentationDeliveryInput {
  readonly rkey: string;
  readonly title?: string | null;
  readonly role?: string | null;
  readonly eventName?: string | null;
  readonly date?: string | null;
  readonly location?: string | null;
  readonly locationLocality?: string | null;
  readonly locationRegion?: string | null;
  readonly countryCode?: string | null;
  readonly mode?: string | null;
  readonly status?: string | null;
  readonly links?: readonly PresentationLinkInput[];
  readonly coSpeakers?: readonly NamedActor[];
  readonly hidden?: boolean;
}

export interface PresentationInput {
  readonly rkey: string;
  readonly title: string;
  readonly description?: string | null;
  readonly duration?: { minMinutes: number; maxMinutes?: number } | null;
  readonly coverImageUrl?: string | null;
  readonly links?: readonly PresentationLinkInput[];
  readonly deliveries?: readonly PresentationDeliveryInput[];
  readonly hidden?: boolean;
}

function lookup(table: Readonly<Record<string, string>>, key: string | null | undefined) {
  if (!key) return undefined;
  return Object.prototype.hasOwnProperty.call(table, key) ? table[key] : undefined;
}

function deliveryPlace(delivery: PresentationDeliveryInput, s: (v: string) => string) {
  const addressLocality = delivery.locationLocality ?? undefined;
  const addressRegion = delivery.locationRegion ?? undefined;
  const addressCountry = delivery.countryCode ?? undefined;

  if (addressLocality || addressRegion || addressCountry) {
    return {
      '@type': 'Place' as const,
      address: {
        '@type': 'PostalAddress' as const,
        ...(addressLocality && { addressLocality: s(addressLocality) }),
        ...(addressRegion && { addressRegion: s(addressRegion) }),
        ...(addressCountry && { addressCountry }),
      },
    };
  }

  // Legacy free-text location, kept so deliveries recorded before the
  // structured address field still say where they happened.
  if (delivery.location) {
    return { '@type': 'Place' as const, name: s(delivery.location) };
  }

  return undefined;
}

function linkOfType(links: readonly PresentationLinkInput[] | undefined, type: string) {
  return links?.find((l) => l.type === type)?.uri;
}

export function buildPresentationJsonLd(
  presentation: PresentationInput,
  author: WorkAuthor,
  options: WorksOptions = {},
) {
  const s = options.sanitize ?? identity;
  const baseUrl = normaliseBaseUrl(options.baseUrl);
  const speaker = authorNode(author, baseUrl, s);

  const events = visible(presentation.deliveries).map((delivery) => {
    const place = deliveryPlace(delivery, s);
    const recording = linkOfType(delivery.links, LINK_RECORDING);
    const slides =
      linkOfType(delivery.links, LINK_SLIDES) ?? linkOfType(presentation.links, LINK_SLIDES);

    return {
      '@type': 'Event' as const,
      name: s(delivery.eventName ?? delivery.title ?? presentation.title),
      ...(delivery.date && { startDate: delivery.date }),
      ...(place && { location: place }),
      ...(lookup(ATTENDANCE_MODE, delivery.mode) && {
        eventAttendanceMode: lookup(ATTENDANCE_MODE, delivery.mode),
      }),
      ...(lookup(EVENT_STATUS, delivery.status) && {
        eventStatus: lookup(EVENT_STATUS, delivery.status),
      }),
      performer: [speaker, ...confirmedActorNodes(delivery.coSpeakers, baseUrl, s)],
      ...(recording && { recordedIn: { '@type': 'VideoObject' as const, url: recording } }),
      ...(slides && {
        workFeatured: { '@type': 'PresentationDigitalDocument' as const, url: slides },
      }),
    };
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'PresentationDigitalDocument' as const,
    name: s(presentation.title),
    ...(presentation.description && { abstract: s(presentation.description) }),
    ...(presentation.duration && { timeRequired: `PT${presentation.duration.minMinutes}M` }),
    ...(presentation.coverImageUrl && { image: presentation.coverImageUrl }),
    author: speaker,
    url: `${baseUrl}/p/${author.handle}/talk/${buildTalkSlug(presentation.title, presentation.rkey)}`,
    ...(events.length > 0 && { subjectOf: events }),
  };
}

// ---------------------------------------------------------------------------
// Publications
// ---------------------------------------------------------------------------

export interface PublicationContributorInput {
  readonly name: string;
  readonly orcidId?: string;
  readonly handle?: string;
}

export interface PublicationInput {
  readonly rkey: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly publisher?: string;
  readonly date?: string;
  readonly url?: string;
  readonly description?: string;
  readonly doi?: string;
  readonly contributors?: readonly PublicationContributorInput[];
  readonly hidden?: boolean;
}

/** Strip any resolver prefix so the bare DOI is what gets published. */
function bareDoi(doi: string): string {
  return doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:/i, '');
}

export function buildPublicationJsonLd(
  publication: PublicationInput,
  author: WorkAuthor,
  options: WorksOptions = {},
) {
  const s = options.sanitize ?? identity;
  const baseUrl = normaliseBaseUrl(options.baseUrl);

  // Contributor order is meaningful in scholarly work, so it is preserved as
  // given rather than sorted or deduplicated.
  const authors: PersonNode[] =
    publication.contributors && publication.contributors.length > 0
      ? publication.contributors.map((c) => ({
          '@type': 'Person' as const,
          name: s(c.name),
          ...(c.handle && { url: profileUrl(baseUrl, c.handle) }),
          ...(c.orcidId && { sameAs: [`${ORCID_RESOLVER}${c.orcidId}`] }),
        }))
      : [authorNode(author, baseUrl, s)];

  const doi = publication.doi ? bareDoi(publication.doi) : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle' as const,
    name: s(publication.title),
    ...(publication.subtitle && { alternativeHeadline: s(publication.subtitle) }),
    ...(publication.description && { abstract: s(publication.description) }),
    ...(publication.publisher && {
      publisher: { '@type': 'Organization' as const, name: s(publication.publisher) },
    }),
    ...(publication.date && { datePublished: publication.date }),
    ...(publication.url && { url: publication.url }),
    author: authors,
    ...(doi && {
      identifier: { '@type': 'PropertyValue' as const, propertyID: 'DOI', value: doi },
      sameAs: [`${DOI_RESOLVER}${doi}`],
    }),
  };
}

// ---------------------------------------------------------------------------
// Courses and projects
// ---------------------------------------------------------------------------

export interface CourseInput {
  readonly rkey: string;
  readonly name: string;
  readonly number?: string;
  readonly institution?: string;
  readonly hidden?: boolean;
}

export function buildCourseJsonLd(course: CourseInput, options: WorksOptions = {}) {
  const s = options.sanitize ?? identity;
  return {
    '@context': 'https://schema.org',
    '@type': 'Course' as const,
    name: s(course.name),
    ...(course.number && { courseCode: s(course.number) }),
    ...(course.institution && {
      provider: { '@type': 'EducationalOrganization' as const, name: s(course.institution) },
    }),
  };
}

export interface ProjectInput {
  readonly rkey: string;
  readonly name: string;
  readonly description?: string;
  readonly url?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly members?: readonly NamedActor[];
  readonly hidden?: boolean;
}

export function buildProjectJsonLd(
  project: ProjectInput,
  author: WorkAuthor,
  options: WorksOptions = {},
) {
  const s = options.sanitize ?? identity;
  const baseUrl = normaliseBaseUrl(options.baseUrl);
  const members = confirmedActorNodes(project.members, baseUrl, s);

  return {
    '@context': 'https://schema.org',
    '@type': 'Project' as const,
    name: s(project.name),
    ...(project.description && { description: s(project.description) }),
    ...(project.url && { url: project.url }),
    ...(project.startDate && { startDate: project.startDate }),
    ...(project.endDate && { endDate: project.endDate }),
    member: [authorNode(author, baseUrl, s), ...members],
  };
}
