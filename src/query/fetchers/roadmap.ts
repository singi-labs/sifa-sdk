import {
  apiFetch,
  apiWrite,
  type ApiFetchOptions,
  type SifaApiConfig,
  type WriteResult,
} from '../client.js';

/** Voter on a roadmap item. */
export interface RoadmapVoter {
  did: string;
  avatarUrl?: string;
}

/** Map of item key -> vote tally and voter list. */
export type RoadmapVotesResponse = Record<string, { count: number; voters: RoadmapVoter[] }>;

/**
 * Public roadmap vote tallies, keyed by item. Returns `{}` on any error.
 */
export async function fetchRoadmapVotes(
  config: SifaApiConfig,
  options: ApiFetchOptions = {},
): Promise<RoadmapVotesResponse> {
  try {
    return await apiFetch<RoadmapVotesResponse>(config, '/api/roadmap/votes', {
      cache: 'no-store',
      ...options,
    });
  } catch {
    return {};
  }
}

export interface FetchMyRoadmapVotesOptions extends ApiFetchOptions {
  /**
   * Pass the caller's `Cookie` header on Next.js RSC server-side calls.
   * Required for authenticated server fetches because `credentials: 'include'`
   * does not propagate browser cookies in RSC.
   */
  cookieHeader?: string;
}

/**
 * Roadmap items the authenticated user has voted on. Returns `[]` on any
 * error or when the response payload is shaped unexpectedly.
 */
export async function fetchMyRoadmapVotes(
  config: SifaApiConfig,
  options: FetchMyRoadmapVotesOptions = {},
): Promise<string[]> {
  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (options.cookieHeader) headers.cookie = options.cookieHeader;

  try {
    const data = await apiFetch<{ voted?: string[] }>(config, '/api/roadmap/votes/me', {
      credentials: 'include',
      ...options,
      headers,
    });
    return data.voted ?? [];
  } catch {
    return [];
  }
}

/** Cast a vote on a roadmap item by its key. */
export function castRoadmapVote(
  config: SifaApiConfig,
  key: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, `/api/roadmap/votes/${encodeURIComponent(key)}`, 'POST', options);
}

/** Retract a previously-cast roadmap vote. */
export function retractRoadmapVote(
  config: SifaApiConfig,
  key: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, `/api/roadmap/votes/${encodeURIComponent(key)}`, 'DELETE', options);
}
