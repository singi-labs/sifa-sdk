import { z } from 'zod';

import { VALID_PLATFORMS, normalizeUrl } from './shared.js';

/** Schema enforced by `POST /external-accounts` on sifa-api. */
export const ExternalAccountWriteSchema = z.object({
  platform: z.enum(VALID_PLATFORMS),
  url: z.string().max(2000).transform(normalizeUrl).pipe(z.string().url()),
  // Trimmed, and a blank label is dropped rather than written to the PDS as a value.
  label: z
    .string()
    .max(100)
    .optional()
    .transform((v) => v?.trim() || undefined),
  feedUrl: z.string().max(2000).transform(normalizeUrl).pipe(z.string().url()).optional(),
});

export type ExternalAccountWriteInput = z.infer<typeof ExternalAccountWriteSchema>;
