/**
 * Sort profile section items from newest to oldest.
 *
 * Rules:
 * - Items with no end date (ongoing/current) sort to the top.
 * - Primary sort: end date descending (newest first).
 * - Secondary sort: start date descending (newest first).
 * - Items with no dates sort to the bottom.
 *
 * Date strings are ISO-ish ("2024", "2024-03", "2024-03-15") and
 * lexicographic comparison works correctly for them.
 */

interface DateRange {
  startDate?: string;
  endDate?: string;
  current?: boolean;
}

type DateExtractor<T> = (item: T) => DateRange;

const FAR_FUTURE = '9999-12-31';
const FAR_PAST = '0000-01-01';

export function sortByDateDesc<T>(items: T[], extract: DateExtractor<T>): T[] {
  return [...items].sort((a, b) => {
    const da = extract(a);
    const db = extract(b);

    const endA = da.current ? FAR_FUTURE : (da.endDate ?? '');
    const endB = db.current ? FAR_FUTURE : (db.endDate ?? '');

    // Items with any date beat items with no dates at all
    const hasDateA = endA || da.startDate;
    const hasDateB = endB || db.startDate;
    if (hasDateA && !hasDateB) return -1;
    if (!hasDateA && hasDateB) return 1;

    // Primary: end date descending
    if (endA !== endB) return endB.localeCompare(endA);

    // Secondary: start date descending
    const startA = da.startDate ?? FAR_PAST;
    const startB = db.startDate ?? FAR_PAST;
    return startB.localeCompare(startA);
  });
}

/**
 * Convenience extractor for items that use `startDate` / `endDate` fields directly.
 * Used by volunteering, projects, and other sections that still use startDate/endDate.
 */
export function dateRangeExtractor<
  T extends { startDate?: string; endDate?: string; current?: boolean },
>(item: T): DateRange {
  return { startDate: item.startDate, endDate: item.endDate, current: item.current };
}

/**
 * Extractor for lexicon-aligned items that use `startedAt` / `endedAt` fields.
 * Used by positions and education (current derived from !endedAt).
 */
export function lexiconDateExtractor<T extends { startedAt?: string; endedAt?: string }>(
  item: T,
): DateRange {
  return { startDate: item.startedAt, endDate: item.endedAt, current: !item.endedAt };
}

/**
 * Convenience extractor for items with a single `date` field.
 */
export function singleDateExtractor<T extends { date?: string }>(item: T): DateRange {
  return { endDate: item.date };
}

/**
 * Extractor for certifications which use `issueDate` / `expiryDate`.
 */
export function certDateExtractor<T extends { issueDate?: string; expiryDate?: string }>(
  item: T,
): DateRange {
  return { startDate: item.issueDate, endDate: item.expiryDate ?? item.issueDate };
}
