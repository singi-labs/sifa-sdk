import { z } from 'zod';

import {
  datetimeSchema,
  didSchema,
  maxGraphemes,
  partialDateSchema,
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
   * The same project as recorded elsewhere: another person's entry for shared
   * work, or a first-class `id.sifa.project.self` record. Set when you were
   * named on someone else's entry and keep your own version, so consumers can
   * tell the two describe one project instead of showing it twice.
   */
  projectRef: strongRefSchema.optional(),
  position: strongRefSchema.optional(),
  startedAt: partialDateSchema.optional(),
  endedAt: partialDateSchema.optional(),
  labels: selfLabelsSchema.optional(),
  createdAt: datetimeSchema,
});

export type ProfileProjectRecord = z.infer<typeof ProfileProjectRecordSchema>;
