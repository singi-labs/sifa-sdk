import { z } from 'zod';

import { externalRecordRefSchema, isValidDateOnly, presentationLinkSchema } from './shared.js';

/**
 * Schema enforced by the generic-record write endpoint for `id.sifa.profile.presentationDelivery`.
 *
 * Records a specific delivery of a presentation (e.g., at a conference).
 * `presentationRef` optionally points at the parent `id.sifa.profile.presentation`
 * record; `eventRef` optionally links a Sifa event record; `coSpeakers` are
 * DIDs of people who delivered alongside the profile owner.
 */
export const PresentationDeliveryWriteSchema = z.object({
  presentationRef: externalRecordRefSchema.optional(),
  title: z.string().max(3000).nullable().optional(),
  role: z.string().max(640).nullable().optional(),
  eventName: z.string().max(3000).nullable().optional(),
  date: z.string().refine(isValidDateOnly, 'must be a valid YYYY-MM-DD date').nullable().optional(),
  location: z.string().max(2560).nullable().optional(),
  mode: z.string().max(256).nullable().optional(),
  status: z.string().max(256).nullable().optional(),
  links: z.array(presentationLinkSchema).max(20).optional(),
  eventRef: externalRecordRefSchema.optional(),
  coSpeakers: z
    .array(z.string().regex(/^did:[a-z]+:[^\s]+$/, 'must be a DID'))
    .max(20)
    .optional(),
});

export type PresentationDeliveryWriteInput = z.infer<typeof PresentationDeliveryWriteSchema>;
