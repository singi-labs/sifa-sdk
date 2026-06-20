import { describe, expect, it } from 'vitest';

import { formatPresentationDuration } from './format-duration.js';

describe('formatPresentationDuration', () => {
  it('formats a fixed length', () => {
    expect(formatPresentationDuration({ minMinutes: 30 })).toBe('30 min');
  });

  it('formats a min/max range', () => {
    expect(formatPresentationDuration({ minMinutes: 20, maxMinutes: 30 })).toBe('20-30 min');
  });

  it('collapses an equal-bounds range to a single value', () => {
    expect(formatPresentationDuration({ minMinutes: 45, maxMinutes: 45 })).toBe('45 min');
  });

  it('returns undefined when there is no duration', () => {
    expect(formatPresentationDuration(undefined)).toBeUndefined();
    expect(formatPresentationDuration(null)).toBeUndefined();
  });
});
