import { z } from 'zod';

import { externalRecordRefSchema, optionalUrl } from './shared.js';

/**
 * A person named as a member of the project. Naming someone is a claim: they
 * render as a bare handle until they publish an `id.sifa.confirmation`, and
 * confirming never puts this record on their profile. `role` is display only.
 */
export const projectMemberWriteSchema = z.object({
  did: z.string().regex(/^did:[a-z]+:[^\s]+$/, 'must be a DID'),
  role: z.string().max(256).nullable().optional(),
  title: z.string().max(1280).nullable().optional(),
});

/** Schema enforced by the generic-record write endpoint for `id.sifa.profile.project`. */
export const ProjectWriteSchema = z.object({
  name: z.string().min(1).max(256),
  description: z.string().max(50000).nullable().optional(),
  url: optionalUrl(),
  members: z.array(projectMemberWriteSchema).max(50).optional(),
  /** The same project as recorded elsewhere, when this entry duplicates someone else's. */
  projectRef: externalRecordRefSchema.optional(),
  startedAt: z.string().nullable().optional(),
  endedAt: z.string().nullable().optional(),
});

export type ProjectWriteInput = z.infer<typeof ProjectWriteSchema>;
