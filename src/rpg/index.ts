/**
 * `@singi-labs/sifa-sdk/rpg` -- the Sifa item catalog for rpg.actor and the
 * pure predicate that decides which items a profile has earned. No network
 * calls; safe to import anywhere.
 */
export {
  RPG_ITEMS,
  RpgItemSchema,
  RpgUnlockSchema,
  type RpgItem,
  type RpgUnlock,
} from './catalog.js';
export { evaluateRpgUnlocks, type RpgUnlockResult, type RpgUnlockSignals } from './unlocks.js';
