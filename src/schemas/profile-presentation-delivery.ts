import { z } from 'zod';

import { PresentationLinkSchema } from './profile-presentation.js';
import { datetimeSchema, externalRecordRefSchema, maxGraphemes } from './shared.js';

/**
 * Structured address for a delivery occasion. Mirrors
 * `community.lexicon.location.address` (all fields optional).
 */
const communityAddressSchema = z.object({
  country: z.string().optional(),
  postalCode: z.string().optional(),
  region: z.string().optional(),
  locality: z.string().optional(),
  street: z.string().optional(),
  name: z.string().optional(),
});

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
  // Structured community.lexicon.location.address for the occasion. The
  // free-text `location` string above stays as a legacy fallback.
  address: communityAddressSchema.optional(),
  mode: z.string().optional(),
  status: z.string().optional(),
  links: z.array(PresentationLinkSchema).max(20).optional(),
  // Optional reference to a community.lexicon.calendar.event for this occasion.
  eventRef: externalRecordRefSchema.optional(),
  // DIDs of co-speakers who presented alongside the author at this occasion.
  coSpeakers: z
    .array(z.string().regex(/^did:[a-z]+:[^\s]+$/, 'must be a DID'))
    .max(20)
    .optional(),
  createdAt: datetimeSchema,
});

export type ProfilePresentationDeliveryRecord = z.infer<
  typeof ProfilePresentationDeliveryRecordSchema
>;
