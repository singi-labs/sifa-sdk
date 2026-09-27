/**
 * How far ahead a profile date may lie, per kind of date (sifa-workspace#581).
 *
 * A date that records something which already happened (a credential being
 * issued, an award, the end of a finished role) cannot be in the future. Some
 * dates are naturally a little ahead: an accepted job or a forthcoming paper,
 * a booked talk, an expected graduation. A credential's expiry has no cap.
 *
 * One table, so the editors on every client apply the same limits.
 */
export const DATE_LOOKAHEAD_MONTHS = {
  credentialIssue: 0,
  award: 0,
  course: 0,
  involvementStart: 0,
  investmentStart: 0,
  /** The end date of any finished (not ongoing) range. */
  completedRangeEnd: 0,
  careerStart: 6,
  projectStart: 6,
  publication: 6,
  talk: 12,
  /** Admitted to a programme that starts next year. */
  educationStart: 12,
  educationEnd: 96,
} as const;

export type DateLookaheadKind = keyof typeof DATE_LOOKAHEAD_MONTHS;

/**
 * Is a partial date (`YYYY`, `YYYY-MM`, or `YYYY-MM-DD`) more than `months`
 * months after the current month? Compared at year-month resolution. A bare
 * year counts from its first month, so the current year always passes. A
 * malformed or empty value is never "beyond" (other validation handles it).
 */
export function isBeyondLookahead(value: string, months: number, now: Date = new Date()): boolean {
  const match = /^(\d{4})(?:-(\d{2}))?/.exec(value);
  if (!match) return false;
  const index = Number(match[1]) * 12 + (match[2] ? Number(match[2]) : 1);
  const limit = now.getFullYear() * 12 + now.getMonth() + 1 + months;
  return index > limit;
}

/**
 * Has a start date not arrived yet? A role that starts next month is shown as
 * upcoming, and is not anyone's current role until its start month.
 */
export function isUpcomingStart(startedAt: string | undefined, now: Date = new Date()): boolean {
  return !!startedAt && isBeyondLookahead(startedAt, 0, now);
}
