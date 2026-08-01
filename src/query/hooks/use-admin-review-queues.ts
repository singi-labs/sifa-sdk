'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { useSifaConfig } from '../config.js';
import { getAdminReviewQueues, type AdminReviewQueues } from '../fetchers/admin-review-queues.js';
import { sifaQueryKeys } from '../keys.js';

/** Default staleness for the queue counts, matching the API cache TTL. */
const REVIEW_QUEUES_STALE_TIME_MS = 60_000;

/**
 * Read hook for the open counts of the three admin review queues. Shared by
 * the admin nav pill and the review-queues page so both render one number
 * from one request.
 *
 * Admin-gated on the server; non-admins get an error rather than zeroes.
 */
export function useAdminReviewQueues(
  options?: Omit<
    UseQueryOptions<
      AdminReviewQueues,
      Error,
      AdminReviewQueues,
      ReturnType<typeof sifaQueryKeys.admin.reviewQueues>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.admin.reviewQueues(),
    queryFn: () => getAdminReviewQueues(config),
    staleTime: REVIEW_QUEUES_STALE_TIME_MS,
    ...options,
  });
}
