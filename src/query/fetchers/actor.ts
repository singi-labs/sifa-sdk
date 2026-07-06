import { apiFetchOrNull, type ApiFetchOptions, type SifaApiConfig } from '../client.js';
import type { CoSpeaker } from '../../types/index.js';

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
