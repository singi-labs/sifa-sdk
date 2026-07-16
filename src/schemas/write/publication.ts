import { z } from 'zod';

import { optionalUrl } from './shared.js';

/** Schema enforced by the generic-record write endpoint for `id.sifa.profile.publication`. */
export const PublicationWriteSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(2000).nullable().optional(),
  publisher: z.string().max(256).nullable().optional(),
  url: optionalUrl(),
  description: z.string().max(50000).nullable().optional(),
  publishedAt: z.string().nullable().optional(),
});

export type PublicationWriteInput = z.infer<typeof PublicationWriteSchema>;
