import { z } from 'zod';

/**
 * Schema enforced by the org-profile write endpoint on sifa-api.
 *
 * Sifa-managed org identity: name + description + contact channel plus
 * `entityRefs` linking the org to portable identifiers (Wikidata / ROR /
 * LEI / sifa.id URI, http(s) enforced elsewhere).
 */
export const OrgProfileWriteSchema = z.object({
  name: z.string().min(1).max(2000),
  description: z.string().max(50000).nullable().optional(),
  logo: z.unknown().nullable().optional(),
  website: z.string().max(2048).nullable().optional(),
  entityRefs: z.array(z.string().max(2048)).max(20).nullable().optional(),
  contact: z.string().max(320).nullable().optional(),
  createdAt: z.string(),
});

export type OrgProfileWriteInput = z.infer<typeof OrgProfileWriteSchema>;
