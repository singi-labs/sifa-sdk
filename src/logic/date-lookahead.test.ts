import { describe, expect, it } from 'vitest';

import { DATE_LOOKAHEAD_MONTHS, isBeyondLookahead, isUpcomingStart } from './date-lookahead.js';

const now = new Date(2026, 8, 15); // September 2026

describe('isBeyondLookahead', () => {
  it('with no look-ahead, blocks any later month or year', () => {
    expect(isBeyondLookahead('2026-10', 0, now)).toBe(true);
    expect(isBeyondLookahead('2027', 0, now)).toBe(true);
    expect(isBeyondLookahead('2026-09', 0, now)).toBe(false);
    expect(isBeyondLookahead('2026', 0, now)).toBe(false);
    expect(isBeyondLookahead('2020-05', 0, now)).toBe(false);
  });

  it('allows up to the given number of months ahead', () => {
    expect(isBeyondLookahead('2027-09', 12, now)).toBe(false);
    expect(isBeyondLookahead('2027-10', 12, now)).toBe(true);
    expect(isBeyondLookahead('2027', 12, now)).toBe(false);
    expect(isBeyondLookahead('2028', 12, now)).toBe(true);
  });

  it('ignores the day of a full date', () => {
    expect(isBeyondLookahead('2028-09-30', 24, now)).toBe(false);
    expect(isBeyondLookahead('2095-12-31', 24, now)).toBe(true);
  });

  it('never flags an empty or malformed value', () => {
    expect(isBeyondLookahead('', 0, now)).toBe(false);
    expect(isBeyondLookahead('-03', 0, now)).toBe(false);
    expect(isBeyondLookahead('not-a-date', 0, now)).toBe(false);
  });
});

describe('isUpcomingStart', () => {
  it('is true only for a start month after the current one', () => {
    expect(isUpcomingStart('2026-10', now)).toBe(true);
    expect(isUpcomingStart('2027', now)).toBe(true);
    expect(isUpcomingStart('2026-09', now)).toBe(false);
    expect(isUpcomingStart('2026', now)).toBe(false);
    expect(isUpcomingStart(undefined, now)).toBe(false);
  });
});

describe('DATE_LOOKAHEAD_MONTHS', () => {
  it('holds the per-kind limits', () => {
    expect(DATE_LOOKAHEAD_MONTHS).toEqual({
      credentialIssue: 0,
      award: 0,
      course: 0,
      involvementStart: 0,
      investmentStart: 0,
      completedRangeEnd: 0,
      careerStart: 6,
      projectStart: 6,
      publication: 6,
      talk: 12,
      educationEnd: 96,
    });
  });
});
