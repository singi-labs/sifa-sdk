import { describe, expect, it } from 'vitest';

import { RPG_ITEMS, type RpgItem } from './catalog.js';
import {
  compareRpgCatalog,
  renderRpgCatalogDriftMarkdown,
  SIFA_RPG_PROVIDER_DID,
  type RpgActorCatalog,
  type RpgActorItem,
} from './catalog-drift.js';

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

const catalog = (items: RpgActorItem[]): RpgActorCatalog => ({
  provider: SIFA_RPG_PROVIDER_DID,
  count: items.length,
  items,
});

describe('compareRpgCatalog', () => {
  it('reports no drift when every item matches', () => {
    const result = compareRpgCatalog(RPG_ITEMS, catalog(RPG_ITEMS.map(toRemote)));
    expect(result.ok).toBe(true);
    expect(result.mismatches).toEqual([]);
    expect(result.extra).toEqual([]);
    expect(result.missingDisabled).toEqual([]);
  });

  it('ignores fields the catalog does not store (context)', () => {
    const remote = RPG_ITEMS.map((i) => ({ ...toRemote(i), context: 'something else' }));
    expect(compareRpgCatalog(RPG_ITEMS, catalog(remote)).ok).toBe(true);
  });

  it('fails on a changed description, with before and after', () => {
    const remote = RPG_ITEMS.map(toRemote);
    remote[3] = { ...remote[3]!, description: 'Reworded' };
    const result = compareRpgCatalog(RPG_ITEMS, catalog(remote));
    expect(result.ok).toBe(false);
    expect(result.mismatches).toEqual([
      {
        item: 'strapped_books',
        field: 'description',
        ours: 'Knowledge is power, better come strapped',
        theirs: 'Reworded',
      },
    ]);
  });

  it('fails on changed or dropped channels', () => {
    const remote = RPG_ITEMS.map(toRemote);
    remote[4] = { ...remote[4]!, channels: ['main'] };
    remote[6] = { ...remote[6]!, channels: undefined };
    const result = compareRpgCatalog(RPG_ITEMS, catalog(remote));
    expect(result.mismatches).toEqual([
      { item: 'dev_hoodie', field: 'channels', ours: 'main, sub1', theirs: 'main' },
      { item: 'weekend_shirt', field: 'channels', ours: 'main, sub1, sub2', theirs: '(absent)' },
    ]);
  });

  it('fails on a changed CID, title, kind or category', () => {
    const remote = RPG_ITEMS.map(toRemote);
    remote[0] = { ...remote[0]!, assetCid: 'bafkreiother', title: 'Renamed' };
    remote[2] = { ...remote[2]!, kind: 'layer', category: 'tops', iconCid: 'bafkreiicon' };
    const result = compareRpgCatalog(RPG_ITEMS, catalog(remote));
    expect(result.ok).toBe(false);
    expect(result.mismatches.map((m) => `${m.item}.${m.field}`)).toEqual([
      'leather_briefcase.title',
      'leather_briefcase.assetCid',
      'speaker_mic.kind',
      'speaker_mic.category',
      'speaker_mic.iconCid',
    ]);
    expect(result.mismatches[0]).toMatchObject({ ours: 'Leather Briefcase', theirs: 'Renamed' });
  });

  it('fails when rpg.actor no longer lists an enabled item', () => {
    const remote = RPG_ITEMS.filter((i) => i.id !== 'lab_coat').map(toRemote);
    const result = compareRpgCatalog(RPG_ITEMS, catalog(remote));
    expect(result.ok).toBe(false);
    expect(result.mismatches).toEqual([
      { item: 'lab_coat', field: 'listed', ours: 'yes', theirs: 'missing' },
    ]);
  });

  it('compares disabled items too', () => {
    expect(RPG_ITEMS.find((i) => i.id === 'sifa_suit')?.enabled).toBe(false);
    const remote = RPG_ITEMS.map((i) =>
      i.id === 'sifa_suit' ? { ...toRemote(i), description: 'New suit copy' } : toRemote(i),
    );
    const result = compareRpgCatalog(RPG_ITEMS, catalog(remote));
    expect(result.ok).toBe(false);
    expect(result.mismatches.map((m) => `${m.item}.${m.field}`)).toEqual(['sifa_suit.description']);
  });

  it('only notices a disabled item that rpg.actor does not list', () => {
    const remote = RPG_ITEMS.filter((i) => i.id !== 'sifa_suit').map(toRemote);
    const result = compareRpgCatalog(RPG_ITEMS, catalog(remote));
    expect(result.ok).toBe(true);
    expect(result.mismatches).toEqual([]);
    expect(result.missingDisabled).toEqual(['sifa_suit']);
  });

  it('only notices items rpg.actor lists that we do not have', () => {
    const extraItem = { ...toRemote(RPG_ITEMS[0]!), item: 'new_thing' };
    const result = compareRpgCatalog(RPG_ITEMS, catalog([...RPG_ITEMS.map(toRemote), extraItem]));
    expect(result.ok).toBe(true);
    expect(result.extra).toEqual(['new_thing']);
  });

  it('fails when the provider is not the sifa.id DID', () => {
    const result = compareRpgCatalog(RPG_ITEMS, {
      ...catalog(RPG_ITEMS.map(toRemote)),
      provider: 'did:plc:someoneelse',
    });
    expect(result.ok).toBe(false);
    expect(result.providerMismatch).toEqual({
      expected: SIFA_RPG_PROVIDER_DID,
      actual: 'did:plc:someoneelse',
    });
  });
});

describe('renderRpgCatalogDriftMarkdown', () => {
  it('renders a before/after table per item and the notices', () => {
    const remote = RPG_ITEMS.map(toRemote);
    remote[0] = { ...remote[0]!, title: 'Renamed', description: 'Now with a | pipe' };
    const withoutSuit = remote.filter((r) => r.item !== 'sifa_suit');
    const md = renderRpgCatalogDriftMarkdown(
      compareRpgCatalog(RPG_ITEMS, catalog([...withoutSuit, { ...remote[1]!, item: 'new_thing' }])),
    );
    expect(md).toContain('### `leather_briefcase`');
    expect(md).toContain('| Field | Ours (catalog.ts) | rpg.actor |');
    expect(md).toContain('| title | Leather Briefcase | Renamed |');
    expect(md).toContain(
      '| description | A trusty briefcase, for your daily commute | Now with a \\| pipe |',
    );
    expect(md).toContain('pnpm rpg:sync-catalog');
    expect(md).toContain('`new_thing`');
    expect(md).toContain('does not list these disabled items: `sifa_suit`');
  });

  it('reports a clean run', () => {
    const md = renderRpgCatalogDriftMarkdown(
      compareRpgCatalog(RPG_ITEMS, catalog(RPG_ITEMS.map(toRemote))),
    );
    expect(md).toContain('No drift');
  });
});
