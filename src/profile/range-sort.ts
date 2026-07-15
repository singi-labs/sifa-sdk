import { sortByDateDesc } from '../format/sort-by-date.js';

const hasValue = (date?: string) => !!date;

/**
 * Sort items by date range, floating ongoing entries (startDate present, endDate
 * absent) to the top. Items with no dates sink to the bottom.
 *
 * Used by sections whose lexicons have no explicit `current` flag -- ongoing is
 * implicit from a missing endDate. Without this wrapper, the shared
 * `dateRangeExtractor` reads `item.current` (always undefined for these items)
 * and sinks ongoing entries below completed ones.
 *
 * Sections using lexicon-aligned `startedAt`/`endedAt` fields (positions,
 * education) should use `lexiconDateExtractor` instead -- that extractor already
 * derives `current` correctly.
 */
export function sortByActiveDateRange<T extends { startDate?: string; endDate?: string }>(
  items: T[],
): T[] {
  return sortByDateDesc(items, (p) => ({
    startDate: p.startDate,
    endDate: p.endDate,
    current: !hasValue(p.endDate) && hasValue(p.startDate),
  }));
}
