import { z } from 'zod';

import { apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

/**
 * Every kind of fact the employment-verification log can hold. Mirrors
 * `VERIFICATION_EVENT_KINDS` in sifa-api. Kept open (`z.string()`) on the
 * wire so a kind the AppView adds later does not break older clients; the
 * union is the set a client can render specific copy for today.
 */
export const VERIFICATION_EVENT_KINDS = [
  'mailbox_verified',
  'domain_recognized',
  'reverified',
  'reverification_failed',
  'org_confirmed',
  'org_status_changed',
  'org_revoked',
  'peer_vouched',
  'peer_withdrawn',
] as const;

export type VerificationEventKind = (typeof VERIFICATION_EVENT_KINDS)[number];

/**
 * One entry of a position's verification log, newest first, as the AppView
 * returns it. `emailAddress` is present only when the signed-in viewer owns
 * the profile; everyone else gets the domain at most. An AppView READ shape,
 * not a PDS record: the log lives in Sifa's database. Unknown extra fields
 * pass through so the shape stays additive.
 */
export const VerificationLogEntrySchema = z
  .object({
    id: z.number(),
    kind: z.string(),
    occurredAt: z.string(),
    entityId: z.number().nullable().default(null),
    emailDomain: z.string().nullable().default(null),
    emailAddress: z.string().nullable().optional(),
    meta: z.record(z.string(), z.unknown()).default({}),
  })
  .passthrough();

export const VerificationLogSchema = z.object({
  events: z.array(VerificationLogEntrySchema).default([]),
});

export type VerificationLogEntry = z.infer<typeof VerificationLogEntrySchema>;
export type VerificationLog = z.infer<typeof VerificationLogSchema>;

/** Options for {@link fetchVerificationLog}, adding the RSC cookie-forwarding escape hatch. */
export interface FetchVerificationLogOptions extends ApiFetchOptions {
  /**
   * Pass the caller's `Cookie` header on Next.js RSC server-side calls, so
   * the owner sees full addresses. `credentials: 'include'` does not propagate
   * browser cookies in RSC.
   */
  cookieHeader?: string;
}

/**
 * The verification log of one position, newest first. Public: anyone can read
 * it, the AppView strips the addresses for everyone but the owner.
 *
 * Resolves to an empty log on any failure (network, non-2xx, malformed body)
 * by design, the same contract as the confirmation fetchers: the log is a
 * detail panel on a profile, and a broken panel must never take the profile
 * down with it. Callers that need to distinguish "empty" from "failed" use
 * `apiFetch` directly.
 */
export async function fetchVerificationLog(
  config: SifaApiConfig,
  did: string,
  positionRkey: string,
  options: FetchVerificationLogOptions = {},
): Promise<VerificationLog> {
  const { cookieHeader, ...rest } = options;
  const headers: Record<string, string> = { ...(rest.headers ?? {}) };
  if (cookieHeader) headers.cookie = cookieHeader;
  try {
    const data = await apiFetch<unknown>(
      config,
      `/api/verification/${encodeURIComponent(did)}/${encodeURIComponent(positionRkey)}`,
      { cache: 'no-store', credentials: 'include', timeoutMs: 5000, ...rest, headers },
    );
    const parsed = VerificationLogSchema.safeParse(data);
    return parsed.success ? parsed.data : { events: [] };
  } catch {
    return { events: [] };
  }
}
