import { z } from 'zod';

import { datetimeSchema, maxGraphemes, strongRefSchema } from './shared.js';

/**
 * Relations shipped today. The lexicon declares these as `knownValues`, not an
 * enum, so the schema accepts any string: a consumer that meets a relation it
 * does not recognise should still see that the named person affirmed something.
 */
export const CONFIRMATION_RELATIONS = [
  'id.sifa.defs#coSpeaker',
  'id.sifa.defs#projectMember',
] as const;

export type ConfirmationRelation = (typeof CONFIRMATION_RELATIONS)[number];

/**
 * Zod schema for `id.sifa.confirmation` records.
 *
 * The subject strongRef carries no collection constraint by design: one record
 * type affirms a co-speaker credit, a project membership, and whatever
 * people-link relations come next. Resolve it by AT-URI; the CID pins the
 * version seen at confirmation time and is an integrity hint, not a join key,
 * because the claimer editing their record changes its CID without
 * invalidating anything.
 */
export const ConfirmationRecordSchema = z.object({
  subject: strongRefSchema,
  relation: z.string().min(1),
  /**
   * Name the subject record carried at confirmation time. Lives in the
   * confirming person's repo, out of the claimer's reach, so a rename after
   * the fact is detectable.
   */
  subjectName: z.string().refine(maxGraphemes(300)).max(3000).optional(),
  createdAt: datetimeSchema,
});

export type ConfirmationRecord = z.infer<typeof ConfirmationRecordSchema>;
