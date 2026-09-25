import { describe, it, expect } from 'vitest';
import { collapseContributors } from './collapse-contributors.js';

const names = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}` }));
const isOwner = (c: { name: string }) => c.name === 'OWNER';

describe('collapseContributors', () => {
  it('shows every contributor when the list is short', () => {
    const list = names(5);
    expect(collapseContributors(list)).toEqual({ visible: list, hiddenCount: 0 });
  });

  it('does not collapse to hide just one or two names', () => {
    // "and 1 more" costs as much space as the name it hides.
    const list = names(12);
    expect(collapseContributors(list, { max: 10 })).toEqual({ visible: list, hiddenCount: 0 });
  });

  it('shows the first `max` contributors and counts the rest', () => {
    const list = names(398);
    const view = collapseContributors(list, { max: 10 });
    expect(view.visible).toEqual(list.slice(0, 10));
    expect(view.hiddenCount).toBe(388);
  });

  it('defaults to 10 visible contributors', () => {
    expect(collapseContributors(names(50)).visible).toHaveLength(10);
  });

  it('keeps the owner visible after a gap when they fall outside the first `max`', () => {
    const list = [...names(354), { name: 'OWNER' }, ...names(42)];
    const view = collapseContributors(list, { max: 10, isOwner });
    expect(view.visible).toEqual([...list.slice(0, 10), null, { name: 'OWNER' }]);
    expect(view.hiddenCount).toBe(list.length - 11);
  });

  it('does not add a gap when the owner is already in the first `max`', () => {
    const list = [...names(3), { name: 'OWNER' }, ...names(40)];
    const view = collapseContributors(list, { max: 10, isOwner });
    expect(view.visible).toEqual(list.slice(0, 10));
    expect(view.hiddenCount).toBe(34);
  });

  it('shows the owner with no gap when they directly follow the first `max`', () => {
    const list = [...names(10), { name: 'OWNER' }, ...names(40)];
    const view = collapseContributors(list, { max: 10, isOwner });
    expect(view.visible).toEqual(list.slice(0, 11));
    expect(view.hiddenCount).toBe(40);
  });

  it('handles an empty or missing list', () => {
    expect(collapseContributors([])).toEqual({ visible: [], hiddenCount: 0 });
    expect(collapseContributors(undefined)).toEqual({ visible: [], hiddenCount: 0 });
  });
});
