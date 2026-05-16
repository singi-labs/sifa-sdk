/**
 * `@singi-labs/sifa-sdk/tokens` -- Sifa brand design tokens.
 *
 * Encoded from `Singi Labs/brand/design-system.md`. Optional for third
 * parties; primary consumers are `sifa-web` (Tailwind config + font CSS)
 * and the planned `sifa-app` (React Native style objects).
 *
 * Decision (2026-05-14, reaffirmed 2026-05-16): TS constants only. No CSS
 * variable strings, no Style Dictionary output. Consumers translate to
 * their own format.
 */

export { colors, type Colors } from './colors.js';
export { fonts, fontFallbackStacks, type Fonts, type FontFallbackStacks } from './typography.js';
export { iconSet, iconWeights, type IconSet, type IconWeights } from './icons.js';
