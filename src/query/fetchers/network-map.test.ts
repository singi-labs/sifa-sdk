import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import {
  checkNetworkMapJobStatus,
  fetchNetworkMap,
  initiateNetworkMapGeneration,
  isNetworkMapResponse,
  type NetworkMapGenerationJob,
  type NetworkMapResponse,
} from './network-map.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

const sampleResponse: NetworkMapResponse = {
  generatedAt: '2026-05-20T00:00:00.000Z',
  expiresAt: '2026-05-27T00:00:00.000Z',
  graph: {
    nodes: [{ did: 'did:plc:a', handle: 'a.test', displayName: 'A', avatar: null, degree: 1 }],
    edges: [{ source: 'did:plc:a', target: 'did:plc:b', mutual: true, sources: ['sifa'] }],
  },
  stats: { totalNodes: 1, totalEdges: 1, mutualCount: 1, sources: { sifa: 1 } },
};

const sampleJob: NetworkMapGenerationJob = {
  jobId: 'job-1',
  did: 'did:plc:a',
  status: 'pending',
  progress: 25,
  createdAt: '2026-05-20T00:00:00.000Z',
};

describe('initiateNetworkMapGeneration', () => {
  it('POSTs to /api/network-map/generate with credentials', async () => {
    const fetchImpl = jsonFetch({ jobId: 'job-1', status: 'pending' });
    await initiateNetworkMapGeneration({ ...baseConfig, fetch: fetchImpl });
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/network-map/generate');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
  });

  it('returns a pending job payload', async () => {
    const fetchImpl = jsonFetch({ jobId: 'job-1', status: 'pending' });
    const result = await initiateNetworkMapGeneration({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual({ jobId: 'job-1', status: 'pending' });
    expect(isNetworkMapResponse(result)).toBe(false);
  });

  it('returns a cached map payload when the backend short-circuits', async () => {
    const fetchImpl = jsonFetch(sampleResponse);
    const result = await initiateNetworkMapGeneration({ ...baseConfig, fetch: fetchImpl });
    expect(isNetworkMapResponse(result)).toBe(true);
    if (isNetworkMapResponse(result)) {
      expect(result.graph.nodes).toHaveLength(1);
    }
  });
});

describe('checkNetworkMapJobStatus', () => {
  it('GETs /api/network-map/status/:jobId with the id encoded', async () => {
    const fetchImpl = jsonFetch(sampleJob);
    await checkNetworkMapJobStatus({ ...baseConfig, fetch: fetchImpl }, 'job/with spaces');
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/network-map/status/job%2Fwith%20spaces');
  });

  it('returns the parsed job', async () => {
    const fetchImpl = jsonFetch(sampleJob);
    const result = await checkNetworkMapJobStatus({ ...baseConfig, fetch: fetchImpl }, 'job-1');
    expect(result).toEqual(sampleJob);
  });
});

describe('fetchNetworkMap', () => {
  it('returns null on 404', async () => {
    const fetchImpl = jsonFetch({ error: 'not_found' }, 404);
    const result = await fetchNetworkMap({ ...baseConfig, fetch: fetchImpl });
    expect(result).toBeNull();
  });

  it('returns the cached map on 200', async () => {
    const fetchImpl = jsonFetch(sampleResponse);
    const result = await fetchNetworkMap({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual(sampleResponse);
  });

  it('hits /api/network-map with credentials and no-store cache', async () => {
    const fetchImpl = jsonFetch(sampleResponse);
    await fetchNetworkMap({ ...baseConfig, fetch: fetchImpl });
    const [url, init] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/network-map');
    expect(init.credentials).toBe('include');
    expect(init.cache).toBe('no-store');
  });
});

describe('isNetworkMapResponse', () => {
  it('returns true for a response with a graph key', () => {
    expect(isNetworkMapResponse(sampleResponse)).toBe(true);
  });

  it('returns false for a pending job payload', () => {
    expect(isNetworkMapResponse({ jobId: 'job-1', status: 'pending' })).toBe(false);
  });
});
