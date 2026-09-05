import { z } from 'zod';

import {
  datetimeSchema,
  didSchema,
  maxGraphemes,
  partialDateSchema,
  externalRecordRefSchema,
  selfLabelsSchema,
  strongRefSchema,
  uriSchema,
} from './shared.js';

/**
 * A person named as a member of a project. Mirrors `id.sifa.defs#projectMemberRef`.
 *
 * A claim by the record author, not a fact: the named person carries a display
 * name, avatar, and profile link only once they publish a matching
 * `id.sifa.confirmation`. `role` is display only, since a record living in
 * someone else's repository cannot grant write access to anything.
 */
export const projectMemberRefSchema = z.object({
  did: didSchema,
  role: z.string().optional(),
  title: z.string().refine(maxGraphemes(128)).max(1280).optional(),
});

export type ProjectMemberRef = z.infer<typeof projectMemberRefSchema>;

/** Zod schema for `id.sifa.profile.project` records. */
export const ProfileProjectRecordSchema = z.object({
  name: z.string().min(1).refine(maxGraphemes(256)).max(2560),
  description: z.string().refine(maxGraphemes(5000)).max(50000).optional(),
  url: uriSchema.optional(),
  members: z.array(projectMemberRefSchema).max(50).optional(),
  /**
   * The canonical `id.sifa.project.self` this personal entry corresponds to.
   * A composition link. For the same project recorded on someone else's
   * profile, see `sameAs`.
   */
  projectRef: strongRefSchema.optional(),
  /**
   * The same project as recorded on another person's profile. Each side stays
   * its own record; this only says the two describe one thing. Resolves by
   * AT-URI, since they will keep editing their copy.
   */
  sameAs: externalRecordRefSchema.optional(),
  position: strongRefSchema.optional(),
  startedAt: partialDateSchema.optional(),
  endedAt: partialDateSchema.optional(),
  labels: selfLabelsSchema.optional(),
  isPrimary: z.boolean().optional(),
  createdAt: datetimeSchema,
});

export type ProfileProjectRecord = z.infer<typeof ProfileProjectRecordSchema>;
