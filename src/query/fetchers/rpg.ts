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
  /**
   * True when the viewer's rpg.actor character wears this (claimed) item.
   * Defaults to false for an older API that does not send it.
   */
  worn: z.boolean().default(false),
  iconUrl: z.string().url().nullable(),
});
export type RpgItemStatus = z.infer<typeof RpgItemStatusSchema>;

export const RpgStatusResponseSchema = z.object({
  hasCharacter: z.boolean(),
  /** True when the user granted the `repo:equipment.rpg.item` OAuth scope. */
  canWriteItems: z.boolean(),
  /** True when collecting (Sifa writing the gift) is switched on for this user. */
  canCollect: z.boolean().default(false),
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

/**
 * How many rpg.actor items the signed-in user can claim right now, for the
 * Inbox and the bell (`GET /api/rpg/claimable`). The AppView returns 0 unless
 * the user has a character, collecting is open to them, and at least one item
 * is earned or given but not yet claimed.
 */
export const RpgClaimableResponseSchema = z.object({
  count: z.number().int().nonnegative(),
});
export type RpgClaimableResponse = z.infer<typeof RpgClaimableResponseSchema>;

export interface FetchRpgClaimableOptions extends ApiFetchOptions {
  /** Forwarded as the `cookie` header for server-side (SSR) calls. */
  cookieHeader?: string;
}

/**
 * Fetch the viewer's claimable rpg.actor item count. Auth-scoped: relies on the
 * session cookie. Degrades to `{ count: 0 }` on any failure, so a broken call
 * means "nothing to claim" rather than a phantom Inbox item.
 */
export async function fetchRpgClaimable(
  config: SifaApiConfig,
  options: FetchRpgClaimableOptions = {},
): Promise<RpgClaimableResponse> {
  const { cookieHeader, ...fetchOptions } = options;

  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (cookieHeader) headers.cookie = cookieHeader;

  try {
    const data = await apiFetch<unknown>(config, '/api/rpg/claimable', {
      credentials: 'include',
      cache: 'no-store',
      timeoutMs: 5000,
      ...fetchOptions,
      headers,
    });
    return RpgClaimableResponseSchema.parse(data);
  } catch {
    return { count: 0 };
  }
}
