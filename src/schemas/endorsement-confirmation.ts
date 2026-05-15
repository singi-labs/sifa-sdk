import { z } from 'zod';

import { datetimeSchema, strongRefSchema } from './shared.js';

/**
 * Zod schema for `id.sifa.endorsement.confirmation` records.
 * Lives in the endorsee's PDS to approve display of an endorsement.
 */
export const EndorsementConfirmationRecordSchema = z.object({
  endorsement: strongRefSchema,
  createdAt: datetimeSchema,
});

export type EndorsementConfirmationRecord = z.infer<typeof EndorsementConfirmationRecordSchema>;
