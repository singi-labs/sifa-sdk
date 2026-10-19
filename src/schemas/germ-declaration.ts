import { z } from 'zod';

/**
 * `showButtonTo` values the Germ lexicon declares. The lexicon lists them as
 * `knownValues`, not an enum, so the schema accepts any string; consumers must
 * treat an unknown value as "no button" (see `germButtonAudience`).
 */
export const GERM_SHOW_BUTTON_TO_VALUES = ['none', 'usersIFollow', 'everyone'] as const;

export type GermShowButtonTo = (typeof GERM_SHOW_BUTTON_TO_VALUES)[number];

/**
 * Zod schema for `com.germnetwork.declaration` (rkey `self`), the record a Germ
 * DM user publishes in their own repo.
 *
 * Only the fields an AppView reads are typed. The key material (`currentKey`,
 * `keyPackage`, `continuityProofs`) is opaque; `currentKey` is checked for shape
 * only, because an empty key means the DID is no longer bound to Germ. Unknown
 * keys pass through so a newer record version still parses.
 *
 * @see https://lexicon.garden/lexicon/did:plc:qyqmmncrm6qx33kpy7vqndik/com.germnetwork.declaration
 */
export const GermDeclarationRecordSchema = z
  .object({
    version: z.string().min(5).max(14),
    // JSON form (`{ $bytes }`, PDS and Jetstream) or decoded CBOR (`Uint8Array`).
    currentKey: z.union([z.object({ $bytes: z.string() }), z.instanceof(Uint8Array)]),
    messageMe: z
      .object({
        showButtonTo: z.string().min(1).max(100),
        messageMeUrl: z.string().min(1).max(2047),
      })
      .optional(),
  })
  .passthrough();

export type GermDeclarationRecord = z.infer<typeof GermDeclarationRecordSchema>;
