import { z } from 'zod';

import { artifactLinkSchema, entityRefSchema } from './shared.js';

/**
 * Schema enforced by `POST /profile/investment` on sifa-api.
 *
 * An investment is capital the person put in. Roles with duties -- board seats,
 * advisory work -- are positions and use `PositionWriteSchema` instead.
 *
 * Every optional field is nullable so a client can clear it. Omitting a field on
 * update leaves the stored value in place, which would let a corrected status or a
 * withdrawn amount silently persist.
 */
export const InvestmentWriteSchema = z.object({
  /** For a limited-partner entry this names the fund, not a portfolio company. */
  company: z.string().min(1).max(256),
  companyDid: z.string().max(256).nullable().optional(),
  entityRef: entityRefSchema.nullable(),
  role: z.string().max(256).nullable().optional(),
  stage: z.string().max(256).nullable().optional(),
  status: z.string().max(256).nullable().optional(),
  via: z.string().max(256).nullable().optional(),
  viaDid: z.string().max(256).nullable().optional(),
  viaEntityRef: entityRefSchema.nullable(),
  /**
   * Optional and empty by default -- cheque size is a personal financial disclosure.
   * Structured rather than free text: an unparseable money string cannot be repaired
   * once people have written them.
   */
  amount: z
    .object({
      value: z.number().int().min(0),
      currency: z.string().length(3),
    })
    .nullable()
    .optional(),
  startedAt: z.string().nullable().optional(),
  endedAt: z.string().nullable().optional(),
  description: z.string().max(50000).nullable().optional(),
  links: z.array(artifactLinkSchema).max(50).nullable().optional(),
});

export type InvestmentWriteInput = z.infer<typeof InvestmentWriteSchema>;
