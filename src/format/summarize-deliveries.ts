import type { ProfilePresentationDelivery } from '../types/index.js';

const CANCELLED_STATUS = 'community.lexicon.calendar.event#cancelled';
const KEYNOTE_ROLE = 'id.sifa.defs#keynote';

/** A compact roll-up of a presentation's deliveries for the collapsed view. */
export interface PresentationDeliverySummary {
  /** Times the talk was actually delivered (cancelled occasions excluded). */
  count: number;
  /** Most recent year among counted deliveries that carry a date. */
  recentYear?: number;
  /** How many counted deliveries were keynotes. */
  keynoteCount: number;
  /** Up to `venueLimit` distinct event names, most-recent first. */
  venues: string[];
  /** Distinct counted venues beyond the ones listed in `venues`. */
  moreVenues: number;
}

/**
 * Summarize a talk's delivery history into the signals the profile shows in the
 * collapsed view: how many times it was given, the most recent year, how many
 * were keynotes, and a small sample of the most recent distinct venues.
 *
 * Cancelled occasions are excluded from every figure: a talk that was booked
 * then cancelled was not actually delivered, and counting it would inflate the
 * "given Nx" signal.
 */
export function summarizePresentationDeliveries(
  deliveries: ProfilePresentationDelivery[] | undefined,
  options: { venueLimit?: number } = {},
): PresentationDeliverySummary {
  const venueLimit = options.venueLimit ?? 3;
  const counted = (deliveries ?? []).filter((delivery) => delivery.status !== CANCELLED_STATUS);
  const sorted = [...counted].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  let recentYear: number | undefined;
  for (const delivery of counted) {
    if (!delivery.date) continue;
    const year = Number(delivery.date.slice(0, 4));
    if (!Number.isNaN(year) && (recentYear === undefined || year > recentYear)) {
      recentYear = year;
    }
  }

  const seen = new Set<string>();
  const distinctVenues: string[] = [];
  for (const delivery of sorted) {
    const name = delivery.eventName?.trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      distinctVenues.push(name);
    }
  }
  const venues = distinctVenues.slice(0, venueLimit);

  return {
    count: counted.length,
    recentYear,
    keynoteCount: counted.filter((delivery) => delivery.role === KEYNOTE_ROLE).length,
    venues,
    moreVenues: distinctVenues.length - venues.length,
  };
}
