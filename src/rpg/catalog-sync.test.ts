import { describe, expect, it } from 'vitest';

import { RPG_ITEMS, RpgItemSchema, type RpgItem } from './catalog.js';
import { compareRpgCatalog, SIFA_RPG_PROVIDER_DID, type RpgActorItem } from './catalog-drift.js';
import { RPG_UNLOCK_PLACEHOLDER, syncRpgCatalog } from './catalog-sync.js';

const toRemote = (item: RpgItem): RpgActorItem => ({
  item: item.id,
  title: item.title,
  description: item.description,
  kind: item.kind,
  category: item.category,
  channels: item.channels,
  assetCid: item.assetCid,
  iconCid: item.iconCid,
});

const NEW_ICON = `bafkrei${'a'.repeat(52)}`;
const NEW_ASSET = `bafkrei${'b'.repeat(52)}`;

describe('syncRpgCatalog', () => {
  it('changes nothing when rpg.actor matches', () => {
    const result = syncRpgCatalog(RPG_ITEMS, RPG_ITEMS.map(toRemote));
    expect(result.items).toEqual(RPG_ITEMS);
    expect(result.changes).toEqual([]);
    expect(result.added).toEqual([]);
    expect(result.iconUpdates).toEqual([]);
  });

  it('adopts rpg.actor data fields and keeps our id, unlock and enabled', () => {
    const remote = RPG_ITEMS.map(toRemote);
    remote[1] = {
      ...remote[1]!,
      description: 'A new suit line',
      channels: ['main', 'sub1'],
      iconCid: NEW_ICON,
    };
    const result = syncRpgCatalog(RPG_ITEMS, remote);
    const suit = result.items[1]!;
    expect(suit).toMatchObject({
      id: 'sifa_suit',
      description: 'A new suit line',
      channels: ['main', 'sub1'],
      iconCid: NEW_ICON,
      enabled: false,
      unlock: RPG_ITEMS[1]!.unlock,
    });
    expect(result.changes).toEqual([
      {
        item: 'sifa_suit',
        field: 'description',
        before: 'Sharp power suit for confirmed professionals',
        after: 'A new suit line',
      },
      { item: 'sifa_suit', field: 'channels', before: ['main'], after: ['main', 'sub1'] },
      { item: 'sifa_suit', field: 'iconCid', before: RPG_ITEMS[1]!.iconCid, after: NEW_ICON },
    ]);
    expect(result.iconUpdates).toEqual([{ item: 'sifa_suit', iconCid: NEW_ICON }]);
    // Other items are untouched.
    expect(result.items.filter((i) => i.id !== 'sifa_suit')).toEqual(
      RPG_ITEMS.filter((i) => i.id !== 'sifa_suit'),
    );
  });

  it('drops channels when rpg.actor drops them, but keeps a required field it leaves out', () => {
    const remote = RPG_ITEMS.map(toRemote);
    remote[4] = { ...remote[4]!, channels: undefined, title: undefined };
    const result = syncRpgCatalog(RPG_ITEMS, remote);
    expect(result.items[4]!.title).toBe('Dev Hoodie');
    expect('channels' in result.items[4]!).toBe(false);
    expect(result.changes.map((c) => `${c.item}.${c.field}`)).toEqual(['dev_hoodie.channels']);
  });

  it('appends a new rpg.actor item disabled, with the placeholder unlock', () => {
    const remote = [
      ...RPG_ITEMS.map(toRemote),
      {
        item: 'hard_hat',
        title: 'Hard Hat',
        description: 'Safety first',
        kind: 'layer',
        category: 'headwear',
        channels: ['main'],
        assetCid: NEW_ASSET,
        iconCid: NEW_ICON,
      },
    ];
    const result = syncRpgCatalog(RPG_ITEMS, remote);
    expect(result.added).toEqual(['hard_hat']);
    expect(result.items).toHaveLength(RPG_ITEMS.length + 1);
    const added = result.items.at(-1)!;
    expect(added).toEqual({
      id: 'hard_hat',
      title: 'Hard Hat',
      description: 'Safety first',
      kind: 'layer',
      category: 'headwear',
      channels: ['main'],
      assetCid: NEW_ASSET,
      iconCid: NEW_ICON,
      enabled: false,
      unlock: [RPG_UNLOCK_PLACEHOLDER],
    });
    expect(() => RpgItemSchema.parse(added)).not.toThrow();
    expect(result.iconUpdates).toEqual([{ item: 'hard_hat', iconCid: NEW_ICON }]);
  });

  it('skips rpg.actor data that would not pass the schema', () => {
    const remote = [
      ...RPG_ITEMS.map((i) =>
        i.id === 'lab_coat' ? { ...toRemote(i), kind: 'cape' } : toRemote(i),
      ),
      { item: 'Bad Id', title: 'x', description: 'x', kind: 'layer', category: 'tops' },
    ];
    const result = syncRpgCatalog(RPG_ITEMS, remote);
    expect(result.items).toEqual(RPG_ITEMS);
    expect(result.changes).toEqual([]);
    expect(result.added).toEqual([]);
    expect(result.skipped.map((s) => s.item)).toEqual(['lab_coat', 'Bad Id']);
  });

  it('keeps items rpg.actor does not list', () => {
    const remote = RPG_ITEMS.filter((i) => i.id !== 'sifa_suit').map(toRemote);
    expect(syncRpgCatalog(RPG_ITEMS, remote).items).toEqual(RPG_ITEMS);
  });

  it('is idempotent and leaves no drift behind', () => {
    const remote = RPG_ITEMS.map(toRemote);
    remote[0] = { ...remote[0]!, title: 'Briefcase', assetCid: NEW_ASSET };
    remote.push({ ...remote[2]!, item: 'backup_mic', title: 'Backup Mic' });
    const once = syncRpgCatalog(RPG_ITEMS, remote);
    const twice = syncRpgCatalog(once.items, remote);
    expect(twice.items).toEqual(once.items);
    expect(twice.changes).toEqual([]);
    expect(twice.added).toEqual([]);
    const drift = compareRpgCatalog(once.items, {
      provider: SIFA_RPG_PROVIDER_DID,
      items: remote,
    });
    expect(drift.ok).toBe(true);
    expect(drift.extra).toEqual([]);
  });
});
