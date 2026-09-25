import { z } from 'zod';

import { apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

/** One rpg.actor item and the viewer's progress on it, as served by `GET /api/rpg/status`. */
export const RpgItemStatusSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  earned: z.boolean(),
  state: z.enum(['locked', 'earned', 'given', 'claimed']),
  iconUrl: z.string().url().nullable(),
});
export type RpgItemStatus = z.infer<typeof RpgItemStatusSchema>;

export const RpgStatusResponseSchema = z.object({
  hasCharacter: z.boolean(),
  /** True when the user granted the `repo:equipment.rpg.item` OAuth scope. */
  canWriteItems: z.boolean(),
  items: z.array(RpgItemStatusSchema),
});
export type RpgStatusResponse = z.infer<typeof RpgStatusResponseSchema>;

export interface FetchRpgStatusOptions extends ApiFetchOptions {
  /** Forwarded as the `cookie` header for server-side (SSR) calls. */
  cookieHeader?: string;
}

/**
 * Fetch the authenticated viewer's rpg.actor item status. Auth-scoped: relies
 * on the session cookie (`credentials: 'include'`).
 */
export async function fetchRpgStatus(
  config: SifaApiConfig,
  options: FetchRpgStatusOptions = {},
): Promise<RpgStatusResponse> {
  const { cookieHeader, ...fetchOptions } = options;

  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (cookieHeader) headers.cookie = cookieHeader;

  const data = await apiFetch<unknown>(config, '/api/rpg/status', {
    credentials: 'include',
    cache: 'no-store',
    ...fetchOptions,
    headers,
  });

  return RpgStatusResponseSchema.parse(data);
}
