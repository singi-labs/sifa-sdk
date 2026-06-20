import type { PresentationDuration } from '../schemas/profile-presentation.js';

/**
 * Format a presentation duration for display. A fixed length renders as
 * "30 min"; a range renders as "20-30 min". Returns undefined when there is no
 * duration. A range whose bounds are equal, or whose max is missing, renders as
 * a single value.
 */
export function formatPresentationDuration(
  duration: PresentationDuration | undefined | null,
): string | undefined {
  if (!duration) return undefined;
  const { minMinutes, maxMinutes } = duration;
  if (maxMinutes != null && maxMinutes !== minMinutes) {
    return `${minMinutes}-${maxMinutes} min`;
  }
  return `${minMinutes} min`;
}
