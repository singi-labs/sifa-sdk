/**
 * Per-collection visibility rules for activity items.
 *
 * These rules express "this record has nothing meaningful to render as a card"
 * — e.g. a BookHive shelf-add with no review/stars, or a BeaconBits pin with
 * no shout. They are a UX/card concern, distinct from the api-side blocklists
 * in sifa-api/atproto-app-registry that exclude whole collections (likes,
 * follows, games) or filter spammy record shapes (empty quote posts).
 *
 * Used in two places:
 * - sifa-api's activity feed pagination, so a page-of-N returns N visible
 *   items rather than silently-dropped placeholders.
 * - sifa-web's activity-feed component (and as defense-in-depth in the card
 *   components themselves), so the client never relies on a stale api.
 *
 * Adding a new rule = one PR to this file. Unknown collections default to
 * visible, so the rule set is purely additive — adding a rule can only ever
 * hide more, never expose what was hidden before.
 */

type VisibilityPredicate = (record: Record<string, unknown>) => boolean;

function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function bookhiveHasOpinion(record: Record<string, unknown>): boolean {
  const review = typeof record.review === 'string' ? record.review.trim() : '';
  const stars = typeof record.stars === 'number' ? record.stars : 0;
  return review.length > 0 || stars > 0;
}

function beaconbitsHasContent(record: Record<string, unknown>): boolean {
  return isNonEmptyString(record.shout) || record.post != null;
}

function marginBookmarkHasSource(record: Record<string, unknown>): boolean {
  return isNonEmptyString(record.source);
}

function marginAnnotationHasBody(record: Record<string, unknown>): boolean {
  const body = record.body;
  if (typeof body === 'string') return body.trim().length > 0;
  if (body != null && typeof body === 'object') {
    const value = (body as Record<string, unknown>).value;
    return typeof value === 'string' && value.trim().length > 0;
  }
  return false;
}

/**
 * A badge response is the recipient's own accept/decline of a badge someone
 * else awarded them. An accepted one is a credential the person holds and is
 * worth surfacing; a rejected one is not, and publishing someone's declined
 * badges would be a poor call. Anything other than "accepted" stays hidden.
 */
function certifiedBadgeAccepted(record: Record<string, unknown>): boolean {
  return record.response === 'accepted';
}

export const ACTIVITY_VISIBILITY_RULES: Readonly<Record<string, VisibilityPredicate>> =
  Object.freeze({
    'buzz.bookhive.book': bookhiveHasOpinion,
    'app.beaconbits.beacon': beaconbitsHasContent,
    'at.margin.bookmark': marginBookmarkHasSource,
    'at.margin.annotation': marginAnnotationHasBody,
    'app.certified.badge.response': certifiedBadgeAccepted,
  });

/**
 * Return true if the activity item should render a card in the timeline.
 * Records that fail the rule for their collection are dropped silently —
 * they exist in the user's PDS but carry no card-worthy content.
 *
 * Unknown collections (no registered rule) default to visible.
 */
export function isVisibleActivityItem(collection: string, record: unknown): boolean {
  if (record === null || typeof record !== 'object') return false;
  const rule = ACTIVITY_VISIBILITY_RULES[collection];
  if (!rule) return true;
  return rule(record as Record<string, unknown>);
}
