/**
 * `@singi-labs/sifa-sdk/flags` -- Self-hosted Twemoji country flag SVGs.
 *
 * Shipped so sifa-web's OG image renderer and the planned sifa-app share the
 * same flag assets without a CDN dependency at render time. Keys are
 * ISO-3166 alpha-2 lowercase. Values are minified SVG strings.
 *
 * Source: Twemoji v14.0.2 (CC-BY 4.0, see NOTICE).
 */

import flagData from './data/index.json' with { type: 'json' };

const flags: Record<string, string> = flagData;

/**
 * Return the SVG string for a country code, or `null` if unknown.
 * Case-insensitive: accepts both `'NL'` and `'nl'`.
 */
export function getFlagSvg(cc: string): string | null {
  if (typeof cc !== 'string' || cc.length === 0) return null;
  const key = cc.toLowerCase();
  return flags[key] ?? null;
}

/**
 * Return the sorted, lowercase list of supported ISO-3166 alpha-2 codes.
 */
export function listSupportedCountryCodes(): string[] {
  return Object.keys(flags).sort();
}
