import type { PdsProviderInfo } from '../types/index.js';

export interface PdsProvider {
  name: string;
  profileUrl: string;
  host?: string;
}

const BSKY_PROFILE_BASE = 'https://bsky.app/profile/';

const PDS_PROVIDERS: { suffix: string; name: string }[] = [
  { suffix: '.bsky.social', name: 'bluesky' },
  { suffix: '.blacksky.app', name: 'blacksky' },
  { suffix: '.eurosky.social', name: 'eurosky' },
  { suffix: '.northsky.social', name: 'northsky' },
];

const KNOWN_PROVIDER_NAMES = new Set(PDS_PROVIDERS.map((p) => p.name));

const ICON_ONLY_PROVIDERS = new Set(['selfhosted-social', 'selfhosted']);

export function pdsProviderFromApi(
  apiProvider: PdsProviderInfo | null | undefined,
  handle: string,
): PdsProvider | null {
  if (!apiProvider) return null;
  if (ICON_ONLY_PROVIDERS.has(apiProvider.name)) {
    return { name: apiProvider.name, profileUrl: '', host: apiProvider.host };
  }
  if (!KNOWN_PROVIDER_NAMES.has(apiProvider.name)) return null;
  return {
    name: apiProvider.name,
    profileUrl: `${BSKY_PROFILE_BASE}${handle}`,
    host: apiProvider.host,
  };
}

export function getHandleStem(handle: string): string {
  const lower = handle.toLowerCase();
  for (const provider of PDS_PROVIDERS) {
    if (lower.endsWith(provider.suffix) && lower.length > provider.suffix.length) {
      return handle.slice(0, -provider.suffix.length);
    }
  }
  return handle;
}

export function getDisplayLabel(displayName: string | undefined, handle: string): string {
  if (displayName) return displayName;
  return getHandleStem(handle);
}

/**
 * Combine optional structured name fields (`id.sifa.profile.self.givenName`,
 * `familyName`) into a single string in Schema.org `Person` order — given
 * before family. Returns `undefined` when both are absent so callers can
 * fall back to `displayName`. Whitespace-only inputs are treated as absent.
 * Does not impose cultural ordering: users whose preferred presentation
 * differs (e.g. Eastern name order) should set `displayName` accordingly,
 * which this helper deliberately does not consult.
 */
export function formatStructuredName(
  givenName: string | undefined,
  familyName: string | undefined,
): string | undefined {
  const given = givenName?.trim();
  const family = familyName?.trim();
  if (given && family) return `${given} ${family}`;
  return given || family || undefined;
}

/**
 * Words of a name or honorific, compared loosely: case and the dots and commas
 * people write inconsistently (`Dr` / `Dr.`, `PhD` / `Ph.D.`) are ignored.
 */
function honorificWords(text: string): string[] {
  return text
    .split(/[\s,]+/)
    .map((word) => word.replace(/[.,]/g, '').toLowerCase())
    .filter(Boolean);
}

function sameWords(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((word, i) => word === sortedB[i]);
}

/**
 * A name with its honorifics: `Dr. Jane Doe PhD`. The prefix goes before the
 * name and the suffix after it, separated by spaces. A suffix the user starts
 * with a comma (`, PhD`) keeps it, so the US `Jane Doe, PhD` style stays
 * available without forcing it on everyone. Honorifics the name already starts
 * or ends with (a display name written as `Dr. Jane Doe`) are not repeated; for
 * a suffix with several parts, only when all of them are there. An empty name
 * stays empty, and blank honorifics are ignored.
 */
export function formatNameWithHonorifics(
  name: string,
  honorificPrefix: string | undefined,
  honorificSuffix: string | undefined,
): string {
  const base = name.trim();
  if (!base) return base;
  const nameWords = honorificWords(base);

  const prefix = honorificPrefix?.trim() ?? '';
  const prefixWords = honorificWords(prefix);
  const hasPrefix = prefixWords.length > 0 && prefixWords.every((word, i) => nameWords[i] === word);
  const withPrefix = prefixWords.length > 0 && !hasPrefix ? `${prefix} ${base}` : base;

  const rawSuffix = honorificSuffix?.trim() ?? '';
  const leadingComma = rawSuffix.startsWith(',');
  const suffix = rawSuffix.replace(/^,\s*/, '');
  const suffixWords = honorificWords(suffix);
  if (suffixWords.length === 0) return withPrefix;
  if (sameWords(nameWords.slice(-suffixWords.length), suffixWords)) return withPrefix;
  return leadingComma ? `${withPrefix}, ${suffix}` : `${withPrefix} ${suffix}`;
}

const PDS_DISPLAY_NAMES: Record<string, string> = {
  bluesky: 'Bluesky',
  blacksky: 'BlackSky',
  eurosky: 'EuroSky',
  northsky: 'NorthSky',
  'selfhosted-social': 'Self-hosted',
  selfhosted: 'Self-hosted',
};

export function getPdsDisplayName(providerName: string): string {
  return PDS_DISPLAY_NAMES[providerName] ?? providerName;
}

export function detectPdsProvider(handle: string): PdsProvider | null {
  const lower = handle.toLowerCase();
  for (const provider of PDS_PROVIDERS) {
    if (lower.endsWith(provider.suffix)) {
      return {
        name: provider.name,
        profileUrl: `${BSKY_PROFILE_BASE}${handle}`,
      };
    }
  }
  return null;
}
