/** Shared URL helpers for the JSON-LD emitters. */

export const DEFAULT_BASE_URL = 'https://sifa.id';

/**
 * Drop trailing slashes from a caller-supplied base URL.
 *
 * Written as a scan rather than `replace(/\/+$/, '')` on purpose: the regex
 * form is a polynomial-backtracking hazard on input the library does not
 * control (CodeQL js/polynomial-redos). This runs in linear time.
 */
export function normaliseBaseUrl(baseUrl: string | undefined): string {
  const value = baseUrl ?? DEFAULT_BASE_URL;
  let end = value.length;
  while (end > 0 && value.charCodeAt(end - 1) === 0x2f) end -= 1;
  return value.slice(0, end);
}

export function profileUrl(baseUrl: string, handle: string): string {
  return `${baseUrl}/p/${handle}`;
}
