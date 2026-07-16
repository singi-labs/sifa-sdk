import { z } from 'zod';

import { optionalUrl } from './shared.js';

/** Schema enforced by the generic-record write endpoint for `id.sifa.profile.project`. */
export const ProjectWriteSchema = z.object({
  name: z.string().min(1).max(256),
  description: z.string().max(50000).nullable().optional(),
  url: optionalUrl(),
  startedAt: z.string().nullable().optional(),
  endedAt: z.string().nullable().optional(),
});

export type ProjectWriteInput = z.infer<typeof ProjectWriteSchema>;
