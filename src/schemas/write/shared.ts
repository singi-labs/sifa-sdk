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
