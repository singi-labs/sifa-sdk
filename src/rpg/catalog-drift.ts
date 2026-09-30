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
 * The item data fields our catalog copies from rpg.actor. All of them must
 * match. Our own fields (`id` aside, `unlock` and `enabled`) are not rpg.actor
 * data, and rpg.actor's `context` is not stored in the catalog at all.
 */
export const RPG_ITEM_DATA_FIELDS = [
  'title',
  'description',
  'kind',
  'category',
  'channels',
  'assetCid',
  'iconCid',
] as const;
export type RpgItemDataField = (typeof RPG_ITEM_DATA_FIELDS)[number];

export interface RpgCatalogMismatch {
  item: string;
  field: RpgItemDataField | 'listed';
  ours: string;
  theirs: string;
}

export interface RpgCatalogDriftResult {
  ok: boolean;
  providerMismatch: { expected: string; actual: string } | null;
  mismatches: RpgCatalogMismatch[];
  /** Items rpg.actor lists that we do not have. Informational only. */
  extra: string[];
  /** Disabled items of ours that rpg.actor does not list. Informational only. */
  missingDisabled: string[];
}

/** Same value for the catalog's purposes (strings, or the channels array). */
export function sameRpgFieldValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function display(value: string | string[] | undefined): string {
  if (value === undefined) return '(absent)';
  return Array.isArray(value) ? value.join(', ') : value;
}

export function compareRpgCatalog(
  ours: readonly RpgItem[],
  theirs: RpgActorCatalog,
  expectedProvider: string = SIFA_RPG_PROVIDER_DID,
): RpgCatalogDriftResult {
  const remote = new Map(theirs.items.map((i) => [i.item, i]));
  const mismatches: RpgCatalogMismatch[] = [];
  const missingDisabled: string[] = [];

  // Disabled items are compared too: their data is reviewed copy that ships
  // the moment they are enabled.
  for (const item of ours) {
    const r = remote.get(item.id);
    if (!r) {
      if (item.enabled) {
        mismatches.push({ item: item.id, field: 'listed', ours: 'yes', theirs: 'missing' });
      } else {
        missingDisabled.push(item.id);
      }
      continue;
    }
    for (const field of RPG_ITEM_DATA_FIELDS) {
      if (!sameRpgFieldValue(item[field], r[field])) {
        mismatches.push({
          item: item.id,
          field,
          ours: display(item[field]),
          theirs: display(r[field]),
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

  return {
    ok: !providerMismatch && mismatches.length === 0,
    providerMismatch,
    mismatches,
    extra,
    missingDisabled,
  };
}

/** Escape a value for a Markdown table cell. */
function cell(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

export function renderRpgCatalogDriftMarkdown(result: RpgCatalogDriftResult): string {
  const lines = ['## rpg.actor item catalog drift', ''];
  if (result.ok) lines.push('No drift: every Sifa item matches rpg.actor.', '');
  if (result.providerMismatch) {
    lines.push(
      `**Provider mismatch:** expected \`${result.providerMismatch.expected}\`, got \`${result.providerMismatch.actual}\`.`,
      '',
    );
  }
  if (result.mismatches.length > 0) {
    const byItem = new Map<string, RpgCatalogMismatch[]>();
    for (const m of result.mismatches) byItem.set(m.item, [...(byItem.get(m.item) ?? []), m]);
    for (const [item, ms] of byItem) {
      lines.push(
        `### \`${item}\``,
        '',
        '| Field | Ours (catalog.ts) | rpg.actor |',
        '| --- | --- | --- |',
      );
      for (const m of ms) lines.push(`| ${m.field} | ${cell(m.ours)} | ${cell(m.theirs)} |`);
      lines.push('');
    }
    lines.push(
      "To adopt rpg.actor's values, run `pnpm rpg:sync-catalog` with `RPG_ACTOR_API_KEY` set, review the diff to `src/rpg/catalog.ts`, and commit.",
      '',
    );
  }
  if (result.extra.length > 0) {
    lines.push(
      `Notice: rpg.actor lists items not in our catalog: ${result.extra.map((id) => `\`${id}\``).join(', ')}. \`pnpm rpg:sync-catalog\` adds them disabled.`,
      '',
    );
  }
  if (result.missingDisabled.length > 0) {
    lines.push(
      `Notice: rpg.actor does not list these disabled items: ${result.missingDisabled.map((id) => `\`${id}\``).join(', ')}.`,
      '',
    );
  }
  return lines.join('\n');
}
