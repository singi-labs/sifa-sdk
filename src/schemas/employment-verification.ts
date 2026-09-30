import { z } from 'zod';

import {
  datetimeSchema,
  didSchema,
  externalRecordRefSchema,
  maxGraphemes,
  partialDateSchema,
  uriSchema,
} from './shared.js';

export const EMPLOYMENT_STATUS_TOKENS = [
  'id.sifa.defs#employmentCurrent',
  'id.sifa.defs#employmentPast',
] as const;

export const VERIFICATION_METHOD_TOKENS = [
  'id.sifa.defs#verifiedByEmail',
  'id.sifa.defs#verifiedByOrg',
  'id.sifa.defs#verifiedByDirectory',
  'id.sifa.defs#verifiedByPeer',
] as const;

/**
 * Zod schema for `id.sifa.verification.employment` records: Sifa's own
 * statement that it verified a person's employment, written only by Sifa's
 * issuer account. Strict on purpose: the lexicon says the record never
 * carries an email address or domain, so an unknown key is refused rather
 * than passed through.
 */
export const EmploymentVerificationRecordSchema = z
  .object({
    $type: z.literal('id.sifa.verification.employment').optional(),
    subject: didSchema,
    position: externalRecordRefSchema,
    status: z.enum(EMPLOYMENT_STATUS_TOKENS),
    methods: z.array(z.string().min(1)).min(1).max(4),
    title: z.string().min(1).refine(maxGraphemes(256)).max(2560),
    startedAt: partialDateSchema,
    endedAt: partialDateSchema.optional(),
    entityRef: uriSchema.optional(),
    organization: didSchema.optional(),
    evidence: z.array(externalRecordRefSchema).max(20).optional(),
    verifiedAt: datetimeSchema,
    expiresAt: datetimeSchema.optional(),
    createdAt: datetimeSchema,
  })
  .strict();

export type EmploymentVerificationRecord = z.infer<typeof EmploymentVerificationRecordSchema>;

export interface ResolveEmploymentVerificationOptions {
  /** DID of the repository the record was read from. */
  repoDid: string;
  /** Sifa's published issuer DID, the only repository whose records count. */
  issuerDid: string;
  /** For the expiry check; defaults to now. */
  now?: Date;
}

export type EmploymentVerificationResolution =
  | { ok: true; record: EmploymentVerificationRecord }
  | { ok: false; reason: 'not-issuer' | 'malformed' | 'lapsed' };

/**
 * Apply the one trust rule for issued verifications: the record counts only
 * when it sits in the issuer's own repository, parses, and has not lapsed.
 */
export function resolveEmploymentVerification(
  value: unknown,
  options: ResolveEmploymentVerificationOptions,
): EmploymentVerificationResolution {
  if (options.repoDid !== options.issuerDid) return { ok: false, reason: 'not-issuer' };
  const parsed = EmploymentVerificationRecordSchema.safeParse(value);
  if (!parsed.success) return { ok: false, reason: 'malformed' };
  const now = options.now ?? new Date();
  if (parsed.data.expiresAt && new Date(parsed.data.expiresAt).getTime() <= now.getTime()) {
    return { ok: false, reason: 'lapsed' };
  }
  return { ok: true, record: parsed.data };
}
