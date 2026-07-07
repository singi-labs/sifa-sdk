import { z } from 'zod';

/**
 * Organization entity-resolution payloads (#159). Shared by the typeahead,
 * selection, and grow-on-demand import-search endpoints on sifa-api.
 */

/** A single typeahead row. `source` distinguishes a curated entity from a
 * People Data Labs staging row; the disambiguation fields (domain/country/
 * parentName) drive the dropdown display. */
export const EntitySearchResultSchema = z.object({
  source: z.enum(['entity', 'pdl']),
  /** Present when `source === 'entity'`. */
  entityId: z.number().int().positive().optional(),
  /** Present when `source === 'pdl'`. */
  pdlId: z.string().optional(),
  kind: z.string(),
  name: z.string(),
  domain: z.string().nullable(),
  country: z.string().nullable(),
  logoUrl: z.string().nullable(),
  parentName: z.string().nullable(),
});
export type EntitySearchResult = z.infer<typeof EntitySearchResultSchema>;

/** Response of `GET /api/entities/search`. */
export const EntitySearchResponseSchema = z.object({
  results: z.array(EntitySearchResultSchema),
  hasMore: z.boolean(),
});
export type EntitySearchResponse = z.infer<typeof EntitySearchResponseSchema>;

/** Body of `POST /api/entities/select`: promote a PDL row or bump an entity. */
export const EntitySelectRequestSchema = z
  .object({
    entityId: z.number().int().positive().optional(),
    pdlId: z.string().min(1).optional(),
  })
  .refine((v) => v.entityId != null || v.pdlId != null, {
    message: 'entityId or pdlId is required',
  });
export type EntitySelectRequest = z.infer<typeof EntitySelectRequestSchema>;

/** Response of `POST /api/entities/select`. `entityRef` is the portable
 * Wikidata/ROR/LEI URI to write to the position record, or null for a
 * PDL-only entity (its resolution stays AppView-side). */
export const EntitySelectResponseSchema = z.object({
  entityId: z.number().int().positive(),
  slug: z.string(),
  kind: z.string(),
  canonicalName: z.string(),
  domain: z.string().nullable(),
  entityRef: z.string().nullable(),
});
export type EntitySelectResponse = z.infer<typeof EntitySelectResponseSchema>;

/** Response of `POST /api/entities/import-search`. */
export const EntityImportSearchResponseSchema = z.object({
  results: z.array(EntitySearchResultSchema),
});
export type EntityImportSearchResponse = z.infer<typeof EntityImportSearchResponseSchema>;
