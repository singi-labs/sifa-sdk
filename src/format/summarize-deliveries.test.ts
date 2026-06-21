import { describe, it, expect } from 'vitest';
import { summarizePresentationDeliveries } from './summarize-deliveries.js';
import type { ProfilePresentationDelivery } from '../types/index.js';

const d = (over: Partial<ProfilePresentationDelivery>): ProfilePresentationDelivery => ({
  rkey: Math.random().toString(36).slice(2),
  ...over,
});

const KEYNOTE = 'id.sifa.defs#keynote';
const CANCELLED = 'community.lexicon.calendar.event#cancelled';

describe('summarizePresentationDeliveries', () => {
  it('returns zeros for no deliveries', () => {
    expect(summarizePresentationDeliveries(undefined)).toEqual({
      count: 0,
      recentYear: undefined,
      keynoteCount: 0,
      venues: [],
      moreVenues: 0,
    });
  });

  it('counts deliveries and excludes cancelled ones from the count', () => {
    const s = summarizePresentationDeliveries([
      d({ eventName: 'DevConf', date: '2024-05-01' }),
      d({ eventName: 'JSConf', date: '2023-09-10' }),
      d({ eventName: 'DeadConf', date: '2022-01-01', status: CANCELLED }),
    ]);
    expect(s.count).toBe(2);
  });

  it('reports the most recent year among counted deliveries', () => {
    const s = summarizePresentationDeliveries([
      d({ eventName: 'A', date: '2021-01-01' }),
      d({ eventName: 'B', date: '2025-06-01' }),
      d({ eventName: 'C', date: '2026-02-01', status: CANCELLED }), // cancelled ignored
    ]);
    expect(s.recentYear).toBe(2025);
  });

  it('counts keynote roles, ignoring cancelled', () => {
    const s = summarizePresentationDeliveries([
      d({ eventName: 'A', role: KEYNOTE, date: '2024-01-01' }),
      d({ eventName: 'B', role: KEYNOTE, date: '2023-01-01' }),
      d({ eventName: 'C', role: 'id.sifa.defs#panelist', date: '2022-01-01' }),
      d({ eventName: 'D', role: KEYNOTE, date: '2021-01-01', status: CANCELLED }),
    ]);
    expect(s.keynoteCount).toBe(2);
  });

  it('lists distinct venues most-recent-first, capped, with a remainder count', () => {
    const s = summarizePresentationDeliveries(
      [
        d({ eventName: 'Newest', date: '2025-01-01' }),
        d({ eventName: 'Mid', date: '2024-01-01' }),
        d({ eventName: 'Mid', date: '2023-06-01' }), // duplicate venue, deduped
        d({ eventName: 'Older', date: '2022-01-01' }),
        d({ eventName: 'Oldest', date: '2021-01-01' }),
      ],
      { venueLimit: 2 },
    );
    expect(s.venues).toEqual(['Newest', 'Mid']);
    expect(s.moreVenues).toBe(2); // Older + Oldest
  });

  it('defaults to a venue limit of 3', () => {
    const s = summarizePresentationDeliveries([
      d({ eventName: 'A', date: '2025-01-01' }),
      d({ eventName: 'B', date: '2024-01-01' }),
      d({ eventName: 'C', date: '2023-01-01' }),
      d({ eventName: 'D', date: '2022-01-01' }),
    ]);
    expect(s.venues).toEqual(['A', 'B', 'C']);
    expect(s.moreVenues).toBe(1);
  });
});
