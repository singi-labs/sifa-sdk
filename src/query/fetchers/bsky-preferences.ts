import { ADULT_CONTENT_LABELS, type AdultContentLabel } from '../../cards/adult-content.js';
import {
  apiFetch,
  apiWrite,
  type ApiFetchOptions,
  type SifaApiConfig,
  type WriteResult,
} from '../client.js';

/**
 * Visibility values defined by `app.bsky.actor.defs#contentLabelPref`.
 * `null` means the viewer has no explicit pref for that label — call sites
 * decide a default (Sifa hides by default; Bluesky's own client defaults
 * to `warn` for adult labels on new accounts).
 */
export type BskyContentLabelVisibility = 'ignore' | 'warn' | 'hide';

export type BskyContentLabelPrefs = Record<AdultContentLabel, BskyContentLabelVisibility | null>;

export interface BskyContentLabelPrefsResponse {
  contentLabels: BskyContentLabelPrefs;
}

export interface BskyPrefsScopeError {
  error: 'InsufficientScope';
  message?: string;
  needsScope: 'bsky-preferences';
}

/**
 * Read the viewer's Bluesky content-label preferences via sifa-api's
 * proxy. Returns `null` when the viewer's OAuth grant doesn't include the
 * read scope — sifa-web treats this as "needs scope upgrade" and triggers
 * a granular re-auth.
 *
 * Any other failure (network, upstream PDS error) also resolves to `null`
 * so callers always have a safe default (hide everything).
 */
export async function fetchBskyContentLabelPrefs(
  config: SifaApiConfig,
  options: ApiFetchOptions & { onNeedsScope?: () => void } = {},
): Promise<BskyContentLabelPrefs | null> {
  const { onNeedsScope, ...fetchOptions } = options;
  try {
    const res = await apiFetch<BskyContentLabelPrefsResponse>(
      config,
      '/api/bsky/preferences/content-labels',
      { credentials: 'include', ...fetchOptions },
    );
    return res.contentLabels;
  } catch (err) {
    if (
      err &&
      typeof err === 'object' &&
      'status' in err &&
      (err as { status: number }).status === 403
    ) {
      onNeedsScope?.();
    }
    return null;
  }
}

export interface UpdateBskyContentLabelPrefsBody {
  contentLabels: Array<{
    label: AdultContentLabel;
    visibility: BskyContentLabelVisibility;
  }>;
}

/**
 * Update one or more of the viewer's adult content-label preferences. The
 * sifa-api endpoint merges these into the viewer's existing prefs and
 * writes the whole array back to their PDS — entries we don't touch are
 * preserved.
 *
 * On insufficient-scope returns `{ success: false, error: ..., needsScope }`
 * so the caller can drive a granular re-auth.
 */
export async function updateBskyContentLabelPrefs(
  config: SifaApiConfig,
  body: UpdateBskyContentLabelPrefsBody,
): Promise<
  WriteResult & { contentLabels?: BskyContentLabelPrefs; needsScope?: 'bsky-preferences' }
> {
  const result = await apiWrite<{
    contentLabels?: BskyContentLabelPrefs;
    needsScope?: 'bsky-preferences';
  }>(config, '/api/bsky/preferences/content-labels', 'PUT', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return result;
}

/**
 * Compute the effective visibility for a Bluesky adult label.
 *
 * - Anonymous viewer (no prefs): always `hide` — matches Bluesky's logged-out
 *   behaviour; sifa-web won't even render a Show button.
 * - Authenticated viewer with no explicit pref: `hide` by default, so Sifa
 *   stays safe-by-default and matches the gate that ships in sifa-web#1240
 *   today.
 * - Authenticated viewer with an explicit pref: use it directly.
 *
 * Returns `'ignore'` to mean "render media inline", `'warn'` and `'hide'`
 * both mean "placeholder card + reveal button" — Sifa doesn't distinguish
 * the two today, but keeping them separate matches the lexicon and lets the
 * UI evolve (e.g. blur for warn, full hide for hide) without an SDK change.
 */
export function effectiveContentVisibility(
  label: AdultContentLabel,
  prefs: BskyContentLabelPrefs | null,
  isAuthenticated: boolean,
): BskyContentLabelVisibility {
  if (!isAuthenticated) return 'hide';
  const value = prefs?.[label] ?? null;
  return value ?? 'hide';
}

/**
 * Whether a labeled item should render its media inline. Convenience over
 * `effectiveContentVisibility` for the common "any adult label hides
 * everything" case in BlueskyPostCard.
 */
export function shouldGateAdultMedia(
  labels: ReadonlyArray<{ val: string; neg?: boolean }> | undefined,
  prefs: BskyContentLabelPrefs | null,
  isAuthenticated: boolean,
): boolean {
  if (!labels || labels.length === 0) return false;
  for (const label of labels) {
    if (label.neg) continue;
    if (!(ADULT_CONTENT_LABELS as readonly string[]).includes(label.val)) continue;
    const visibility = effectiveContentVisibility(
      label.val as AdultContentLabel,
      prefs,
      isAuthenticated,
    );
    if (visibility !== 'ignore') return true;
  }
  return false;
}
