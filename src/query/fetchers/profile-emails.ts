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
 * Personal email addresses (sifa-workspace#158), managed in settings and
 * verified one by one through a link. Employment verification by email
 * (#162) builds on the verified ones. Owner-only AppView shapes.
 */

export const ProfileEmailSchema = z
  .object({
    id: z.number(),
    email: z.string(),
    emailDomain: z.string(),
    status: z.enum(['verified', 'pending', 'expired']),
    verifiedAt: z.string().nullable(),
    verificationSentAt: z.string().nullable(),
    createdAt: z.string(),
  })
  .passthrough();

export type ProfileEmail = z.infer<typeof ProfileEmailSchema>;

const ProfileEmailsSchema = z.object({
  emails: z.array(ProfileEmailSchema).default([]),
  /** False while Sifa does not send email; links are not sent then. */
  sending: z.boolean().default(false),
});

export type ProfileEmails = z.infer<typeof ProfileEmailsSchema>;

/** `sends_paused` means the address is stored but no link went out. */
export type ProfileEmailSendStatus =
  'verification_sent' | 'sends_paused' | 'send_failed' | 'already_verified';

export interface FetchProfileEmailsOptions extends ApiFetchOptions {
  /** Forward the caller's Cookie header on Next.js RSC server-side calls. */
  cookieHeader?: string;
}

/** The signed-in account's addresses. Empty on any failure. */
export async function fetchProfileEmails(
  config: SifaApiConfig,
  options: FetchProfileEmailsOptions = {},
): Promise<ProfileEmails> {
  const { cookieHeader, ...rest } = options;
  const headers: Record<string, string> = { ...(rest.headers ?? {}) };
  if (cookieHeader) headers.cookie = cookieHeader;
  try {
    const data = await apiFetch<unknown>(config, '/api/profile-emails', {
      cache: 'no-store',
      credentials: 'include',
      timeoutMs: 5000,
      ...rest,
      headers,
    });
    const parsed = ProfileEmailsSchema.safeParse(data);
    return parsed.success ? parsed.data : { emails: [], sending: false };
  } catch {
    return { emails: [], sending: false };
  }
}

export function addProfileEmail(
  config: SifaApiConfig,
  email: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult<ProfileEmail & { sendStatus: ProfileEmailSendStatus }>> {
  return apiWriteCreate<ProfileEmail & { sendStatus: ProfileEmailSendStatus }>(
    config,
    '/api/profile-emails',
    { email },
    options,
  );
}

export function resendProfileEmailVerification(
  config: SifaApiConfig,
  id: number,
  options: ApiFetchOptions = {},
): Promise<WriteResult<{ sendStatus: ProfileEmailSendStatus }>> {
  return apiWrite<{ sendStatus: ProfileEmailSendStatus }>(
    config,
    `/api/profile-emails/${id}/resend`,
    'POST',
    options,
  );
}

export function removeProfileEmail(
  config: SifaApiConfig,
  id: number,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, `/api/profile-emails/${id}`, 'DELETE', options);
}
