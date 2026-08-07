import { z } from 'zod';

import { ArtifactLinkSchema } from './profile-involvement.js';
import {
  datetimeSchema,
  didSchema,
  maxGraphemes,
  partialDateSchema,
  selfLabelsSchema,
} from './shared.js';

// Portable entity identifier (Wikidata/ROR/LEI URI) from the typeahead. Constrained
// to http(s) so a script-bearing scheme is never a valid ref (#159). An investment
// carries two of these -- the company and the vehicle -- so the check is shared.
const entityRefField = z
  .string()
  .url()
  .refine((s) => /^https?:\/\//i.test(s), { message: 'entityRef must be an http(s) URL' })
  .max(2048)
  .optional();

/**
 * A deliberately structured amount. Free text was rejected here: an unparseable
 * money string is worse than no amount at all, and cannot be repaired once people
 * have written them.
 */
export const InvestmentAmountSchema = z.object({
  /** Whole major currency units (euros, not cents). Cheque sizes are round numbers. */
  value: z.number().int().min(0),
  /** ISO 4217 three-letter code, uppercase. */
  currency: z.string().length(3),
});

/** Zod schema for `id.sifa.profile.investment` records. */
export const ProfileInvestmentRecordSchema = z
  .object({
    /** For a limited-partner entry this names the fund, not a portfolio company. */
    company: z.string().min(1).refine(maxGraphemes(256)).max(2560),
    companyDid: didSchema.optional(),
    entityRef: entityRefField,
    role: z.string().optional(),
    stage: z.string().optional(),
    status: z.string().optional(),
    /** The vehicle the capital went through. Absent for a cheque in the person's own name. */
    via: z.string().refine(maxGraphemes(256)).max(2560).optional(),
    viaDid: didSchema.optional(),
    viaEntityRef: entityRefField,
    /**
     * Optional and empty by default. Cheque size is a personal financial disclosure,
     * and clients must not prompt for it.
     */
    amount: InvestmentAmountSchema.optional(),
    startedAt: partialDateSchema.optional(),
    endedAt: partialDateSchema.optional(),
    description: z.string().refine(maxGraphemes(5000)).max(50000).optional(),
    links: z.array(ArtifactLinkSchema).max(50).optional(),
    labels: selfLabelsSchema.optional(),
    createdAt: datetimeSchema,
  })
  .passthrough();

export type ProfileInvestmentRecord = z.infer<typeof ProfileInvestmentRecordSchema>;
