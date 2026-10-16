import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import {
  addProfileEmail,
  fetchProfileEmails,
  removeProfileEmail,
  resendProfileEmailVerification,
} from './profile-emails.js';

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

const row = {
  id: 3,
  email: 'jane@acme.example',
  emailDomain: 'acme.example',
  status: 'pending',
  verifiedAt: null,
  verificationSentAt: null,
  createdAt: '2026-10-17T00:00:00.000Z',
};

describe('profile email fetchers', () => {
  it('lists the addresses and whether sending is on', async () => {
    const fetchImpl = jsonFetch({ emails: [row], sending: false });
    const result = await fetchProfileEmails({ ...baseConfig, fetch: fetchImpl });
    expect(result.emails[0]?.email).toBe('jane@acme.example');
    expect(result.sending).toBe(false);
    expect(getCall(fetchImpl).url).toContain('/api/profile-emails');
  });

  it('degrades to an empty list on failure or a malformed body', async () => {
    expect(await fetchProfileEmails({ ...baseConfig, fetch: jsonFetch({ x: 1 }, 500) })).toEqual({
      emails: [],
      sending: false,
    });
    expect(
      await fetchProfileEmails({ ...baseConfig, fetch: jsonFetch({ emails: 'nope' }) }),
    ).toEqual({ emails: [], sending: false });
  });

  it('adds an address and returns the send status', async () => {
    const fetchImpl = jsonFetch({ ...row, sendStatus: 'sends_paused' }, 201);
    const result = await addProfileEmail({ ...baseConfig, fetch: fetchImpl }, 'jane@acme.example');
    expect(result.success).toBe(true);
    if (result.success) expect(result.sendStatus).toBe('sends_paused');
    expect(getCall(fetchImpl).init.method).toBe('POST');
  });

  it('keeps the refusal status, for example the address limit', async () => {
    const fetchImpl = jsonFetch({ error: 'TooManyEmails', message: 'Remove one' }, 409);
    const result = await addProfileEmail({ ...baseConfig, fetch: fetchImpl }, 'x@acme.example');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.status).toBe(409);
  });

  it('resend posts and remove deletes, by id', async () => {
    const resend = jsonFetch({ sendStatus: 'verification_sent' });
    await resendProfileEmailVerification({ ...baseConfig, fetch: resend }, 3);
    expect(getCall(resend).url).toContain('/api/profile-emails/3/resend');
    const del = jsonFetch(null, 204);
    expect((await removeProfileEmail({ ...baseConfig, fetch: del }, 3)).success).toBe(true);
    expect(getCall(del).init.method).toBe('DELETE');
  });
});
