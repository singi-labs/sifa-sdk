/**
 * Shared "which item did the user flag as primary?" rule for the profile
 * sections that feed the Highlights block (education, publication, presentation,
 * involvement, project).
 *
 * Returns the item explicitly flagged `primary`, excluding hidden items and any
 * the eligibility predicate rejects, or `undefined` when none qualifies. Callers
 * layer their own automatic fallback behind it, e.g.
 * `pickPrimaryFlagged(items) ?? mostRecent(items)`, so an explicit choice
 * overrides the default pick without changing the default itself.
 *
 * Hidden wins over primary, matching {@link pickPrimaryPosition}: an item flagged
 * both hidden and primary is excluded rather than surfaced.
 *
 * Eligibility differs by section and is passed in by the caller: education and
 * publication allow any item; involvement and project allow only ongoing items
 * (no end date); presentation allows a reusable talk. Standalone one-off sessions
 * are never candidates because only `presentation` records carry the flag.
 */
export interface PrimaryFlagCandidate {
  primary?: boolean;
  hidden?: boolean;
}

export function pickPrimaryFlagged<T extends PrimaryFlagCandidate>(
  items: readonly T[] | undefined,
  isEligible: (item: T) => boolean = () => true,
): T | undefined {
  if (!items || items.length === 0) return undefined;
  return items.find((item) => item.primary === true && !item.hidden && isEligible(item));
}
