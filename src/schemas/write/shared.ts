import { z } from 'zod';

/** Prepend `https://` if no scheme is present. */
export function normalizeUrl(val: string): string {
  const trimmed = val.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Accept a URL string or silently drop it if invalid (returns `undefined`).
 * Preserves the write-time policy: bad URLs from imports are dropped, not rejected.
 */
export const optionalUrl = () =>
  z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      try {
        new URL(val);
        return val;
      } catch {
        return undefined;
      }
    });

/**
 * Location shape accepted by the sifa-api write endpoints.
 *
 * Accepts BOTH the legacy shape (`id.sifa.defs#locationAddress`: `countryCode`,
 * `region`, `city`) AND the new community shape
 * (`community.lexicon.location.address`: `country`, `region`, `locality`,
 * `street?`, `postalCode?`, `name?`). The frontend reads location records from
 * the API and echoes them back on save. The API serializer emits explicit `null`
 * for absent fields (not `undefined`), so every field uses `.nullish()`
 * (`string | null | undefined`) instead of `.optional()` (`string | undefined`).
 *
 * `buildPdsLocation` on the server handles conversion to the PDS shape (always
 * emitting the new community shape) and returns `undefined` when neither
 * `country` nor `countryCode` is usable.
 */
export const writeLocationSchema = z
  .union([
    z.object({
      country: z.string().nullish(),
      countryCode: z.string().length(2).nullish(),
      region: z.string().nullish(),
      city: z.string().nullish(),
      locality: z.string().nullish(),
      street: z.string().nullish(),
      postalCode: z.string().nullish(),
      name: z.string().nullish(),
    }),
    z.string(),
  ])
  .nullable()
  .optional();

/** Skill reference: a strong ref to a canonical skill record. */
export const skillRefSchema = z.object({
  uri: z.string(),
});

/**
 * Platforms accepted by the external-account write endpoint.
 *
 * NOTE: this list intentionally differs from `PLATFORM_LABELS` in the SDK's
 * `/taxonomy` subpath. `VALID_PLATFORMS` is what sifa-api's `POST /external-accounts`
 * endpoint enforces; `PLATFORM_LABELS` is the display taxonomy used by the profile
 * UI. Reconciling them is a separate follow-up (see #TBD). For now the two are
 * mirrored verbatim from their prior definitions to preserve behavior.
 */
export const VALID_PLATFORMS = [
  'rss',
  'fediverse',
  'twitter',
  'instagram',
  'github',
  'codeberg',
  'gitlab',
  'forgejo',
  'gitea',
  'youtube',
  'linkedin',
  'substack',
  'website',
  'orcid',
  'keyoxide',
  'other',
] as const;

export type ValidPlatform = (typeof VALID_PLATFORMS)[number];

// ---- pure sanitization primitives (previously in sifa-api/src/lib/sanitize.ts) ----

/**
 * Returns `input` when it is an http(s) URL string, else `null`. Blocks
 * dangerous schemes (`javascript:`, `data:`, etc.) from being stored and
 * later rendered.
 */
export function httpUrlOrNull(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  try {
    const url = new URL(input);
    return url.protocol === 'http:' || url.protocol === 'https:' ? input : null;
  } catch {
    return null;
  }
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Strict calendar-date validator. Returns `true` for `YYYY-MM-DD` strings
 * that name a real day, rejecting impossible values (`2024-02-30`, `2024-13-01`)
 * by requiring the JavaScript `Date` round-trip to preserve the input.
 */
export function isValidDateOnly(input: unknown): boolean {
  if (typeof input !== 'string' || !DATE_ONLY_RE.test(input)) return false;
  const parsed = new Date(`${input}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(input);
}

// ---- shared write-schema fragments used by multiple sections ----

/**
 * Portable org entity identifier (Wikidata / ROR / LEI / sifa.id URI) chosen
 * from the typeahead. Constrained to http(s) so a script-bearing scheme can't
 * be written to the PDS record. Absent for free-text / unlinked records.
 * Shared by the org-bearing sections (position, education, certification,
 * volunteering, course, honor).
 */
export const entityRefSchema = z
  .string()
  .url()
  .refine((s) => /^https?:\/\//i.test(s), { message: 'entityRef must be an http(s) URL' })
  .max(2048)
  .optional();

/**
 * One proof link on an involvement record (`id.sifa.defs#artifactLink`).
 * Only http(s) URLs are accepted so a dangerous scheme is never written to
 * the PDS.
 */
export const artifactLinkSchema = z.object({
  url: z
    .string()
    .max(2048)
    .refine((v) => httpUrlOrNull(v) !== null, 'must be an http(s) URL'),
  kind: z.string().max(64).nullable().optional(),
  label: z.string().max(2000).nullable().optional(),
});

/**
 * Reference to a record by at-uri, with an optional CID
 * (`id.sifa.defs#externalRecordRef`).
 */
export const externalRecordRefSchema = z.object({
  uri: z.string().regex(/^at:\/\/[^/\s]+\/[^/\s]+\/[^/\s]+$/, 'must be an at-uri'),
  // CIDv0 (`Qm…`) or CIDv1 (base32, `b…`). Loose but rejects arbitrary strings.
  cid: z
    .string()
    .max(256)
    .regex(/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]+)$/, 'must be a CID')
    .optional(),
});

/** Link attached to a presentation record. */
export const presentationLinkSchema = z.object({
  uri: z
    .string()
    .max(2048)
    .refine((v) => httpUrlOrNull(v) !== null, 'must be an http(s) URL'),
  label: z.string().max(640).nullable().optional(),
  type: z.string().max(256).nullable().optional(),
});
