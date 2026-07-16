import { z } from 'zod';

import { entityRefSchema } from './shared.js';

/** Schema enforced by the generic-record write endpoint for `id.sifa.profile.course`. */
export const CourseWriteSchema = z.object({
  name: z.string().min(1).max(200),
  number: z.string().max(50).nullable().optional(),
  institution: z.string().max(256).nullable().optional(),
  entityRef: entityRefSchema,
  /**
   * at-uri of the linked `id.sifa.profile.certification` record. Structurally
   * validated (`at://authority/collection/rkey`) so a bad value can't be
   * stored and later split into a bogus rkey.
   */
  credential: z
    .string()
    .max(512)
    .regex(/^at:\/\/[^/\s]+\/[^/\s]+\/[^/\s]+$/, 'must be an at-uri')
    .nullable()
    .optional(),
  /**
   * RFC 3339 datetime the course was completed. The editor collects month
   * granularity (YYYY-MM) and converts to a datetime before the write; stored
   * and passed through as-is, mirroring `certification.issuedAt`.
   */
  completedAt: z.string().nullable().optional(),
});

export type CourseWriteInput = z.infer<typeof CourseWriteSchema>;
