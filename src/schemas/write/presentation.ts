import { z } from 'zod';

import { BlobRefSchema } from '../blob-ref.js';
import { externalRecordRefSchema, presentationLinkSchema } from './shared.js';

/**
 * Schema enforced by the generic-record write endpoint for `id.sifa.profile.presentation`.
 *
 * Describes a talk / presentation the user can give. `duration` bounds the
 * runtime; `intendedAudiences` names who it's aimed at; `writeupRef` is an
 * optional at-uri pointer to a companion writeup record.
 */
export const PresentationWriteSchema = z.object({
  title: z.string().min(1).max(3000),
  description: z.string().max(50000).nullable().optional(),
  duration: z
    .object({
      minMinutes: z.number().int().min(1),
      maxMinutes: z.number().int().min(1).optional(),
    })
    .refine((d) => d.maxMinutes === undefined || d.maxMinutes >= d.minMinutes, {
      message: 'maxMinutes must be greater than or equal to minMinutes',
      path: ['maxMinutes'],
    })
    .optional(),
  intendedAudiences: z.array(z.string().max(1000)).max(20).optional(),
  links: z.array(presentationLinkSchema).max(20).optional(),
  writeupRef: externalRecordRefSchema.optional(),
  coverImage: BlobRefSchema.nullable().optional(),
});

export type PresentationWriteInput = z.infer<typeof PresentationWriteSchema>;
