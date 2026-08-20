/**
 * How much of the URL path to keep in the display string.
 *
 * - `full`: keep the whole pathname (the path is identity, e.g.
 *   `github.com/user/repo` or `mastodon.social/@handle`).
 * - `firstSegment`: keep only the first path segment (`gui.do/events`) -- enough
 *   to say "which page" without the deep-slug / marketing cruft.
 * - `none`: host only (`gui.do`).
 */
export type UrlPathPolicy = 'full' | 'firstSegment' | 'none';

export interface FormatDisplayUrlOptions {
  path?: UrlPathPolicy;
}

export interface DisplayUrl {
  /** The cleaned label to show (no scheme, no `www.`, no query/hash). */
  display: string;
  /** The full, navigable URL for an `<a href>` / hover title. */
  href: string;
}

/**
 * Best-effort parse. Tries the input as-is, then (for scheme-less input like
 * `example.com`) with an `https://` prefix. Returns `null` when neither parses,
 * so the caller can fall back instead of throwing -- an uncaught `new URL()`
 * throw inside a Server Component takes down the whole render.
 */
function tryParseUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    // fall through
  }
  if (!/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
    try {
      return new URL(`https://${raw}`);
    } catch {
      // fall through
    }
  }
  return null;
}

/**
 * Canonical URL display formatter, shared by every surface that shows a link
 * (profile projects, external accounts, identity-card website). Produces a tidy
 * label plus the real destination, so consumers never re-implement the strip.
 *
 * Rules: drop the scheme and a leading `www.`, drop the query string and hash,
 * drop a trailing slash, and apply the `path` policy. `display` is the label;
 * `href` is the full canonical URL (scheme + query + hash preserved) for the
 * anchor and its hover `title`.
 *
 * Truncation/ellipsis is deliberately NOT handled here -- it is a view concern
 * that depends on the rendered width, so consumers truncate with CSS
 * (`text-overflow: ellipsis`) and keep the full value in `href`/`title`.
 */
export function formatDisplayUrl(url: string, options: FormatDisplayUrlOptions = {}): DisplayUrl {
  const { path = 'full' } = options;
  const raw = (url ?? '').trim();
  if (!raw) return { display: '', href: '' };

  const parsed = tryParseUrl(raw);

  // Unparseable even with a prepended scheme: return a best-effort label and
  // keep the raw value as href. Never throw.
  if (!parsed) {
    return { display: raw.replace(/^dns:/i, ''), href: raw };
  }

  // Non-web scheme (`dns:`, `mailto:`, ...): keep it addressable, strip the
  // scheme for display.
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    const display = raw.replace(/^[a-z][a-z0-9+.-]*:/i, '').replace(/^\/\//, '') || raw;
    return { display, href: raw };
  }

  const host = parsed.hostname.replace(/^www\./i, '');
  const segments = parsed.pathname.split('/').filter(Boolean);

  let pathPart = '';
  if (path === 'full' && segments.length > 0) {
    pathPart = `/${segments.join('/')}`;
  } else if (path === 'firstSegment' && segments.length > 0) {
    pathPart = `/${segments[0]}`;
  }

  return { display: `${host}${pathPart}`, href: parsed.href };
}
