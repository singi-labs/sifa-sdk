import { z } from 'zod';

import { entityRefSchema, isValidPartialDate } from './shared.js';

const AT_URI_RE = /^at:\/\/[^/\s]+\/[^/\s]+\/[^/\s]+$/;
const teachingDate = z
  .string()
  .refine(isValidPartialDate, 'must be a valid YYYY, YYYY-MM or YYYY-MM-DD date')
  .nullable()
  .optional();

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
  credential: z.string().max(512).regex(AT_URI_RE, 'must be an at-uri').nullable().optional(),
  /**
   * RFC 3339 datetime the course was completed. The editor collects month
   * granularity (YYYY-MM) and converts to a datetime before the write; stored
   * and passed through as-is, mirroring `certification.issuedAt`.
   */
  completedAt: z.string().nullable().optional(),
  /** `id.sifa.defs#courseRole` token. Absent or null means the user took the course. */
  role: z.string().max(64).nullable().optional(),
  /** Teaching period of a taught or assisted course (YYYY, YYYY-MM or YYYY-MM-DD). */
  startedAt: teachingDate,
  endedAt: teachingDate,
  /** at-uri of the `id.sifa.profile.position` the course was part of (taken or taught). */
  position: z.string().max(512).regex(AT_URI_RE, 'must be an at-uri').nullable().optional(),
  /** at-uri of the `id.sifa.profile.education` the course was part of. */
  education: z.string().max(512).regex(AT_URI_RE, 'must be an at-uri').nullable().optional(),
});

export type CourseWriteInput = z.infer<typeof CourseWriteSchema>;
