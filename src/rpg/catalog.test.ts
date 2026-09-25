import { describe, expect, it } from 'vitest';

import { RPG_ITEMS, RpgItemSchema } from './catalog.js';

describe('RPG_ITEMS', () => {
  it('every entry matches the schema', () => {
    for (const item of RPG_ITEMS) expect(() => RpgItemSchema.parse(item)).not.toThrow();
  });
  it('item ids are unique and fit the equipment.rpg.give item limit (50)', () => {
    const ids = RPG_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id.length).toBeLessThanOrEqual(50);
  });
  it('doctoral cap is disabled until EQF level ships (#594)', () => {
    expect(RPG_ITEMS.find((i) => i.id === 'sifa_doctoral_cap')?.enabled).toBe(false);
  });
  it('rejects ids that are not lowercase alphanumeric/underscore (used in a record key)', () => {
    const base = RPG_ITEMS[0]!;
    for (const id of ['Sifa_Suit', 'sifa suit', 'sifa:suit', ''])
      expect(RpgItemSchema.safeParse({ ...base, id }).success).toBe(false);
  });
  it('rejects an empty usesApp appId', () => {
    const base = RPG_ITEMS[0]!;
    const bad = { ...base, unlock: [{ kind: 'usesApp', appId: '' }] };
    expect(RpgItemSchema.safeParse(bad).success).toBe(false);
  });
});
