import { z } from 'zod';

import { optionalUrl } from './shared.js';

/** Schema enforced by the generic-record write endpoint for `id.sifa.profile.certification`. */
export const CertificationWriteSchema = z.object({
  name: z.string().min(1).max(256),
  authority: z.string().max(256).nullable().optional(),
  credentialId: z.string().max(256).nullable().optional(),
  credentialUrl: optionalUrl(),
  issuedAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
});

export type CertificationWriteInput = z.infer<typeof CertificationWriteSchema>;
