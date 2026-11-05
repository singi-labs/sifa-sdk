/**
 * Server-safe timeline date formatters shared by every profile surface.
 */

import { isUpcomingStart } from '../logic/date-lookahead.js';

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

/**
 * Format a finished range compactly: "Jun - Dec 2024" within one year,
 * "Jun 2024" for a single month, "Jun 2023 - Dec 2024" across years. Year-only
 * dates keep the full form.
 */
export function formatCompactDateRange(start: string, end: string): string {
  const full = formatDateRange(start, end, false);
  const bothMonths = /^\d{4}-\d{2}/.test(start) && /^\d{4}-\d{2}/.test(end);
  if (!bothMonths || start.slice(0, 4) !== end.slice(0, 4) || !full.includes(' - ')) return full;
  return `${formatTimelineDate(start).split(' ')[0]} - ${formatTimelineDate(end)}`;
}

/**
 * Format a position's dates. A role whose start month has not arrived yet (an
 * accepted offer) reads "Starts Jan 2027" rather than "Jan 2027 - Present",
 * which would claim it is already under way (sifa-workspace#581).
 */
export function formatPositionDateRange(
  start?: string,
  end?: string,
  now: Date = new Date(),
): string {
  if (start && !end && isUpcomingStart(start, now)) return `Starts ${formatTimelineDate(start)}`;
  return formatDateRange(start, end);
}

/**
 * Format a credential's issue and expiry dates: "Jan 2025 - Jan 2029", or the
 * issue date alone for one that doesn't expire (never "Present").
 */
export function formatCredentialDateRange(
  issueDate?: string | null,
  expiryDate?: string | null,
): string {
  return formatDateRange(issueDate ?? undefined, expiryDate ?? undefined, false);
}
