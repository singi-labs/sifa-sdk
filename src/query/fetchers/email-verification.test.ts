import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import {
  fetchEmailVerificationLinks,
  linkEmailToPosition,
  requestEmailReverification,
  unlinkEmailFromPosition,
} from './email-verification.js';

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

function jsonFetch(body: unknown, status = 200) {
  return vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(new Response(status === 204 ? null : JSON.stringify(body), { status })),
  );
}

function getCall(fetchImpl: ReturnType<typeof jsonFetch>, index = 0) {
  const call = fetchImpl.mock.calls[index];
  if (!call) throw new Error(`fetch was not called ${index + 1} time(s)`);
  const [input, init] = call;
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  return { url, init: init ?? {} };
}

describe('email verification fetchers', () => {
  it('reads my links and degrades to empty on failure', async () => {
    const link = {
      positionRkey: 'job',
      emailId: 3,
      email: 'me@acme.example',
      emailDomain: 'acme.example',
      badge: true,
      badgeRefused: null,
      lastVerifiedAt: '2026-10-17T00:00:00.000Z',
      nextReverifyAt: null,
      reverifyDeadlineAt: null,
    };
    const ok = await fetchEmailVerificationLinks({
      ...baseConfig,
      fetch: jsonFetch({ links: [link] }),
    });
    expect(ok.links[0]?.badge).toBe(true);
    expect(await fetchEmailVerificationLinks({ ...baseConfig, fetch: jsonFetch({}, 500) })).toEqual(
      { links: [] },
    );
  });

  it('links an address and reports the badge outcome or the refusal', async () => {
    const ok = jsonFetch({ ok: true, badge: false, badgeRefused: 'unrecognized_domain' });
    const result = await linkEmailToPosition(
      { ...baseConfig, fetch: ok },
      { positionRkey: 'job', emailId: 3 },
    );
    expect(result).toMatchObject({
      success: true,
      badge: false,
      badgeRefused: 'unrecognized_domain',
    });
    expect(getCall(ok).url).toContain('/api/verification/email/link');
    const refused = await linkEmailToPosition(
      {
        ...baseConfig,
        fetch: jsonFetch({ error: 'free-mail', message: 'Use your work address' }, 400),
      },
      { positionRkey: 'job', emailId: 4 },
    );
    expect(refused.success).toBe(false);
    if (!refused.success) expect(refused.status).toBe(400);
  });

  it('unlinks and asks for a re-verification link, by position', async () => {
    const del = jsonFetch(null, 204);
    expect((await unlinkEmailFromPosition({ ...baseConfig, fetch: del }, 'job')).success).toBe(
      true,
    );
    expect(getCall(del).url).toContain('/api/verification/email/link/job');
    const rv = jsonFetch({ sendStatus: 'sends_paused' });
    const r = await requestEmailReverification({ ...baseConfig, fetch: rv }, 'job');
    if (r.success) expect(r.sendStatus).toBe('sends_paused');
  });
});
