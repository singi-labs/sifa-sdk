import type { PresentationLinkView } from '../../types/index.js';
import { apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

/**
 * Which claim a listed speaker makes about a topic. Phase 1 has no confirmed
 * data, so groups are named by the CLAIM, never a "proven" label:
 *   - `spoke_about_it` — has a topic-matching delivery (or, with a topic set,
 *     a matching presentation plus at least one delivery)
 *   - `skilled` — holds the matching canonical skill but has no matching talk
 *     (only appears when a topic is supplied)
 *   - `open_to_speaking` — opted in but has never delivered (only appears when
 *     no topic is supplied)
 */
export type SpeakerGroup = 'spoke_about_it' | 'skilled' | 'open_to_speaking';

/** One person in the speaker directory. Everyone listed has opted in. */
export interface SpeakerCard {
  did: string;
  handle: string;
  displayName: string | null;
  avatar: string | null;
  headline: string | null;
  currentRole: string | null;
  currentCompany: string | null;
  deliveryCount: number;
  group: SpeakerGroup;
  matchedTopics: string[];
  /**
   * Self-reported event names from the speaker's own presentationDelivery
   * records — unconfirmed in Phase 1. `eventsSelfReported` is always true;
   * the web layer labels these as such.
   */
  recentEvents: string[];
  eventsSelfReported: boolean;
}

export interface SpeakersResponse {
  speakers: SpeakerCard[];
}

/** The reusable talk, or a standalone delivery when it has no parent talk. */
export interface TalkEvent {
  eventName: string | null;
  date: string | null;
}

/** Compact speaker card embedded in a talk row. */
export interface TalkSpeaker {
  did: string;
  handle: string;
  displayName: string | null;
  avatar: string | null;
  headline: string | null;
  currentRole: string | null;
  currentCompany: string | null;
}

export interface TalkRow {
  /**
   * `presentation` = a reusable `id.sifa.profile.presentation` record.
   * `delivery` = a standalone presentationDelivery with no parent presentation.
   */
  kind: 'presentation' | 'delivery';
  rkey: string;
  title: string | null;
  snippet: string | null;
  links: PresentationLinkView[];
  writeupUri: string | null;
  speaker: TalkSpeaker;
  events: TalkEvent[];
  eventsSelfReported: boolean;
  deliveryCount: number;
  matchedTopics: string[];
}

export interface TalksResponse {
  talks: TalkRow[];
}

export interface SpeakerDirectoryFilters {
  /** Free-text topic (canonical skill name/slug/alias, talk title, or event). */
  topic?: string;
  /** Max rows to return; the API caps this at 50. */
  limit?: number;
}

const EMPTY_SPEAKERS: SpeakersResponse = { speakers: [] };
const EMPTY_TALKS: TalksResponse = { talks: [] };

function buildParams(filters: SpeakerDirectoryFilters): URLSearchParams {
  const params = new URLSearchParams();
  const topic = filters.topic?.trim();
  if (topic) params.set('topic', topic);
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));
  return params;
}

/**
 * Speaker directory (Phase 1, read-only POC). Everyone returned has opted in to
 * speaking; past deliveries are a ranking signal, not an inclusion path. An
 * optional `topic` filters to people who hold the matching canonical skill,
 * have a matching presentation, or have a matching delivery. Results come
 * grouped and ordered by the API.
 *
 * Returns an empty list on any error so callers can render a graceful state.
 */
export async function fetchSpeakers(
  config: SifaApiConfig,
  filters: SpeakerDirectoryFilters = {},
  options: ApiFetchOptions = {},
): Promise<SpeakersResponse> {
  const params = buildParams(filters);
  const query = params.toString();
  const path = query ? `/api/speakers?${query}` : '/api/speakers';
  try {
    return await apiFetch<SpeakersResponse>(config, path, {
      cache: 'no-store',
      ...options,
    });
  } catch {
    return EMPTY_SPEAKERS;
  }
}

/**
 * Talk directory (Phase 1, read-only POC). Lists talks by opted-in speakers,
 * delivered-first, then latest delivery date. Same optional `topic` filter as
 * {@link fetchSpeakers}. Returns an empty list on any error.
 */
export async function fetchTalks(
  config: SifaApiConfig,
  filters: SpeakerDirectoryFilters = {},
  options: ApiFetchOptions = {},
): Promise<TalksResponse> {
  const params = buildParams(filters);
  const query = params.toString();
  const path = query ? `/api/talks?${query}` : '/api/talks';
  try {
    return await apiFetch<TalksResponse>(config, path, {
      cache: 'no-store',
      ...options,
    });
  } catch {
    return EMPTY_TALKS;
  }
}
