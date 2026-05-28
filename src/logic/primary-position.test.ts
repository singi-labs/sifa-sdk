import { describe, expect, it } from 'vitest';

import { pickPrimaryPosition } from './primary-position.js';

interface TestPosition {
  rkey: string;
  company: string;
  title: string;
  startedAt?: string;
  endedAt?: string;
  primary?: boolean;
}

const meta: TestPosition = {
  rkey: 'meta',
  company: 'Meta',
  title: 'Data Scientist',
  startedAt: '2025-08',
};

const gothamPrimary: TestPosition = {
  rkey: 'gotham',
  company: 'Gotham Data Clinic',
  title: 'President',
  startedAt: '2023-02',
  primary: true,
};

const oldEnded: TestPosition = {
  rkey: 'old',
  company: 'OldCo',
  title: 'Engineer',
  startedAt: '2017-11',
  endedAt: '2022-03',
};

describe('pickPrimaryPosition', () => {
  it('returns undefined for missing/empty input', () => {
    expect(pickPrimaryPosition(undefined)).toBeUndefined();
    expect(pickPrimaryPosition([])).toBeUndefined();
  });

  it("honors user-flagged primary even if another active role started more recently (Teon's case)", () => {
    // Insertion order puts Meta first, which is the source of the production bug.
    const positions = [meta, gothamPrimary, oldEnded];
    expect(pickPrimaryPosition(positions)?.rkey).toBe('gotham');
  });

  it('ignores primary=true if that position has already ended', () => {
    const positions = [{ ...gothamPrimary, endedAt: '2024-01' }, meta];
    expect(pickPrimaryPosition(positions)?.rkey).toBe('meta');
  });

  it('falls back to the most recent startedAt among active roles when none is flagged primary', () => {
    const positions = [{ ...gothamPrimary, primary: false }, meta, oldEnded];
    expect(pickPrimaryPosition(positions)?.rkey).toBe('meta');
  });

  it('treats missing startedAt as oldest', () => {
    const noStart: TestPosition = { rkey: 'no-start', company: 'X', title: 'Y' };
    const positions = [noStart, { ...gothamPrimary, primary: false }];
    expect(pickPrimaryPosition(positions)?.rkey).toBe('gotham');
  });

  it('returns undefined when every position has ended', () => {
    const positions = [oldEnded, { ...gothamPrimary, endedAt: '2024-01' }];
    expect(pickPrimaryPosition(positions)).toBeUndefined();
  });

  it('does not mutate the input array', () => {
    const positions = [meta, gothamPrimary, oldEnded];
    const snapshot = positions.map((p) => p.rkey);
    pickPrimaryPosition(positions);
    expect(positions.map((p) => p.rkey)).toEqual(snapshot);
  });
});
