/**
 * Publisher registry — single source of truth for apps that publish documents
 * through the shared `site.standard.*` namespace (Leaflet, Pckt, Offprint, …).
 *
 * Why this exists:
 * A document published via Leaflet, Pckt, Offprint, etc. lives canonically as a
 * `site.standard.document` record. The publisher is metadata, identifiable from
 * the publication's hostname. The activity-card, the publication merger in
 * sifa-api, and the external-URL health scanner all need the same hostname →
 * publisher mapping. Keeping it in one place stops the registry from drifting.
 *
 * What lives here:
 * - `id`     — stable appId, also keys sifa-web's branding (logo, color)
 * - `name`   — display name
 * - `hostSuffixes` — hostnames that identify a publication URL as this publisher
 * - `homeUrl` — last-resort URL when no per-document URL is available
 *
 * What does NOT live here:
 * - Logo components, color tokens, React chrome — those belong in sifa-web
 *   keyed by `id`.
 * - Per-document URL construction — Standard documents are always
 *   `${publication.url}${document.path}`. The publisher doesn't change that.
 */

export interface Publisher {
  /**
   * Stable identifier. Used as the `appId` across Sifa so that sifa-web's
   * `getAppMeta(id)` lookup yields the right logo and color, and so that
   * activity-stat rows tag correctly.
   */
  id: string;

  /** Display name shown in pills and headers. */
  name: string;

  /**
   * Hostnames that identify a publication URL as belonging to this publisher.
   * Matches the publication URL's hostname when it equals the suffix
   * (e.g. `leaflet.pub`) OR ends with it as a dotted suffix
   * (e.g. `notesbyarielm.leaflet.pub`).
   *
   * Allow multiple entries to future-proof against rebrands or aliases.
   */
  hostSuffixes: readonly string[];

  /** Public homepage of the publisher, used as a profile-level fallback URL. */
  homeUrl: string;
}

/**
 * Neutral fallback used when no branded publisher matches.
 *
 * Synthetic publishers returned by `getPublisherFromSiteUrl` use this `id` but
 * carry the document's own hostname in `name`, so cards can still show e.g.
 * "feeds.byarielm.fyi" as the publisher label.
 */
export const STANDARD_PUBLISHER_ID = 'standard' as const;

export const PUBLISHERS: readonly Publisher[] = Object.freeze([
  {
    id: 'leaflet',
    name: 'Leaflet',
    hostSuffixes: ['leaflet.pub'],
    homeUrl: 'https://leaflet.pub',
  },
  {
    id: 'pckt',
    name: 'pckt',
    hostSuffixes: ['pckt.blog'],
    homeUrl: 'https://pckt.blog',
  },
  {
    id: 'offprint',
    name: 'Offprint',
    hostSuffixes: ['offprint.app'],
    homeUrl: 'https://offprint.app',
  },
  {
    id: 'whitewind',
    name: 'WhiteWind',
    hostSuffixes: ['whtwnd.com'],
    homeUrl: 'https://whtwnd.com',
  },
  {
    id: 'unthread',
    name: 'Unthread',
    hostSuffixes: ['unthread.at'],
    homeUrl: 'https://unthread.at',
  },
  {
    id: 'blento',
    name: 'Blento',
    hostSuffixes: ['blento.io'],
    homeUrl: 'https://blento.io',
  },
]);

const PUBLISHERS_BY_ID: ReadonlyMap<string, Publisher> = new Map(PUBLISHERS.map((p) => [p.id, p]));

/** Lookup a registered publisher by id. Returns `undefined` for unknown ids. */
export function getPublisherById(id: string): Publisher | undefined {
  return PUBLISHERS_BY_ID.get(id);
}

/**
 * Match a hostname against the registry. Returns the registered publisher when
 * the hostname equals or is a dotted-subdomain of any of its `hostSuffixes`.
 * Returns `undefined` when no match is found (caller decides on the fallback).
 */
export function getPublisherByHost(hostname: string): Publisher | undefined {
  const host = hostname.toLowerCase();
  for (const publisher of PUBLISHERS) {
    for (const suffix of publisher.hostSuffixes) {
      if (host === suffix || host.endsWith(`.${suffix}`)) {
        return publisher;
      }
    }
  }
  return undefined;
}

/**
 * Resolve the publisher for a publication's site URL.
 *
 * - On a branded host: returns the registered `Publisher` verbatim.
 * - On any other valid URL: returns a synthetic neutral publisher with
 *   `id: 'standard'`, `name: <hostname>`, `hostSuffixes: []`, and the URL
 *   as `homeUrl`. Cards can therefore always render a meaningful pill label.
 * - On an unparseable string: returns the same neutral shape with the raw
 *   input as `name` and `homeUrl` (defensive — should never happen for data
 *   coming from a valid `site.standard.publication`).
 */
export function getPublisherFromSiteUrl(siteUrl: string): Publisher {
  let hostname: string;
  let homeUrl: string;
  try {
    const parsed = new URL(siteUrl);
    hostname = parsed.hostname;
    homeUrl = `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return {
      id: STANDARD_PUBLISHER_ID,
      name: siteUrl,
      hostSuffixes: [],
      homeUrl: siteUrl,
    };
  }

  const matched = getPublisherByHost(hostname);
  if (matched) return matched;

  return {
    id: STANDARD_PUBLISHER_ID,
    name: hostname,
    hostSuffixes: [],
    homeUrl,
  };
}
