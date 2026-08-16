/**
 * Linkblog-share detection for the Standard.site document family.
 *
 * A "linkblog" (e.g. Skyreader) writes a `site.standard.document` to the
 * user's PDS for every *external* article they share. Those documents are
 * valid Standard.site posts, so they surface in Sifa's activity stream and
 * profile portfolio as if the user authored them — but the user only shared
 * someone else's writing (sifa-workspace#351).
 *
 * These predicates identify such shares so callers can exclude them, while
 * leaving genuinely authored Standard.site posts (Leaflet, pckt, Offprint
 * essays) untouched.
 *
 * Signals, most to least reliable:
 *   1. The Skyreader provenance marker on the document (`skyreaderLinkblog`).
 *   2. The document's parent publication is itself a linkblog (the marker
 *      lives on the publication even when older documents lack their own).
 *      Callers resolve the publication and pass `publicationIsLinkblog`.
 *   3. A `links` entry with `rel: "repost"` — a quote-reshare, inherently
 *      not the user's own writing.
 *   4. Heuristic: a `links` entry with `rel: "related"` pointing to an
 *      external host different from the document's own publication host —
 *      the document's subject is an off-site article. Only applied when the
 *      caller supplies the resolved `publicationHost`, so an authored post
 *      that merely cites an external resource is never hidden on a guess.
 */

/**
 * Discovery marker Skyreader stamps on every linkblog publication and on
 * link-share documents. Value is a fixed URL, not a per-user value.
 */
export const SKYREADER_LINKBLOG_MARKER_URL = 'https://skyreader.app/linkblog';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** A non-empty `skyreaderLinkblog` marker field. */
function hasLinkblogMarker(record: Record<string, unknown>): boolean {
  const marker = record.skyreaderLinkblog;
  return typeof marker === 'string' && marker.length > 0;
}

function hostOf(uri: string): string | null {
  try {
    return new URL(uri).host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * True when a `site.standard.publication` record is a linkblog rather than an
 * authored publication — i.e. it carries the Skyreader provenance marker.
 */
export function isLinkblogPublication(record: unknown): boolean {
  return isRecord(record) && hasLinkblogMarker(record);
}

export interface LinkblogShareOptions {
  /**
   * True when the document's parent publication has been resolved and is
   * itself a linkblog (see {@link isLinkblogPublication}). Catches shares
   * whose document predates the per-document marker.
   */
  publicationIsLinkblog?: boolean;
  /**
   * Resolved host of the document's parent publication, enabling the
   * external-subject heuristic. Omit when the publication (hence its host)
   * could not be resolved — the heuristic then stays off.
   */
  publicationHost?: string;
}

/**
 * True when a `site.standard.document` is a shared/linkblogged external
 * article rather than the user's own writing. See the module comment for the
 * signal order.
 */
export function isLinkblogShareDocument(record: unknown, opts: LinkblogShareOptions = {}): boolean {
  if (!isRecord(record)) return false;

  // 1. Provenance marker on the document itself.
  if (hasLinkblogMarker(record)) return true;

  // 2. Parent publication is a linkblog (caller-resolved).
  if (opts.publicationIsLinkblog === true) return true;

  const links = record.links;
  if (!Array.isArray(links)) return false;

  const pubHost = opts.publicationHost?.toLowerCase();
  for (const link of links) {
    if (!isRecord(link) || typeof link.rel !== 'string') continue;

    // 3. Reshare of another record.
    if (link.rel === 'repost') return true;

    // 4. External-subject heuristic (only with a known publication host).
    if (link.rel === 'related' && pubHost && typeof link.uri === 'string') {
      const linkHost = hostOf(link.uri);
      if (linkHost && linkHost !== pubHost) return true;
    }
  }

  return false;
}
