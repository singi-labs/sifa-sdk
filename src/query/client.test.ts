import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ApiError,
  apiFetch,
  apiFetchOrNull,
  encodeIdentifier,
  type SifaApiConfig,
} from './client.js';

const config: SifaApiConfig = { baseUrl: 'https://api.example' };

interface MockResponseInit {
  status: number;
  body?: string;
  headers?: Record<string, string>;
}

/** Build a fetch double that always returns the same response. */
function fixedFetch(init: MockResponseInit): typeof fetch {
  return vi.fn(() =>
    Promise.resolve(
      new Response(init.body ?? null, { status: init.status, headers: init.headers }),
    ),
  );
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  const calls = (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls;
  return calls[index]!;
}

describe('apiFetch', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('GETs and parses JSON on 200', async () => {
    const fetchImpl = fixedFetch({
      status: 200,
      body: JSON.stringify({ ok: true, name: 'Alice' }),
    });
    const result = await apiFetch<{ ok: boolean; name: string }>(
      { ...config, fetch: fetchImpl },
      '/api/profile/alice',
    );
    expect(result).toEqual({ ok: true, name: 'Alice' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url] = getCall(fetchImpl);
    expect(url).toBe('https://api.example/api/profile/alice');
  });

  it('serializes body to JSON and sets Content-Type on POST', async () => {
    const fetchImpl = fixedFetch({ status: 200, body: JSON.stringify({ rkey: 'abc' }) });
    await apiFetch({ ...config, fetch: fetchImpl }, '/api/positions', {
      method: 'POST',
      body: { title: 'Founder' },
    });
    const [, init] = getCall(fetchImpl);
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ title: 'Founder' }));
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('throws ApiError on non-2xx with parsed body', async () => {
    const fetchImpl = fixedFetch({
      status: 400,
      body: JSON.stringify({ error: 'BadRequest', message: 'invalid' }),
      headers: { 'Content-Type': 'application/json' },
    });
    try {
      await apiFetch({ ...config, fetch: fetchImpl }, '/api/x');
      throw new Error('should not reach');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      const err = e as ApiError;
      expect(err.status).toBe(400);
      expect(err.body).toEqual({ error: 'BadRequest', message: 'invalid' });
    }
  });

  it('apiFetchOrNull resolves to null on 404', async () => {
    const fetchImpl = fixedFetch({ status: 404, body: '{}' });
    const result = await apiFetchOrNull({ ...config, fetch: fetchImpl }, '/api/profile/missing');
    expect(result).toBeNull();
  });

  it('apiFetchOrNull rethrows non-404 errors', async () => {
    const fetchImpl = fixedFetch({ status: 500, body: '{}' });
    await expect(apiFetchOrNull({ ...config, fetch: fetchImpl }, '/api/x')).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it('retries on 429 when retryOn429 is true', async () => {
    let count = 0;
    const fetchImpl = vi.fn(() => {
      count++;
      if (count < 2) {
        return Promise.resolve(
          new Response('{}', { status: 429, headers: { 'retry-after': '1' } }),
        );
      }
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    }) as unknown as typeof fetch;

    const promise = apiFetch({ ...config, fetch: fetchImpl }, '/api/x', { retryOn429: true });
    await vi.advanceTimersByTimeAsync(1100);
    await expect(promise).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('does NOT retry on 429 when retryOn429 is false (default)', async () => {
    const fetchImpl = fixedFetch({ status: 429, body: '{}' });
    await expect(apiFetch({ ...config, fetch: fetchImpl }, '/api/x')).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('passes through Next.js cache hints in the request init', async () => {
    const fetchImpl = fixedFetch({ status: 200, body: '{}' });
    await apiFetch({ ...config, fetch: fetchImpl }, '/api/x', {
      next: { revalidate: 60, tags: ['profile-alice'] },
    });
    const [, init] = getCall(fetchImpl);
    expect((init as { next?: { revalidate?: number; tags?: string[] } }).next).toEqual({
      revalidate: 60,
      tags: ['profile-alice'],
    });
  });
});

describe('encodeIdentifier', () => {
  it('encodes a decoded DID exactly once', () => {
    expect(encodeIdentifier('did:plc:abc123')).toBe('did%3Aplc%3Aabc123');
  });

  it('does NOT double-encode an already-encoded DID (idempotent)', () => {
    // Next.js hands route params percent-encoded on a hard navigation.
    expect(encodeIdentifier('did%3Aplc%3Aabc123')).toBe('did%3Aplc%3Aabc123');
  });

  it('is a no-op for a plain handle', () => {
    expect(encodeIdentifier('alice.example.com')).toBe('alice.example.com');
  });

  it('encodes reserved characters in a handle once', () => {
    expect(encodeIdentifier('weird name/slash')).toBe('weird%20name%2Fslash');
  });

  it('falls back to the raw value on malformed percent-encoding', () => {
    // Lone `%` makes decodeURIComponent throw; behaviour matches a bare
    // encodeURIComponent so nothing regresses for odd inputs.
    expect(encodeIdentifier('50%off')).toBe('50%25off');
  });
});
