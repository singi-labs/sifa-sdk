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
  description: `${item.description} (theirs)`,
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
  it('reports no drift when every enabled item matches (description is ignored)', () => {
    const result = compareRpgCatalog(RPG_ITEMS, catalog(RPG_ITEMS.map(toRemote)));
    expect(result.ok).toBe(true);
    expect(result.mismatches).toEqual([]);
    expect(result.extra).toEqual([]);
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

  it('skips disabled items', () => {
    const ours = RPG_ITEMS.map((i) => (i.id === 'lab_coat' ? { ...i, enabled: false } : i));
    const remote = RPG_ITEMS.filter((i) => i.id !== 'lab_coat').map(toRemote);
    expect(compareRpgCatalog(ours, catalog(remote)).ok).toBe(true);
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
  it('renders a mismatch table and the extra-item notice', () => {
    const remote = RPG_ITEMS.map(toRemote);
    remote[0] = { ...remote[0]!, title: 'Renamed' };
    const md = renderRpgCatalogDriftMarkdown(
      compareRpgCatalog(RPG_ITEMS, catalog([...remote, { ...remote[1]!, item: 'new_thing' }])),
    );
    expect(md).toContain('| leather_briefcase | title | Leather Briefcase | Renamed |');
    expect(md).toContain('`new_thing`');
  });

  it('reports a clean run', () => {
    const md = renderRpgCatalogDriftMarkdown(
      compareRpgCatalog(RPG_ITEMS, catalog(RPG_ITEMS.map(toRemote))),
    );
    expect(md).toContain('No drift');
  });
});
