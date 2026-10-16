import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import {
  clearCompletenessDismissals,
  dismissCompletenessSignal,
  fetchProfileCompleteness,
} from './profile-completeness.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

function getCall(fetchImpl: typeof fetch, index = 0): [string, RequestInit] {
  return (fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[index]!;
}

describe('fetchProfileCompleteness', () => {
  it('returns the completeness from /api/profile/completeness', async () => {
    const body = { complete: false, score: 4, total: 6, missing: ['about', 'certification'] };
    const fetchImpl = jsonFetch(body);
    const result = await fetchProfileCompleteness({ ...baseConfig, fetch: fetchImpl });
    expect(result).toEqual(body);
    expect(getCall(fetchImpl)[0]).toContain('/api/profile/completeness');
  });

  it('passes through the dismissed signals, dropping unknown ones', async () => {
    const fetchImpl = jsonFetch({
      complete: false,
      score: 4,
      total: 6,
      missing: ['about', 'skill'],
      dismissed: ['skill', 'bogus'],
    });
    const result = await fetchProfileCompleteness({ ...baseConfig, fetch: fetchImpl });
    expect(result.dismissed).toEqual(['skill']);
  });

  it('leaves dismissed out when the AppView does not send it', async () => {
    const fetchImpl = jsonFetch({ complete: false, score: 5, total: 6, missing: ['about'] });
    const result = await fetchProfileCompleteness({ ...baseConfig, fetch: fetchImpl });
    expect(result).not.toHaveProperty('dismissed');
  });

  it('degrades to complete (no missing) when the request fails', async () => {
    const fetchImpl = jsonFetch({ error: 'unauth' }, 401);
    const result = await fetchProfileCompleteness({ ...baseConfig, fetch: fetchImpl });
    expect(result.complete).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('forwards the cookie header for RSC server-side calls', async () => {
    const fetchImpl = jsonFetch({ complete: true, score: 6, total: 6, missing: [] });
    await fetchProfileCompleteness(
      { ...baseConfig, fetch: fetchImpl },
      { cookieHeader: 'session=abc' },
    );
    const init = getCall(fetchImpl)[1];
    expect((init.headers as Record<string, string>).cookie).toBe('session=abc');
  });
});

describe('dismissCompletenessSignal', () => {
  it('POSTs the signal to the dismiss endpoint and reports success', async () => {
    const fetchImpl = jsonFetch({ success: true });
    const result = await dismissCompletenessSignal(
      { ...baseConfig, fetch: fetchImpl },
      { signal: 'headline' },
    );
    const [url, init] = getCall(fetchImpl);
    expect(url).toContain('/api/profile/completeness/dismiss');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ signal: 'headline' });
    expect(result.success).toBe(true);
  });
});

describe('clearCompletenessDismissals', () => {
  it('POSTs to the clear endpoint and reports success', async () => {
    const fetchImpl = jsonFetch({ success: true });
    const result = await clearCompletenessDismissals({ ...baseConfig, fetch: fetchImpl });
    const [url, init] = getCall(fetchImpl);
    expect(url).toContain('/api/profile/completeness/dismissals/clear');
    expect(init.method).toBe('POST');
    expect(result.success).toBe(true);
  });
});
