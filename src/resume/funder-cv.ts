/**
 * Funder-format CV documents: the NIH Biographical Sketch (Common Form plus
 * NIH Supplement) and the ERC Part B1 "Curriculum vitae and Track Record".
 *
 * A pure mapper from a Sifa profile and the owner's pick of items to a plain
 * JSON document a typesetter lays out. Like the JSON Resume emitter next door,
 * nothing here fetches or renders.
 *
 * Funders cap how many items a CV may list. The caps live in
 * `FUNDER_CV_GROUPS`, so the export page that offers the choice and the server
 * that enforces it read one number. Sections a funder asks for that Sifa holds
 * no records for (a personal statement, contributions to science, career
 * breaks) are emitted as `null` or empty, for the template to show as a
 * placeholder the applicant fills in.
 */

import { z } from 'zod';

import { formatLocation } from '../format/location-utils.js';
import { formatStructuredName } from '../format/pds-utils.js';
import { filterHidden } from '../profile/section-model.js';
import { isTeachingCourse } from '../taxonomy/course-role.js';
import type {
  ExternalAccount,
  ProfileCourse,
  ProfileEducation,
  ProfileHonor,
  ProfilePosition,
  ProfilePresentation,
  ProfilePublication,
  ProfileVolunteering,
} from '../types/index.js';
import { toResumeDate } from './json-resume.js';

export const FUNDER_CV_FORMATS = ['nih', 'erc'] as const;
export type FunderCvFormat = (typeof FUNDER_CV_FORMATS)[number];

export const FUNDER_CV_ITEM_KINDS = ['publication', 'presentation', 'honor'] as const;
export type FunderCvItemKind = (typeof FUNDER_CV_ITEM_KINDS)[number];

export interface FunderCvGroupSpec {
  readonly kinds: readonly FunderCvItemKind[];
  /** Most items the funder's form takes for this group. */
  readonly max: number;
}

/**
 * The pickable groups per format, with the funder's item limits.
 *
 * - NIH Common Form "Products": up to 5 closely related to the proposed
 *   project and up to 5 other significant products. Publications, conference
 *   papers and presentations all count. NIH Supplement "Honors": up to 15.
 * - ERC Part B1 "Research achievements": up to ten research outputs. "Peer
 *   recognition" is "selected examples" with no number; 15 is Sifa's own cap,
 *   to keep the section inside the 4-page limit.
 */
export const FUNDER_CV_GROUPS = {
  nih: {
    related: { kinds: ['publication', 'presentation'], max: 5 },
    other: { kinds: ['publication', 'presentation'], max: 5 },
    honors: { kinds: ['honor'], max: 15 },
  },
  erc: {
    outputs: { kinds: ['publication'], max: 10 },
    recognition: { kinds: ['honor', 'presentation'], max: 15 },
  },
} as const satisfies Record<FunderCvFormat, Record<string, FunderCvGroupSpec>>;

export type FunderCvGroupName<F extends FunderCvFormat> = keyof (typeof FUNDER_CV_GROUPS)[F] &
  string;

/** A picked item: `<kind>:<rkey>`, e.g. `publication:3kxyz`. */
export function funderCvItemId(kind: FunderCvItemKind, rkey: string): string {
  return `${kind}:${rkey}`;
}

/** Record key syntax (atproto): 1-512 of A-Z a-z 0-9 . - _ : ~ */
const ITEM_ID_RE = /^(publication|presentation|honor):[A-Za-z0-9._~:-]{1,512}$/;

function kindOf(id: string): FunderCvItemKind | undefined {
  const kind = id.slice(0, id.indexOf(':'));
  return (FUNDER_CV_ITEM_KINDS as readonly string[]).includes(kind)
    ? (kind as FunderCvItemKind)
    : undefined;
}

function groupSchema(spec: FunderCvGroupSpec) {
  return z
    .array(
      z
        .string()
        .regex(ITEM_ID_RE)
        .refine((id) => spec.kinds.includes(kindOf(id) as FunderCvItemKind), {
          message: `Only ${spec.kinds.join(', ')} items fit here`,
        }),
    )
    .max(spec.max)
    .default([]);
}

function noRepeats(lists: readonly string[][]): boolean {
  const all = lists.flat();
  return new Set(all).size === all.length;
}

const nihSelectionSchema = z
  .object({
    format: z.literal('nih'),
    related: groupSchema(FUNDER_CV_GROUPS.nih.related),
    other: groupSchema(FUNDER_CV_GROUPS.nih.other),
    honors: groupSchema(FUNDER_CV_GROUPS.nih.honors),
  })
  .refine((s) => noRepeats([s.related, s.other, s.honors]), {
    message: 'An item can be listed once',
  });

const ercSelectionSchema = z
  .object({
    format: z.literal('erc'),
    outputs: groupSchema(FUNDER_CV_GROUPS.erc.outputs),
    recognition: groupSchema(FUNDER_CV_GROUPS.erc.recognition),
  })
  .refine((s) => noRepeats([s.outputs, s.recognition]), {
    message: 'An item can be listed once',
  });

/**
 * The owner's pick for one format. Enforces the shape and the funder's limits;
 * whether each id is one of the owner's own visible records is a separate
 * check against the profile, `findUnknownFunderCvItems`.
 */
export const funderCvSelectionSchema = z.discriminatedUnion('format', [
  nihSelectionSchema,
  ercSelectionSchema,
]);

export type FunderCvSelection = z.infer<typeof funderCvSelectionSchema>;

/** The subset of `Profile` the funder mapper reads. */
export interface FunderCvProfileInput {
  readonly handle: string;
  readonly displayName?: string;
  readonly givenName?: string;
  readonly familyName?: string;
  readonly headline?: string;
  readonly website?: string;
  readonly positions?: ProfilePosition[];
  readonly education?: ProfileEducation[];
  readonly publications?: ProfilePublication[];
  readonly presentations?: ProfilePresentation[];
  readonly honors?: ProfileHonor[];
  readonly courses?: ProfileCourse[];
  readonly volunteering?: ProfileVolunteering[];
  readonly externalAccounts?: ExternalAccount[];
}

export interface FunderCvCandidate {
  readonly id: string;
  readonly kind: FunderCvItemKind;
  readonly title: string;
  /** `YYYY`, `YYYY-MM` or `YYYY-MM-DD`; absent when the record has no date. */
  readonly date?: string;
}

/** The most recent visible delivery of a talk, which dates it. */
function latestDeliveryRecord(presentation: ProfilePresentation) {
  const dateOf = (d: { date?: string | null }) => toResumeDate(d.date ?? undefined) ?? '';
  return [...filterHidden(presentation.deliveries)]
    .sort((a, b) => dateOf(a).localeCompare(dateOf(b)))
    .at(-1);
}

function latestDelivery(presentation: ProfilePresentation): string | undefined {
  return toResumeDate(latestDeliveryRecord(presentation)?.date ?? undefined);
}

function candidatesOf(profile: FunderCvProfileInput, kind: FunderCvItemKind): FunderCvCandidate[] {
  switch (kind) {
    case 'publication':
      return filterHidden(profile.publications).map((p) => ({
        id: funderCvItemId(kind, p.rkey),
        kind,
        title: p.title,
        date: toResumeDate(p.date),
      }));
    case 'presentation':
      return filterHidden(profile.presentations).map((p) => ({
        id: funderCvItemId(kind, p.rkey),
        kind,
        title: p.title,
        date: latestDelivery(p),
      }));
    case 'honor':
      return filterHidden(profile.honors).map((h) => ({
        id: funderCvItemId(kind, h.rkey),
        kind,
        title: h.title,
        date: toResumeDate(h.date),
      }));
  }
}

/**
 * The owner's visible items of the given kinds, most recent first. Undated
 * items go last, in profile order. The sort is stable, so equal dates keep
 * profile order too.
 */
export function listFunderCvCandidates(
  profile: FunderCvProfileInput,
  kinds: readonly FunderCvItemKind[],
): FunderCvCandidate[] {
  const all = kinds.flatMap((kind) => candidatesOf(profile, kind));
  return all.sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });
}

/**
 * What the export page pre-ticks: the most recent publications up to each
 * limit (for NIH, the first five as closely related and the next five as
 * other), and the most recent honors. Talks are offered but not pre-ticked.
 */
export function defaultFunderCvSelection(
  profile: FunderCvProfileInput,
  format: FunderCvFormat,
): FunderCvSelection {
  const publications = listFunderCvCandidates(profile, ['publication']).map((c) => c.id);
  const honors = listFunderCvCandidates(profile, ['honor']).map((c) => c.id);
  if (format === 'nih') {
    const { related, other } = FUNDER_CV_GROUPS.nih;
    return {
      format,
      related: publications.slice(0, related.max),
      other: publications.slice(related.max, related.max + other.max),
      honors: honors.slice(0, FUNDER_CV_GROUPS.nih.honors.max),
    };
  }
  return {
    format,
    outputs: publications.slice(0, FUNDER_CV_GROUPS.erc.outputs.max),
    recognition: honors.slice(0, FUNDER_CV_GROUPS.erc.recognition.max),
  };
}

function selectedIds(selection: FunderCvSelection): string[] {
  return selection.format === 'nih'
    ? [...selection.related, ...selection.other, ...selection.honors]
    : [...selection.outputs, ...selection.recognition];
}

/**
 * Ids in the selection that are not visible records on this profile. The
 * profile is the owner's own, so an empty result means every pick is theirs.
 */
export function findUnknownFunderCvItems(
  profile: FunderCvProfileInput,
  selection: FunderCvSelection,
): string[] {
  const known = new Set(listFunderCvCandidates(profile, FUNDER_CV_ITEM_KINDS).map((c) => c.id));
  return selectedIds(selection).filter((id) => !known.has(id));
}

// ---------------------------------------------------------------------------
// Document shapes
// ---------------------------------------------------------------------------

export interface FunderCvPerson {
  /** Full name as the profile shows it; the handle when there is no name. */
  readonly name: string;
  readonly givenName?: string;
  readonly familyName?: string;
  /** Bare ORCID iD, e.g. `0000-0002-1825-0097`. */
  readonly orcid?: string;
  readonly website?: string;
}

/** One product or research output, ready to cite. */
export interface FunderCvCitation {
  readonly kind: 'publication' | 'presentation';
  readonly title: string;
  /** Authors in record order, comma separated. For a talk, the speaker. */
  readonly authors?: string;
  /** Journal, publisher or event. */
  readonly venue?: string;
  /** Year. */
  readonly date?: string;
  readonly doi?: string;
  readonly url?: string;
}

export interface FunderCvHonor {
  readonly year?: string;
  readonly title: string;
  readonly organization?: string;
}

export interface NihEducation {
  readonly organization: string;
  readonly location?: string;
  readonly degree?: string;
  /** Start date, `MM/YYYY` or `YYYY`. */
  readonly start?: string;
  /** Receipt date, `MM/YYYY` or `YYYY`. */
  readonly end?: string;
  readonly field?: string;
}

export interface FunderCvAppointment {
  /** `YYYY`. */
  readonly start?: string;
  /** `YYYY`, or null for a current appointment. */
  readonly end: string | null;
  readonly title: string;
  readonly organization?: string;
  readonly location?: string;
}

/** NIH Biographical Sketch: Common Form plus NIH Supplement. */
export interface NihFunderCv {
  readonly format: 'nih';
  readonly person: FunderCvPerson;
  readonly positionTitle?: string;
  /** Primary organization: the current position's. */
  readonly organization?: string;
  readonly location?: string;
  readonly education: NihEducation[];
  readonly appointments: FunderCvAppointment[];
  readonly products: { readonly related: FunderCvCitation[]; readonly other: FunderCvCitation[] };
  readonly honors: FunderCvHonor[];
  /** Supplement "Personal Statement". Sifa holds no record for it. */
  readonly personalStatement: string | null;
  /** Supplement "Contributions to Science". Sifa holds no record for them. */
  readonly contributions: string[];
}

export interface ErcEducation {
  /** Receipt date, `MM/YYYY` or `YYYY`. */
  readonly date?: string;
  readonly degree?: string;
  readonly field?: string;
  readonly institution: string;
}

export interface ErcRecognition {
  readonly kind: 'honor' | 'presentation';
  readonly year?: string;
  readonly title: string;
  /** Awarding body, or the event a talk was given at. */
  readonly organization?: string;
}

export interface ErcContribution {
  readonly kind: 'teaching' | 'service';
  readonly start?: string;
  readonly end: string | null;
  readonly title: string;
  readonly organization?: string;
}

/** ERC Part B1, section "Curriculum vitae and Track Record". */
export interface ErcFunderCv {
  readonly format: 'erc';
  readonly person: FunderCvPerson;
  readonly education: ErcEducation[];
  readonly currentPositions: FunderCvAppointment[];
  readonly previousPositions: FunderCvAppointment[];
  readonly outputs: FunderCvCitation[];
  readonly recognition: ErcRecognition[];
  readonly communityContributions: ErcContribution[];
  /** Proposal acronym for the page header. Not a profile fact. */
  readonly acronym: string | null;
  /** "Career breaks, diverse career paths and major life events". */
  readonly careerBreaks: string | null;
}

export type FunderCvDocument = NihFunderCv | ErcFunderCv;

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

function text(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function compact<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

function year(value: string | null | undefined): string | undefined {
  return toResumeDate(value ?? undefined)?.slice(0, 4);
}

/** `MM/YYYY` when the month is known, else `YYYY`. */
function monthYear(value: string | null | undefined): string | undefined {
  const date = toResumeDate(value ?? undefined);
  if (!date) return undefined;
  return date.length >= 7 ? `${date.slice(5, 7)}/${date.slice(0, 4)}` : date;
}

/** Newest start first; undated entries last, in profile order. */
function byStartDesc<T>(items: T[], start: (item: T) => string | undefined): T[] {
  return [...items].sort((a, b) => {
    const da = toResumeDate(start(a));
    const db = toResumeDate(start(b));
    if (da && db) return db.localeCompare(da);
    if (da) return -1;
    if (db) return 1;
    return 0;
  });
}

const ORCID_RE = /\d{4}-\d{4}-\d{4}-\d{3}[\dX]/;

function orcidOf(accounts: ExternalAccount[] | undefined): string | undefined {
  const account = filterHidden(accounts).find((a) => a.platform.toLowerCase() === 'orcid');
  return account ? ORCID_RE.exec(account.url)?.[0] : undefined;
}

function personOf(profile: FunderCvProfileInput): FunderCvPerson {
  return compact<FunderCvPerson>({
    name:
      formatStructuredName(profile.givenName, profile.familyName) ??
      text(profile.displayName) ??
      profile.handle,
    givenName: text(profile.givenName),
    familyName: text(profile.familyName),
    orcid: orcidOf(profile.externalAccounts),
    website: text(profile.website),
  });
}

function appointment(position: ProfilePosition): FunderCvAppointment {
  return compact<FunderCvAppointment>({
    start: year(position.startedAt),
    end: year(position.endedAt) ?? null,
    title: position.title,
    organization: text(position.entityName) ?? text(position.company),
    location: text(formatLocation(position.location)),
  });
}

/** The current position to name on the form: the flagged primary, else the newest. */
function currentPosition(positions: ProfilePosition[]): ProfilePosition | undefined {
  const current = byStartDesc(
    positions.filter((p) => !text(p.endedAt)),
    (p) => p.startedAt,
  );
  return current.find((p) => p.primary) ?? current[0];
}

function lookup(profile: FunderCvProfileInput) {
  const publications = new Map(filterHidden(profile.publications).map((p) => [p.rkey, p]));
  const presentations = new Map(filterHidden(profile.presentations).map((p) => [p.rkey, p]));
  const honors = new Map(filterHidden(profile.honors).map((h) => [h.rkey, h]));
  const split = (id: string) => {
    const at = id.indexOf(':');
    return { kind: id.slice(0, at), rkey: id.slice(at + 1) };
  };
  return { publications, presentations, honors, split };
}

function citations(
  ids: readonly string[],
  profile: FunderCvProfileInput,
  person: FunderCvPerson,
): FunderCvCitation[] {
  const { publications, presentations, split } = lookup(profile);
  return ids.flatMap((id): FunderCvCitation[] => {
    const { kind, rkey } = split(id);
    if (kind === 'publication') {
      const p = publications.get(rkey);
      if (!p) return [];
      const authors = (p.contributors ?? []).map((c) => c.name.trim()).filter(Boolean);
      return [
        compact<FunderCvCitation>({
          kind: 'publication',
          title: p.title,
          authors: authors.length > 0 ? authors.join(', ') : undefined,
          venue: text(p.publisher),
          date: year(p.date),
          doi: text(p.doi),
          url: text(p.url),
        }),
      ];
    }
    if (kind === 'presentation') {
      const talk = presentations.get(rkey);
      if (!talk) return [];
      const delivery = latestDeliveryRecord(talk);
      return [
        compact<FunderCvCitation>({
          kind: 'presentation',
          title: talk.title,
          authors: person.name,
          venue: text(delivery?.eventName),
          date: year(delivery?.date),
          url: text(talk.links?.[0]?.uri),
        }),
      ];
    }
    return [];
  });
}

function honorsOf(ids: readonly string[], profile: FunderCvProfileInput): FunderCvHonor[] {
  const { honors, split } = lookup(profile);
  return ids.flatMap((id) => {
    const { kind, rkey } = split(id);
    const h = kind === 'honor' ? honors.get(rkey) : undefined;
    if (!h) return [];
    return [
      compact<FunderCvHonor>({
        year: year(h.date),
        title: h.title,
        organization: text(h.entityName) ?? text(h.issuer),
      }),
    ];
  });
}

/**
 * Build the funder document from the profile and the owner's selection.
 *
 * Hidden records never appear. Selected ids that match no visible record are
 * skipped; callers that must refuse them check `findUnknownFunderCvItems`
 * first. Selected items keep the order they were picked in.
 */
export function profileToFunderCv(
  profile: FunderCvProfileInput,
  selection: FunderCvSelection,
): FunderCvDocument {
  const person = personOf(profile);
  const positions = filterHidden(profile.positions);
  const education = byStartDesc(filterHidden(profile.education), (e) => e.startedAt);

  if (selection.format === 'nih') {
    const current = currentPosition(positions);
    return compact<NihFunderCv>({
      format: 'nih',
      person,
      positionTitle: text(current?.title),
      organization: current ? appointment(current).organization : undefined,
      location: text(formatLocation(current?.location)),
      education: education.map((e) =>
        compact<NihEducation>({
          organization: text(e.entityName) ?? e.institution,
          degree: text(e.degree),
          start: monthYear(e.startedAt),
          end: monthYear(e.endedAt),
          field: text(e.fieldOfStudy),
        }),
      ),
      appointments: byStartDesc(positions, (p) => p.startedAt).map(appointment),
      products: {
        related: citations(selection.related, profile, person),
        other: citations(selection.other, profile, person),
      },
      honors: honorsOf(selection.honors, profile),
      personalStatement: null,
      contributions: [],
    });
  }

  const appointments = byStartDesc(positions, (p) => p.startedAt);
  const { presentations, split } = lookup(profile);

  const recognition = selection.recognition.flatMap((id): ErcRecognition[] => {
    const { kind, rkey } = split(id);
    if (kind === 'honor') {
      const [honor] = honorsOf([id], profile);
      return honor ? [{ kind: 'honor', ...honor }] : [];
    }
    const talk = kind === 'presentation' ? presentations.get(rkey) : undefined;
    if (!talk) return [];
    const delivery = latestDeliveryRecord(talk);
    return [
      compact<ErcRecognition>({
        kind: 'presentation',
        year: year(delivery?.date),
        title: talk.title,
        organization: text(delivery?.eventName),
      }),
    ];
  });

  const teaching = filterHidden(profile.courses)
    .filter(isTeachingCourse)
    .map((c) =>
      compact<ErcContribution>({
        kind: 'teaching',
        start: year(c.startedAt),
        end: year(c.endedAt) ?? null,
        title: c.name,
        organization: text(c.entityName) ?? text(c.institution),
      }),
    );
  const service = filterHidden(profile.volunteering).map((v) =>
    compact<ErcContribution>({
      kind: 'service',
      start: year(v.startDate),
      end: year(v.endDate) ?? null,
      title: text(v.role) ?? text(v.entityName) ?? v.organization,
      organization: text(v.entityName) ?? text(v.organization),
    }),
  );

  return {
    format: 'erc',
    person,
    education: education.map((e) =>
      compact<ErcEducation>({
        date: monthYear(e.endedAt) ?? monthYear(e.startedAt),
        degree: text(e.degree),
        field: text(e.fieldOfStudy),
        institution: text(e.entityName) ?? e.institution,
      }),
    ),
    currentPositions: appointments.filter((p) => !text(p.endedAt)).map(appointment),
    previousPositions: appointments.filter((p) => !!text(p.endedAt)).map(appointment),
    outputs: citations(selection.outputs, profile, person),
    recognition,
    communityContributions: [...teaching, ...service],
    acronym: null,
    careerBreaks: null,
  };
}
