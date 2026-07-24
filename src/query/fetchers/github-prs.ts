import { z } from 'zod';

import { apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

/**
 * A single merged pull request ingested from GitHub, as served by sifa-api's
 * `GET /api/me/github/pull-requests`. Mirrors the `github_contributions` row.
 */
export const GithubPullRequestSchema = z.object({
  prNumber: z.number(),
  repoOwner: z.string(),
  repoName: z.string(),
  title: z.string(),
  url: z.string(),
  language: z.string().nullable(),
  additions: z.number(),
  deletions: z.number(),
  /** ISO 8601 merge timestamp. */
  mergedAt: z.string(),
});
export type GithubPullRequest = z.infer<typeof GithubPullRequestSchema>;

export const MyGithubPullRequestsResponseSchema = z.object({
  items: z.array(GithubPullRequestSchema),
  hasMore: z.boolean(),
});
export type MyGithubPullRequestsResponse = z.infer<typeof MyGithubPullRequestsResponseSchema>;

export interface FetchMyGithubPullRequestsOptions extends ApiFetchOptions {
  limit?: number;
  offset?: number;
  /** Forwarded as the `cookie` header for server-side (SSR) calls. */
  cookieHeader?: string;
}

/**
 * Fetch the authenticated viewer's own ingested merged PRs (newest first).
 * Auth-scoped: relies on the session cookie (`credentials: 'include'`), so it
 * returns the caller's PRs, not a public handle's. Backs the GitHub importer.
 */
export async function fetchMyGithubPullRequests(
  config: SifaApiConfig,
  options: FetchMyGithubPullRequestsOptions = {},
): Promise<MyGithubPullRequestsResponse> {
  const { limit, offset, cookieHeader, ...fetchOptions } = options;

  const params = new URLSearchParams();
  if (limit !== undefined) params.set('limit', String(limit));
  if (offset !== undefined) params.set('offset', String(offset));
  const qs = params.toString();

  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (cookieHeader) headers.cookie = cookieHeader;

  const data = await apiFetch<unknown>(
    config,
    `/api/me/github/pull-requests${qs ? `?${qs}` : ''}`,
    {
      credentials: 'include',
      cache: 'no-store',
      ...fetchOptions,
      headers,
    },
  );

  return MyGithubPullRequestsResponseSchema.parse(data);
}
