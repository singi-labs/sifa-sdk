import { describe, expect, it } from 'vitest';

import { countRecentActivity } from './recent-activity.js';

// Fixed reference "now" so the window is deterministic across runs.
const NOW = new Date('2026-08-19T12:00:00.000Z');

describe('countRecentActivity', () => {
  it('sums the totals of days inside the window', () => {
    const days = [
      { date: '2026-08-18', total: 3 },
      { date: '2026-08-10', total: 2 },
    ];
    expect(countRecentActivity(days, 90, NOW)).toBe(5);
  });

  it('ignores days older than the window', () => {
    const days = [
      { date: '2026-08-18', total: 4 }, // inside
      { date: '2026-01-01', total: 100 }, // far outside
    ];
    expect(countRecentActivity(days, 90, NOW)).toBe(4);
  });

  it('includes the day exactly at the cutoff boundary', () => {
    // 90 days before 2026-08-19 is 2026-05-21.
    const days = [{ date: '2026-05-21', total: 7 }];
    expect(countRecentActivity(days, 90, NOW)).toBe(7);
  });

  it('excludes the day one before the cutoff boundary', () => {
    // 2026-05-20 is just outside a 90-day window ending 2026-08-19.
    const days = [{ date: '2026-05-20', total: 7 }];
    expect(countRecentActivity(days, 90, NOW)).toBe(0);
  });

  it('returns 0 for an empty array', () => {
    expect(countRecentActivity([], 90, NOW)).toBe(0);
  });

  it('returns 0 when every day is outside the window', () => {
    const days = [
      { date: '2026-01-01', total: 5 },
      { date: '2025-12-31', total: 9 },
    ];
    expect(countRecentActivity(days, 90, NOW)).toBe(0);
  });
});
