import { describe, it, expect } from 'vitest';
import type { ProfilePosition } from '../types/index.js';
import { hoistPrimary, sortPositions } from './section-sorts.js';

function pos(over: Partial<ProfilePosition> & { rkey: string }): ProfilePosition {
  return over as ProfilePosition;
}

describe('hoistPrimary', () => {
  it('moves the current primary position to the top', () => {
    const out = hoistPrimary([
      pos({ rkey: 'a' }),
      pos({ rkey: 'b', primary: true }),
      pos({ rkey: 'c' }),
    ]);
    expect(out.map((p) => p.rkey)).toEqual(['b', 'a', 'c']);
  });

  it('does not hoist a primary that has ended', () => {
    const input = [pos({ rkey: 'a' }), pos({ rkey: 'b', primary: true, endedAt: '2020' })];
    expect(hoistPrimary(input).map((p) => p.rkey)).toEqual(['a', 'b']);
  });

  it('leaves the list unchanged when the primary is already first', () => {
    const input = [pos({ rkey: 'b', primary: true }), pos({ rkey: 'a' })];
    expect(hoistPrimary(input).map((p) => p.rkey)).toEqual(['b', 'a']);
  });
});

describe('sortPositions', () => {
  it('sorts by date desc, then hoists the current primary above all', () => {
    const out = sortPositions([
      pos({ rkey: 'old', startedAt: '2015', endedAt: '2018' }),
      pos({ rkey: 'primary', primary: true, startedAt: '2016' }),
      pos({ rkey: 'recent', startedAt: '2022', endedAt: '2024' }),
    ]);
    expect(out[0]?.rkey).toBe('primary');
    expect(out.slice(1).map((p) => p.rkey)).toEqual(['recent', 'old']);
  });
});
