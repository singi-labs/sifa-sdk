/**
 * Minimal per-day activity count. Structurally satisfied by the SDK's
 * `HeatmapDay` (query subpath), but defined here so this predicate stays
 * importable from the main entrypoint without pulling the query layer -- same
 * structural-type discipline as {@link isCompanyPageIndexable}.
 */
export interface DailyActivityCount {
  /** Calendar day in `YYYY-MM-DD` (UTC). Compared lexicographically. */
  date: string;
  /** Number of activities recorded on that day. */
  total: number;
}

const DAY_MS = 86_400_000;

/**
 * How many activities fall within the last `windowDays` calendar days.
 *
 * Sums {@link DailyActivityCount.total | total} for every day whose
 * {@link DailyActivityCount.date | date} is on or after the cutoff, where the
 * cutoff is `now` minus `windowDays` days (UTC calendar date). `YYYY-MM-DD`
 * strings sort chronologically, so the comparison is a plain string compare --
 * no per-day `Date` parsing, no timezone drift.
 *
 * The day exactly `windowDays` ago is INCLUDED (inclusive lower bound).
 *
 * Pure: no network, no I/O. `now` is injectable for deterministic tests and
 * defaults to the current time.
 */
export function countRecentActivity(
  days: readonly DailyActivityCount[],
  windowDays: number,
  now: Date = new Date(),
): number {
  const cutoff = new Date(now.getTime() - windowDays * DAY_MS).toISOString().slice(0, 10);
  return days.reduce((sum, day) => (day.date >= cutoff ? sum + day.total : sum), 0);
}
