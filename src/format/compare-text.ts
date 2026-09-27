const COLLATOR = new Intl.Collator('en');

/**
 * Compare two display strings for sorting, with a fixed collation locale.
 *
 * A bare `a.localeCompare(b)` follows the runtime's default locale, which is
 * the server's on the server and the visitor's on the client. Mixed-script
 * lists (Latin and Cyrillic skill names, for example) then sort differently on
 * each side, and React discards the server HTML as a hydration mismatch. Use
 * this for every name sort whose output is rendered.
 */
export function compareText(a: string, b: string): number {
  return COLLATOR.compare(a, b);
}
