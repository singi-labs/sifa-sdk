import { z } from 'zod';

import {
  apiFetch,
  apiWrite,
  apiWriteCreate,
  type ApiFetchOptions,
  type SifaApiConfig,
  type WriteResult,
} from '../client.js';

/**
 * Email verification of employment (sifa-workspace#162): link one of your
 * verified addresses to a position. The badge appears only when the domain
 * is recognized for the employing organization; otherwise the link is
 * neutral and the reason says why.
 */

export type EmailBadgeRefusal =
  'unrecognized_domain' | 'role_account' | 'affiliation_subdomain' | 'unlinked_position' | 'lapsed';

export const EmailVerificationLinkSchema = z
  .object({
    positionRkey: z.string(),
    emailId: z.number(),
    email: z.string(),
    emailDomain: z.string(),
    badge: z.boolean(),
    badgeRefused: z.string().nullable(),
    lastVerifiedAt: z.string(),
    nextReverifyAt: z.string().nullable(),
    reverifyDeadlineAt: z.string().nullable(),
  })
  .passthrough();

export type EmailVerificationLink = z.infer<typeof EmailVerificationLinkSchema>;

const LinksSchema = z.object({ links: z.array(EmailVerificationLinkSchema).default([]) });

export interface FetchEmailVerificationLinksOptions extends ApiFetchOptions {
  cookieHeader?: string;
}

/** The signed-in account's position-to-address links. Empty on failure. */
export async function fetchEmailVerificationLinks(
  config: SifaApiConfig,
  options: FetchEmailVerificationLinksOptions = {},
): Promise<{ links: EmailVerificationLink[] }> {
  const { cookieHeader, ...rest } = options;
  const headers: Record<string, string> = { ...(rest.headers ?? {}) };
  if (cookieHeader) headers.cookie = cookieHeader;
  try {
    const data = await apiFetch<unknown>(config, '/api/verification/email/links', {
      cache: 'no-store',
      credentials: 'include',
      timeoutMs: 5000,
      ...rest,
      headers,
    });
    const parsed = LinksSchema.safeParse(data);
    return parsed.success ? parsed.data : { links: [] };
  } catch {
    return { links: [] };
  }
}

export type LinkEmailResult =
  { ok: true; badge: true } | { ok: true; badge: false; badgeRefused: EmailBadgeRefusal };

export function linkEmailToPosition(
  config: SifaApiConfig,
  input: { positionRkey: string; emailId: number },
  options: ApiFetchOptions = {},
): Promise<WriteResult<LinkEmailResult>> {
  return apiWriteCreate<LinkEmailResult>(config, '/api/verification/email/link', input, options);
}

export function unlinkEmailFromPosition(
  config: SifaApiConfig,
  positionRkey: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(
    config,
    `/api/verification/email/link/${encodeURIComponent(positionRkey)}`,
    'DELETE',
    options,
  );
}

/** Send a re-verification link now; also how a lapsed badge comes back. */
export function requestEmailReverification(
  config: SifaApiConfig,
  positionRkey: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult<{ sendStatus: string }>> {
  return apiWrite<{ sendStatus: string }>(
    config,
    `/api/verification/email/reverify/${encodeURIComponent(positionRkey)}`,
    'POST',
    options,
  );
}
