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

// Noto Sans subsets layered after the brand fonts to cover scripts the
// brand fonts don't ship. Consumers wire @font-face with `unicode-range`
// so browsers fetch a file only when a glyph in that range is rendered.
const INTL_SCRIPT_FALLBACK =
  "'Noto Sans', 'Noto Sans Arabic', 'Noto Sans Devanagari', 'Noto Sans Thai', 'Noto Sans Hebrew'";

// OS-installed CJK fonts. Sifa intentionally does not ship CJK web fonts:
// every CJK user already has an OS-level CJK font and vendoring them
// would add 14+ MB. Listed JP-first, then SC, TC, KR, with Noto Sans CJK
// per-script as the Linux fallback.
const CJK_SYSTEM_FALLBACK =
  "'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', 'Noto Sans CJK JP', " +
  "'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', " +
  "'PingFang TC', 'Microsoft JhengHei', 'Noto Sans CJK TC', " +
  "'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans CJK KR'";

export const fonts = {
  /** Body text -- iA Writer Quattro (self-hosted, OFL-licensed). */
  sans: 'iA Writer Quattro',
  /** Headings (h1-h3) -- Space Grotesk Bold (self-hosted). Single weight (700). */
  display: 'Space Grotesk',
  /** Code / monospace -- Source Code Pro (loaded via `next/font` in Next.js consumers). */
  mono: 'Source Code Pro',
} as const;

export const fontFallbackStacks = {
  sans: `'${fonts.sans}', ${INTL_SCRIPT_FALLBACK}, ${CJK_SYSTEM_FALLBACK}, ${SYSTEM_SANS_FALLBACK}`,
  display: `'${fonts.display}', '${fonts.sans}', ${INTL_SCRIPT_FALLBACK}, ${CJK_SYSTEM_FALLBACK}, system-ui, sans-serif`,
  mono: `'${fonts.mono}', ${SYSTEM_MONO_FALLBACK}`,
} as const;

export type Fonts = typeof fonts;
export type FontFallbackStacks = typeof fontFallbackStacks;
