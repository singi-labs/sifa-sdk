/**
 * Server-safe timeline date formatters shared by every profile surface.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Format "2007-01" as "Jan 2007", pass through year-only strings. */
export function formatTimelineDate(dateStr: string): string {
  if (dateStr.length === 4) return dateStr;
  const [year, month] = dateStr.split('-');
  if (!month) return year ?? dateStr;
  const idx = parseInt(month, 10) - 1;
  return `${MONTHS[idx]} ${year}`;
}

/**
 * Format a date range for display. Handles missing dates, equal start/end,
 * and ongoing entries (showPresent defaults to true).
 */
export function formatDateRange(start?: string, end?: string, showPresent = true): string {
  if (!start && !end) return '';
  if (!start) return end ? formatTimelineDate(end) : '';
  const formattedStart = formatTimelineDate(start);
  if (!end) return showPresent ? `${formattedStart} - Present` : formattedStart;
  const formattedEnd = formatTimelineDate(end);
  if (formattedStart === formattedEnd) return formattedStart;
  return `${formattedStart} - ${formattedEnd}`;
}
