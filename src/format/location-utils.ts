import type { LocationValue } from '../types/index.js';

/**
 * Format a LocationValue for display.
 *
 * Prefers `locality` (the community.lexicon.location.address field) and
 * falls back to the legacy `city` slot so values produced before the
 * sifa-api alias migration still render correctly during the additive
 * transition window.
 */
export function formatLocation(loc: LocationValue | null | undefined): string {
  if (!loc) return '';
  const locality = loc.locality ?? loc.city;
  const parts = [locality, loc.region, loc.country].filter(Boolean);
  if (loc.postalCode && !locality) {
    return `${loc.postalCode}, ${loc.country}`;
  }
  return parts.join(', ');
}

/** Parse a display string back into a LocationValue (best-effort for legacy data) */
export function parseLocationString(str: string): LocationValue | null {
  if (!str.trim()) return null;
  const parts = str
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 3) {
    return {
      city: parts[0],
      region: parts[1],
      country: parts[parts.length - 1]!,
    };
  }
  if (parts.length === 2) {
    return {
      city: parts[0],
      country: parts[1]!,
    };
  }
  return { country: parts[0]! };
}

/** Convert ISO 3166-1 alpha-2 country code to flag emoji */
export function countryCodeToFlag(code: string | undefined): string {
  if (!code || code.length !== 2) return '';
  const upper = code.toUpperCase();
  const a = upper.codePointAt(0);
  const b = upper.codePointAt(1);
  if (a === undefined || b === undefined) return '';
  return String.fromCodePoint(a - 0x41 + 0x1f1e6, b - 0x41 + 0x1f1e6);
}
