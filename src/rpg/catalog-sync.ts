/**
 * Pure transform behind scripts/sync-rpg-catalog.mjs: given our catalog data
 * and the items rpg.actor serves, work out the catalog we would have after
 * adopting rpg.actor's item data. No network, no file access. Internal:
 * deliberately not re-exported from the `/rpg` barrel.
 *
 * Only the item data fields (`RPG_ITEM_DATA_FIELDS`) are taken from rpg.actor.
 * Our own fields (`id`, `unlock`, `enabled`) are kept. Items rpg.actor lists
 * that we do not have are appended disabled, with a placeholder unlock rule.
 */
import { RpgItemSchema, type RpgItem, type RpgUnlock } from './catalog.js';
import {
  RPG_ITEM_DATA_FIELDS,
  sameRpgFieldValue,
  type RpgActorItem,
  type RpgItemDataField,
} from './catalog-drift.js';

/**
 * Unlock rule for items added by the sync. The schema needs at least one
 * rule, so this is a `usesApp` rule for an app id that no registry app has:
 * it can never match, so an item enabled by mistake before its real rule is
 * written stays unearned instead of being handed out.
 */
export const RPG_UNLOCK_PLACEHOLDER: RpgUnlock = { kind: 'usesApp', appId: 'todo-unlock-rule' };

export interface RpgCatalogSyncChange {
  item: string;
  field: RpgItemDataField;
  before: string | string[] | undefined;
  after: string | string[] | undefined;
}

export interface RpgCatalogSyncResult {
  /** The catalog after the sync: our items in our order, then added items. */
  items: RpgItem[];
  /** Field changes to existing items. */
  changes: RpgCatalogSyncChange[];
  /** Ids of items appended (disabled). */
  added: string[];
  /** Items left as they are because rpg.actor's data would not pass the schema. */
  skipped: { item: string; reason: string }[];
  /** Items whose icon is new or changed; the icon has to be copied to sifa-web. */
  iconUpdates: { item: string; iconCid: string }[];
}

function validateItem(candidate: unknown): { data: RpgItem } | { reason: string } {
  const parsed = RpgItemSchema.safeParse(candidate);
  if (parsed.success) return { data: parsed.data };
  return {
    reason: parsed.error.issues
      .map((i) => `${i.path.join('.') || '(item)'}: ${i.message}`)
      .join('; '),
  };
}

export function syncRpgCatalog(
  ours: readonly RpgItem[],
  theirs: readonly RpgActorItem[],
): RpgCatalogSyncResult {
  const remote = new Map(theirs.map((i) => [i.item, i]));
  const items: RpgItem[] = [];
  const changes: RpgCatalogSyncChange[] = [];
  const added: string[] = [];
  const skipped: { item: string; reason: string }[] = [];
  const iconUpdates: { item: string; iconCid: string }[] = [];

  for (const item of ours) {
    const r = remote.get(item.id);
    if (!r) {
      items.push(item);
      continue;
    }
    const candidate: Record<string, unknown> = { ...item };
    const itemChanges: RpgCatalogSyncChange[] = [];
    for (const field of RPG_ITEM_DATA_FIELDS) {
      const after = r[field];
      // A required field rpg.actor leaves out is kept as ours; only the
      // optional `channels` can be dropped.
      if (after === undefined && field !== 'channels') continue;
      if (sameRpgFieldValue(item[field], after)) continue;
      if (after === undefined) delete candidate[field];
      else candidate[field] = Array.isArray(after) ? [...after] : after;
      itemChanges.push({ item: item.id, field, before: item[field], after });
    }
    if (itemChanges.length === 0) {
      items.push(item);
      continue;
    }
    const checked = validateItem(candidate);
    if ('reason' in checked) {
      skipped.push({ item: item.id, reason: checked.reason });
      items.push(item);
      continue;
    }
    items.push(checked.data);
    changes.push(...itemChanges);
    if (itemChanges.some((c) => c.field === 'iconCid')) {
      iconUpdates.push({ item: item.id, iconCid: checked.data.iconCid });
    }
  }

  const ourIds = new Set(ours.map((i) => i.id));
  for (const r of theirs) {
    if (ourIds.has(r.item)) continue;
    const checked = validateItem({
      id: r.item,
      title: r.title,
      description: r.description,
      kind: r.kind,
      category: r.category,
      ...(r.channels === undefined ? {} : { channels: [...r.channels] }),
      assetCid: r.assetCid,
      iconCid: r.iconCid,
      enabled: false,
      unlock: [RPG_UNLOCK_PLACEHOLDER],
    });
    if ('reason' in checked) {
      skipped.push({ item: r.item, reason: checked.reason });
      continue;
    }
    items.push(checked.data);
    added.push(r.item);
    iconUpdates.push({ item: r.item, iconCid: checked.data.iconCid });
  }

  return { items, changes, added, skipped, iconUpdates };
}
