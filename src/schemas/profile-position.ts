import { z } from 'zod';

import {
  datetimeSchema,
  didSchema,
  maxGraphemes,
  partialDateSchema,
  selfLabelsSchema,
  skillRefSchema,
} from './shared.js';

// Portable org entity identifier (Wikidata/ROR/LEI URI) from the typeahead.
// Constrained to http(s) so a script-bearing scheme is never a valid ref (#159).
// Shared by the two entity references on a position so the scheme check cannot
// drift between them.
const entityRefField = z
  .string()
  .url()
  .refine((s) => /^https?:\/\//i.test(s), { message: 'entityRef must be an http(s) URL' })
  .max(2048)
  .optional();

/** Zod schema for `id.sifa.profile.position` records. */
export const ProfilePositionRecordSchema = z
  .object({
    company: z.string().min(1).refine(maxGraphemes(100)).max(1000).optional(),
    companyDid: didSchema.optional(),
    entityRef: entityRefField,
    title: z.string().min(1).refine(maxGraphemes(100)).max(1000),
    description: z.string().refine(maxGraphemes(5000)).max(50000).optional(),
    employmentType: z.string().optional(),
    // Disclosure that the role is held as someone else's representative -- most often
    // a fund whose board seat this is. Capped at the lexicon's 256 graphemes rather
    // than the tighter limit used for `company`: a schema stricter than the lexicon
    // would reject records other clients can legally write.
    onBehalfOf: z.string().refine(maxGraphemes(256)).max(2560).optional(),
    // May resolve to an organization or to a person (a family-office principal); a DID
    // does not distinguish the two, so this stays permissive.
    onBehalfOfDid: didSchema.optional(),
    onBehalfOfEntityRef: entityRefField,
    workplaceType: z.string().optional(),
    location: z.unknown().optional(),
    startedAt: partialDateSchema,
    endedAt: partialDateSchema.optional(),
    // id.sifa.defs#skillRef -- at-uri only, no cid. Skills are mutable records
    // in the same repo, so the ref resolves live rather than pinning a version.
    skills: z.array(skillRefSchema).max(50).optional(),
    isPrimary: z.boolean().optional(),
    labels: selfLabelsSchema.optional(),
    createdAt: datetimeSchema,
  })
  .passthrough();

export type ProfilePositionRecord = z.infer<typeof ProfilePositionRecordSchema>;
