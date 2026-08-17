import { apiFetch, apiFetchOrNull, type ApiFetchOptions, type SifaApiConfig } from '../client.js';
import type { ActorCard, CoSpeaker } from '../../types/index.js';

/**
 * Resolve any atproto handle (or DID) to a profile card, for the co-speaker
 * picker's "not on Sifa" path. Returns `null` when the identity can't be
 * resolved. The Sifa AppView resolves the handle to a DID and hydrates a card
 * (handle, displayName, avatar, and whether they have a claimed Sifa profile).
 */
export async function fetchResolveActor(
  config: SifaApiConfig,
  handleOrDid: string,
  options: ApiFetchOptions = {},
): Promise<CoSpeaker | null> {
  const q = handleOrDid.trim().replace(/^@/, '');
  if (!q) return null;
  return apiFetchOrNull<CoSpeaker>(config, `/api/actor/resolve?q=${encodeURIComponent(q)}`, {
    cache: 'no-store',
    ...options,
  });
}

/**
 * Typeahead over indexed Sifa profiles by partial name or handle, for the
 * co-speaker, login and search comboboxes. Matches display name and handle only
 * (prefix + trigram), ranks prefix matches first, and returns actor cards.
 * Unlike `/api/search/profiles`, a partial of a dotted custom handle resolves
 * and a partial name surfaces its prefix match rather than an unrelated
 * account. Returns an empty array on a blank query or a failed request; use
 * {@link fetchResolveActor} on Enter to reach a handle that is not on Sifa.
 */
export async function fetchTypeaheadActors(
  config: SifaApiConfig,
  query: string,
  limit = 8,
  options: ApiFetchOptions = {},
): Promise<ActorCard[]> {
  const q = query.trim().replace(/^@/, '');
  if (!q) return [];
  const params = new URLSearchParams({ q, limit: String(limit) });
  try {
    const res = await apiFetch<{ actors: ActorCard[] }>(
      config,
      `/api/actor/typeahead?${params.toString()}`,
      { cache: 'no-store', ...options },
    );
    return res.actors ?? [];
  } catch {
    return [];
  }
}
