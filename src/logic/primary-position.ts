/**
 * Canonical rule for picking the "primary" position to surface on profile cards,
 * social previews, and structured-data outputs.
 *
 * Without this shared helper, different surfaces (visible hero, OG image,
 * <meta description>, JSON-LD) re-derived "primary" inconsistently and diverged
 * for users with multiple concurrent roles.
 *
 * Rules (in order):
 * 1. A position the user explicitly flagged `primary` AND that is still active.
 * 2. Otherwise, the active position with the most recent `startedAt`.
 * 3. Otherwise, undefined (no active position).
 */

export interface PrimaryPositionCandidate {
  startedAt?: string;
  endedAt?: string;
  primary?: boolean;
}

export function pickPrimaryPosition<T extends PrimaryPositionCandidate>(
  positions: readonly T[] | undefined,
): T | undefined {
  if (!positions || positions.length === 0) return undefined;

  const active = positions.filter((p) => !p.endedAt);
  if (active.length === 0) return undefined;

  const flagged = active.find((p) => p.primary === true);
  if (flagged) return flagged;

  return [...active].sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''))[0];
}
