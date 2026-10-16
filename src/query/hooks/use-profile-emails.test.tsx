// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { SifaProvider } from '../config.js';
import { sifaQueryKeys } from '../keys.js';
import { useAddProfileEmail, useProfileEmails } from './use-profile-emails.js';

function jsonFetch(body: unknown, status = 200) {
  return vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(new Response(JSON.stringify(body), { status })),
  );
}

function makeWrapper(fetchImpl: ReturnType<typeof jsonFetch>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const config: SifaApiConfig = { baseUrl: 'https://api.example', fetch: fetchImpl };
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SifaProvider config={config}>{children}</SifaProvider>
    </QueryClientProvider>
  );
  return { Wrapper, queryClient };
}

describe('profile email hooks', () => {
  it('useProfileEmails reads under the profileEmails.list key', async () => {
    const { Wrapper, queryClient } = makeWrapper(jsonFetch({ emails: [], sending: true }));
    const { result } = renderHook(() => useProfileEmails(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.sending).toBe(true);
    expect(queryClient.getQueryState(sifaQueryKeys.profileEmails.list())).not.toBeUndefined();
  });

  it('useAddProfileEmail invalidates the list on success', async () => {
    const { Wrapper, queryClient } = makeWrapper(
      jsonFetch(
        {
          id: 1,
          email: 'a@b.example',
          emailDomain: 'b.example',
          status: 'pending',
          verifiedAt: null,
          verificationSentAt: null,
          createdAt: 'x',
          sendStatus: 'sends_paused',
        },
        201,
      ),
    );
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useAddProfileEmail(), { wrapper: Wrapper });
    await act(async () => {
      await result.current.mutateAsync('a@b.example');
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: sifaQueryKeys.profileEmails.all() });
  });
});
