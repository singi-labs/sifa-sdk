/** Output variants served by the sifa-api blob proxy. */
export type BlobProxyVariant = 'thumb' | 'avatar';

/**
 * URL of the sifa-api blob proxy (`GET /api/blob/:did/:cid?v=`) for a blob
 * owned by `did`. The proxy fetches the blob from the owner's PDS, resizes it
 * (`thumb`: 1000px JPEG, `avatar`: 256px WebP) and caches it. Use it for blobs
 * the Bluesky image CDN refuses, such as very large originals.
 */
export function blobProxyUrl(
  baseUrl: string,
  did: string,
  cid: string,
  variant: BlobProxyVariant,
): string {
  const base = baseUrl.replace(/\/+$/, '');
  return `${base}/api/blob/${encodeURIComponent(did)}/${encodeURIComponent(cid)}?v=${variant}`;
}
