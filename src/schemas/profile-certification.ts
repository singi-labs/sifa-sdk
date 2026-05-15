import { z } from 'zod';

import { datetimeSchema, didSchema, maxGraphemes, selfLabelsSchema, uriSchema } from './shared.js';

/** Zod schema for `id.sifa.profile.certification` records. */
export const ProfileCertificationRecordSchema = z.object({
  name: z.string().min(1).refine(maxGraphemes(100)).max(1000),
  authority: z.string().refine(maxGraphemes(100)).max(1000).optional(),
  authorityDid: didSchema.optional(),
  credentialId: z.string().refine(maxGraphemes(100)).max(1000).optional(),
  credentialUrl: uriSchema.optional(),
  issuedAt: datetimeSchema.optional(),
  expiresAt: datetimeSchema.optional(),
  labels: selfLabelsSchema.optional(),
  createdAt: datetimeSchema,
});

export type ProfileCertificationRecord = z.infer<typeof ProfileCertificationRecordSchema>;
