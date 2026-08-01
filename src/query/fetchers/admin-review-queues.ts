import { apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

/**
 * Options for {@link getAdminReviewQueues}. Supports the same `cookieHeader`
 * passthrough as the other admin reads for RSC contexts.
 */
export interface GetAdminReviewQueuesOptions extends ApiFetchOptions {
  cookieHeader?: string;
}

/** Response shape of `GET /api/admin/stats/review-queues`. */
export interface AdminReviewQueues {
  ideas: number;
  nameCorrections: number;
  pendingCompanies: number;
  /** Sum of the three queues. */
  total: number;
  generatedAt: string;
}

/**
 * Open counts for the three admin review queues (ideas, pending companies,
 * name corrections) plus their total.
 *
 * Unlike {@link listFeatureAllowlist} this does NOT swallow errors: a zeroed
 * payload would render as "all queues clear" in the admin nav, which is worse
 * than rendering nothing. Callers decide how to degrade.
 */
export async function getAdminReviewQueues(
  config: SifaApiConfig,
  opts: GetAdminReviewQueuesOptions = {},
): Promise<AdminReviewQueues> {
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  if (opts.cookieHeader) headers.cookie = opts.cookieHeader;

  const res = await apiFetch<Partial<AdminReviewQueues>>(config, '/api/admin/stats/review-queues', {
    credentials: 'include',
    cache: 'no-store',
    ...opts,
    headers,
  });

  const ideas = res.ideas ?? 0;
  const nameCorrections = res.nameCorrections ?? 0;
  const pendingCompanies = res.pendingCompanies ?? 0;

  return {
    ideas,
    nameCorrections,
    pendingCompanies,
    // Derived rather than trusted so an API that predates the field still
    // yields a usable pill count.
    total: res.total ?? ideas + nameCorrections + pendingCompanies,
    generatedAt: res.generatedAt ?? '',
  };
}
