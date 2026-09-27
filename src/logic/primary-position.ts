/**
 * Canonical rule for picking the "primary" position to surface on profile cards,
 * social previews, and structured-data outputs.
 *
 * Without this shared helper, different surfaces (visible hero, OG image,
 * <meta description>, JSON-LD) re-derived "primary" inconsistently and diverged
 * for users with multiple concurrent roles.
 *
 * A `hidden` position is one the user chose not to show on their public profile.
 * It is never surfaced as the featured role — hidden wins over `primary`, so a
 * role flagged both hidden and primary is excluded rather than featured.
 *
 * A position whose start month has not arrived yet (an accepted offer) is not
 * active: it is nobody's current role until it starts (sifa-workspace#581).
 *
 * Rules (in order):
 * 1. A position the user explicitly flagged `primary` AND that is still active AND not hidden.
 * 2. Otherwise, the active, non-hidden position with the most recent `startedAt`.
 * 3. Otherwise, undefined (no eligible position).
 */

import { isUpcomingStart } from './date-lookahead.js';

export interface PrimaryPositionCandidate {
  startedAt?: string;
  endedAt?: string;
  primary?: boolean;
  hidden?: boolean;
}

export function pickPrimaryPosition<T extends PrimaryPositionCandidate>(
  positions: readonly T[] | undefined,
  now: Date = new Date(),
): T | undefined {
  if (!positions || positions.length === 0) return undefined;

  const active = positions.filter(
    (p) => !p.endedAt && !p.hidden && !isUpcomingStart(p.startedAt, now),
  );
  if (active.length === 0) return undefined;

  const flagged = active.find((p) => p.primary === true);
  if (flagged) return flagged;

  return [...active].sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''))[0];
}
