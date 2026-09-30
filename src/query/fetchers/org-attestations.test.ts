import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import {
  createOrgAttestation,
  fetchAttestationRequests,
  fetchOrgAttestations,
  offboardOrgAttestation,
  rejectAttestationRequest,
  requestEmploymentConfirmation,
  revokeOrgAttestation,
} from './org-attestations.js';

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

describe('org attestation fetchers', () => {
  it('createOrgAttestation posts the confirmation and returns the record location', async () => {
    const fetchImpl = jsonFetch(
      {
        uri: 'at://did:plc:org/id.sifa.org.employmentAttestation/3abc',
        rkey: '3abc',
        renderState: 'rendered',
        matchedRkeys: ['p1'],
        existing: false,
      },
      201,
    );
    const result = await createOrgAttestation(
      { ...baseConfig, fetch: fetchImpl },
      { subjectDid: 'did:plc:s', status: 'current', startedAt: '2020-01' },
    );
    expect(result.success).toBe(true);
    if (result.success) expect(result.matchedRkeys).toEqual(['p1']);
    const { url, init } = getCall(fetchImpl);
    expect(url).toContain('/api/org/attestations');
    expect(init.method).toBe('POST');
  });

  it('surfaces the required scope on a 403 so the caller can re-auth', async () => {
    const fetchImpl = jsonFetch(
      {
        error: 'ScopeInsufficient',
        message: 'more scope',
        requiredScope: 'repo:id.sifa.org.employmentAttestation',
      },
      403,
    );
    const result = await createOrgAttestation(
      { ...baseConfig, fetch: fetchImpl },
      { subjectDid: 'did:plc:s', status: 'current' },
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.status).toBe(403);
  });

  it('offboard patches, revoke deletes, reject posts', async () => {
    const patch = jsonFetch({ rkey: '3abc' });
    await offboardOrgAttestation({ ...baseConfig, fetch: patch }, '3abc', { endedAt: '2026-09' });
    expect(getCall(patch).url).toContain('/api/org/attestations/3abc');
    expect(getCall(patch).init.method).toBe('PATCH');

    const del = jsonFetch(null, 204);
    expect((await revokeOrgAttestation({ ...baseConfig, fetch: del }, '3abc')).success).toBe(true);
    expect(getCall(del).init.method).toBe('DELETE');

    const rej = jsonFetch(null, 204);
    expect((await rejectAttestationRequest({ ...baseConfig, fetch: rej }, 7)).success).toBe(true);
    expect(getCall(rej).url).toContain('/api/org/attestations/requests/7/reject');
  });

  it('list fetchers pass entries through and degrade to empty on failure', async () => {
    const ok = jsonFetch({
      attestations: [
        {
          rkey: 'a',
          subjectDid: 'did:plc:s',
          status: 'current',
          renderState: 'rendered',
          matchedRkeys: [],
          createdAt: '2026-09-30T00:00:00.000Z',
          uri: 'at://x',
        },
      ],
    });
    expect((await fetchOrgAttestations({ ...baseConfig, fetch: ok })).attestations).toHaveLength(1);
    const reqs = jsonFetch({
      requests: [
        {
          id: 1,
          subjectDid: 'did:plc:s',
          positionRkey: 'p1',
          status: 'pending',
          createdAt: '2026-09-30T00:00:00.000Z',
        },
      ],
    });
    expect((await fetchAttestationRequests({ ...baseConfig, fetch: reqs })).requests[0]?.id).toBe(
      1,
    );
    const bad = jsonFetch({ error: 'x' }, 500);
    expect(await fetchOrgAttestations({ ...baseConfig, fetch: bad })).toEqual({ attestations: [] });
    expect(await fetchAttestationRequests({ ...baseConfig, fetch: bad })).toEqual({ requests: [] });
  });

  it('requestEmploymentConfirmation posts the position and reports whether it was new', async () => {
    const fetchImpl = jsonFetch({ orgDid: 'did:plc:org', id: 3, created: true }, 201);
    const result = await requestEmploymentConfirmation(
      { ...baseConfig, fetch: fetchImpl },
      { positionRkey: 'p1', note: 'Hi' },
    );
    expect(result.success).toBe(true);
    if (result.success) expect(result.created).toBe(true);
    expect(getCall(fetchImpl).url).toContain('/api/verification/org/request');
  });
});
