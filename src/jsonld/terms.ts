/**
 * Reconciliation between `id.sifa.*` lexicon terms and existing RDF
 * vocabularies.
 *
 * The facts live in sifa-lexicons, as `x-skos:*` annotations on the lexicon
 * defs and properties. Those annotations are published to the authority PDS,
 * so a third party resolving `id.sifa.*` already reads them; that makes the
 * lexicons the source of truth and `./term-mappings.json` a derived copy,
 * refreshed by `scripts/sync-term-mappings.mjs` and drift-checked in CI.
 *
 * To change a mapping, change the lexicon, not this file.
 *
 * Scope note: RDF is adopted here as *vocabulary only*. Sifa records are
 * Lexicon JSON on the AT Protocol; nothing in this module changes how records
 * are stored or transmitted. A mapping is a one-directional annotation over a
 * lexicon designed on its own merits, never a constraint on lexicon design.
 * When a term does not fit, the correct answer is `noMatch`, not a different
 * lexicon.
 */

import document from './term-mappings.json';

/** Vocabulary prefix -> namespace IRI. */
export const VOCABULARIES: Readonly<Record<string, string>> = document.vocabularies;

export type VocabularyPrefix = keyof typeof document.vocabularies;

/**
 * Strength of a mapping, using SKOS mapping relations so the table is itself
 * expressible as RDF.
 *
 * `noMatch` is not the absence of an entry. It is a deliberate statement that
 * no external term should be used for this concept, and it carries a reason.
 */
export type MatchStrength =
  'exactMatch' | 'closeMatch' | 'broadMatch' | 'narrowMatch' | 'relatedMatch' | 'noMatch';

export interface TermMapping {
  /** Lexicon NSID, e.g. `id.sifa.profile.presentation`. */
  readonly lexicon: string;
  /**
   * Field name within the record. Omitted for a record-level class mapping
   * (what the record *is*, rather than what one of its fields means).
   */
  readonly field?: string;
  /** CURIEs, e.g. `dcterms:title`. Empty when `match` is `noMatch`. */
  readonly terms: readonly string[];
  readonly match: MatchStrength;
  /** Rationale. Always present when `match` is `noMatch`. */
  readonly note?: string;
}

interface RawMapping {
  lexicon: string;
  field?: string;
  terms: string[];
  match: string;
  note?: string;
}

interface RawUnmapped {
  lexicon: string;
  field?: string;
  reason: string;
}

/**
 * Every reconciliation Sifa asserts, including the deliberate non-mappings.
 *
 * The published document splits these into `mappings` and `unmapped`, which
 * reads better over the wire. Callers here want one list, so they are
 * flattened back together.
 */
export const TERM_MAPPINGS: readonly TermMapping[] = [
  ...(document.mappings as RawMapping[]).map((m): TermMapping => ({
    lexicon: m.lexicon,
    ...(m.field ? { field: m.field } : {}),
    terms: m.terms,
    match: m.match as MatchStrength,
    ...(m.note ? { note: m.note } : {}),
  })),
  ...(document.unmapped as RawUnmapped[]).map((u): TermMapping => ({
    lexicon: u.lexicon,
    ...(u.field ? { field: u.field } : {}),
    terms: [],
    match: 'noMatch',
    note: u.reason,
  })),
];

/**
 * Expand a CURIE (`dcterms:title`) to a full IRI. Returns null for an unknown
 * prefix rather than guessing a namespace.
 */
export function expandCurie(curie: string): string | null {
  const separator = curie.indexOf(':');
  if (separator <= 0) return null;
  const prefix = curie.slice(0, separator);
  const local = curie.slice(separator + 1);
  if (!local) return null;
  if (!Object.prototype.hasOwnProperty.call(VOCABULARIES, prefix)) return null;
  return `${VOCABULARIES[prefix]}${local}`;
}

/** All mappings declared for one lexicon NSID, record level and field level. */
export function mappingsForLexicon(nsid: string): readonly TermMapping[] {
  return TERM_MAPPINGS.filter((m) => m.lexicon === nsid);
}

/** True when Sifa has deliberately declined to map this lexicon or field. */
export function isDeliberatelyUnmapped(nsid: string, field?: string): boolean {
  return TERM_MAPPINGS.some(
    (m) => m.lexicon === nsid && m.field === field && m.match === 'noMatch',
  );
}
