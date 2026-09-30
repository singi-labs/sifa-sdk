import { apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

/**
 * Every kind of fact the employment-verification log can hold. Mirrors
 * `VERIFICATION_EVENT_KINDS` in sifa-api; additive.
 */
export type VerificationEventKind =
  | 'mailbox_verified'
  | 'domain_recognized'
  | 'reverified'
  | 'reverification_failed'
  | 'org_confirmed'
  | 'org_status_changed'
  | 'org_revoked'
  | 'peer_vouched'
  | 'peer_withdrawn';

/**
 * One entry of a position's verification log, newest first, as the AppView
 * returns it. `emailAddress` is present only when the signed-in viewer owns
 * the profile; everyone else gets the domain at most.
 *
 * This is an AppView READ shape, not a PDS record, so it is a hand-written
 * interface like the confirmation DTOs in `./confirmations.ts`: the Zod
 * schemas in `../../schemas` validate lexicon record writes, not read DTOs.
 * The AppView owns the shape (`services/verification-log.ts` in sifa-api);
 * fields are additive and passed through verbatim.
 */
export interface VerificationLogEntry {
  id: number;
  kind: VerificationEventKind;
  occurredAt: string;
  entityId: number | null;
  emailDomain: string | null;
  emailAddress?: string | null;
  meta: Record<string, unknown>;
}

export interface VerificationLog {
  events: VerificationLogEntry[];
}

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
 * it, the AppView strips the addresses for everyone but the owner. Returns an
 * empty log on failure so a broken log never breaks the profile hosting it.
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
    const data = await apiFetch<{ events?: VerificationLogEntry[] }>(
      config,
      `/api/verification/${encodeURIComponent(did)}/${encodeURIComponent(positionRkey)}`,
      { cache: 'no-store', credentials: 'include', timeoutMs: 5000, ...rest, headers },
    );
    return { events: data?.events ?? [] };
  } catch {
    return { events: [] };
  }
}
