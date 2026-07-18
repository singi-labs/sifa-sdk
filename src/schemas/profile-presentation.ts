import { z } from 'zod';

import { BlobRefSchema } from './blob-ref.js';
import { datetimeSchema, externalRecordRefSchema, maxGraphemes, uriSchema } from './shared.js';

/**
 * Duration of a presentation, in minutes. Mirrors
 * `id.sifa.profile.presentation#duration`: a fixed length (minMinutes only) or
 * a range (minMinutes to maxMinutes).
 */
export const PresentationDurationSchema = z
  .object({
    minMinutes: z.number().int().min(1),
    maxMinutes: z.number().int().min(1).optional(),
  })
  .refine((d) => d.maxMinutes === undefined || d.maxMinutes >= d.minMinutes, {
    message: 'maxMinutes must be greater than or equal to minMinutes',
    path: ['maxMinutes'],
  });

export type PresentationDuration = z.infer<typeof PresentationDurationSchema>;

/**
 * A related link for a presentation or one of its deliveries. Mirrors
 * `id.sifa.defs#presentationLink`. `type` is an open enum (knownValues), so any
 * string is accepted.
 */
export const PresentationLinkSchema = z.object({
  uri: uriSchema,
  label: z.string().refine(maxGraphemes(64)).max(640).optional(),
  type: z.string().optional(),
});

export type PresentationLink = z.infer<typeof PresentationLinkSchema>;

/** Zod schema for `id.sifa.profile.presentation` records (the reusable content). */
export const ProfilePresentationRecordSchema = z.object({
  title: z.string().min(1).refine(maxGraphemes(300)).max(3000),
  description: z.string().refine(maxGraphemes(5000)).max(50000).optional(),
  duration: PresentationDurationSchema.optional(),
  intendedAudiences: z
    .array(z.string().refine(maxGraphemes(100)).max(1000))
    .max(20)
    .optional(),
  links: z.array(PresentationLinkSchema).max(20).optional(),
  // Optional reference to a long-form write-up (pub.leaflet.document or
  // site.standard.document). Plain at-uri + optional cid so it tracks edits.
  writeupRef: externalRecordRefSchema.optional(),
  // Optional uploaded cover image for the talk page.
  coverImage: BlobRefSchema.optional(),
  createdAt: datetimeSchema,
});

export type ProfilePresentationRecord = z.infer<typeof ProfilePresentationRecordSchema>;
