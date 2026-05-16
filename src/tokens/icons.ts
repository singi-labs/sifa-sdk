/**
 * Sifa icon-set conventions.
 *
 * Source of truth: `Singi Labs/brand/design-system.md` §Icons. Phosphor
 * Icons is the only icon library used across Singi Labs products; mixing
 * icon families within a product is forbidden by convention.
 *
 * The weight conventions are guidance for consumers, not enforced. Encoded
 * here so tooling (e.g., a future "design lint" check) can reference them.
 */

export const iconSet = 'phosphor' as const;

export const iconWeights = {
  /** UI chrome -- buttons, nav, default state. */
  uiChrome: 'regular',
  /** Interactive / active states -- selected items, primary buttons. */
  interactive: 'bold',
  /** Decorative / illustration -- empty states, hero sections. */
  decorative: 'duotone',
} as const;

export type IconSet = typeof iconSet;
export type IconWeights = typeof iconWeights;
