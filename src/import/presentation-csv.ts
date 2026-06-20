import type {
  ProfilePresentationRecord,
  ProfilePresentationDeliveryRecord,
  PresentationLink,
  PresentationDuration,
} from '../schemas/index.js';

/**
 * CSV parsers for the Talks & sessions import (two templates joined by a
 * presentation_key). The value parsers and row mappers are reusable and pure;
 * the actual PDS writing (create a presentation, then write its deliveries with
 * a presentationRef to it) is orchestrated by the consumer, which has the
 * created record's AT-URI.
 */

/** A CSV row as a header-keyed map. Missing cells may be undefined or empty. */
export type CsvRow = Record<string, string | undefined>;

function clean(value: string | undefined): string {
  return (value ?? '').trim();
}

/**
 * Parse a free-text duration into minutes: a single value ("30 min", "30
 * minutes", "30") or a range ("20-30 min", "20 to 30 minutes", "20-30").
 * Returns undefined when no usable number is present. A second number is used
 * as the upper bound only when it is greater than or equal to the first.
 */
export function parsePresentationDuration(
  input: string | undefined,
): PresentationDuration | undefined {
  const numbers = (clean(input).match(/\d+/g) ?? [])
    .map((n) => Number.parseInt(n, 10))
    .filter((n) => Number.isInteger(n) && n > 0);
  // `.at()` is typed `number | undefined`, which both tsc (under
  // noUncheckedIndexedAccess) and eslint agree on, so the guards are clean.
  const min = numbers.at(0);
  if (min === undefined) return undefined;
  const max = numbers.at(1);
  return max !== undefined && max >= min
    ? { minMinutes: min, maxMinutes: max }
    : { minMinutes: min };
}

/** Build a duration from explicit min/max minute columns. */
export function durationFromMinutes(
  minRaw: string | undefined,
  maxRaw: string | undefined,
): PresentationDuration | undefined {
  const min = Number.parseInt(clean(minRaw), 10);
  if (!Number.isInteger(min) || min < 1) return undefined;
  const max = Number.parseInt(clean(maxRaw), 10);
  return Number.isInteger(max) && max >= min
    ? { minMinutes: min, maxMinutes: max }
    : { minMinutes: min };
}

/** Split a delimited list into trimmed, non-empty values. Default delimiter ";". */
export function parseIntendedAudiences(input: string | undefined, delimiter = ';'): string[] {
  return clean(input)
    .split(delimiter)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Strip HTML to plain text and decode the common entities, for descriptions
 * exported as HTML (e.g. Webflow). The AppView re-sanitizes on write; this is
 * only to produce readable text.
 */
export function stripHtmlToText(input: string | undefined): string {
  const text = clean(input)
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(p|div|li|h[1-6])\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'");
  return text
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const ROLE_TOKENS: Record<string, string> = {
  presenter: 'id.sifa.defs#presenter',
  speaker: 'id.sifa.defs#presenter',
  panelist: 'id.sifa.defs#panelist',
  keynote: 'id.sifa.defs#keynote',
  workshop: 'id.sifa.defs#workshop',
  host: 'id.sifa.defs#host',
};

/** Map a friendly role value to its token; passes through an existing token or an unknown value. */
export function normalizePresentationRole(value: string | undefined): string | undefined {
  const v = clean(value).toLowerCase();
  if (!v) return undefined;
  if (v.startsWith('id.sifa.defs#')) return v;
  return ROLE_TOKENS[v] ?? v;
}

const MODE_FRAGMENTS: Record<string, string> = {
  inperson: '#inperson',
  'in person': '#inperson',
  'in-person': '#inperson',
  virtual: '#virtual',
  online: '#virtual',
  remote: '#virtual',
  hybrid: '#hybrid',
};

/** Map a friendly mode value to the community calendar token; drops an unknown value. */
export function normalizePresentationMode(value: string | undefined): string | undefined {
  const v = clean(value).toLowerCase();
  if (!v) return undefined;
  if (v.startsWith('community.lexicon.calendar.event#')) return v;
  const fragment = MODE_FRAGMENTS[v];
  return fragment ? `community.lexicon.calendar.event${fragment}` : undefined;
}

function link(uri: string | undefined, type: string): PresentationLink | undefined {
  const u = clean(uri);
  return u ? { uri: u, type } : undefined;
}

export interface ParsedPresentation {
  /** presentation_key used to link delivery rows to this presentation. */
  key?: string;
  record: Omit<ProfilePresentationRecord, 'createdAt'>;
}

/** Map a row of the presentations template to a presentation record (minus createdAt). */
export function presentationCsvRowToRecord(row: CsvRow): ParsedPresentation {
  const description = stripHtmlToText(row.description);
  const duration =
    parsePresentationDuration(row.duration) ??
    durationFromMinutes(row.duration_min_minutes, row.duration_max_minutes);
  const intendedAudiences = parseIntendedAudiences(row.intended_audiences);
  const links = [
    link(row.slides_url, 'id.sifa.defs#linkSlides'),
    link(row.recording_url, 'id.sifa.defs#linkRecording'),
    link(row.writeup_url, 'id.sifa.defs#linkWriteup'),
  ].filter((l): l is PresentationLink => l !== undefined);

  const record: Omit<ProfilePresentationRecord, 'createdAt'> = { title: clean(row.title) };
  if (description) record.description = description;
  if (duration) record.duration = duration;
  if (intendedAudiences.length) record.intendedAudiences = intendedAudiences;
  if (links.length) record.links = links;

  return { key: clean(row.presentation_key) || undefined, record };
}

export interface ParsedDelivery {
  /** presentation_key to resolve into a presentationRef once the presentation exists. */
  presentationKey?: string;
  record: Omit<ProfilePresentationDeliveryRecord, 'createdAt' | 'presentationRef'>;
}

/** Map a row of the deliveries template to a delivery record (minus createdAt and presentationRef). */
export function presentationDeliveryCsvRowToRecord(row: CsvRow): ParsedDelivery {
  const links = [
    link(row.event_url, 'id.sifa.defs#linkEvent'),
    link(row.recording_url, 'id.sifa.defs#linkRecording'),
  ].filter((l): l is PresentationLink => l !== undefined);

  const record: Omit<ProfilePresentationDeliveryRecord, 'createdAt' | 'presentationRef'> = {};
  const title = clean(row.title);
  const eventName = clean(row.event_name);
  const date = clean(row.date);
  const location = clean(row.location);
  const role = normalizePresentationRole(row.role);
  const mode = normalizePresentationMode(row.mode);
  if (title) record.title = title;
  if (role) record.role = role;
  if (eventName) record.eventName = eventName;
  if (date) record.date = date;
  if (location) record.location = location;
  if (mode) record.mode = mode;
  if (links.length) record.links = links;

  return { presentationKey: clean(row.presentation_key) || undefined, record };
}
