import { apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

export interface ReciprocitySkill {
  name: string;
  uri: string;
  /** Absent until the firehose indexes the skill; the AppView resolves it. */
  cid?: string;
}

export interface ReciprocityCandidate {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  skills: ReciprocitySkill[];
}

/**
 * Someone the signed-in user follows on Sifa whose skills they could endorse.
 *
 * The AppView picks: it filters people already dismissed and anyone blocked,
 * requires at least one skill, and rotates the choice every twelve hours so
 * the same person is not offered indefinitely.
 *
 * `null` means there is nobody left to suggest -- a real state, not an error.
 * Failures also yield `null` so a broken suggestion never breaks the homepage.
 */
export async function fetchReciprocityCandidate(
  config: SifaApiConfig,
  options: ApiFetchOptions = {},
): Promise<ReciprocityCandidate | null> {
  try {
    const data = await apiFetch<{ candidate: ReciprocityCandidate | null }>(
      config,
      '/api/endorsements/reciprocity-candidate',
      {
        cache: 'no-store',
        credentials: 'include',
        timeoutMs: 5000,
        ...options,
      },
    );
    return data?.candidate ?? null;
  } catch {
    return null;
  }
}
