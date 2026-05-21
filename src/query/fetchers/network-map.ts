import { apiFetch, apiFetchOrNull, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

/** A node in the personal network graph. */
export interface NetworkMapNode {
  did: string;
  handle: string;
  displayName: string;
  avatar: string | null;
  /** Number of edges this node participates in within the rendered graph. */
  degree: number;
  /** Phase 2: community detection cluster id. */
  cluster?: number;
  /** Phase 2: pre-computed layout coordinates. */
  x?: number;
  y?: number;
}

/** A directed edge in the personal network graph. */
export interface NetworkMapEdge {
  source: string;
  target: string;
  mutual: boolean;
  /** Networks this edge was observed in, e.g. `['sifa', 'bluesky']`. */
  sources: string[];
}

/** The graph payload itself, decoupled from response metadata. */
export interface NetworkMapGraphData {
  nodes: NetworkMapNode[];
  edges: NetworkMapEdge[];
  /** Phase 2: cluster metadata for legend rendering. */
  clusters?: Array<{ id: number; label: string; color: string }>;
}

/** Cached graph response. */
export interface NetworkMapResponse {
  generatedAt: string;
  expiresAt: string;
  graph: NetworkMapGraphData;
  stats: {
    totalNodes: number;
    totalEdges: number;
    mutualCount: number;
    sources: Record<string, number>;
  };
}

/** Async job tracking generation progress. */
export interface NetworkMapGenerationJob {
  jobId: string;
  did: string;
  status: 'pending' | 'complete' | 'failed';
  /** 0..100 */
  progress: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
  /**
   * Queue position when the job is still pending and not yet picked up
   * by the worker. 0 = next to run. Absent for in-flight or terminal
   * jobs (and for any backend that doesn't yet report position).
   */
  position?: number;
  /**
   * Estimated remaining seconds, derived server-side from the median
   * historical duration for the user's follow-count bucket multiplied
   * by `position + 1`. Absent when no historical data exists yet.
   */
  etaSeconds?: number;
}

/** Returned by `initiateNetworkMapGeneration` when a new job was started or one was already running. */
export interface NetworkMapPendingJob {
  jobId: string;
  status: 'pending' | 'cached';
}

/** Discriminate the union returned by `initiateNetworkMapGeneration`. */
export function isNetworkMapResponse(
  value: NetworkMapPendingJob | NetworkMapResponse,
): value is NetworkMapResponse {
  return 'graph' in value;
}

/**
 * Kick off a personal network-map computation. The backend returns the
 * cached map immediately when fresh, otherwise it returns a job id that
 * the caller polls via `checkNetworkMapJobStatus`.
 */
export async function initiateNetworkMapGeneration(
  config: SifaApiConfig,
  options: ApiFetchOptions = {},
): Promise<NetworkMapPendingJob | NetworkMapResponse> {
  return apiFetch<NetworkMapPendingJob | NetworkMapResponse>(config, '/api/network-map/generate', {
    method: 'POST',
    credentials: 'include',
    ...options,
  });
}

/**
 * Poll the status of an in-flight generation job. Throws on 404 (unknown
 * or expired job) — callers may want to treat that as terminal failure.
 */
export async function checkNetworkMapJobStatus(
  config: SifaApiConfig,
  jobId: string,
  options: ApiFetchOptions = {},
): Promise<NetworkMapGenerationJob> {
  return apiFetch<NetworkMapGenerationJob>(
    config,
    `/api/network-map/status/${encodeURIComponent(jobId)}`,
    {
      credentials: 'include',
      ...options,
    },
  );
}

/**
 * Fetch the most recent cached network map for the authenticated user.
 * Returns `null` when no map has ever been generated (404).
 */
export async function fetchNetworkMap(
  config: SifaApiConfig,
  options: ApiFetchOptions = {},
): Promise<NetworkMapResponse | null> {
  return apiFetchOrNull<NetworkMapResponse>(config, '/api/network-map', {
    credentials: 'include',
    cache: 'no-store',
    ...options,
  });
}
