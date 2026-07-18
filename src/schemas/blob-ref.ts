import { z } from 'zod';

/**
 * Blob-ref passthrough shared by records that carry an uploaded blob (org logo,
 * presentation cover image, ...). Mirrors the `blobRefSchema` validated by the
 * sifa-api write endpoints -- the shape is validated, then written to the PDS
 * verbatim.
 */
export const BlobRefSchema = z.object({
  $type: z.literal('blob'),
  ref: z.object({ $link: z.string().min(1) }),
  mimeType: z.string().min(1).max(255),
  size: z.number().int().nonnegative(),
});

export type BlobRef = z.infer<typeof BlobRefSchema>;
