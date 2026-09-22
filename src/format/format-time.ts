/**
 * Format a date string as a full ISO-8601 instant, for a `<time title>` tooltip
 * (the exact timestamp behind a relative "5m ago"). Returns an empty string for
 * an invalid or unparseable date rather than throwing.
 *
 * `new Date(x).toISOString()` throws `RangeError: Invalid time value` on a bad
 * input, which crashed SSR wherever a record's timestamp fed a title attribute
 * directly (GlitchTip SIFAID-M45). Guard the conversion the same way
 * {@link formatRelativeTime} guards its own parse.
 */
export function formatIsoTitle(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString();
}

/**
 * Format a date string as a relative time (e.g. "5m ago", "3d ago").
 * Returns an empty string for invalid or future dates.
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = Date.now();
  const diffMs = now - date.getTime();
  if (diffMs < 0) return '';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}
