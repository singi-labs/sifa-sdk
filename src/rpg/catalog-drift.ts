/**
 * Pure comparison between our rpg.actor item catalog (`RPG_ITEMS`) and the
 * catalog rpg.actor serves at `GET /api/creator/items`. Used by
 * scripts/check-rpg-catalog.mjs (weekly drift check). Internal: deliberately
 * not re-exported from the `/rpg` barrel.
 */
import type { RpgItem } from './catalog.js';

/** The sifa.id DID that owns the Sifa items on rpg.actor. */
export const SIFA_RPG_PROVIDER_DID = 'did:plc:2f2ahswozqy4v5lvu676375y';

export interface RpgActorItem {
  item: string;
  title?: string;
  description?: string;
  kind?: string;
  category?: string;
  channels?: string[];
  assetCid?: string;
  iconCid?: string;
}

export interface RpgActorCatalog {
  provider: string;
  count?: number;
  items: RpgActorItem[];
}

/**
 * Fields that must match. `description` is left out on purpose: it is flavor
 * text that may be reworded on either side without affecting gifts.
 */
const COMPARED_FIELDS = ['title', 'kind', 'category', 'assetCid', 'iconCid'] as const;

export interface RpgCatalogMismatch {
  item: string;
  field: (typeof COMPARED_FIELDS)[number] | 'listed';
  ours: string;
  theirs: string;
}

export interface RpgCatalogDriftResult {
  ok: boolean;
  providerMismatch: { expected: string; actual: string } | null;
  mismatches: RpgCatalogMismatch[];
  /** Items rpg.actor lists that we do not have. Informational only. */
  extra: string[];
}

export function compareRpgCatalog(
  ours: readonly RpgItem[],
  theirs: RpgActorCatalog,
  expectedProvider: string = SIFA_RPG_PROVIDER_DID,
): RpgCatalogDriftResult {
  const remote = new Map(theirs.items.map((i) => [i.item, i]));
  const mismatches: RpgCatalogMismatch[] = [];

  for (const item of ours) {
    if (!item.enabled) continue;
    const r = remote.get(item.id);
    if (!r) {
      mismatches.push({ item: item.id, field: 'listed', ours: 'yes', theirs: 'missing' });
      continue;
    }
    for (const field of COMPARED_FIELDS) {
      if (item[field] !== r[field]) {
        mismatches.push({
          item: item.id,
          field,
          ours: item[field],
          theirs: r[field] ?? '(absent)',
        });
      }
    }
  }

  const ourIds = new Set(ours.map((i) => i.id));
  const extra = theirs.items.map((i) => i.item).filter((id) => !ourIds.has(id));

  const providerMismatch =
    theirs.provider === expectedProvider
      ? null
      : { expected: expectedProvider, actual: String(theirs.provider) };

  return { ok: !providerMismatch && mismatches.length === 0, providerMismatch, mismatches, extra };
}

export function renderRpgCatalogDriftMarkdown(result: RpgCatalogDriftResult): string {
  const lines = ['## rpg.actor item catalog drift', ''];
  if (result.ok) lines.push('No drift: every enabled Sifa item matches rpg.actor.', '');
  if (result.providerMismatch) {
    lines.push(
      `**Provider mismatch:** expected \`${result.providerMismatch.expected}\`, got \`${result.providerMismatch.actual}\`.`,
      '',
    );
  }
  if (result.mismatches.length > 0) {
    lines.push('| Item | Field | Ours | rpg.actor |', '| --- | --- | --- | --- |');
    for (const m of result.mismatches) {
      lines.push(`| ${m.item} | ${m.field} | ${m.ours} | ${m.theirs} |`);
    }
    lines.push('');
  }
  if (result.extra.length > 0) {
    lines.push(
      `Notice: rpg.actor lists items not in our catalog: ${result.extra.map((id) => `\`${id}\``).join(', ')}.`,
      '',
    );
  }
  return lines.join('\n');
}
