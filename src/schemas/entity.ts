import { z } from 'zod';

/**
 * Organization entity-resolution payloads (#159). Shared by the typeahead,
 * selection, and grow-on-demand import-search endpoints on sifa-api.
 */

/**
 * A nullable string constrained to an http(s) URL. Rejects `javascript:` and
 * other script-bearing schemes at the SDK boundary so a hostile API response
 * cannot smuggle an XSS payload into a rendered `href`/`src`. Note: Wikidata
 * entity URIs are canonically `http://`, so both http and https are allowed.
 */
const httpUrlNullable = z
  .string()
  .refine((s) => /^https?:\/\//i.test(s), { message: 'must be an http(s) URL' })
  .nullable();

const searchResultCommon = {
  kind: z.string(),
  name: z.string(),
  domain: z.string().nullable(),
  country: z.string().nullable(),
  logoUrl: httpUrlNullable,
  parentName: z.string().nullable(),
};

/**
 * A single typeahead row. Discriminated on `source`: a curated `entity` row
 * carries `entityId`, a `pdl` staging row carries `pdlId`. The union guarantees
 * the identifier for the row's source is always present, so a stable React key
 * can never be `entity:undefined`. The disambiguation fields
 * (domain/country/parentName) drive the dropdown display.
 */
export const EntitySearchResultSchema = z.discriminatedUnion('source', [
  z.object({
    source: z.literal('entity'),
    entityId: z.number().int().positive(),
    ...searchResultCommon,
  }),
  z.object({
    source: z.literal('pdl'),
    pdlId: z.string().min(1),
    ...searchResultCommon,
  }),
]);
export type EntitySearchResult = z.infer<typeof EntitySearchResultSchema>;

/** Response of `GET /api/entities/search`. */
export const EntitySearchResponseSchema = z.object({
  results: z.array(EntitySearchResultSchema),
  hasMore: z.boolean(),
});
export type EntitySearchResponse = z.infer<typeof EntitySearchResponseSchema>;

/**
 * Body of `POST /api/entities/select`: promote a PDL row OR bump an entity.
 * Exactly one of `entityId`/`pdlId` must be present -- supplying both is
 * ambiguous (the server would have to silently pick one) and is rejected.
 */
export const EntitySelectRequestSchema = z
  .object({
    entityId: z.number().int().positive().optional(),
    pdlId: z.string().min(1).optional(),
  })
  .refine((v) => (v.entityId != null) !== (v.pdlId != null), {
    message: 'exactly one of entityId or pdlId is required',
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
  entityRef: httpUrlNullable,
});
export type EntitySelectResponse = z.infer<typeof EntitySelectResponseSchema>;

/** Response of `POST /api/entities/import-search`. */
export const EntityImportSearchResponseSchema = z.object({
  results: z.array(EntitySearchResultSchema),
});
export type EntityImportSearchResponse = z.infer<typeof EntityImportSearchResponseSchema>;

/**
 * Body of the domain grow-on-demand endpoints (`POST /api/entities/resolve-domain`
 * and `POST /api/entities/mint-domain`). The server re-validates the value as a
 * registrable domain; 253 is the max DNS name length.
 */
export const EntityResolveDomainRequestSchema = z.object({
  domain: z.string().min(1).max(253),
});
export type EntityResolveDomainRequest = z.infer<typeof EntityResolveDomainRequestSchema>;

/**
 * Response of `POST /api/entities/resolve-domain` (grow-on-demand Branch 1). Any
 * notable companies whose official website is the domain, imported from Wikidata.
 * `canMint` is true when nothing notable matched AND the domain is eligible for
 * the user-initiated mint-from-domain path -- it drives the "Add <domain>"
 * affordance.
 */
export const EntityResolveDomainResponseSchema = z.object({
  results: z.array(EntitySearchResultSchema),
  canMint: z.boolean(),
});
export type EntityResolveDomainResponse = z.infer<typeof EntityResolveDomainResponseSchema>;

/**
 * Response of `POST /api/entities/mint-domain` (grow-on-demand Branch 2). The
 * linkable entity minted from (or already resolved for) the domain. A non-2xx
 * status (e.g. the domain is not mintable, or the site yielded nothing usable)
 * surfaces as a thrown error, not a null result.
 */
export const EntityMintDomainResponseSchema = z.object({
  result: EntitySearchResultSchema,
});
export type EntityMintDomainResponse = z.infer<typeof EntityMintDomainResponseSchema>;
