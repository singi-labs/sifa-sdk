/** A long contributor list reduced to what the collapsed view shows. */
export interface CollapsedContributors<T> {
  /**
   * Contributors to show inline, in list order. A `null` entry marks a gap of
   * skipped names (render it as an ellipsis).
   */
  visible: (T | null)[];
  /** Contributors not in `visible`, for an "and N more" label. */
  hiddenCount: number;
}

export interface CollapseContributorsOptions<T> {
  /** How many contributors to show before collapsing. Defaults to 10. */
  max?: number;
  /** Identifies the profile owner, who stays visible even deep in the list. */
  isOwner?: (contributor: T) => boolean;
}

/**
 * Collapse a long author/contributor list (a consortium paper or a software
 * release can list hundreds) to the first `max` names plus a hidden count.
 *
 * The profile owner stays visible: when they fall outside the first `max`, they
 * are appended after a gap marker, because on a large author list the owner's
 * own name is the one a reader looks for. Lists at most two names longer than
 * `max` are shown in full, since "and 1 more" takes as much room as the name.
 */
export function collapseContributors<T>(
  contributors: readonly T[] | undefined,
  options: CollapseContributorsOptions<T> = {},
): CollapsedContributors<T> {
  const list = contributors ?? [];
  const max = options.max ?? 10;
  if (list.length <= max + 2) return { visible: [...list], hiddenCount: 0 };

  const visible: (T | null)[] = list.slice(0, max);
  const ownerIndex = options.isOwner ? list.findIndex(options.isOwner) : -1;
  if (ownerIndex >= max) {
    if (ownerIndex > max) visible.push(null);
    visible.push(list[ownerIndex] as T);
  }
  const shown = visible.filter((c) => c !== null).length;
  return { visible, hiddenCount: list.length - shown };
}
