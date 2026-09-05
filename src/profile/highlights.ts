/**
 * Selection + formatting logic for the profile "Highlights" block: one tile per
 * section showing the ongoing record (or the most-recent one, per section
 * policy). Pure functions (no components, no rendering), so every surface can
 * share the same selection and labeling and never drift:
 *
 *  - sifa-web renders these tiles as a React/Tailwind card grid on `/p/{handle}`.
 *  - sifa-page-renderer renders them as academicpages HTML below the personal
 *    site's About section (page.sifa.id/{handle}).
 *
 * Both consume `buildProfileHighlights`; only the presentation differs. Selection
 * reuses the SDK's shared date primitives so date-field naming differences and
 * the "ongoing sorts first" rule stay in one place; only the block-specific
 * display strings ("Since …", day-level event dates) live here.
 */
import { pickPrimaryPosition } from '../logic/primary-position.js';
import {
  sortByDateDesc,
  lexiconDateExtractor,
  dateRangeExtractor,
  singleDateExtractor,
} from '../format/sort-by-date.js';
import { formatTimelineDate } from '../format/index.js';
import { getPresentationRoleLabel } from '../taxonomy/presentation-role.js';
import { getCalendarEventModeLabel } from '../taxonomy/calendar-event.js';
import type { Profile, ProfilePresentation, ProfilePresentationDelivery } from '../types/index.js';

/** The slice of a profile the Highlights block reads. Both `Profile` and a
 * page's anonymous `Omit<Profile,'isOwnProfile'>` view satisfy it. `did` and
 * `handle` identify the owner so co-author/co-speaker/member lists can exclude
 * them (the owner is always implied; only other people are worth naming). */
export type ProfileHighlightsInput = Pick<
  Profile,
  | 'did'
  | 'handle'
  | 'displayName'
  | 'presentations'
  | 'presentationDeliveries'
  | 'publications'
  | 'positions'
  | 'education'
  | 'courses'
  | 'projects'
  | 'involvement'
>;

/** A named person on a record: a publication contributor or an ActorCard
 * (co-speaker, project member, involvement collaborator). */
interface PersonRef {
  did?: string;
  handle?: string;
  displayName?: string;
  name?: string;
}

/**
 * "with Jane Doe, Alex Roe" for the OTHER people on a record, or undefined when
 * the owner is the only one. The owner is always implied on their own profile,
 * so naming them adds nothing; co-people are the differentiator.
 */
function coPeopleLabel(
  people: readonly PersonRef[] | undefined,
  self: { did: string; handle: string },
): string | undefined {
  const names = (people ?? [])
    .filter((p) => p.did !== self.did && (!p.handle || p.handle !== self.handle))
    .map((p) => p.displayName ?? p.name ?? p.handle)
    .filter((n): n is string => Boolean(n && n.trim()));
  return names.length ? `with ${names.join(', ')}` : undefined;
}

export type ProfileHighlightSection =
  'talk' | 'publication' | 'career' | 'education' | 'project' | 'involvement';

/** Blue pill: upcoming/current. Grey pill: recent (most recent, ended). */
export type ProfileHighlightStatus = 'upcoming' | 'current' | 'recent';

export interface ProfileHighlightTile {
  section: ProfileHighlightSection;
  /** Same-page anchor for the section this tile summarizes. */
  href: string;
  title: string;
  meta?: string;
  dateStr?: string;
  imageUrl?: string;
  status: ProfileHighlightStatus;
}

const EN_DASH = '–';

/** Drop items the owner has hidden - they must never surface as "current". */
function visible<T extends { hidden?: boolean }>(items: readonly T[] | undefined): T[] {
  return (items ?? []).filter((i) => !i.hidden);
}

/** Join the truthy parts of a meta line with the profile "·" separator. */
function metaLine(parts: (string | undefined | null)[]): string | undefined {
  const kept = parts.filter((p): p is string => Boolean(p && p.trim()));
  return kept.length ? kept.join(' · ') : undefined;
}

/**
 * A start/end span. Ongoing (a start with no end) reads "Since Jan 2014"; a
 * closed span uses an en dash; equal ends collapse to one month.
 */
export function formatSpanDate(start?: string, end?: string): string | undefined {
  if (start && !end) return `Since ${formatTimelineDate(start)}`;
  if (!start && !end) return undefined;
  if (!start) return formatTimelineDate(end as string);
  const a = formatTimelineDate(start);
  const b = formatTimelineDate(end as string);
  return a === b ? a : `${a} ${EN_DASH} ${b}`;
}

/** A single month/year date (publications, completed courses). */
export function formatSingleDate(date?: string): string | undefined {
  return date ? formatTimelineDate(date) : undefined;
}

const EVENT_DAY_FMT = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

/**
 * A talk delivery date. Day-level strings ("2026-10-12") render as
 * "Oct 12, 2026"; month- or year-only strings fall back to the month formatter.
 * UTC-fixed so server and client agree.
 */
export function formatEventDate(date?: string): string | undefined {
  if (!date) return undefined;
  if (date.length === 10) {
    const d = new Date(`${date}T00:00:00Z`);
    if (!Number.isNaN(d.getTime())) return EVENT_DAY_FMT.format(d);
  }
  return formatTimelineDate(date);
}

interface TalkOccasion {
  date: string;
  title: string;
  delivery: ProfilePresentationDelivery;
  imageUrl?: string;
}

/**
 * The single most recent (or soonest upcoming) speaking occasion, drawn from
 * both reusable talks (with their nested deliveries) and one-off sessions that
 * are not linked to a talk. Returns undefined when nothing is dated.
 */
function pickTalk(
  presentations: ProfilePresentation[],
  deliveries: ProfilePresentationDelivery[],
  today: string,
  self: { did: string; handle: string },
): ProfileHighlightTile | undefined {
  const talkRkeys = new Set(presentations.map((p) => p.rkey));
  const occasions: TalkOccasion[] = [];

  for (const p of presentations) {
    const dated = visible(p.deliveries).filter((d) => d.date);
    if (!dated.length) continue;
    const date = dated.reduce((max, d) => (d.date && d.date > max ? d.date : max), '');
    const delivery = dated.find((d) => d.date === date);
    if (!delivery) continue;
    occasions.push({ date, title: p.title, delivery, imageUrl: p.coverImageUrl ?? undefined });
  }
  for (const d of deliveries) {
    const standalone = !d.presentationRkey || !talkRkeys.has(d.presentationRkey);
    if (!standalone || !d.date || d.hidden) continue;
    occasions.push({ date: d.date, title: d.title || d.eventName || 'Talk', delivery: d });
  }

  if (!occasions.length) return undefined;
  const best = occasions.reduce((a, b) => (b.date > a.date ? b : a));
  const { delivery } = best;

  return {
    section: 'talk',
    href: '#presentations',
    title: best.title,
    meta: metaLine([
      delivery.eventName,
      delivery.location,
      getPresentationRoleLabel(delivery.role ?? undefined),
      getCalendarEventModeLabel(delivery.mode ?? undefined),
      coPeopleLabel(delivery.coSpeakers, self),
    ]),
    dateStr: formatEventDate(best.date),
    imageUrl: best.imageUrl,
    status: best.date > today ? 'upcoming' : 'recent',
  };
}

export interface BuildProfileHighlightsOptions {
  /** Injectable "today" (YYYY-MM-DD) so upcoming/latest is deterministic in tests. */
  today: string;
}

/**
 * Compute the tiles for the Highlights block. Row 1 = Talk + Publication (media);
 * row 2 = Career, Education, Project, Involvement (compact). Per-section policy:
 * Career + Education always show their most-recent record; Project + Involvement
 * appear only when something is ongoing; Talk/Publication always show the latest.
 * Hidden records are excluded everywhere. Both rows are returned in a fixed order
 * so every surface renders the same sequence.
 */
export function buildProfileHighlights(
  profile: ProfileHighlightsInput,
  { today }: BuildProfileHighlightsOptions,
): { row1: ProfileHighlightTile[]; row2: ProfileHighlightTile[] } {
  const row1: ProfileHighlightTile[] = [];
  const row2: ProfileHighlightTile[] = [];
  const self = { did: profile.did, handle: profile.handle };

  // --- Row 1: Talk ---
  const talk = pickTalk(
    visible(profile.presentations),
    visible(profile.presentationDeliveries),
    today,
    self,
  );
  if (talk) row1.push(talk);

  // --- Row 1: Publication ---
  const publication = sortByDateDesc(visible(profile.publications), singleDateExtractor)[0];
  if (publication) {
    // Drop the venue when it is the owner themself: self-published articles carry
    // the owner's own handle or display name as publisher/publicationName, which
    // reads as "me". The handle match is safe (handles are unique). The display
    // name is freeform and could collide with a real journal (e.g. "Nature"), so
    // only drop it on a solo byline (no co-authors); a real journal piece almost
    // always has co-authors or a non-matching venue. Co-authors go first.
    const venue = publication.publicationName ?? publication.publisher;
    const coAuthors = coPeopleLabel(publication.contributors, self);
    const venueIsSelf =
      venue === profile.handle ||
      (!!profile.displayName && venue === profile.displayName && !coAuthors);
    row1.push({
      section: 'publication',
      href: '#publications',
      title: publication.title,
      meta: metaLine([coAuthors, venue && !venueIsSelf ? venue : undefined, publication.subtitle]),
      dateStr: formatSingleDate(publication.date),
      imageUrl: publication.image ?? undefined,
      status: 'recent',
    });
  }

  // --- Row 2: Career (always shown) ---
  const positions = visible(profile.positions);
  const career =
    pickPrimaryPosition(positions) ?? sortByDateDesc(positions, lexiconDateExtractor)[0];
  if (career) {
    row2.push({
      section: 'career',
      href: '#career',
      title: career.title,
      meta: metaLine([career.entityName ?? career.company]),
      dateStr: formatSpanDate(career.startedAt, career.endedAt),
      status: career.endedAt ? 'recent' : 'current',
    });
  }

  // --- Row 2: Education (always shown; falls back to a Course) ---
  const education = sortByDateDesc(visible(profile.education), lexiconDateExtractor)[0];
  if (education) {
    const institution = education.entityName ?? education.institution;
    const title = education.degree || education.fieldOfStudy || institution || 'Education';
    row2.push({
      section: 'education',
      href: '#education',
      title,
      meta: metaLine([title === institution ? undefined : institution]),
      dateStr: formatSpanDate(education.startedAt, education.endedAt),
      status: education.endedAt ? 'recent' : 'current',
    });
  } else {
    const course = visible(profile.courses)[0];
    if (course) {
      row2.push({
        section: 'education',
        href: '#courses',
        title: course.name,
        meta: metaLine([course.entityName ?? course.institution]),
        dateStr: formatSingleDate(course.completedAt),
        status: 'recent',
      });
    }
  }

  // --- Row 2: Project (only when ongoing) ---
  const ongoingProjects = visible(profile.projects).filter((p) => !p.endDate);
  const project = sortByDateDesc(ongoingProjects, dateRangeExtractor)[0];
  if (project) {
    row2.push({
      section: 'project',
      href: '#projects',
      title: project.name,
      meta: coPeopleLabel(project.members, self),
      dateStr: formatSpanDate(project.startDate, project.endDate),
      status: 'current',
    });
  }

  // --- Row 2: Involvement (only when ongoing) ---
  const ongoingInvolvement = visible(profile.involvement).filter((i) => !i.endedAt);
  const involvement = sortByDateDesc(ongoingInvolvement, lexiconDateExtractor)[0];
  if (involvement) {
    row2.push({
      section: 'involvement',
      href: '#involvement',
      title: involvement.role || involvement.kind || 'Involvement',
      meta: metaLine([
        involvement.entityName ?? involvement.upstream,
        coPeopleLabel(involvement.collaborators, self),
      ]),
      dateStr: formatSpanDate(involvement.startedAt, involvement.endedAt),
      status: 'current',
    });
  }

  return { row1, row2 };
}

/**
 * Whether the Highlights block is worth rendering at all. A single tile just
 * duplicates the one section right below it, so the block is omitted under two
 * tiles. Shared by every surface (profile page + personal site) so the collapse
 * threshold can never diverge between them.
 */
export function shouldRenderHighlights(rows: {
  row1: ProfileHighlightTile[];
  row2: ProfileHighlightTile[];
}): boolean {
  return rows.row1.length + rows.row2.length >= 2;
}
