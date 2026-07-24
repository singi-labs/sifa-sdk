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

/** Result of a successful {@link castRoadmapVote} -- the created upvote record. */
export interface RoadmapVoteResult {
  uri: string;
  rkey: string;
}

/** Structured error returned by {@link castRoadmapVote} on failure. */
export interface RoadmapVoteError {
  type: 'scope_insufficient' | 'error';
  /**
   * When `type === 'scope_insufficient'`, the lexicon collection the user must
   * re-authorize for (e.g. `app.userinput.upvote`). sifa-web maps this to an
   * OAuth scope-upgrade flow (`/oauth/reauth?scope=repo:<collection>`).
   */
  requiredScope?: string;
}

/**
 * Discriminated-union result of {@link castRoadmapVote}. Exported so the
 * `useCastRoadmapVote` hook and SDK consumers can type mutation handlers
 * against a single source of truth.
 */
export type CastRoadmapVoteResult =
  | { ok: true; data: RoadmapVoteResult }
  | { ok: false; error: RoadmapVoteError };

/**
 * Cast a vote on a roadmap item by its key.
 *
 * Writes an `app.userinput.upvote` record into the viewer's PDS (server-side,
 * via their OAuth session). Returns a discriminated-union result rather than
 * the generic {@link WriteResult} because a first-time voter's PDS grant may
 * not yet include the `app.userinput.upvote` collection: the AppView responds
 * 403 `ScopeInsufficient`, which the caller handles by triggering an OAuth
 * scope upgrade rather than showing an error. Mirrors {@link createReaction}.
 *
 * Never throws.
 */
export async function castRoadmapVote(
  config: SifaApiConfig,
  key: string,
  options: ApiFetchOptions = {},
): Promise<CastRoadmapVoteResult> {
  const fetchFn = config.fetch ?? globalThis.fetch;
  const url = `${config.baseUrl}/api/roadmap/votes/${encodeURIComponent(key)}`;

  try {
    const res = await fetchFn(url, {
      method: 'POST',
      // No body: the item key is in the URL. Do NOT declare a JSON content-type
      // for an empty body — Fastify rejects that with a 400 before the handler
      // runs. Only forward caller-provided headers.
      ...(options.headers ? { headers: options.headers } : {}),
      credentials: options.credentials ?? 'include',
      signal: options.signal ?? AbortSignal.timeout(options.timeoutMs ?? 10_000),
    });

    if (!res.ok) {
      if (res.status === 403) {
        try {
          const body = (await res.json()) as { error?: string; requiredScope?: string };
          if (body.error === 'ScopeInsufficient') {
            return {
              ok: false,
              error: { type: 'scope_insufficient', requiredScope: body.requiredScope },
            };
          }
        } catch {
          // Fall through to generic error.
        }
      }
      return { ok: false, error: { type: 'error' } };
    }

    const data = (await res.json()) as RoadmapVoteResult;
    return { ok: true, data };
  } catch {
    return { ok: false, error: { type: 'error' } };
  }
}

/** Retract a previously-cast roadmap vote. */
export function retractRoadmapVote(
  config: SifaApiConfig,
  key: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, `/api/roadmap/votes/${encodeURIComponent(key)}`, 'DELETE', options);
}
