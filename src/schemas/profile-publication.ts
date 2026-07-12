import { z } from 'zod';

import { datetimeSchema, didSchema, maxGraphemes, partialDateSchema, uriSchema } from './shared.js';

/** Author shape from `id.sifa.profile.publication#author`. */
export const PublicationAuthorSchema = z.object({
  name: z.string().min(1).refine(maxGraphemes(100)).max(1000),
  did: didSchema.optional(),
});

export type PublicationAuthor = z.infer<typeof PublicationAuthorSchema>;

/** Zod schema for `id.sifa.profile.publication` records. */
export const ProfilePublicationRecordSchema = z.object({
  title: z.string().min(1).refine(maxGraphemes(200)).max(2000),
  subtitle: z.string().refine(maxGraphemes(200)).max(2000).optional(),
  publisher: z.string().refine(maxGraphemes(100)).max(1000).optional(),
  url: uriSchema.optional(),
  description: z.string().refine(maxGraphemes(5000)).max(50000).optional(),
  authors: z.array(PublicationAuthorSchema).max(50).optional(),
  publishedAt: partialDateSchema.optional(),
  createdAt: datetimeSchema,
});

export type ProfilePublicationRecord = z.infer<typeof ProfilePublicationRecordSchema>;
