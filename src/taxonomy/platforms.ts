/**
 * Platform identifiers, labels, and URL helpers used in profile external accounts.
 *
 * This file is intentionally data-only -- icon mapping is platform-specific
 * (React DOM components on web, React Native components on mobile) and lives
 * in the consumer.
 */

export const PLATFORM_LABELS = {
  bluesky: 'Bluesky',
  github: 'GitHub',
  codeberg: 'Codeberg',
  gitlab: 'GitLab',
  forgejo: 'Forgejo',
  gitea: 'Gitea',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  twitter: 'X (Twitter)',
  instagram: 'Instagram',
  substack: 'Substack',
  tangled: 'Tangled',
  dns: 'Domain',
  website: 'Website',
  rss: 'RSS',
  fediverse: 'Fediverse',
  orcid: 'ORCID',
  keyoxide: 'Keyoxide',
} as const;

export type PlatformId = keyof typeof PLATFORM_LABELS;

/** Prefix of the lexicon platform knownValue tokens (e.g. id.sifa.defs#platformLinkedin). */
const PLATFORM_TOKEN_PREFIX = 'id.sifa.defs#platform';

/**
 * Normalize a platform value to the short code used throughout the app (the
 * editor, the API `VALID_PLATFORMS` enum, the DB, and {@link PLATFORM_LABELS}).
 *
 * External-account records may carry `platform` as the raw lexicon knownValue
 * token (`id.sifa.defs#platformLinkedin`) instead of the short code — written by
 * some third-party apps. This maps the token to its lowercase suffix
 * (`linkedin`) and passes short codes / unknown values through unchanged.
 */
export function normalizePlatformId(platform: string): string {
  if (platform.startsWith(PLATFORM_TOKEN_PREFIX)) {
    return platform.slice(PLATFORM_TOKEN_PREFIX.length).toLowerCase();
  }
  return platform;
}

export function isKnownPlatform(platform: string): platform is PlatformId {
  return platform in PLATFORM_LABELS;
}

export function getPlatformLabel(platform: string): string {
  const normalized = normalizePlatformId(platform);
  return isKnownPlatform(normalized) ? PLATFORM_LABELS[normalized] : PLATFORM_LABELS.website;
}

/** Platforms excluded from the "Add Links" dropdown (auto-derived or not accepted by API). */
const EXCLUDED_FROM_DROPDOWN = new Set<PlatformId>(['bluesky', 'dns', 'tangled']);

/** Platforms available in the "Add Links" dropdown. */
export const PLATFORM_OPTIONS: ReadonlyArray<{ value: PlatformId; label: string }> = (
  Object.entries(PLATFORM_LABELS) as [PlatformId, string][]
)
  .filter(([value]) => !EXCLUDED_FROM_DROPDOWN.has(value))
  .map(([value, label]) => ({ value, label }));

/**
 * Build a favicon URL for a given site URL using Google's public favicon service.
 * Returns `null` if the URL cannot be parsed.
 */
export function getFaviconUrl(siteUrl: string): string | null {
  try {
    const { hostname } = new URL(siteUrl);
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=32`;
  } catch {
    return null;
  }
}
