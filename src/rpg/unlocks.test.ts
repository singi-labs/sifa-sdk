import { describe, expect, it } from 'vitest';

import { RPG_ITEMS, type RpgItem } from './catalog.js';
import { evaluateRpgUnlocks, type RpgUnlockSignals } from './unlocks.js';

const none: RpgUnlockSignals = {
  collections: [],
  externalPlatforms: [],
  activeAppIds: [],
  hasDoctorate: false,
};

describe('evaluateRpgUnlocks', () => {
  it('unlocks Power Suit when the user has a position', () => {
    const r = evaluateRpgUnlocks({ ...none, collections: ['id.sifa.profile.position'] });
    expect(r.find((x) => x.item.id === 'sifa_power_suit')?.earned).toBe(true);
  });
  it('Dev Hoodie unlocks via GitHub OR Tangled', () => {
    const gh = evaluateRpgUnlocks({ ...none, externalPlatforms: ['github'] });
    const tg = evaluateRpgUnlocks({ ...none, activeAppIds: ['tangled'] });
    expect(gh.find((x) => x.item.id === 'sifa_dev_hoodie')?.earned).toBe(true);
    expect(tg.find((x) => x.item.id === 'sifa_dev_hoodie')?.earned).toBe(true);
  });
  it('never returns disabled items', () => {
    const r = evaluateRpgUnlocks({ ...none, hasDoctorate: true });
    expect(RPG_ITEMS.some((i) => i.id === 'sifa_doctoral_cap')).toBe(true);
    expect(r.some((x) => x.item.id === 'sifa_doctoral_cap')).toBe(false);
  });
  it('nothing is earned for an empty profile', () => {
    expect(evaluateRpgUnlocks(none).every((x) => !x.earned)).toBe(true);
  });
  it('evaluates a custom items list instead of the default catalog', () => {
    const items: RpgItem[] = [
      {
        id: 'custom_item',
        title: 'Custom',
        description: '',
        kind: 'held',
        category: 'righthand',
        enabled: true,
        unlock: [{ kind: 'usesApp', appId: 'smokesignal' }],
      },
    ];
    const r = evaluateRpgUnlocks({ ...none, activeAppIds: ['smokesignal'] }, items);
    expect(r).toEqual([{ item: items[0], earned: true }]);
  });
});
