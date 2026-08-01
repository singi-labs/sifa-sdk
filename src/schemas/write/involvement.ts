import { z } from 'zod';

import { projectMemberWriteSchema } from './project.js';

import {
  artifactLinkSchema,
  entityRefSchema,
  externalRecordRefSchema,
  optionalUrl,
  skillRefSchema,
  writeLocationSchema,
} from './shared.js';

/**
 * Schema enforced by the generic-record write endpoint for `id.sifa.profile.involvement`.
 *
 * Represents contribution to an upstream project or community
 * (open-source maintainership, community volunteering, etc.). `upstream` /
 * `upstreamDid` / `upstreamUrl` describe what the user contributed to;
 * `links` collect proof artifacts.
 */
export const InvolvementWriteSchema = z.object({
  kind: z.string().min(1).max(256),
  upstream: z.string().max(2560).nullable().optional(),
  upstreamDid: z
    .string()
    .regex(/^did:[a-z]+:[^\s]+$/, 'must be a DID')
    .nullable()
    .optional(),
  upstreamUrl: optionalUrl(),
  role: z.string().max(2560).nullable().optional(),
  description: z.string().max(50000).nullable().optional(),
  // Freeform YYYY / YYYY-MM / YYYY-MM-DD; validated loosely so partial dates pass.
  startedAt: z.string().max(32).nullable().optional(),
  endedAt: z.string().max(32).nullable().optional(),
  links: z.array(artifactLinkSchema).max(50).nullable().optional(),
  /** Other people who worked on this alongside you. Same shape as project members. */
  collaborators: z.array(projectMemberWriteSchema).max(50).optional(),
  /** The same involvement as recorded on another person's profile. */
  sameAs: externalRecordRefSchema.optional(),
  entityRef: entityRefSchema,
  location: writeLocationSchema,
  skills: z.array(skillRefSchema).max(50).nullable().optional(),
});

export type InvolvementWriteInput = z.infer<typeof InvolvementWriteSchema>;
