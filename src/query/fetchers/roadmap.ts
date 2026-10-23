import { z } from 'zod';

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
  { ok: true; data: RoadmapVoteResult } | { ok: false; error: RoadmapVoteError };

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
export function castRoadmapVote(
  config: SifaApiConfig,
  key: string,
  options: ApiFetchOptions = {},
): Promise<CastRoadmapVoteResult> {
  return castUpvote(config, `/api/roadmap/votes/${encodeURIComponent(key)}`, options);
}

async function castUpvote(
  config: SifaApiConfig,
  path: string,
  options: ApiFetchOptions,
): Promise<CastRoadmapVoteResult> {
  const fetchFn = config.fetch ?? globalThis.fetch;
  const url = `${config.baseUrl}${path}`;

  try {
    const res = await fetchFn(url, {
      method: 'POST',
      // No body: the item is in the URL. Do NOT declare a JSON content-type
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

/** Roadmap group of a board item (sifa-api `GET /api/roadmap`). */
export type RoadmapBoardStatus = 'done' | 'in-progress' | 'planned' | 'later' | 'under-review';

export type RoadmapBoardSize = 'small' | 'medium' | 'epic';

/** One item on the roadmap, read from Sifa's userinput.app board. */
export interface RoadmapBoardItem {
  /** The `app.userinput.discussion` record URI. */
  uri: string;
  /** Author of the discussion (sifa.id or anyone who posted an idea). */
  did: string;
  rkey: string;
  title: string;
  /** Free text from the record. Render as plain text. */
  body: string | null;
  /** Tags without the size tag. */
  tags: string[];
  size: RoadmapBoardSize | null;
  status: RoadmapBoardStatus;
  votable: boolean;
  votes: { count: number; voters: RoadmapVoter[] };
  createdAt: string;
  /** Whether the signed-in viewer voted. False without a session. */
  viewerVoted: boolean;
}

/** Identifies a board item for voting. */
export interface RoadmapItemRef {
  did: string;
  rkey: string;
}

const roadmapBoardItemSchema: z.ZodType<RoadmapBoardItem> = z.object({
  uri: z.string(),
  did: z.string(),
  rkey: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  tags: z.array(z.string()),
  size: z.enum(['small', 'medium', 'epic']).nullable(),
  status: z.enum(['done', 'in-progress', 'planned', 'later', 'under-review']),
  votable: z.boolean(),
  votes: z.object({
    count: z.number(),
    voters: z.array(z.object({ did: z.string(), avatarUrl: z.string().optional() })),
  }),
  createdAt: z.string(),
  viewerVoted: z.boolean(),
});

export interface FetchRoadmapOptions extends ApiFetchOptions {
  /**
   * Pass the caller's `Cookie` header on Next.js RSC server-side calls so
   * `viewerVoted` reflects the viewer.
   */
  cookieHeader?: string;
}

/**
 * The roadmap as built from Sifa's userinput.app board, grouped and ordered
 * by the API. Returns `null` on any error, so callers can tell an outage from
 * an empty roadmap.
 */
export async function fetchRoadmap(
  config: SifaApiConfig,
  options: FetchRoadmapOptions = {},
): Promise<RoadmapBoardItem[] | null> {
  const { cookieHeader, ...rest } = options;
  const headers: Record<string, string> = { ...(rest.headers ?? {}) };
  if (cookieHeader) headers.cookie = cookieHeader;

  try {
    const data = await apiFetch<{ items?: unknown }>(config, '/api/roadmap', {
      cache: 'no-store',
      credentials: 'include',
      ...rest,
      headers,
    });
    if (!Array.isArray(data.items)) return null;
    // Drop items with an unexpected shape rather than failing the whole roadmap.
    return data.items.flatMap((raw) => {
      const parsed = roadmapBoardItemSchema.safeParse(raw);
      return parsed.success ? [parsed.data] : [];
    });
  } catch {
    return null;
  }
}

function itemVotePath(item: RoadmapItemRef): string {
  return `/api/roadmap/items/${encodeURIComponent(item.did)}/${encodeURIComponent(item.rkey)}/vote`;
}

/**
 * Vote on a roadmap board item. Same result shape and scope handling as
 * {@link castRoadmapVote}. Never throws.
 */
export function castRoadmapItemVote(
  config: SifaApiConfig,
  item: RoadmapItemRef,
  options: ApiFetchOptions = {},
): Promise<CastRoadmapVoteResult> {
  return castUpvote(config, itemVotePath(item), options);
}

/** Retract a vote on a roadmap board item. */
export function retractRoadmapItemVote(
  config: SifaApiConfig,
  item: RoadmapItemRef,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, itemVotePath(item), 'DELETE', options);
}
