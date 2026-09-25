import { RPG_ITEMS, type RpgItem, type RpgUnlock } from './catalog.js';

/**
 * Profile signals the unlock rules are checked against. Callers must pass
 * lowercase platform codes (e.g. 'github', 'orcid') and registry app ids (e.g. 'tangled').
 */
export interface RpgUnlockSignals {
  collections: readonly string[];
  externalPlatforms: readonly string[];
  activeAppIds: readonly string[];
  hasDoctorate: boolean;
}

/** One enabled catalog item and whether the signals earn it. */
export interface RpgUnlockResult {
  item: RpgItem;
  earned: boolean;
}

function matches(u: RpgUnlock, s: RpgUnlockSignals): boolean {
  switch (u.kind) {
    case 'hasRecord':
      return s.collections.includes(u.collection);
    case 'hasExternalAccount':
      return u.platforms.some((p) => s.externalPlatforms.includes(p));
    case 'usesApp':
      return s.activeAppIds.includes(u.appId);
    case 'hasDoctorate':
      return s.hasDoctorate;
  }
}

/** Evaluate every enabled item (ANY matching unlock earns it); disabled items are omitted. */
export function evaluateRpgUnlocks(
  signals: RpgUnlockSignals,
  items: readonly RpgItem[] = RPG_ITEMS,
): RpgUnlockResult[] {
  return items
    .filter((item) => item.enabled)
    .map((item) => ({ item, earned: item.unlock.some((u) => matches(u, signals)) }));
}
