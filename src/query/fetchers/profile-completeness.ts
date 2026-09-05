import { apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

/**
 * The binary profile-completeness signals the AppView tracks. Each maps to a
 * concrete "add this to your profile" step in the unified Inbox checklist.
 */
export const PROFILE_COMPLETENESS_SIGNALS = [
  'headline',
  'about',
  'position',
  'education',
  'skill',
  'certification',
] as const;

export type ProfileCompletenessSignal = (typeof PROFILE_COMPLETENESS_SIGNALS)[number];

/**
 * Completeness of the signed-in user's own profile: which of the tracked signals
 * are still missing. `missing.length === 0` means complete.
 */
export interface ProfileCompleteness {
  /** True when no tracked signal is missing. */
  complete: boolean;
  /** Signals present (of {@link PROFILE_COMPLETENESS_SIGNALS}). */
  score: number;
  /** Total tracked signals. */
  total: number;
  /** The signals still missing, for the checklist. */
  missing: ProfileCompletenessSignal[];
}

export interface FetchProfileCompletenessOptions extends ApiFetchOptions {
  /**
   * Pass the caller's `Cookie` header on Next.js RSC server-side calls.
   * `credentials: 'include'` does NOT propagate browser cookies in RSC,
   * so authenticated server fetches must forward the header explicitly.
   */
  cookieHeader?: string;
}

/**
 * Completeness of the signed-in user's own profile, an "open task" surfaced in
 * the unified Inbox as a checklist. Requires credentials -- the AppView reads
 * the owner from the session. Returns a complete-looking result on any failure
 * (no missing signals) so a broken call degrades to "nothing to do" rather than
 * nagging the user with a phantom checklist.
 */
export async function fetchProfileCompleteness(
  config: SifaApiConfig,
  options: FetchProfileCompletenessOptions = {},
): Promise<ProfileCompleteness> {
  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (options.cookieHeader) headers.cookie = options.cookieHeader;

  const empty: ProfileCompleteness = {
    complete: true,
    score: PROFILE_COMPLETENESS_SIGNALS.length,
    total: PROFILE_COMPLETENESS_SIGNALS.length,
    missing: [],
  };

  try {
    const data = await apiFetch<ProfileCompleteness>(config, '/api/profile/completeness', {
      cache: 'no-store',
      credentials: 'include',
      timeoutMs: 5000,
      ...options,
      headers,
    });
    if (!data) return empty;
    const missing = data.missing ?? [];
    return {
      complete: data.complete ?? missing.length === 0,
      score: data.score ?? PROFILE_COMPLETENESS_SIGNALS.length - missing.length,
      total: data.total ?? PROFILE_COMPLETENESS_SIGNALS.length,
      missing,
    };
  } catch {
    return empty;
  }
}
