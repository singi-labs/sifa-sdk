'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import {
  fetchMyGithubPullRequests,
  type MyGithubPullRequestsResponse,
} from '../fetchers/github-prs.js';
import { sifaQueryKeys } from '../keys.js';

export interface UseMyGithubPullRequestsParams {
  limit?: number;
  offset?: number;
}

/**
 * The authenticated viewer's own ingested merged PRs (newest first). Auth-scoped
 * via the session cookie. Backs the sifa-web GitHub importer (issue #302).
 */
export function useMyGithubPullRequests(
  params: UseMyGithubPullRequestsParams = {},
  options?: Omit<
    UseQueryOptions<
      MyGithubPullRequestsResponse,
      Error,
      MyGithubPullRequestsResponse,
      ReturnType<typeof sifaQueryKeys.github.myPullRequests>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.github.myPullRequests(params),
    queryFn: () => fetchMyGithubPullRequests(config, params),
    ...options,
  });
}
