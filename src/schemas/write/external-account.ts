import { z } from 'zod';

import { VALID_PLATFORMS, normalizeUrl } from './shared.js';

/** Schema enforced by `POST /external-accounts` on sifa-api. */
export const ExternalAccountWriteSchema = z.object({
  platform: z.enum(VALID_PLATFORMS),
  url: z.string().max(2000).transform(normalizeUrl).pipe(z.string().url()),
  label: z.string().max(100).optional(),
  feedUrl: z.string().max(2000).transform(normalizeUrl).pipe(z.string().url()).optional(),
});

export type ExternalAccountWriteInput = z.infer<typeof ExternalAccountWriteSchema>;
