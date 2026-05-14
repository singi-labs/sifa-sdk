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

export function isKnownPlatform(platform: string): platform is PlatformId {
  return platform in PLATFORM_LABELS;
}

export function getPlatformLabel(platform: string): string {
  return isKnownPlatform(platform) ? PLATFORM_LABELS[platform] : PLATFORM_LABELS.website;
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
