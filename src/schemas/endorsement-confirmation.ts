import { z } from 'zod';

import { datetimeSchema, strongRefSchema } from './shared.js';

/**
 * Zod schema for `id.sifa.endorsement.confirmation` records.
 * Lives in the endorsee's PDS to approve display of an endorsement.
 */
export const EndorsementConfirmationRecordSchema = z.object({
  endorsement: strongRefSchema,
  /**
   * Skill record this endorsement applies to. Set when the endorsement proposed
   * a skill: the subject creates the record and links it here, because the
   * endorser cannot write to the subject's repository. Also set when a proposed
   * name matched a skill the subject already had.
   */
  skill: strongRefSchema.optional(),
  createdAt: datetimeSchema,
});

export type EndorsementConfirmationRecord = z.infer<typeof EndorsementConfirmationRecordSchema>;
