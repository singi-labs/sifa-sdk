/**
 * Adult-content gating for Bluesky activity items.
 *
 * Bluesky's official moderation labeler attaches content labels to
 * `app.bsky.feed.defs#postView.labels`. The four sex-and-violence labels
 * below are the ones we hide by default on Sifa: media is replaced with an
 * `<AdultContentWarning>` placeholder card in sifa-web. Authenticated
 * viewers can reveal per-card; anonymous viewers cannot.
 *
 * The list mirrors Bluesky's own globalLabelStrings; if the official set
 * grows (e.g. a new `extreme-violence` label), update this constant.
 *
 * Why a constant + predicate live in the SDK: the same logic needs to run
 * in sifa-web today and sifa-app tomorrow, and the API only forwards the
 * raw labels — the hide decision is a client concern.
 */

export const ADULT_CONTENT_LABELS = ['porn', 'sexual', 'nudity', 'graphic-media'] as const;

export type AdultContentLabel = (typeof ADULT_CONTENT_LABELS)[number];

/**
 * A single label entry as emitted by `app.bsky.feed.defs#postView.labels`.
 * Matches `com.atproto.label.defs#label` (the on-wire shape after the AppView
 * resolves a `postView`). `neg: true` marks a retraction.
 */
export interface ActivityLabel {
  val: string;
  src: string;
  uri: string;
  cts?: string;
  neg?: boolean;
}

/**
 * Return true if the item carries at least one adult-content label that is
 * not negated. Items without a `labels` field (every non-Bluesky source,
 * legacy responses) are treated as safe.
 */
export function hasAdultContent(item: { labels?: ActivityLabel[] }): boolean {
  const labels = item.labels;
  if (!labels || labels.length === 0) return false;
  return labels.some(
    (label) => !label.neg && (ADULT_CONTENT_LABELS as readonly string[]).includes(label.val),
  );
}
