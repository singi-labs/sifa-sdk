/**
 * Whether an activity is *relational*: a reaction to, or a reference to,
 * something someone else made (a comment, reply, like, follow, RSVP,
 * endorsement, bookmark, membership, ...). Distinct from the
 * `creation` / `action` / `filtered` tier, which governs public-profile
 * visibility rather than presentation.
 *
 * The two-tier timeline uses this so a relational item ALWAYS renders as a
 * compact line, never a rich card — even when the record happens to carry
 * media. Otherwise a comment on someone's photo could inline that photo, which
 * is exactly what the line model avoids: it shows "commented on {thing}" and
 * links out, rather than reproducing another person's content.
 *
 * Kept as a curated code-level signal rather than a field on the public
 * `activity-tiers.json` (served at `/.well-known/`) so it has no blast radius
 * on the tier data or the profile surfaces that consume it.
 *
 * Matches on the final NSID segment, which is how these records name their
 * relational nature across apps (`*.comment`, `*.rsvp`, `*.membership`, ...).
 */
const RELATIONAL_SEGMENTS: ReadonlySet<string> = new Set([
  'comment',
  'reply',
  'like',
  'repost',
  'follow',
  'connection',
  'rsvp',
  'endorse',
  'endorsement',
  'bookmark',
  'member',
  'membership',
  'vouch',
]);

export function isRelationalActivity(nsid: string): boolean {
  if (!nsid || !nsid.includes('.')) return false;
  const segment = nsid.slice(nsid.lastIndexOf('.') + 1);
  return RELATIONAL_SEGMENTS.has(segment);
}
