import {
  GERM_SHOW_BUTTON_TO_VALUES,
  type GermShowButtonTo,
} from '../../schemas/germ-declaration.js';
import { apiFetch, encodeIdentifier, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

/**
 * Germ DM state of a profile, as seen by the current viewer.
 *
 * - `eligible`: render the "Message on Germ" button. Its `href` is
 *   {@link germRedirectPath}, which counts the click and forwards to Germ.
 * - `owner`: the viewer looks at their own profile. `showButtonTo` is the
 *   owner's Germ setting, for a status note; `null` when the record has no
 *   `messageMe` or the value is not one Sifa knows.
 *
 * `null` means no button and no note.
 */
export type GermMessageLink =
  { status: 'eligible' } | { status: 'owner'; showButtonTo: GermShowButtonTo | null };

export interface FetchGermMessageLinkOptions extends ApiFetchOptions {
  /** Raw `Cookie` header for RSC calls, so the API sees the viewer's session. */
  cookieHeader?: string;
}

// Below the profile page's patience: a slow lookup drops the button, not the page.
const GERM_LINK_TIMEOUT_MS = 1500;
// Logged-out results depend only on the owner, so they can be shared.
const LOGGED_OUT_REVALIDATE_S = 900;

function isShowButtonTo(value: unknown): value is GermShowButtonTo {
  return (GERM_SHOW_BUTTON_TO_VALUES as readonly unknown[]).includes(value);
}

function parseGermMessageLink(data: unknown): GermMessageLink | null {
  if (typeof data !== 'object' || data === null) return null;
  const { status, showButtonTo } = data as { status?: unknown; showButtonTo?: unknown };
  if (status === 'eligible') return { status: 'eligible' };
  if (status === 'owner') {
    if (showButtonTo === undefined || showButtonTo === null) {
      return { status: 'owner', showButtonTo: null };
    }
    if (isShowButtonTo(showButtonTo)) return { status: 'owner', showButtonTo };
  }
  return null;
}

/**
 * Germ DM state for a profile (see {@link GermMessageLink}). Pass the viewer's
 * `cookieHeader` from server components; without it the result is the
 * logged-out view and may be cached. Returns `null` on any error.
 */
export async function fetchGermMessageLink(
  config: SifaApiConfig,
  did: string,
  options: FetchGermMessageLinkOptions = {},
): Promise<GermMessageLink | null> {
  const { cookieHeader, ...rest } = options;
  const headers: Record<string, string> = { ...(rest.headers ?? {}) };
  if (cookieHeader) headers.cookie = cookieHeader;
  // Applied last: a viewer-specific answer must never land in a shared cache.
  const caching: ApiFetchOptions = cookieHeader
    ? { cache: 'no-store', next: undefined }
    : { next: { revalidate: LOGGED_OUT_REVALIDATE_S } };
  try {
    const data = await apiFetch<unknown>(
      config,
      `/api/profiles/${encodeIdentifier(did)}/germ-message-link`,
      { timeoutMs: GERM_LINK_TIMEOUT_MS, credentials: 'include', ...rest, ...caching, headers },
    );
    return parseGermMessageLink(data);
  } catch {
    return null;
  }
}

/**
 * Path of the click route the button links to. The route re-checks the
 * viewer, counts the click and redirects to Germ, so clicks are counted
 * without client-side JavaScript. Prefix it with the API origin.
 */
export function germRedirectPath(did: string): string {
  return `/api/profiles/${encodeIdentifier(did)}/germ-redirect`;
}
