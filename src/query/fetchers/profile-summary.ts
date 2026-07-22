import {
  summarizeProfileView,
  type ProfileSummary,
  type SummarizeProfileViewOptions,
} from '../../logic/profile-summary.js';
import { fetchGetProfileView } from './get-profile-view.js';
import type { ApiFetchOptions, SifaApiConfig } from '../client.js';

/**
 * Fetch the aggregated public profile via `id.sifa.getProfileView` and reduce it
 * to a compact {@link ProfileSummary} (identity, headline, current role/employer,
 * top skills). Convenience over `fetchGetProfileView` + `summarizeProfileView`,
 * for third-party surfaces that only want the headline facts.
 *
 * Returns `null` when the AppView has no profile for the actor. Server-callable
 * (Next.js RSC) and client-callable (Expo, browser).
 */
export async function fetchProfileSummary(
  config: SifaApiConfig,
  actor: string,
  options: SummarizeProfileViewOptions & ApiFetchOptions = {},
): Promise<ProfileSummary | null> {
  const { maxSkills, ...fetchOptions } = options;
  const view = await fetchGetProfileView(config, actor, fetchOptions);
  return view ? summarizeProfileView(view, { maxSkills }) : null;
}
