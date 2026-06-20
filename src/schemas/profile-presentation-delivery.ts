import { z } from 'zod';

import { PresentationLinkSchema } from './profile-presentation.js';
import { datetimeSchema, externalRecordRefSchema, maxGraphemes } from './shared.js';

/**
 * Zod schema for `id.sifa.profile.presentationDelivery` records (one occasion
 * on which a presentation was delivered). Works standalone or linked to a
 * presentation and/or a calendar event. `role`, `mode`, and `status` are open
 * enums (knownValues); `mode`/`status` store the full
 * `community.lexicon.calendar.event` token.
 */
export const ProfilePresentationDeliveryRecordSchema = z.object({
  // Optional reference to the id.sifa.profile.presentation delivered here.
  presentationRef: externalRecordRefSchema.optional(),
  // Fallback title used when there is no presentationRef.
  title: z.string().refine(maxGraphemes(300)).max(3000).optional(),
  role: z.string().refine(maxGraphemes(64)).max(640).optional(),
  eventName: z.string().refine(maxGraphemes(300)).max(3000).optional(),
  // Calendar date as YYYY-MM-DD (day only).
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
    .optional(),
  location: z.string().refine(maxGraphemes(256)).max(2560).optional(),
  mode: z.string().optional(),
  status: z.string().optional(),
  links: z.array(PresentationLinkSchema).max(20).optional(),
  // Optional reference to a community.lexicon.calendar.event for this occasion.
  eventRef: externalRecordRefSchema.optional(),
  createdAt: datetimeSchema,
});

export type ProfilePresentationDeliveryRecord = z.infer<
  typeof ProfilePresentationDeliveryRecordSchema
>;
