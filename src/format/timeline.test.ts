import { describe, it, expect } from 'vitest';
import { formatDateRange, formatTimelineDate } from './timeline.js';

describe('formatTimelineDate', () => {
  it('formats YYYY-MM as "Mon YYYY"', () => {
    expect(formatTimelineDate('2007-01')).toBe('Jan 2007');
    expect(formatTimelineDate('2020-12')).toBe('Dec 2020');
  });

  it('passes year-only strings through', () => {
    expect(formatTimelineDate('2020')).toBe('2020');
  });

  it('falls back to the year when there is no month', () => {
    expect(formatTimelineDate('2020-')).toBe('2020');
  });
});

describe('formatDateRange', () => {
  it('returns empty when both dates are absent', () => {
    expect(formatDateRange()).toBe('');
  });

  it('shows "start - Present" for an ongoing entry', () => {
    expect(formatDateRange('2020-01')).toBe('Jan 2020 - Present');
  });

  it('omits Present when showPresent is false', () => {
    expect(formatDateRange('2020-01', undefined, false)).toBe('Jan 2020');
  });

  it('collapses equal start/end to a single value', () => {
    expect(formatDateRange('2020-01', '2020-01')).toBe('Jan 2020');
  });

  it('formats a full range', () => {
    expect(formatDateRange('2019-06', '2021-03')).toBe('Jun 2019 - Mar 2021');
  });

  it('formats an end-only range', () => {
    expect(formatDateRange(undefined, '2021-03')).toBe('Mar 2021');
  });
});
