import { isVisibleActivityItem } from '../cards/visibility.js';
import { isValidRgbColor } from '../format/wcag-contrast.js';
import { getActivityTier } from '../taxonomy/activity-tiers.js';
import type { ActivityItem } from './activity-item.js';
import type {
  StreamCardBody,
  StreamCardVM,
  StreamExternalLink,
  StreamMedia,
  StreamSource,
  StreamTheme,
} from './stream-card-vm.js';
import { verbForCollection, type StreamVerb } from './verbs.js';

/** Neutral fallback token — matches sifa-api's synthetic app-registry entry. */
const DEFAULT_SOURCE_COLOR = 'slate';

/**
 * Options for {@link toStreamCardVM}. Kept out of the record so the transform
 * stays pure (no I/O): the app registry is runtime data, so callers inject a
 * color resolver built from the registry they already fetched.
 */
export interface ToStreamCardVMOptions {
  /**
   * Resolve an app's design-token color NAME (not a hex literal) from its
   * appId. Falls back to `slate` when unresolved.
   */
  resolveSourceColor?: (appId: string) => string | undefined;
}

// ---------------------------------------------------------------------------
// Small pure helpers
// ---------------------------------------------------------------------------

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** at://did:plc:xxx/collection/rkey → the authoring DID. */
function didFromUri(uri: string): string | undefined {
  const match = uri.match(/^at:\/\/(did:[^/]+)\//);
  return match?.[1];
}

/** Extract the CID from an AT Protocol blob ref (`ref.$link` or a bare string). */
function blobCid(blob: unknown): string | undefined {
  const rec = asRecord(blob);
  if (!rec) return undefined;
  const ref = rec.ref;
  if (typeof ref === 'string') return ref;
  const link = asRecord(ref)?.['$link'];
  return typeof link === 'string' ? link : undefined;
}

function aspectRatio(value: unknown): { width: number; height: number } | undefined {
  const rec = asRecord(value);
  const width = rec?.width;
  const height = rec?.height;
  if (typeof width === 'number' && typeof height === 'number') return { width, height };
  return undefined;
}

// ---------------------------------------------------------------------------
// Chrome
// ---------------------------------------------------------------------------

function buildSource(item: ActivityItem, options: ToStreamCardVMOptions): StreamSource {
  return {
    appId: item.appId,
    label: item.appName,
    color: options.resolveSourceColor?.(item.appId) ?? DEFAULT_SOURCE_COLOR,
  };
}

const TITLE_BY_VERB: Record<StreamVerb, (label: string) => string> = {
  posted: (label) => `Posted on ${label}`,
  reposted: () => 'Reposted a post',
  published: (label) => `Published on ${label}`,
  presented: () => 'Gave a presentation',
  endorsed: () => 'Wrote an endorsement',
  joined: (label) => `Joined ${label}`,
  shipped: (label) => `Shipped on ${label}`,
  created: (label) => `Created a record on ${label}`,
};

function buildTitle(verb: StreamVerb, label: string): string {
  return TITLE_BY_VERB[verb](label);
}

/** Per-record RGB theme (publication / standard-site cards). Validated. */
function readTheme(record: Record<string, unknown> | null): StreamTheme | undefined {
  const theme = asRecord(record?.publicationTheme ?? record?.theme);
  if (!theme) return undefined;
  const { background, foreground, accent } = theme;
  if (isValidRgbColor(background) && isValidRgbColor(foreground) && isValidRgbColor(accent)) {
    return { background, foreground, accent };
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Bluesky post body
// ---------------------------------------------------------------------------

function bskyImages(embed: Record<string, unknown>, did: string): StreamMedia[] {
  const images = embed.images;
  if (!Array.isArray(images)) return [];
  const out: StreamMedia[] = [];
  for (const raw of images) {
    const img = asRecord(raw);
    if (!img) continue;
    const cid = blobCid(img.image);
    if (!cid) continue;
    const media: StreamMedia = { did, cid, alt: asNonEmptyString(img.alt) ?? '' };
    const ratio = aspectRatio(img.aspectRatio);
    if (ratio) media.aspectRatio = ratio;
    const mimeType = asNonEmptyString(asRecord(img.image)?.mimeType);
    if (mimeType) media.mimeType = mimeType;
    out.push(media);
  }
  return out;
}

function bskyExternal(embed: Record<string, unknown>): StreamExternalLink | undefined {
  const external = asRecord(embed.external);
  if (!external) return undefined;
  const url = asNonEmptyString(external.uri);
  if (!url) return undefined;
  const link: StreamExternalLink = { url };
  const title = asNonEmptyString(external.title);
  if (title) link.title = title;
  // The raw record's `external.thumb` is a blob, not a URL. Resolving it would
  // require building a CDN URL, which is a surface concern — leave `thumb`
  // unset for now (M2 widens externalLink to carry blob refs if needed).
  return link;
}

interface BskyEmbedContent {
  media?: StreamMedia[];
  externalLink?: StreamExternalLink;
}

function bskyEmbedContent(record: Record<string, unknown>, did: string): BskyEmbedContent {
  const embed = asRecord(record.embed);
  if (!embed) return {};

  // recordWithMedia wraps the media (images/external) alongside a quoted record.
  const type = asNonEmptyString(embed['$type']);
  const target = type === 'app.bsky.embed.recordWithMedia' ? asRecord(embed.media) : embed;
  if (!target) return {};

  if (Array.isArray(target.images)) {
    const media = bskyImages(target, did);
    return media.length > 0 ? { media } : {};
  }
  if (target.external != null) {
    const externalLink = bskyExternal(target);
    return externalLink ? { externalLink } : {};
  }
  return {};
}

function applyBskyPost(
  vm: StreamCardVM,
  item: ActivityItem,
  record: Record<string, unknown> | null,
): StreamCardVM {
  if (!record) {
    vm.body = { kind: 'generic' };
    return vm;
  }

  const did = didFromUri(item.uri);
  const text = asNonEmptyString(record.text);
  const { media, externalLink } = did ? bskyEmbedContent(record, did) : {};
  if (media) vm.media = media;
  if (externalLink) vm.externalLink = externalLink;

  let body: StreamCardBody;
  if (text) body = { kind: 'text', text };
  else if (vm.media) body = { kind: 'media' };
  else if (vm.externalLink) body = { kind: 'link' };
  else body = { kind: 'generic' };
  vm.body = body;
  return vm;
}

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

/**
 * Normalize one {@link ActivityItem} into a framework-free {@link StreamCardVM}.
 * Pure: no I/O, no React, no DOM, and no resolved CDN URLs (media carries raw
 * blob refs so each surface builds its own URL). Total: always returns a VM.
 *
 * Reference implementations: the generic/unknown case, `app.bsky.feed.post`
 * (text + images + external embed), and reposts (whose `subject` is normalized
 * through this same function). Other collections fall through to the generic
 * body variant until M2 enriches them.
 */
export function toStreamCardVM(
  item: ActivityItem,
  options: ToStreamCardVMOptions = {},
): StreamCardVM {
  const verb = verbForCollection(item.collection);
  const source = buildSource(item, options);
  const record = asRecord(item.record);
  const timestamp = (record ? asNonEmptyString(record.createdAt) : undefined) ?? item.indexedAt;

  const vm: StreamCardVM = {
    uri: item.uri,
    cid: item.cid,
    verb,
    source,
    tier: getActivityTier(item.collection),
    timestamp,
    title: buildTitle(verb, source.label),
  };

  const theme = readTheme(record);
  if (theme) vm.theme = theme;

  // Repost / reply target, normalized through the same transform.
  if (item.subject) {
    vm.subject = { kind: 'post', post: toStreamCardVM(item.subject, options) };
  }

  if (item.collection === 'app.bsky.feed.post') {
    return applyBskyPost(vm, item, record);
  }

  vm.body = { kind: 'generic' };
  return vm;
}

/**
 * Map a list of activity items to VMs, applying {@link isVisibleActivityItem}
 * first so both surfaces (sifa-web, page.sifa.id) filter identically — a
 * filtered item produces no VM rather than a null-rendering card.
 */
export function toStreamCardVMs(
  items: ActivityItem[],
  options: ToStreamCardVMOptions = {},
): StreamCardVM[] {
  const out: StreamCardVM[] = [];
  for (const item of items) {
    if (isVisibleActivityItem(item.collection, item.record)) {
      out.push(toStreamCardVM(item, options));
    }
  }
  return out;
}
