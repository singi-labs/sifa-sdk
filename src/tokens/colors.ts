/**
 * Sifa brand colors -- accent values from the Singi Labs design system.
 *
 * Source of truth: `Singi Labs/brand/design-system.md` §Colors. Sifa uses a
 * distinct Flexoki accent from sibling Singi Labs products (Barazo, Singi
 * Labs itself); Flexoki Purple is the shared secondary accent across the
 * product family.
 *
 * NOTE: Neutral scales (background, surface, border, text) are not encoded
 * here. They come from Radix Colors (12-step scales with automatic
 * light/dark mode) and resolve at runtime via CSS variables in
 * `sifa-web`'s `globals.css`. Encoding them as TS constants would
 * misrepresent how they're consumed.
 */

export const colors = {
  /** Flexoki Blue -- Sifa's primary accent. */
  primary: '#4385BE',
  /** Flexoki Purple -- secondary accent, shared across Singi Labs products. */
  secondary: '#8B7EC8',
} as const;

export type Colors = typeof colors;
