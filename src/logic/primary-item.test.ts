import { describe, expect, it } from 'vitest';

import { pickPrimaryFlagged } from './primary-item.js';

describe('pickPrimaryFlagged', () => {
  it('returns undefined for empty or missing input', () => {
    expect(pickPrimaryFlagged(undefined)).toBeUndefined();
    expect(pickPrimaryFlagged([])).toBeUndefined();
  });

  it('returns undefined when nothing is flagged primary', () => {
    expect(pickPrimaryFlagged([{ primary: false }, {}])).toBeUndefined();
  });

  it('returns the flagged item when one is primary', () => {
    const items = [{ id: 'a' }, { id: 'b', primary: true }, { id: 'c' }];
    expect(pickPrimaryFlagged(items)?.id).toBe('b');
  });

  it('excludes a hidden item even when flagged primary (hidden wins)', () => {
    expect(pickPrimaryFlagged([{ primary: true, hidden: true }])).toBeUndefined();
  });

  it('rejects a flagged item the eligibility predicate excludes', () => {
    const items = [{ id: 'ended', primary: true, endedAt: '2020-01' }];
    expect(pickPrimaryFlagged(items, (i) => !i.endedAt)).toBeUndefined();
  });

  it('returns a flagged item the eligibility predicate accepts', () => {
    const items: { id: string; primary: boolean; endedAt?: string }[] = [
      { id: 'ongoing', primary: true },
    ];
    expect(pickPrimaryFlagged(items, (i) => !i.endedAt)?.id).toBe('ongoing');
  });

  it('returns the first flagged item when several are marked (caller unsets siblings)', () => {
    const items = [
      { id: 'a', primary: true },
      { id: 'b', primary: true },
    ];
    expect(pickPrimaryFlagged(items)?.id).toBe('a');
  });
});
