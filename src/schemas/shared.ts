import { z } from 'zod';

/**
 * Grapheme-aware refinement matching the AT Protocol lexicon `maxGraphemes`
 * constraint. JS strings are sequences of UTF-16 code units, but lexicon
 * `maxGraphemes` counts user-perceived characters (grapheme clusters), so
 * emoji sequences, regional indicators, ZWJ joins, and combining marks all
 * count as one unit each. We use `Intl.Segmenter` to enforce this correctly.
 */
export function maxGraphemes(max: number) {
  return (value: string): boolean => {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    let count = 0;
    for (const _ of segmenter.segment(value)) {
      count++;
      if (count > max) return false;
    }
    return true;
  };
}

/** Decentralized identifier, AT Protocol `format: did`. */
export const didSchema = z.string().regex(/^did:[a-z]+:[a-zA-Z0-9._:%-]+$/, 'Invalid DID');

/** RFC 3339 datetime with timezone offset, AT Protocol `format: datetime`. */
export const datetimeSchema = z.string().datetime({ offset: true });

/**
 * Freeform calendar date for user-facing profile dates (start/end, issued,
 * completed, awarded, published, etc.). Accepts a bare year, year-month,
 * year-month-day, or a full datetime (so a legacy record's RFC-3339 date maps
 * through on backfill without loss). NOT strict `datetime` -- users typically
 * remember only month/year, and LinkedIn-importer writes carry partial dates,
 * so the lexicons document these as freeform `YYYY-MM` / `YYYY-MM-DD`. Record
 * metadata like `createdAt` stays on `datetimeSchema`.
 */
export const partialDateSchema = z
  .string()
  .regex(/^\d{4}(-\d{2}(-\d{2}(T.+)?)?)?$/, 'Expected YYYY, YYYY-MM, YYYY-MM-DD, or a datetime');

/** Generic AT-URI, AT Protocol `format: at-uri`. */
export const atUriSchema = z.string().regex(/^at:\/\/[^\s]+$/, 'Invalid AT-URI');

/** Content identifier, AT Protocol `format: cid`. Loose validation -- accepts CIDv0 and CIDv1. */
export const cidSchema = z
  .string()
  .regex(/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z0-9+/=]+)$/, 'Invalid CID');

/** BCP 47 language tag, AT Protocol `format: language`. */
export const languageTagSchema = z
  .string()
  .regex(/^[a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*$/, 'Invalid BCP 47 language tag');

/** Generic URI, AT Protocol `format: uri`. */
export const uriSchema = z.string().url();

/**
 * StrongRef shape from `com.atproto.repo.strongRef` -- pins a record by both
 * AT-URI (identity) and CID (version).
 */
export const strongRefSchema = z.object({
  uri: atUriSchema,
  cid: cidSchema,
});

/**
 * Reference to a record by AT-URI, with an optional CID. Mirrors
 * `id.sifa.defs#externalRecordRef`. Unlike a strongRef the CID is optional:
 * consumers resolve the AT-URI live so the reference tracks edits to the
 * target, and the CID is a best-effort integrity hint only.
 */
export const externalRecordRefSchema = z.object({
  uri: atUriSchema,
  cid: cidSchema.optional(),
});

/**
 * Self-labels shape from `com.atproto.label.defs#selfLabels`. Modelled
 * permissively because clients rarely construct this directly; the AppView
 * handles label validation.
 */
export const selfLabelsSchema = z.object({
  $type: z.literal('com.atproto.label.defs#selfLabels').optional(),
  values: z.array(z.object({ val: z.string() })),
});
