import type { BasicTheme } from './schemas.js';

/**
 * Publication metadata embedded in the augmented activity view by
 * sifa-api when an external link card matches an indexed publication.
 *
 * `uri` is the publication's AT-URI (e.g.
 * `at://did:plc:abc/site.standard.publication/xyz`). `theme` carries
 * the publication's own colors when supplied — clients should apply a
 * WCAG min-contrast fallback before honoring them.
 *
 * `icon` is left as `unknown` here because its representation depends
 * on the surface: blob ref on the wire, CDN URL after resolution.
 */
export interface PublicationSource {
  uri: string;
  title: string;
  icon?: unknown;
  theme?: BasicTheme;
}

/**
 * Shape attached to activity items whose external link card URL matches
 * a Standard.site record. Mirrors the relevant fields of bsky's
 * `StandardSiteEmbed` view so a sifa-web renderer can be near-1:1.
 *
 * `associatedRefs` carries AT-URIs the client may use in Phase 4 to
 * query subscription state for the viewer.
 */
export interface StandardSiteEmbedView {
  uri: string;
  source: PublicationSource;
  associatedRefs: { uri: string }[];
  createdAt?: string;
  readingTime?: number;
}

export const STANDARD_SITE_PUBLICATION_NSID = 'site.standard.publication' as const;
export const STANDARD_SITE_DOCUMENT_NSID = 'site.standard.document' as const;
export const STANDARD_SITE_SUBSCRIPTION_NSID = 'site.standard.graph.subscription' as const;
export const STANDARD_SITE_RECOMMEND_NSID = 'site.standard.graph.recommend' as const;

/**
 * Pre-defined OAuth permission-set the consumer apps request to write
 * subscription + recommend records on behalf of the viewer. The actual
 * permission-set is published under
 * `at://did:plc:re3ebnp5v7ffagz6rb6xfei4/com.atproto.lexicon.schema/site.standard.authSocial`.
 */
export const STANDARD_SITE_AUTH_SOCIAL_NSID = 'site.standard.authSocial' as const;

const COLLECTION_SET = new Set<string>([
  STANDARD_SITE_PUBLICATION_NSID,
  STANDARD_SITE_DOCUMENT_NSID,
  STANDARD_SITE_SUBSCRIPTION_NSID,
  STANDARD_SITE_RECOMMEND_NSID,
]);

/**
 * True when the AT-URI's collection segment is a Standard.site
 * collection. Useful for detecting Standard.site embed augmentation on
 * arbitrary activity items.
 */
export function isStandardSiteAtUri(uri: string): boolean {
  if (!uri.startsWith('at://')) return false;
  const segments = uri.slice('at://'.length).split('/');
  const collection = segments[1];
  return collection !== undefined && COLLECTION_SET.has(collection);
}

/**
 * True when any `associatedRefs[].uri` is a Standard.site collection
 * AT-URI. The bsky client uses the same check to gate the
 * `StandardSiteEmbed` renderer.
 */
export function hasStandardSiteAssociatedRef(refs: { uri: string }[] | undefined): boolean {
  if (!refs) return false;
  return refs.some((r) => isStandardSiteAtUri(r.uri));
}
