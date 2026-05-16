/**
 * Sifa typography tokens -- font families and fallback stacks.
 *
 * Source of truth: `Singi Labs/brand/design-system.md` §Typography. Three
 * families, with explicit fallback chains so consumers can paste straight
 * into a CSS `font-family` declaration or a React Native style.
 *
 * Self-hosted fonts (Sifa-web ships `iA Writer Quattro` + `Space Grotesk`
 * WOFF2 files; sifa-app will need to bundle equivalents). The SDK only
 * encodes the names + fallbacks; consumers handle font loading.
 */

const SYSTEM_SANS_FALLBACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const SYSTEM_MONO_FALLBACK = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

export const fonts = {
  /** Body text -- iA Writer Quattro (self-hosted, OFL-licensed). */
  sans: 'iA Writer Quattro',
  /** Headings (h1-h3) -- Space Grotesk Bold (self-hosted). Single weight (700). */
  display: 'Space Grotesk',
  /** Code / monospace -- Source Code Pro (loaded via `next/font` in Next.js consumers). */
  mono: 'Source Code Pro',
} as const;

export const fontFallbackStacks = {
  sans: `'${fonts.sans}', ${SYSTEM_SANS_FALLBACK}`,
  display: `'${fonts.display}', '${fonts.sans}', system-ui, sans-serif`,
  mono: `'${fonts.mono}', ${SYSTEM_MONO_FALLBACK}`,
} as const;

export type Fonts = typeof fonts;
export type FontFallbackStacks = typeof fontFallbackStacks;
