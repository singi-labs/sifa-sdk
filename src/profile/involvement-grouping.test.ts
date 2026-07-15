import { describe, expect, it } from 'vitest';
import type { ProfileInvolvement } from '../types/index.js';
import { INVOLVEMENT_HEADING_ORDER, groupInvolvementByHeading } from './involvement-grouping.js';

function inv(
  over: Partial<ProfileInvolvement> & { rkey: string; kind: string },
): ProfileInvolvement {
  return { links: [], ...over };
}

describe('groupInvolvementByHeading', () => {
  it('groups by kind heading in the fixed order, omitting empty groups', () => {
    const items = [
      inv({ rkey: 'a', kind: 'id.sifa.defs#involvementCivic' }),
      inv({ rkey: 'b', kind: 'id.sifa.defs#involvementOpenSource' }),
      inv({ rkey: 'c', kind: 'id.sifa.defs#involvementCharity' }),
    ];
    const groups = groupInvolvementByHeading(items);
    expect(groups.map((g) => g.heading)).toEqual(['Open Source', 'Volunteering', 'Civic']);
  });

  it('maps charity (and legacy) to the Volunteering heading', () => {
    const groups = groupInvolvementByHeading([
      inv({ rkey: 'v', kind: 'id.sifa.defs#involvementCharity', legacy: true }),
    ]);
    expect(groups[0]?.heading).toBe('Volunteering');
  });

  it('sorts most-recent first within a group', () => {
    const groups = groupInvolvementByHeading([
      inv({ rkey: 'old', kind: 'id.sifa.defs#involvementOpenSource', startedAt: '2018' }),
      inv({ rkey: 'new', kind: 'id.sifa.defs#involvementOpenSource', startedAt: '2024' }),
    ]);
    expect(groups[0]?.items.map((i) => i.rkey)).toEqual(['new', 'old']);
  });

  it('routes an unknown kind to Other', () => {
    const groups = groupInvolvementByHeading([inv({ rkey: 'x', kind: 'id.sifa.defs#future' })]);
    expect(groups[0]?.heading).toBe('Other');
  });

  it('exposes the canonical heading order', () => {
    expect(INVOLVEMENT_HEADING_ORDER).toEqual([
      'Open Source',
      'Community',
      'Volunteering',
      'Civic',
      'Other',
    ]);
  });
});
